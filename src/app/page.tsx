"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4 bg-white">
      <div className="text-center animate-fade-in-up">
        <h1 className="text-section text-gray-900">Jemma</h1>
        <p className="mt-3 text-lg text-gray-600">
          Your AI-Powered Content Studio
        </p>
      </div>

      <button
        onClick={login}
        className="btn-jemma-primary text-base px-8 py-4 animate-fade-in-up"
        style={{ animationDelay: "100ms" }}
      >
        Get Started
      </button>
    </div>
  );
}
