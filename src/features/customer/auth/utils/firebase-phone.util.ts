/** Maps Firebase Auth error codes to Vietnamese messages for phone OTP flows. */
export function mapFirebasePhoneError(error: unknown): string {
  if (error instanceof Error && error.message === "FIREBASE_NOT_CONFIGURED") {
    return "Đăng nhập bằng số điện thoại hiện chưa khả dụng. Vui lòng đăng nhập bằng email hoặc thử lại sau.";
  }
  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case "auth/invalid-phone-number":
      return "Số điện thoại không hợp lệ.";
    case "auth/too-many-requests":
    case "auth/quota-exceeded":
      return "Bạn đã yêu cầu mã OTP quá nhiều lần. Vui lòng thử lại sau.";
    case "auth/invalid-verification-code":
      return "Mã OTP không chính xác.";
    case "auth/code-expired":
      return "Mã OTP đã hết hạn. Vui lòng gửi lại.";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng. Vui lòng kiểm tra lại.";
    case "auth/captcha-check-failed":
      return "Xác minh bảo mật thất bại. Vui lòng tải lại trang và thử lại.";
    default:
      return "Đã có lỗi xảy ra. Vui lòng thử lại.";
  }
}

/** Converts VN local format (0xxxxxxxxx) to E.164 (+84xxxxxxxxx) for Firebase + backend. */
export function toE164(phone: string): string {
  if (phone.startsWith("+")) return phone;
  if (phone.startsWith("0")) return "+84" + phone.substring(1);
  return phone;
}
