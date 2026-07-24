import { useMutation, useQuery } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import {
  type LoginPayload,
  type RegisterPayload,
  type VerifyOtpPayload,
  type LoginResponse,
  type RegisterResponse,
  type SendRegistrationOtpPayload,
  type ResendVerificationPayload,
  type ForgotPasswordPayload,
  type GoogleLoginPayload,
  type UserProfile,
  type UpdateProfilePayload,
  type ChangePasswordPayload,
  type TotpSetupResponse,
  type TotpVerifyPayload,
  type LoginTotpPayload,
  type ResetPasswordPayload,
  type LogoutPayload,
  type SwitchTenantPayload,
  type RequestEmailChangePayload,
  type RequestPhoneChangePayload,
  type ConfirmPhoneChangePayload,
  type AuthSession,
} from "../types/auth.type";

export const useLogin = () => {
  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: (payload) => authService.login(payload),
  });
};

export const useLoginTotp = () => {
  return useMutation<LoginResponse, Error, LoginTotpPayload>({
    mutationFn: (payload) => authService.loginTotp(payload),
  });
};

export const useRegister = () => {
  return useMutation<RegisterResponse, Error, RegisterPayload>({
    mutationFn: (payload) => authService.register(payload),
  });
};

export const useSendRegistrationOtp = () => {
  return useMutation<void, Error, SendRegistrationOtpPayload>({
    mutationFn: (payload) => authService.sendRegistrationOtp(payload),
  });
};

export const useResendVerification = () => {
  return useMutation<void, Error, ResendVerificationPayload>({
    mutationFn: (payload) => authService.resendVerification(payload),
  });
};

export const useVerifyOtp = () => {
  return useMutation<LoginResponse, Error, VerifyOtpPayload>({
    mutationFn: (payload) => authService.verifyOtp(payload),
  });
};

export const useForgotPassword = () => {
  return useMutation<void, Error, ForgotPasswordPayload>({
    mutationFn: (payload) => authService.forgotPassword(payload),
  });
};

export const useResetPassword = () => {
  return useMutation<void, Error, ResetPasswordPayload>({
    mutationFn: (payload) => authService.resetPassword(payload),
  });
};

export const useGoogleLogin = () => {
  return useMutation<LoginResponse, Error, GoogleLoginPayload>({
    mutationFn: (payload) => authService.loginWithGoogle(payload),
  });
};

export const useProfile = (enabled: boolean = true) => {
  return useQuery<UserProfile, Error>({
    queryKey: ["auth", "profile"],
    queryFn: () => authService.getProfile(),
    enabled,
    retry: 1,
  });
};

export const useUpdateProfile = () => {
  return useMutation<UserProfile, Error, UpdateProfilePayload>({
    mutationFn: (payload) => authService.updateProfile(payload),
  });
};

export const useChangePassword = () => {
  return useMutation<void, Error, ChangePasswordPayload>({
    mutationFn: (payload) => authService.changePassword(payload),
  });
};

export const useSetupTotp = () => {
  return useMutation<TotpSetupResponse, Error, void>({
    mutationFn: () => authService.setupTotp(),
  });
};

export const useVerifyTotp = () => {
  return useMutation<void, Error, TotpVerifyPayload>({
    mutationFn: (payload) => authService.verifyTotp(payload),
  });
};

export const useDisableTotp = () => {
  return useMutation<void, Error, void>({
    mutationFn: () => authService.disableTotp(),
  });
};


export const useLogoutAll = () => {
  return useMutation<void, Error, void>({
    mutationFn: () => authService.logoutAll(),
  });
};

export const useLogout = () => {
  return useMutation<void, Error, LogoutPayload>({
    mutationFn: (payload) => authService.logout(payload),
  });
};

/** Issue #3 (docs/issues/ISSUES.md): switch active company for a multi-tenant user. */
export const useSwitchTenant = () => {
  return useMutation<LoginResponse, Error, SwitchTenantPayload>({
    mutationFn: (payload) => authService.switchTenant(payload),
  });
};

/** Issue #4 (docs/issues/ISSUES.md): upload a real avatar image file. */
export const useUploadAvatar = () => {
  return useMutation<UserProfile, Error, File>({
    mutationFn: (file) => authService.uploadAvatar(file),
  });
};

export const useDeleteAvatar = () => useMutation<UserProfile, Error, void>({
  mutationFn: () => authService.deleteAvatar(),
});

export const useRequestEmailChange = () => useMutation<void, Error, RequestEmailChangePayload>({
  mutationFn: (payload) => authService.requestEmailChange(payload),
});

export const useRequestPhoneChange = () => useMutation<void, Error, RequestPhoneChangePayload>({
  mutationFn: (payload) => authService.requestPhoneChange(payload),
});

export const useConfirmPhoneChange = () => useMutation<UserProfile, Error, ConfirmPhoneChangePayload>({
  mutationFn: (payload) => authService.confirmPhoneChange(payload),
});

export const useLinkGoogle = () => useMutation<void, Error, string>({
  mutationFn: (idToken) => authService.linkGoogle(idToken),
});

export const useUnlinkGoogle = () => useMutation<void, Error, void>({
  mutationFn: () => authService.unlinkGoogle(),
});

export const useSessions = () => useQuery<AuthSession[], Error>({
  queryKey: ["auth", "sessions"],
  queryFn: () => authService.getSessions(),
});

export const useLogoutSession = () => useMutation<void, Error, string>({
  mutationFn: (sessionId) => authService.logoutSession(sessionId),
});

export const useLogoutOthers = () => useMutation<void, Error, void>({
  mutationFn: () => authService.logoutOthers(),
});
