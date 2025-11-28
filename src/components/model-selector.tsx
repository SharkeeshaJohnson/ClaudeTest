"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  getSelectableModelsForTask,
  getModelInfo,
  type TaskType,
} from "@/lib/portal/config";

// ============================================================================
// Types
// ============================================================================

interface ModelSelectorProps {
  taskType: TaskType;
  value: string;
  onChange: (value: string) => void;
  showDescription?: boolean;
  disabled?: boolean;
}

interface ModelIndicatorProps {
  modelId: string;
  className?: string;
}

// ============================================================================
// Model Selector Component
// ============================================================================

export function ModelSelector({
  taskType,
  value,
  onChange,
  showDescription = false,
  disabled = false,
}: ModelSelectorProps) {
  const models = getSelectableModelsForTask(taskType);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select model">
          {value === "auto" ? (
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Auto
            </span>
          ) : (
            getModelInfo(value)?.name || value
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="auto">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span>Auto</span>
              <Badge variant="secondary" className="text-xs">
                Recommended
              </Badge>
            </div>
            {showDescription && (
              <span className="text-xs text-muted-foreground">
                Automatically selects the best model
              </span>
            )}
          </div>
        </SelectItem>
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span>{model.name}</span>
                {model.isDefault && (
                  <Badge variant="outline" className="text-xs">
                    Default
                  </Badge>
                )}
              </div>
              {showDescription && (
                <span className="text-xs text-muted-foreground">
                  {model.description}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// Model Indicator Component (shows which model was used)
// ============================================================================

export function ModelIndicator({ modelId, className }: ModelIndicatorProps) {
  const info = getModelInfo(modelId);

  if (!info) {
    return (
      <span className={`text-xs text-muted-foreground ${className || ""}`}>
        {modelId}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className || ""}`}>
      <span className="text-xs text-muted-foreground">Generated using</span>
      <Badge variant="outline" className="text-xs font-normal">
        {info.name}
      </Badge>
    </div>
  );
}

// ============================================================================
// Compact Model Selector (for inline use)
// ============================================================================

interface CompactModelSelectorProps {
  taskType: TaskType;
  value: string;
  onChange: (value: string) => void;
}

export function CompactModelSelector({
  taskType,
  value,
  onChange,
}: CompactModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const models = getSelectableModelsForTask(taskType);
  const currentModel = value === "auto" ? null : getModelInfo(value);

  return (
    <Select value={value} onValueChange={onChange} open={isOpen} onOpenChange={setIsOpen}>
      <SelectTrigger className="h-8 w-auto gap-1 border-none bg-transparent px-2 text-xs hover:bg-muted">
        <span className="text-muted-foreground">Model:</span>
        <SelectValue>
          {value === "auto" ? "Auto" : currentModel?.name || value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="auto" className="text-sm">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Auto (Recommended)
          </div>
        </SelectItem>
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id} className="text-sm">
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// Generation Result Banner
// ============================================================================

interface GenerationResultProps {
  modelId: string;
  latency?: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export function GenerationResult({
  modelId,
  latency,
  tokenUsage,
}: GenerationResultProps) {
  const info = getModelInfo(modelId);

  return (
    <div className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        <span>Generated using {info?.name || modelId}</span>
      </div>
      {latency && (
        <span className="border-l border-border pl-3">
          {(latency / 1000).toFixed(1)}s
        </span>
      )}
      {tokenUsage && (
        <span className="border-l border-border pl-3">
          {tokenUsage.totalTokens} tokens
        </span>
      )}
    </div>
  );
}
