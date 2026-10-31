/**
 * Builds the app's reference data from the Google Sheet snapshot and the
 * PokéAPI data dumps (see README, "Import des données").
 *
 * Writes:
 * - src/data/pokedex.json          every tracked entry, in display order
 * - src/data/initial-statuses.json the Sheet's status for each entry
 * - data/sprite-sources.json       which HOME sprite file each entry uses
 * - data/import-report.md          checks and anything that needs a human look
 *
 * Exits with a non-zero code when a row cannot be matched or when the totals
 * differ from the Sheet's summary tab, so a broken import never goes unnoticed.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import {
  ENTRY_CATEGORIES,
  type EntryCategory,
  type PokedexEntry,
  type PokemonType,
  type ShinyStatus,
  type StatusMap,
} from '../../src/features/pokedex/model.ts';
import { loadPokeApiData, type PokeApiData } from './pokeapi.ts';
import { entryIdFor, resolveSheetRow, type ResolvedForm } from './resolve.ts';
import { resolveSpriteSource, type SpriteSource } from './sprites.ts';

const ROOT = resolve(import.meta.dirname, '../..');

interface NationalTab {
  name: string;
  generation: number;
  first: number;
  last: number;
  exceptions: Record<string, string>;
  codeOverrides: Record<string, string>;
}

interface FormTab {
  name: string;
  category: Exclude<EntryCategory, 'national'>;
  rows: Array<[number, string, string, string]>;
}

interface Snapshot {
  nationalTabs: NationalTab[];
  formTabs: FormTab[];
}

interface StatusCounts {
  obtained: number;
  toFarm: number;
  locked: number;
}

interface Summary {
  tabs: Record<string, StatusCounts>;
  total: StatusCounts;
}

/** A Sheet row before matching, with the tab it came from for reporting. */
interface SheetRow {
  tab: string;
  category: EntryCategory;
  dex: number;
  /** Empty for national rows, whose French name comes from PokéAPI. */
  nameFr: string;
  code: string;
  status: ShinyStatus;
  rowIndex: number;
}

const SHEET_STATUSES: Readonly<Record<string, ShinyStatus>> = {
  Oui: 'obtained',
  'A farm': 'to-farm',
  'Shiny lock': 'locked',
};

/**
 * National numbers typed wrongly in the Sheet, keyed by `${tab}|${French name}`.
 * The snapshot stays a faithful copy of the Sheet; corrections live here and
 * are listed in the import report.
 */
const DEX_CORRECTIONS: Readonly<Record<string, number>> = {
  // Famignol (Maushold) is #925; #924 is its pre-evolution Compagnol (Tandemaus).
  'Formes Alternatives|Famignol Trois': 925,
};

