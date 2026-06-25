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
}

export const useAuthStore = create<AuthState>((set) => ({
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
}));


