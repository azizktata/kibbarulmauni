"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NotebookPenIcon, MenuIcon, XIcon } from "lucide-react";
import { UserButton } from "./UserButton";
import { ThemeToggle } from "./ThemeToggle";
import { useNotes } from "@/lib/notesContext";

const NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/about", label: "عن الجامعة" },
  { href: "/scholars", label: "المشايخ" },
];

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const { isLoggedIn, notes, setSidebarOpen } = useNotes();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setSearchOpen(false);
    setMenuOpen(false);
    setQ("");
  }

  return (
    <>
      <nav className="bg-primary text-white h-12 flex items-center px-4 md:px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0 hover:opacity-80 transition-opacity">
            <Image src="/logo.png" height={32} width={120} alt="جامعة كبار العلماء" className="object-contain" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-white/60 hover:text-gold transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                {label}
              </Link>
            ))}

            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="بحث"
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>

            {isLoggedIn && (
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="ملاحظاتي"
                className="relative p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <NotebookPenIcon className="w-4 h-4" />
                {notes.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gold" />
                )}
              </button>
            )}

            <ThemeToggle />
            <UserButton />
          </div>

          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="بحث"
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              {menuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-12 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div
            className="bg-primary border-t border-white/10 px-4 py-3 flex flex-col gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="text-sm text-white/70 hover:text-gold transition-colors px-3 py-2.5 rounded-lg hover:bg-white/5"
              >
                {label}
              </Link>
            ))}

            <div className="flex items-center gap-2 px-3 pt-2 mt-1 border-t border-white/10">
              {isLoggedIn && (
                <button
                  onClick={() => { setSidebarOpen(true); setMenuOpen(false); }}
                  aria-label="ملاحظاتي"
                  className="relative p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <NotebookPenIcon className="w-4 h-4" />
                  {notes.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gold" />
                  )}
                </button>
              )}
              <ThemeToggle />
              <UserButton />
            </div>
          </div>
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start pt-20 px-4 overflow-hidden"
          onClick={() => setSearchOpen(false)}
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
                className="w-full bg-white rounded-2xl pr-12 pl-4 py-4 text-[16px] text-stone-800 placeholder-stone-400 outline-none shadow-2xl"
              />
            </div>
            <p className="text-white/40 text-xs text-center mt-3">اضغط Enter للبحث · Escape للإغلاق</p>
          </form>
        </div>
      )}
    </>
  );
}
