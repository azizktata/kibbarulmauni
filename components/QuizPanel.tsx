"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/app/api/quiz/route";

interface Props {
  questions: QuizQuestion[];
}

export function QuizPanel({ questions }: Props) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<(number | null)[]>(() =>
    questions.map(() => null),
  );
  const [submitted, setSubmitted] = useState(false);

  const q = questions[current];
  const userPick = selected[current];
  const isLast = current === questions.length - 1;
  const allAnswered = selected.every((s) => s !== null);

  const score = submitted
    ? questions.filter((q, i) => selected[i] === q.correct).length
    : 0;

  function pickOption(oi: number) {
    if (submitted) return;
    const next = [...selected];
    next[current] = oi;
    setSelected(next);
  }

  function handleSubmit() {
    if (allAnswered) setSubmitted(true);
  }

  function handleRetry() {
    setSelected(questions.map(() => null));
    setSubmitted(false);
    setCurrent(0);
  }

  const scoreBannerStyle =
    score === questions.length
      ? "bg-[#F0BC53]/15 border-[#F0BC53]/40 text-[#8a6a1a] dark:text-[#F0BC53]"
      : score / questions.length >= 0.6
        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700/40 dark:text-emerald-400"
        : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700/40 dark:text-red-400";

  return (
    <div
      className="rounded-xl border border-[#DEDAD0] dark:border-white/[0.06] bg-white dark:bg-white/[0.04] overflow-hidden"
      dir="rtl"
    >
      {/* Accordion header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#F6F5F1] dark:hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[#F0BC53] shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          <span className="text-sm font-bold text-[#0F2822] dark:text-white/80">
            اختبر فهمك
          </span>
          <span className="text-xs text-[#0F2822]/40 dark:text-white/30">
            {questions.length} {questions.length === 1 ? "سؤال" : "أسئلة"}
          </span>
          {submitted && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreBannerStyle}`}
            >
              {score}/{questions.length}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-[#0F2822]/40 dark:text-white/30 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Accordion body */}
      {open && (
        <div className="border-t border-[#DEDAD0] dark:border-white/[0.06]">
          {/* Score banner (after submit) */}
          {submitted && (
            <div
              className={`flex items-center gap-3 mx-4 mt-4 rounded-lg border px-4 py-3 text-sm font-semibold ${scoreBannerStyle}`}
            >
              <span className="text-base">
                {score === questions.length
                  ? "🎉"
                  : score / questions.length >= 0.6
                    ? "✅"
                    : "📖"}
              </span>
              <span>
                أجبت بشكل صحيح على {score} من أصل {questions.length}{" "}
                {questions.length === 1 ? "سؤال" : "أسئلة"}
              </span>
            </div>
          )}

          {/* Question + options */}
          <div className="p-4 flex flex-col gap-4">
            {/* Progress dots */}
            {questions.length > 1 && (
              <div className="flex items-center justify-center gap-1.5">
                {questions.map((_, i) => {
                  const answered = selected[i] !== null;
                  const correct =
                    submitted && selected[i] === questions[i].correct;
                  const wrong =
                    submitted &&
                    selected[i] !== null &&
                    selected[i] !== questions[i].correct;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-150 ${
                        i === current
                          ? "w-5 bg-[#F0BC53]"
                          : correct
                            ? "bg-emerald-400"
                            : wrong
                              ? "bg-red-400"
                              : answered
                                ? "bg-[#F0BC53]/50"
                                : "bg-[#DEDAD0] dark:bg-white/[0.10]"
                      }`}
                    />
                  );
                })}
              </div>
            )}

            {/* Question text */}
            <p className="text-sm font-semibold text-[#0F2822]/90 dark:text-white/80 leading-relaxed">
              <span className="text-[#F0BC53] ml-1">{current + 1}.</span>{" "}
              {q.text}
            </p>

            {/* Options */}
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oi) => {
                let style =
                  "border-[#DEDAD0] dark:border-white/[0.08] text-[#0F2822]/70 dark:text-white/60 hover:border-[#F0BC53]/50 hover:bg-[#F0BC53]/5 cursor-pointer";

                if (submitted) {
                  if (oi === q.correct)
                    style =
                      "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400 cursor-default";
                  else if (oi === userPick)
                    style =
                      "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600 text-red-600 dark:text-red-400 cursor-default";
                  else
                    style =
                      "border-[#DEDAD0]/50 dark:border-white/[0.04] text-[#0F2822]/30 dark:text-white/25 cursor-default";
                } else if (userPick === oi) {
                  style =
                    "border-[#F0BC53] bg-[#F0BC53]/10 text-[#0F2822] dark:text-white font-medium cursor-pointer";
                }
                if (opt.trim() !== "") {
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      onClick={() => pickOption(oi)}
                      className={`w-full text-right rounded-lg border px-4 py-2.5 text-sm transition-all duration-150 flex items-center gap-3 ${style}`}
                    >
                      {submitted && oi === q.correct && (
                        <svg
                          className="w-3.5 h-3.5 shrink-0 text-emerald-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                      {submitted && oi === userPick && oi !== q.correct && (
                        <svg
                          className="w-3.5 h-3.5 shrink-0 text-red-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      )}
                      {(!submitted ||
                        (oi !== q.correct && oi !== userPick)) && (
                        <span
                          className={`w-3.5 h-3.5 shrink-0 rounded-full border-2 flex-shrink-0 ${userPick === oi && !submitted ? "border-[#F0BC53] bg-[#F0BC53]" : "border-current opacity-30"}`}
                        />
                      )}
                      <span>{opt}</span>
                    </button>
                  );
                }
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
                disabled={current === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#0F2822]/50 dark:text-white/40 hover:text-[#0F2822] dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" />
                </svg>
                السابق
              </button>

              {submitted ? (
                <button
                  onClick={handleRetry}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg border border-[#DEDAD0] dark:border-white/[0.08] text-[#0F2822]/60 dark:text-white/50 hover:bg-[#F6F5F1] dark:hover:bg-white/[0.04] transition-colors"
                >
                  إعادة المحاولة
                </button>
              ) : isLast ? (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#193833] hover:bg-[#0F2822] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  تحقق من الإجابات
                </button>
              ) : (
                <button
                  onClick={() =>
                    setCurrent((c) => Math.min(c + 1, questions.length - 1))
                  }
                  disabled={userPick === null && !submitted}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#193833] dark:text-white/70 hover:text-[#0F2822] dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  التالي
                  <svg
                    className="w-3.5 h-3.5 rotate-180"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
