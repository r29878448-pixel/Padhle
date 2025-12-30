
import { classifyContent } from './geminiService';
import { saveCourseToDB, markPostAsIngested, TelegramPost } from './db';
import { Course, Subject, Chapter, Lecture } from '../types';

export interface SyncLog {
  id: string;
  itemTitle: string;
  status: 'processing' | 'success' | 'failed';
  message: string;
}

export const runAIAutomation = async (
  pendingItems: TelegramPost[], 
  courses: Course[],
  onProgress: (log: SyncLog) => void
) => {
  let successCount = 0;

  for (const item of pendingItems) {
    if (item.isIngested) continue;

    const logId = Math.random().toString(36).substr(2, 9);
    onProgress({ id: logId, itemTitle: item.title, status: 'processing', message: 'AI is analyzing content...' });

    try {
      const mapping = await classifyContent(item, courses);
      
      if (!mapping || !mapping.courseId) {
        onProgress({ id: logId, itemTitle: item.title, status: 'failed', message: 'AI could not match this to any Batch.' });
        continue;
      }

      const targetCourse = courses.find(c => c.id === mapping.courseId);
      if (!targetCourse) {
        onProgress({ id: logId, itemTitle: item.title, status: 'failed', message: 'Matched Batch ID no longer exists.' });
        continue;
      }

      // Clone course to avoid mutation issues
      const updatedCourse = JSON.parse(JSON.stringify(targetCourse));
      
      // Find or create Subject
      let subject = updatedCourse.subjects.find((s: Subject) => 
        s.title.toLowerCase().includes(mapping.subjectTitle.toLowerCase())
      );
      if (!subject) {
        subject = { id: `sub-${Date.now()}`, title: mapping.subjectTitle, chapters: [] };
        updatedCourse.subjects.push(subject);
      }

      // Find or create Chapter
      let chapter = subject.chapters.find((c: Chapter) => 
        c.title.toLowerCase().includes(mapping.chapterTitle.toLowerCase())
      );
      if (!chapter) {
        chapter = { id: `ch-${Date.now()}`, title: mapping.chapterTitle, lectures: [] };
        subject.chapters.push(chapter);
      }

      // Add as Lecture
      const newLecture: Lecture = {
        id: `lec-${Date.now()}`,
        title: item.title,
        videoUrl: item.url,
        duration: 'Sync Added',
        description: 'Automatically added via AI Automation.',
        resources: []
      };
      chapter.lectures.push(newLecture);

      // Save to DB
      await saveCourseToDB(updatedCourse);
      await markPostAsIngested(item.id);

      successCount++;
      onProgress({ id: logId, itemTitle: item.title, status: 'success', message: `Added to ${updatedCourse.title} > ${subject.title}` });

    } catch (error) {
      console.error("Automation Error for item:", item.title, error);
      onProgress({ id: logId, itemTitle: item.title, status: 'failed', message: 'System error during ingestion.' });
    }
  }

  return successCount;
};
