"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Fuse from "fuse.js";
import { searchIndex, type SearchEntry } from "@/lib/searchIndex";
import { LEVEL_COLORS } from "@/lib/constants";

const fuse = new Fuse(searchIndex, {
  keys: ["title", "courseTitle", "subjectTitle"],
  threshold: 0.35,
  includeScore: true,
  minMatchCharLength: 2,
});

const TYPE_LABEL: Record<SearchEntry["type"], string> = {
  subject: "مادة",
  course: "مقرر",
  lesson: "درس",
};

const TYPE_ICON: Record<SearchEntry["type"], string> = {
  subject: "📚",
  course: "📖",
  lesson: "🎧",
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  const results = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    return fuse.search(q, { limit: 40 }).map((r) => r.item);
  }, [query]);

  const grouped = useMemo(() => {
    const subjects = results.filter((r) => r.type === "subject");
    const courses = results.filter((r) => r.type === "course");
    const lessons = results.filter((r) => r.type === "lesson");
    return { subjects, courses, lessons };
  }, [results]);

  return (
    <div className="min-h-screen">
      {/* Search header */}
      <header className="bg-emerald-950 px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <p className="text-emerald-400 text-xs font-semibold tracking-widest mb-3">البحث</p>
          <div className="relative">
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن درس أو مقرر أو مادة…"
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl pr-12 pl-4 py-4 text-sm outline-none focus:bg-white/15 transition-colors ring-1 ring-white/10 focus:ring-white/20"
            />
          </div>
          {query.trim().length >= 2 && (
            <p className="text-white/40 text-xs mt-3">
              {results.length} نتيجة
            </p>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
        {query.trim().length < 2 ? (
          <div className="text-center py-20 text-stone-400">
            <svg className="w-10 h-10 mx-auto mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p className="text-sm">اكتب للبحث في المواد والمقررات والدروس</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <p className="text-2xl mb-3">🔍</p>
            <p className="text-sm">لا توجد نتائج لـ «{query}»</p>
          </div>
        ) : (
          <>
            {grouped.subjects.length > 0 && (
              <ResultGroup title="مواد" items={grouped.subjects} />
            )}
            {grouped.courses.length > 0 && (
              <ResultGroup title="مقررات" items={grouped.courses} />
            )}
            {grouped.lessons.length > 0 && (
              <ResultGroup title="دروس" items={grouped.lessons} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ResultGroup({ title, items }: { title: string; items: SearchEntry[] }) {
  return (
    <section>
      <p className="text-xs font-semibold text-stone-400 tracking-widest mb-3">{title}</p>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const c = LEVEL_COLORS[item.levelIdx];
          return (
            <Link
              key={i}
              href={item.href}
              className="group bg-white rounded-xl border border-stone-100 shadow-sm px-4 py-3.5 flex items-start gap-3 hover:shadow-md hover:border-stone-200 transition-all"
            >
              <span className="text-lg leading-none mt-0.5">{TYPE_ICON[item.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-800 text-sm leading-snug truncate">
                  {item.title}
                </p>
                <p className="text-xs text-stone-400 mt-1 truncate">
                  {item.levelTitle} · {item.subjectTitle}
                  {item.type === "lesson" && ` · ${item.courseTitle}`}
                </p>
              </div>
              <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${c.light} ${c.text}`}>
                {TYPE_LABEL[item.type]}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
