"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ADMIN_EMAIL = "azizktata77@gmail.com";

interface Props {
  filename: string | null;   // e.g. "0-2-2-0.txt"
  onSaved: () => void;
}

export function TranscriptUploadButton({ filename, onSaved }: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (session?.user?.email !== ADMIN_EMAIL) return null;

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: filename, content }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      setOpen(false);
      setContent("");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        title={filename ? `تعديل نص ${filename}` : "إضافة نص الدرس"}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium rounded-full px-4 py-2.5 shadow-lg transition-colors"
      >
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M12 8v4M10 10h4" />
        </svg>
        نص الدرس
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">إضافة / تعديل نص الدرس</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-stone-400 -mt-1">{filename}</p>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"(0:05) النص هنا...\n(1:30) مزيد من النص..."}
            dir="rtl"
            rows={16}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-mono text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="px-5 py-2 text-sm font-medium bg-stone-800 hover:bg-stone-700 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
