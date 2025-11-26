"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Video {
  id: string;
  title: string;
  status: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    platform: string;
  }[];
}

interface VideoMetricsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videos: Video[];
  selectedVideo: Video | null;
  platform: "tiktok" | "instagram";
  onSuccess: () => void;
}

export function VideoMetricsDialog({
  open,
  onOpenChange,
  videos,
  selectedVideo,
  platform,
  onSuccess,
}: VideoMetricsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [formData, setFormData] = useState({
    views: "",
    likes: "",
    comments: "",
    shares: "",
  });

  useEffect(() => {
    if (selectedVideo) {
      setVideoId(selectedVideo.id);
      const existingMetric = selectedVideo.metrics.find(
        (m) => m.platform === platform
      );
      if (existingMetric) {
        setFormData({
          views: existingMetric.views.toString(),
          likes: existingMetric.likes.toString(),
          comments: existingMetric.comments.toString(),
          shares: existingMetric.shares.toString(),
        });
      } else {
        setFormData({
          views: "",
          likes: "",
          comments: "",
          shares: "",
        });
      }
    } else {
      setVideoId("");
      setFormData({
        views: "",
        likes: "",
        comments: "",
        shares: "",
      });
    }
  }, [selectedVideo, platform]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId) {
      toast.error("Please select a video");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          views: parseInt(formData.views) || 0,
          likes: parseInt(formData.likes) || 0,
          comments: parseInt(formData.comments) || 0,
          shares: parseInt(formData.shares) || 0,
        }),
      });

      if (res.ok) {
        toast.success("Video metrics saved");
        onSuccess();
        onOpenChange(false);
        setFormData({
          views: "",
          likes: "",
          comments: "",
          shares: "",
        });
        setVideoId("");
      } else {
        toast.error("Failed to save video metrics");
      }
    } catch (error) {
      console.error("Failed to save video metrics:", error);
      toast.error("Failed to save video metrics");
    } finally {
      setIsLoading(false);
    }
  };

  const postedVideos = videos.filter((v) => v.status === "posted");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Video Metrics</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-select">Select Video</Label>
            <Select value={videoId} onValueChange={setVideoId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a video" />
              </SelectTrigger>
              <SelectContent>
                {postedVideos.map((video) => (
                  <SelectItem key={video.id} value={video.id}>
                    {video.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video-views">Views</Label>
              <Input
                id="video-views"
                type="number"
                value={formData.views}
                onChange={(e) =>
                  setFormData({ ...formData, views: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-likes">Likes</Label>
              <Input
                id="video-likes"
                type="number"
                value={formData.likes}
                onChange={(e) =>
                  setFormData({ ...formData, likes: e.target.value })
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video-comments">Comments</Label>
              <Input
                id="video-comments"
                type="number"
                value={formData.comments}
                onChange={(e) =>
                  setFormData({ ...formData, comments: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-shares">Shares</Label>
              <Input
                id="video-shares"
                type="number"
                value={formData.shares}
                onChange={(e) =>
                  setFormData({ ...formData, shares: e.target.value })
                }
                placeholder="0"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Recording metrics for {platform === "tiktok" ? "TikTok" : "Instagram"}
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !videoId}>
              {isLoading ? "Saving..." : "Save Metrics"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
