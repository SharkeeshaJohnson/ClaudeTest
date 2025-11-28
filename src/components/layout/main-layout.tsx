"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Sidebar } from "./sidebar";
import { AIChat } from "../ai-chat/ai-chat";
import { OverdueTasksModal } from "../tasks/overdue-tasks-modal";
import { cn } from "@/lib/utils";
import { useAccountStore } from "@/store/account-store";
import { useData } from "@/components/providers/data-provider";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const { authenticated, ready: privyReady } = usePrivy();
  const { isReady: dataReady } = useData();
  const { selectedAccountId, accounts, loadAccounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const [isInitializing, setIsInitializing] = useState(true);

  // Handle all initialization and redirects
  useEffect(() => {
    async function init() {
      // Wait for Privy to be ready
      if (!privyReady) {
        return;
      }

      // If not authenticated, redirect to login
      if (!authenticated) {
        router.replace("/login");
        return;
      }

      // Wait for data layer to be ready
      if (!dataReady) {
        return;
      }

      // Load accounts from database
      await loadAccounts();

      // Check if we have accounts after loading
      const currentAccounts = useAccountStore.getState().accounts;

      if (currentAccounts.length === 0) {
        // No accounts, redirect to onboarding
        router.replace("/onboarding");
        return;
      }

      // Everything is ready
      setIsInitializing(false);
    }

    init();
  }, [privyReady, authenticated, dataReady, loadAccounts, router]);

  const themeClass = selectedAccount?.type === "dog_content"
    ? "theme-dog-content"
    : "theme-ai-journey";

  // Show loading while initializing
  if (isInitializing) {
    // Determine what message to show
    let message = "Loading...";
    if (!privyReady) {
      message = "Initializing...";
    } else if (!authenticated) {
      message = "Redirecting to login...";
    } else if (!dataReady) {
      message = "Loading your data...";
    } else if (accounts.length === 0) {
      message = "Setting up...";
    } else {
      message = "Almost ready...";
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-background", themeClass)}>
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
      <AIChat />
      <OverdueTasksModal />
    </div>
  );
}
