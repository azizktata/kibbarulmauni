"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { QuizQuestion } from "@/app/api/quiz/route";

const ADMIN_EMAIL = "azizktata77@gmail.com";

interface Props {
  filename: string; // e.g. "0-0-0-0"
  currentQuiz: QuizQuestion[];
  onSaved: (questions: QuizQuestion[]) => void;
  onDeleted: () => void;
}

function emptyQuestion(): QuizQuestion {
  return { text: "", options: ["", "", "", ""], correct: 0 };
}

export function QuizAdminButton({ filename, currentQuiz, onSaved, onDeleted }: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Sync dialog state with currentQuiz when opening
  useEffect(() => {
    if (open) {
      setQuestions(currentQuiz.length > 0 ? structuredClone(currentQuiz) : [emptyQuestion()]);
      setError("");
    }
  }, [open, currentQuiz]);

  if (session?.user?.email !== ADMIN_EMAIL) return null;

  function updateQuestion(qi: number, patch: Partial<QuizQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  }

  function updateOption(qi: number, oi: number, val: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        const opts = [...q.options];
        opts[oi] = val;
        return { ...q, options: opts };
      })
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(qi: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== qi));
  }

  async function handleSave() {
    setError("");
    for (const q of questions) {
      if (!q.text.trim()) { setError("أدخل نص كل سؤال"); return; }
      // if (q.options.some((o) => !o.trim())) { setError("أدخل جميع الخيارات"); return; }
    }
    setSaving(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: filename, questions }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "فشل الحفظ");
      onSaved(questions);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/quiz?file=${filename}`, { method: "DELETE" });
      onDeleted();
      setOpen(false);
    } catch {
      setError("فشل الحذف");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={filename}
        className="fixed bottom-[3.5rem] left-6 z-40 flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium rounded-full px-4 py-2.5 shadow-lg transition-colors"
      >
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
        اختبار الدرس
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">إضافة / تعديل اختبار الدرس</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-stone-400 -mt-1">{filename}</p>

          <div className="flex flex-col gap-6">
            {questions.map((q, qi) => (
              <div key={qi} className="rounded-lg border border-stone-200 p-4 flex flex-col gap-3 relative">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-stone-500">السؤال {qi + 1}</span>
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(qi)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      حذف
                    </button>
                  )}
                </div>

                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                  placeholder="نص السؤال..."
                  dir="rtl"
                  rows={2}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
                />

                <div className="flex flex-col gap-2">
                  <p className="text-xs text-stone-400">الخيارات (اختر الصحيح)</p>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correct === oi}
                        onChange={() => updateQuestion(qi, { correct: oi })}
                        className="accent-emerald-700 shrink-0"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        placeholder={`الخيار ${oi + 1}`}
                        dir="rtl"
                        className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addQuestion}
            className="w-full py-2 text-sm text-stone-500 hover:text-stone-700 border border-dashed border-stone-200 hover:border-stone-400 rounded-lg transition-colors"
          >
            + إضافة سؤال
          </button>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 justify-between pt-1">
            <div>
              {currentQuiz.length > 0 && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
                >
                  {deleting ? "جاري الحذف..." : "حذف الاختبار"}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
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
