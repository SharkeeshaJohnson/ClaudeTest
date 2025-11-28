"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Dog,
  Instagram,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAccountStore, type AccountType } from "@/store/account-store";
import { cn } from "@/lib/utils";

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const accountTypes = [
  {
    type: "ai_journey" as AccountType,
    title: "AI Journey",
    description: "Tech content about learning and building with AI",
    icon: Bot,
    color: "blue",
    examples: ["AI tutorials", "Tech reviews", "Learning journey"],
  },
  {
    type: "dog_content" as AccountType,
    title: "Dog Content",
    description: "Cute and funny pet content",
    icon: Dog,
    color: "orange",
    examples: ["Pet reactions", "Training tips", "Daily adventures"],
  },
];

const platforms = [
  {
    id: "tiktok",
    name: "TikTok",
    icon: TikTokIcon,
    placeholder: "@username or profile URL",
    pattern: /^(@?[\w.]+|https?:\/\/(www\.)?tiktok\.com\/@[\w.]+)/,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    placeholder: "@username or profile URL",
    pattern: /^(@?[\w.]+|https?:\/\/(www\.)?instagram\.com\/[\w.]+)/,
  },
];

type Step = "account-type" | "platform" | "username" | "creating";

export default function OnboardingPage() {
  const router = useRouter();
  const createAccount = useAccountStore((state) => state.createAccount);
  const loadAccounts = useAccountStore((state) => state.loadAccounts);

  const [step, setStep] = useState<Step>("account-type");
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTypeInfo = accountTypes.find((t) => t.type === selectedType);
  const selectedPlatformInfo = platforms.find((p) => p.id === selectedPlatform);

  // Extract clean username from input
  const extractUsername = (input: string): string => {
    // Remove @ prefix if present
    let clean = input.trim().replace(/^@/, "");

    // Extract from TikTok URL
    if (clean.includes("tiktok.com/@")) {
      const match = clean.match(/tiktok\.com\/@([\w.]+)/);
      if (match) clean = match[1];
    }

    // Extract from Instagram URL
    if (clean.includes("instagram.com/")) {
      const match = clean.match(/instagram\.com\/([\w.]+)/);
      if (match) clean = match[1];
    }

    return clean;
  };

  const handleCreateAccount = async () => {
    if (!selectedType || !selectedPlatform) return;

    setIsCreating(true);
    setError(null);
    setStep("creating");

    try {
      const cleanUsername = extractUsername(username);
      const name = accountName.trim() || `${selectedTypeInfo?.title} - @${cleanUsername}`;

      await createAccount({
        name,
        type: selectedType,
        platforms: [selectedPlatform],
        nicheKeywords: selectedTypeInfo?.examples || [],
      });

      // Reload accounts to get the new one
      await loadAccounts();

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to create account:", err);
      setError("Failed to create account. Please try again.");
      setStep("username");
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case "account-type":
        return selectedType !== null;
      case "platform":
        return selectedPlatform !== null;
      case "username":
        return username.trim().length > 0;
      default:
        return false;
    }
  };

  const goNext = () => {
    switch (step) {
      case "account-type":
        setStep("platform");
        break;
      case "platform":
        setStep("username");
        break;
      case "username":
        handleCreateAccount();
        break;
    }
  };

  const goBack = () => {
    switch (step) {
      case "platform":
        setStep("account-type");
        break;
      case "username":
        setStep("platform");
        break;
    }
  };

  const stepNumber = step === "account-type" ? 1 : step === "platform" ? 2 : step === "username" ? 3 : 3;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((num) => (
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
                {num < 3 && (
                  <div
                    className={cn(
                      "w-12 h-0.5 mx-1",
                      stepNumber > num ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Account Type */}
          {step === "account-type" && (
            <motion.div
              key="account-type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-subsection">Welcome to Jemma!</CardTitle>
                  <CardDescription className="text-base mt-2">
                    What type of content do you create?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {accountTypes.map((type) => (
                      <motion.button
                        key={type.type}
                        onClick={() => setSelectedType(type.type)}
                        className={cn(
                          "p-6 rounded-xl border-2 text-left transition-all",
                          selectedType === type.type
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <type.icon className="h-10 w-10 mb-3 text-primary" />
                        <h3 className="font-semibold text-lg">{type.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {type.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {type.examples.map((ex) => (
                            <span
                              key={ex}
                              className="text-xs px-2 py-0.5 bg-muted rounded-full"
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={goNext}
                      disabled={!canProceed()}
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

          {/* Step 2: Platform Selection */}
          {step === "platform" && (
            <motion.div
              key="platform"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Choose Your Platform</CardTitle>
                  <CardDescription>
                    Which platform is your primary focus?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {platforms.map((platform) => (
                      <motion.button
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform.id)}
                        className={cn(
                          "p-6 rounded-xl border-2 text-center transition-all",
                          selectedPlatform === platform.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <platform.icon className="h-12 w-12 mx-auto mb-3 text-foreground" />
                        <h3 className="font-semibold text-lg">{platform.name}</h3>
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={goBack}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={goNext}
                      disabled={!canProceed()}
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

          {/* Step 3: Username */}
          {step === "username" && (
            <motion.div
              key="username"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Connect Your Account</CardTitle>
                  <CardDescription>
                    Enter your {selectedPlatformInfo?.name} username
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">
                        {selectedPlatformInfo?.name} Username
                      </Label>
                      <div className="relative">
                        {selectedPlatformInfo && (
                          <selectedPlatformInfo.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        )}
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder={selectedPlatformInfo?.placeholder}
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You can enter @username or paste your profile URL
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account-name">
                        Account Nickname (optional)
                      </Label>
                      <Input
                        id="account-name"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder={`e.g., My ${selectedTypeInfo?.title} Account`}
                      />
                      <p className="text-xs text-muted-foreground">
                        A friendly name to identify this account
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
                      disabled={!canProceed() || isCreating}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Creating state */}
          {step === "creating" && (
            <motion.div
              key="creating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <h3 className="text-lg font-semibold">
                      Setting up your account...
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This will only take a moment
                    </p>
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
