
export interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'pdf' | 'link';
}

export interface Lecture {
  id: string;
  title: string;
  videoUrl: string;
  duration: string;
  description: string;
  resources: Resource[];
}

export interface Chapter {
  id: string;
  title: string;
  lectures: Lecture[];
}

export interface Subject {
  id: string;
  title: string;
  chapters: Chapter[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  price: number;
  rating: number;
  students: number;
  image: string;
  category: string;
  subjects: Subject[];
  shortLink?: string;
  accessCode?: string;
  qrCode?: string;
}

export interface Notice {
  id: string;
  text: string;
  type: 'urgent' | 'update' | 'new_batch';
  timestamp: number;
}

export interface Banner {
  id: string;
  imageUrl: string;
  targetBatchId?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface SiteSettings {
  shortenerUrl: string;
  shortenerApiKey: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'manager' | 'admin';
  joinedAt: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  joinedAt: number;
  lastActive: number;
  enrolledBatches: string[];
}

export interface LectureProgress {
  userId: string;
  courseId: string;
  lectureId: string;
  completedAt: number;
}
