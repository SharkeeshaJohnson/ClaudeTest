"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  RefreshCw,
  Hash,
  Lightbulb,
  Calendar,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccountStore } from "@/store/account-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIdentityToken } from "@privy-io/react-auth";

type Provider = "claude" | "gpt4" | "gemini" | "grok";

interface TrendData {
  trendingTopics?: string[];
  trendingFormats?: string[];
  hashtags: string[];
  contentAngles?: string[];
  uniqueAngles?: string[];
  seasonalHooks?: string[];
  seasonalOpportunities?: string[];
}

interface TrendResult {
  id: string;
  provider: Provider;
  content: TrendData;
  generatedAt: string;
}

const providerConfig: Record<Provider, { name: string; color: string; icon: string }> = {
  claude: { name: "Claude", color: "bg-orange-500", icon: "🤖" },
  gpt4: { name: "GPT-4", color: "bg-green-500", icon: "🧠" },
  gemini: { name: "Gemini", color: "bg-blue-500", icon: "✨" },
  grok: { name: "Grok", color: "bg-purple-500", icon: "🔮" },
};

// Map our provider names to actual model IDs
const providerToModel: Record<Provider, string> = {
  claude: "anthropic/claude-3-5-sonnet-20241022",
  gpt4: "openai/gpt-4o",
  gemini: "google/gemini-1.5-pro",
  grok: "openai/gpt-4o-mini", // Grok not available, use GPT-4o-mini as fallback
};

