"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useCompletion } from "@ai-sdk/react";
import {
  Sparkles,
  Clock,
  Smile,
  Save,
  Calendar,
  Lightbulb,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAccountStore } from "@/store/account-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const toneOptions = [
  { value: "funny", label: "Funny", icon: "😄" },
  { value: "educational", label: "Educational", icon: "📚" },
  { value: "inspirational", label: "Inspirational", icon: "✨" },
  { value: "casual", label: "Casual", icon: "😊" },
  { value: "professional", label: "Professional", icon: "💼" },
  { value: "energetic", label: "Energetic", icon: "⚡" },
];

const durationOptions = [
  { value: "30", label: "30 seconds", description: "Quick & punchy" },
  { value: "45", label: "45 seconds", description: "Balanced content" },
  { value: "60", label: "60 seconds", description: "In-depth story" },
];

export default function ContentStudioPage() {
  const { selectedAccountId, accounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("30");
  const [tone, setTone] = useState("educational");
  const [copied, setCopied] = useState(false);

  const isAiJourney = selectedAccount?.type === "ai_journey";

  const { completion, complete, isLoading } = useCompletion({
    api: "/api/content/generate",
    body: {
      accountId: selectedAccountId,
      topic,
      duration: parseInt(duration),
      tone,
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate content");
    },
  });

  const handleGenerate = async () => {
    if (!selectedAccountId) {
      toast.error("Please select an account first");
      return;
    }
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    await complete(topic);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(completion);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToCalendar = async () => {
    if (!completion || !selectedAccountId) return;

    try {
      // Extract title from the topic
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccountId,
          title: topic,
          script: completion,
          duration: parseInt(duration),
          status: "planned",
          scheduledDate: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        toast.success("Saved to calendar!");
      } else {
        toast.error("Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save");
    }
  };

  const handleSaveToIdeas = async () => {
    if (!completion || !selectedAccountId) return;

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccountId,
          title: topic,
          description: completion.slice(0, 500),
          priority: 4,
          tags: ["ai-generated", tone],
        }),
      });

      if (res.ok) {
        toast.success("Saved to idea bank!");
      } else {
        toast.error("Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Content Studio</h1>
        <p className="text-muted-foreground">
          Generate scripts, hooks, and content ideas with AI
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles
                className={cn(
                  "h-5 w-5",
                  isAiJourney ? "text-blue-500" : "text-orange-500"
                )}
              />
              Generate Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Topic Input */}
            <div className="space-y-2">
              <Label htmlFor="topic">
                {isAiJourney ? "Topic / Theme" : "Video Idea / Theme"}
              </Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={
                  isAiJourney
                    ? "e.g., How I built my first app with AI in 2 hours..."
                    : "e.g., My dog's reaction when I pretend to throw the ball..."
                }
                rows={3}
              />
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {durationOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => setDuration(option.value)}
                    className={cn(
                      "p-3 rounded-lg border text-center transition-all",
                      duration === option.value
                        ? isAiJourney
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-orange-500 bg-orange-500/10"
                        : "border-border hover:border-primary/50"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tone Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Smile className="h-4 w-4" />
                Tone
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {toneOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => setTone(option.value)}
                    className={cn(
                      "p-2 rounded-lg border text-center transition-all",
                      tone === option.value
                        ? isAiJourney
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-orange-500 bg-orange-500/10"
                        : "border-border hover:border-primary/50"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-lg">{option.icon}</span>
                    <p className="text-xs mt-1">{option.label}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !topic.trim()}
              className={cn(
                "w-full",
                isAiJourney
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-orange-500 hover:bg-orange-600"
              )}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                </motion.div>
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Generating..." : "Generate Content"}
            </Button>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Content</span>
              {completion && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles
                      className={cn(
                        "h-5 w-5",
                        isAiJourney ? "text-blue-500" : "text-orange-500"
                      )}
                    />
                  </motion.div>
                  <span className="text-muted-foreground">
                    AI is crafting your content...
                  </span>
                </div>
                {completion && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-sm">
                      {completion}
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        |
                      </motion.span>
                    </div>
                  </div>
                )}
              </div>
            ) : completion ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="prose prose-sm dark:prose-invert max-w-none max-h-[500px] overflow-y-auto">
                  <div className="whitespace-pre-wrap text-sm">{completion}</div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleSaveToCalendar}
                    className="flex-1"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Save to Calendar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveToIdeas}
                    className="flex-1"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Save to Ideas
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Ready to create</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Enter a topic and click generate to create your content
                  package with AI assistance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {isAiJourney ? "AI Journey Content Tips" : "Dog Content Tips"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {isAiJourney ? (
              <>
                <div className="space-y-1">
                  <Badge variant="secondary">Hook Ideas</Badge>
                  <p className="text-xs text-muted-foreground">
                    "I just built X in Y minutes with AI" or "This AI tool
                    changed everything"
                  </p>
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary">Popular Topics</Badge>
                  <p className="text-xs text-muted-foreground">
                    Tutorials, before/after, tool comparisons, learning journey
                    updates
                  </p>
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary">Best Times</Badge>
                  <p className="text-xs text-muted-foreground">
                    Tech content performs well during morning commutes and lunch
                    breaks
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <Badge variant="secondary">Viral Formats</Badge>
                  <p className="text-xs text-muted-foreground">
                    Reactions, fails, sleeping positions, talking dog voiceovers
                  </p>
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary">Trending Sounds</Badge>
                  <p className="text-xs text-muted-foreground">
                    Check TikTok's sound library for trending pet-related audios
                  </p>
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary">Best Times</Badge>
                  <p className="text-xs text-muted-foreground">
                    Evening hours when people are relaxing with their own pets
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
