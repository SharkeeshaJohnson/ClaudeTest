"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-primary animate-pulse-soft" />
          </div>
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
          className="text-muted-foreground"
        >
          Redirecting to dashboard...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background grain">
      {/* Decorative gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-[500px] h-[500px] blob-gradient rounded-full animate-blob"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] blob-gradient rounded-full animate-blob"
          style={{ animationDelay: "-4s" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-primary/20 blur-md -z-10" />
            </div>
            <span className="text-2xl font-display font-semibold tracking-tight">Jemma</span>
          </Link>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="card-elevated p-8 text-center">
            <h1 className="text-display-sm mb-3">Welcome back</h1>
            <p className="text-muted-foreground mb-8">
              Sign in to continue to your content studio
            </p>

            <button
              onClick={login}
              className="btn-primary w-full text-base py-4 group"
            >
              Sign In
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>

            <p className="text-xs text-muted-foreground mt-6">
              By signing in, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">Terms</a>
              {" "}and{" "}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </div>
        </motion.div>

        {/* Back to home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
