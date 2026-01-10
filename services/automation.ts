
import { scrapeDeltaContent } from './firecrawlService';
import { saveCourseToDB } from './db';
import { Course } from '../types';

// Define the log interface used by UI components for progress tracking
export interface SyncLog {
  id: string;
  itemTitle: string;
  message: string;
  status: 'success' | 'failed' | 'syncing';
}

/**
 * Automates content ingestion from a source URL.
 * Designed to be called by a cloud trigger or webhook simulation.
 */
export const triggerDeltaAutoUpdate = async (sourceUrl: string, existingCourseId: string, currentCourses: Course[]) => {
  console.log(`[Watchdog] Initiating sync for: ${sourceUrl}`);
  
  try {
    const scrapedData = await scrapeDeltaContent(sourceUrl);
    const targetCourse = currentCourses.find(c => c.id === existingCourseId);
    
    if (!targetCourse || !scrapedData) return;

    // Intelligent Merging Logic
    let updated = false;
    const newCourse = JSON.parse(JSON.stringify(targetCourse));

    scrapedData.subjects.forEach((sScraped: any) => {
      let sTarget = newCourse.subjects.find((s: any) => s.title === sScraped.title);
      if (!sTarget) {
        sTarget = { id: `sub-${Date.now()}`, title: sScraped.title, chapters: [{ id: `ch-${Date.now()}`, title: 'Course Content', lectures: [] }] };
        newCourse.subjects.push(sTarget);
        updated = true;
      }

      const chapter = sTarget.chapters[0];
      sScraped.lectures.forEach((lScraped: any) => {
        const exists = chapter.lectures.some((l: any) => l.title === lScraped.title);
        if (!exists) {
          chapter.lectures.push({
            id: `lec-auto-${Date.now()}`,
            title: lScraped.title,
            videoUrl: lScraped.url,
            thumbnail: lScraped.thumbnail || targetCourse.image,
            duration: lScraped.duration,
            description: "Automatically Synced from Source.",
            resources: lScraped.resources || []
          });
          updated = true;
        }
      });
    });

    if (updated) {
      await saveCourseToDB(newCourse);
      console.log(`[Watchdog] Sync complete: Content updated for ${newCourse.title}`);
    } else {
      console.log(`[Watchdog] Check complete: No new content found.`);
    }
  } catch (e) {
    console.error(`[Watchdog] Sync failed for ${sourceUrl}:`, e);
  }
};

/**
 * Main UI-driven sync runner with logging support.
 * Used for manual batch syncing and the Admin Watchdog panel.
 */
export const runDeltaAutoSync = async (
  sourceUrl: string,
  currentCourses: Course[],
  onLog?: (log: SyncLog) => void
) => {
  const log = (message: string, status: 'success' | 'failed' | 'syncing' = 'syncing', title: string = 'Delta Sync') => {
    onLog?.({
      id: Math.random().toString(36).substr(2, 9),
      itemTitle: title,
      message,
      status
    });
  };

  log(`Connecting to source: ${sourceUrl}`);

  try {
    const scrapedData = await scrapeDeltaContent(sourceUrl);
    if (!scrapedData) {
      log('No data returned from scraper', 'failed');
      return;
    }

    // Try to match the target course by URL or title
    const targetCourse = currentCourses.find(c => c.shortLink === sourceUrl || c.title.toLowerCase() === scrapedData.title.toLowerCase());
    
    if (!targetCourse) {
      log('Target course not found in library. Use AI Scraper to import first.', 'failed', scrapedData.title);
      return;
    }

    log(`Merging content for: ${targetCourse.title}`, 'syncing', targetCourse.title);

    let updated = false;
    const newCourse = JSON.parse(JSON.stringify(targetCourse));

    // Map through scraped subjects and merge into the target batch
    scrapedData.subjects.forEach((sScraped: any) => {
      let sTarget = newCourse.subjects.find((s: any) => s.title.toLowerCase() === sScraped.title.toLowerCase());
      if (!sTarget) {
        sTarget = { 
          id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
          title: sScraped.title, 
          chapters: [{ id: `ch-${Date.now()}`, title: 'Course Content', lectures: [] }] 
        };
        newCourse.subjects.push(sTarget);
        updated = true;
      }

      const chapter = sTarget.chapters[0];
      sScraped.lectures.forEach((lScraped: any) => {
        const exists = chapter.lectures.some((l: any) => l.title.toLowerCase() === lScraped.title.toLowerCase());
        if (!exists) {
          chapter.lectures.push({
            id: `lec-auto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: lScraped.title,
            videoUrl: lScraped.url,
            thumbnail: lScraped.thumbnail || targetCourse.image,
            duration: lScraped.duration || 'Recording',
            description: "Automatically Synced from Source.",
            resources: lScraped.resources || []
          });
          updated = true;
        }
      });
    });

    if (updated) {
      await saveCourseToDB(newCourse);
      log('Sync complete: Library updated with new content.', 'success', targetCourse.title);
    } else {
      log('Check complete: No new content found.', 'success', targetCourse.title);
    }
  } catch (e: any) {
    log(`Sync failed: ${e.message}`, 'failed');
    console.error(`[Watchdog] Sync failed for ${sourceUrl}:`, e);
  }
};
