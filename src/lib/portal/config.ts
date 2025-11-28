/**
 * Portal API Configuration
 */

export const PORTAL_CONFIG = {
  baseUrl: "https://ai-portal-dev.zetachain.com",
  endpoints: {
    chat: "/api/v1/chat/completions",
    embeddings: "/api/v1/embeddings",
    models: "/api/v1/models",
    health: "/health",
  },
} as const;

// ============================================================================
// Model Definitions
// ============================================================================

export type TaskType = "creative" | "analysis" | "chat" | "memory" | "embedding";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  strengths: string[];
  costTier: "low" | "medium" | "high";
  speedTier: "fast" | "medium" | "slow";
}

// Available models through Portal API
export const AVAILABLE_MODELS: Record<string, ModelInfo> = {
  "anthropic/claude-3-5-sonnet-20241022": {
    id: "anthropic/claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Best for creative writing and conversational AI",
    strengths: ["Creative writing", "Nuanced tone", "Instruction following"],
    costTier: "medium",
    speedTier: "medium",
  },
  "openai/gpt-4o": {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "Best for analysis and structured output",
    strengths: ["Analytical reasoning", "JSON output", "Fast"],
    costTier: "high",
    speedTier: "fast",
  },
  "openai/gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Cost-effective for simpler tasks",
    strengths: ["Fast responses", "Cost-effective", "Good for short content"],
    costTier: "low",
    speedTier: "fast",
  },
  "google/gemini-1.5-pro": {
    id: "google/gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    description: "Large context window, good for trend analysis",
    strengths: ["Large context", "Trend analysis", "Multimodal"],
    costTier: "medium",
    speedTier: "medium",
  },
  "openai/text-embedding-3-small": {
    id: "openai/text-embedding-3-small",
    name: "Text Embedding 3 Small",
    provider: "OpenAI",
    description: "Efficient text embeddings",
    strengths: ["Fast", "Cost-effective", "Good quality"],
    costTier: "low",
    speedTier: "fast",
  },
};

// Default model selections by task type
export const DEFAULT_MODELS: Record<TaskType, string> = {
  creative: "anthropic/claude-3-5-sonnet-20241022",
  analysis: "openai/gpt-4o",
  chat: "anthropic/claude-3-5-sonnet-20241022",
  memory: "openai/gpt-4o-mini",
  embedding: "openai/text-embedding-3-small",
};

// Models available for user selection by task type
export const SELECTABLE_MODELS: Record<TaskType, string[]> = {
  creative: [
    "anthropic/claude-3-5-sonnet-20241022",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
  ],
  analysis: [
    "openai/gpt-4o",
    "anthropic/claude-3-5-sonnet-20241022",
    "google/gemini-1.5-pro",
  ],
  chat: [
    "anthropic/claude-3-5-sonnet-20241022",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
  ],
  memory: ["openai/gpt-4o-mini"], // Not user-selectable, runs in background
  embedding: ["openai/text-embedding-3-small"], // Not user-selectable
};

/**
 * Get the model to use for a task
 * Returns the user's selected model or the auto-selected default
 */
export function getModelForTask(
  taskType: TaskType,
  userSelection?: string | "auto"
): string {
  if (!userSelection || userSelection === "auto") {
    return DEFAULT_MODELS[taskType];
  }

  // Validate that the selected model is available for this task type
  if (SELECTABLE_MODELS[taskType].includes(userSelection)) {
    return userSelection;
  }

  // Fallback to default if invalid selection
  return DEFAULT_MODELS[taskType];
}

/**
 * Get display info for a model
 */
export function getModelInfo(modelId: string): ModelInfo | null {
  return AVAILABLE_MODELS[modelId] || null;
}

/**
 * Get all selectable models for a task type with their info
 */
export function getSelectableModelsForTask(
  taskType: TaskType
): Array<ModelInfo & { isDefault: boolean }> {
  const modelIds = SELECTABLE_MODELS[taskType];
  const defaultModel = DEFAULT_MODELS[taskType];

  return modelIds
    .map((id) => {
      const info = AVAILABLE_MODELS[id];
      if (!info) return null;
      return {
        ...info,
        isDefault: id === defaultModel,
      };
    })
    .filter((m): m is ModelInfo & { isDefault: boolean } => m !== null);
}
