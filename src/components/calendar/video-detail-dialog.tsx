"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Trash2, Save, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface VideoItem {
  id: string;
  title: string;
  status: string;
  duration: number;
  script?: string | null;
  caption?: string | null;
  hashtags?: string[];
  hook?: string | null;
  scheduledDate: string | null;
  postedDate: string | null;
  account: {
    id: string;
    type: string;
  };
}

interface VideoDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: VideoItem | null;
  onSuccess: () => void;
}

interface MediaNotes {
  whatWorked: string;
  whatDidnt: string;
  tryNext: string;
}

export function VideoDetailDialog({
  open,
  onOpenChange,
  video,
  onSuccess,
}: VideoDetailDialogProps) {
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
  const [notes, setNotes] = useState<MediaNotes>({
    whatWorked: "",
    whatDidnt: "",
    tryNext: "",
  });

  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title,
        script: video.script || "",
        caption: video.caption || "",
        hashtags: video.hashtags?.join(", ") || "",
        hook: video.hook || "",
        duration: video.duration.toString(),
        status: video.status,
      });

      // Fetch notes
      fetchNotes(video.id);
    }
  }, [video]);

  const fetchNotes = async (videoId: string) => {
    try {
      const res = await fetch(`/api/videos/${videoId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.notes) {
          setNotes({
            whatWorked: data.notes.whatWorked || "",
            whatDidnt: data.notes.whatDidnt || "",
            tryNext: data.notes.tryNext || "",
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  };

  const handleSave = async () => {
    if (!video) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          script: formData.script || null,
          caption: formData.caption || null,
          hashtags: formData.hashtags
            ? formData.hashtags.split(",").map((h) => h.trim())
            : [],
          hook: formData.hook || null,
          duration: parseInt(formData.duration),
          status: formData.status,
          postedDate: formData.status === "posted" ? new Date().toISOString() : null,
        }),
      });

      if (res.ok) {
        toast.success("Video updated");
        onSuccess();
      } else {
        toast.error("Failed to update video");
      }
    } catch (error) {
      console.error("Failed to update video:", error);
      toast.error("Failed to update video");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!video) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/videos/${video.id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notes),
      });

      if (res.ok) {
        toast.success("Notes saved");
      } else {
        toast.error("Failed to save notes");
      }
    } catch (error) {
      console.error("Failed to save notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!video) return;

    if (!confirm("Are you sure you want to delete this video?")) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Video deleted");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error("Failed to delete video");
      }
    } catch (error) {
      console.error("Failed to delete video:", error);
      toast.error("Failed to delete video");
    } finally {
      setIsLoading(false);
    }
  };

  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Video Details</span>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Media Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration</Label>
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
                <Label htmlFor="edit-status">Status</Label>
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
              <Label htmlFor="edit-hook">Hook</Label>
              <Input
                id="edit-hook"
                value={formData.hook}
                onChange={(e) =>
                  setFormData({ ...formData, hook: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-script">Script / Notes</Label>
              <Textarea
                id="edit-script"
                value={formData.script}
                onChange={(e) =>
                  setFormData({ ...formData, script: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-caption">Caption</Label>
              <Textarea
                id="edit-caption"
                value={formData.caption}
                onChange={(e) =>
                  setFormData({ ...formData, caption: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-hashtags">Hashtags</Label>
              <Input
                id="edit-hashtags"
                value={formData.hashtags}
                onChange={(e) =>
                  setFormData({ ...formData, hashtags: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="what-worked" className="text-green-500">
                What Worked?
              </Label>
              <Textarea
                id="what-worked"
                value={notes.whatWorked}
                onChange={(e) =>
                  setNotes({ ...notes, whatWorked: e.target.value })
                }
                placeholder="Things that worked well in this video..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="what-didnt" className="text-red-500">
                What Didn't Work?
              </Label>
              <Textarea
                id="what-didnt"
                value={notes.whatDidnt}
                onChange={(e) =>
                  setNotes({ ...notes, whatDidnt: e.target.value })
                }
                placeholder="Things that could be improved..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="try-next" className="text-blue-500">
                Try Next Time
              </Label>
              <Textarea
                id="try-next"
                value={notes.tryNext}
                onChange={(e) =>
                  setNotes({ ...notes, tryNext: e.target.value })
                }
                placeholder="Ideas to try in future videos..."
                rows={3}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveNotes} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save Notes
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
