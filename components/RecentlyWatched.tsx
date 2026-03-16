"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRecentlyWatched } from "@/lib/useRecentlyWatched";
import { LEVEL_COLORS } from "@/lib/constants";
import { SignInDialog } from "./SignInDialog";

export function RecentlyWatched() {
  const { status } = useSession();
  const entries = useRecentlyWatched();

  // Show nothing if not yet hydrated or no entries and logged in
  if (status === "loading") return null;

  const isLoggedIn = status === "authenticated";
  const visible = entries.slice(0, 3);

  // Logged out: show a sign-in nudge (only if they have entries to show value)
  // if (!isLoggedIn) {
  //   return (
  //     <section className="bg-stone-50 dark:bg-white/5 border-b border-stone-100 dark:border-white/[0.06] py-4 px-4">
  //       <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
  //         <p className="text-xs text-stone-400 dark:text-white/30">
  //           سجّل دخولك لتتبّع تقدّمك وحفظ سجل المشاهدة
  //         </p>
  //         <SignInDialog
  //           trigger={
  //             <button className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline shrink-0">
  //               دخول
  //             </button>
  //           }
  //         />
  //       </div>
  //     </section>
  //   );
  // }

  // Logged in but no entries yet
  if (visible.length === 0) return null;

  return (
    <section className="bg-stone-50 dark:bg-white/5 border-b border-stone-100 dark:border-white/[0.06] py-5 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-stone-200 dark:bg-white/10" />
          <span className="text-[11px] font-semibold text-stone-400 dark:text-white/30 tracking-widest">
            شاهدت مؤخراً
          </span>
          <div className="h-px flex-1 bg-stone-200 dark:bg-white/10" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {visible.map((entry, i) => {
            const col = LEVEL_COLORS[entry.levelIdx];
            return (
              <Link
                key={i}
                href={`/level/${entry.levelIdx}/${entry.subjectIdx}/${entry.courseIdx}?lesson=${entry.lessonIdx}`}
                className="group flex items-start gap-3 bg-white dark:bg-white/[0.04] rounded-xl border border-stone-100 dark:border-white/[0.08] p-3 hover:shadow-sm hover:-translate-y-0.5 hover:border-stone-200 dark:hover:border-white/[0.15] transition-all duration-200 overflow-hidden"
              >
                <div className={`shrink-0 w-9 h-9 rounded-lg ${col.bg} text-white flex items-center justify-center shadow-sm`}>
                  <svg className="w-3.5 h-3.5 mr-px" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-800 dark:text-white/80 truncate leading-snug">
                    {entry.courseTitle}
                  </p>
                  <p className="text-[11px] text-stone-400 dark:text-white/30 mt-0.5 truncate">
                    {entry.levelTitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
