"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Instagram,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccountStore } from "@/store/account-store";
import { cn } from "@/lib/utils";
import { VideoDialog } from "@/components/calendar/video-dialog";
import { VideoDetailDialog } from "@/components/calendar/video-detail-dialog";

interface VideoItem {
  id: string;
  title: string;
  status: string;
  duration: number;
  scheduledDate: string | null;
  postedDate: string | null;
  account: {
    id: string;
    type: string;
  };
}

const statusColors: Record<string, string> = {
  planned: "bg-gray-500",
  filmed: "bg-yellow-500",
  edited: "bg-blue-500",
  posted: "bg-green-500",
};

const statusLabels: Record<string, string> = {
  planned: "Planned",
  filmed: "Filmed",
  edited: "Edited",
  posted: "Posted",
};

export default function CalendarPage() {
  const { selectedAccountId, accounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const isAiJourney = selectedAccount?.type === "ai_journey";

  const fetchVideos = useCallback(async () => {
    if (!selectedAccountId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/videos?accountId=${selectedAccountId}`);
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const getDaysInView = () => {
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const getVideosForDay = (day: Date) => {
    return videos.filter((video) => {
      const videoDate = video.scheduledDate
        ? new Date(video.scheduledDate)
        : video.postedDate
        ? new Date(video.postedDate)
        : null;
      return videoDate && isSameDay(videoDate, day);
    });
  };

  const handlePrevious = () => {
    setCurrentDate(view === "month" ? subMonths(currentDate, 1) : subMonths(currentDate, 0.25));
  };

  const handleNext = () => {
    setCurrentDate(view === "month" ? addMonths(currentDate, 1) : addMonths(currentDate, 0.25));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsVideoDialogOpen(true);
  };

  const handleVideoClick = (video: VideoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVideo(video);
    setIsDetailDialogOpen(true);
  };

  const days = getDaysInView();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Calendar</h1>
          <p className="text-muted-foreground">
            Plan and schedule your content
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedDate(new Date());
            setIsVideoDialogOpen(true);
          }}
          className={cn(
            isAiJourney
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-orange-500 hover:bg-orange-600"
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Content
        </Button>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold min-w-[200px] text-center">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week")}>
                <TabsList>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Status Legend */}
          <div className="flex gap-4 mb-4">
            {Object.entries(statusLabels).map(([status, label]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", statusColors[status])} />
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="bg-muted p-2 text-center text-sm font-medium"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, idx) => {
              const dayVideos = getVideosForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.01 }}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-[100px] bg-card p-2 cursor-pointer hover:bg-accent/50 transition-colors",
                    !isCurrentMonth && "bg-muted/50 text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-full text-sm",
                      isToday &&
                        (isAiJourney ? "bg-blue-500 text-white" : "bg-orange-500 text-white")
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayVideos.slice(0, 3).map((video) => (
                      <motion.div
                        key={video.id}
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "text-xs p-1 rounded truncate cursor-pointer hover:ring-1 ring-primary",
                          statusColors[video.status],
                          "text-white"
                        )}
                        onClick={(e) => handleVideoClick(video, e)}
                      >
                        <div className="flex items-center gap-1">
                          <Video className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{video.title}</span>
                        </div>
                      </motion.div>
                    ))}
                    {dayVideos.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayVideos.length - 3} more
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Video Dialog */}
      <VideoDialog
        open={isVideoDialogOpen}
        onOpenChange={setIsVideoDialogOpen}
        selectedDate={selectedDate}
        accountId={selectedAccountId}
        onSuccess={fetchVideos}
      />

      {/* Video Detail Dialog */}
      <VideoDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        video={selectedVideo}
        onSuccess={fetchVideos}
      />
    </div>
  );
}
