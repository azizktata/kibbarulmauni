"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ADMIN_EMAIL = "azizktata77@gmail.com";

interface Props {
  filename: string;  // e.g. "0-2-2-0.mp3"
  onSaved: () => void;
}

export function AudioUploadButton({ filename, onSaved }: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (session?.user?.email !== ADMIN_EMAIL) return null;

  async function handleSave() {
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", filename);
      const res = await fetch("/api/audio", { method: "POST", body: formData });
      if (!res.ok) throw new Error("فشل الرفع");
      setOpen(false);
      setFile(null);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={filename}
        className="fixed bottom-20 left-6 z-40 flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium rounded-full px-4 py-2.5 shadow-lg transition-colors"
      >
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        صوت الدرس
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">رفع ملف الصوت</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-stone-400 -mt-1">{filename}</p>

          <div
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-stone-200 rounded-lg p-8 text-center hover:border-stone-400 transition-colors"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".mp3,audio/mpeg"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div>
                <p className="text-sm font-medium text-stone-700">{file.name}</p>
                <p className="text-xs text-stone-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <svg className="w-8 h-8 mx-auto text-stone-300 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                <p className="text-sm text-stone-400">انقر لاختيار ملف MP3</p>
              </div>
            )}
          </div>

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
              disabled={saving || !file}
              className="px-5 py-2 text-sm font-medium bg-stone-800 hover:bg-stone-700 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "جاري الرفع..." : "رفع"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
