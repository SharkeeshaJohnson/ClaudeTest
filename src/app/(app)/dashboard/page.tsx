"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Eye,
  Heart,
  Users,
  CheckCircle2,
  Circle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAccountStore } from "@/store/account-store";
import { cn } from "@/lib/utils";
import { taskService, metricsService, accountMetricService } from "@/lib/db/services";
import { useIdentityToken } from "@privy-io/react-auth";
import { toast } from "sonner";
import type { Task as TaskType } from "@/lib/db";

interface DashboardStats {
  weeklyViews: number;
  engagementRate: number;
  followers: number;
}

export default function DashboardPage() {
  const { selectedAccountId, accounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const { identityToken } = useIdentityToken();
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    weeklyViews: 0,
    engagementRate: 0,
    followers: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

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

      // Fetch latest metrics - use account's primary platform
      const account = accounts.find((a) => a.id === selectedAccountId);
      const platform = account?.platforms?.[0] || "instagram";
      const metrics = await metricsService.getAccountMetrics(selectedAccountId, { platform });
      const latestMetric = metrics[metrics.length - 1];

      setStats({
        weeklyViews: latestMetric?.totalViews || 0,
        engagementRate: latestMetric?.engagementRate || 0,
        followers: latestMetric?.followers || 0,
      });

      if (latestMetric) {
        setLastRefreshed(new Date(latestMetric.recordedAt));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  }, [selectedAccountId, accounts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Refresh profile data from social platforms
  const refreshProfile = async () => {
    if (!selectedAccount || !identityToken) return;

    setIsRefreshing(true);
    try {
      // Call the profile lookup API
      const response = await fetch("/api/profile-lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${identityToken}`,
        },
        body: JSON.stringify({
          tiktokUsername: selectedAccount.tiktokUsername,
          instagramUsername: selectedAccount.instagramUsername,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }

      const data = await response.json();
      const platform = selectedAccount.platforms?.[0] || "instagram";
      const profileData = platform === "tiktok" ? data.tiktok : data.instagram;

      if (profileData) {
        // Store as an account metric
        await accountMetricService.create({
          accountId: selectedAccount.id,
          platform,
          followers: profileData.followers || 0,
          totalViews: 0,
          totalLikes: profileData.totalLikes || 0,
          totalComments: 0,
          totalShares: 0,
          engagementRate: 0,
        });

        // Update stats immediately
        setStats((prev) => ({
          ...prev,
          followers: profileData.followers || 0,
        }));

        setLastRefreshed(new Date());
        toast.success("Profile data refreshed!");
      } else {
        toast.error("Could not fetch profile data. The profile may be private or not found.");
      }
    } catch (error) {
      console.error("Failed to refresh profile:", error);
      toast.error("Failed to refresh profile data");
    } finally {
      setIsRefreshing(false);
    }
  };

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
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      title: "Engagement Rate",
      value: `${stats.engagementRate}%`,
      icon: Heart,
      change: "+0.5%",
      gradient: "from-rose-500 to-pink-500",
    },
    {
      title: "Followers",
      value: stats.followers.toLocaleString(),
      icon: Users,
      change: "+48",
      gradient: "from-teal-500 to-cyan-500",
      refreshable: true,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-display-sm">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {selectedAccount
              ? `Managing @${selectedAccount.tiktokUsername || selectedAccount.instagramUsername || selectedAccount.name}`
              : "Select an account to get started"}
          </p>
        </div>
        {lastRefreshed && (
          <p className="text-xs text-muted-foreground/70">
            Last updated: {lastRefreshed.toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-black/5 transition-all duration-300">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} text-white`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                {stat.refreshable ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={refreshProfile}
                    disabled={isRefreshing}
                    title="Refresh profile data"
                  >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">{stat.title}</p>
                <div className="text-3xl font-display font-semibold tracking-tight">{stat.value}</div>
                <p className="text-xs text-emerald-500 font-medium mt-1">{stat.change} from last week</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Today's Tasks */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            Today&apos;s Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 mb-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-muted-foreground">
                No tasks for today. Great job!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-all duration-200",
                    task.status === "completed"
                      ? "bg-muted/30 border-border/30"
                      : "border-border/50 hover:border-border hover:bg-accent/30"
                  )}
                >
                  <Checkbox
                    checked={task.status === "completed"}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium truncate",
                        task.status === "completed" && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs px-2 py-0">
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
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-display font-medium mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/content-studio">
            <Card className="group cursor-pointer border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Content Studio</h3>
                  <p className="text-sm text-muted-foreground">
                    Create with Jemma
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/trends">
            <Card className="group cursor-pointer border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Explore Trends</h3>
                  <p className="text-sm text-muted-foreground">
                    See what&apos;s viral
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/ideas">
            <Card className="group cursor-pointer border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Saved Ideas</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse your collection
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
