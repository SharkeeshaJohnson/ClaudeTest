"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["email", "wallet", "google", "twitter", "discord"],
        appearance: {
          theme: "dark",
          accentColor: "#6366f1",
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
