import { db, generateId, now, type Account } from "../index";

// ============================================================================
// Account Service
// ============================================================================

export type SocialPlatform = "tiktok" | "instagram";

export interface CreateAccountInput {
  name: string;
  platforms: SocialPlatform[];
  tiktokUsername?: string | null;
  instagramUsername?: string | null;
  initialMetrics?: Account["initialMetrics"];
  startingFollowers?: number;
}

export interface UpdateAccountInput {
  name?: string;
  platforms?: SocialPlatform[];
  tiktokUsername?: string | null;
  instagramUsername?: string | null;
  initialMetrics?: Account["initialMetrics"];
}

export const accountService = {
  /**
   * Get all accounts ordered by creation date
   */
  async getAll(): Promise<Account[]> {
    return db.accounts.orderBy("createdAt").toArray();
  },

  /**
   * Get a single account by ID
   */
  async getById(id: string): Promise<Account | undefined> {
    return db.accounts.get(id);
  },

  /**
   * Get account with related data (videos, latest metrics)
   */
  async getWithRelations(id: string): Promise<{
    account: Account;
    videos: Awaited<ReturnType<typeof import("./videos").videoService.getByAccountId>>;
    latestMetrics: Awaited<ReturnType<typeof import("./metrics").accountMetricService.getLatestByAccountId>>;
  } | null> {
    const account = await db.accounts.get(id);
    if (!account) return null;

    const { videoService } = await import("./videos");
    const { accountMetricService } = await import("./metrics");

    const [videos, latestMetrics] = await Promise.all([
      videoService.getByAccountId(id, { limit: 10 }),
      accountMetricService.getLatestByAccountId(id),
    ]);

    return { account, videos, latestMetrics };
  },

  /**
   * Create a new account
   */
  async create(input: CreateAccountInput): Promise<Account> {
    const id = generateId();
    const timestamp = now();

    const account: Account = {
      id,
      name: input.name,
      platforms: input.platforms,
      tiktokUsername: input.tiktokUsername || null,
      instagramUsername: input.instagramUsername || null,
      initialMetrics: input.initialMetrics,
      createdAt: timestamp,
    };

    await db.accounts.add(account);

    // Create initial AccountMetric records if starting followers provided
    if (input.startingFollowers && input.startingFollowers > 0) {
      const { accountMetricService } = await import("./metrics");

      // Create a metric record for each platform
      for (const platform of input.platforms) {
        await accountMetricService.create({
          accountId: id,
          platform,
          followers: input.startingFollowers,
        });
      }
    }

    return account;
  },

  /**
   * Update an existing account
   */
  async update(id: string, input: UpdateAccountInput): Promise<Account | null> {
    const existing = await db.accounts.get(id);
    if (!existing) return null;

    const updates: Partial<Account> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.platforms !== undefined) updates.platforms = input.platforms;
    if (input.tiktokUsername !== undefined) updates.tiktokUsername = input.tiktokUsername;
    if (input.instagramUsername !== undefined) updates.instagramUsername = input.instagramUsername;
    if (input.initialMetrics !== undefined) updates.initialMetrics = input.initialMetrics;

    await db.accounts.update(id, updates);
    return { ...existing, ...updates };
  },

  /**
   * Delete an account and all related data
   */
  async delete(id: string): Promise<boolean> {
    const existing = await db.accounts.get(id);
    if (!existing) return false;

    // Delete account and all related data in a transaction
    await db.transaction(
      "rw",
      [
        db.accounts,
        db.videos,
        db.videoMetrics,
        db.videoNotes,
        db.accountMetrics,
        db.ideas,
        db.tasks,
        db.streaks,
        db.conversations,
        db.trendReports,
      ],
      async () => {
        // Get all video IDs for this account
        const videos = await db.videos.where("accountId").equals(id).toArray();
        const videoIds = videos.map((v) => v.id);

        // Delete video-related data
        if (videoIds.length > 0) {
          await db.videoMetrics.where("videoId").anyOf(videoIds).delete();
          await db.videoNotes.where("videoId").anyOf(videoIds).delete();
        }

        // Delete all account-related data
        await db.videos.where("accountId").equals(id).delete();
        await db.accountMetrics.where("accountId").equals(id).delete();
        await db.ideas.where("accountId").equals(id).delete();
        await db.tasks.where("accountId").equals(id).delete();
        await db.streaks.where("accountId").equals(id).delete();
        await db.conversations.where("accountId").equals(id).delete();
        await db.trendReports.where("accountId").equals(id).delete();

        // Delete the account itself
        await db.accounts.delete(id);
      }
    );

    return true;
  },
};
