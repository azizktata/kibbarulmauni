// scripts/patch-missing.js
// Patches specific sections with missing content in kibbarulmauni.json.
// Only re-scrapes the courses that have 0 files.
//
// Run: node scripts/patch-missing.js

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

const BASE = "https://kibbarulmauni.com";
const DELAY_MS = 300;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getHtml(url) {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; scraper/1.0)" },
    timeout: 15000,
  });
  return cheerio.load(data);
}

function getChildSections($) {
  const items = [];
  $(".section-name a").each((_, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr("href");
    if (title && href)
      items.push({ title, url: href.startsWith("http") ? href : BASE + href });
  });
  return items;
}

function getDirectFiles($) {
  const files = [];
  $('h2 a[href*="/file/"]').each((_, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr("href");
    if (title && href)
      files.push({ title, url: href.startsWith("http") ? href : BASE + href });
  });
  return files;
}

async function getYouTubeUrl(fileUrl) {
  try {
    const $ = await getHtml(fileUrl);
    const src = $('iframe[src*="youtube"]').first().attr("src") || "";
    const match = src.match(/embed\/([^?&]+)/);
    return match ? `https://www.youtube.com/watch?v=${match[1]}` : null;
  } catch { return null; }
}

/**
 * Recursively expand a section into Course objects.
 */
async function expandCourse(title, url, depth = 0) {
  const pad = "  ".repeat(depth + 2);
  const $ = await getHtml(url);

  const files = getDirectFiles($);
  if (files.length > 0) {
    console.log(`${pad}✓ ${title} (${files.length} lessons)`);
    const lessons = [];
    for (const f of files) {
      await sleep(DELAY_MS);
      const ytUrl = await getYouTubeUrl(f.url);
      lessons.push({ title: f.title, url: f.url, youtube: ytUrl });
      process.stdout.write(".");
    }
    console.log();
    return [{ title, url, files: lessons }];
  }

  const children = getChildSections($);
  if (children.length === 0) {
    console.log(`${pad}⚠ ${title} (empty)`);
    return [{ title, url, files: [] }];
  }

  console.log(`${pad}→ ${title} (${children.length} sub-sections)`);
  const courses = [];
  for (const child of children) {
    await sleep(DELAY_MS);
    const sub = await expandCourse(child.title, child.url, depth + 1);
    courses.push(...sub);
  }
  return courses;
}

async function run() {
  const jsonPath = path.join(__dirname, "..", "data", "kibbarulmauni.json");
  const data = await fs.readJson(jsonPath);
  let patchCount = 0;

  console.log("Scanning for empty courses…\n");

  for (let lIdx = 0; lIdx < data.length; lIdx++) {
    const level = data[lIdx];
    for (let sIdx = 0; sIdx < level.subjects.length; sIdx++) {
      const subject = level.subjects[sIdx];
      const newCourses = [];
      let changed = false;

      for (let cIdx = 0; cIdx < subject.courses.length; cIdx++) {
        const course = subject.courses[cIdx];
        if (course.files.length === 0) {
          console.log(`[L${lIdx} S${sIdx} C${cIdx}] ${course.title} → fetching…`);
          await sleep(DELAY_MS);
          const expanded = await expandCourse(course.title, course.url);
          if (expanded.length === 1 && expanded[0].files.length === 0) {
            // Still empty — keep original
            newCourses.push(course);
          } else {
            console.log(`  → expanded to ${expanded.length} courses\n`);
            newCourses.push(...expanded);
            changed = true;
            patchCount += expanded.length - 1;
          }
        } else {
          newCourses.push(course);
        }
      }

      if (changed) {
        subject.courses = newCourses;
      }
    }
  }

  await fs.writeJson(jsonPath, data, { spaces: 2 });
  console.log(`\n✅ Done — patched ${patchCount} expanded courses`);
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
