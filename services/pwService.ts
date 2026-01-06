
import { Course, Subject, Chapter, Lecture, Resource } from '../types';

const BASE_URL = 'https://api.penpencil.co';

export const fetchPWData = async (token: string, endpoint: string) => {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(BASE_URL + endpoint)}`;
  const response = await fetch(proxyUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'client-type': 'WEB',
      'origin': 'https://www.pw.live',
      'referer': 'https://www.pw.live/'
    }
  });
  if (!response.ok) throw new Error(`PW API Error: ${response.status}`);
  return response.json();
};

export const syncPWBatch = async (token: string, batchId: string): Promise<Course> => {
  // 1. Fetch Batch Info
  const batchInfo = await fetchPWData(token, `/v2/batches/info/${batchId}`);
  const data = batchInfo.data;

  // 2. Fetch Subjects
  const subjectsData = await fetchPWData(token, `/v2/batches/my-batches/${batchId}/details`);
  
  const subjects: Subject[] = await Promise.all(subjectsData.data.subjects.map(async (sub: any) => {
    // 3. Fetch Lectures for each Subject
    const lecturesData = await fetchPWData(token, `/v2/lectures/batch-subject/${batchId}/${sub._id}?page=1`);
    
    // Group lectures by topic/chapter if possible, or create a default "Main Module"
    const lectures: Lecture[] = lecturesData.data.map((lec: any) => ({
      id: lec._id,
      title: lec.name,
      videoUrl: lec.url || (lec.videoResources?.[0]?.resourceId ? `https://vimeo.com/${lec.videoResources[0].resourceId}` : ''),
      thumbnail: lec.image || data.image,
      duration: lec.duration || (lec.isLive ? 'LIVE' : 'Recording'),
      description: lec.topic || 'Academic session.',
      resources: (lec.notes || []).map((n: any): Resource => ({
        id: n._id,
        title: n.name,
        url: n.baseUrl + n.key,
        type: 'pdf'
      }))
    }));

    const chapter: Chapter = {
      id: `chap-${sub._id}`,
      title: "All Lectures",
      lectures
    };

    return {
      id: sub._id,
      title: sub.subject,
      chapters: [chapter]
    };
  }));

  return {
    id: data._id,
    title: data.name,
    description: data.description || "Imported from PW.",
    instructor: data.faculty?.[0]?.name || "PW Faculty",
    price: data.price || 0,
    rating: 4.9,
    students: data.studentsCount || 5000,
    image: data.image,
    category: "JEE/NEET", // Default or detect from title
    subjects
  };
};
