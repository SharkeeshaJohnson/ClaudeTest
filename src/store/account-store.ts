import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Account } from "@/lib/db";
import { accountService } from "@/lib/db/services";

// ============================================================================
// Types
// ============================================================================

export type SocialPlatform = "tiktok" | "instagram";

interface AccountState {
  accounts: Account[];
  selectedAccountId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAccounts: () => Promise<void>;
  createAccount: (input: {
    name: string;
    platforms: SocialPlatform[];
    tiktokUsername?: string | null;
    instagramUsername?: string | null;
    initialMetrics?: Account["initialMetrics"];
    startingFollowers?: number;
  }) => Promise<Account>;
  updateAccount: (
    id: string,
    input: {
      name?: string;
      platforms?: SocialPlatform[];
      tiktokUsername?: string | null;
      instagramUsername?: string | null;
      initialMetrics?: Account["initialMetrics"];
    }
  ) => Promise<Account | null>;
  deleteAccount: (id: string) => Promise<boolean>;
  selectAccount: (accountId: string) => void;
  getSelectedAccount: () => Account | null;
  clearAccounts: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: [],
      selectedAccountId: null,
      isLoading: false,
      error: null,

      loadAccounts: async () => {
        set({ isLoading: true, error: null });
        try {
          const accounts = await accountService.getAll();
          set({ accounts, isLoading: false });

          // Auto-select first account if none selected
          const state = get();
          if (!state.selectedAccountId && accounts.length > 0) {
            set({ selectedAccountId: accounts[0].id });
          }
        } catch (error) {
          console.error("Failed to load accounts:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to load accounts",
            isLoading: false,
          });
        }
      },

      createAccount: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const account = await accountService.create(input);
          set((state) => ({
            accounts: [...state.accounts, account],
            isLoading: false,
            // Auto-select if first account
            selectedAccountId: state.accounts.length === 0 ? account.id : state.selectedAccountId,
          }));
          return account;
        } catch (error) {
          console.error("Failed to create account:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to create account",
            isLoading: false,
          });
          throw error;
        }
      },

      updateAccount: async (id, input) => {
        set({ error: null });
        try {
          const updated = await accountService.update(id, input);
          if (updated) {
            set((state) => ({
              accounts: state.accounts.map((a) => (a.id === id ? updated : a)),
            }));
          }
          return updated;
        } catch (error) {
          console.error("Failed to update account:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to update account",
          });
          throw error;
        }
      },

      deleteAccount: async (id) => {
        set({ error: null });
        try {
          const success = await accountService.delete(id);
          if (success) {
            set((state) => {
              const newAccounts = state.accounts.filter((a) => a.id !== id);
              return {
                accounts: newAccounts,
                // Select another account if the deleted one was selected
                selectedAccountId:
                  state.selectedAccountId === id
                    ? newAccounts[0]?.id || null
                    : state.selectedAccountId,
              };
            });
          }
          return success;
        } catch (error) {
          console.error("Failed to delete account:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to delete account",
          });
          throw error;
        }
      },

      selectAccount: (accountId) => set({ selectedAccountId: accountId }),

      getSelectedAccount: () => {
        const state = get();
        return state.accounts.find((a) => a.id === state.selectedAccountId) ?? null;
      },

      clearAccounts: () => set({ accounts: [], selectedAccountId: null, error: null }),
    }),
    {
      name: "smcc-account-store",
      // Only persist selectedAccountId, not the full accounts array
      partialize: (state) => ({
        selectedAccountId: state.selectedAccountId,
      }),
    }
  )
);

// ============================================================================
// Hooks for convenient access
// ============================================================================

export function useSelectedAccount() {
  const account = useAccountStore((state) => state.getSelectedAccount());
  const selectedAccountId = useAccountStore((state) => state.selectedAccountId);
  return { account, accountId: selectedAccountId };
}

export function useAccounts() {
  const accounts = useAccountStore((state) => state.accounts);
  const isLoading = useAccountStore((state) => state.isLoading);
  const error = useAccountStore((state) => state.error);
  const loadAccounts = useAccountStore((state) => state.loadAccounts);

  return { accounts, isLoading, error, loadAccounts };
}
