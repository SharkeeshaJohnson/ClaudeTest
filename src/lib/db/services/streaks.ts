import { db, generateId, now, type Streak } from "../index";

// ============================================================================
// Streak Service
// ============================================================================

export type StreakAction = "checkin" | "post" | "metrics";

export interface StreakUpdateResult {
  streak: Streak;
  xpGained: number;
  isNewDay: boolean;
}

// XP rewards for different actions
const XP_REWARDS: Record<StreakAction, number> = {
  checkin: 5,
  post: 50,
  metrics: 20,
};

const STREAK_BONUS_XP = 10;

export const streakService = {
  /**
   * Get streak for an account (creates one if it doesn't exist)
   */
  async getByAccountId(accountId: string): Promise<Streak> {
    let streak = await db.streaks.where("accountId").equals(accountId).first();

    if (!streak) {
      streak = {
        id: generateId(),
        accountId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalXP: 0,
      };
      await db.streaks.add(streak);
    }

    return streak;
  },

  /**
   * Record an activity and update streak
   */
  async recordActivity(
    accountId: string,
    action: StreakAction
  ): Promise<StreakUpdateResult> {
    const streak = await this.getByAccountId(accountId);
    const timestamp = now();
    const today = new Date(timestamp).toDateString();
    const lastActivity = streak.lastActivityDate
      ? new Date(streak.lastActivityDate).toDateString()
      : null;

    const isNewDay = today !== lastActivity;
    let xpGained = XP_REWARDS[action];

    const updates: Partial<Streak> = {
      totalXP: streak.totalXP + xpGained,
      lastActivityDate: timestamp,
    };

    if (isNewDay) {
      // Check if this is a consecutive day
      const yesterday = new Date(timestamp - 24 * 60 * 60 * 1000).toDateString();
      const isConsecutive = lastActivity === yesterday;

      if (isConsecutive) {
        // Continue streak
        updates.currentStreak = streak.currentStreak + 1;
        updates.totalXP = streak.totalXP + xpGained + STREAK_BONUS_XP;
        xpGained += STREAK_BONUS_XP;
      } else if (lastActivity === null || lastActivity !== today) {
        // Start new streak (either first activity or gap > 1 day)
        updates.currentStreak = 1;
      }

      // Update longest streak if current is higher
      if ((updates.currentStreak || streak.currentStreak) > streak.longestStreak) {
        updates.longestStreak = updates.currentStreak || streak.currentStreak;
      }
    }

    await db.streaks.update(streak.id, updates);

    return {
      streak: { ...streak, ...updates },
      xpGained,
      isNewDay,
    };
  },

  /**
   * Get the user's level based on XP
   */
  getLevel(totalXP: number): { level: number; currentXP: number; nextLevelXP: number } {
    // Level formula: Each level requires level * 100 XP
    // Level 1: 0-99, Level 2: 100-299, Level 3: 300-599, etc.
    let level = 1;
    let xpRequired = 0;

    while (xpRequired + level * 100 <= totalXP) {
      xpRequired += level * 100;
      level++;
    }

    return {
      level,
      currentXP: totalXP - xpRequired,
      nextLevelXP: level * 100,
    };
  },

  /**
   * Get milestone achievements
   */
  getMilestones(streak: Streak): Array<{ name: string; achieved: boolean; requirement: number }> {
    return [
      { name: "First Steps", achieved: streak.longestStreak >= 1, requirement: 1 },
      { name: "Week Warrior", achieved: streak.longestStreak >= 7, requirement: 7 },
      { name: "Fortnight Fighter", achieved: streak.longestStreak >= 14, requirement: 14 },
      { name: "Monthly Master", achieved: streak.longestStreak >= 30, requirement: 30 },
      { name: "Quarterly Champion", achieved: streak.longestStreak >= 90, requirement: 90 },
      { name: "Year Legend", achieved: streak.longestStreak >= 365, requirement: 365 },
    ];
  },
};
