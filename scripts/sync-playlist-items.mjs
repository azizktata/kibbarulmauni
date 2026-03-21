/**
 * Fetches individual video IDs for every playlist in data/scholar-playlists.json
 * and saves to data/playlist-items.json.
 *
 * Run ONCE and commit the output — scholars are no longer uploading, data is frozen.
 *
 * Usage:
 *   node scripts/sync-playlist-items.mjs
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
} catch { /* ignore */ }

const API_KEY = process.env.YOUTUBE_API_KEY ?? envVars["YOUTUBE_API_KEY"];
if (!API_KEY) {
  console.error("Missing YOUTUBE_API_KEY in .env.local");
  process.exit(1);
}

const playlistsPath = resolve(projectRoot, "data/scholar-playlists.json");
const allPlaylists = JSON.parse(readFileSync(playlistsPath, "utf8"));

// Collect all unique playlist IDs across all scholars
const allPlaylistIds = [];
for (const [, playlists] of Object.entries(allPlaylists)) {
  for (const p of playlists) {
    allPlaylistIds.push(p.playlistId);
  }
}

console.log(`Total playlists to fetch: ${allPlaylistIds.length}`);

async function getPlaylistItems(playlistId) {
  const items = [];
  let pageToken = "";
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}&key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`playlistItems API error ${res.status}: ${body.slice(0, 200)}`);
    }
    const json = await res.json();
    for (const item of json.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title ?? "";
      const position = item.snippet?.position ?? 0;
      // Skip deleted/private videos
      if (!videoId || title === "Deleted video" || title === "Private video") continue;
      items.push({ videoId, title, position });
    }
    pageToken = json.nextPageToken ?? "";
  } while (pageToken);
  return items;
}

const result = {};
let done = 0;
let errors = 0;

for (const playlistId of allPlaylistIds) {
  done++;
  process.stdout.write(`[${done}/${allPlaylistIds.length}] ${playlistId}… `);
  try {
    const items = await getPlaylistItems(playlistId);
    if (items.length > 0) {
      result[playlistId] = items;
      console.log(`${items.length} videos`);
    } else {
      console.log("empty, skipped");
    }
  } catch (err) {
    errors++;
    console.log(`ERROR: ${err.message}`);
  }
}

const outPath = resolve(projectRoot, "data/playlist-items.json");
writeFileSync(outPath, JSON.stringify(result, null, 2));

const totalVideos = Object.values(result).reduce((s, v) => s + v.length, 0);
console.log(`\n✓ Saved ${totalVideos} videos across ${Object.keys(result).length} playlists → data/playlist-items.json`);
if (errors > 0) console.log(`⚠ ${errors} playlists failed`);
