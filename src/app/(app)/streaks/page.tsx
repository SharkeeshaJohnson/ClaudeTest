"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Trophy,
  Star,
  Zap,
  Target,
  Award,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAccountStore } from "@/store/account-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, subDays, isSameDay } from "date-fns";

interface StreakData {
  id: string;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  lastActivityDate: string | null;
}

interface Video {
  id: string;
  postedDate: string | null;
}

const milestones = [
  { days: 7, title: "First Week!", icon: "🎯", xp: 100 },
  { days: 14, title: "Two Weeks Strong!", icon: "💪", xp: 200 },
  { days: 30, title: "One Month!", icon: "🌟", xp: 500 },
  { days: 60, title: "Two Months!", icon: "🔥", xp: 1000 },
  { days: 100, title: "Century Club!", icon: "💯", xp: 2500 },
  { days: 365, title: "One Year Legend!", icon: "👑", xp: 10000 },
];

const levels = [
  { level: 1, minXP: 0, title: "Beginner" },
  { level: 2, minXP: 100, title: "Creator" },
  { level: 3, minXP: 300, title: "Rising Star" },
  { level: 4, minXP: 600, title: "Influencer" },
  { level: 5, minXP: 1000, title: "Trendsetter" },
  { level: 6, minXP: 2000, title: "Viral Master" },
  { level: 7, minXP: 5000, title: "Content King" },
  { level: 8, minXP: 10000, title: "Legend" },
];

export default function StreaksPage() {
  const { selectedAccountId, accounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  const isAiJourney = selectedAccount?.type === "ai_journey";
  const themeColor = isAiJourney ? "blue" : "orange";

  const fetchData = useCallback(async () => {
    if (!selectedAccountId) return;
    setIsLoading(true);

    try {
      // Fetch streak
      const streakRes = await fetch(`/api/streaks/${selectedAccountId}`);
      if (streakRes.ok) {
        const data = await streakRes.json();
        setStreak(data);
      }

      // Fetch videos for calendar heat map
      const videosRes = await fetch(
        `/api/videos?accountId=${selectedAccountId}&status=posted`
      );
      if (videosRes.ok) {
        const data = await videosRes.json();
        setVideos(data);
      }
    } catch (error) {
      console.error("Failed to fetch streak data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckIn = async () => {
    if (!selectedAccountId) return;

    try {
      const res = await fetch(`/api/streaks/${selectedAccountId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkin" }),
      });

      if (res.ok) {
        const data = await res.json();
        setStreak(data.streak);

        // Check for milestone
        const milestone = milestones.find(
          (m) => m.days === data.streak.currentStreak
        );
        if (milestone) {
          setShowConfetti(true);
          toast.success(`${milestone.icon} ${milestone.title}`, {
            description: `You earned ${milestone.xp} bonus XP!`,
          });
          setTimeout(() => setShowConfetti(false), 3000);
        } else {
          toast.success(`+${data.xpGained} XP earned!`);
        }
      }
    } catch (error) {
      toast.error("Failed to check in");
    }
  };

  // Calculate level
  const currentLevel = levels.reduce((acc, l) => {
    if ((streak?.totalXP || 0) >= l.minXP) return l;
    return acc;
  }, levels[0]);

  const nextLevel = levels.find((l) => l.minXP > (streak?.totalXP || 0));
  const xpToNextLevel = nextLevel
    ? nextLevel.minXP - (streak?.totalXP || 0)
    : 0;
  const xpProgress = nextLevel
    ? ((streak?.totalXP || 0) - currentLevel.minXP) /
      (nextLevel.minXP - currentLevel.minXP)
    : 1;

  // Generate heat map data (last 90 days)
  const heatMapDays = Array.from({ length: 90 }, (_, i) => {
    const date = subDays(new Date(), 89 - i);
    const hasPost = videos.some(
      (v) => v.postedDate && isSameDay(new Date(v.postedDate), date)
    );
    return { date, hasPost };
  });

  // Get achieved milestones
  const achievedMilestones = milestones.filter(
    (m) => (streak?.longestStreak || 0) >= m.days
  );

  return (
    <div className="space-y-6">
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              className="text-8xl"
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Streaks & Gamification</h1>
        <p className="text-muted-foreground">
          Track your posting streaks and earn XP
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Current Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card
            className={cn(
              "relative overflow-hidden",
              isAiJourney ? "border-blue-500/50" : "border-orange-500/50"
            )}
          >
            <div
              className={cn(
                "absolute inset-0 opacity-10",
                isAiJourney ? "bg-blue-500" : "bg-orange-500"
              )}
            />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <motion.p
                    className="text-5xl font-bold"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {streak?.currentStreak || 0}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">days</p>
                </div>
                <motion.div
                  animate={{
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Flame
                    className={cn(
                      "h-16 w-16",
                      isAiJourney ? "text-blue-500" : "text-orange-500"
                    )}
                  />
                </motion.div>
              </div>
              <Button
                onClick={handleCheckIn}
                className={cn(
                  "w-full mt-4",
                  isAiJourney
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-orange-500 hover:bg-orange-600"
                )}
              >
                <Zap className="h-4 w-4 mr-2" />
                Daily Check-in
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Best Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Longest Streak</p>
                  <p className="text-4xl font-bold">
                    {streak?.longestStreak || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">days</p>
                </div>
                <Trophy className="h-12 w-12 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* XP & Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="text-2xl font-bold">
                    {currentLevel.level} - {currentLevel.title}
                  </p>
                </div>
                <Star className="h-10 w-10 text-yellow-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{streak?.totalXP || 0} XP</span>
                  {nextLevel && (
                    <span className="text-muted-foreground">
                      {xpToNextLevel} to Level {nextLevel.level}
                    </span>
                  )}
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full",
                      isAiJourney ? "bg-blue-500" : "bg-orange-500"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Heat Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Posting History (Last 90 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {heatMapDays.map(({ date, hasPost }, idx) => (
              <motion.div
                key={date.toISOString()}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.005 }}
                className={cn(
                  "w-3 h-3 rounded-sm cursor-pointer",
                  hasPost
                    ? isAiJourney
                      ? "bg-blue-500"
                      : "bg-orange-500"
                    : "bg-muted"
                )}
                title={`${format(date, "MMM d, yyyy")}${hasPost ? " - Posted" : ""}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div
              className={cn(
                "w-3 h-3 rounded-sm",
                isAiJourney ? "bg-blue-500" : "bg-orange-500"
              )}
            />
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {milestones.map((milestone, idx) => {
              const achieved = (streak?.longestStreak || 0) >= milestone.days;
              return (
                <motion.div
                  key={milestone.days}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "p-4 rounded-lg border text-center transition-all",
                    achieved
                      ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50"
                      : "opacity-50"
                  )}
                >
                  <span className="text-3xl">{milestone.icon}</span>
                  <h4 className="font-semibold mt-2">{milestone.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {milestone.days} day streak
                  </p>
                  <Badge variant={achieved ? "default" : "secondary"} className="mt-2">
                    +{milestone.xp} XP
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* XP Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            How to Earn XP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">+5</p>
              <p className="text-sm text-muted-foreground">Daily Login</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">+50</p>
              <p className="text-sm text-muted-foreground">Post Video</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">+20</p>
              <p className="text-sm text-muted-foreground">Update Metrics</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">+10</p>
              <p className="text-sm text-muted-foreground">Streak Bonus/Day</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
