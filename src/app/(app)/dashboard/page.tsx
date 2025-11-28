"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Heart,
  Users,
  Flame,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAccountStore } from "@/store/account-store";
import { cn } from "@/lib/utils";
import { taskService, metricsService, streakService } from "@/lib/db/services";
import type { Task as TaskType } from "@/lib/db";

interface DashboardStats {
  weeklyViews: number;
  engagementRate: number;
  followers: number;
  currentStreak: number;
}

export default function DashboardPage() {
  const { selectedAccountId, accounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    weeklyViews: 0,
    engagementRate: 0,
    followers: 0,
    currentStreak: 0,
  });

  const fetchData = useCallback(async () => {
    if (!selectedAccountId) return;

    try {
      // Fetch tasks
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const tasksData = await taskService.getAll({
        accountId: selectedAccountId,
        dueBefore: todayEnd.getTime(),
      });
      setTasks(tasksData);

      // Fetch latest metrics
      const metrics = await metricsService.getAccountMetrics(selectedAccountId, { platform: "tiktok" });
      const latestMetric = metrics[metrics.length - 1];

      // Fetch streak
      const streak = await streakService.getByAccountId(selectedAccountId);

      setStats({
        weeklyViews: latestMetric?.totalViews || 0,
        engagementRate: latestMetric?.engagementRate || 0,
        followers: latestMetric?.followers || 0,
        currentStreak: streak?.currentStreak || 0,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const toggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      await taskService.update(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      );
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const statCards = [
    {
      title: "Weekly Views",
      value: stats.weeklyViews.toLocaleString(),
      icon: Eye,
      change: "+12%",
    },
    {
      title: "Engagement Rate",
      value: `${stats.engagementRate}%`,
      icon: Heart,
      change: "+0.5%",
    },
    {
      title: "Followers",
      value: stats.followers.toLocaleString(),
      icon: Users,
      change: "+48",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-subsection text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {selectedAccount
              ? `Managing ${selectedAccount.name}`
              : "Select an account to get started"}
          </p>
        </div>

        {/* Streak Display */}
        <motion.div
          className="flex items-center gap-3 rounded-xl px-6 py-3 bg-primary/10"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <Flame className="h-8 w-8 text-primary" />
          </motion.div>
          <div>
            <p className="text-2xl font-bold">{stats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-500">{stat.change} from last week</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Today&apos;s Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No tasks for today. Great job!
            </p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                    task.status === "completed"
                      ? "bg-muted/50 border-muted"
                      : "hover:bg-accent/50"
                  )}
                >
                  <Checkbox
                    checked={task.status === "completed"}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1">
                    <p
                      className={cn(
                        "font-medium",
                        task.status === "completed" && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {task.type === "post_video" ? "Post" : "Metrics"}
                      </Badge>
                      {task.status !== "completed" && task.dueDate && new Date(task.dueDate) < new Date() && (
                        <span className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                  {task.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-xl p-3 bg-primary/10">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Generate Content</h3>
              <p className="text-sm text-muted-foreground">
                Create new content with AI assistance
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-xl p-3 bg-primary/10">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">View Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Check your latest performance metrics
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
