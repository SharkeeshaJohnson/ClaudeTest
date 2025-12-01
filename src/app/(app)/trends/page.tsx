"use client";

import { useState, useEffect, useCallback, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  RefreshCw,
  Hash,
  Lightbulb,
  Sparkles,
  X,
  Plus,
  Save,
  FileText,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAccountStore } from "@/store/account-store";
import { toast } from "sonner";
import { useIdentityToken } from "@privy-io/react-auth";
import { profileService, accountMetricService } from "@/lib/db/services";
import { useMemoryExtractor } from "@/lib/memory";
import type { AccountProfile, AccountMetric } from "@/lib/db";
import { AVAILABLE_MODELS } from "@/lib/portal/config";

// ============================================================================
// Types
// ============================================================================

interface TrendAnalysis {
  summary: string;
  keyInsights: string[];
  recommendedTopics: string[];
  recommendedHashtags: string[];
  contentAngles: string[];
  actionItems: string[];
}

// ============================================================================
// Tag Input Component
// ============================================================================

function TagInput({
  tags,
  onTagsChange,
  placeholder,
  prefix = "",
}: {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder: string;
  prefix?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const addTag = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !tags.includes(trimmed)) {
        const tagValue = prefix && !trimmed.startsWith(prefix) ? `${prefix}${trimmed}` : trimmed;
        onTagsChange([...tags, tagValue]);
      }
      setInputValue("");
    },
    [tags, onTagsChange, prefix]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-background min-h-[52px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {tags.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputValue && addTag(inputValue)}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}

// ============================================================================
// Rules Input Component
// ============================================================================

