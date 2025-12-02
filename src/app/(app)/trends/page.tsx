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
import { useTrendAnalysis } from "@/store/trends-store";
import { toast } from "sonner";
import { useIdentityToken } from "@privy-io/react-auth";
import { profileService, accountMetricService, ideaService } from "@/lib/db/services";
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
// Tag Input Component (for hashtags - splits on space/comma)
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
// Keywords Input Component (allows full sentences - only splits on Enter)
// ============================================================================

function KeywordsInput({
  keywords,
  onKeywordsChange,
}: {
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
}) {
  const [newKeyword, setNewKeyword] = useState("");

  const addKeyword = () => {
    const trimmed = newKeyword.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      onKeywordsChange([...keywords, trimmed]);
      setNewKeyword("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  const removeKeyword = (index: number) => {
    onKeywordsChange(keywords.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {/* Existing keywords as removable items */}
      {keywords.length > 0 && (
        <div className="space-y-1.5">
          {keywords.map((keyword, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg group"
            >
              <span className="flex-1 text-sm">{keyword}</span>
              <button
                type="button"
                onClick={() => removeKeyword(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input for new keyword */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a keyword or phrase and press Enter..."
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addKeyword}
          disabled={!newKeyword.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
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
            className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg group"
          >
            <span className="text-muted-foreground text-sm">
              {index + 1}.
            </span>
            <span className="flex-1 text-sm">{rule}</span>
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

  // Analysis state (persisted in global store)
  const {
    analysis,
    isAnalyzing,
    progress: analysisProgress,
    error: analysisError,
    setAnalysis,
    setIsAnalyzing,
    setProgress: setAnalysisProgress,
    setError: setAnalysisError,
  } = useTrendAnalysis(selectedAccountId);
  const [isSavingToIdeas, setIsSavingToIdeas] = useState(false);

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

  // Build analysis prompt - comprehensive prompt for better LLM responses
  const buildAnalysisPrompt = () => {
    // Get latest metrics for context
    const latestMetric = metrics[metrics.length - 1];
    const metricsContext = latestMetric
      ? `Current account metrics: ${latestMetric.followers?.toLocaleString() || 0} followers, ${latestMetric.engagementRate || 0}% engagement rate, ${latestMetric.totalViews?.toLocaleString() || 0} total views.`
      : "";

    const prompt = `You are a senior marketing executive with deep expertise in social media strategy and content creation. You have been tasked to analyze trends and provide strategic insights for a content creator on ${platformsText}.

${hashtags.length > 0 ? `**Tracked Hashtags:**
${hashtags.map(h => `- ${h}`).join("\n")}

` : ""}${keywords.length > 0 ? `**Target Keywords & Topics:**
${keywords.map(k => `- ${k}`).join("\n")}

` : ""}${rules.length > 0 ? `**Account Rules & Context:**
${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

` : ""}${metricsContext ? `**Account Performance:**
${metricsContext}

` : ""}**Your Task:**
Run a comprehensive analysis of all trending posts, content, news, and discussions related to each of the hashtags and keywords provided above. Your analysis should:

1. Identify what's currently viral and gaining traction in these niches
2. Analyze successful content patterns and formats
3. Discover emerging trends before they peak
4. Consider the account's specific rules and context for personalized recommendations
5. Factor in the account's current performance metrics when providing advice

This should NOT be a high-level summary. Provide a THOROUGH, data-driven analysis with specific, actionable insights. Include relevant metrics, statistics, and specific examples where applicable.

Return your analysis as a JSON object with exactly this structure (no markdown, just raw JSON):
{
  "summary": "A detailed 3-4 sentence executive summary of key findings and the current landscape for this creator's niche",
  "keyInsights": ["Specific insight with data/examples #1", "Specific insight #2", "Specific insight #3", "Specific insight #4", "Specific insight #5", "Specific insight #6"],
  "recommendedTopics": ["Specific topic idea #1", "Topic #2", "Topic #3", "Topic #4", "Topic #5", "Topic #6", "Topic #7", "Topic #8"],
  "recommendedHashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8"],
  "contentAngles": ["Specific creative angle with hook idea #1", "Angle #2", "Angle #3", "Angle #4", "Angle #5"],
  "actionItems": ["Specific action with timeline #1", "Action #2", "Action #3", "Action #4", "Action #5"]
}

Return ONLY the JSON object, no explanations or markdown.`;

    return prompt;
  };

  // Helper to call a single model with streaming and retry
  const callModel = async (model: string, prompt: string, retries = 2): Promise<string> => {
    console.log(`[Trends] Calling model: ${model}`);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
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
          if (attempt < retries) {
            console.log(`[Trends] Retrying ${model}... (attempt ${attempt + 2})`);
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          throw new Error(`API error: ${response.status}`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let content = "";
        let buffer = ""; // Buffer for incomplete lines

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Use stream: true to handle multi-byte chars across chunks
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process complete lines only
            const lines = buffer.split("\n");
            // Keep the last potentially incomplete line in buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith("data: ")) {
                const data = trimmedLine.slice(6);
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content || "";
                  content += delta;
                } catch {
                  // Skip invalid JSON chunks
                }
              }
            }
          }

          // Process any remaining data in buffer
          if (buffer.trim().startsWith("data: ")) {
            const data = buffer.trim().slice(6);
            if (data !== "[DONE]") {
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

        console.log(`[Trends] Response from ${model}:`, content.substring(0, 200));
        return content;
      } catch (error) {
        if (attempt < retries) {
          console.log(`[Trends] Network error for ${model}, retrying... (attempt ${attempt + 2})`);
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw error;
      }
    }
    throw new Error("Max retries exceeded");
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
    setAnalysisProgress(null);

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

      for (let i = 0; i < selectedModels.length; i++) {
        const model = selectedModels[i];
        const modelName = AVAILABLE_MODELS[model]?.name || model;

        setAnalysisProgress({
          current: i + 1,
          total: selectedModels.length,
          currentModel: modelName,
          status: "Querying model...",
        });

        try {
          const content = await callModel(model, prompt);
          modelResponses.push({ model, content });

          setAnalysisProgress({
            current: i + 1,
            total: selectedModels.length,
            currentModel: modelName,
            status: "Response received",
          });
        } catch (error) {
          console.error(`[Trends] Model ${model} failed:`, error);
          setAnalysisProgress({
            current: i + 1,
            total: selectedModels.length,
            currentModel: modelName,
            status: "Failed, continuing...",
          });
          // Continue with other models
        }
      }

      if (modelResponses.length === 0) {
        throw new Error("All models failed to respond");
      }

      console.log(`[Trends] Got ${modelResponses.length} responses`);

      setAnalysisProgress({
        current: selectedModels.length,
        total: selectedModels.length,
        currentModel: "Processing",
        status: "Parsing responses...",
      });

      // Step 2: Parse JSON from each response
      const parsedResults: TrendAnalysis[] = [];

      for (const { model, content } of modelResponses) {
        try {
          // Try multiple JSON extraction approaches
          let jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[1].trim());
            if (parsed.summary || parsed.keyInsights) {
              parsedResults.push(parsed);
              continue;
            }
          }

          jsonMatch = content.match(/```\s*([\s\S]*?)```/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[1].trim());
              if (parsed.summary || parsed.keyInsights) {
                parsedResults.push(parsed);
                continue;
              }
            } catch {
              // Not valid JSON
            }
          }

          // Try to find JSON object - be more careful with nested braces
          const jsonStart = content.indexOf('{');
          if (jsonStart !== -1) {
            // Find matching closing brace
            let braceCount = 0;
            let jsonEnd = -1;
            for (let i = jsonStart; i < content.length; i++) {
              if (content[i] === '{') braceCount++;
              if (content[i] === '}') braceCount--;
              if (braceCount === 0) {
                jsonEnd = i + 1;
                break;
              }
            }
            if (jsonEnd !== -1) {
              const jsonStr = content.substring(jsonStart, jsonEnd);
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.summary || parsed.keyInsights) {
                  parsedResults.push(parsed);
                  continue;
                }
              } catch {
                // Try cleaning up common issues
                const cleaned = jsonStr
                  .replace(/,\s*}/g, '}')  // Remove trailing commas
                  .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
                  .replace(/[\x00-\x1F\x7F]/g, ' '); // Remove control characters
                try {
                  const parsed = JSON.parse(cleaned);
                  if (parsed.summary || parsed.keyInsights) {
                    parsedResults.push(parsed);
                    continue;
                  }
                } catch {
                  // Still failed
                }
              }
            }
          }

          console.error(`[Trends] No valid JSON found in ${model} response`);
        } catch (error) {
          console.error(`[Trends] Failed to parse ${model} response:`, error);
        }
      }

      if (parsedResults.length === 0) {
        // If no JSON could be parsed, use a summarizer model to create analysis
        setAnalysisProgress({
          current: selectedModels.length,
          total: selectedModels.length,
          currentModel: "GPT-4o Mini",
          status: "Creating summary from raw responses...",
        });

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

      setAnalysisProgress({
        current: selectedModels.length,
        total: selectedModels.length,
        currentModel: "Finalizing",
        status: "Merging insights...",
      });

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
      setAnalysisProgress(null);
    }
  };

  // Save analysis to Ideas
  const saveToIdeas = async () => {
    if (!analysis || !selectedAccountId) return;

    setIsSavingToIdeas(true);
    try {
      // Create a formatted description from the analysis
      const description = [
        `**Summary:** ${analysis.summary}`,
        "",
        `**Key Insights:**`,
        ...analysis.keyInsights.map((i, idx) => `${idx + 1}. ${i}`),
        "",
        `**Content Angles:**`,
        ...analysis.contentAngles.map((a) => `• ${a}`),
        "",
        `**Action Items:**`,
        ...analysis.actionItems.map((a) => `• ${a}`),
      ].join("\n");

      // Create tags from recommended topics and hashtags
      const tags = [
        "trend-analysis",
        ...analysis.recommendedTopics.slice(0, 3),
        ...analysis.recommendedHashtags.slice(0, 3),
      ];

      await ideaService.create({
        accountId: selectedAccountId,
        title: `Trend Analysis - ${new Date().toLocaleDateString()}`,
        description,
        priority: 4, // High priority since it's an AI-generated insight
        tags,
      });

      toast.success("Analysis saved to Ideas!");
    } catch (error) {
      console.error("Failed to save to ideas:", error);
      toast.error("Failed to save to Ideas");
    } finally {
      setIsSavingToIdeas(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Trend Analysis</h1>
          <p className="text-muted-foreground mt-1.5 font-normal text-sm">
            Configure your profile and discover insights
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
                Keywords & Phrases
              </label>
              <KeywordsInput
                keywords={keywords}
                onKeywordsChange={setKeywords}
              />
              <p className="text-xs text-muted-foreground">
                Add keywords, phrases, or full sentences that describe your niche. Press Enter to add.
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

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          variant="outline"
          className="gap-2 min-w-[180px] border-[#C8B8A6] text-[#3E3E3B] hover:bg-[#C8B8A6]/10"
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
        <Button
          onClick={generateAnalysis}
          disabled={isAnalyzing}
          className="gap-2 min-w-[180px] bg-[#BFA588] hover:bg-[#BFA588]/90 text-white"
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

      {/* Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Trend Analysis
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Insights from 4 AI models based on your profile, metrics, and preferences.
          </p>
        </CardHeader>
        <CardContent>
          {isAnalyzing && analysisProgress && (
            <div className="py-8 space-y-4">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Step {analysisProgress.current} of {analysisProgress.total}
                  </span>
                  <span className="font-medium">
                    {Math.round((analysisProgress.current / analysisProgress.total) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(analysisProgress.current / analysisProgress.total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Current status */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-4 w-4 text-primary" />
                </motion.div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{analysisProgress.currentModel}</p>
                  <p className="text-xs text-muted-foreground">{analysisProgress.status}</p>
                </div>
              </div>
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

              {/* Actions */}
              <div className="flex justify-center gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={generateAnalysis}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
                <Button
                  onClick={saveToIdeas}
                  disabled={isSavingToIdeas}
                  className="gap-2"
                >
                  {isSavingToIdeas ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <Lightbulb className="h-4 w-4" />
                  )}
                  {isSavingToIdeas ? "Saving..." : "Save to Ideas"}
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
