"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.push("/dashboard");
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-8 w-8 rounded-full border border-primary/40 border-t-primary animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground font-light"
        >
          Redirecting...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/[0.02] pointer-events-none" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-2xl tracking-tight text-foreground">
              Jemma
            </span>
          </Link>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="p-8 text-center bg-card/50 border border-border/40 rounded-2xl">
            <h1 className="font-display text-2xl tracking-tight mb-3">Welcome back</h1>
            <p className="text-muted-foreground font-light mb-8">
              Sign in to continue to your studio
            </p>

            <button
              onClick={login}
              className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-foreground text-background text-sm font-medium tracking-wide hover:bg-foreground/90 transition-all duration-300"
            >
              Sign In
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <p className="text-xs text-muted-foreground/60 font-light mt-8">
              By signing in, you agree to our{" "}
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              {" "}and{" "}
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            </p>
          </div>
        </motion.div>

        {/* Back to home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8"
        >
          <Link
            href="/"
            className="text-sm text-muted-foreground font-light hover:text-foreground transition-colors duration-300"
          >
            Back to home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
