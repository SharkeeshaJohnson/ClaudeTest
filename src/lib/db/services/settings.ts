import { db, now, DEFAULT_SETTINGS, type UserSettings } from "../index";

// ============================================================================
// Settings Service
// ============================================================================

export interface UpdateSettingsInput {
  jemmaModel?: string;
  creativeModel?: string;
  analysisModel?: string;
  theme?: "light" | "dark" | "system";
}

export const settingsService = {
  /**
   * Get user settings (creates defaults if not exist)
   */
  async get(): Promise<UserSettings> {
    let settings = await db.userSettings.get("settings");

    if (!settings) {
      settings = { ...DEFAULT_SETTINGS, updatedAt: now() };
      await db.userSettings.add(settings);
    }

    return settings;
  },

  /**
   * Update user settings
   */
  async update(input: UpdateSettingsInput): Promise<UserSettings> {
    const existing = await this.get();

    const updates: Partial<UserSettings> = { updatedAt: now() };

    if (input.jemmaModel !== undefined) updates.jemmaModel = input.jemmaModel;
    if (input.creativeModel !== undefined) updates.creativeModel = input.creativeModel;
    if (input.analysisModel !== undefined) updates.analysisModel = input.analysisModel;
    if (input.theme !== undefined) updates.theme = input.theme;

    await db.userSettings.update("settings", updates);
    return { ...existing, ...updates };
  },

  /**
   * Reset settings to defaults
   */
  async reset(): Promise<UserSettings> {
    const settings = { ...DEFAULT_SETTINGS, updatedAt: now() };
    await db.userSettings.put(settings);
    return settings;
  },
};
