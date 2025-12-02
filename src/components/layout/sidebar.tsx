"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  Lightbulb,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { cn } from "@/lib/utils";
import { AccountSwitcher } from "./account-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAccountStore } from "@/store/account-store";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Trends", href: "/trends", icon: TrendingUp },
  { name: "Content Studio", href: "/content-studio", icon: Sparkles },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = usePrivy();
  const clearAccounts = useAccountStore((state) => state.clearAccounts);

  const handleLogout = async () => {
    // Clear local state
    clearAccounts();
    // Logout from Privy
    await logout();
    // Redirect to login
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/50 bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border/50 px-5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-xl bg-primary/15 blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-lg font-display font-semibold tracking-tight">Jemma</span>
        </Link>
      </div>

      {/* Account Switcher */}
      <div className="border-b border-border/50 p-4">
        <AccountSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] relative z-10 transition-colors",
                  isActive ? "text-primary" : "group-hover:text-foreground"
                )}
              />
              <span className="relative z-10 flex-1">{item.name}</span>
              {isActive && (
                <ChevronRight className="h-4 w-4 relative z-10 text-primary/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 p-4">
        <div className="flex flex-col gap-4">
          {user && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/30">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {(user.email?.address?.[0] || user.wallet?.address?.[0] || "U").toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {user.email?.address || user.wallet?.address?.slice(0, 10) + "..." || "User"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted-foreground/70">v1.0</p>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
