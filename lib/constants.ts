export const LEVEL_COLORS = [
  { gradient: "from-emerald-700 to-emerald-600", bg: "bg-emerald-700", text: "text-emerald-700", light: "bg-emerald-50",  border: "border-emerald-200", activeBorder: "border-r-emerald-700" },
  { gradient: "from-teal-700 to-teal-600",       bg: "bg-teal-700",    text: "text-teal-700",    light: "bg-teal-50",    border: "border-teal-200",   activeBorder: "border-r-teal-700"    },
  { gradient: "from-cyan-700 to-cyan-600",        bg: "bg-cyan-700",    text: "text-cyan-700",    light: "bg-cyan-50",    border: "border-cyan-200",   activeBorder: "border-r-cyan-700"    },
  { gradient: "from-blue-700 to-blue-600",        bg: "bg-blue-700",    text: "text-blue-700",    light: "bg-blue-50",    border: "border-blue-200",   activeBorder: "border-r-blue-700"    },
  { gradient: "from-indigo-700 to-indigo-600",    bg: "bg-indigo-700",  text: "text-indigo-700",  light: "bg-indigo-50",  border: "border-indigo-200", activeBorder: "border-r-indigo-700"  },
  { gradient: "from-violet-700 to-violet-600",    bg: "bg-violet-700",  text: "text-violet-700",  light: "bg-violet-50",  border: "border-violet-200", activeBorder: "border-r-violet-700"  },
  { gradient: "from-purple-700 to-purple-600",    bg: "bg-purple-700",  text: "text-purple-700",  light: "bg-purple-50",  border: "border-purple-200", activeBorder: "border-r-purple-700"  },
  { gradient: "from-rose-700 to-rose-600",        bg: "bg-rose-700",    text: "text-rose-700",    light: "bg-rose-50",    border: "border-rose-200",   activeBorder: "border-r-rose-700"    },
] as const;

export type LevelColor = typeof LEVEL_COLORS[number];

export const ARABIC_DIGITS = ["١","٢","٣","٤","٥","٦","٧","٨","٩","١٠","١١","١٢","١٣","١٤","١٥","١٦","١٧","١٨","١٩","٢٠"];
