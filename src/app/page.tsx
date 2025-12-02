"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Lightbulb, Zap } from "lucide-react";

export default function Home() {
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
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] blob-gradient rounded-full animate-blob"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] blob-gradient rounded-full animate-blob"
          style={{ animationDelay: "-4s" }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        />
        <motion.div
          className="absolute top-1/3 left-1/4 w-[300px] h-[300px] blob-gradient rounded-full animate-blob opacity-50"
          style={{ animationDelay: "-2s" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <motion.header
          className="flex items-center justify-between px-6 py-5 md:px-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-primary/20 blur-md -z-10" />
            </div>
            <span className="text-xl font-display font-semibold tracking-tight">Jemma</span>
          </div>
          <button
            onClick={login}
            className="btn-ghost text-sm"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6 py-12 md:px-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Zap className="h-4 w-4" />
              AI-Powered Content Strategy
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-display-xl mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Meet{" "}
              <span className="relative inline-block">
                <span className="gradient-text">Jemma</span>
                <motion.svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 12"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 1.2 }}
                >
                  <motion.path
                    d="M2 8C50 2 150 2 198 8"
                    stroke="url(#underline-gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                  />
                  <defs>
                    <linearGradient id="underline-gradient" x1="0" y1="0" x2="200" y2="0">
                      <stop stopColor="#4F46E5" />
                      <stop offset="1" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </motion.svg>
              </span>
              ,<br />
              Your Content Strategist
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              An AI companion that understands your content, analyzes what works,
              and helps you grow your audience with data-driven insights.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <button
                onClick={login}
                className="btn-primary text-base px-8 py-4 group"
              >
                Start Creating
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button className="btn-secondary text-base px-8 py-4">
                See How It Works
              </button>
            </motion.div>
          </div>
        </main>

        {/* Features Preview */}
        <motion.section
          className="px-6 py-16 md:px-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 stagger">
              <FeatureCard
                icon={<TrendingUp className="h-6 w-6" />}
                title="Trend Analysis"
                description="Stay ahead with real-time insights on what's trending in your niche"
                gradient="from-indigo-500 to-purple-500"
              />
              <FeatureCard
                icon={<Sparkles className="h-6 w-6" />}
                title="AI Content Ideas"
                description="Get personalized content suggestions based on your audience's preferences"
                gradient="from-orange-500 to-pink-500"
              />
              <FeatureCard
                icon={<Lightbulb className="h-6 w-6" />}
                title="Smart Insights"
                description="Understand what makes your content perform with deep analytics"
                gradient="from-teal-500 to-cyan-500"
              />
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          className="px-6 py-8 md:px-12 border-t border-border/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Jemma &copy; 2024</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <motion.div
      className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-border transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} text-white mb-4 shadow-lg`}>
        {icon}
      </div>
      <h3 className="font-display text-xl font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>

      {/* Hover glow effect */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10`} />
    </motion.div>
  );
}
