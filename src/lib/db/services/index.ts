// Re-export all services for convenient imports
export { accountService } from "./accounts";
export { videoService } from "./videos";
export { videoMetricService, accountMetricService } from "./metrics";
export { ideaService } from "./ideas";
export { ideaFolderService } from "./folders";
export { taskService } from "./tasks";
export { videoNoteService } from "./notes";
export { trendReportService } from "./trends";
export { conversationService } from "./conversations";
export { settingsService } from "./settings";
export { exportService } from "./export";
export { profileService } from "./profile";

// Aliases for convenience
import { videoNoteService } from "./notes";
import { videoMetricService, accountMetricService } from "./metrics";
import { trendReportService } from "./trends";

export const notesService = videoNoteService;
export const metricsService = {
  ...videoMetricService,
  ...accountMetricService,
  getVideoMetrics: videoMetricService.getByVideoId,
  getAccountMetrics: accountMetricService.getByAccountId,
  createAccountMetric: accountMetricService.create,
  upsertVideoMetric: videoMetricService.upsert,
};
export const trendsService = trendReportService;

// Re-export types
export type { CreateAccountInput, UpdateAccountInput } from "./accounts";
export type { CreateVideoInput, UpdateVideoInput, VideoWithRelations } from "./videos";
export type { CreateVideoMetricInput, CreateAccountMetricInput } from "./metrics";
export type { CreateIdeaInput, UpdateIdeaInput } from "./ideas";
export type { CreateFolderInput, UpdateFolderInput } from "./folders";
export type { CreateTaskInput, UpdateTaskInput } from "./tasks";
export type { UpsertVideoNoteInput } from "./notes";
export type { CreateTrendReportInput } from "./trends";
export type { Message, MessageRole, CreateConversationInput } from "./conversations";
export type { UpdateSettingsInput } from "./settings";
export type { ExportData } from "./export";
