"use client";

import { useEffect, useState } from "react";
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

interface Task {
  id: string;
  title: string;
  type: string;
  dueDate: string;
  completed: boolean;
}

interface DashboardStats {
  weeklyViews: number;
  engagementRate: number;
  followers: number;
  currentStreak: number;
}

export default function DashboardPage() {
  const { selectedAccountId, accounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    weeklyViews: 0,
    engagementRate: 0,
    followers: 0,
    currentStreak: 0,
  });

  const isAiJourney = selectedAccount?.type === "ai_journey";
  const themeColor = isAiJourney ? "blue" : "orange";

  useEffect(() => {
    // TODO: Fetch actual tasks and stats from API
    // For now, using placeholder data
    setTasks([
      {
        id: "1",
        title: "Post daily content",
        type: "post_video",
        dueDate: new Date().toISOString(),
        completed: false,
      },
      {
        id: "2",
        title: "Update metrics for 'AI Coding Tips'",
        type: "update_metrics",
        dueDate: new Date().toISOString(),
        completed: false,
      },
    ]);

    setStats({
      weeklyViews: 12500,
      engagementRate: 4.2,
      followers: 2340,
      currentStreak: 7,
    });
  }, [selectedAccountId]);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {selectedAccount
              ? `Managing ${selectedAccount.name}`
              : "Select an account to get started"}
          </p>
        </div>

        {/* Streak Display */}
        <motion.div
          className={cn(
            "flex items-center gap-3 rounded-xl px-6 py-3",
            isAiJourney ? "bg-blue-500/10" : "bg-orange-500/10"
          )}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <Flame
              className={cn(
                "h-8 w-8",
                isAiJourney ? "text-blue-500" : "text-orange-500"
              )}
            />
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
            Today's Tasks
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
                    task.completed
                      ? "bg-muted/50 border-muted"
                      : "hover:bg-accent/50"
                  )}
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className={cn(
                      isAiJourney
                        ? "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                        : "data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    )}
                  />
                  <div className="flex-1">
                    <p
                      className={cn(
                        "font-medium",
                        task.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {task.type === "post_video" ? "Post" : "Metrics"}
                      </Badge>
                      {!task.completed && new Date(task.dueDate) < new Date() && (
                        <span className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                  {task.completed ? (
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
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className={cn(
                "rounded-full p-3",
                isAiJourney ? "bg-blue-500/10" : "bg-orange-500/10"
              )}
            >
              <Eye className={cn("h-6 w-6", isAiJourney ? "text-blue-500" : "text-orange-500")} />
            </div>
            <div>
              <h3 className="font-semibold">Generate Content</h3>
              <p className="text-sm text-muted-foreground">
                Create new content with AI assistance
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className={cn(
                "rounded-full p-3",
                isAiJourney ? "bg-blue-500/10" : "bg-orange-500/10"
              )}
            >
              <Heart className={cn("h-6 w-6", isAiJourney ? "text-blue-500" : "text-orange-500")} />
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
