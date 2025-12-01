"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAccountStore, type SocialPlatform } from "@/store/account-store";
import { cn } from "@/lib/utils";
import { useIdentityToken } from "@privy-io/react-auth";
import type { Account } from "@/lib/db";

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const platforms = [
  {
    id: "tiktok" as SocialPlatform,
    name: "TikTok",
    icon: TikTokIcon,
    color: "bg-black",
    description: "Short-form video content",
  },
  {
    id: "instagram" as SocialPlatform,
    name: "Instagram",
    icon: Instagram,
    color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
    description: "Reels, posts, and stories",
  },
];

type Step = "platforms" | "usernames" | "fetching" | "creating";

export default function OnboardingPage() {
  const router = useRouter();
  const createAccount = useAccountStore((state) => state.createAccount);
  const loadAccounts = useAccountStore((state) => state.loadAccounts);
  const { identityToken } = useIdentityToken();

  const [step, setStep] = useState<Step>("platforms");
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchProgress, setFetchProgress] = useState<string>("");

  // Extract clean username from input
  const extractUsername = (input: string, platform: SocialPlatform): string => {
    let clean = input.trim().replace(/^@/, "");

    if (platform === "tiktok" && clean.includes("tiktok.com/@")) {
      const match = clean.match(/tiktok\.com\/@([\w.]+)/);
      if (match) clean = match[1];
    }

    if (platform === "instagram" && clean.includes("instagram.com/")) {
      const match = clean.match(/instagram\.com\/([\w.]+)/);
      if (match) clean = match[1];
    }

    return clean;
  };

  const togglePlatform = (platformId: SocialPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const fetchProfileData = async (): Promise<Account["initialMetrics"] | undefined> => {
    if (!identityToken) {
      throw new Error("Not authenticated");
    }

    const cleanTiktok = selectedPlatforms.includes("tiktok")
      ? extractUsername(tiktokUsername, "tiktok")
      : null;
    const cleanInstagram = selectedPlatforms.includes("instagram")
      ? extractUsername(instagramUsername, "instagram")
      : null;

    setFetchProgress("Looking up your profile data...");

    try {
      const response = await fetch("/api/profile-lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${identityToken}`,
        },
        body: JSON.stringify({
          tiktokUsername: cleanTiktok,
          instagramUsername: cleanInstagram,
        }),
      });

      if (!response.ok) {
        console.warn("Profile lookup failed, continuing without initial metrics");
        return undefined;
      }

      const data = await response.json();
      setFetchProgress("Profile data retrieved!");

      const initialMetrics: Account["initialMetrics"] = {};
      if (data.tiktok) initialMetrics.tiktok = data.tiktok;
      if (data.instagram) initialMetrics.instagram = data.instagram;

      return Object.keys(initialMetrics).length > 0 ? initialMetrics : undefined;
    } catch (error) {
      console.warn("Profile lookup error:", error);
      return undefined;
    }
  };

  const handleCreateAccount = async () => {
    if (selectedPlatforms.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setStep("fetching");

    try {
      // Fetch profile data before creating account
      const initialMetrics = await fetchProfileData();

      setStep("creating");
      setFetchProgress("Setting up your account...");

      const cleanTiktok = selectedPlatforms.includes("tiktok")
        ? extractUsername(tiktokUsername, "tiktok")
        : null;
      const cleanInstagram = selectedPlatforms.includes("instagram")
        ? extractUsername(instagramUsername, "instagram")
        : null;

      // Generate account name if not provided
      const name =
        accountName.trim() ||
        [cleanTiktok && `@${cleanTiktok}`, cleanInstagram && `@${cleanInstagram}`]
          .filter(Boolean)
          .join(" / ") ||
        "My Account";

      await createAccount({
        name,
        platforms: selectedPlatforms,
        tiktokUsername: cleanTiktok,
        instagramUsername: cleanInstagram,
        initialMetrics,
      });

      // Reload accounts to get the new one
      await loadAccounts();

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to create account:", err);
      setError("Failed to create account. Please try again.");
      setStep("usernames");
    } finally {
      setIsProcessing(false);
    }
  };

  const canProceedPlatforms = selectedPlatforms.length > 0;

  const canProceedUsernames = () => {
    if (selectedPlatforms.includes("tiktok") && !tiktokUsername.trim()) return false;
    if (selectedPlatforms.includes("instagram") && !instagramUsername.trim()) return false;
    return true;
  };

  const goNext = () => {
    switch (step) {
      case "platforms":
        setStep("usernames");
        break;
      case "usernames":
        handleCreateAccount();
        break;
    }
  };

  const goBack = () => {
    switch (step) {
      case "usernames":
        setStep("platforms");
        break;
    }
  };

  const stepNumber = step === "platforms" ? 1 : step === "usernames" ? 2 : 2;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {[1, 2].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    stepNumber >= num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {stepNumber > num ? <Check className="h-4 w-4" /> : num}
                </div>
                {num < 2 && (
                  <div
                    className={cn(
                      "w-16 h-0.5 mx-2",
                      stepNumber > num ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Platform Selection */}
          {step === "platforms" && (
            <motion.div
              key="platforms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-subsection">Welcome to Jemma!</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Select the social media platforms you use
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    Choose at least one platform to get started. You can add more later.
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    {platforms.map((platform) => (
                      <motion.button
                        key={platform.id}
                        onClick={() => togglePlatform(platform.id)}
                        className={cn(
                          "p-6 rounded-xl border-2 text-center transition-all relative overflow-hidden",
                          selectedPlatforms.includes(platform.id)
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {selectedPlatforms.includes(platform.id) && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center text-white",
                            platform.color
                          )}
                        >
                          <platform.icon className="h-8 w-8" />
                        </div>
                        <h3 className="font-semibold text-lg">{platform.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {platform.description}
                        </p>
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex justify-end pt-6">
                    <Button
                      onClick={goNext}
                      disabled={!canProceedPlatforms}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Username Entry */}
          {step === "usernames" && (
            <motion.div
              key="usernames"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Connect Your Accounts</CardTitle>
                  <CardDescription>
                    Enter your public usernames so we can fetch your analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    {selectedPlatforms.includes("tiktok") && (
                      <div className="space-y-2">
                        <Label htmlFor="tiktok-username" className="flex items-center gap-2">
                          <TikTokIcon className="h-4 w-4" />
                          TikTok Username
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            @
                          </span>
                          <Input
                            id="tiktok-username"
                            value={tiktokUsername}
                            onChange={(e) => setTiktokUsername(e.target.value)}
                            placeholder="username"
                            className="pl-8"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter your TikTok username or paste your profile URL
                        </p>
                      </div>
                    )}

                    {selectedPlatforms.includes("instagram") && (
                      <div className="space-y-2">
                        <Label htmlFor="instagram-username" className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          Instagram Username
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            @
                          </span>
                          <Input
                            id="instagram-username"
                            value={instagramUsername}
                            onChange={(e) => setInstagramUsername(e.target.value)}
                            placeholder="username"
                            className="pl-8"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter your Instagram username or paste your profile URL
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 pt-4 border-t">
                      <Label htmlFor="account-name">Account Nickname (optional)</Label>
                      <Input
                        id="account-name"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="e.g., My Creator Account"
                      />
                      <p className="text-xs text-muted-foreground">
                        A friendly name to identify this account in the app
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={goBack}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={goNext}
                      disabled={!canProceedUsernames() || isProcessing}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Get Started
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Fetching/Creating state */}
          {(step === "fetching" || step === "creating") && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <Loader2 className="h-16 w-16 animate-spin text-primary" />
                      <Sparkles className="h-6 w-6 absolute -top-1 -right-1 text-yellow-500 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-semibold mb-2">
                        {step === "fetching"
                          ? "Fetching Your Profile Data"
                          : "Setting Up Your Account"}
                      </h3>
                      <p className="text-muted-foreground">{fetchProgress}</p>
                    </div>

                    {step === "fetching" && (
                      <div className="flex gap-4 mt-4">
                        {selectedPlatforms.map((platform) => {
                          const platformInfo = platforms.find((p) => p.id === platform);
                          return (
                            <div
                              key={platform}
                              className={cn(
                                "w-12 h-12 rounded-lg flex items-center justify-center text-white",
                                platformInfo?.color
                              )}
                            >
                              {platformInfo && <platformInfo.icon className="h-6 w-6" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
