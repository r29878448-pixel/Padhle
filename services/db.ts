import { db } from '../firebase';
import { 
  collection, doc, setDoc, deleteDoc, 
  onSnapshot, getDocs, query, where, getDoc, orderBy, limit, updateDoc, addDoc 
} from 'firebase/firestore';
import { Course, StaffMember, SiteSettings, Notice, Banner } from '../types';

// --- NOTICES ---
export const subscribeToNotices = (callback: (notices: Notice[]) => void) => {
  const q = query(collection(db, "notices"), orderBy("timestamp", "desc"), limit(5));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notice));
    callback(data);
  });
};

export const addNoticeToDB = async (notice: Partial<Notice>) => {
  await addDoc(collection(db, "notices"), {
    ...notice,
    timestamp: Date.now()
  });
};

export const deleteNoticeFromDB = async (id: string) => {
  await deleteDoc(doc(db, "notices", id));
};

// --- BANNERS ---
export const subscribeToBanners = (callback: (banners: Banner[]) => void) => {
  return onSnapshot(collection(db, "banners"), (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Banner));
    callback(data);
  });
};

export const addBannerToDB = async (banner: Partial<Banner>) => {
  await addDoc(collection(db, "banners"), banner);
};

export const deleteBannerFromDB = async (id: string) => {
  await deleteDoc(doc(db, "banners", id));
};

// --- TELEGRAM/MANUAL FEED ---
export interface TelegramPost {
  id: string;
  title: string;
  url: string;
  type: 'youtube' | 'video' | 'pdf' | 'text' | 'telegram';
  timestamp: number;
  isIngested?: boolean;
}

export const subscribeToTelegramFeed = (callback: (posts: TelegramPost[]) => void) => {
  const q = query(collection(db, "telegram_feed"), orderBy("timestamp", "desc"), limit(50));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TelegramPost));
    callback(posts);
  });
};

export const addManualIngestItem = async (post: Partial<TelegramPost>) => {
  await addDoc(collection(db, "telegram_feed"), post);
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
