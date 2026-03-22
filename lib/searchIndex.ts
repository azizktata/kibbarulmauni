import { university } from "@/lib/data";
import scholarPlaylistsData from "@/data/scholar-playlists.json";
import type { ScholarPlaylist } from "@/components/ScholarPlaylistsSection";

const allPlaylists = scholarPlaylistsData as Record<string, ScholarPlaylist[]>;

export type SearchEntry = {
  type: "subject" | "course" | "lesson" | "playlist";
  title: string;
  levelIdx: number;
  subjectIdx: number;
  courseIdx: number;
  lessonIdx?: number;
  levelTitle: string;
  subjectTitle: string;
  courseTitle: string;
  href: string;
  playlistId?: string;
  scholarName?: string;
};

function buildIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (let lIdx = 0; lIdx < university.length; lIdx++) {
    const level = university[lIdx];
    for (let sIdx = 0; sIdx < level.subjects.length; sIdx++) {
      const subject = level.subjects[sIdx];

      entries.push({
        type: "subject",
        title: subject.title,
        levelIdx: lIdx,
        subjectIdx: sIdx,
        courseIdx: 0,
        levelTitle: level.title,
        subjectTitle: subject.title,
        courseTitle: "",
        href: `/level/${lIdx}/${sIdx}`,
      });

      for (let cIdx = 0; cIdx < subject.courses.length; cIdx++) {
        const course = subject.courses[cIdx];

        entries.push({
          type: "course",
          title: course.title,
          levelIdx: lIdx,
          subjectIdx: sIdx,
          courseIdx: cIdx,
          levelTitle: level.title,
          subjectTitle: subject.title,
          courseTitle: course.title,
          href: `/level/${lIdx}/${sIdx}/${cIdx}`,
        });

        for (let fIdx = 0; fIdx < course.files.length; fIdx++) {
          const lesson = course.files[fIdx];
          entries.push({
            type: "lesson",
            title: lesson.title,
            levelIdx: lIdx,
            subjectIdx: sIdx,
            courseIdx: cIdx,
            lessonIdx: fIdx,
            levelTitle: level.title,
            subjectTitle: subject.title,
            courseTitle: course.title,
            href: `/level/${lIdx}/${sIdx}/${cIdx}?lesson=${fIdx}`,
          });
        }
      }
    }
  }

  // YouTube playlists
  for (const [scholarName, playlists] of Object.entries(allPlaylists)) {
    for (const playlist of playlists) {
      entries.push({
        type: "playlist",
        title: playlist.title,
        playlistId: playlist.playlistId,
        scholarName,
        levelIdx: 0,
        subjectIdx: 0,
        courseIdx: 0,
        levelTitle: "",
        subjectTitle: "",
        courseTitle: "",
        href: `/playlist/${playlist.playlistId}`,
      });
    }
  }

  return entries;
}

export const searchIndex = buildIndex();
