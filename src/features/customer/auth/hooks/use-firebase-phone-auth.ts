import { useRef, useState } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

/**
 * Drives the client-side half of Firebase Phone Auth (send SMS code, confirm
 * it, hand back an ID token) — shared by PhoneLoginForm (backlog #2) and
 * RegisterForm's phone-only signup path, which both need the exact same
 * send/confirm/recaptcha lifecycle.
 */
export function useFirebasePhoneAuth(recaptchaContainerId: string) {
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  function getVerifier(): RecaptchaVerifier {
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(getFirebaseAuth(), recaptchaContainerId, {
        size: "invisible",
      });
    }
    return verifierRef.current;
  }

  /** Sends the SMS code. `phoneE164` must already be in +84... format. */
  async function sendCode(phoneE164: string): Promise<void> {
    setIsSending(true);
    try {
      confirmationRef.current = await signInWithPhoneNumber(getFirebaseAuth(), phoneE164, getVerifier());
    } finally {
      setIsSending(false);
    }
  }

  /** Confirms the 6-digit code and returns a Firebase ID token for the backend. */
  async function confirmCode(code: string): Promise<string> {
    if (!confirmationRef.current) {
      throw new Error("Chưa gửi mã OTP — vui lòng gửi lại.");
    }
    setIsConfirming(true);
    try {
      const credential = await confirmationRef.current.confirm(code);
      return await credential.user.getIdToken();
    } finally {
      setIsConfirming(false);
    }
  }

  function reset() {
    confirmationRef.current = null;
  }

  return { sendCode, confirmCode, reset, isSending, isConfirming };
}
