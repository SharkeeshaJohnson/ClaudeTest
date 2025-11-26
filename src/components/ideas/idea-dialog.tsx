"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Idea {
  id: string;
  accountId: string;
  title: string;
  description: string | null;
  priority: number;
  status: string;
  tags: string[];
}

interface IdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string | null;
  idea: Idea | null;
  onSuccess: () => void;
}

export function IdeaDialog({
  open,
  onOpenChange,
  accountId,
  idea,
  onSuccess,
}: IdeaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: 3,
    tags: "",
  });

  useEffect(() => {
    if (idea) {
      setFormData({
        title: idea.title,
        description: idea.description || "",
        priority: idea.priority,
        tags: idea.tags.join(", "),
      });
    } else {
      setFormData({
        title: "",
        description: "",
        priority: 3,
        tags: "",
      });
    }
  }, [idea]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId && !idea) {
      toast.error("Please select an account first");
      return;
    }

    setIsLoading(true);
    try {
      const url = idea ? `/api/ideas/${idea.id}` : "/api/ideas";
      const method = idea ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(idea ? {} : { accountId }),
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          tags: formData.tags
            ? formData.tags.split(",").map((t) => t.trim())
            : [],
        }),
      });

      if (res.ok) {
        toast.success(idea ? "Idea updated" : "Idea created");
        onSuccess();
        onOpenChange(false);
        setFormData({
          title: "",
          description: "",
          priority: 3,
          tags: "",
        });
      } else {
        toast.error(idea ? "Failed to update idea" : "Failed to create idea");
      }
    } catch (error) {
      console.error("Failed to save idea:", error);
      toast.error("Failed to save idea");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{idea ? "Edit Idea" : "Add New Idea"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idea-title">Title *</Label>
            <Input
              id="idea-title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="What's your idea?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idea-description">Description</Label>
            <Textarea
              id="idea-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add more details about your idea..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, priority: i + 1 })
                  }
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={cn(
                      "h-6 w-6 transition-colors",
                      i < formData.priority
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground hover:text-yellow-500/50"
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {formData.priority} / 5
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idea-tags">Tags (comma-separated)</Label>
            <Input
              id="idea-tags"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="tutorial, viral, trending"
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
              {isLoading ? "Saving..." : idea ? "Update Idea" : "Add Idea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