function toStatus(value: string, context: string): ShinyStatus {
  const status = SHEET_STATUSES[value.trim()];
  if (!status) {
    throw new Error(`Unknown status "${value}" (${context}).`);
  }
  return status;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

function writeFile(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

/** One entry per line keeps the generated JSON readable in diffs. */
function toLineJson(values: unknown[]): string {
  return `[\n${values.map((value) => `  ${JSON.stringify(value)}`).join(',\n')}\n]\n`;
}

function expandSheetRows(snapshot: Snapshot, data: PokeApiData): SheetRow[] {
  const rows: SheetRow[] = [];

  for (const tab of snapshot.nationalTabs) {
    for (let dex = tab.first; dex <= tab.last; dex += 1) {
      const species = data.speciesById.get(dex);
      if (!species) {
        throw new Error(`Species #${dex} is missing from the PokéAPI data.`);
      }
      rows.push({
        tab: tab.name,
        category: 'national',
        dex,
        nameFr: '',
        code: tab.codeOverrides[dex] ?? species.identifier,
        status: tab.exceptions[dex] ? toStatus(tab.exceptions[dex], `${tab.name} #${dex}`) : 'obtained',
        rowIndex: dex - tab.first,
      });
    }
  }

  for (const tab of snapshot.formTabs) {
    tab.rows.forEach(([sheetDex, nameFr, code, status], rowIndex) => {
      const dex = DEX_CORRECTIONS[`${tab.name}|${nameFr}`] ?? sheetDex;
      rows.push({
        tab: tab.name,
        category: tab.category,
        dex,
        nameFr: nameFr.trim(),
        code,
        status: toStatus(status, `${tab.name} row ${rowIndex + 2}`),
        rowIndex,
      });
    });
  }
  return rows;
}

function countStatuses(statuses: ShinyStatus[]): StatusCounts {
  return {
    obtained: statuses.filter((status) => status === 'obtained').length,
    toFarm: statuses.filter((status) => status === 'to-farm').length,
    locked: statuses.filter((status) => status === 'locked').length,
  };
}

const sameCounts = (a: StatusCounts, b: StatusCounts) =>
  a.obtained === b.obtained && a.toFarm === b.toFarm && a.locked === b.locked;

const formatCounts = (counts: StatusCounts) => `${counts.obtained} / ${counts.toFarm} / ${counts.locked}`;

function main(): void {
  const { values } = parseArgs({
    options: {
      pokeapi: { type: 'string', default: resolve(ROOT, '.cache/pokeapi/api/data/v2/csv') },
      'sprites-index': { type: 'string', default: resolve(ROOT, '.cache/pokeapi/home-files.txt') },
    },
  });

  const snapshot = readJson<Snapshot>(resolve(ROOT, 'data/sheet-snapshot.json'));
  const summary = readJson<Summary>(resolve(ROOT, 'data/sheet-summary.json'));
  const data = loadPokeApiData(values.pokeapi);
  const spriteFiles = new Set(
    readFileSync(values['sprites-index'], 'utf-8')
      .split('\n')
      .map((line) => line.trim().replace(/^sprites\/pokemon\/other\/home\//, ''))
      .filter(Boolean),
  );

  const sheetRows = expandSheetRows(snapshot, data);
  const unresolved: SheetRow[] = [];
  const resolvedRows: Array<{ row: SheetRow; resolved: ResolvedForm; id: string }> = [];

  for (const row of sheetRows) {
    const resolved = resolveSheetRow({ dex: row.dex, nameFr: row.nameFr, code: row.code }, data);
    if (resolved) {
      resolvedRows.push({ row, resolved, id: entryIdFor(resolved) });
    } else {
      unresolved.push(row);
    }
  }

  const idCounts = new Map<string, number>();
  for (const { id } of resolvedRows) {
    idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }
  const duplicateIds = [...idCounts].filter(([, count]) => count > 1).map(([id]) => id);

  // Forms that share a French label within one tab (the six Minior cores are all
  // "Météno") get PokéAPI's French form name appended so they stay distinguishable.
  // Across tabs the category already tells them apart (Alolan vs Galarian Meowth).
  const formLabelKey = (row: SheetRow) => `${row.tab}|${row.dex}|${row.nameFr}`;
  const formLabelCounts = new Map<string, number>();
  for (const { row } of resolvedRows) {
    if (row.category !== 'national') {
      formLabelCounts.set(formLabelKey(row), (formLabelCounts.get(formLabelKey(row)) ?? 0) + 1);
    }
  }

  const entries: Array<PokedexEntry & { sortKey: [number, number, number] }> = [];
  const statuses: StatusMap = {};
  const spriteSources: Record<string, SpriteSource> = {};
  const renamed: string[] = [];
  const approximateSprites: string[] = [];
  const missingTypes: string[] = [];

  for (const { row, resolved, id } of resolvedRows) {
    const species = data.speciesById.get(row.dex);
    if (!species) {
      throw new Error(`Species #${row.dex} is missing from the PokéAPI data.`);
    }

    let nameFr = row.category === 'national' ? species.nameFr : row.nameFr;
    if (row.category !== 'national' && (formLabelCounts.get(formLabelKey(row)) ?? 0) > 1) {
      const formLabel = resolved.form.formNameFr || resolved.form.formIdentifier;
      nameFr = `${row.nameFr} (${formLabel})`;
      renamed.push(`${row.tab} : « ${row.nameFr} » → « ${nameFr} »`);
    }

    const nameEn = resolved.isGenderVariant ? `${species.nameEn} (Female)` : resolved.form.nameEn;
    const types = (data.typesByPokemonId.get(resolved.form.pokemonId) ?? []) as PokemonType[];
    if (types.length === 0) {
      missingTypes.push(id);
    }

    const sprite = resolveSpriteSource(resolved, spriteFiles);
    if (!sprite.exact) {
      approximateSprites.push(`${id} (${row.tab} : ${row.nameFr || nameFr}) → sprite de l'espèce ${sprite.normal}`);
    }

    entries.push({
      id,
      dex: row.dex,
      nameFr,
      nameEn,
      genusFr: species.genusFr,
      generation: species.generation,
      category: row.category,
      types,
      sortKey: [row.dex, ENTRY_CATEGORIES.indexOf(row.category), row.rowIndex],
    });
    statuses[id] = row.status;
    spriteSources[id] = sprite;
  }

  entries.sort((a, b) => a.sortKey[0] - b.sortKey[0] || a.sortKey[1] - b.sortKey[1] || a.sortKey[2] - b.sortKey[2]);

  // Totals per tab, compared with the Sheet's own summary.
  const countMismatches: string[] = [];
  const tabLines: string[] = [];
  for (const [tab, expected] of Object.entries(summary.tabs)) {
    const actual = countStatuses(sheetRows.filter((row) => row.tab === tab).map((row) => row.status));
    const ok = sameCounts(actual, expected);
    tabLines.push(`| ${tab} | ${formatCounts(expected)} | ${formatCounts(actual)} | ${ok ? 'OK' : 'ÉCART'} |`);
    if (!ok) countMismatches.push(tab);
  }
  const total = countStatuses(Object.values(statuses));
  const totalOk = sameCounts(total, summary.total);
  if (!totalOk) countMismatches.push('Total');

  const failed = unresolved.length > 0 || duplicateIds.length > 0 || countMismatches.length > 0;

  const report = [
    "# Rapport d'import",
    '',
    `Résultat : **${failed ? 'ÉCHEC' : 'OK'}** · ${entries.length} entrées générées.`,
    '',
    '## Totaux par onglet (obtenus / à farm / shiny lock)',
    '',
    '| Onglet | Sheet | Import | Contrôle |',
    '| --- | --- | --- | --- |',
    ...tabLines,
    `| **Total** | ${formatCounts(summary.total)} | ${formatCounts(total)} | ${totalOk ? 'OK' : 'ÉCART'} |`,
    '',
    '## Lignes non reconnues',
    '',
    ...(unresolved.length
      ? unresolved.map((row) => `- ${row.tab} : #${row.dex} « ${row.nameFr} » (${row.code})`)
      : ['Aucune.']),
    '',
    '## Numéros corrigés par rapport au Sheet',
    '',
    ...Object.entries(DEX_CORRECTIONS).map(([key, dex]) => `- ${key.replace('|', ' : « ')} » → n° ${dex}`),
    '',
    '## Identifiants en double',
    '',
    ...(duplicateIds.length ? duplicateIds.map((id) => `- ${id}`) : ['Aucun.']),
    '',
    '## Noms complétés pour lever une ambiguïté',
    '',
    ...(renamed.length ? renamed.map((line) => `- ${line}`) : ['Aucun.']),
    '',
    '## Sprites approximatifs (pas de fichier propre à la forme)',
    '',
    ...(approximateSprites.length ? approximateSprites.map((line) => `- ${line}`) : ['Aucun.']),
    '',
    '## Entrées sans type',
    '',
    ...(missingTypes.length ? missingTypes.map((id) => `- ${id}`) : ['Aucune.']),
    '',
  ].join('\n');

  writeFile(resolve(ROOT, 'data/import-report.md'), report);
  console.log(report);

  if (failed) {
    console.error('Import failed: see data/import-report.md. Generated data files were not updated.');
    process.exitCode = 1;
    return;
  }

  writeFile(resolve(ROOT, 'src/data/pokedex.json'), toLineJson(entries.map(({ sortKey: _sortKey, ...entry }) => entry)));
  writeFile(resolve(ROOT, 'src/data/initial-statuses.json'), `${JSON.stringify(statuses, null, 2)}\n`);
  writeFile(resolve(ROOT, 'data/sprite-sources.json'), `${JSON.stringify(spriteSources, null, 2)}\n`);
}

main();
