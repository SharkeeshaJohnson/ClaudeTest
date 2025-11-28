import { db, type Account } from "../index";
import { videoService } from "./videos";
import { accountMetricService } from "./metrics";
import { ideaService } from "./ideas";
import { streakService } from "./streaks";

// ============================================================================
// Export Service
// ============================================================================

export interface ExportData {
  exportedAt: number;
  account: {
    name: string;
    type: string;
    platforms: string[];
    nicheKeywords: string[];
  };
  videos: Array<{
    title: string;
    script: string | null;
    caption: string | null;
    hashtags: string[];
    hook: string | null;
    duration: number;
    status: string;
    postedDate: number | null;
    scheduledDate: number | null;
    metrics: Array<{
      platform: string;
      views: number;
      likes: number;
      comments: number;
      shares: number;
      recordedAt: number;
    }>;
    notes: {
      whatWorked: string | null;
      whatDidnt: string | null;
      tryNext: string | null;
    } | null;
  }>;
  metricsSummary: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    videoCount: number;
    avgViews: number;
    avgEngagement: number;
  };
  ideas: Array<{
    title: string;
    description: string | null;
    priority: number;
    status: string;
    tags: string[];
  }>;
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalXP: number;
    lastActivityDate: number | null;
  };
}

export const exportService = {
  /**
   * Export all data for an account
   */
  async exportAccount(accountId: string): Promise<ExportData | null> {
    const account = await db.accounts.get(accountId);
    if (!account) return null;

    const [videos, metricsSummary, ideas, streak] = await Promise.all([
      videoService.getByAccountId(accountId),
      accountMetricService.getMetricsSummary(accountId),
      ideaService.getByAccountId(accountId),
      streakService.getByAccountId(accountId),
    ]);

    return {
      exportedAt: Date.now(),
      account: {
        name: account.name,
        type: account.type,
        platforms: account.platforms,
        nicheKeywords: account.nicheKeywords,
      },
      videos: videos.map((v) => ({
        title: v.title,
        script: v.script,
        caption: v.caption,
        hashtags: v.hashtags,
        hook: v.hook,
        duration: v.duration,
        status: v.status,
        postedDate: v.postedDate,
        scheduledDate: v.scheduledDate,
        metrics: v.metrics.map((m) => ({
          platform: m.platform,
          views: m.views,
          likes: m.likes,
          comments: m.comments,
          shares: m.shares,
          recordedAt: m.recordedAt,
        })),
        notes: v.notes
          ? {
              whatWorked: v.notes.whatWorked,
              whatDidnt: v.notes.whatDidnt,
              tryNext: v.notes.tryNext,
            }
          : null,
      })),
      metricsSummary,
      ideas: ideas.map((i) => ({
        title: i.title,
        description: i.description,
        priority: i.priority,
        status: i.status,
        tags: i.tags,
      })),
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalXP: streak.totalXP,
        lastActivityDate: streak.lastActivityDate,
      },
    };
  },

  /**
   * Generate a downloadable JSON file
   */
  async downloadExport(accountId: string, accountName: string): Promise<void> {
    const data = await this.exportAccount(accountId);
    if (!data) throw new Error("Account not found");

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split("T")[0];
    const filename = `smcc-export-${accountName.toLowerCase().replace(/\s+/g, "-")}-${date}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Import data from an export file
   */
  async importData(data: ExportData, accountId: string): Promise<void> {
    // This is a basic import that adds data without duplicating
    // In a real app, you'd want more sophisticated merge logic

    const { videoService: vs } = await import("./videos");
    const { ideaService: is } = await import("./ideas");

    // Import videos
    for (const video of data.videos) {
      await vs.create({
        accountId,
        title: video.title,
        script: video.script,
        caption: video.caption,
        hashtags: video.hashtags,
        hook: video.hook,
        duration: video.duration,
        status: video.status as "planned" | "filmed" | "edited" | "posted",
        scheduledDate: video.scheduledDate,
      });
    }

    // Import ideas
    for (const idea of data.ideas) {
      await is.create({
        accountId,
        title: idea.title,
        description: idea.description,
        priority: idea.priority,
        tags: idea.tags,
      });
    }
  },
};
