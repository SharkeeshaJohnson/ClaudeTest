import {
  db,
  generateId,
  now,
  type Video,
  type VideoMetric,
  type VideoNote,
} from "../index";

// ============================================================================
// Video Service
// ============================================================================

export interface CreateVideoInput {
  accountId: string;
  title: string;
  script?: string | null;
  caption?: string | null;
  hashtags?: string[];
  hook?: string | null;
  duration: number;
  status?: Video["status"];
  scheduledDate?: number | null;
}

export interface UpdateVideoInput {
  title?: string;
  script?: string | null;
  caption?: string | null;
  hashtags?: string[];
  hook?: string | null;
  duration?: number;
  status?: Video["status"];
  postedDate?: number | null;
  scheduledDate?: number | null;
}

export interface VideoWithRelations extends Video {
  metrics: VideoMetric[];
  notes: VideoNote | null;
  latestMetric: VideoMetric | null;
}

export const videoService = {
  /**
   * Get all videos with optional filtering
   */
  async getAll(options?: {
    accountId?: string;
    status?: Video["status"];
  }): Promise<VideoWithRelations[]> {
    const query = db.videos.orderBy("createdAt").reverse();

    if (options?.accountId) {
      const videos = await db.videos
        .where("accountId")
        .equals(options.accountId)
        .reverse()
        .sortBy("createdAt");

      const filtered = options.status
        ? videos.filter((v) => v.status === options.status)
        : videos;

      return Promise.all(filtered.map((v) => this.addRelations(v)));
    }

    const videos = await query.toArray();
    const filtered = options?.status
      ? videos.filter((v) => v.status === options.status)
      : videos;

    return Promise.all(filtered.map((v) => this.addRelations(v)));
  },

  /**
   * Get videos by account ID
   */
  async getByAccountId(
    accountId: string,
    options?: { limit?: number; status?: Video["status"] }
  ): Promise<VideoWithRelations[]> {
    let videos = await db.videos
      .where("accountId")
      .equals(accountId)
      .reverse()
      .sortBy("createdAt");

    if (options?.status) {
      videos = videos.filter((v) => v.status === options.status);
    }

    if (options?.limit) {
      videos = videos.slice(0, options.limit);
    }

    return Promise.all(videos.map((v) => this.addRelations(v)));
  },

  /**
   * Get a single video by ID with relations
   */
  async getById(id: string): Promise<VideoWithRelations | null> {
    const video = await db.videos.get(id);
    if (!video) return null;
    return this.addRelations(video);
  },

  /**
   * Add relations to a video
   */
  async addRelations(video: Video): Promise<VideoWithRelations> {
    const [metrics, notes] = await Promise.all([
      db.videoMetrics
        .where("videoId")
        .equals(video.id)
        .reverse()
        .sortBy("recordedAt"),
      db.videoNotes.where("videoId").equals(video.id).first(),
    ]);

    return {
      ...video,
      metrics,
      notes: notes || null,
      latestMetric: metrics[0] || null,
    };
  },

  /**
   * Create a new video
   */
  async create(input: CreateVideoInput): Promise<Video> {
    const timestamp = now();

    const video: Video = {
      id: generateId(),
      accountId: input.accountId,
      title: input.title,
      script: input.script ?? null,
      caption: input.caption ?? null,
      hashtags: input.hashtags || [],
      hook: input.hook ?? null,
      duration: input.duration,
      status: input.status || "planned",
      postedDate: null,
      scheduledDate: input.scheduledDate ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.videos.add(video);
    return video;
  },

  /**
   * Update an existing video
   */
  async update(id: string, input: UpdateVideoInput): Promise<Video | null> {
    const existing = await db.videos.get(id);
    if (!existing) return null;

    const updates: Partial<Video> = { updatedAt: now() };

    if (input.title !== undefined) updates.title = input.title;
    if (input.script !== undefined) updates.script = input.script;
    if (input.caption !== undefined) updates.caption = input.caption;
    if (input.hashtags !== undefined) updates.hashtags = input.hashtags;
    if (input.hook !== undefined) updates.hook = input.hook;
    if (input.duration !== undefined) updates.duration = input.duration;
    if (input.status !== undefined) updates.status = input.status;
    if (input.postedDate !== undefined) updates.postedDate = input.postedDate;
    if (input.scheduledDate !== undefined) updates.scheduledDate = input.scheduledDate;

    await db.videos.update(id, updates);
    return { ...existing, ...updates };
  },

  /**
   * Delete a video and its related data
   */
  async delete(id: string): Promise<boolean> {
    const existing = await db.videos.get(id);
    if (!existing) return false;

    await db.transaction("rw", [db.videos, db.videoMetrics, db.videoNotes], async () => {
      await db.videoMetrics.where("videoId").equals(id).delete();
      await db.videoNotes.where("videoId").equals(id).delete();
      await db.videos.delete(id);
    });

    return true;
  },

  /**
   * Get videos that need metrics update (posted 7+ days ago without recent metrics)
   */
  async getVideosNeedingMetricsUpdate(accountId: string): Promise<Video[]> {
    const sevenDaysAgo = now() - 7 * 24 * 60 * 60 * 1000;
    const oneDayAgo = now() - 24 * 60 * 60 * 1000;

    const postedVideos = await db.videos
      .where("accountId")
      .equals(accountId)
      .filter((v) => v.status === "posted" && v.postedDate !== null && v.postedDate < sevenDaysAgo)
      .toArray();

    // Filter out videos with recent metrics
    const videosNeedingUpdate: Video[] = [];
    for (const video of postedVideos) {
      const recentMetric = await db.videoMetrics
        .where("videoId")
        .equals(video.id)
        .filter((m) => m.recordedAt > oneDayAgo)
        .first();

      if (!recentMetric) {
        videosNeedingUpdate.push(video);
      }
    }

    return videosNeedingUpdate;
  },
};
