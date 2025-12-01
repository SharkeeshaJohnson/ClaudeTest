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

// Available models through Portal API (updated from models.json)
export const AVAILABLE_MODELS: Record<string, ModelInfo> = {
  "anthropic/claude-sonnet-4-5-20250929": {
    id: "anthropic/claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "Best for creative writing and conversational AI",
    strengths: ["Creative writing", "Nuanced tone", "Instruction following"],
    costTier: "medium",
    speedTier: "medium",
  },
  "anthropic/claude-3-5-haiku-20241022": {
    id: "anthropic/claude-3-5-haiku-20241022",
    name: "Claude Haiku 3.5",
    provider: "Anthropic",
    description: "Fast and efficient for quick tasks",
    strengths: ["Fast", "Cost-effective", "Good for short content"],
    costTier: "low",
    speedTier: "fast",
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
  "grok/grok-3": {
    id: "grok/grok-3",
    name: "Grok 3",
    provider: "xAI",
    description: "Powerful reasoning and analysis",
    strengths: ["Reasoning", "Analysis", "Fast responses"],
    costTier: "medium",
    speedTier: "fast",
  },
  "fireworks/accounts/fireworks/models/deepseek-v3-0324": {
    id: "fireworks/accounts/fireworks/models/deepseek-v3-0324",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    description: "Large context window, good for trend analysis",
    strengths: ["Large context", "Trend analysis", "Cost-effective"],
    costTier: "low",
    speedTier: "medium",
  },
  "fireworks/accounts/fireworks/models/llama-v3p3-70b-instruct": {
    id: "fireworks/accounts/fireworks/models/llama-v3p3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "Meta",
    description: "Open source model with strong capabilities",
    strengths: ["Open source", "Good reasoning", "Cost-effective"],
    costTier: "low",
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
  creative: "anthropic/claude-sonnet-4-5-20250929",
  analysis: "openai/gpt-4o",
  chat: "anthropic/claude-sonnet-4-5-20250929",
  memory: "openai/gpt-4o-mini",
  embedding: "openai/text-embedding-3-small",
};

// Models available for user selection by task type
export const SELECTABLE_MODELS: Record<TaskType, string[]> = {
  creative: [
    "anthropic/claude-sonnet-4-5-20250929",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "grok/grok-3",
  ],
  analysis: [
    "openai/gpt-4o",
    "anthropic/claude-sonnet-4-5-20250929",
    "fireworks/accounts/fireworks/models/deepseek-v3-0324",
  ],
  chat: [
    "anthropic/claude-sonnet-4-5-20250929",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "grok/grok-3",
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
