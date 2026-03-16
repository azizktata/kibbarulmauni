"use client";

import { useState, useEffect } from "react";

const QUOTES = [
  {
    text: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ",
    source: "رواه ابن ماجه",
  },
  {
    text: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ",
    source: "رواه مسلم",
  },
  {
    text: "فَضْلُ الْعَالِمِ عَلَى الْعَابِدِ كَفَضْلِ الْقَمَرِ لَيْلَةَ الْبَدْرِ عَلَى سَائِرِ الْكَوَاكِبِ",
    source: "رواه أبو داود والترمذي",
  },
  {
    text: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    source: "رواه البخاري",
  },
];

export function RotatingQuote() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 500);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const q = QUOTES[idx];

  return (
    <div
      className="mt-10 border-t border-white/10 pt-8"
      style={{ transition: "opacity 0.5s", opacity: visible ? 1 : 0 }}
    >
      <p
        className="text-base sm:text-lg text-emerald-100/80 leading-loose max-w-xl mx-auto"
        style={{ fontFamily: "var(--font-amiri)" }}
      >
        &ldquo;{q.text}&rdquo;
      </p>
      <p className="text-emerald-400/60 text-xs mt-2">{q.source}</p>
    </div>
  );
}
