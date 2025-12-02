"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Sparkles,
  Lightbulb,
  Settings,
  LogOut,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { cn } from "@/lib/utils";
import { AccountSwitcher } from "./account-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAccountStore } from "@/store/account-store";

// Custom Jemma stones icon component
function JemmaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M4 18C4 18 6.5 20 12 20C17.5 20 20 18 20 18C20 18 21 15 12 15C3 15 4 18 4 18Z" fill="currentColor"/>
      <path d="M6 13C6 13 7 14.5 12 14.5C17 14.5 18 13 18 13C18 13 19 10.5 12 10.5C5 10.5 6 13 6 13Z" fill="currentColor"/>
      <path d="M8 8C8 8 8.5 9 12 9C15.5 9 16 8 16 8C16 8 16.5 6 12 6C7.5 6 8 8 8 8Z" fill="currentColor"/>
    </svg>
  );
}

const navigation = [
  { name: "Jemma", href: "/dashboard", icon: JemmaIcon },
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
    clearAccounts();
    await logout();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/40 bg-card/50 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border/40 px-4">
        <Link href="/" className="flex items-center">
          <svg width="140" height="42" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="icon-stones" transform="translate(0, -6)">
              <path d="M10 48C10 48 15 52 28 52C41 52 46 48 46 48C46 48 48 42 28 42C8 42 10 48 10 48Z" fill="#C8B8A6"/>
              <path d="M14 38C14 38 16 41 27 41C38 41 40 38 40 38C40 38 42 33 27 33C12 33 14 38 14 38Z" fill="#C8B8A6"/>
              <path d="M20 29C20 29 21 31 27 31C33 31 34 29 34 29C34 29 35 25 27 25C19 25 20 29 20 29Z" fill="#C8B8A6"/>
            </g>
            <text x="60" y="36" fill="#3E3E3B" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontSize="32" fontWeight="400" letterSpacing="1.5" dominantBaseline="middle">
              Jemma
            </text>
          </svg>
        </Link>
      </div>

      {/* Account Switcher */}
      <div className="border-b border-border/40 px-5 py-4">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.15em] mb-2.5 block">
          Account
        </label>
        <AccountSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-0.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 relative rounded-lg",
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground font-medium hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-lg bg-[#C8B8A6]/20 border border-[#C8B8A6]/30"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              )}
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] relative z-10 transition-colors duration-200",
                  isActive ? "text-[#C8B8A6]" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/40 p-4">
        <div className="flex flex-col gap-4">
          {user && (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border/50">
                <span className="text-xs font-medium text-muted-foreground">
                  {(user.email?.address?.[0] || user.wallet?.address?.[0] || "U").toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs text-foreground/80">
                  {user.email?.address || user.wallet?.address?.slice(0, 10) + "..." || "User"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:text-foreground hover:bg-muted"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] text-muted-foreground/60 tracking-wide">v1.0</p>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
