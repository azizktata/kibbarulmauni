// Central SEO constants shared across metadata exports and JSON-LD blocks.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kibbarulamauniversity.com";
export const SITE_NAME = "جامعة كبار العلماء";
export const SITE_NAME_EN = "Kibbar Al-Ulama University";

// Core keyword set (Arabic + English) — used to build natural keyword strings
// for metadata.keywords and woven into descriptions. Do not stuff visible
// copy with these; metadata exports compose a short relevant subset per page.
export const CORE_KEYWORDS_AR = [
  "طلب علم",
  "طالب علم",
  "طالب علم مبتدئ",
  "علم شرعي",
  "طلب العلم الشرعي",
  "كلية شريعة عن بعد",
  "جامعة لعلوم الشريعة",
  "طلب علم عن بعد",
  "تعليم شرعي عن بعد",
  "جامعة كبار العلماء",
  "دروس صوتية للمشايخ",
  "شرح متون العلم",
  "متون العلم الشرعي",
  "الشيخ محمد بن صالح العثيمين",
  "الشيخ صالح الفوزان",
  "الشيخ عبد العزيز بن باز",
  "الشيخ صالح آل الشيخ",
  "العلماء الربانيون",
  "منهج طالب العلم",
  "كلية الشريعة",
];

export const CORE_KEYWORDS_EN = [
  "seeking islamic knowledge",
  "student of knowledge",
  "beginner student of knowledge",
  "islamic sharia knowledge",
  "online sharia college",
  "islamic studies university online",
  "distance learning sharia",
  "online islamic education",
  "kibbar al ulama university",
  "sheikh Muhammad ibn Salih al-Uthaymeen",
  "sheikh Salih al-Fawzan",
  "sheikh Abdul Aziz ibn Baz",
  "classical islamic texts explained",
  "islamic curriculum online",
];

export function buildKeywords(extraAr: string[] = [], extraEn: string[] = []): string[] {
  return [...extraAr, ...CORE_KEYWORDS_AR, ...extraEn, ...CORE_KEYWORDS_EN];
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
