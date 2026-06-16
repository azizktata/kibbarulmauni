import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = {
  title: "بحث",
  description:
    "ابحث في محتوى جامعة كبار العلماء عن المواد والمقررات والدروس الصوتية في العلم الشرعي بأصوات كبار العلماء.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-emerald-950" />}>
      <SearchClient />
    </Suspense>
  );
}
