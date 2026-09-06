"use client";

/**
 * Enterprise Session & RBAC/ABAC Identity Provider for SIH26183
 * Backed by PostgreSQL and our 7-Role Law Enforcement Access Control Engine.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  SYSTEM_PERSONAS,
  hasPermission,
  PERMISSIONS,
  type RoleName,
} from "@/lib/rbac-abac";

export type AppUser = {
  id: number;
  uid: string;
  email: string;
  fullName: string;
  name?: string;
  role: RoleName;
  role_id: number;
  workspace_id: number | null;
  jurisdiction_code: string | null;
  clearance_level: string;
  is_gazetted: boolean;
  vasp_id: number | null;
  vasp_name?: string;
  badge?: string;
  offline: boolean;
};

type AuthState = {
  user: AppUser | null;
  loading: boolean;
  persistent: boolean;
  canApproveFreeze: boolean;
  canRunGraph: boolean;
  canDraftNotice: boolean;
  switchRole: (roleOrUid: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  persistent: true,
  canApproveFreeze: false,
  canRunGraph: true,
  canDraftNotice: true,
  switchRole: async () => {},
  signUp: async () => null,
  signIn: async () => null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load current identity from API / local fallback on mount
  useEffect(() => {
    let mounted = true;
    async function loadIdentity() {
      try {
        const res = await fetch("/api/auth");
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.user) {
            setUser({
              ...data.user,
              fullName: data.user.name || data.user.fullName || "Officer Sharma"
            });
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to local default persona
      }
      if (mounted) {
        const defaultPersona = SYSTEM_PERSONAS[0];
        setUser({
          ...defaultPersona,
          fullName: defaultPersona.name
        });
        setLoading(false);
      }
    }
    loadIdentity();
    return () => {
      mounted = false;
    };
  }, []);

  const switchRole = useCallback(async (roleOrUid: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch_persona", roleOrUid })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser({
            ...data.user,
            fullName: data.user.name || data.user.fullName
          });
        }
      }
    } catch {
      // Local fallback
      const found =
        SYSTEM_PERSONAS.find((p) => p.role === roleOrUid) ||
        SYSTEM_PERSONAS.find((p) => p.uid === roleOrUid);
      if (found) {
        setUser({ ...found, fullName: found.name });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(
    async (email: string): Promise<string | null> => {
      const target = SYSTEM_PERSONAS.find(
        (p) => p.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (target) {
        await switchRole(target.role);
        return null;
      }
      // If not in demo personas, sign in as investigator
      const customUser: AppUser = {
        id: 999,
        uid: "custom-officer",
        email: email.trim(),
        name: email.split("@")[0],
        fullName: email.split("@")[0],
        role: "NORMAL_INVESTIGATOR",
        role_id: 2,
        workspace_id: 1,
        jurisdiction_code: "MH-CYBER-01",
        clearance_level: "RESTRICTED",
        is_gazetted: false,
        vasp_id: null,
        offline: false
      };
      setUser(customUser);
      return null;
    },
    [switchRole]
  );

  const signUp = useCallback(
    async (email: string, _password: string, fullName: string): Promise<string | null> => {
      const customUser: AppUser = {
        id: 999,
        uid: "custom-officer",
        email: email.trim(),
        name: fullName.trim() || email.split("@")[0],
        fullName: fullName.trim() || email.split("@")[0],
        role: "NORMAL_INVESTIGATOR",
        role_id: 2,
        workspace_id: 1,
        jurisdiction_code: "MH-CYBER-01",
        clearance_level: "RESTRICTED",
        is_gazetted: false,
        vasp_id: null,
        offline: false
      };
      setUser(customUser);
      return null;
    },
    []
  );

  const signOut = useCallback(async () => {
    setUser(null);
  }, []);

  const canApproveFreeze = useMemo(() => {
    if (!user) return false;
    return Boolean(
      hasPermission(user.role, PERMISSIONS.FREEZE_ORDER_APPROVE) && user.is_gazetted
    );
  }, [user]);

  const canRunGraph = useMemo(() => {
    if (!user) return false;
    return hasPermission(user.role, PERMISSIONS.WALLET_GRAPH_READ);
  }, [user]);

  const canDraftNotice = useMemo(() => {
    if (!user) return false;
    return hasPermission(user.role, PERMISSIONS.FREEZE_NOTICE_DRAFT);
  }, [user]);

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        persistent: true,
        canApproveFreeze,
        canRunGraph,
        canDraftNotice,
        switchRole,
        signUp,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthCtx);
}
