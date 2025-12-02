"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Instagram, User, ChevronDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccountStore } from "@/store/account-store";
import { metricsService } from "@/lib/db/services";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [followers, setFollowers] = useState<number | null>(null);

  // Load accounts from local DB on mount
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Fetch followers when account changes
  useEffect(() => {
    async function fetchFollowers() {
      if (!selectedAccountId) {
        setFollowers(null);
        return;
      }

      try {
        const account = accounts.find((a) => a.id === selectedAccountId);
        const platform = account?.platforms?.[0] || "instagram";
        const metrics = await metricsService.getAccountMetrics(selectedAccountId, { platform });
        const latestMetric = metrics[metrics.length - 1];
        setFollowers(latestMetric?.followers || null);
      } catch (error) {
        console.error("Failed to fetch followers:", error);
        setFollowers(null);
      }
    }

    fetchFollowers();
  }, [selectedAccountId, accounts]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex items-center justify-center py-2">
        <span className="text-xs text-muted-foreground">No accounts</span>
      </div>
    );
  }

  const hasTikTok = selectedAccount?.platforms?.includes("tiktok");
  const hasInstagram = selectedAccount?.platforms?.includes("instagram");

  // Get display username
  const displayUsername = selectedAccount?.tiktokUsername
    ? `@${selectedAccount.tiktokUsername}`
    : selectedAccount?.instagramUsername
    ? `@${selectedAccount.instagramUsername}`
    : selectedAccount?.name || "Account";

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
              "bg-[#C8B8A6]/15 hover:bg-[#C8B8A6]/25 border border-[#C8B8A6]/30",
              "focus:outline-none focus:ring-2 focus:ring-[#C8B8A6]/30"
            )}
            whileTap={{ scale: 0.98 }}
          >
            {/* Platform icons */}
            <div className="flex items-center gap-1 text-muted-foreground">
              {hasTikTok && <TikTokIcon className="h-4 w-4" />}
              {hasInstagram && <Instagram className="h-4 w-4" />}
              {!hasTikTok && !hasInstagram && <User className="h-4 w-4" />}
            </div>

            {/* Username */}
            <span className="flex-1 text-sm font-medium text-left truncate">
              {displayUsername}
            </span>

            {/* Dropdown indicator */}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          {accounts.map((account) => {
            const isSelected = account.id === selectedAccountId;
            const accHasTikTok = account.platforms?.includes("tiktok");
            const accHasInstagram = account.platforms?.includes("instagram");
            const accUsername = account.tiktokUsername
              ? `@${account.tiktokUsername}`
              : account.instagramUsername
              ? `@${account.instagramUsername}`
              : account.name;

            return (
              <DropdownMenuItem
                key={account.id}
                onClick={() => selectAccount(account.id)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer",
                  isSelected && "bg-primary/10"
                )}
              >
                <div className="flex items-center gap-1 text-muted-foreground">
                  {accHasTikTok && <TikTokIcon className="h-4 w-4" />}
                  {accHasInstagram && <Instagram className="h-4 w-4" />}
                  {!accHasTikTok && !accHasInstagram && <User className="h-4 w-4" />}
                </div>
                <span className={cn("flex-1 truncate", isSelected && "font-medium")}>
                  {accUsername}
                </span>
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Followers metric */}
      {followers !== null && (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{followers.toLocaleString()} followers</span>
        </div>
      )}
    </div>
  );
}
