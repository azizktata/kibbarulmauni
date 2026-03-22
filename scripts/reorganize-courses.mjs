import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const filePath = resolve(process.cwd(), "data/kibbarulmauni.json");
const data = JSON.parse(readFileSync(filePath, "utf8"));

// Helper to get course and remove it from its original location
function extractCourse(levelIdx, subjectIdx, courseIdx) {
  const courses = data[levelIdx].subjects[subjectIdx].courses;
  const [course] = courses.splice(courseIdx, 1);
  return course;
}

function appendCourse(levelIdx, subjectIdx, course) {
  data[levelIdx].subjects[subjectIdx].courses.push(course);
}

// 1. Move Level/0/0/1 ("شرح كتاب مقدمة التفسير") → Level/1/0
const moqaddama = extractCourse(0, 0, 1);
console.log("Extracted from L0/S0:", moqaddama.title);

// 2. Move Level/3/0/0 ("تفسير سورة الفاتحة") → Level/0/0
const fatiha = extractCourse(3, 0, 0);
console.log("Extracted from L3/S0:", fatiha.title);

// 3. Move Level/7/0/2 ("تفسير جزء عم") → Level/0/0
const juzAmma = extractCourse(7, 0, 2);
console.log("Extracted from L7/S0:", juzAmma.title);

// Append to destinations
appendCourse(1, 0, moqaddama);
console.log("Appended to L1/S0:", moqaddama.title);

appendCourse(0, 0, fatiha);
console.log("Appended to L0/S0:", fatiha.title);

appendCourse(0, 0, juzAmma);
console.log("Appended to L0/S0:", juzAmma.title);

// Verify final state
console.log("\n--- Final course lists ---");
console.log("L0/S0:", data[0].subjects[0].courses.map((c, i) => `${i}: ${c.title}`));
console.log("L1/S0:", data[1].subjects[0].courses.map((c, i) => `${i}: ${c.title}`));
console.log("L3/S0:", data[3].subjects[0].courses.map((c, i) => `${i}: ${c.title}`));
console.log("L7/S0:", data[7].subjects[0].courses.map((c, i) => `${i}: ${c.title}`));

writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
console.log("\n✓ Written to", filePath);
