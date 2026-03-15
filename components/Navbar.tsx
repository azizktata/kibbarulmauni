"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserButton } from "./UserButton";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setOpen(false);
    setQ("");
  }

  return (
    <>
      <nav className="bg-emerald-950 text-white h-12 flex items-center px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-base font-bold text-white hover:text-emerald-200 transition-colors shrink-0"
          >
            جامعة كبار العلماء
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/scholars"
              className="text-xs text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              المشايخ
            </Link>

            {/* Search toggle */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="بحث"
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>

            <UserButton />
          </div>
        </div>
      </nav>

      {/* Search overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start pt-20 px-4 overflow-hidden"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl mx-auto"
          >
            <div className="relative">
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                autoFocus
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث عن درس أو مقرر أو مادة…"
                className="w-full bg-white rounded-2xl pr-12 pl-4 py-4 text-sm text-stone-800 placeholder-stone-400 outline-none shadow-2xl"
              />
            </div>
            <p className="text-white/40 text-xs text-center mt-3">اضغط Enter للبحث · Escape للإغلاق</p>
          </form>
        </div>
      )}
    </>
  );
}
