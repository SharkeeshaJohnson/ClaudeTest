"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

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
      <div className="flex h-screen items-center justify-center bg-background">
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
      <div className="flex h-screen items-center justify-center bg-background">
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
    <div className="h-screen overflow-hidden bg-background flex flex-col items-center justify-center px-8">
      {/* Main Content - Centered */}
      <motion.div
        className="text-center max-w-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Logo */}
        <div className="mb-2">
          <svg width="320" height="96" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
            <g id="icon-stones" transform="translate(0, -6)">
              <path d="M10 48C10 48 15 52 28 52C41 52 46 48 46 48C46 48 48 42 28 42C8 42 10 48 10 48Z" fill="#C8B8A6"/>
              <path d="M14 38C14 38 16 41 27 41C38 41 40 38 40 38C40 38 42 33 27 33C12 33 14 38 14 38Z" fill="#C8B8A6"/>
              <path d="M20 29C20 29 21 31 27 31C33 31 34 29 34 29C34 29 35 25 27 25C19 25 20 29 20 29Z" fill="#C8B8A6"/>
            </g>
            <text x="60" y="36" fill="#3E3E3B" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontSize="32" fontWeight="400" letterSpacing="1.5" dominantBaseline="middle">
              Jemma
            </text>
          </svg>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground font-normal leading-relaxed mb-10">
          Jemma understands your social medias to help you grow.
        </p>

        {/* CTA */}
        <button
          onClick={login}
          className="group inline-flex items-center gap-3 px-10 py-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold tracking-wide hover:bg-[#BFA588] transition-all duration-300"
        >
          Chat with Jemma
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="absolute bottom-8 text-sm text-muted-foreground/50 font-light"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        Jemma &copy; {new Date().getFullYear()}
      </motion.footer>
    </div>
  );
}
