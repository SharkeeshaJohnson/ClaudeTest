"use client";

/**
 * Memory Extraction Service
 *
 * This module handles transparent memory extraction from user actions.
 * Memories are extracted asynchronously after data is saved.
 */

import { useMemory, formatMemoriesForChat } from "@reverbia/sdk/react";
import { useIdentityToken } from "@privy-io/react-auth";
import { useCallback } from "react";
import { DEFAULT_MODELS } from "@/lib/portal/config";

// ============================================================================
// Types
// ============================================================================

export type MemoryType =
  | "video_learning"
  | "idea"
  | "metric_baseline"
  | "metric_progress"
  | "content_preference"
  | "chat_insight"
  | "calendar_pattern";

export interface MemoryInput {
  type: MemoryType;
  content: string;
  accountId: string;
}

// ============================================================================
// Memory Extraction Hook
// ============================================================================

export function useMemoryExtractor() {
  const { identityToken } = useIdentityToken();

  const { extractMemoriesFromMessage, searchMemories } = useMemory({
    memoryModel: DEFAULT_MODELS.memory,
    embeddingModel: DEFAULT_MODELS.embedding,
    generateEmbeddings: true,
    baseUrl: "https://ai-portal-dev.zetachain.com",
    getToken: async () => identityToken || null,
  });

  /**
   * Extract memories from a user action
   * This runs in the background without blocking the UI
   */
  const extractFromAction = useCallback(
    async (input: MemoryInput) => {
      try {
        // Format the content for memory extraction
        const formattedMessage = formatMemoryMessage(input);

        await extractMemoriesFromMessage({
          messages: [
            {
              role: "user",
              content: formattedMessage,
            },
          ],
          model: DEFAULT_MODELS.memory,
        });
      } catch (error) {
        // Silently fail - memory extraction is not critical
        console.error("Memory extraction failed:", error);
      }
    },
    [extractMemoriesFromMessage]
  );

  /**
   * Extract memories from video notes
   */
  const extractFromVideoNotes = useCallback(
    async (
      accountId: string,
      videoTitle: string,
      notes: {
        whatWorked?: string | null;
        whatDidnt?: string | null;
        tryNext?: string | null;
      }
    ) => {
      const parts: string[] = [];

      if (notes.whatWorked) {
        parts.push(`What worked well: ${notes.whatWorked}`);
      }
      if (notes.whatDidnt) {
        parts.push(`What didn't work: ${notes.whatDidnt}`);
      }
      if (notes.tryNext) {
        parts.push(`Ideas to try next: ${notes.tryNext}`);
      }

      if (parts.length === 0) return;

      await extractFromAction({
        type: "video_learning",
        content: `Video "${videoTitle}" learnings:\n${parts.join("\n")}`,
        accountId,
      });
    },
    [extractFromAction]
  );

  /**
   * Extract memories from an idea
   */
  const extractFromIdea = useCallback(
    async (
      accountId: string,
      idea: {
        title: string;
        description?: string | null;
        tags?: string[];
      }
    ) => {
      const content = [
        `Content idea: ${idea.title}`,
        idea.description ? `Description: ${idea.description}` : null,
        idea.tags && idea.tags.length > 0 ? `Tags: ${idea.tags.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      await extractFromAction({
        type: "idea",
        content,
        accountId,
      });
    },
    [extractFromAction]
  );

  /**
   * Extract memories from metrics input
   */
  const extractFromMetrics = useCallback(
    async (
      accountId: string,
      metricType: "account" | "video",
      data: {
        platform: string;
        followers?: number;
        views?: number;
        likes?: number;
        comments?: number;
        shares?: number;
        videoTitle?: string;
      }
    ) => {
      let content: string;

      if (metricType === "account") {
        content = `Account metrics update for ${data.platform}:\n` +
          `Followers: ${data.followers || 0}`;
      } else {
        content = `Video metrics for "${data.videoTitle}" on ${data.platform}:\n` +
          `Views: ${data.views || 0}, Likes: ${data.likes || 0}, ` +
          `Comments: ${data.comments || 0}, Shares: ${data.shares || 0}`;
      }

      await extractFromAction({
        type: metricType === "account" ? "metric_baseline" : "metric_progress",
        content,
        accountId,
      });
    },
    [extractFromAction]
  );

  /**
   * Extract memories from chat conversation
   */
  const extractFromChat = useCallback(
    async (
      accountId: string,
      messages: Array<{ role: string; content: string }>
    ) => {
      // Only extract from the last few exchanges
      const recentMessages = messages.slice(-6);

      await extractMemoriesFromMessage({
        messages: recentMessages,
        model: DEFAULT_MODELS.memory,
      });
    },
    [extractMemoriesFromMessage]
  );

  /**
   * Search for relevant memories
   */
  const searchRelevantMemories = useCallback(
    async (query: string, limit: number = 10) => {
      try {
        const memories = await searchMemories(query, limit, 0.5);
        return memories;
      } catch (error) {
        console.error("Memory search failed:", error);
        return [];
      }
    },
    [searchMemories]
  );

  /**
   * Format memories for inclusion in chat context
   */
  const formatMemoriesForContext = useCallback(
    (memories: Awaited<ReturnType<typeof searchMemories>>) => {
      if (memories.length === 0) return "";
      return formatMemoriesForChat(memories, "detailed");
    },
    []
  );

  return {
    extractFromAction,
    extractFromVideoNotes,
    extractFromIdea,
    extractFromMetrics,
    extractFromChat,
    searchRelevantMemories,
    formatMemoriesForContext,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatMemoryMessage(input: MemoryInput): string {
  const typeLabels: Record<MemoryType, string> = {
    video_learning: "Video Performance Learning",
    idea: "Content Idea",
    metric_baseline: "Account Metrics Baseline",
    metric_progress: "Video Performance Metrics",
    content_preference: "Content Preference",
    chat_insight: "Strategy Discussion Insight",
    calendar_pattern: "Content Calendar Pattern",
  };

  return `[${typeLabels[input.type]}]\n${input.content}`;
}
