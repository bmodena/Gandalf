#!/usr/bin/env node
/**
 * Export the training corpus: pulls labeled metadata from D1 and the matching
 * audio WAVs from R2 into a local folder, ready for training.
 *
 * Uses your existing `wrangler` login — no API token needed.
 *
 * Usage:
 *   node scripts/export-corpus.mjs [--out <dir>] [--profile <profileId>] [--no-audio]
 *
 * Output:
 *   <out>/labels.jsonl   one JSON object per sample
 *   <out>/labels.csv     same data as a spreadsheet
 *   <out>/audio/<profileId>/<phraseId>/<id>.wav
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ACCOUNT_ID = '643d9cb0ebfaddd492541bd8440ce721';
const DB = 'gandalf-samples';
const BUCKET = 'gandalf-audio';

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const outDir = getArg('--out', 'corpus-export');
const profileFilter = getArg('--profile', null);
const skipAudio = args.includes('--no-audio');

const env = { ...process.env, CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID };

function wrangler(wrArgs, opts = {}) {
  return execFileSync('npx', ['--yes', 'wrangler@latest', ...wrArgs], {
    env,
    maxBuffer: 1024 * 1024 * 64,
    ...opts,
  });
}

function queryD1() {
  const where = profileFilter ? `WHERE profile_id = '${profileFilter}'` : '';
  const sql = `SELECT * FROM samples ${where} ORDER BY created_at ASC`;
  const raw = wrangler(
    ['d1', 'execute', DB, '--remote', '--json', '--command', sql],
    { encoding: 'utf8' },
  );
  // wrangler may prepend a banner; extract the JSON array.
  const start = raw.indexOf('[');
  const parsed = JSON.parse(raw.slice(start));
  const block = Array.isArray(parsed) ? parsed[0] : parsed;
  return block?.results ?? [];
}

function toCsv(rows) {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

function downloadAudio(rows) {
  let ok = 0;
  let failed = 0;
  rows.forEach((row, i) => {
    if (!row.audio_key) return;
    const dest = join(outDir, 'audio', row.audio_key);
    mkdirSync(dirname(dest), { recursive: true });
    try {
      wrangler(['r2', 'object', 'get', `${BUCKET}/${row.audio_key}`, '--file', dest], {
        stdio: 'ignore',
      });
      ok++;
      process.stdout.write(`\r  downloaded ${ok}/${rows.length}`);
    } catch (err) {
      failed++;
      console.warn(`\n  ! failed: ${row.audio_key} (${err.message.split('\n')[0]})`);
    }
  });
  process.stdout.write('\n');
  return { ok, failed };
}

// --- run ---
console.log(`Querying D1 (${DB})${profileFilter ? ` for profile ${profileFilter}` : ''}…`);
const rows = queryD1();
console.log(`Found ${rows.length} sample(s).`);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'labels.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n'));
writeFileSync(join(outDir, 'labels.csv'), toCsv(rows));
console.log(`Wrote labels.jsonl and labels.csv to ${outDir}/`);

if (rows.length === 0) {
  console.log('No samples yet — record one in the app, then re-run.');
} else if (skipAudio) {
  console.log('Skipped audio download (--no-audio).');
} else {
  console.log('Downloading audio from R2…');
  const { ok, failed } = downloadAudio(rows);
  console.log(`Audio: ${ok} downloaded${failed ? `, ${failed} failed` : ''}.`);
}
console.log('Done.');
