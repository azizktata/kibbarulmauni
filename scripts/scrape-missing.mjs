/**
 * Scrapes missing content from kibbarulmauni.com and fills empty subjects in the JSON.
 * Usage: node scripts/scrape-missing.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/kibbarulmauni.json");

const CONCURRENCY = 8;

async function fetchHtml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** Run an array of async tasks with a max concurrency */
async function runConcurrent(tasks, concurrency) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

/** Extract section links (sub-courses) from a subject page */
function extractSectionLinks(html) {
  const re = /<a[^>]+href="(https:\/\/kibbarulmauni\.com\/section\/\d+\/)"[^>]*>([\s\S]*?)<\/a>/g;
  const results = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const title = m[2].replace(/<[^>]+>/g, "").trim();
    if (title) results.push({ url: m[1], title });
  }
  // dedupe by url
  const seen = new Set();
  return results.filter((r) => (seen.has(r.url) ? false : seen.add(r.url)));
}

/** Extract file links from a course/subject page */
function extractFileLinks(html) {
  const re = /<a[^>]+href="(https:\/\/kibbarulmauni\.com\/file\/\d+\/)"[^>]*>([\s\S]*?)<\/a>/g;
  const results = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const title = m[2].replace(/<[^>]+>/g, "").trim();
    if (title) results.push({ url: m[1], title });
  }
  const seen = new Set();
  return results.filter((r) => (seen.has(r.url) ? false : seen.add(r.url)));
}

/** Extract YouTube watch URL from a file page */
function extractYoutube(html) {
  const embedMatch = html.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
  if (embedMatch) return `https://www.youtube.com/watch?v=${embedMatch[1]}`;
  const watchMatch = html.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/);
  if (watchMatch) return `https://www.youtube.com/watch?v=${watchMatch[1]}`;
  return undefined;
}

async function scrapeFilesForPage(pageUrl, pageTitle) {
  console.log(`  Fetching course: ${pageTitle} (${pageUrl})`);
  const html = await fetchHtml(pageUrl);
  const fileLinks = extractFileLinks(html);
  if (fileLinks.length === 0) return { title: pageTitle, url: pageUrl, files: [] };

  console.log(`    Found ${fileLinks.length} files, fetching YouTube links...`);
  const fileTasks = fileLinks.map((file) => async () => {
    const fileHtml = await fetchHtml(file.url);
    const youtube = extractYoutube(fileHtml);
    return { title: file.title, url: file.url, ...(youtube ? { youtube } : {}) };
  });

  const files = await runConcurrent(fileTasks, CONCURRENCY);
  console.log(`    Done: ${files.length} files scraped`);
  return { title: pageTitle, url: pageUrl, files };
}

async function scrapeSubject(subject) {
  console.log(`\nScraping subject: ${subject.title} (${subject.url})`);
  const html = await fetchHtml(subject.url);

  const sectionLinks = extractSectionLinks(html);
  if (sectionLinks.length > 0) {
    // Subject has sub-courses (sections)
    console.log(`  Found ${sectionLinks.length} courses`);
    const courses = [];
    for (const sec of sectionLinks) {
      const course = await scrapeFilesForPage(sec.url, sec.title);
      courses.push(course);
    }
    return courses;
  }

  // Flat subject — all files in one implicit course
  const fileLinks = extractFileLinks(html);
  if (fileLinks.length > 0) {
    console.log(`  Flat subject with ${fileLinks.length} files`);
    const fileTasks = fileLinks.map((file) => async () => {
      const fileHtml = await fetchHtml(file.url);
      const youtube = extractYoutube(fileHtml);
      return { title: file.title, url: file.url, ...(youtube ? { youtube } : {}) };
    });
    const files = await runConcurrent(fileTasks, CONCURRENCY);
    return [{ title: subject.title, url: subject.url, files }];
  }

  console.log(`  WARNING: No content found at ${subject.url}`);
  return [];
}

async function main() {
  const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));

  // Find all empty subjects
  const empty = [];
  data.forEach((level, lIdx) => {
    level.subjects.forEach((subject, sIdx) => {
      if (subject.courses.length === 0) {
        empty.push({ lIdx, sIdx });
      }
    });
  });

  console.log(`Found ${empty.length} empty subjects to scrape\n`);

  for (const { lIdx, sIdx } of empty) {
    const subject = data[lIdx].subjects[sIdx];
    try {
      const courses = await scrapeSubject(subject);
      data[lIdx].subjects[sIdx].courses = courses;
      // Save after each subject in case of interruption
      writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
      console.log(`  Saved. ${courses.length} courses, ${courses.reduce((s, c) => s + c.files.length, 0)} total files.`);
    } catch (err) {
      console.error(`  ERROR scraping ${subject.title}: ${err.message}`);
    }
  }

  console.log("\nDone! JSON updated.");
}

main().catch(console.error);
