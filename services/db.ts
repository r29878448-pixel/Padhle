
import { db } from '../firebase';
import { 
  collection, doc, setDoc, deleteDoc, 
  onSnapshot, getDocs, query, where, getDoc, orderBy, limit, updateDoc 
} from 'firebase/firestore';
import { Course, StaffMember, SiteSettings } from '../types';

// --- TELEGRAM LIVE FEED ---
export interface TelegramPost {
  id: string;
  title: string;
  url: string;
  type: 'youtube' | 'video' | 'pdf' | 'text';
  timestamp: number;
  isIngested?: boolean; // Track if content has been moved to a batch
}

export const subscribeToTelegramFeed = (callback: (posts: TelegramPost[]) => void) => {
  const q = query(collection(db, "telegram_feed"), orderBy("timestamp", "desc"), limit(50));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TelegramPost));
    callback(posts);
  });
};

export const markPostAsIngested = async (postId: string) => {
  const docRef = doc(db, "telegram_feed", postId);
  await updateDoc(docRef, { isIngested: true });
};

// --- COURSES ---
export const subscribeToCourses = (callback: (courses: Course[]) => void) => {
  const q = query(collection(db, "courses"));
  return onSnapshot(q, (snapshot) => {
    const coursesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Course));
    callback(coursesData);
  });
};

export const saveCourseToDB = async (course: Course) => {
  await setDoc(doc(db, "courses", course.id), course);
};

export const deleteCourseFromDB = async (courseId: string) => {
  await deleteDoc(doc(db, "courses", courseId));
};

// --- STAFF ---
export const subscribeToStaff = (callback: (staff: StaffMember[]) => void) => {
  const q = query(collection(db, "staff"));
  return onSnapshot(q, (snapshot) => {
    const staffData = snapshot.docs.map(doc => doc.data() as StaffMember);
    const primaryAdmin = { 
      id: 's1', 
      name: 'Primary Admin', 
      email: 'r29878448@gmail.com', 
      role: 'admin' as const, 
      joinedAt: new Date().toLocaleDateString() 
    };
    const others = staffData.filter(s => s.email !== primaryAdmin.email);
    callback([primaryAdmin, ...others]);
  });
};

export const addStaffToDB = async (staff: StaffMember) => {
  await setDoc(doc(db, "staff", staff.id), staff);
};

export const removeStaffFromDB = async (staffId: string) => {
  await deleteDoc(doc(db, "staff", staffId));
};

// --- SETTINGS ---
export const getSiteSettings = async (): Promise<SiteSettings | null> => {
  const docRef = doc(db, "settings", "config");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as SiteSettings;
  }
  return null;
};

export const saveSiteSettings = async (settings: SiteSettings) => {
  await setDoc(doc(db, "settings", "config"), settings);
};
