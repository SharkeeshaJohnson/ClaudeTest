"use client";

/**
 * Memory Context Builder
 *
 * This module builds context from memories to inject into Jemma's prompts.
 */

import {
  extractConversationContext,
} from "@reverbia/sdk/react";

// ============================================================================
// Types
// ============================================================================

export interface MemoryContextOptions {
  includePreferences: boolean;
  includeLearnings: boolean;
  includeIdeas: boolean;
  maxMemories: number;
}

const DEFAULT_OPTIONS: MemoryContextOptions = {
  includePreferences: true,
  includeLearnings: true,
  includeIdeas: true,
  maxMemories: 15,
};

// ============================================================================
// Context Building Functions
// ============================================================================

/**
 * Build a search query from recent conversation messages
 */
export function buildSearchQueryFromConversation(
  messages: Array<{ role: string; content: string }>,
  maxMessages: number = 3
): string {
  return extractConversationContext(messages, maxMessages);
}

/**
 * Format retrieved memories into a context string
 */
export function formatMemoryContext(
  memories: Array<{
    type: string;
    namespace: string;
    key: string;
    value: string;
    rawEvidence: string;
    confidence: number;
    similarity?: number;
  }>,
  options: Partial<MemoryContextOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (memories.length === 0) {
    return "";
  }

  // Filter memories based on options
  let filtered = memories;

  if (!opts.includePreferences) {
    filtered = filtered.filter((m) => m.type !== "preference");
  }
  if (!opts.includeLearnings) {
    filtered = filtered.filter(
      (m) => m.type !== "skill" && m.type !== "constraint"
    );
  }
  if (!opts.includeIdeas) {
    filtered = filtered.filter((m) => m.type !== "project");
  }

  // Limit to max memories
  filtered = filtered.slice(0, opts.maxMemories);

  if (filtered.length === 0) {
    return "";
  }

  // Format memories into readable text
  const lines = filtered.map((m) => {
    const prefix = m.type.toUpperCase();
    return `[${prefix}] ${m.key}: ${m.value}`;
  });
  return lines.join("\n");
}

/**
 * Build a complete system message with memory context
 */
export function buildSystemMessageWithMemories(
  baseSystemPrompt: string,
  memories: Array<{
    type: string;
    namespace: string;
    key: string;
    value: string;
    rawEvidence: string;
    confidence: number;
    similarity?: number;
  }>
): string {
  if (memories.length === 0) {
    return baseSystemPrompt;
  }

  const memoryContext = memories
    .map((m) => `[${m.type.toUpperCase()}] ${m.key}: ${m.value}`)
    .join("\n");

  return `${baseSystemPrompt}

## Relevant Memories
${memoryContext}`;
}

/**
 * Categorize memories for structured display
 */
export function categorizeMemories(
  memories: Array<{
    type: string;
    namespace: string;
    key: string;
    value: string;
    confidence: number;
    similarity?: number;
  }>
): {
  preferences: typeof memories;
  learnings: typeof memories;
  ideas: typeof memories;
  other: typeof memories;
} {
  return {
    preferences: memories.filter((m) => m.type === "preference"),
    learnings: memories.filter(
      (m) => m.type === "skill" || m.type === "constraint"
    ),
    ideas: memories.filter((m) => m.type === "project"),
    other: memories.filter(
      (m) =>
        m.type !== "preference" &&
        m.type !== "skill" &&
        m.type !== "constraint" &&
        m.type !== "project"
    ),
  };
}

/**
 * Calculate memory relevance score for sorting
 */
export function calculateRelevanceScore(memory: {
  confidence: number;
  similarity?: number;
}): number {
  const confidenceWeight = 0.4;
  const similarityWeight = 0.6;

  const confidence = memory.confidence || 0.5;
  const similarity = memory.similarity || 0.5;

  return confidence * confidenceWeight + similarity * similarityWeight;
}

/**
 * Sort memories by relevance
 */
export function sortMemoriesByRelevance<
  T extends { confidence: number; similarity?: number }
>(memories: T[]): T[] {
  return [...memories].sort(
    (a, b) => calculateRelevanceScore(b) - calculateRelevanceScore(a)
  );
}

// ============================================================================
// Prompt Enhancement
// ============================================================================

/**
 * Enhance a prompt with relevant memories
 */
export async function enhancePromptWithMemories(
  basePrompt: string,
  searchQuery: string,
  searchMemories: (
    query: string,
    limit?: number,
    minSimilarity?: number
  ) => Promise<
    Array<{
      type: string;
      namespace: string;
      key: string;
      value: string;
      rawEvidence: string;
      confidence: number;
      similarity: number;
    }>
  >,
  options: Partial<MemoryContextOptions> = {}
): Promise<{ enhancedPrompt: string; memoriesUsed: number }> {
  try {
    const memories = await searchMemories(
      searchQuery,
      options.maxMemories || DEFAULT_OPTIONS.maxMemories,
      0.5
    );

    if (memories.length === 0) {
      return { enhancedPrompt: basePrompt, memoriesUsed: 0 };
    }

    const sorted = sortMemoriesByRelevance(memories);
    const memoryContext = formatMemoryContext(sorted, options);

    if (!memoryContext) {
      return { enhancedPrompt: basePrompt, memoriesUsed: 0 };
    }

    const enhancedPrompt = `${basePrompt}

RELEVANT MEMORIES FROM PAST INTERACTIONS:
${memoryContext}

Use these memories to provide more personalized and contextually relevant responses.`;

    return { enhancedPrompt, memoriesUsed: sorted.length };
  } catch (error) {
    console.error("Failed to enhance prompt with memories:", error);
    return { enhancedPrompt: basePrompt, memoriesUsed: 0 };
  }
}
