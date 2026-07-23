import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Backlog #2 (Đăng nhập bằng số điện thoại OTP): the backend only verifies an
 * already-issued Firebase ID token (POST /auth/otp/verify — see
 * FirebasePhoneTokenVerifier on the backend) — it never sends the SMS itself.
 * The actual "send code" / "verify code" steps happen here, client-side,
 * against Firebase directly.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let cachedAuth: Auth | null = null;

/**
 * Lazy on purpose: `getAuth()` throws synchronously the moment it's called
 * with an invalid/missing API key, and this module is imported at the top of
 * PhoneLoginForm/RegisterForm — an eager `export const firebaseAuth = getAuth(...)`
 * would crash those pages entirely (500) whenever Firebase isn't configured,
 * instead of only failing when the user actually tries to use phone login.
 */
export function getFirebaseAuth(): Auth {
  if (!firebaseConfig.apiKey) {
    throw new Error("FIREBASE_NOT_CONFIGURED");
  }
  if (!cachedAuth) {
    const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}
