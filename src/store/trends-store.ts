import { create } from "zustand";

// ============================================================================
// Types
// ============================================================================

interface TrendAnalysis {
  summary: string;
  keyInsights: string[];
  recommendedTopics: string[];
  recommendedHashtags: string[];
  contentAngles: string[];
  actionItems: string[];
}

interface AnalysisProgress {
  current: number;
  total: number;
  currentModel: string;
  status: string;
}

interface TrendsState {
  // Analysis state per account
  analyses: Record<string, TrendAnalysis | null>;
  analysisProgress: Record<string, AnalysisProgress | null>;
  isAnalyzing: Record<string, boolean>;
  analysisError: Record<string, string | null>;
  lastAnalyzedAt: Record<string, number | null>;

  // Actions
  setAnalysis: (accountId: string, analysis: TrendAnalysis | null) => void;
  setIsAnalyzing: (accountId: string, isAnalyzing: boolean) => void;
  setAnalysisProgress: (accountId: string, progress: AnalysisProgress | null) => void;
  setAnalysisError: (accountId: string, error: string | null) => void;
  getAnalysis: (accountId: string) => TrendAnalysis | null;
  getIsAnalyzing: (accountId: string) => boolean;
  getAnalysisProgress: (accountId: string) => AnalysisProgress | null;
  getAnalysisError: (accountId: string) => string | null;
  clearAnalysis: (accountId: string) => void;
}

// ============================================================================
// Store
// ============================================================================

export const useTrendsStore = create<TrendsState>()((set, get) => ({
  analyses: {},
  analysisProgress: {},
  isAnalyzing: {},
  analysisError: {},
  lastAnalyzedAt: {},

  setAnalysis: (accountId, analysis) =>
    set((state) => ({
      analyses: { ...state.analyses, [accountId]: analysis },
      lastAnalyzedAt: { ...state.lastAnalyzedAt, [accountId]: analysis ? Date.now() : null },
    })),

  setIsAnalyzing: (accountId, isAnalyzing) =>
    set((state) => ({
      isAnalyzing: { ...state.isAnalyzing, [accountId]: isAnalyzing },
    })),

  setAnalysisProgress: (accountId, progress) =>
    set((state) => ({
      analysisProgress: { ...state.analysisProgress, [accountId]: progress },
    })),

  setAnalysisError: (accountId, error) =>
    set((state) => ({
      analysisError: { ...state.analysisError, [accountId]: error },
    })),

  getAnalysis: (accountId) => get().analyses[accountId] || null,

  getIsAnalyzing: (accountId) => get().isAnalyzing[accountId] || false,

  getAnalysisProgress: (accountId) => get().analysisProgress[accountId] || null,

  getAnalysisError: (accountId) => get().analysisError[accountId] || null,

  clearAnalysis: (accountId) =>
    set((state) => ({
      analyses: { ...state.analyses, [accountId]: null },
      analysisProgress: { ...state.analysisProgress, [accountId]: null },
      analysisError: { ...state.analysisError, [accountId]: null },
      lastAnalyzedAt: { ...state.lastAnalyzedAt, [accountId]: null },
    })),
}));

// ============================================================================
// Hooks for convenient access
// ============================================================================

export function useTrendAnalysis(accountId: string | null) {
  const analysis = useTrendsStore((state) =>
    accountId ? state.analyses[accountId] || null : null
  );
  const isAnalyzing = useTrendsStore((state) =>
    accountId ? state.isAnalyzing[accountId] || false : false
  );
  const progress = useTrendsStore((state) =>
    accountId ? state.analysisProgress[accountId] || null : null
  );
  const error = useTrendsStore((state) =>
    accountId ? state.analysisError[accountId] || null : null
  );

  const setAnalysis = useTrendsStore((state) => state.setAnalysis);
  const setIsAnalyzing = useTrendsStore((state) => state.setIsAnalyzing);
  const setAnalysisProgress = useTrendsStore((state) => state.setAnalysisProgress);
  const setAnalysisError = useTrendsStore((state) => state.setAnalysisError);
  const clearAnalysis = useTrendsStore((state) => state.clearAnalysis);

  return {
    analysis,
    isAnalyzing,
    progress,
    error,
    setAnalysis: (a: TrendAnalysis | null) => accountId && setAnalysis(accountId, a),
    setIsAnalyzing: (v: boolean) => accountId && setIsAnalyzing(accountId, v),
    setProgress: (p: { current: number; total: number; currentModel: string; status: string } | null) =>
      accountId && setAnalysisProgress(accountId, p),
    setError: (e: string | null) => accountId && setAnalysisError(accountId, e),
    clear: () => accountId && clearAnalysis(accountId),
  };
}
