/**
 * Re-categorizes all playlists in data/scholar-playlists.json using the updated categorize() function.
 * No API calls — reads and writes the local JSON file only.
 *
 * Usage:
 *   node scripts/recategorize-playlists.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

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

const jsonPath = resolve(projectRoot, "data/scholar-playlists.json");
const data = JSON.parse(readFileSync(jsonPath, "utf8"));

let changed = 0;
const counts = {};

for (const scholar of Object.keys(data)) {
  for (const playlist of data[scholar]) {
    const newCat = categorize(playlist.title);
    if (newCat !== playlist.category) {
      changed++;
      counts[newCat] = (counts[newCat] ?? 0) + 1;
      playlist.category = newCat;
    }
  }
}

writeFileSync(jsonPath, JSON.stringify(data, null, 2));
console.log(`Updated ${changed} playlist categories.`);
if (changed > 0) {
  console.log("Breakdown by new category:");
  for (const [cat, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${n}`);
  }
}
