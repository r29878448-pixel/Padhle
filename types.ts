export interface Resource {
  id: string;
  title: string;
  url: string; // Can be a URL or Base64 string
  type: 'pdf' | 'link';
}

export interface Lecture {
  id: string;
  title: string;
  youtubeId: string;
  duration: string;
  description: string;
  resources: Resource[]; // Notes/PDFs specific to this lecture
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
  subjects: Subject[]; // Changed from chapters to subjects
  shortLink?: string;
  accessCode?: string;
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