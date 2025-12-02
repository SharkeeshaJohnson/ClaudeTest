"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["google", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#6366f1",
        },
        // Disable embedded wallet creation since users will use MetaMask
        embeddedWallets: {
          ethereum: {
            createOnLogin: "off",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
