import { NextResponse } from 'next/server';
import {
  getCurrentUser,
  setCurrentUser,
  switchPersona,
  getEnvironment,
  setEmergencyLockdown,
  authenticateUser,
  getUserById,
  recordAuditLog,
  getSystemUsers,
  createSystemUser,
  updateUserStatus,
  updateUserRole,
  resetUserPassword,
  deleteSystemUser
} from '@/lib/db';
import { hasPermission, normalizeRole, type RoleName } from '@/lib/rbac-abac';
import { signJWT, extractUserClaims } from '@/lib/auth-crypto';
import {
  checkKeycloakHealth,
  loginKeycloakDirect,
  logoutKeycloakSession,
  createKeycloakUser,
  deleteKeycloakUser,
  PERSONA_KEYCLOAK_CREDENTIALS
} from '@/lib/keycloak';

export async function GET(req: Request) {
  const claims = await extractUserClaims(req);
  let activeUser = claims ? getUserById(claims.id) : null;

  if (!activeUser && claims) {
    activeUser = claims as any;
  }

  const idp = claims?.idp || (claims?.iss?.includes('keycloak') ? 'KEYCLOAK' : (claims ? 'LOCAL_CRYPTO' : null));
  if (activeUser) {
    (activeUser as any).idp = idp;
  }

  const keycloakHealth = await checkKeycloakHealth();

  return NextResponse.json({
    authenticated: !!activeUser,
    user: activeUser || null,
    idp,
    environment: getEnvironment(),
    // Dynamic: created/deleted accounts are reflected here, not just the
    // compiled-in seed personas. Survives restart via the durable store.
    personas: getSystemUsers(),
    keycloak: {
      ...keycloakHealth,
      realm: 'sih-lea',
      clientId: 'cryptotrace-frontend',
      adminSessionsUrl: 'http://localhost:8080/admin/master/console/#/sih-lea/sessions'
    }
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

      // Check Keycloak 24 IAM if container is running
      const kcHealth = await checkKeycloakHealth();
      if (kcHealth.online) {
        const kcResult = await loginKeycloakDirect(email, password);
        if (kcResult.success && kcResult.user && kcResult.token) {
          recordAuditLog({
            user_id: kcResult.user.id,
            user_name: kcResult.user.name,
            user_role: kcResult.user.role,
            action: 'KEYCLOAK_LOGIN_SUCCESS',
            resource_type: 'AUTH_SESSION',
            decision: 'GRANTED',
            reason: 'Successfully authenticated with Keycloak OIDC direct access grant.'
          });

          const response = NextResponse.json({
            success: true,
            user: kcResult.user,
            token: kcResult.token,
            idp: 'KEYCLOAK'
          });

          response.cookies.set('auth_token', kcResult.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: kcResult.expiresIn || 60 * 60 * 24
          });

          if (kcResult.refreshToken) {
            response.cookies.set('kc_refresh_token', kcResult.refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: 60 * 60 * 24
            });
          }

          return response;
        }
      }

      // Local Cryptographic Engine Fallback (Native PBKDF2 + HMAC-SHA256)
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
        token,
        idp: 'LOCAL_CRYPTO'
      });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24
      });

      return response;
    }

    // ── 2. User Logout ───────────────────────────────────────────────────
    if (action === 'logout') {
      const claims = await extractUserClaims(req);
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

      // Terminate Keycloak session if refresh token cookie is present
      const cookieHeader = req.headers.get('cookie') || '';
      const refreshMatch = cookieHeader.match(/kc_refresh_token=([^;]+)/);
      if (refreshMatch) {
        await logoutKeycloakSession(decodeURIComponent(refreshMatch[1]));
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

      response.cookies.set('kc_refresh_token', '', {
        httpOnly: true,
        path: '/',
        maxAge: 0
      });

      return response;
    }

    // ── 3. Quick Persona Switcher (For Evaluation & Demo Tests) ─────────
    if (action === 'switch_persona') {
      const targetIdentifier = body.roleOrUid || 'senior-sharma';
      const user = switchPersona(targetIdentifier);

      // When Keycloak is active, issue real Keycloak RS256 token and register Keycloak session
      const kcHealth = await checkKeycloakHealth();
      if (kcHealth.online) {
        const creds =
          PERSONA_KEYCLOAK_CREDENTIALS[targetIdentifier] ||
          (user ? PERSONA_KEYCLOAK_CREDENTIALS[user.email] || PERSONA_KEYCLOAK_CREDENTIALS[user.role] : null);

        if (creds) {
          const kcResult = await loginKeycloakDirect(creds.email, creds.pass);
          if (kcResult.success && kcResult.user && kcResult.token) {
            recordAuditLog({
              user_id: kcResult.user.id,
              user_name: kcResult.user.name,
              user_role: kcResult.user.role,
              action: 'KEYCLOAK_ROLE_SWITCH',
              resource_type: 'AUTH_SESSION',
              decision: 'GRANTED',
              reason: `Switched identity to ${kcResult.user.name} (${kcResult.user.role}) via Keycloak OIDC session.`
            });

            const response = NextResponse.json({
              success: true,
              user: kcResult.user,
              token: kcResult.token,
              idp: 'KEYCLOAK'
            });

            response.cookies.set('auth_token', kcResult.token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: kcResult.expiresIn || 60 * 60 * 24
            });

            if (kcResult.refreshToken) {
              response.cookies.set('kc_refresh_token', kcResult.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24
              });
            }

            return response;
          }
        }
      }

      // Local Cryptographic Engine Fallback (Native PBKDF2 + HMAC-SHA256)
      const token = signJWT(user);

      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'EVALUATION_ROLE_SWITCH',
        resource_type: 'AUTH_SESSION',
        decision: 'GRANTED',
        reason: `Switched identity to ${user.name} (${user.role}) via local fallback.`
      });

      const response = NextResponse.json({ success: true, user, token, idp: 'LOCAL_CRYPTO' });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24
      });

      return response;
    }

    // ── 4. Emergency Lockdown Toggle (System Admin Only) ────────────────
    if (action === 'toggle_lockdown') {
      const claims = await extractUserClaims(req);
      if (!claims) {
        return NextResponse.json(
          { error: 'Unauthorized: Authentication required to trigger emergency lockdown.' },
          { status: 401 }
        );
      }
      const user = getUserById(claims.id) || (claims as any);
      const normRole = normalizeRole(user?.role);

      if (normRole !== 'SYSTEM_ADMIN' && user?.role !== 'SUPER_ADMIN') {
        recordAuditLog({
          user_id: user?.id || 0,
          user_name: user?.name || 'Anonymous',
          user_role: user?.role || 'UNKNOWN',
          action: 'EMERGENCY_LOCKDOWN_TRIGGER',
          resource_type: 'SYSTEM_ENVIRONMENT',
          decision: 'DENIED',
          reason: 'Only System Administrator can trigger platform emergency lockdown.'
        });

        return NextResponse.json(
          { error: 'Unauthorized: Only System Administrator can trigger emergency lockdown.' },
          { status: 403 }
        );
      }

      const nextActive = typeof body.active === 'boolean' ? body.active : !getEnvironment().emergency_lockdown;
      setEmergencyLockdown(nextActive);

      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'EMERGENCY_LOCKDOWN_TOGGLE',
        resource_type: 'SYSTEM_ENVIRONMENT',
        decision: 'GRANTED',
        reason: `National Emergency Lockdown turned ${nextActive ? 'ON' : 'OFF'} by Administrator.`
      });

      return NextResponse.json({
        success: true,
        environment: getEnvironment()
      });
    }

    // ── 5. System Administrator: User Management ────────────────────────
    if (['create_user', 'delete_user', 'toggle_user_status', 'assign_role', 'reset_password', 'get_users', 'system_health'].includes(action)) {
      const claims = await extractUserClaims(req);
      if (!claims) {
        return NextResponse.json(
          { error: 'Unauthorized: Administrative authentication required.' },
          { status: 401 }
        );
      }
      const user = getUserById(claims.id) || (claims as any);
      const normRole = normalizeRole(user?.role);

      if (normRole !== 'SYSTEM_ADMIN' && user?.role !== 'SUPER_ADMIN') {
        recordAuditLog({
          user_id: user?.id || 0,
          user_name: user?.name || 'Anonymous',
          user_role: user?.role || 'UNKNOWN',
          action: `ADMIN_${action.toUpperCase()}`,
          resource_type: 'SYSTEM_USER_MANAGEMENT',
          decision: 'DENIED',
          reason: 'Privileged user management requires SYSTEM_ADMIN authorization.'
        });

        return NextResponse.json(
          { error: 'Forbidden: Only System Administrator can manage users and configuration.' },
          { status: 403 }
        );
      }

      if (action === 'get_users') {
        return NextResponse.json({ success: true, users: getSystemUsers() });
      }

      if (action === 'create_user') {
        const { name, email, role, password, workspace_id, jurisdiction_code, clearance_level, is_gazetted } = body;
        if (!name || !email || !role) {
          return NextResponse.json({ error: 'Name, email, and role are required.' }, { status: 400 });
        }
        // Durable local store is the source of truth — this always succeeds.
        const created = createSystemUser({
          name,
          email,
          role,
          password,
          workspace_id,
          jurisdiction_code,
          clearance_level,
          is_gazetted
        });

        // Mirror to Keycloak when the IAM is online; never fatal if it isn't.
        const kcSync = await createKeycloakUser({
          name: created.name,
          email: created.email,
          role: created.role as RoleName,
          password: password || 'Secure@123',
          jurisdiction_code: created.jurisdiction_code,
          clearance_level: created.clearance_level,
          is_gazetted: created.is_gazetted,
          vasp_id: created.vasp_id
        });

        recordAuditLog({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          action: 'ADMIN_CREATE_USER',
          resource_type: 'SYSTEM_USER',
          resource_id: created.id,
          decision: 'GRANTED',
          reason: `Created user ${created.name} (${created.email}) with role ${created.role}. Keycloak: ${kcSync.reason}`
        });

        return NextResponse.json({ success: true, user: created, keycloak: kcSync });
      }

      if (action === 'delete_user') {
        const { user_id } = body;
        if (user_id === undefined || user_id === null || user_id === '') {
          return NextResponse.json({ error: 'user_id is required.' }, { status: 400 });
        }

        // The API layer guards the one invariant db.ts cannot see: you may not
        // delete the account you are signed in as. (db.ts guards the last-admin
        // invariant.)
        if (String(user_id) === String(user.id)) {
          recordAuditLog({
            user_id: user.id,
            user_name: user.name,
            user_role: user.role,
            action: 'ADMIN_DELETE_USER',
            resource_type: 'SYSTEM_USER',
            resource_id: user_id,
            decision: 'DENIED',
            reason: 'An administrator cannot delete their own active account.'
          });
          return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
        }

        const result = deleteSystemUser(user_id);
        if (!result.success) {
          recordAuditLog({
            user_id: user.id,
            user_name: user.name,
            user_role: user.role,
            action: 'ADMIN_DELETE_USER',
            resource_type: 'SYSTEM_USER',
            resource_id: user_id,
            decision: 'DENIED',
            reason: result.error || 'Deletion refused.'
          });
          return NextResponse.json({ error: result.error || 'Unable to delete user.' }, { status: 409 });
        }

        // Mirror the delete to Keycloak when online; never fatal.
        const kcSync = result.user?.email
          ? await deleteKeycloakUser(result.user.email)
          : { synced: false, reason: 'No email on record to mirror.' };

        recordAuditLog({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          action: 'ADMIN_DELETE_USER',
          resource_type: 'SYSTEM_USER',
          resource_id: user_id,
          decision: 'GRANTED',
          reason: `Deleted ${result.user?.name} (${result.user?.email}). Keycloak: ${kcSync.reason}`
        });

        return NextResponse.json({ success: true, user_id, keycloak: kcSync });
      }

      if (action === 'toggle_user_status') {
        const { user_id, is_active } = body;
        const ok = updateUserStatus(user_id, is_active);
        if (!ok) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

        recordAuditLog({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          action: 'ADMIN_TOGGLE_USER_STATUS',
          resource_type: 'SYSTEM_USER',
          resource_id: user_id,
          decision: 'GRANTED',
          reason: `Changed user ${user_id} active status to ${is_active}.`
        });

        return NextResponse.json({ success: true, user_id, is_active });
      }

      if (action === 'assign_role') {
        const { user_id, new_role } = body;
        const ok = updateUserRole(user_id, new_role as RoleName);
        if (!ok) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

        recordAuditLog({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          action: 'ADMIN_ASSIGN_ROLE',
          resource_type: 'SYSTEM_USER',
          resource_id: user_id,
          decision: 'GRANTED',
          reason: `Assigned role ${new_role} to user ${user_id}.`
        });

        return NextResponse.json({ success: true, user_id, new_role });
      }

      if (action === 'reset_password') {
        const { user_id, new_password } = body;
        const ok = resetUserPassword(user_id, new_password);
        if (!ok) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

        recordAuditLog({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          action: 'ADMIN_RESET_PASSWORD',
          resource_type: 'SYSTEM_USER',
          resource_id: user_id,
          decision: 'GRANTED',
          reason: `Reset password for user ${user_id}.`
        });

        return NextResponse.json({ success: true, user_id, message: 'Password reset successfully.' });
      }

      if (action === 'system_health') {
        const kcHealth = await checkKeycloakHealth();
        return NextResponse.json({
          success: true,
          health: {
            status: 'HEALTHY',
            uptimeSeconds: Math.floor(process.uptime()),
            memoryUsage: process.memoryUsage(),
            environment: getEnvironment(),
            activeUsers: getSystemUsers().length,
            nodeVersion: process.version,
            keycloak: kcHealth
          }
        });
      }
    }

    return NextResponse.json({ error: 'Unrecognized action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Authentication error' }, { status: 500 });
  }
}
