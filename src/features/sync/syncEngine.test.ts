import { afterEach, describe, expect, it } from 'vitest';
import { ShinyDexDatabase, seedMissingStatuses, writeStatus } from '../pokedex/statusDb';
import type { RemoteStatus, RemoteStatusStore, StatusChangeToPush } from './remoteStore';
import { syncOnce } from './syncEngine';

/** In-memory server applying the same last-write-wins rule as public.push_statuses. */
class FakeRemote implements RemoteStatusStore {
  rows = new Map<string, RemoteStatus>();
  private clock = 0;

  async count() {
    return this.rows.size;
  }

  async push(changes: readonly StatusChangeToPush[]) {
    for (const change of changes) {
      const stored = this.rows.get(change.entryId);
      if (!stored || stored.updatedAt < change.updatedAt) {
        this.clock += 1;
        this.rows.set(change.entryId, { ...change, syncedAt: String(this.clock).padStart(8, '0') });
      }
    }
  }

  async pullSince(cursor: string | null, limit: number) {
    return [...this.rows.values()]
      .filter((row) => cursor === null || row.syncedAt > cursor)
      .sort((a, b) => a.syncedAt.localeCompare(b.syncedAt))
      .slice(0, limit);
  }
}

const databases: ShinyDexDatabase[] = [];
let databaseCounter = 0;

function newDevice(): ShinyDexDatabase {
  databaseCounter += 1;
  const database = new ShinyDexDatabase(`sync-test-${databaseCounter}`);
  databases.push(database);
  return database;
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.delete()));
});

const SHEET = { bulbasaur: 'obtained', ivysaur: 'to-farm', victini: 'locked' } as const;
const IDS = Object.keys(SHEET);

describe('syncOnce', () => {
  it('fills an empty server with the whole collection on the first sync', async () => {
    const remote = new FakeRemote();
    const phone = newDevice();
    await seedMissingStatuses(phone, IDS, SHEET);

    const result = await syncOnce(phone, remote);

    expect(result.pushed).toBe(3);
    expect(remote.rows.get('victini')?.status).toBe('locked');
  });

  it('sends a local change and clears it from the queue', async () => {
    const remote = new FakeRemote();
    const phone = newDevice();
    await seedMissingStatuses(phone, IDS, SHEET);
    await syncOnce(phone, remote);

    await writeStatus(phone, 'ivysaur', 'obtained');
    expect(await phone.pendingChanges.count()).toBe(1);
    await syncOnce(phone, remote);

    expect(remote.rows.get('ivysaur')?.status).toBe('obtained');
    expect(await phone.pendingChanges.count()).toBe(0);
  });

  it('brings a change made on another device', async () => {
    const remote = new FakeRemote();
    const phone = newDevice();
    const computer = newDevice();
    await seedMissingStatuses(phone, IDS, SHEET);
    await seedMissingStatuses(computer, IDS, SHEET);
    await syncOnce(phone, remote);
    await syncOnce(computer, remote);

    await writeStatus(phone, 'ivysaur', 'obtained');
    await syncOnce(phone, remote);
    const result = await syncOnce(computer, remote);

    expect(result.pulled).toBe(1);
    expect((await computer.statuses.get('ivysaur'))?.status).toBe('obtained');
  });

  it('keeps the most recent change when both devices edited offline', async () => {
    const remote = new FakeRemote();
    const phone = newDevice();
    const computer = newDevice();
    for (const device of [phone, computer]) {
      await seedMissingStatuses(device, IDS, SHEET);
      await syncOnce(device, remote);
    }

    await writeStatus(computer, 'bulbasaur', 'to-farm');
    await new Promise((resolve) => setTimeout(resolve, 5));
    await writeStatus(phone, 'bulbasaur', 'locked'); // later, so it wins

    await syncOnce(computer, remote);
    await syncOnce(phone, remote);
    await syncOnce(computer, remote);

    expect(remote.rows.get('bulbasaur')?.status).toBe('locked');
    expect((await computer.statuses.get('bulbasaur'))?.status).toBe('locked');
    expect((await phone.statuses.get('bulbasaur'))?.status).toBe('locked');
  });

  it('keeps changes queued when the server cannot be reached', async () => {
    const remote = new FakeRemote();
    const phone = newDevice();
    await seedMissingStatuses(phone, IDS, SHEET);
    await syncOnce(phone, remote);
    await writeStatus(phone, 'ivysaur', 'obtained');

    const offline: RemoteStatusStore = {
      count: () => remote.count(),
      push: () => Promise.reject(new Error('Failed to fetch')),
      pullSince: () => Promise.reject(new Error('Failed to fetch')),
    };
    await expect(syncOnce(phone, offline)).rejects.toThrow('Failed to fetch');
    expect(await phone.pendingChanges.count()).toBe(1);

    await syncOnce(phone, remote);
    expect(remote.rows.get('ivysaur')?.status).toBe('obtained');
  });
});

describe('database upgrade to version 2', () => {
  it('queues the changes made before synchronisation existed', async () => {
    const name = `upgrade-test-${Date.now()}`;
    const { default: Dexie } = await import('dexie');
    const legacy = new Dexie(name);
    legacy.version(1).stores({ statuses: 'id' });
    await legacy.table('statuses').bulkPut([
      { id: 'bulbasaur', status: 'obtained', updatedAt: 0 },
      { id: 'ivysaur', status: 'obtained', updatedAt: 1_700_000_000_000 },
    ]);
    legacy.close();

    const upgraded = new ShinyDexDatabase(name);
    databases.push(upgraded);
    const pending = await upgraded.pendingChanges.toArray();
    expect(pending.map((change) => change.id)).toEqual(['ivysaur']);
  });
});
