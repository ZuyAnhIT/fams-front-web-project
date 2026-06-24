import { useMutation, useQuery } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import {
  type LoginPayload,
  type RegisterPayload,
  type SendOtpPayload,
  type VerifyOtpPayload,
  type LoginResponse,
  type RegisterResponse,
  type ForgotPasswordPayload,
  type GoogleLoginPayload,
  type UserProfile,
  type UpdateProfilePayload,
  type ChangePasswordPayload,
  type TotpSetupResponse,
  type TotpVerifyPayload,
  type LoginTotpPayload,
  type ResetPasswordPayload
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

export const useSendOtp = () => {
  return useMutation<void, Error, SendOtpPayload>({
    mutationFn: (payload) => authService.sendOtp(payload),
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

