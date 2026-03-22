"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ADMIN_EMAIL = "azizktata77@gmail.com";

interface Props {
  lessonKey: string;   // "levelIdx:subjectIdx:courseIdx:lessonIdx"
  currentBook: string;
  onSaved: (url: string) => void;
}

export function BookLinkButton({ lessonKey, currentBook, onSaved }: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(currentBook);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (session?.user?.email !== ADMIN_EMAIL) return null;

  function handleOpen() {
    setUrl(currentBook);
    setError("");
    setOpen(true);
  }

  async function handleSaveUrl(value: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonKey, book: value.trim() }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      setOpen(false);
      onSaved(value.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        title={lessonKey}
        className="fixed bottom-20 left-6 z-40 flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium rounded-full px-4 py-2.5 shadow-lg transition-colors"
      >
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        {currentBook ? "تعديل الكتاب" : "إضافة كتاب"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">رابط كتاب الدرس</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-stone-400 -mt-1">{lessonKey}</p>

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            dir="ltr"
            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 justify-between">
            {currentBook && (
              <button
                onClick={() => { setUrl(""); handleSaveUrl(""); }}
                disabled={saving}
                className="px-4 py-2 text-sm text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
              >
                حذف الرابط
              </button>
            )}
            <div className="flex gap-2 mr-auto">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleSaveUrl(url)}
                disabled={saving}
                className="px-5 py-2 text-sm font-medium bg-stone-800 hover:bg-stone-700 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
