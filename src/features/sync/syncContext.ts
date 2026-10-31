import { createContext, useContext } from 'react';

export type SyncPhase =
  /** No Supabase configuration in this build. */
  | 'unconfigured'
  | 'signed-out'
  | 'idle'
  | 'syncing'
  | 'offline'
  /** Signed in with an account that is not allowed to write. */
  | 'forbidden'
  | 'error';

export interface SyncContextValue {
  phase: SyncPhase;
  email: string | null;
  /** Epoch milliseconds of the last successful sync on this device. */
  lastSyncedAt: number | null;
  /** Local changes not yet stored online. */
  pendingCount: number;
  errorMessage: string | null;
  syncNow: () => Promise<void>;
  /** Sends an e-mail with a sign-in code and link. */
  requestSignIn: (email: string) => Promise<void>;
  /** Signs in with the code from that e-mail. */
  verifyCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const SyncContext = createContext<SyncContextValue | null>(null);

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used inside <SyncProvider>.');
  }
  return context;
}
