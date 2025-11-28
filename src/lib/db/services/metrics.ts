import {
  db,
  generateId,
  now,
  type VideoMetric,
  type AccountMetric,
} from "../index";

// ============================================================================
// Video Metric Service
// ============================================================================

export interface CreateVideoMetricInput {
  videoId: string;
  platform: "tiktok" | "instagram";
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
}

export const videoMetricService = {
  /**
   * Get all metrics for a video
   */
  async getByVideoId(videoId: string): Promise<VideoMetric[]> {
    return db.videoMetrics
      .where("videoId")
      .equals(videoId)
      .reverse()
      .sortBy("recordedAt");
  },

  /**
   * Get latest metric for a video
   */
  async getLatestByVideoId(videoId: string): Promise<VideoMetric | undefined> {
    const metrics = await db.videoMetrics
      .where("videoId")
      .equals(videoId)
      .reverse()
      .sortBy("recordedAt");
    return metrics[0];
  },

  /**
   * Create a new video metric
   */
  async create(input: CreateVideoMetricInput): Promise<VideoMetric> {
    const metric: VideoMetric = {
      id: generateId(),
      videoId: input.videoId,
      platform: input.platform,
      views: input.views ?? 0,
      likes: input.likes ?? 0,
      comments: input.comments ?? 0,
      shares: input.shares ?? 0,
      recordedAt: now(),
    };

    await db.videoMetrics.add(metric);
    return metric;
  },

  /**
   * Upsert video metrics (create or update latest)
   */
  async upsert(
    videoId: string,
    platform: "tiktok" | "instagram",
    data: { views: number; likes: number; comments: number; shares: number }
  ): Promise<VideoMetric> {
    // Always create a new metric record (for historical tracking)
    return this.create({
      videoId,
      platform,
      ...data,
    });
  },
};

// ============================================================================
// Account Metric Service
// ============================================================================

export interface CreateAccountMetricInput {
  accountId: string;
  platform: "tiktok" | "instagram";
  followers: number;
  // Instagram-specific
  reach?: number | null;
  impressions?: number | null;
  profileViews?: number | null;
  engagementRate?: number | null;
  // TikTok-specific
  totalViews?: number | null;
  totalLikes?: number | null;
  totalComments?: number | null;
  totalShares?: number | null;
}

export const accountMetricService = {
  /**
   * Get all metrics for an account with optional filtering
   */
  async getByAccountId(
    accountId: string,
    options?: {
      platform?: "tiktok" | "instagram";
      days?: number;
    }
  ): Promise<AccountMetric[]> {
    let metrics = await db.accountMetrics
      .where("accountId")
      .equals(accountId)
      .sortBy("recordedAt");

    if (options?.platform) {
      metrics = metrics.filter((m) => m.platform === options.platform);
    }

    if (options?.days) {
      const cutoff = now() - options.days * 24 * 60 * 60 * 1000;
      metrics = metrics.filter((m) => m.recordedAt >= cutoff);
    }

    return metrics;
  },

  /**
   * Get latest metric for an account (optionally by platform)
   */
  async getLatestByAccountId(
    accountId: string,
    platform?: "tiktok" | "instagram"
  ): Promise<AccountMetric | undefined> {
    let metrics = await db.accountMetrics
      .where("accountId")
      .equals(accountId)
      .reverse()
      .sortBy("recordedAt");

    if (platform) {
      metrics = metrics.filter((m) => m.platform === platform);
    }

    return metrics[0];
  },

  /**
   * Create a new account metric
   */
  async create(input: CreateAccountMetricInput): Promise<AccountMetric> {
    const metric: AccountMetric = {
      id: generateId(),
      accountId: input.accountId,
      platform: input.platform,
      followers: input.followers,
      reach: input.reach ?? null,
      impressions: input.impressions ?? null,
      profileViews: input.profileViews ?? null,
      engagementRate: input.engagementRate ?? null,
      totalViews: input.totalViews ?? null,
      totalLikes: input.totalLikes ?? null,
      totalComments: input.totalComments ?? null,
      totalShares: input.totalShares ?? null,
      recordedAt: now(),
    };

    await db.accountMetrics.add(metric);
    return metric;
  },

  /**
   * Get aggregated metrics summary for an account
   */
  async getMetricsSummary(accountId: string): Promise<{
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    videoCount: number;
    avgViews: number;
    avgEngagement: number;
  }> {
    const { videoService } = await import("./videos");
    const videos = await videoService.getByAccountId(accountId);

    const summary = videos.reduce(
      (acc, video) => {
        if (video.latestMetric) {
          acc.totalViews += video.latestMetric.views;
          acc.totalLikes += video.latestMetric.likes;
          acc.totalComments += video.latestMetric.comments;
          acc.totalShares += video.latestMetric.shares;
          acc.videoCount++;
        }
        return acc;
      },
      { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0, videoCount: 0 }
    );

    return {
      ...summary,
      avgViews: summary.videoCount
        ? Math.round(summary.totalViews / summary.videoCount)
        : 0,
      avgEngagement: summary.videoCount
        ? Math.round(
            (summary.totalLikes + summary.totalComments + summary.totalShares) /
              summary.videoCount
          )
        : 0,
    };
  },
};
