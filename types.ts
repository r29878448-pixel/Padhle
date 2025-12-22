export interface Resource {
  id: string;
  title: string;
  url: string; // Can be a URL or Base64 string
  type: 'pdf' | 'link' | 'image';
}

export interface Video {
  id: string;
  title: string;
  youtubeId: string;
  duration: string;
  thumbnail: string;
  description: string;
  completed?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  videos: Video[];
  notes?: Resource[];
  progress?: number; // 0-100
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
  chapters: Chapter[];
  shortLink?: string;
  accessCode?: string; // Specific code for this batch
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
  role: 'manager' | 'admin';
  joinedAt: string;
}