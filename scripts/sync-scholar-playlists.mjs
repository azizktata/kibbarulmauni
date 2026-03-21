/**
 * Fetches all YouTube playlists for each scholar's channel and saves to data/scholar-playlists.json.
 * Run ONCE and commit the output — scholars are no longer uploading, data is frozen.
 *
 * Usage:
 *   node scripts/sync-scholar-playlists.mjs
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

// Copied from lib/scholarWebsites.ts
// Keep in sync with lib/scholarWebsites.ts — keys must match canonical names in scholarAliases.ts
const SCHOLAR_YOUTUBE = {
  "محمد بن صالح العثيمين":           "https://www.youtube.com/@ALUthaymeen",
  "عبد الرزاق البدر":                "https://www.youtube.com/@albadr09",
  "صالح الفوزان":                    "https://www.youtube.com/@dralfawzann",
  "ابن باز":                         "https://www.youtube.com/@Alsheikhbinbaz",
  "سعد بن ناصر الشثري":              "https://www.youtube.com/@DrSuadTV",
  "الكريم الخضير":                   "https://www.youtube.com/@shkhudheir",
  "صالح آل الشيخ":                   "https://www.youtube.com/@Salihalalsheikh",
  "عبد العزيز الراجحي":              "https://www.youtube.com/@shrajhi",
  "عبد الرحمن بن ناصر السعدي":       "https://www.youtube.com/@IbnSaadi",
  "ناصر الدين الألباني":             "https://www.youtube.com/@SheikhAlalbany",
  "صالح بن محمد اللحيدان":           "https://www.youtube.com/@sheikhaloheydan",
  "محمد الأمين الشنقيطي":            "https://www.youtube.com/@muhammadal-aminas-shanqiti876",
  "خالد بن عثمان السبت":             "https://www.youtube.com/@%D8%A7%D9%84%D8%B4%D9%8A%D8%AE%D8%A7%D9%84%D8%AF%D9%83%D8%AA%D9%88%D8%B1%D8%AE%D8%A7%D9%84%D8%AF%D8%A8%D9%86%D8%B9%D8%AB%D9%85%D8%A7%D9%86%D8%A7%D9%84%D8%B3%D8%A8%D8%AA",
};

// Derive topic category from Arabic playlist title
function categorize(title) {
  // مصطلح الحديث — check before الحديث to avoid misclassification
  if (/نخبة الفكر|تدريب الراوي|ألفية العراقي|مصطلح الحديث|علوم الحديث/.test(title))
    return "مصطلح الحديث";
  // علوم القرآن — check before القرآن والتفسير
  if (/الإتقان|مناهل العرفان|البرهان|علوم القرآن/.test(title))
    return "علوم القرآن";
  // القرآن والتفسير
  if (/تفسير|ابن كثير|الطبري|السعدي|أضواء البيان|القرآن الكريم/.test(title))
    return "القرآن والتفسير";
  // الحديث
  if (/صحيح البخاري|صحيح مسلم|سنن أبي داود|سنن الترمذي|سنن النسائي|سنن ابن ماجه|موطأ مالك|رياض الصالحين|الأربعون النووية|المسند|حديث/.test(title))
    return "الحديث";
  // العقيدة
  if (/كتاب التوحيد|الواسطية|الطحاوية|لمعة الاعتقاد|البربهاري|أصول الإيمان|عقيدة|توحيد/.test(title))
    return "العقيدة";
  // الفقه
  if (/بلوغ المرام|عمدة الأحكام|فقه السنة|زاد المستقنع|أبي شجاع|المهذب|الهداية|بدائع الصنائع|الحنبلي|الحنفي|الشافعي|المالكي|فقه/.test(title))
    return "الفقه";
  // أصول الفقه
  if (/الورقات|روضة الناظر|المستصفى|الإحكام|الكوكب المنير|أصول الفقه|أصول/.test(title))
    return "أصول الفقه";
  // السيرة والتاريخ
  if (/ابن هشام|زاد المعاد|الرحيق المختوم|سيرة|تاريخ/.test(title))
    return "السيرة والتاريخ";
  // اللغة العربية
  if (/لغة|نحو|صرف|الآجرومية|ألفية ابن مالك/.test(title))
    return "اللغة العربية";
  // فتاوى — check before فوائد
  if (/فتاو|سؤال وجواب|نور على الدرب/.test(title))
    return "فتاوى";
  // فوائد
  if (/فوائد|فائدة/.test(title))
    return "فوائد";
  return "عام";
}

// Extract handle or legacy username from YouTube channel URL
function extractHandle(url) {
  // Decode percent-encoded URLs first (e.g. Arabic handles)
  const decoded = decodeURIComponent(url);
  const atMatch = decoded.match(/@([^\s/]+)/);
  if (atMatch) return { type: "handle", value: atMatch[1] };
  const cMatch = decoded.match(/\/c\/([^\s/]+)/);
  if (cMatch) return { type: "username", value: cMatch[1] };
  return null;
}

// Get channelId from handle or legacy username
async function getChannelId(info) {
  const param = info.type === "handle"
    ? `forHandle=${encodeURIComponent(info.value)}`
    : `forUsername=${encodeURIComponent(info.value)}`;
  const url = `https://www.googleapis.com/youtube/v3/channels?part=id&${param}&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`channels API error: ${res.status}`);
  const json = await res.json();
  return json.items?.[0]?.id ?? null;
}

// Get all playlists for a channel (paginated)
async function getPlaylists(channelId) {
  const playlists = [];
  let pageToken = "";
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channelId}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}&key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`playlists API error: ${res.status}`);
    const json = await res.json();
    for (const item of json.items ?? []) {
      playlists.push({
        playlistId: item.id,
        title: item.snippet.title,
        description: item.snippet.description ?? "",
        thumbnail:
          item.snippet.thumbnails?.medium?.url ??
          item.snippet.thumbnails?.default?.url ??
          "",
        videoCount: item.contentDetails.itemCount ?? 0,
        publishedAt: item.snippet.publishedAt ?? "",
        category: categorize(item.snippet.title),
      });
    }
    pageToken = json.nextPageToken ?? "";
  } while (pageToken);
  return playlists;
}

// Main
const result = {};

for (const [name, channelUrl] of Object.entries(SCHOLAR_YOUTUBE)) {
  const handleInfo = extractHandle(channelUrl);
  if (!handleInfo) {
    console.warn(`⚠ Could not extract handle from: ${channelUrl}`);
    continue;
  }
  process.stdout.write(`Fetching playlists for ${name} (${handleInfo.value})… `);
  try {
    const channelId = await getChannelId(handleInfo);
    if (!channelId) {
      console.log("channel not found, skipping.");
      continue;
    }
    const playlists = await getPlaylists(channelId);
    result[name] = playlists;
    console.log(`${playlists.length} playlists`);
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
  }
}

const outPath = resolve(projectRoot, "data/scholar-playlists.json");
writeFileSync(outPath, JSON.stringify(result, null, 2));

const total = Object.values(result).reduce((s, p) => s + p.length, 0);
console.log(`\n✓ Saved ${total} playlists across ${Object.keys(result).length} scholars → data/scholar-playlists.json`);
