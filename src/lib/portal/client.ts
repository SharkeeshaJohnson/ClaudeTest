/**
 * Portal API Client
 *
 * This module provides a wrapper around the @reverbia/sdk for making
 * authenticated requests to the Portal API.
 */

import { useChat as usePortalChat } from "@reverbia/sdk/react";
import { postApiV1ChatCompletions, getApiV1Models } from "@reverbia/sdk";
import { PORTAL_CONFIG, getModelForTask, type TaskType } from "./config";

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  taskType?: TaskType;
  stream?: boolean;
  onData?: (chunk: string) => void;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency?: number;
  provider?: string;
}

// ============================================================================
// Non-streaming Chat Completion
// ============================================================================

export async function chatCompletion(
  options: ChatCompletionOptions,
  getToken: () => Promise<string | null>
): Promise<ChatCompletionResult> {
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required");
  }

  const model = options.model || getModelForTask(options.taskType || "chat");

  const response = await postApiV1ChatCompletions({
    baseUrl: PORTAL_CONFIG.baseUrl,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      model,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: [{ type: "text" as const, text: m.content }],
      })),
      stream: false,
    },
  });

  if (response.error) {
    throw new Error(response.error.error || "Chat completion failed");
  }

  const data = response.data;
  if (!data || typeof data === "string") {
    throw new Error("Unexpected response format");
  }

  const choice = data.choices?.[0];
  const rawContent = choice?.message?.content;
  // Extract text from content array or use as-is if string
  const content = Array.isArray(rawContent)
    ? rawContent.find((p) => p.type === "text")?.text || ""
    : typeof rawContent === "string"
      ? rawContent
      : "";

  return {
    content,
    model: data.model || model,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        }
      : undefined,
    latency: data.extra_fields?.latency,
    provider: data.extra_fields?.provider,
  };
}

// ============================================================================
// Fetch Available Models
// ============================================================================

export interface PortalModel {
  id: string;
  name?: string;
  ownedBy?: string;
  contextLength?: number;
  description?: string;
}

export async function fetchAvailableModels(
  getToken: () => Promise<string | null>
): Promise<PortalModel[]> {
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await getApiV1Models({
    baseUrl: PORTAL_CONFIG.baseUrl,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    query: {
      page_size: 100,
    },
  });

  if (response.error) {
    throw new Error(response.error.error || "Failed to fetch models");
  }

  const models = response.data?.data || [];

  return models.map((m) => ({
    id: m.id || "",
    name: m.name,
    ownedBy: m.owned_by,
    contextLength: m.context_length,
    description: m.description,
  }));
}

// ============================================================================
// Streaming Chat Hook Wrapper
// ============================================================================

export interface UsePortalChatOptions {
  getToken: () => Promise<string | null>;
  taskType?: TaskType;
  model?: string;
  onData?: (chunk: string) => void;
  onFinish?: (response: ChatCompletionResult) => void;
  onError?: (error: Error) => void;
}

export function usePortalChatWrapper(options: UsePortalChatOptions) {
  const { isLoading, sendMessage, stop } = usePortalChat({
    getToken: options.getToken,
    onData: options.onData,
    onFinish: (response) => {
      if (options.onFinish) {
        const choice = response.choices?.[0];
        const rawContent = choice?.message?.content;
        const content = Array.isArray(rawContent)
          ? rawContent.find((p) => p.type === "text")?.text || ""
          : typeof rawContent === "string"
            ? rawContent
            : "";
        options.onFinish({
          content,
          model: response.model || "",
          usage: response.usage
            ? {
                promptTokens: response.usage.prompt_tokens || 0,
                completionTokens: response.usage.completion_tokens || 0,
                totalTokens: response.usage.total_tokens || 0,
              }
            : undefined,
          latency: response.extra_fields?.latency,
          provider: response.extra_fields?.provider,
        });
      }
    },
    onError: options.onError,
  });

  const send = async (messages: ChatMessage[], modelOverride?: string) => {
    const model =
      modelOverride ||
      options.model ||
      getModelForTask(options.taskType || "chat");

    return sendMessage({
      messages: messages.map((m) => ({
        role: m.role,
        content: [{ type: "text" as const, text: m.content }],
      })),
      model,
    });
  };

  return {
    isLoading,
    sendMessage: send,
    stop,
  };
}

// ============================================================================
// Re-export the SDK's useChat for direct use
// ============================================================================

export { usePortalChat };
