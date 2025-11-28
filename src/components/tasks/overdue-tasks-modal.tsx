"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccountStore } from "@/store/account-store";
import { toast } from "sonner";
import { format } from "date-fns";
import { taskService, videoMetricService, streakService, videoService } from "@/lib/db/services";
import type { Task } from "@/lib/db";

interface OverdueTasksModalProps {
  onAllCompleted?: () => void;
}

export function OverdueTasksModal({ onAllCompleted }: OverdueTasksModalProps) {
  const { selectedAccountId, accounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState({
    views: "",
    likes: "",
    comments: "",
    shares: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOverdueTasks = useCallback(async () => {
    if (!selectedAccountId) return;

    try {
      // First, generate any new tasks
      await taskService.generateMetricsUpdateTasks(selectedAccountId);

      // Then fetch all pending tasks
      const tasks = await taskService.getAll({
        accountId: selectedAccountId,
        status: "pending",
      });

      // Filter to only metrics_update tasks that are overdue
      const now = Date.now();
      const overdue = tasks.filter((task) => {
        if (task.type !== "metrics_update") return false;
        if (!task.dueDate) return false;
        return task.dueDate < now;
      });

      setOverdueTasks(overdue);
      setIsVisible(overdue.length > 0);
    } catch (error) {
      console.error("Failed to fetch overdue tasks:", error);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchOverdueTasks();
  }, [fetchOverdueTasks]);

  const currentTask = overdueTasks[currentTaskIndex];

  const handleSubmitMetrics = async () => {
    if (!currentTask?.videoId || !selectedAccountId) return;

    const views = parseInt(metrics.views);
    const likes = parseInt(metrics.likes);
    const comments = parseInt(metrics.comments);
    const shares = parseInt(metrics.shares);

    if (isNaN(views) || isNaN(likes) || isNaN(comments) || isNaN(shares)) {
      toast.error("Please enter valid numbers for all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the video to determine platform
      const video = await videoService.getById(currentTask.videoId);
      const platform = selectedAccount?.platforms?.[0] === "tiktok" ? "tiktok" : "instagram";

      // Save metrics
      await videoMetricService.create({
        videoId: currentTask.videoId,
        platform,
        views,
        likes,
        comments,
        shares,
      });

      // Mark task as completed
      await taskService.complete(currentTask.id);

      // Award XP for updating metrics
      await streakService.recordActivity(selectedAccountId, "metrics");

      toast.success("Metrics updated successfully!");

      // Move to next task or close
      if (currentTaskIndex < overdueTasks.length - 1) {
        setCurrentTaskIndex((prev) => prev + 1);
        setMetrics({ views: "", likes: "", comments: "", shares: "" });
      } else {
        setIsVisible(false);
        onAllCompleted?.();
      }
    } catch (error) {
      console.error("Failed to update metrics:", error);
      toast.error("Failed to update metrics");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!currentTask) return;

    // Snooze the task by moving due date to tomorrow
    try {
      const tomorrow = Date.now() + 24 * 60 * 60 * 1000;

      await taskService.update(currentTask.id, { dueDate: tomorrow });

      toast.info("Task snoozed until tomorrow");

      // Move to next task or close
      if (currentTaskIndex < overdueTasks.length - 1) {
        setCurrentTaskIndex((prev) => prev + 1);
        setMetrics({ views: "", likes: "", comments: "", shares: "" });
      } else {
        setIsVisible(false);
        onAllCompleted?.();
      }
    } catch (error) {
      console.error("Failed to snooze task:", error);
      toast.error("Failed to snooze task");
    }
  };

  if (!isVisible || !currentTask) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-card rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 text-white bg-primary">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-bold">Overdue Metrics Update</h2>
            </div>
            <p className="text-sm opacity-90 mt-1">
              {overdueTasks.length} task{overdueTasks.length > 1 ? "s" : ""}{" "}
              need your attention
            </p>
          </div>

          {/* Progress */}
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>
                Task {currentTaskIndex + 1} of {overdueTasks.length}
              </span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentTaskIndex + 1) / overdueTasks.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <Video className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{currentTask.title}</p>
                {currentTask.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentTask.description}
                  </p>
                )}
                {currentTask.dueDate && (
                  <p className="text-xs text-red-500 mt-2">
                    Due: {format(new Date(currentTask.dueDate), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>

            {/* Metrics Form */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="views" className="text-xs">
                  Views
                </Label>
                <Input
                  id="views"
                  type="number"
                  placeholder="0"
                  value={metrics.views}
                  onChange={(e) =>
                    setMetrics((prev) => ({ ...prev, views: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="likes" className="text-xs">
                  Likes
                </Label>
                <Input
                  id="likes"
                  type="number"
                  placeholder="0"
                  value={metrics.likes}
                  onChange={(e) =>
                    setMetrics((prev) => ({ ...prev, likes: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="comments" className="text-xs">
                  Comments
                </Label>
                <Input
                  id="comments"
                  type="number"
                  placeholder="0"
                  value={metrics.comments}
                  onChange={(e) =>
                    setMetrics((prev) => ({
                      ...prev,
                      comments: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="shares" className="text-xs">
                  Shares
                </Label>
                <Input
                  id="shares"
                  type="number"
                  placeholder="0"
                  value={metrics.shares}
                  onChange={(e) =>
                    setMetrics((prev) => ({ ...prev, shares: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t flex gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
              disabled={isSubmitting}
            >
              Snooze 1 Day
            </Button>
            <Button
              onClick={handleSubmitMetrics}
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Metrics
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
