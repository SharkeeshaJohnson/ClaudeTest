"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useIdentityToken } from "@privy-io/react-auth";
import { useChat } from "@reverbia/sdk/react";
import { getModelForTask, getModelInfo } from "@/lib/portal/config";
import { useData } from "@/components/providers/data-provider";
import type { Account } from "@/lib/db";

// ============================================================================
// Jemma's System Prompt
// ============================================================================

const JEMMA_PERSONALITY = `You are Jemma, a personal social media strategist and consultant. Your personality is:
- **Warm**: You genuinely care about the user's success and speak with encouragement
- **Analytical**: You love diving into data and finding patterns that drive results
- **Creative**: You bring fresh ideas and unique angles to content strategy
- **Confident**: You give clear, decisive recommendations backed by data

Your role is to:
1. Analyze what content performs best for this specific creator
2. Identify patterns in successful vs unsuccessful content
3. Provide actionable, data-backed recommendations
4. Answer strategy questions with specific, tailored advice
5. Be encouraging but honest - celebrate wins and gently address areas for improvement

IMPORTANT GUIDELINES:
- Always reference the user's specific data when making suggestions
- Be concise and practical - creators are busy
- Give numbered action items when providing recommendations
- Use their account data to personalize every response
- If you notice trends in their performance, highlight them
- Suggest content ideas that align with what's already working for them`;

// ============================================================================
// Types
// ============================================================================

export interface JemmaMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  model?: string;
  provider?: string;
}

export interface JemmaContext {
  account: Account | null;
  accountData: string;
  videoData: string;
  metricsData: string;
  notesData: string;
  ideasData: string;
  memoryContext: string;
}

export interface UseJemmaOptions {
  accountId?: string;
  onContextBuilt?: (context: JemmaContext) => void;
}

export interface UseJemmaReturn {
  messages: JemmaMessage[];
  isLoading: boolean;
  currentModel: string;
  currentModelInfo: ReturnType<typeof getModelInfo>;
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
  clearMessages: () => void;
  setModel: (model: string) => void;
}

// ============================================================================
// Context Builder
// ============================================================================

async function buildJemmaContext(accountId?: string): Promise<JemmaContext> {
  if (!accountId) {
    return {
      account: null,
      accountData: "No account selected",
      videoData: "No videos found",
      metricsData: "No metrics available",
      notesData: "No notes available",
      ideasData: "No ideas saved",
      memoryContext: "",
    };
  }

  // Import services dynamically to avoid circular dependencies
  const { accountService } = await import("@/lib/db/services/accounts");
  const { videoService } = await import("@/lib/db/services/videos");
  const { accountMetricService } = await import("@/lib/db/services/metrics");
  const { ideaService } = await import("@/lib/db/services/ideas");
  const { streakService } = await import("@/lib/db/services/streaks");

  const [account, videos, ideas, streak] = await Promise.all([
    accountService.getById(accountId),
    videoService.getByAccountId(accountId, { limit: 20 }),
    ideaService.getByAccountId(accountId),
    streakService.getByAccountId(accountId),
  ]);

  if (!account) {
    return {
      account: null,
      accountData: "Account not found",
      videoData: "No videos found",
      metricsData: "No metrics available",
      notesData: "No notes available",
      ideasData: "No ideas saved",
      memoryContext: "",
    };
  }

  // Build account data
  const accountData = JSON.stringify({
    name: account.name,
    type: account.type,
    platforms: account.platforms,
    nicheKeywords: account.nicheKeywords,
    streak: {
      current: streak.currentStreak,
      longest: streak.longestStreak,
      totalXP: streak.totalXP,
    },
  });

  // Build video data
  const videoData =
    videos.length > 0
      ? JSON.stringify(
          videos.map((v) => ({
            title: v.title,
            status: v.status,
            duration: v.duration,
            postedDate: v.postedDate ? new Date(v.postedDate).toISOString() : null,
            latestMetrics: v.latestMetric
              ? {
                  platform: v.latestMetric.platform,
                  views: v.latestMetric.views,
                  likes: v.latestMetric.likes,
                  comments: v.latestMetric.comments,
                  shares: v.latestMetric.shares,
                }
              : null,
          }))
        )
      : "No videos found";

  // Build metrics summary
  const metricsSummary = await accountMetricService.getMetricsSummary(accountId);
  const metricsData = JSON.stringify({
    summary: metricsSummary,
    avgViews: metricsSummary.avgViews,
    avgEngagement: metricsSummary.avgEngagement,
    videoCount: metricsSummary.videoCount,
  });

  // Build notes data
  const notesData =
    videos.filter((v) => v.notes).length > 0
      ? JSON.stringify(
          videos
            .filter((v) => v.notes)
            .map((v) => ({
              video: v.title,
              whatWorked: v.notes?.whatWorked,
              whatDidnt: v.notes?.whatDidnt,
              tryNext: v.notes?.tryNext,
            }))
        )
      : "No notes available";

  // Build ideas data
  const ideasData =
    ideas.length > 0
      ? JSON.stringify(
          ideas.slice(0, 10).map((i) => ({
            title: i.title,
            description: i.description,
            priority: i.priority,
            status: i.status,
            tags: i.tags,
          }))
        )
      : "No ideas saved";

  return {
    account,
    accountData,
    videoData,
    metricsData,
    notesData,
    ideasData,
    memoryContext: "", // Will be populated by memory system in Phase 3
  };
}

