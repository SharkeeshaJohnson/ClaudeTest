"use client";

import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { AIChat } from "../ai-chat/ai-chat";
import { OverdueTasksModal } from "../tasks/overdue-tasks-modal";
import { cn } from "@/lib/utils";
import { useAccountStore } from "@/store/account-store";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { selectedAccountId, accounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const themeClass = selectedAccount?.type === "dog_content"
    ? "theme-dog-content"
    : "theme-ai-journey";

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
