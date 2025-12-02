"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useIdentityToken } from "@privy-io/react-auth";
import { useChat } from "@reverbia/sdk/react";
import { getModelForTask, getModelInfo } from "@/lib/portal/config";
import { useData } from "@/components/providers/data-provider";
import { useMemoryExtractor } from "@/lib/memory";
import type { Account } from "@/lib/db";

// ============================================================================
// Jemma's System Prompt
// ============================================================================

const JEMMA_PERSONALITY = `You are Jemma, a personal social media strategist and AI assistant. Your personality is:
- **Warm**: You genuinely care about the user's success and speak with encouragement
- **Analytical**: You love diving into data and finding patterns that drive results
- **Creative**: You bring fresh ideas and unique angles to content strategy
- **Confident**: You give clear, decisive recommendations backed by knowledge

Your role is to:
1. Help users with content ideas and strategy
2. Provide trend analysis based on their tracked hashtags and keywords
3. Answer questions about social media growth and content creation
4. Give actionable recommendations tailored to their niche/interests
5. Be encouraging and helpful

IMPORTANT GUIDELINES:
- Be concise and practical - creators are busy
- Give numbered action items when providing recommendations
- When asked for trends analysis, use the user's tracked hashtags and keywords to provide relevant insights about current trends in their niche
- Generate creative content ideas based on their interests and tracked topics
- If the user has saved ideas, reference them when relevant
- Don't ask users to update metrics or go to other pages - just help them directly
- If asked about trends and the user has hashtags/keywords, analyze what's trending in those areas
- Be creative and specific with content suggestions - give them actual post ideas they can use`;

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
  profileData: string;
  trendsData: string;
  memoryContext: string;
}

