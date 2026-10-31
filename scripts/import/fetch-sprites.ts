/**
 * Downloads the HOME sprites listed in data/sprite-sources.json and stores
 * them as compressed WebP files in public/sprites/{normal,shiny}/<id>.webp.
 *
 * Existing files are skipped, so the script can be re-run after an
 * interruption or after new entries are added. Pass --force to rebuild all.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { SPRITE_BASE_URL, type SpriteSource } from './sprites.ts';

const ROOT = resolve(import.meta.dirname, '../..');
const OUTPUT_DIR = resolve(ROOT, 'public/sprites');

/** HOME sprites are 512 px; cards show them at ≤ 128 CSS px, so 256 px stays sharp on 2× screens. */
const SPRITE_SIZE = 256;
const WEBP_QUALITY = 82;
const CONCURRENCY = 8;
const MAX_ATTEMPTS = 3;

interface Job {
  url: string;
  output: string;
}

async function download(url: string): Promise<Buffer> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      await new Promise((done) => setTimeout(done, attempt * 1000));
    }
  }
  throw new Error(`Failed to download ${url}: ${String(lastError)}`);
}

async function processJob(job: Job): Promise<number> {
  const source = await download(job.url);
  const webp = await sharp(source)
    .resize(SPRITE_SIZE, SPRITE_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: WEBP_QUALITY, alphaQuality: 90, effort: 5 })
    .toBuffer();
  writeFileSync(job.output, webp);
  return webp.length;
}

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { force: { type: 'boolean', default: false } } });
  const sources = JSON.parse(readFileSync(resolve(ROOT, 'data/sprite-sources.json'), 'utf-8')) as Record<
    string,
    SpriteSource
  >;

  for (const variant of ['normal', 'shiny']) {
    mkdirSync(resolve(OUTPUT_DIR, variant), { recursive: true });
  }

  const jobs: Job[] = Object.entries(sources)
    .flatMap(([id, source]) => [
      { url: SPRITE_BASE_URL + source.normal, output: resolve(OUTPUT_DIR, 'normal', `${id}.webp`) },
      { url: SPRITE_BASE_URL + source.shiny, output: resolve(OUTPUT_DIR, 'shiny', `${id}.webp`) },
    ])
    .filter((job) => values.force || !existsSync(job.output));

  console.log(`${jobs.length} sprite(s) to fetch.`);
  let done = 0;
  let bytes = 0;
  const failures: string[] = [];
  const queue = [...jobs];

  // A small pool of workers keeps a few downloads in flight without hammering GitHub.
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        try {
          // Await first, then add: `bytes += await …` reads `bytes` before the
          // await and loses the other workers' additions.
          const size = await processJob(job);
          bytes += size;
        } catch (error) {
          failures.push(String(error));
        }
        done += 1;
        if (done % 200 === 0) {
          console.log(`${done} / ${jobs.length}`);
        }
      }
    }),
  );

  console.log(`Done: ${done - failures.length} written, ${(bytes / 1024 / 1024).toFixed(1)} MB.`);
  if (failures.length > 0) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  }
}

await main();
