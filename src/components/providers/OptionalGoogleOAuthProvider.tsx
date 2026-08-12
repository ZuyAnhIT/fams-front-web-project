"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { isGoogleConfigured, publicEnv } from "@/config/env";

export default function OptionalGoogleOAuthProvider({ children }: { children: React.ReactNode }) {
  if (!isGoogleConfigured) return <>{children}</>;

  return (
    <GoogleOAuthProvider clientId={publicEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      {children}
    </GoogleOAuthProvider>
  );
}
