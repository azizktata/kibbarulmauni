// scripts/scrape.js
// Scrapes all study content from kibbarulmauni.com and saves it as JSON + Markdown.
//
// Run:
//   node scripts/scrape.js
//
// Requires:
//   npm install axios cheerio fs-extra

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

const BASE = "https://kibbarulmauni.com";
const DELAY_MS = 300; // polite delay between requests

// ─── helpers ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getHtml(url) {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; scraper/1.0)" },
    timeout: 15000,
  });
  return cheerio.load(data);
}

// ─── scrapers ───────────────────────────────────────────────────────────────

/** Returns the 8 fixed level URLs. */
function getLevels() {
  const names = [
    "المستوى الأول",
    "المستوى الثاني",
    "المستوى الثالث",
    "المستوى الرابع",
    "المستوى الخامس",
    "المستوى السادس",
    "المستوى السابع",
    "المستوى الثامن",
  ];
  return names.map((title, i) => ({ title, url: `${BASE}/section/${i + 1}/` }));
}

/**
 * From a /section/N/ page, collect all child section links (.section-name a).
 * Returns [{ title, url }]
 */
async function getChildSections($) {
  const items = [];
  $(".section-name a").each((_, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr("href");
    if (title && href) {
      items.push({ title, url: href.startsWith("http") ? href : BASE + href });
    }
  });
  return items;
}

/**
 * From a page, collect direct file links (h2 a[href*="/file/"]).
 * Returns [{ title, url }]
 */
function getDirectFiles($) {
  const files = [];
  $('h2 a[href*="/file/"]').each((_, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr("href");
    if (title && href) {
      files.push({ title, url: href.startsWith("http") ? href : BASE + href });
    }
  });
  return files;
}

/**
 * From a /file/N/ page, extract the YouTube video URL.
 */
async function getYouTubeUrl(fileUrl) {
  try {
    const $ = await getHtml(fileUrl);
    const src = $('iframe[src*="youtube"]').first().attr("src") || "";
    const match = src.match(/embed\/([^?&]+)/);
    if (!match) return null;
    return `https://www.youtube.com/watch?v=${match[1]}`;
  } catch {
    return null;
  }
}

/**
 * Recursively expand a section URL into an array of Course objects.
 *
 * If the page has direct /file/ links → one Course with those files.
 * If the page has child /section/ links → each child becomes its own Course
 *   (recursively), so arbitrary nesting depth is handled.
 * Empty page → one empty Course.
 */
async function expandCourse(title, url, indent = "  │   ├─ ") {
  const $ = await getHtml(url);

  const files = getDirectFiles($);

  if (files.length > 0) {
    // Leaf course — fetch YouTube links for each file
    console.log(`${indent}${title} (${files.length} درس)`);
    const lessons = [];
    for (const f of files) {
      await sleep(DELAY_MS);
      const ytUrl = await getYouTubeUrl(f.url);
      lessons.push({ title: f.title, url: f.url, youtube: ytUrl });
    }
    return [{ title, url, files: lessons }];
  }

  // Check for child sections
  const children = await getChildSections($);

  if (children.length === 0) {
    console.log(`${indent}${title} (فارغ)`);
    return [{ title, url, files: [] }];
  }

  // This "course" is actually a container — expand each child as its own course
  console.log(`${indent}${title} → ${children.length} أبواب`);
  const courses = [];
  for (const child of children) {
    await sleep(DELAY_MS);
    const sub = await expandCourse(child.title, child.url, "  │   │   ├─ ");
    courses.push(...sub);
  }
  return courses;
}

// ─── main ───────────────────────────────────────────────────────────────────

async function run() {
  const data = [];
  let md = `# kibbarulmauni — Study Content\n\n`;

  const levels = getLevels();
  console.log(`Scraping ${levels.length} levels…\n`);

  for (const level of levels) {
    console.log(`▶ ${level.title}`);
    md += `## ${level.title}\n\n`;
    const levelNode = { title: level.title, url: level.url, subjects: [] };

    await sleep(DELAY_MS);
    const $ = await getHtml(level.url);
    const subjects = await getChildSections($);

    for (const subject of subjects) {
      console.log(`  ├─ ${subject.title}`);
      md += `### ${subject.title}\n\n`;
      const subjectNode = { title: subject.title, url: subject.url, courses: [] };

      await sleep(DELAY_MS);
      const $s = await getHtml(subject.url);
      const courseLinks = await getChildSections($s);

      for (const courseLink of courseLinks) {
        await sleep(DELAY_MS);
        const courses = await expandCourse(courseLink.title, courseLink.url);

        for (const course of courses) {
          md += `#### ${course.title}\n\n`;
          for (const f of course.files) {
            if (f.youtube) md += `- [${f.title}](${f.youtube})\n`;
            else md += `- ${f.title} — ${f.url}\n`;
          }
          md += `\n`;
          subjectNode.courses.push(course);
        }
      }

      levelNode.subjects.push(subjectNode);
    }

    data.push(levelNode);
    md += `\n`;
  }

  const outDir = path.join(__dirname, "..", "data");
  await fs.ensureDir(outDir);
  await fs.writeFile(
    path.join(outDir, "kibbarulmauni.json"),
    JSON.stringify(data, null, 2),
    "utf8"
  );
  await fs.writeFile(path.join(outDir, "kibbarulmauni.md"), md, "utf8");

  const totalLessons = data.reduce(
    (s, l) => s + l.subjects.reduce((s2, sub) => s2 + sub.courses.reduce((s3, c) => s3 + c.files.length, 0), 0),
    0
  );
  console.log(`\n✅ Done — ${totalLessons} lessons saved to data/kibbarulmauni.json`);
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
