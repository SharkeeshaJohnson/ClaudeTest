"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Dog } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccountStore, type AccountType } from "@/store/account-store";

export function AccountSwitcher() {
  const { accounts, selectedAccountId, selectAccount, loadAccounts, isLoading } =
    useAccountStore();

  // Load accounts from local DB on mount
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const accountType = selectedAccount?.type as AccountType | undefined;

  const getAccountIcon = (type: AccountType) => {
    return type === "ai_journey" ? Bot : Dog;
  };

  const getAccountColor = (type: AccountType) => {
    return type === "ai_journey"
      ? "bg-blue-500 hover:bg-blue-600"
      : "bg-orange-500 hover:bg-orange-600";
  };

  const getAccountRingColor = (type: AccountType, isSelected: boolean) => {
    if (!isSelected) return "";
    return type === "ai_journey" ? "ring-blue-500" : "ring-orange-500";
  };

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
          const Icon = getAccountIcon(account.type as AccountType);

          return (
            <motion.button
              key={account.id}
              onClick={() => selectAccount(account.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 rounded-lg p-3 transition-all",
                getAccountColor(account.type as AccountType),
                isSelected ? "ring-2 ring-offset-2 ring-offset-sidebar" : "opacity-60",
                getAccountRingColor(account.type as AccountType, isSelected)
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-5 w-5 text-white" />
              <span className="text-xs font-medium text-white truncate max-w-full">
                {account.type === "ai_journey" ? "AI Journey" : "Dog Content"}
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
          {selectedAccount.name}
        </motion.p>
      )}
    </div>
  );
}
