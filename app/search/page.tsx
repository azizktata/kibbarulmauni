import { Suspense } from "react";
import { SearchClient } from "./SearchClient";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-emerald-950" />}>
      <SearchClient />
    </Suspense>
  );
}
