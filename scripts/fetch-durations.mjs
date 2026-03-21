/**
 * Fetches YouTube video durations for all lessons and saves to data/durations.json.
 *
 * Usage:
 *   node scripts/fetch-durations.mjs
 *
 * Requires YOUTUBE_API_KEY in .env.local
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// Load env from .env.local
const envPath = resolve(projectRoot, ".env.local");
const envVars = {};
try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) envVars[m[1].trim()] = m[2].trim();
  }
} catch {
  // ignore missing file
}
const API_KEY = process.env.YOUTUBE_API_KEY ?? envVars["YOUTUBE_API_KEY"];
if (!API_KEY) {
  console.error("Missing YOUTUBE_API_KEY in .env.local");
  process.exit(1);
}

// Extract video ID from YouTube URL
function extractVideoId(url) {
  if (!url) return null;
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Parse ISO 8601 duration (PT1H2M3S) to seconds
function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (Number(m[1] ?? 0) * 3600) + (Number(m[2] ?? 0) * 60) + Number(m[3] ?? 0);
}

// Collect all unique video IDs
const data = JSON.parse(readFileSync(resolve(projectRoot, "data/kibbarulmauni.json"), "utf8"));
const videoIds = new Set();
for (const level of data)
  for (const subject of level.subjects)
    for (const course of subject.courses)
      for (const file of course.files) {
        const id = extractVideoId(file.youtube);
        if (id) videoIds.add(id);
      }

const ids = [...videoIds];
console.log(`Found ${ids.length} unique video IDs. Fetching in batches of 50…`);

// Fetch in batches of 50
const durations = {};
for (let i = 0; i < ids.length; i += 50) {
  const batch = ids.slice(i, i + 50);
  const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(",")}&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error(`API error at batch ${i / 50 + 1}:`, text);
    process.exit(1);
  }
  const json = await res.json();
  for (const item of json.items ?? []) {
    durations[item.id] = parseDuration(item.contentDetails.duration);
  }
  process.stdout.write(`\r  Progress: ${Math.min(i + 50, ids.length)} / ${ids.length}`);
}
console.log("\nDone fetching.");

// Save
const outPath = resolve(projectRoot, "data/durations.json");
writeFileSync(outPath, JSON.stringify(durations, null, 2));
console.log(`✓ Saved ${Object.keys(durations).length} durations → data/durations.json`);
