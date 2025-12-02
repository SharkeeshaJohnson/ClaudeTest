import Dexie, { type EntityTable } from "dexie";

// ============================================================================
// Type Definitions
// ============================================================================

export interface Account {
  id: string;
  name: string;
  platforms: ("tiktok" | "instagram")[];
  tiktokUsername: string | null;
  instagramUsername: string | null;
  // Initial metrics fetched during onboarding
  initialMetrics?: {
    tiktok?: {
      followers: number;
      totalLikes: number;
      totalVideos: number;
      bio?: string;
    };
    instagram?: {
      followers: number;
      following: number;
      posts: number;
      bio?: string;
    };
  };
  createdAt: number; // timestamp
}

export interface Video {
  id: string;
  accountId: string;
  title: string;
  script: string | null;
  caption: string | null;
  hashtags: string[];
  hook: string | null;
  duration: number; // 30, 45, or 60
  status: "planned" | "filmed" | "edited" | "posted";
  postedDate: number | null; // timestamp
  scheduledDate: number | null; // timestamp
  createdAt: number;
  updatedAt: number;
}

export interface VideoMetric {
  id: string;
  videoId: string;
  platform: "tiktok" | "instagram";
  views: number;
  likes: number;
  comments: number;
  shares: number;
  recordedAt: number; // timestamp
}

export interface AccountMetric {
  id: string;
  accountId: string;
  platform: "tiktok" | "instagram";
  followers: number;
  // Instagram-specific
  reach: number | null;
  impressions: number | null;
  profileViews: number | null;
  engagementRate: number | null;
  // TikTok-specific
  totalViews: number | null;
  totalLikes: number | null;
  totalComments: number | null;
  totalShares: number | null;
  recordedAt: number; // timestamp
}

export interface Idea {
  id: string;
  accountId: string;
  folderId: string | null; // null means "Uncategorized" / root level
  title: string;
  description: string | null;
  priority: number; // 1-5
  status: "new" | "in_progress" | "used" | "archived";
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface IdeaFolder {
  id: string;
  accountId: string;
  name: string;
  color: string | null; // Optional color for visual organization
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  accountId: string;
  title: string;
  description: string | null;
  type: "reminder" | "metrics_update" | "post_video";
  priority: number; // 1-5
  status: "pending" | "completed" | "snoozed";
  dueDate: number | null; // timestamp
  completedAt: number | null; // timestamp
  videoId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Streak {
  id: string;
  accountId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: number | null; // timestamp
  totalXP: number;
}

export interface VideoNote {
  id: string;
  videoId: string;
  whatWorked: string | null;
  whatDidnt: string | null;
  tryNext: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface TrendReport {
  id: string;
  accountId: string;
  provider: "claude" | "gpt4" | "gemini" | "grok";
  content: Record<string, unknown>; // JSON content
  generatedAt: number; // timestamp
}

export interface Conversation {
  id: string;
  accountId: string | null;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
  }>;
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  id: string; // always "settings" - singleton
  jemmaModel: string;
  creativeModel: string;
  analysisModel: string;
  theme: "light" | "dark" | "system";
  updatedAt: number;
}

export interface AccountProfile {
  id: string;
  accountId: string;
  hashtags: string[]; // User's relevant hashtags
  keywords: string[]; // User's relevant keywords
  rules: string[]; // User's rules/facts about their account (like claude.md)
  updatedAt: number;
}

// ============================================================================
// Database Class
// ============================================================================

class SMCCDatabase extends Dexie {
  accounts!: EntityTable<Account, "id">;
  videos!: EntityTable<Video, "id">;
  videoMetrics!: EntityTable<VideoMetric, "id">;
  accountMetrics!: EntityTable<AccountMetric, "id">;
  ideas!: EntityTable<Idea, "id">;
  ideaFolders!: EntityTable<IdeaFolder, "id">;
  tasks!: EntityTable<Task, "id">;
  streaks!: EntityTable<Streak, "id">;
  videoNotes!: EntityTable<VideoNote, "id">;
  trendReports!: EntityTable<TrendReport, "id">;
  conversations!: EntityTable<Conversation, "id">;
  userSettings!: EntityTable<UserSettings, "id">;
  accountProfiles!: EntityTable<AccountProfile, "id">;

  constructor() {
    super("smcc-db");

    this.version(1).stores({
      // Primary key first, then indexed fields
      accounts: "id, name, type, createdAt",
      videos: "id, accountId, status, scheduledDate, postedDate, createdAt",
      videoMetrics: "id, videoId, platform, recordedAt",
      accountMetrics: "id, accountId, platform, recordedAt",
      ideas: "id, accountId, status, priority, createdAt",
      tasks: "id, accountId, status, type, dueDate, createdAt",
      streaks: "id, &accountId", // unique index on accountId
      videoNotes: "id, &videoId", // unique index on videoId
      trendReports: "id, accountId, provider, generatedAt",
      conversations: "id, accountId, createdAt",
      userSettings: "id",
    });

    this.version(2).stores({
      accounts: "id, name, type, createdAt",
      videos: "id, accountId, status, scheduledDate, postedDate, createdAt",
      videoMetrics: "id, videoId, platform, recordedAt",
      accountMetrics: "id, accountId, platform, recordedAt",
      ideas: "id, accountId, status, priority, createdAt",
      tasks: "id, accountId, status, type, dueDate, createdAt",
      streaks: "id, &accountId",
      videoNotes: "id, &videoId",
      trendReports: "id, accountId, provider, generatedAt",
      conversations: "id, accountId, createdAt",
      userSettings: "id",
      accountProfiles: "id, &accountId", // unique index on accountId
    });

    this.version(3).stores({
      accounts: "id, name, type, createdAt",
      videos: "id, accountId, status, scheduledDate, postedDate, createdAt",
      videoMetrics: "id, videoId, platform, recordedAt",
      accountMetrics: "id, accountId, platform, recordedAt",
      ideas: "id, accountId, folderId, status, priority, createdAt",
      ideaFolders: "id, accountId, createdAt",
      tasks: "id, accountId, status, type, dueDate, createdAt",
      streaks: "id, &accountId",
      videoNotes: "id, &videoId",
      trendReports: "id, accountId, provider, generatedAt",
      conversations: "id, accountId, createdAt",
      userSettings: "id",
      accountProfiles: "id, &accountId",
    });
  }
}

// ============================================================================
// Database Instance
// ============================================================================

export const db = new SMCCDatabase();

// ============================================================================
// Utility Functions
// ============================================================================

export function generateId(): string {
  // Generate a CUID-like ID
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${timestamp}${randomPart}`;
}

export function now(): number {
  return Date.now();
}

// ============================================================================
// Default Settings
// ============================================================================

export const DEFAULT_SETTINGS: UserSettings = {
  id: "settings",
  jemmaModel: "auto",
  creativeModel: "auto",
  analysisModel: "auto",
  theme: "dark",
  updatedAt: Date.now(),
};

// Initialize settings if they don't exist
export async function initializeSettings(): Promise<UserSettings> {
  const existing = await db.userSettings.get("settings");
  if (!existing) {
    await db.userSettings.add(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return existing;
}
