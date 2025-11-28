"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { db, initializeSettings, type UserSettings } from "@/lib/db";
import { settingsService } from "@/lib/db/services";

// ============================================================================
// Context Types
// ============================================================================

interface DataContextValue {
  isReady: boolean;
  settings: UserSettings | null;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface DataProviderProps {
  children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const { authenticated, ready: privyReady } = usePrivy();
  const [isReady, setIsReady] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Initialize database and settings when authenticated
  useEffect(() => {
    async function initialize() {
      // Wait for Privy to be ready
      if (!privyReady) {
        console.log("[DataProvider] Waiting for Privy to be ready...");
        return;
      }

      // If not authenticated, mark as ready but with no data
      if (!authenticated) {
        console.log("[DataProvider] Not authenticated, skipping data init");
        setIsReady(true); // Still mark ready so redirects can happen
        setSettings(null);
        return;
      }

      try {
        console.log("[DataProvider] Initializing data layer...");

        // Ensure database is open
        await db.open();
        console.log("[DataProvider] Database opened");

        // Initialize settings
        const userSettings = await initializeSettings();
        setSettings(userSettings);
        console.log("[DataProvider] Settings initialized");

        // Mark as ready
        setIsReady(true);
        console.log("[DataProvider] Data layer ready!");
      } catch (error) {
        console.error("[DataProvider] Failed to initialize data layer:", error);
        // Still mark as ready so the app doesn't get stuck
        setIsReady(true);
      }
    }

    initialize();
  }, [authenticated, privyReady]);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    try {
      const updated = await settingsService.update(updates);
      setSettings(updated);
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw error;
    }
  }, []);

  // Clear all data (for logout or reset)
  const clearAllData = useCallback(async () => {
    try {
      // Delete all tables
      await db.transaction(
        "rw",
        [
          db.accounts,
          db.videos,
          db.videoMetrics,
          db.accountMetrics,
          db.ideas,
          db.tasks,
          db.streaks,
          db.videoNotes,
          db.trendReports,
          db.conversations,
          db.userSettings,
        ],
        async () => {
          await db.accounts.clear();
          await db.videos.clear();
          await db.videoMetrics.clear();
          await db.accountMetrics.clear();
          await db.ideas.clear();
          await db.tasks.clear();
          await db.streaks.clear();
          await db.videoNotes.clear();
          await db.trendReports.clear();
          await db.conversations.clear();
          await db.userSettings.clear();
        }
      );

      // Re-initialize settings
      const newSettings = await initializeSettings();
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to clear data:", error);
      throw error;
    }
  }, []);

  return (
    <DataContext.Provider
      value={{
        isReady,
        settings,
        updateSettings,
        clearAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}

// ============================================================================
// Loading Component
// ============================================================================

export function DataGate({ children }: { children: React.ReactNode }) {
  const { isReady } = useData();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
