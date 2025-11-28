"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface MetricsInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string | null;
  platform: "tiktok" | "instagram";
  onSuccess: () => void;
}

export function MetricsInputDialog({
  open,
  onOpenChange,
  accountId,
  platform,
  onSuccess,
}: MetricsInputDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    followers: "",
    // Instagram specific
    reach: "",
    impressions: "",
    profileViews: "",
    engagementRate: "",
    // TikTok specific
    totalViews: "",
    totalLikes: "",
    totalComments: "",
    totalShares: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      toast.error("Please select an account first");
      return;
    }

    setIsLoading(true);
    try {
      const data: Record<string, unknown> = {
        accountId,
        platform,
        followers: parseInt(formData.followers) || 0,
      };

      if (platform === "instagram") {
        data.reach = formData.reach ? parseInt(formData.reach) : null;
        data.impressions = formData.impressions ? parseInt(formData.impressions) : null;
        data.profileViews = formData.profileViews ? parseInt(formData.profileViews) : null;
        data.engagementRate = formData.engagementRate ? parseFloat(formData.engagementRate) : null;
      } else {
        data.totalViews = formData.totalViews ? parseInt(formData.totalViews) : null;
        data.totalLikes = formData.totalLikes ? parseInt(formData.totalLikes) : null;
        data.totalComments = formData.totalComments ? parseInt(formData.totalComments) : null;
        data.totalShares = formData.totalShares ? parseInt(formData.totalShares) : null;
      }

      const res = await fetch("/api/analytics/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Metrics saved successfully");
        onSuccess();
        onOpenChange(false);
        setFormData({
          followers: "",
          reach: "",
          impressions: "",
          profileViews: "",
          engagementRate: "",
          totalViews: "",
          totalLikes: "",
          totalComments: "",
          totalShares: "",
        });
      } else {
        toast.error("Failed to save metrics");
      }
    } catch (error) {
      console.error("Failed to save metrics:", error);
      toast.error("Failed to save metrics");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add {platform === "tiktok" ? "TikTok" : "Instagram"} Metrics
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="followers">Followers *</Label>
            <Input
              id="followers"
              type="number"
              value={formData.followers}
              onChange={(e) =>
                setFormData({ ...formData, followers: e.target.value })
              }
              placeholder="Current follower count"
              required
            />
          </div>

          {platform === "instagram" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reach">Reach</Label>
                  <Input
                    id="reach"
                    type="number"
                    value={formData.reach}
                    onChange={(e) =>
                      setFormData({ ...formData, reach: e.target.value })
                    }
                    placeholder="Total reach"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="impressions">Impressions</Label>
                  <Input
                    id="impressions"
                    type="number"
                    value={formData.impressions}
                    onChange={(e) =>
                      setFormData({ ...formData, impressions: e.target.value })
                    }
                    placeholder="Total impressions"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profileViews">Profile Views</Label>
                  <Input
                    id="profileViews"
                    type="number"
                    value={formData.profileViews}
                    onChange={(e) =>
                      setFormData({ ...formData, profileViews: e.target.value })
                    }
                    placeholder="Profile visits"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engagementRate">Engagement Rate (%)</Label>
                  <Input
                    id="engagementRate"
                    type="number"
                    step="0.01"
                    value={formData.engagementRate}
                    onChange={(e) =>
                      setFormData({ ...formData, engagementRate: e.target.value })
                    }
                    placeholder="e.g., 4.5"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalViews">Total Views</Label>
                  <Input
                    id="totalViews"
                    type="number"
                    value={formData.totalViews}
                    onChange={(e) =>
                      setFormData({ ...formData, totalViews: e.target.value })
                    }
                    placeholder="Profile video views"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalLikes">Total Likes</Label>
                  <Input
                    id="totalLikes"
                    type="number"
                    value={formData.totalLikes}
                    onChange={(e) =>
                      setFormData({ ...formData, totalLikes: e.target.value })
                    }
                    placeholder="Total likes received"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalComments">Total Comments</Label>
                  <Input
                    id="totalComments"
                    type="number"
                    value={formData.totalComments}
                    onChange={(e) =>
                      setFormData({ ...formData, totalComments: e.target.value })
                    }
                    placeholder="Total comments"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalShares">Total Shares</Label>
                  <Input
                    id="totalShares"
                    type="number"
                    value={formData.totalShares}
                    onChange={(e) =>
                      setFormData({ ...formData, totalShares: e.target.value })
                    }
                    placeholder="Total shares"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Metrics"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
