import { NextResponse } from 'next/server';
import {
  getCurrentUser,
  setCurrentUser,
  switchPersona,
  getEnvironment,
  setEmergencyLockdown,
  authenticateUser,
  getUserById,
  recordAuditLog
} from '@/lib/db';
import { SYSTEM_PERSONAS, hasPermission } from '@/lib/rbac-abac';
import { signJWT, extractUserClaims } from '@/lib/auth-crypto';

export async function GET(req: Request) {
  const claims = extractUserClaims(req);
  let activeUser = claims ? getUserById(claims.id) : null;

  if (!activeUser && claims) {
    activeUser = claims as any;
  }

  return NextResponse.json({
    authenticated: !!activeUser,
    user: activeUser || null,
    environment: getEnvironment(),
    personas: SYSTEM_PERSONAS
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'login';

    // ── 1. Real Credentials Login (Email + Password) ──────────────────────
    if (action === 'login') {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required.' },
          { status: 400 }
        );
      }

      const authResult = authenticateUser(email, password);
      if (!authResult.success || !authResult.user) {
        recordAuditLog({
          user_id: 0,
          user_name: email,
          user_role: 'UNAUTHENTICATED',
          action: 'LOGIN_ATTEMPT',
          resource_type: 'AUTH_SESSION',
          decision: 'DENIED',
          reason: authResult.error || 'Invalid credentials'
        });

        return NextResponse.json(
          { error: authResult.error || 'Invalid email or password.' },
          { status: 401 }
        );
      }

      const user = authResult.user;
      const token = signJWT(user);

      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'LOGIN_SUCCESS',
        resource_type: 'AUTH_SESSION',
        decision: 'GRANTED',
        reason: 'Successfully authenticated with verified credentials.'
      });

      const response = NextResponse.json({
        success: true,
        user,
        token
      });

      // Set secure HTTP-only session cookie
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      });

      return response;
    }

    // ── 2. User Logout ───────────────────────────────────────────────────
    if (action === 'logout') {
      const claims = extractUserClaims(req);
      if (claims) {
        recordAuditLog({
          user_id: claims.id,
          user_name: claims.name,
          user_role: claims.role,
          action: 'LOGOUT',
          resource_type: 'AUTH_SESSION',
          decision: 'GRANTED',
          reason: 'User explicitly logged out.'
        });
      }

      const response = NextResponse.json({
        success: true,
        message: 'Logged out successfully.'
      });

      response.cookies.set('auth_token', '', {
        httpOnly: true,
        path: '/',
        maxAge: 0
      });

      return response;
    }

    // ── 3. Emergency Lockdown Toggle (Super Admin Only) ─────────────────
    if (action === 'toggle_lockdown') {
      const claims = extractUserClaims(req);
      const user = claims ? getUserById(claims.id) : getCurrentUser();

      if (!user || user.role !== 'SUPER_ADMIN') {
        recordAuditLog({
          user_id: user?.id || 0,
          user_name: user?.name || 'Anonymous',
          user_role: user?.role || 'UNKNOWN',
          action: 'EMERGENCY_LOCKDOWN_TRIGGER',
          resource_type: 'SYSTEM_ENVIRONMENT',
          decision: 'DENIED',
          reason: 'Only I4C Super Admin can trigger platform emergency lockdown.'
        });

        return NextResponse.json(
          { error: 'Unauthorized: Only I4C Central Super Admin can trigger emergency lockdown.' },
          { status: 403 }
        );
      }

      const env = setEmergencyLockdown(Boolean(body.active));

      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'EMERGENCY_LOCKDOWN_TRIGGER',
        resource_type: 'SYSTEM_ENVIRONMENT',
        decision: 'GRANTED',
        reason: `Lockdown state set to: ${Boolean(body.active)}`
      });

      return NextResponse.json({ success: true, environment: env });
    }

    // ── 4. Quick Persona Switcher (For Evaluation & Demo Tests) ─────────
    if (action === 'switch_persona') {
      const user = switchPersona(body.roleOrUid);
      const token = signJWT(user);

      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'EVALUATION_ROLE_SWITCH',
        resource_type: 'AUTH_SESSION',
        decision: 'GRANTED',
        reason: `Switched identity to ${user.name} for evaluation.`
      });

      const response = NextResponse.json({ success: true, user, token });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24
      });

      return response;
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Authentication error' }, { status: 500 });
  }
}
