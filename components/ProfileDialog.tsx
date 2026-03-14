"use client";

import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, type ReactNode } from "react";

interface Props {
  trigger: ReactNode;
  userName?: string | null;
  userImage?: string | null;
}

export function ProfileDialog({ trigger, userName, userImage }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(userName ?? "");
  const [age, setAge] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: { name: string | null; age: number | null }) => {
        setName(data.name ?? "");
        setAge(data.age != null ? String(data.age) : "");
      })
      .catch(() => {});
  }, [open]);

  async function handleSave() {
    setSaving(true);
    const body: { name?: string; age?: number } = {};
    if (name.trim()) body.name = name.trim();
    if (age !== "" && !isNaN(Number(age))) body.age = Number(age);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger}
      </span>

      <DialogContent className="sm:max-w-sm font-cairo" dir="rtl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userImage} alt="" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-sm">
                {(userName ?? "؟")[0]}
              </div>
            )}
            <DialogTitle className="text-base font-bold text-stone-800">
              الملف الشخصي
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-stone-600 block mb-1">
              الاسم
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600 block mb-1">
              العمر <span className="text-stone-400">(اختياري)</span>
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-800 disabled:opacity-60 transition-colors"
          >
            {saved ? "تم الحفظ ✓" : saving ? "جارٍ الحفظ…" : "حفظ"}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-xs text-stone-400 hover:text-red-500 transition-colors py-1"
          >
            تسجيل الخروج
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
