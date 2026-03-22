"use client";

export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (total <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-white/10 text-stone-500 dark:text-white/40 disabled:opacity-30 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors"
      >
        السابق
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-stone-300 dark:text-white/20 text-xs">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 text-xs rounded-lg transition-colors ${
              p === page
                ? "bg-primary text-white"
                : "border border-stone-200 dark:border-white/10 text-stone-500 dark:text-white/40 hover:bg-stone-50 dark:hover:bg-white/[0.04]"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === total}
        className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-white/10 text-stone-500 dark:text-white/40 disabled:opacity-30 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors"
      >
        التالي
      </button>
    </div>
  );
}
