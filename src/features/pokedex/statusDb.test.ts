import { afterEach, describe, expect, it } from 'vitest';
import { BUNDLED_ENTRIES, INITIAL_STATUSES, countStatuses } from './catalog';
import { ShinyDexDatabase, seedMissingStatuses, writeStatus } from './statusDb';

let database: ShinyDexDatabase;

afterEach(async () => {
  await database?.delete();
});

describe('reference data', () => {
  it('matches the Google Sheet totals', () => {
    const statuses = new Map(Object.entries(INITIAL_STATUSES));
    expect(countStatuses(BUNDLED_ENTRIES, statuses)).toEqual({ total: 1220, obtained: 1033, toFarm: 162, locked: 25 });
  });

  it('has unique ids', () => {
    expect(new Set(BUNDLED_ENTRIES.map((entry) => entry.id)).size).toBe(BUNDLED_ENTRIES.length);
  });
});

describe('seedMissingStatuses', () => {
  it('fills an empty database with the imported statuses', async () => {
    database = new ShinyDexDatabase('test-seed');
    const added = await seedMissingStatuses(database, ['bulbasaur', 'victini'], { bulbasaur: 'obtained', victini: 'locked' });
    expect(added).toBe(2);
    expect(await database.statuses.get('victini')).toEqual({ id: 'victini', status: 'locked', updatedAt: 0 });
  });

  it('never overwrites a status the user changed', async () => {
    database = new ShinyDexDatabase('test-preserve');
    await seedMissingStatuses(database, ['bulbasaur'], { bulbasaur: 'obtained' });
    await writeStatus(database, 'bulbasaur', 'to-farm');

    const added = await seedMissingStatuses(database, ['bulbasaur', 'ivysaur'], { bulbasaur: 'obtained' });

    expect(added).toBe(1);
    expect((await database.statuses.get('bulbasaur'))?.status).toBe('to-farm');
    // Entries unknown to the import (added later) start as "to farm".
    expect((await database.statuses.get('ivysaur'))?.status).toBe('to-farm');
  });
});
