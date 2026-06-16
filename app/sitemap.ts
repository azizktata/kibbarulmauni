import type { MetadataRoute } from "next";
import { readdirSync } from "fs";
import { resolve } from "path";
import { university } from "@/lib/data";
import { scholarsIndex } from "@/lib/scholars";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/scholars`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  // Levels → subjects → courses
  university.forEach((level, lIdx) => {
    entries.push({
      url: `${SITE_URL}/level/${lIdx}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
    level.subjects.forEach((subject, sIdx) => {
      entries.push({
        url: `${SITE_URL}/level/${lIdx}/${sIdx}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
      subject.courses.forEach((_course, cIdx) => {
        entries.push({
          url: `${SITE_URL}/level/${lIdx}/${sIdx}/${cIdx}`,
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      });
    });
  });

  // Scholar profiles
  scholarsIndex.forEach((scholar) => {
    entries.push({
      url: `${SITE_URL}/scholars/${encodeURIComponent(scholar.name)}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  });

  // YouTube playlists
  try {
    const playlistsDir = resolve(process.cwd(), "data/playlists");
    const playlistFiles = readdirSync(playlistsDir).filter((f) => f.endsWith(".json"));
    for (const file of playlistFiles) {
      entries.push({
        url: `${SITE_URL}/playlist/${file.replace(".json", "")}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  } catch {
    /* data/playlists not populated yet */
  }

  return entries;
}
