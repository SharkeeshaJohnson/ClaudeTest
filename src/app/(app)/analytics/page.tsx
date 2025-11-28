"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Users,
  Plus,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccountStore } from "@/store/account-store";
import { cn } from "@/lib/utils";
import { MetricsInputDialog } from "@/components/analytics/metrics-input-dialog";
import { VideoMetricsDialog } from "@/components/analytics/video-metrics-dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { metricsService, videoService, exportService } from "@/lib/db/services";
import type { AccountMetric, Video, VideoMetric } from "@/lib/db";

interface VideoWithMetrics extends Video {
  metrics: VideoMetric[];
}

export default function AnalyticsPage() {
  const { selectedAccountId, accounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const [platform, setPlatform] = useState<"tiktok" | "instagram">("tiktok");
  const [accountMetrics, setAccountMetrics] = useState<AccountMetric[]>([]);
  const [videos, setVideos] = useState<VideoWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoWithMetrics | null>(null);

  const isAiJourney = selectedAccount?.type === "ai_journey";
  const themeColor = isAiJourney ? "#3B82F6" : "#F97316";

  const fetchData = useCallback(async () => {
    if (!selectedAccountId) return;
    setIsLoading(true);

    try {
      // Fetch account metrics
      const metricsData = await metricsService.getAccountMetrics(selectedAccountId, { platform });
      setAccountMetrics(metricsData);

      // Fetch videos with metrics
      const videosData = await videoService.getAll({
        accountId: selectedAccountId,
        status: "posted"
      });

      // Get metrics for each video
      const videosWithMetrics: VideoWithMetrics[] = await Promise.all(
        videosData.map(async (video) => {
          const metrics = await metricsService.getVideoMetrics(video.id);
          return { ...video, metrics };
        })
      );

      setVideos(videosWithMetrics);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId, platform]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate stats
  const latestMetric = accountMetrics[accountMetrics.length - 1];
  const previousMetric = accountMetrics[accountMetrics.length - 2];

  const followerGrowth =
    latestMetric && previousMetric
      ? latestMetric.followers - previousMetric.followers
      : 0;

  const totalVideoViews = videos.reduce((sum, v) => {
    const metric = v.metrics.find((m) => m.platform === platform);
    return sum + (metric?.views || 0);
  }, 0);

  const totalEngagement = videos.reduce((sum, v) => {
    const metric = v.metrics.find((m) => m.platform === platform);
    return (
      sum +
      (metric?.likes || 0) +
      (metric?.comments || 0) +
      (metric?.shares || 0)
    );
  }, 0);

  // Chart data
  const chartData = accountMetrics.map((m) => ({
    date: format(new Date(m.recordedAt), "MMM d"),
    followers: m.followers,
    views: m.totalViews || 0,
    engagement:
      (m.totalLikes || 0) + (m.totalComments || 0) + (m.totalShares || 0),
  }));

  const handleMetricsSaved = () => {
    fetchData();
  };

  // Top videos by views
  const topVideos = [...videos]
    .map((v) => {
      const metric = v.metrics.find((m) => m.platform === platform);
      return {
        ...v,
        totalViews: metric?.views || 0,
        totalEngagement:
          (metric?.likes || 0) +
          (metric?.comments || 0) +
          (metric?.shares || 0),
      };
    })
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 5);

  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Followers",
      "Views",
      "Likes",
      "Comments",
      "Shares",
    ];
    const rows = accountMetrics.map((m) => [
      format(new Date(m.recordedAt), "yyyy-MM-dd"),
      m.followers,
      m.totalViews || 0,
      m.totalLikes || 0,
      m.totalComments || 0,
      m.totalShares || 0,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${selectedAccount?.name}-${platform}.csv`;
    a.click();
  };

  const handleExportJSON = async () => {
    if (!selectedAccountId) return;

    try {
      const exportData = await exportService.exportAccount(selectedAccountId);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smcc-export-${selectedAccount?.name || "account"}-${format(new Date(), "yyyy-MM-dd")}.json`;
      a.click();
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Failed to export data:", error);
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-subsection text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={handleExportJSON}>
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button
            onClick={() => setIsAccountDialogOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Metrics
          </Button>
        </div>
      </div>

      {/* Platform Tabs */}
      <Tabs
        value={platform}
        onValueChange={(v) => setPlatform(v as "tiktok" | "instagram")}
      >
        <TabsList>
          <TabsTrigger value="tiktok">TikTok</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
        </TabsList>

        <TabsContent value={platform} className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Followers
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {latestMetric?.followers.toLocaleString() || 0}
                  </div>
                  <div className="flex items-center text-xs">
                    {followerGrowth >= 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-green-500">
                          +{followerGrowth}
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                        <span className="text-red-500">{followerGrowth}</span>
                      </>
                    )}
                    <span className="text-muted-foreground ml-1">
                      since last update
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Views
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalVideoViews.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across {videos.length} videos
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Engagement
                  </CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalEngagement.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Likes, comments & shares
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg. Engagement Rate
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalVideoViews > 0
                      ? ((totalEngagement / totalVideoViews) * 100).toFixed(1)
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Engagement / Views
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Follower Growth</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="followers"
                        stroke={themeColor}
                        fill={themeColor}
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available. Add some metrics to get started.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="engagement"
                        stroke={themeColor}
                        strokeWidth={2}
                        dot={{ fill: themeColor }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available. Add some metrics to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Videos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Top Performing Videos
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVideoDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Update Video Metrics
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topVideos.length > 0 ? (
                <div className="space-y-4">
                  {topVideos.map((video, index) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedVideo(video);
                        setIsVideoDialogOpen(true);
                      }}
                    >
                      <span
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold",
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                            ? "bg-gray-400"
                            : index === 2
                            ? "bg-orange-600"
                            : "bg-muted-foreground"
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{video.title}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {video.totalViews.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {video.totalEngagement.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">{video.duration}s</Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No posted videos with metrics yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MetricsInputDialog
        open={isAccountDialogOpen}
        onOpenChange={setIsAccountDialogOpen}
        accountId={selectedAccountId}
        platform={platform}
        onSuccess={handleMetricsSaved}
      />

      <VideoMetricsDialog
        open={isVideoDialogOpen}
        onOpenChange={setIsVideoDialogOpen}
        videos={videos}
        selectedVideo={selectedVideo}
        platform={platform}
        onSuccess={handleMetricsSaved}
      />
    </div>
  );
}
