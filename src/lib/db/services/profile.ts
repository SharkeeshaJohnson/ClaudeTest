import { db, generateId, now, type AccountProfile } from "../index";

// ============================================================================
// Account Profile Service
// ============================================================================

export const profileService = {
  /**
   * Get profile for an account
   */
  async getByAccountId(accountId: string): Promise<AccountProfile | null> {
    const profile = await db.accountProfiles
      .where("accountId")
      .equals(accountId)
      .first();
    return profile ?? null;
  },

  /**
   * Create or update profile for an account
   */
  async upsert(
    accountId: string,
    data: {
      hashtags?: string[];
      keywords?: string[];
      rules?: string[];
    }
  ): Promise<AccountProfile> {
    const existing = await this.getByAccountId(accountId);

    if (existing) {
      const updated: AccountProfile = {
        ...existing,
        hashtags: data.hashtags ?? existing.hashtags,
        keywords: data.keywords ?? existing.keywords,
        rules: data.rules ?? existing.rules,
        updatedAt: now(),
      };
      await db.accountProfiles.put(updated);
      return updated;
    }

    const profile: AccountProfile = {
      id: generateId(),
      accountId,
      hashtags: data.hashtags ?? [],
      keywords: data.keywords ?? [],
      rules: data.rules ?? [],
      updatedAt: now(),
    };
    await db.accountProfiles.add(profile);
    return profile;
  },

  /**
   * Update hashtags for an account
   */
  async updateHashtags(
    accountId: string,
    hashtags: string[]
  ): Promise<AccountProfile> {
    return this.upsert(accountId, { hashtags });
  },

  /**
   * Update keywords for an account
   */
  async updateKeywords(
    accountId: string,
    keywords: string[]
  ): Promise<AccountProfile> {
    return this.upsert(accountId, { keywords });
  },

  /**
   * Update rules for an account
   */
  async updateRules(
    accountId: string,
    rules: string[]
  ): Promise<AccountProfile> {
    return this.upsert(accountId, { rules });
  },

  /**
   * Delete profile for an account
   */
  async delete(accountId: string): Promise<boolean> {
    const profile = await this.getByAccountId(accountId);
    if (profile) {
      await db.accountProfiles.delete(profile.id);
      return true;
    }
    return false;
  },
};