function buildSystemPrompt(context: JemmaContext): string {
  return `${JEMMA_PERSONALITY}

ACCOUNT CONTEXT:
${context.accountData}

VIDEO HISTORY:
${context.videoData}

PERFORMANCE METRICS:
${context.metricsData}

NOTES & LEARNINGS:
${context.notesData}

IDEA BANK:
${context.ideasData}

${context.memoryContext ? `\nREMEMBERED CONTEXT:\n${context.memoryContext}` : ""}`;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useJemma(options: UseJemmaOptions = {}): UseJemmaReturn {
  const { identityToken } = useIdentityToken();
  const { settings } = useData();

  const [messages, setMessages] = useState<JemmaMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentModel, setCurrentModel] = useState(
    settings?.jemmaModel || "auto"
  );
  const contextRef = useRef<JemmaContext | null>(null);
  const messageIdRef = useRef(0);

  const resolvedModel = getModelForTask("chat", currentModel);
  const modelInfo = getModelInfo(resolvedModel);

  const { isLoading, sendMessage: sdkSendMessage, stop } = useChat({
    baseUrl: "https://ai-portal-dev.zetachain.com",
    getToken: async () => identityToken || null,
    onData: (chunk) => {
      setStreamingContent((prev) => prev + chunk);
    },
    onFinish: (response) => {
      const content = response.choices?.[0]?.message?.content || streamingContent;
      const assistantMessage: JemmaMessage = {
        id: `msg-${++messageIdRef.current}`,
        role: "assistant",
        content,
        timestamp: Date.now(),
        model: response.model || resolvedModel,
        provider: response.extra_fields?.provider,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    },
    onError: (error) => {
      console.error("Jemma chat error:", error);
      setStreamingContent("");
    },
  });

  const sendMessage = useCallback(
    async (content: string) => {
      // Add user message immediately
      const userMessage: JemmaMessage = {
        id: `msg-${++messageIdRef.current}`,
        role: "user",
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Build context if not already built or if account changed
      if (!contextRef.current) {
        contextRef.current = await buildJemmaContext(options.accountId);
        options.onContextBuilt?.(contextRef.current);
      }

      // Build messages array with system prompt
      const systemPrompt = buildSystemPrompt(contextRef.current);
      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content },
      ];

      // Send to Portal API
      await sdkSendMessage({
        messages: chatMessages,
        model: resolvedModel,
      });
    },
    [messages, options, resolvedModel, sdkSendMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingContent("");
    contextRef.current = null;
  }, []);

  const setModel = useCallback((model: string) => {
    setCurrentModel(model);
  }, []);

  // Include streaming content in the last message if loading
  const displayMessages = useMemo(() => {
    if (isLoading && streamingContent) {
      return [
        ...messages,
        {
          id: "streaming",
          role: "assistant" as const,
          content: streamingContent,
          timestamp: messages.length > 0 ? messages[messages.length - 1].timestamp + 1 : 0,
          model: resolvedModel,
        },
      ];
    }
    return messages;
  }, [isLoading, streamingContent, messages, resolvedModel]);

  return {
    messages: displayMessages,
    isLoading,
    currentModel,
    currentModelInfo: modelInfo,
    sendMessage,
    stop,
    clearMessages,
    setModel,
  };
}