export default function TrendsPage() {
  const { selectedAccountId, accounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const { identityToken } = useIdentityToken();
  const [results, setResults] = useState<Record<Provider, TrendResult | null>>({
    claude: null,
    gpt4: null,
    gemini: null,
    grok: null,
  });
  const [loading, setLoading] = useState<Record<Provider, boolean>>({
    claude: false,
    gpt4: false,
    gemini: false,
    grok: false,
  });
  const [errors, setErrors] = useState<Record<Provider, string | null>>({
    claude: null,
    gpt4: null,
    gemini: null,
    grok: null,
  });

  const isAiJourney = selectedAccount?.type === "ai_journey";

  const buildTrendPrompt = () => {
    const niche = isAiJourney ? "AI/tech content for TikTok/Reels" : "dog/pet content for TikTok/Reels";
    return `You are a social media trend analyst. Analyze current trends for ${niche}.

Return a JSON object with exactly this structure (no markdown, just raw JSON):
{
  "trendingTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8"],
  "contentAngles": ["angle1", "angle2", "angle3", "angle4"],
  "seasonalHooks": ["hook1", "hook2", "hook3"]
}

Focus on:
- Current viral trends in the ${isAiJourney ? "tech/AI" : "pet"} space
- High-performing hashtags with good reach
- Unique content angles that stand out
- Seasonal or timely opportunities

Return ONLY the JSON, no explanations.`;
  };

  const generateTrends = async (provider: Provider) => {
    if (!selectedAccountId) {
      toast.error("Please select an account first");
      return;
    }

    setLoading((prev) => ({ ...prev, [provider]: true }));
    setErrors((prev) => ({ ...prev, [provider]: null }));

    try {
      const model = providerToModel[provider];
      console.log(`[Trends] Starting generation for ${provider} with model ${model}`);

      if (!identityToken) {
        throw new Error("Not authenticated");
      }
      const token = identityToken;
      console.log(`[Trends] Token available:`, !!token);

      const response = await fetch("https://ai-portal-dev.zetachain.com/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: buildTrendPrompt() }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Trends] API error for ${provider}:`, response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      console.log(`[Trends] Content for ${provider}:`, content?.substring(0, 100));

      // Parse JSON from response (handle potential markdown wrapping)
      let trendData: TrendData;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          trendData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch {
        // Fallback structure if parsing fails
        trendData = {
          trendingTopics: ["Unable to parse trends"],
          hashtags: [],
          contentAngles: [],
          seasonalHooks: [],
        };
      }

      const trendResult: TrendResult = {
        id: `${provider}-${Date.now()}`,
        provider,
        content: trendData,
        generatedAt: new Date().toISOString(),
      };

      setResults((prev) => ({ ...prev, [provider]: trendResult }));
      toast.success(`${providerConfig[provider].name} analysis complete`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate";
      setErrors((prev) => ({ ...prev, [provider]: message }));
      toast.error(message);
    } finally {
      setLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const generateAll = async () => {
    const providers: Provider[] = ["claude", "gpt4", "gemini", "grok"];
    await Promise.all(providers.map((p) => generateTrends(p)));
  };

  const renderTrendContent = (provider: Provider) => {
    const result = results[provider];
    const isLoading = loading[provider];
    const error = errors[provider];
    const config = providerConfig[provider];

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="h-8 w-8 text-muted-foreground" />
          </motion.div>
          <p className="mt-4 text-muted-foreground">Analyzing trends...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-destructive text-sm text-center">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateTrends(provider)}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <span className="text-4xl mb-4">{config.icon}</span>
          <p className="text-muted-foreground mb-4">
            Generate insights from {config.name}
          </p>
          <Button
            onClick={() => generateTrends(provider)}
            className={cn(config.color, "text-white")}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate
          </Button>
        </div>
      );
    }

    const content = result.content;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Trending Topics/Formats */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {isAiJourney ? "Trending Topics" : "Trending Formats"}
          </h4>
          <div className="space-y-2">
            {(content.trendingTopics || content.trendingFormats)?.map(
              (item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs text-white",
                      config.color
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm">{item}</span>
                </motion.div>
              )
            )}
          </div>
        </div>

        {/* Hashtags */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Recommended Hashtags
          </h4>
          <div className="flex flex-wrap gap-2">
            {content.hashtags?.map((tag, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(tag);
                    toast.success("Copied to clipboard");
                  }}
                >
                  {tag}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Content Angles */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            {isAiJourney ? "Content Angles" : "Unique Angles"}
          </h4>
          <ul className="space-y-2">
            {(content.contentAngles || content.uniqueAngles)?.map(
              (angle, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary">•</span>
                  {angle}
                </motion.li>
              )
            )}
          </ul>
        </div>

        {/* Seasonal/Timely */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isAiJourney ? "Seasonal Hooks" : "Seasonal Opportunities"}
          </h4>
          <ul className="space-y-2">
            {(content.seasonalHooks || content.seasonalOpportunities)?.map(
              (item, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary">•</span>
                  {item}
                </motion.li>
              )
            )}
          </ul>
        </div>

        {/* Regenerate button */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateTrends(provider)}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Generated at {new Date(result.generatedAt).toLocaleString()}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-subsection text-foreground">Trend Analysis</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered insights from multiple providers
          </p>
        </div>
        <Button
          onClick={generateAll}
          disabled={Object.values(loading).some((l) => l)}
          className="bg-primary hover:bg-primary/90"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generate All
        </Button>
      </div>

      {/* Provider Tabs */}
      <Tabs defaultValue="claude" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {(Object.keys(providerConfig) as Provider[]).map((provider) => (
            <TabsTrigger
              key={provider}
              value={provider}
              className="flex items-center gap-2"
            >
              <span>{providerConfig[provider].icon}</span>
              {providerConfig[provider].name}
              {loading[provider] && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-3 w-3" />
                </motion.div>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(providerConfig) as Provider[]).map((provider) => (
          <TabsContent key={provider} value={provider}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{providerConfig[provider].icon}</span>
                  {providerConfig[provider].name} Analysis
                  {results[provider] && (
                    <Badge variant="secondary" className="ml-auto">
                      Latest
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>{renderTrendContent(provider)}</CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Comparison View */}
      {Object.values(results).some((r) => r !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>Side-by-Side Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(providerConfig) as Provider[]).map((provider) => {
                const result = results[provider];
                const config = providerConfig[provider];

                return (
                  <div key={provider} className="space-y-2">
                    <div
                      className={cn(
                        "font-medium flex items-center gap-2 p-2 rounded",
                        config.color,
                        "text-white"
                      )}
                    >
                      <span>{config.icon}</span>
                      {config.name}
                    </div>
                    {result ? (
                      <div className="text-xs space-y-1">
                        <p className="font-medium">Top Hashtags:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.content.hashtags?.slice(0, 5).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not generated</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
