/**
 * Save a raw transcript to data/transcripts/ and update the JSON pointer.
 *
 * Usage:
 *   node scripts/add-transcript.mjs <levelIdx> <subjectIdx> <courseIdx> <lessonIdx> [transcriptFile]
 *
 * If no file is given, reads the transcript from stdin.
 *
 * Transcript format:
 *   (M:SS) text (M:SS) text ...
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// --- CLI ---
const [, , levelIdx, subjectIdx, courseIdx, lessonIdx, transcriptFile] = process.argv;

if ([levelIdx, subjectIdx, courseIdx, lessonIdx].some((v) => v === undefined)) {
  console.error(
    "Usage: node scripts/add-transcript.mjs <levelIdx> <subjectIdx> <courseIdx> <lessonIdx> [transcriptFile]"
  );
  process.exit(1);
}

const raw = transcriptFile
  ? readFileSync(transcriptFile, "utf8")
  : readFileSync("/dev/stdin", "utf8");

// Ensure data/transcripts/ exists
const transcriptsDir = resolve(projectRoot, "data/transcripts");
mkdirSync(transcriptsDir, { recursive: true });

// Save raw transcript file
const filename = `${levelIdx}-${subjectIdx}-${courseIdx}-${lessonIdx}.txt`;
const outPath = resolve(transcriptsDir, filename);
writeFileSync(outPath, raw.trim(), "utf8");

// Update JSON: set transcriptFile pointer, remove old transcript array
const jsonPath = resolve(projectRoot, "data/kibbarulmauni.json");
const data = JSON.parse(readFileSync(jsonPath, "utf8"));

const lesson =
  data[+levelIdx]?.subjects[+subjectIdx]?.courses[+courseIdx]?.files[+lessonIdx];

if (!lesson) {
  console.error(
    `Lesson not found: level=${levelIdx} subject=${subjectIdx} course=${courseIdx} lesson=${lessonIdx}`
  );
  process.exit(1);
}

delete lesson.transcript; // remove old inline segments if present
lesson.transcriptFile = filename;

writeFileSync(jsonPath, JSON.stringify(data, null, 2));

console.log(`✓ Saved transcript → data/transcripts/${filename}`);
console.log(`✓ Updated JSON pointer for "${lesson.title.slice(0, 60)}..."`);
