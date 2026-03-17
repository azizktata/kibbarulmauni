export const LEVEL_COLORS = [
  { gradient: "from-emerald-900 to-emerald-800", bg: "bg-emerald-900", text: "text-emerald-900", light: "bg-emerald-50", border: "border-emerald-200", activeBorder: "border-r-emerald-900", ring: "stroke-emerald-900" },
  { gradient: "from-teal-800 to-teal-700",       bg: "bg-teal-800",    text: "text-teal-800",    light: "bg-teal-50",   border: "border-teal-200",   activeBorder: "border-r-teal-800",    ring: "stroke-teal-800"   },
  { gradient: "from-emerald-800 to-emerald-700", bg: "bg-emerald-800", text: "text-emerald-800", light: "bg-emerald-50", border: "border-emerald-200", activeBorder: "border-r-emerald-800", ring: "stroke-emerald-800" },
  { gradient: "from-teal-700 to-teal-600",       bg: "bg-teal-700",    text: "text-teal-700",    light: "bg-teal-50",   border: "border-teal-200",   activeBorder: "border-r-teal-700",    ring: "stroke-teal-700"   },
  { gradient: "from-emerald-700 to-emerald-600", bg: "bg-emerald-700", text: "text-emerald-700", light: "bg-emerald-50", border: "border-emerald-200", activeBorder: "border-r-emerald-700", ring: "stroke-emerald-700" },
  { gradient: "from-amber-400 to-amber-300",     bg: "bg-amber-400",   text: "text-amber-500",   light: "bg-amber-50",  border: "border-amber-200",  activeBorder: "border-r-amber-400",   ring: "stroke-amber-400"  },
  { gradient: "from-amber-400 to-amber-300",     bg: "bg-amber-400",   text: "text-amber-500",   light: "bg-amber-50",  border: "border-amber-200",  activeBorder: "border-r-amber-400",   ring: "stroke-amber-400"  },
  { gradient: "from-amber-500 to-amber-400",     bg: "bg-amber-500",   text: "text-amber-600",   light: "bg-amber-50",  border: "border-amber-200",  activeBorder: "border-r-amber-500",   ring: "stroke-amber-500"  },
] as const;

export type LevelColor = typeof LEVEL_COLORS[number];

export const ARABIC_DIGITS = ["١","٢","٣","٤","٥","٦","٧","٨","٩","١٠","١١","١٢","١٣","١٤","١٥","١٦","١٧","١٨","١٩","٢٠"];
