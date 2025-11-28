"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { videoService } from "@/lib/db/services";
import type { Video } from "@/lib/db";

interface VideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  accountId: string | null;
  onSuccess: () => void;
}

export function VideoDialog({
  open,
  onOpenChange,
  selectedDate,
  accountId,
  onSuccess,
}: VideoDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    script: "",
    caption: "",
    hashtags: "",
    hook: "",
    duration: "30",
    status: "planned",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      toast.error("Please select an account first");
      return;
    }

    setIsLoading(true);
    try {
      const hashtags = formData.hashtags
        ? formData.hashtags.split(",").map((h) => h.trim()).filter(Boolean)
        : [];

      await videoService.create({
        accountId,
        title: formData.title,
        script: formData.script || undefined,
        caption: formData.caption || undefined,
        hashtags,
        hook: formData.hook || undefined,
        duration: parseInt(formData.duration),
        status: formData.status as Video["status"],
        scheduledDate: selectedDate?.getTime(),
      });

      toast.success("Video added to calendar");
      onSuccess();
      onOpenChange(false);
      setFormData({
        title: "",
        script: "",
        caption: "",
        hashtags: "",
        hook: "",
        duration: "30",
        status: "planned",
      });
    } catch (error) {
      console.error("Failed to create video:", error);
      toast.error("Failed to create video");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Add Content{" "}
            {selectedDate && `for ${format(selectedDate, "MMMM d, yyyy")}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Video title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) =>
                  setFormData({ ...formData, duration: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="45">45 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="filmed">Filmed</SelectItem>
                  <SelectItem value="edited">Edited</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hook">Hook (3-second attention grabber)</Label>
            <Input
              id="hook"
              value={formData.hook}
              onChange={(e) =>
                setFormData({ ...formData, hook: e.target.value })
              }
              placeholder="Start with something attention-grabbing..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="script">Script / Idea Notes</Label>
            <Textarea
              id="script"
              value={formData.script}
              onChange={(e) =>
                setFormData({ ...formData, script: e.target.value })
              }
              placeholder="Write your script or notes here..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={formData.caption}
              onChange={(e) =>
                setFormData({ ...formData, caption: e.target.value })
              }
              placeholder="Caption for your post..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
            <Input
              id="hashtags"
              value={formData.hashtags}
              onChange={(e) =>
                setFormData({ ...formData, hashtags: e.target.value })
              }
              placeholder="#viral, #trending, #content"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Video"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