export interface UseJemmaOptions {
  accountId?: string;
  conversationId?: string | null;
  onContextBuilt?: (context: JemmaContext) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export interface UseJemmaReturn {
  messages: JemmaMessage[];
  isLoading: boolean;
  currentModel: string;
  currentModelInfo: ReturnType<typeof getModelInfo>;
  conversationId: string | null;
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
  clearMessages: () => void;
  setModel: (model: string) => void;
  loadConversation: (conversationId: string) => Promise<void>;
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
      profileData: "No profile data",
      trendsData: "No trends analyzed",
      memoryContext: "",
    };
  }

  // Import services dynamically to avoid circular dependencies
  const { accountService } = await import("@/lib/db/services/accounts");
  const { videoService } = await import("@/lib/db/services/videos");
  const { accountMetricService } = await import("@/lib/db/services/metrics");
  const { ideaService } = await import("@/lib/db/services/ideas");
  const { profileService } = await import("@/lib/db/services/profile");
  const { trendReportService } = await import("@/lib/db/services/trends");

  const [account, videos, ideas, profile, trendReports] = await Promise.all([
    accountService.getById(accountId),
    videoService.getByAccountId(accountId, { limit: 20 }),
    ideaService.getByAccountId(accountId),
    profileService.getByAccountId(accountId),
    trendReportService.getByAccountId(accountId),
  ]);

  if (!account) {
    return {
      account: null,
      accountData: "Account not found",
      videoData: "No videos found",
      metricsData: "No metrics available",
      notesData: "No notes available",
      ideasData: "No ideas saved",
      profileData: "No profile data",
      trendsData: "No trends analyzed",
      memoryContext: "",
    };
  }

  // Get latest account metrics from the database
  const latestMetrics = await accountMetricService.getLatestByAccountId(accountId);

  // Build account data
  const accountData = JSON.stringify({
    name: account.name,
    platforms: account.platforms,
    tiktokUsername: account.tiktokUsername,
    instagramUsername: account.instagramUsername,
    currentMetrics: latestMetrics
      ? {
          platform: latestMetrics.platform,
          followers: latestMetrics.followers,
          totalLikes: latestMetrics.totalLikes,
          recordedAt: new Date(latestMetrics.recordedAt).toISOString(),
        }
      : null,
    metricsNote: latestMetrics
      ? "These are the most recent metrics recorded for this account."
      : "No metrics have been recorded yet. The user should refresh their profile data from the dashboard.",
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

  // Build profile data (hashtags, keywords, rules)
  const profileData = profile
    ? JSON.stringify({
        hashtags: profile.hashtags,
        keywords: profile.keywords,
        rules: profile.rules,
        note: "These are the user's tracked hashtags, target keywords/topics, and content rules they follow.",
      })
    : "No profile data configured";

  // Build trends data (latest trend analysis)
  const trendsData =
    trendReports.length > 0
      ? JSON.stringify({
          latestAnalysis: trendReports[0]?.content,
          analyzedAt: trendReports[0]?.generatedAt
            ? new Date(trendReports[0].generatedAt).toISOString()
            : null,
          note: "This is the most recent trends analysis run by the user.",
        })
      : "No trends analyzed yet";

  return {
    account,
    accountData,
    videoData,
    metricsData,
    notesData,
    ideasData,
    profileData,
    trendsData,
    memoryContext: "", // Will be populated by memory system in Phase 3
  };
}

function buildSystemPrompt(context: JemmaContext): string {
  return `${JEMMA_PERSONALITY}

ACCOUNT INFO:
${context.accountData}

USER'S NICHE & INTERESTS (use these for trend analysis and content ideas):
${context.profileData}

PREVIOUS TRENDS ANALYSIS (if available):
${context.trendsData}

USER'S SAVED IDEAS:
${context.ideasData}

${context.memoryContext ? `\nREMEMBERED CONTEXT:\n${context.memoryContext}` : ""}`;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useJemma(options: UseJemmaOptions = {}): UseJemmaReturn {
  const { identityToken } = useIdentityToken();
  const { settings } = useData();
  const { searchRelevantMemories, formatMemoriesForContext } = useMemoryExtractor();

  const [messages, setMessages] = useState<JemmaMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentModel, setCurrentModel] = useState(
    settings?.jemmaModel || "auto"
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    options.conversationId || null
  );
  const contextRef = useRef<JemmaContext | null>(null);
  const messageIdRef = useRef(0);
  // Use a ref to track streaming content for the onFinish callback (avoids stale closure)
  const streamingContentRef = useRef("");
  // Ref to track conversation ID for async callbacks
  const conversationIdRef = useRef<string | null>(options.conversationId || null);

  const resolvedModel = getModelForTask("chat", currentModel);
  const modelInfo = getModelInfo(resolvedModel);

  // Load conversation when conversationId changes
  useEffect(() => {
    async function loadConversationMessages() {
      if (!options.conversationId) {
        setMessages([]);
        setActiveConversationId(null);
        conversationIdRef.current = null;
        return;
      }

      const { conversationService } = await import("@/lib/db/services/conversations");
      const conversation = await conversationService.getById(options.conversationId);

      if (conversation) {
        const loadedMessages: JemmaMessage[] = conversation.messages.map((m, i) => ({
          id: `loaded-${i}`,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: m.timestamp,
        }));
        setMessages(loadedMessages);
        setActiveConversationId(conversation.id);
        conversationIdRef.current = conversation.id;
        messageIdRef.current = loadedMessages.length;
      }
    }

    loadConversationMessages();
  }, [options.conversationId]);

  // Helper to save message to conversation
  const saveMessageToConversation = useCallback(async (
    role: "user" | "assistant",
    content: string
  ) => {
    const { conversationService } = await import("@/lib/db/services/conversations");

    // If no conversation exists, create one
    if (!conversationIdRef.current && options.accountId) {
      const newConversation = await conversationService.create({
        accountId: options.accountId,
      });
      conversationIdRef.current = newConversation.id;
      setActiveConversationId(newConversation.id);
      options.onConversationCreated?.(newConversation.id);
    }

    // Save the message
    if (conversationIdRef.current) {
      await conversationService.addMessage(conversationIdRef.current, role, content);
    }
  }, [options]);

  const { isLoading, sendMessage: sdkSendMessage, stop } = useChat({
    baseUrl: "https://ai-portal-dev.zetachain.com",
    getToken: async () => identityToken || null,
    onData: (chunk) => {
      streamingContentRef.current += chunk;
      setStreamingContent(streamingContentRef.current);
    },
    onFinish: (response) => {
      // Try to get content from response, fall back to accumulated streaming content
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawContent = (response as any).choices?.[0]?.message?.content;
      const content = typeof rawContent === "string" && rawContent.trim()
        ? rawContent
        : streamingContentRef.current;

      // Only add message if we have content
      if (content && content.trim()) {
        const assistantMessage: JemmaMessage = {
          id: `msg-${++messageIdRef.current}`,
          role: "assistant",
          content,
          timestamp: Date.now(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          model: (response as any).model || resolvedModel,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          provider: (response as any).extra_fields?.provider,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Save assistant message to conversation
        saveMessageToConversation("assistant", content);
      } else {
        console.warn("Jemma: Empty response received", response);
      }

      // Reset streaming state
      streamingContentRef.current = "";
      setStreamingContent("");
    },
    onError: (error) => {
      console.error("Jemma chat error:", error);
      // Add error message so user knows something went wrong
      const errorMessage: JemmaMessage = {
        id: `msg-${++messageIdRef.current}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      streamingContentRef.current = "";
      setStreamingContent("");
    },
  });

  const sendMessage = useCallback(
    async (content: string) => {
      // Reset streaming state before new message
      streamingContentRef.current = "";
      setStreamingContent("");

      // Add user message immediately
      const userMessage: JemmaMessage = {
        id: `msg-${++messageIdRef.current}`,
        role: "user",
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Save user message to conversation (this may create a new conversation)
      await saveMessageToConversation("user", content);

      // Always rebuild context to get the latest data (hashtags, ideas, etc.)
      contextRef.current = await buildJemmaContext(options.accountId);

      // Search for relevant memories based on the user's message
      try {
        const memories = await searchRelevantMemories(content, 5);
        if (memories && memories.length > 0) {
          contextRef.current.memoryContext = formatMemoriesForContext(memories);
        }
      } catch (error) {
        console.error("Memory search failed:", error);
      }

      options.onContextBuilt?.(contextRef.current);

      // Build messages array with system prompt
      const systemPrompt = buildSystemPrompt(contextRef.current);

      // Format messages for SDK (content must be array of content parts)
      const formatContent = (text: string) => [{ type: "text" as const, text }];
      const chatMessages = [
        { role: "system" as const, content: formatContent(systemPrompt) },
        ...messages.map((m) => ({ role: m.role, content: formatContent(m.content) })),
        { role: "user" as const, content: formatContent(content) },
      ];

      // Send to Portal API
      await sdkSendMessage({
        messages: chatMessages,
        model: resolvedModel,
      });
    },
    [messages, options, resolvedModel, sdkSendMessage, searchRelevantMemories, formatMemoriesForContext, saveMessageToConversation]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingContent("");
    contextRef.current = null;
    setActiveConversationId(null);
    conversationIdRef.current = null;
  }, []);

  const setModel = useCallback((model: string) => {
    setCurrentModel(model);
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    const { conversationService } = await import("@/lib/db/services/conversations");
    const conversation = await conversationService.getById(conversationId);

    if (conversation) {
      const loadedMessages: JemmaMessage[] = conversation.messages.map((m, i) => ({
        id: `loaded-${i}`,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: m.timestamp,
      }));
      setMessages(loadedMessages);
      setActiveConversationId(conversation.id);
      conversationIdRef.current = conversation.id;
      messageIdRef.current = loadedMessages.length;
    }
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
    conversationId: activeConversationId,
    sendMessage,
    stop,
    clearMessages,
    setModel,
    loadConversation,
  };
}
