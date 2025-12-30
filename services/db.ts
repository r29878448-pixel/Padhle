
import { db } from '../firebase';
import { 
  collection, doc, setDoc, deleteDoc, 
  onSnapshot, getDocs, query, orderBy, limit, updateDoc, addDoc, getDoc, serverTimestamp, where 
} from 'firebase/firestore';
import { Course, StaffMember, SiteSettings, Notice, Banner, Student, LectureProgress } from '../types';

// --- NOTICES ---
export const subscribeToNotices = (callback: (notices: Notice[]) => void) => {
  const q = query(collection(db, "notices"), orderBy("timestamp", "desc"), limit(5));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notice));
    callback(data);
  }, (error) => console.warn("Notice sync unavailable:", error.message));
};

export const addNoticeToDB = async (notice: Partial<Notice>) => {
  await addDoc(collection(db, "notices"), { ...notice, timestamp: Date.now() });
};

export const deleteNoticeFromDB = async (id: string) => {
  await deleteDoc(doc(db, "notices", id));
};

// --- TELEGRAM/MANUAL FEED ---
export interface TelegramPost {
  id: string;
  title: string;
  url: string;
  type: 'youtube' | 'video' | 'pdf' | 'text' | 'telegram' | 'embed';
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
  await updateDoc(doc(db, "telegram_feed", postId), { isIngested: true });
};

// --- COURSES ---
export const subscribeToCourses = (callback: (courses: Course[]) => void) => {
  return onSnapshot(collection(db, "courses"), (snapshot) => {
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

// --- USER & PROGRESS ---
export const registerOrUpdateStudent = async (email: string, name: string) => {
  const id = email.replace(/\./g, '_');
  const docRef = doc(db, "students", id);
  const snap = await getDoc(docRef);
  
  const data = {
    id, name, email,
    lastActive: Date.now(),
    joinedAt: snap.exists() ? snap.data().joinedAt : Date.now(),
    enrolledBatches: snap.exists() ? snap.data().enrolledBatches || [] : []
  };
  
  await setDoc(docRef, data, { merge: true });
  return data;
};

export const subscribeToStudents = (callback: (students: Student[]) => void) => {
  return onSnapshot(collection(db, "students"), (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data() as Student));
  });
};

export const markLectureComplete = async (userId: string, courseId: string, lectureId: string) => {
  const id = `${userId}_${lectureId}`;
  await setDoc(doc(db, "progress", id), {
    userId, courseId, lectureId, completedAt: Date.now()
  });
};

// Fix: Import 'where' from 'firebase/firestore' to allow filtering progress by userId
export const subscribeToUserProgress = (userId: string, callback: (progress: LectureProgress[]) => void) => {
  const q = query(collection(db, "progress"), where("userId", "==", userId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data() as LectureProgress));
  });
};

export const subscribeToAllProgress = (callback: (progress: LectureProgress[]) => void) => {
  return onSnapshot(collection(db, "progress"), (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data() as LectureProgress));
  });
};

// --- STAFF ---
export const subscribeToStaff = (callback: (staff: StaffMember[]) => void) => {
  return onSnapshot(collection(db, "staff"), (snapshot) => {
    const staffData = snapshot.docs.map(doc => doc.data() as StaffMember);
    const primaryAdmin = { 
      id: 's1', name: 'Primary Admin', email: 'r29878448@gmail.com', role: 'admin' as const, joinedAt: '01/01/2024'
    };
    callback([primaryAdmin, ...staffData.filter(s => s.email !== primaryAdmin.email)]);
  });
};

export const addStaffToDB = async (staff: StaffMember) => {
  await setDoc(doc(db, "staff", staff.id), staff);
};

// --- SETTINGS ---
export const getSiteSettings = async (): Promise<SiteSettings | null> => {
  const docSnap = await getDoc(doc(db, "settings", "config"));
  return docSnap.exists() ? docSnap.data() as SiteSettings : null;
};

export const saveSiteSettings = async (settings: SiteSettings) => {
  await setDoc(doc(db, "settings", "config"), settings);
};

export const subscribeToBanners = (callback: (banners: Banner[]) => void) => {
  return onSnapshot(collection(db, "banners"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Banner)));
  });
};
