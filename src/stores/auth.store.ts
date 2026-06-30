import { create } from "zustand";
import { type AuthUser } from "@/features/auth/types/auth.type";
import { authTokenService } from "@/services/auth-token.service";
import { authService } from "@/features/auth/services/auth.service";
import { authMapper } from "@/features/auth/utils/auth.mapper";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isVerifying: boolean;
  isTotpPending: boolean;
  pendingToken: string | null;
  setTotpPending: (token: string) => void;
  clearTotpPending: () => void;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  updateUser: (user: AuthUser) => void;
  setVerifying: (isVerifying: boolean) => void;
  logout: () => void;
  initialize: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitialized: false,
  isVerifying: false,
  isTotpPending: false,
  pendingToken: null,

  setTotpPending: (token) => {
    set({ isTotpPending: true, pendingToken: token });
  },

  clearTotpPending: () => {
    set({ isTotpPending: false, pendingToken: null });
  },

  setAuth: (user, accessToken, refreshToken) => {
    authTokenService.setAccessToken(accessToken);
    authTokenService.setRefreshToken(refreshToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("fams_user", JSON.stringify(user));
    }
    set({ user, accessToken, isAuthenticated: true });
  },

  updateUser: (user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fams_user", JSON.stringify(user));
    }
    set({ user });
  },

  setVerifying: (isVerifying) => {
    set({ isVerifying });
  },

  logout: () => {
    authTokenService.clearTokens();
    if (typeof window !== "undefined") {
      localStorage.removeItem("fams_user");
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isVerifying: false,
      isTotpPending: false,
      pendingToken: null,
    });
  },

  initialize: () => {
    if (typeof window === "undefined") return;
    
    const token = authTokenService.getAccessToken();
    const storedUser = localStorage.getItem("fams_user");
    
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        set({ 
          user, 
          accessToken: token, 
          isAuthenticated: true, 
          isInitialized: true 
        });
      } catch (error) {
        console.error("Lỗi parse thông tin user từ localStorage:", error);
        authTokenService.clearTokens();
        localStorage.removeItem("fams_user");
        set({ 
          user: null, 
          accessToken: null, 
          isAuthenticated: false, 
          isInitialized: true 
        });
      }
    } else {
      set({ isInitialized: true });
    }
  },

  hasPermission: (permission: string) => {
    const state = get();
    if (!state.user) return false;
    
    const role = state.user.role;
    
    // Platform Admin has all permissions implicitly
    if (role === "PLATFORM_ADMIN") return true;

    // [TEMPORARY FIX] The backend does not yet return the permissions array in /api/v1/auth/me or /api/v1/user-roles/me.
    // We mock the System Role permissions here based on V13__seed_roles_and_permissions.sql so the UI works.
    if (role === "TENANT_ADMIN") {
      // TENANT_ADMIN has everything except platform-level (tenants, plans)
      if (permission.startsWith("tenants:") || permission.startsWith("plans:")) return false;
      return true;
    }
    
    if (role === "HR_MANAGER") {
      const allowed = ["employees:create", "employees:read", "employees:update", "employees:list",
                       "attendance:read", "attendance:list", "attendance:export",
                       "violations:create", "violations:read", "violations:update", "violations:list",
                       "reports:read", "reports:list", "reports:export",
                       "shifts:read", "shifts:list", "assignments:create", "assignments:read", 
                       "assignments:update", "assignments:list", "notifications:read", "notifications:list",
                       "audit:read", "audit:list", "workspaces:read", "workspaces:list",
                       "workspace_members:create", "workspace_members:read", "workspace_members:update", 
                       "workspace_members:delete", "workspace_members:list"];
      return allowed.includes(permission);
    }

    if (role === "SITE_SUPERVISOR") {
      const allowed = ["employees:read", "employees:list", "attendance:read", "attendance:list",
                       "randomchecks:create", "randomchecks:read", "randomchecks:list",
                       "violations:create", "violations:read", "violations:update", "violations:list",
                       "shifts:read", "shifts:list", "assignments:read", "assignments:list",
                       "notifications:read", "notifications:list", "sites:read", "sites:list", "checkins:list"];
      return allowed.includes(permission);
    }

    if (role === "EMPLOYEE") {
      const allowed = ["checkins:create", "checkins:read", "checkins:list", "attendance:read", "attendance:list",
                       "shifts:read", "shifts:list", "assignments:read", "assignments:list",
                       "notifications:read", "notifications:list", "employees:read"];
      return allowed.includes(permission);
    }

    // Fallback to actual permissions array if it's a custom role (once Backend supports it)
    return state.user.permissions?.includes(permission) ?? false;
  },
}));


