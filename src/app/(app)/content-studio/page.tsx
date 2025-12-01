"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useIdentityToken } from "@privy-io/react-auth";
import {
  Sparkles,
  Clock,
  Smile,
  Calendar,
  Lightbulb,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAccountStore } from "@/store/account-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { videoService, ideaService, settingsService } from "@/lib/db/services";
import { getModelForTask } from "@/lib/portal/config";

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

const CONTENT_PROMPT = `You are a social media content strategist specializing in short-form video content for TikTok and Instagram Reels.

Create a complete video content package based on the following details:
- Topic: {topic}
- Duration: {duration} seconds
- Tone: {tone}
- Platform: {platforms}

Generate the following in a structured format:

## Hook (First 3 seconds)
A powerful attention-grabbing opening line that stops scrollers.

## Script
A complete spoken script with timing markers like [0:03], [0:10], etc. Make it conversational and engaging.

## Video Structure
- Intro (3s): Hook
- Body ({bodyDuration}s): Main content points
- CTA (5s): Call to action

## Shot List
Bullet points of what to film/show at each section.

## Caption
An engaging caption for the post.

## Hashtags
10 relevant hashtags for maximum reach.

Keep the content authentic, relatable, and optimized for short-form video engagement.`;

export default function ContentStudioPage() {
  const { selectedAccountId, accounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const { identityToken } = useIdentityToken();
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("30");
  const [tone, setTone] = useState("educational");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  // Get platforms for the prompt context
  const platformsText = selectedAccount?.platforms?.join(" and ") || "TikTok/Instagram";

  const handleGenerate = useCallback(async () => {
    if (!selectedAccountId) {
      toast.error("Please select an account first");
      return;
    }
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      // Get user's preferred model
      const settings = await settingsService.get();
      const model = getModelForTask("creative", settings.creativeModel);

      // Build the prompt
      const bodyDuration = parseInt(duration) - 8;
      const prompt = CONTENT_PROMPT
        .replace("{topic}", topic)
        .replace("{duration}", duration)
        .replace("{tone}", tone)
        .replace("{platforms}", platformsText)
        .replace("{bodyDuration}", bodyDuration.toString());

      // Get identity token
      if (!identityToken) {
        throw new Error("Not authenticated");
      }
      const token = identityToken;
      console.log("[ContentStudio] Token type:", typeof token);
      console.log("[ContentStudio] Token prefix:", token.substring(0, 30));
      console.log("[ContentStudio] Token length:", token.length);

      // Decode JWT to check expiration
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("[ContentStudio] Token payload:", payload);
        console.log("[ContentStudio] Token exp:", new Date(payload.exp * 1000).toISOString());
        console.log("[ContentStudio] Current time:", new Date().toISOString());
        console.log("[ContentStudio] Token expired?:", Date.now() > payload.exp * 1000);
      } catch (e) {
        console.log("[ContentStudio] Could not decode token:", e);
      }

      // Call Portal API
      const response = await fetch("https://ai-portal-dev.zetachain.com/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "user", content: prompt }
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || "";
                content += delta;
                setGeneratedContent(content);
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      toast.success("Content generated!");
    } catch (error) {
      console.error("Failed to generate:", error);
      toast.error("Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedAccountId, topic, duration, tone, platformsText, identityToken]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToCalendar = async () => {
    if (!generatedContent || !selectedAccountId) return;

    try {
      await videoService.create({
        accountId: selectedAccountId,
        title: topic,
        script: generatedContent,
        duration: parseInt(duration),
        status: "planned",
        scheduledDate: Date.now(),
      });

      toast.success("Saved to calendar!");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save");
    }
  };

  const handleSaveToIdeas = async () => {
    if (!generatedContent || !selectedAccountId) return;

    try {
      await ideaService.create({
        accountId: selectedAccountId,
        title: topic,
        description: generatedContent.slice(0, 500),
        priority: 4,
        tags: ["ai-generated", tone],
      });

      toast.success("Saved to idea bank!");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-subsection text-foreground">Content Studio</h1>
        <p className="text-muted-foreground mt-1">
          Generate scripts, hooks, and content ideas with AI
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Topic Input */}
            <div className="space-y-2">
              <Label htmlFor="topic">Topic / Theme</Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Morning routine, product review, day in my life..."
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
                        ? "border-primary bg-primary/10"
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
                        ? "border-primary bg-primary/10"
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
              disabled={isGenerating || !topic.trim()}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isGenerating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                </motion.div>
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? "Generating..." : "Generate Content"}
            </Button>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Content</span>
              {generatedContent && (
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
            {isGenerating ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-5 w-5 text-primary" />
                  </motion.div>
                  <span className="text-muted-foreground">
                    AI is crafting your content...
                  </span>
                </div>
                {generatedContent && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-sm">
                      {generatedContent}
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
            ) : generatedContent ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="prose prose-sm dark:prose-invert max-w-none max-h-[500px] overflow-y-auto">
                  <div className="whitespace-pre-wrap text-sm">{generatedContent}</div>
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
          <CardTitle className="text-sm">Content Creation Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Badge variant="secondary">Hook Ideas</Badge>
              <p className="text-xs text-muted-foreground">
                Start with a question, bold statement, or visual that stops the scroll
              </p>
            </div>
            <div className="space-y-1">
              <Badge variant="secondary">Popular Formats</Badge>
              <p className="text-xs text-muted-foreground">
                Tutorials, day-in-life, reactions, before/after, storytimes
              </p>
            </div>
            <div className="space-y-1">
              <Badge variant="secondary">Best Practices</Badge>
              <p className="text-xs text-muted-foreground">
                Post consistently, use trending sounds, engage with your audience
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
