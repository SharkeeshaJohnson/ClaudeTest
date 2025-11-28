import { db, generateId, now, type TrendReport } from "../index";

// ============================================================================
// Trend Report Service
// ============================================================================

export interface CreateTrendReportInput {
  accountId: string;
  provider: TrendReport["provider"];
  content: Record<string, unknown>;
}

export const trendReportService = {
  /**
   * Get all trend reports for an account
   */
  async getByAccountId(accountId: string): Promise<TrendReport[]> {
    return db.trendReports
      .where("accountId")
      .equals(accountId)
      .reverse()
      .sortBy("generatedAt");
  },

  /**
   * Get latest trend report for an account by provider
   */
  async getLatestByProvider(
    accountId: string,
    provider: TrendReport["provider"]
  ): Promise<TrendReport | undefined> {
    const reports = await db.trendReports
      .where("accountId")
      .equals(accountId)
      .filter((r) => r.provider === provider)
      .reverse()
      .sortBy("generatedAt");

    return reports[0];
  },

  /**
   * Get a single trend report by ID
   */
  async getById(id: string): Promise<TrendReport | undefined> {
    return db.trendReports.get(id);
  },

  /**
   * Create a new trend report
   */
  async create(input: CreateTrendReportInput): Promise<TrendReport> {
    const report: TrendReport = {
      id: generateId(),
      accountId: input.accountId,
      provider: input.provider,
      content: input.content,
      generatedAt: now(),
    };

    await db.trendReports.add(report);
    return report;
  },

  /**
   * Delete old trend reports (keep only the latest N per provider)
   */
  async cleanupOldReports(accountId: string, keepPerProvider: number = 5): Promise<number> {
    const providers: TrendReport["provider"][] = ["claude", "gpt4", "gemini", "grok"];
    let deleted = 0;

    for (const provider of providers) {
      const reports = await db.trendReports
        .where("accountId")
        .equals(accountId)
        .filter((r) => r.provider === provider)
        .reverse()
        .sortBy("generatedAt");

      if (reports.length > keepPerProvider) {
        const toDelete = reports.slice(keepPerProvider);
        for (const report of toDelete) {
          await db.trendReports.delete(report.id);
          deleted++;
        }
      }
    }

    return deleted;
  },
};