function RulesInput({
  rules,
  onRulesChange,
}: {
  rules: string[];
  onRulesChange: (rules: string[]) => void;
}) {
  const [newRule, setNewRule] = useState("");

  const addRule = () => {
    const trimmed = newRule.trim();
    if (trimmed && !rules.includes(trimmed)) {
      onRulesChange([...rules, trimmed]);
      setNewRule("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addRule();
    }
  };

  const removeRule = (index: number) => {
    onRulesChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {rules.map((rule, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg group"
          >
            <span className="text-muted-foreground text-sm mt-0.5">
              {index + 1}.
            </span>
            <p className="flex-1 text-sm">{rule}</p>
            <button
              type="button"
              onClick={() => removeRule(index)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Textarea
          value={newRule}
          onChange={(e) => setNewRule(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a rule or fact about your account (e.g., 'I post daily at 7 PM EST', 'My niche is fitness for busy moms')"
          className="min-h-[60px]"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addRule}
          disabled={!newRule.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Trends Page Component
// ============================================================================

export default function TrendsPage() {
  const { selectedAccountId, accounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const { identityToken } = useIdentityToken();
  const { extractFromAction } = useMemoryExtractor();

  // Profile state
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [rules, setRules] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Metrics state
  const [metrics, setMetrics] = useState<AccountMetric[]>([]);

  // Analysis state
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Load profile and metrics
  useEffect(() => {
    const loadData = async () => {
      if (!selectedAccountId) return;

      try {
        const [profileData, metricsData] = await Promise.all([
          profileService.getByAccountId(selectedAccountId),
          accountMetricService.getByAccountId(selectedAccountId),
        ]);

        if (profileData) {
          setProfile(profileData);
          setHashtags(profileData.hashtags);
          setKeywords(profileData.keywords);
          setRules(profileData.rules);
        } else {
          setProfile(null);
          setHashtags([]);
          setKeywords([]);
          setRules([]);
        }

        setMetrics(metricsData);
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    loadData();
  }, [selectedAccountId]);

  // Track changes
  useEffect(() => {
    if (!profile) {
      setHasChanges(hashtags.length > 0 || keywords.length > 0 || rules.length > 0);
      return;
    }

    const hashtagsChanged = JSON.stringify(hashtags) !== JSON.stringify(profile.hashtags);
    const keywordsChanged = JSON.stringify(keywords) !== JSON.stringify(profile.keywords);
    const rulesChanged = JSON.stringify(rules) !== JSON.stringify(profile.rules);

    setHasChanges(hashtagsChanged || keywordsChanged || rulesChanged);
  }, [hashtags, keywords, rules, profile]);

  // Save profile
  const handleSave = async () => {
    if (!selectedAccountId) return;

    setIsSaving(true);
    try {
      const updatedProfile = await profileService.upsert(selectedAccountId, {
        hashtags,
        keywords,
        rules,
      });
      setProfile(updatedProfile);
      setHasChanges(false);

      // Save to Evermind memory
      const memoryContent = [
        hashtags.length > 0 ? `Hashtags: ${hashtags.join(", ")}` : null,
        keywords.length > 0 ? `Keywords: ${keywords.join(", ")}` : null,
        rules.length > 0 ? `Account Rules:\n${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");

      if (memoryContent) {
        await extractFromAction({
          type: "content_preference",
          content: `Account profile updated:\n${memoryContent}`,
          accountId: selectedAccountId,
        });
      }

      toast.success("Profile saved and synced to memory");
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Get platforms text
  const platformsText = selectedAccount?.platforms?.join(" and ") || "TikTok/Instagram";

  // Build analysis prompt - simpler format that works better with the API
  const buildAnalysisPrompt = () => {
    let context = `Analyze current trends for short-form video content on ${platformsText}.`;

    if (hashtags.length > 0) {
      context += ` Focus on these hashtags: ${hashtags.join(", ")}.`;
    }

    if (keywords.length > 0) {
      context += ` Target keywords: ${keywords.join(", ")}.`;
    }

    if (rules.length > 0) {
      context += ` Account context: ${rules.join("; ")}.`;
    }

    return `${context}

Return a JSON object with exactly this structure (no markdown, just raw JSON):
{
  "summary": "A 2-3 sentence high-level summary of current trends relevant to this account",
  "keyInsights": ["insight1", "insight2", "insight3", "insight4"],
  "recommendedTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "recommendedHashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6"],
  "contentAngles": ["angle1", "angle2", "angle3", "angle4"],
  "actionItems": ["action1", "action2", "action3"]
}

Return ONLY the JSON object, no explanations or markdown.`;
  };

  // Helper to call a single model with streaming
  const callModel = async (model: string, prompt: string): Promise<string> => {
    console.log(`[Trends] Calling model: ${model}`);

    const response = await fetch(
      "https://ai-portal-dev.zetachain.com/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${identityToken}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Trends] API error for ${model}:`, response.status, errorText);
      throw new Error(`API error: ${response.status}`);
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
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    }

    console.log(`[Trends] Response from ${model}:`, content.substring(0, 200));
    return content;
  };

  // Generate trend analysis using multiple LLMs sequentially
  const generateAnalysis = async () => {
    if (!selectedAccountId) {
      toast.error("Please select an account first");
      return;
    }

    if (!identityToken) {
      toast.error("Not authenticated");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    // Pick 4 models for analysis (excluding embedding model)
    const modelIds = Object.keys(AVAILABLE_MODELS).filter(
      (id) => !id.includes("embedding")
    );
    const selectedModels = modelIds.sort(() => Math.random() - 0.5).slice(0, 4);

    const prompt = buildAnalysisPrompt();
    console.log("[Trends] Starting analysis with models:", selectedModels);

    try {
      // Step 1: Call each model sequentially and collect raw responses
      const modelResponses: { model: string; content: string }[] = [];

      for (const model of selectedModels) {
        try {
          toast.info(`Analyzing with ${AVAILABLE_MODELS[model]?.name || model}...`);
          const content = await callModel(model, prompt);
          modelResponses.push({ model, content });
        } catch (error) {
          console.error(`[Trends] Model ${model} failed:`, error);
          // Continue with other models
        }
      }

      if (modelResponses.length === 0) {
        throw new Error("All models failed to respond");
      }

      console.log(`[Trends] Got ${modelResponses.length} responses`);

      // Step 2: Parse JSON from each response
      const parsedResults: TrendAnalysis[] = [];

      for (const { model, content } of modelResponses) {
        try {
          // Try multiple JSON extraction approaches
          let jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
          if (jsonMatch) {
            parsedResults.push(JSON.parse(jsonMatch[1].trim()));
            continue;
          }

          jsonMatch = content.match(/```\s*([\s\S]*?)```/);
          if (jsonMatch) {
            try {
              parsedResults.push(JSON.parse(jsonMatch[1].trim()));
              continue;
            } catch {
              // Not valid JSON
            }
          }

          jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResults.push(JSON.parse(jsonMatch[0]));
            continue;
          }

          console.error(`[Trends] No JSON found in ${model} response`);
        } catch (error) {
          console.error(`[Trends] Failed to parse ${model} response:`, error);
        }
      }

      if (parsedResults.length === 0) {
        // If no JSON could be parsed, use a summarizer model to create analysis
        toast.info("Creating summary from raw responses...");

        const summaryPrompt = `Based on the following trend analysis responses, create a unified summary.

Raw responses:
${modelResponses.map((r, i) => `Response ${i + 1}:\n${r.content}`).join("\n\n---\n\n")}

Return a JSON object with this structure:
{
  "summary": "A 2-3 sentence summary",
  "keyInsights": ["insight1", "insight2", "insight3", "insight4"],
  "recommendedTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "recommendedHashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "contentAngles": ["angle1", "angle2", "angle3"],
  "actionItems": ["action1", "action2", "action3"]
}

Return ONLY the JSON.`;

        const summaryContent = await callModel("openai/gpt-4o-mini", summaryPrompt);
        const jsonMatch = summaryContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResults.push(JSON.parse(jsonMatch[0]));
        }
      }

      if (parsedResults.length === 0) {
        throw new Error("Could not generate analysis from any model");
      }

      // Step 3: Merge results from all successful parses
      const mergedAnalysis: TrendAnalysis = {
        summary: parsedResults[0].summary || "Analysis based on current social media trends.",
        keyInsights: [
          ...new Set(parsedResults.flatMap((r) => r.keyInsights || [])),
        ].slice(0, 6),
        recommendedTopics: [
          ...new Set(parsedResults.flatMap((r) => r.recommendedTopics || [])),
        ].slice(0, 8),
        recommendedHashtags: [
          ...new Set(parsedResults.flatMap((r) => r.recommendedHashtags || [])),
        ].slice(0, 10),
        contentAngles: [
          ...new Set(parsedResults.flatMap((r) => r.contentAngles || [])),
        ].slice(0, 6),
        actionItems: [
          ...new Set(parsedResults.flatMap((r) => r.actionItems || [])),
        ].slice(0, 5),
      };

      setAnalysis(mergedAnalysis);

      // Save to memory
      await extractFromAction({
        type: "chat_insight",
        content: `Trend analysis generated:\n${mergedAnalysis.summary}\n\nKey insights: ${mergedAnalysis.keyInsights.join(", ")}`,
        accountId: selectedAccountId,
      });

      toast.success(
        `Analysis complete (${parsedResults.length} models contributed)`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate analysis";
      setAnalysisError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-subsection text-foreground">Trend Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Configure your profile and get AI-powered trend insights
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Hashtags & Keywords
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hashtags */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                Hashtags
              </label>
              <TagInput
                tags={hashtags}
                onTagsChange={setHashtags}
                placeholder="Type hashtags and press space..."
                prefix="#"
              />
              <p className="text-xs text-muted-foreground">
                Add hashtags relevant to your niche. Press space, enter, or comma
                to add.
              </p>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
                Keywords
              </label>
              <TagInput
                tags={keywords}
                onTagsChange={setKeywords}
                placeholder="Type keywords and press space..."
              />
              <p className="text-xs text-muted-foreground">
                Add keywords that describe your content niche and topics.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rules Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Account Rules & Facts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RulesInput rules={rules} onRulesChange={setRules} />
            <p className="text-xs text-muted-foreground mt-3">
              Add rules or facts about your account that Jemma should always
              remember (like posting schedule, niche, style preferences).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="h-4 w-4" />
            </motion.div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? "Saving..." : "Save to Memory"}
        </Button>
      </div>

      {/* Generate Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Trend Analysis
            </CardTitle>
            <Button
              onClick={generateAnalysis}
              disabled={isAnalyzing}
              className="gap-2"
            >
              {isAnalyzing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-4 w-4" />
                </motion.div>
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isAnalyzing ? "Analyzing..." : "Generate Analysis"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Generates insights from 4 AI models based on your profile, metrics,
            and preferences.
          </p>
        </CardHeader>
        <CardContent>
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="h-8 w-8 text-muted-foreground" />
              </motion.div>
              <p className="mt-4 text-muted-foreground">
                Analyzing trends across multiple AI models...
              </p>
            </div>
          )}

          {analysisError && !isAnalyzing && (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{analysisError}</p>
              <Button variant="outline" onClick={generateAnalysis}>
                Try Again
              </Button>
            </div>
          )}

          {!analysis && !isAnalyzing && !analysisError && (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                Configure your hashtags, keywords, and rules above, then click
                &quot;Generate Analysis&quot; to get personalized trend insights.
              </p>
            </div>
          )}

          {analysis && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-primary mb-2">Summary</h4>
                <p className="text-sm">{analysis.summary}</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Key Insights */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Key Insights
                  </h4>
                  <ul className="space-y-2">
                    {analysis.keyInsights.map((insight, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="text-sm flex items-start gap-2"
                      >
                        <span className="text-primary font-bold">{idx + 1}.</span>
                        {insight}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Topics */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Recommended Topics
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.recommendedTopics.map((topic, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Badge variant="outline">{topic}</Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recommended Hashtags */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Hash className="h-4 w-4 text-blue-500" />
                    Recommended Hashtags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.recommendedHashtags.map((tag, idx) => (
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
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Content Angles
                  </h4>
                  <ul className="space-y-2">
                    {analysis.contentAngles.map((angle, idx) => (
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
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Items */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-3">Action Items</h4>
                <ul className="space-y-2">
                  {analysis.actionItems.map((item, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-sm flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-muted-foreground/50"
                      />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Regenerate */}
              <div className="flex justify-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={generateAnalysis}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Analysis
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
