import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createSupabaseAddedEntriesStore } from '../newPokemon/addedEntriesStore';
import { pullAddedEntries } from '../newPokemon/newSpecies';
import { db as defaultDatabase, type ShinyDexDatabase } from '../pokedex/statusDb';
import { NotAllowedToWriteError, createSupabaseStatusStore } from './remoteStore';
import { SyncContext, type SyncContextValue, type SyncPhase } from './syncContext';
import { META_LAST_SYNCED_AT, syncOnce } from './syncEngine';
import { supabase as defaultClient } from './supabaseClient';

/** Wait after a local change before syncing, so a burst of taps goes in one request. */
const PUSH_DEBOUNCE_MS = 1500;
/** Pull other devices' changes this often while the app is visible. */
const POLL_INTERVAL_MS = 2 * 60 * 1000;

interface SyncProviderProps {
  children: ReactNode;
  /** Injected in tests. */
  client?: SupabaseClient | null;
  database?: ShinyDexDatabase;
}

/**
 * Keeps this device's statuses in step with the server while the owner is
 * signed in: after each local change, when the connection comes back, when
 * the app returns to the foreground, and every few minutes.
 */
export function SyncProvider({ children, client = defaultClient, database = defaultDatabase }: SyncProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  /** Phase of the sync activity while signed in; the visible phase is derived below. */
  const [activity, setActivity] = useState<Exclude<SyncPhase, 'unconfigured' | 'signed-out'>>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const running = useRef<Promise<void> | null>(null);

  const remote = useMemo(() => (client ? createSupabaseStatusStore(client) : null), [client]);
  const addedEntriesStore = useMemo(() => (client ? createSupabaseAddedEntriesStore(client) : null), [client]);
  const pendingCount = useLiveQuery(() => database.pendingChanges.count(), [database]) ?? 0;
  const lastSyncedAt = useLiveQuery(
    async () => ((await database.meta.get(META_LAST_SYNCED_AT))?.value as number | undefined) ?? null,
    [database],
  );

  useEffect(() => {
    if (!client) return;
    void client.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, [client]);

  const signedIn = session !== null;

  const syncNow = useCallback(async () => {
    if (!remote || !addedEntriesStore || !signedIn) return;
    if (!navigator.onLine) {
      setActivity('offline');
      return;
    }
    // One round at a time; a request made meanwhile reuses the running one.
    if (running.current) return running.current;
    setActivity('syncing');
    running.current = syncOnce(database, remote)
      // Species added from another device: small table, read whole each round.
      .then(() => pullAddedEntries(database, addedEntriesStore))
      .then(() => {
        setActivity('idle');
        setErrorMessage(null);
      })
      .catch((error: unknown) => {
        if (error instanceof NotAllowedToWriteError) {
          setActivity('forbidden');
          setErrorMessage(error.message);
        } else {
          setActivity(navigator.onLine ? 'error' : 'offline');
          setErrorMessage(error instanceof Error ? error.message : String(error));
        }
      })
      .finally(() => {
        running.current = null;
      });
    return running.current;
  }, [database, remote, addedEntriesStore, signedIn]);

  // Signing in (or opening the app signed in) triggers a first sync.
  useEffect(() => {
    if (!signedIn) return;
    const timer = window.setTimeout(() => void syncNow(), 0);
    return () => window.clearTimeout(timer);
  }, [signedIn, syncNow]);

  const phase: SyncPhase = !client ? 'unconfigured' : !signedIn ? 'signed-out' : activity;

  // Push local changes shortly after they are made.
  useEffect(() => {
    if (!signedIn || pendingCount === 0) return;
    const timer = window.setTimeout(() => void syncNow(), PUSH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [signedIn, pendingCount, syncNow]);

  // Reconnection, return to the foreground, and periodic pulls.
  useEffect(() => {
    if (!signedIn) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void syncNow();
    };
    const onOffline = () => setActivity('offline');
    const onOnline = () => void syncNow();
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void syncNow();
    }, POLL_INTERVAL_MS);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(interval);
    };
  }, [signedIn, syncNow]);

  const requestSignIn = useCallback(
    async (email: string) => {
      if (!client) return;
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/reglages` },
      });
      if (error) throw new Error(error.message);
    },
    [client],
  );

  const verifyCode = useCallback(
    async (email: string, code: string) => {
      if (!client) return;
      const { error } = await client.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) throw new Error(error.message);
    },
    [client],
  );

  const signOut = useCallback(async () => {
    // Local statuses are kept: the device simply stops syncing.
    await client?.auth.signOut();
  }, [client]);

  const value = useMemo<SyncContextValue>(
    () => ({
      phase,
      email: session?.user.email ?? null,
      lastSyncedAt: lastSyncedAt ?? null,
      pendingCount,
      errorMessage,
      syncNow,
      requestSignIn,
      verifyCode,
      signOut,
    }),
    [phase, session, lastSyncedAt, pendingCount, errorMessage, syncNow, requestSignIn, verifyCode, signOut],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
