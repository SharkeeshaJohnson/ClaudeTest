"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  Calendar,
  Lightbulb,
  BarChart3,
  Flame,
  Settings,
  LogOut,
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
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Streaks", href: "/streaks", icon: Flame },
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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-border px-4">
        <Link href="/" className="text-xl font-semibold tracking-tight text-primary">
          Jemma
        </Link>
      </div>

      {/* Account Switcher */}
      <div className="border-b border-border p-4">
        <AccountSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-lg bg-sidebar-accent"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 relative z-10",
                  isActive ? "text-sidebar-accent-foreground" : ""
                )}
              />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="flex flex-col gap-3">
          {user && (
            <div className="flex items-center justify-between">
              <p className="truncate text-xs text-muted-foreground">
                {user.email?.address || user.wallet?.address?.slice(0, 10) + "..." || "User"}
              </p>
              <button
                onClick={handleLogout}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Jemma v1.0</p>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
