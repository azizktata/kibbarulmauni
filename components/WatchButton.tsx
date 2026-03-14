"use client";

import { useWatched } from "@/lib/watchedContext";
import { SignInDialog } from "./SignInDialog";
import { cn } from "@/lib/utils";
import type { LevelColor } from "@/lib/constants";

interface Props {
  lessonKey: string;
  col: LevelColor;
  className?: string;
}

function CheckIcon() {
  return (
    <svg
      className="w-3 h-3 text-white"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 6l3 3 5-5" />
    </svg>
  );
}

export function WatchButton({ lessonKey, col, className }: Props) {
  const { isWatched, toggleWatched, isLoaded, isLoggedIn } = useWatched();

  if (!isLoaded) {
    return (
      <div className={cn("shrink-0 w-5 h-5 rounded-md bg-stone-100 animate-pulse", className)} />
    );
  }

  const checkbox = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleWatched(lessonKey);
      }}
      aria-label={isWatched(lessonKey) ? "إلغاء الضبط كمشاهَد" : "ضبط كمشاهَد"}
      className={cn(
        "shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150",
        isWatched(lessonKey)
          ? `${col.bg} border-transparent`
          : "border-stone-200 bg-white hover:border-stone-300",
        className
      )}
    >
      {isWatched(lessonKey) && <CheckIcon />}
    </button>
  );

  if (!isLoggedIn) {
    return (
      <SignInDialog
        trigger={
          <span onClick={(e) => e.stopPropagation()}>
            {checkbox}
          </span>
        }
      />
    );
  }

  return checkbox;
}
