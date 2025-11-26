import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccountType = "ai_journey" | "dog_content";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  platforms: string[];
  nicheKeywords: string[];
  createdAt: Date;
}

interface AccountState {
  accounts: Account[];
  selectedAccountId: string | null;
  setAccounts: (accounts: Account[]) => void;
  selectAccount: (accountId: string) => void;
  getSelectedAccount: () => Account | null;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: [],
      selectedAccountId: null,
      setAccounts: (accounts) => {
        set({ accounts });
        // Auto-select first account if none selected
        if (!get().selectedAccountId && accounts.length > 0) {
          set({ selectedAccountId: accounts[0].id });
        }
      },
      selectAccount: (accountId) => set({ selectedAccountId: accountId }),
      getSelectedAccount: () => {
        const state = get();
        return (
          state.accounts.find((a) => a.id === state.selectedAccountId) ?? null
        );
      },
    }),
    {
      name: "smcc-account-store",
    }
  )
);
