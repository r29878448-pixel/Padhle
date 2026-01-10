
import { scrapeDeltaContent } from './firecrawlService';
import { saveCourseToDB, markPostAsIngested, TelegramPost } from './db';
import { Course, Subject, Chapter, Lecture } from '../types';

export interface SyncLog {
  id: string;
  itemTitle: string;
  status: 'processing' | 'success' | 'failed' | 'idle';
  message: string;
}

/**
 * Monitors a specific Delta Study URL for new content.
 * If found, merges it into the existing database entry.
 */
export const runDeltaAutoSync = async (
  watchUrl: string,
  existingCourses: Course[],
  onProgress: (log: SyncLog) => void
) => {
  const logId = Math.random().toString(36).substr(2, 9);
  onProgress({ id: logId, itemTitle: watchUrl, status: 'processing', message: 'Firecrawl is checking Delta Source...' });

  try {
    // 1. Scrape live content
    const scraped = await scrapeDeltaContent(watchUrl);
    if (!scraped || !scraped.title) throw new Error("Could not parse Delta source.");

    // 2. Find matching course in our DB
    const targetCourse = existingCourses.find(c => 
      c.title.toLowerCase().trim() === scraped.title.toLowerCase().trim()
    );

    if (!targetCourse) {
      onProgress({ id: logId, itemTitle: scraped.title, status: 'failed', message: 'No matching Batch found in portal. Import it manually once first.' });
      return false;
    }

    // 3. Compare hierarchy
    let newLecturesFound = 0;
    const updatedCourse = JSON.parse(JSON.stringify(targetCourse));

    scraped.subjects.forEach((sScraped: any) => {
      let sTarget = updatedCourse.subjects.find((s: any) => s.title === sScraped.title);
      if (!sTarget) {
        sTarget = { id: `sub-${Date.now()}`, title: sScraped.title, chapters: [{ id: `ch-${Date.now()}`, title: 'Course Content', lectures: [] }] };
        updatedCourse.subjects.push(sTarget);
      }

      const chapter = sTarget.chapters[0];
      sScraped.lectures.forEach((lScraped: any) => {
        const exists = chapter.lectures.some((l: any) => l.title === lScraped.title);
        if (!exists) {
          chapter.lectures.push({
            id: `lec-auto-${Date.now()}-${newLecturesFound}`,
            title: lScraped.title,
            videoUrl: lScraped.url,
            thumbnail: lScraped.thumbnail || updatedCourse.image,
            duration: lScraped.duration,
            description: "Automatically Ingested by Watchdog.",
            resources: lScraped.resources || []
          });
          newLecturesFound++;
        }
      });
    });

    if (newLecturesFound > 0) {
      await saveCourseToDB(updatedCourse);
      onProgress({ id: logId, itemTitle: scraped.title, status: 'success', message: `Synced ${newLecturesFound} new lectures!` });
      return true;
    } else {
      onProgress({ id: logId, itemTitle: scraped.title, status: 'idle', message: 'No new lectures found. Up to date.' });
      return false;
    }

  } catch (error: any) {
    onProgress({ id: logId, itemTitle: watchUrl, status: 'failed', message: error.message });
    return false;
  }
};
