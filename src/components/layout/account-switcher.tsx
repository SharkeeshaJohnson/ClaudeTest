"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Instagram, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccountStore } from "@/store/account-store";

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export function AccountSwitcher() {
  const { accounts, selectedAccountId, selectAccount, loadAccounts, isLoading } =
    useAccountStore();

  // Load accounts from local DB on mount
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="text-sm text-muted-foreground">Loading accounts...</span>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="text-sm text-muted-foreground">No accounts yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Active Account
      </label>
      <div className="flex gap-2">
        {accounts.map((account) => {
          const isSelected = account.id === selectedAccountId;
          const hasTikTok = account.platforms?.includes("tiktok");
          const hasInstagram = account.platforms?.includes("instagram");

          return (
            <motion.button
              key={account.id}
              onClick={() => selectAccount(account.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 rounded-lg p-3 transition-all",
                "bg-primary hover:bg-primary/90",
                isSelected ? "ring-2 ring-offset-2 ring-offset-sidebar ring-primary" : "opacity-60"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-1">
                {hasTikTok && <TikTokIcon className="h-4 w-4 text-white" />}
                {hasInstagram && <Instagram className="h-4 w-4 text-white" />}
                {!hasTikTok && !hasInstagram && <User className="h-4 w-4 text-white" />}
              </div>
              <span className="text-xs font-medium text-white truncate max-w-full">
                {account.name}
              </span>
            </motion.button>
          );
        })}
      </div>
      {selectedAccount && (
        <motion.p
          key={selectedAccount.id}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground text-center mt-2"
        >
          {[
            selectedAccount.tiktokUsername && `@${selectedAccount.tiktokUsername}`,
            selectedAccount.instagramUsername && `@${selectedAccount.instagramUsername}`,
          ]
            .filter(Boolean)
            .join(" / ") || selectedAccount.name}
        </motion.p>
      )}
    </div>
  );
}
