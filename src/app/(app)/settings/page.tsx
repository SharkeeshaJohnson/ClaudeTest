"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Bot,
  Sparkles,
  BarChart3,
  RotateCcw,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { settingsService } from "@/lib/db/services";
import {
  AVAILABLE_MODELS,
  SELECTABLE_MODELS,
  DEFAULT_MODELS,
  type ModelInfo,
} from "@/lib/portal/config";
import type { UserSettings } from "@/lib/db";

interface ModelOption extends ModelInfo {
  isDefault: boolean;
}

function getModelsForCategory(category: "chat" | "creative" | "analysis"): ModelOption[] {
  const modelIds = SELECTABLE_MODELS[category];
  const defaultModel = DEFAULT_MODELS[category];

  return modelIds
    .map((id) => {
      const info = AVAILABLE_MODELS[id];
      if (!info) return null;
      return {
        ...info,
        isDefault: id === defaultModel,
      };
    })
    .filter((m): m is ModelOption => m !== null);
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await settingsService.get();
      setSettings(data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleModelChange = async (
    field: "jemmaModel" | "creativeModel" | "analysisModel",
    value: string
  ) => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const updated = await settingsService.update({ [field]: value });
      setSettings(updated);
      toast.success("Setting saved");
    } catch (error) {
      console.error("Failed to save setting:", error);
      toast.error("Failed to save setting");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    setIsSaving(true);
    try {
      const updated = await settingsService.reset();
      setSettings(updated);
      toast.success("Settings reset to defaults");
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error("Failed to reset settings");
    } finally {
      setIsSaving(false);
    }
  };

  const chatModels = getModelsForCategory("chat");
  const creativeModels = getModelsForCategory("creative");
  const analysisModels = getModelsForCategory("analysis");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-subsection text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure Jemma AI and model preferences
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleResetToDefaults}
          disabled={isSaving}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>

      {/* Jemma Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Jemma AI Assistant
            </CardTitle>
            <CardDescription>
              Configure which AI model powers Jemma for chat and general assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jemma-model" className="flex items-center gap-2">
                Chat Model
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The AI model used for chat conversations with Jemma</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={settings?.jemmaModel || "auto"}
                onValueChange={(value) => handleModelChange("jemmaModel", value)}
                disabled={isSaving}
              >
                <SelectTrigger id="jemma-model" className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    <div className="flex items-center gap-2">
                      <span>Auto (Recommended)</span>
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    </div>
                  </SelectItem>
                  {chatModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({model.provider})
                        </span>
                        {model.isDefault && (
                          <Badge variant="outline" className="text-xs">Auto picks this</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Auto mode intelligently selects the best model based on your conversation
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Generation Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Content Generation
            </CardTitle>
            <CardDescription>
              Configure the AI model for generating video ideas, scripts, and captions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="creative-model" className="flex items-center gap-2">
                Creative Model
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Used for generating content ideas, scripts, and creative writing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={settings?.creativeModel || "auto"}
                onValueChange={(value) => handleModelChange("creativeModel", value)}
                disabled={isSaving}
              >
                <SelectTrigger id="creative-model" className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    <div className="flex items-center gap-2">
                      <span>Auto (Recommended)</span>
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    </div>
                  </SelectItem>
                  {creativeModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({model.provider})
                        </span>
                        {model.isDefault && (
                          <Badge variant="outline" className="text-xs">Auto picks this</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {creativeModels.map((model) => (
                  <div
                    key={model.id}
                    className="text-xs bg-muted p-2 rounded-md"
                  >
                    <span className="font-medium">{model.name}:</span>{" "}
                    {model.strengths.slice(0, 2).join(", ")}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Analysis Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Trend Analysis
            </CardTitle>
            <CardDescription>
              Configure the AI model for analyzing trends and providing insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="analysis-model" className="flex items-center gap-2">
                Analysis Model
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Used for trend analysis, performance insights, and data interpretation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={settings?.analysisModel || "auto"}
                onValueChange={(value) => handleModelChange("analysisModel", value)}
                disabled={isSaving}
              >
                <SelectTrigger id="analysis-model" className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    <div className="flex items-center gap-2">
                      <span>Auto (Recommended)</span>
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    </div>
                  </SelectItem>
                  {analysisModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({model.provider})
                        </span>
                        {model.isDefault && (
                          <Badge variant="outline" className="text-xs">Auto picks this</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {analysisModels.map((model) => (
                  <div
                    key={model.id}
                    className="text-xs bg-muted p-2 rounded-md"
                  >
                    <span className="font-medium">{model.name}:</span>{" "}
                    {model.strengths.slice(0, 2).join(", ")}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">About Model Selection</p>
                <p className="text-sm text-muted-foreground">
                  Each AI model has different strengths. Claude excels at creative writing and nuanced conversations,
                  GPT-4o is great for analysis and structured data, and Gemini handles large contexts well.
                  Auto mode (recommended) will intelligently select the best model for each task.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
