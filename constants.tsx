
import { Course, ScheduleEvent, TestSeries } from './types';

export const COURSES: Course[] = [
  {
    id: 'project-45-class-10',
    title: 'Project 45: Class 10th Board Power Batch',
    description: 'A 45-day intensive revision program designed to help Class 10 students ace their Board Exams with 95%+ scores.',
    instructor: 'PW Star Faculty',
    price: 999,
    originalPrice: 2499,
    rating: 4.9,
    students: 45000,
    category: 'Class 10th',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1000',
    subjects: [
      {
        id: 'p45-phy',
        title: 'Physics',
        chapters: [
          {
            id: 'p45-ch1',
            title: 'Light - Reflection & Refraction',
            lectures: [
              {
                id: 'p45-l1',
                title: 'L-01 | Full Chapter One-Shot',
                videoUrl: 'https://www.youtube.com/watch?v=7u3S-9o047M',
                duration: '2:15:00',
                description: 'Complete revision of Light chapter for Board Exams.',
                resources: []
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'arjuna-jee-2026',
    title: 'Arjuna JEE 2026: Class 11th PCM',
    description: 'The ultimate foundation batch for JEE Mains & Advanced 2026. Includes comprehensive coverage of Class 11th Physics, Chemistry, and Maths.',
    instructor: 'PW Legend Faculty',
    price: 4200,
    originalPrice: 10000,
    rating: 4.9,
    students: 120000,
    category: 'Class 11th',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1000',
    subjects: [
      {
        id: 'phy-11',
        title: 'Physics',
        chapters: [
          {
            id: 'ch-units',
            title: 'Units and Measurements',
            lectures: [
              {
                id: 'lec-u1',
                title: 'L-01 | Dimensional Analysis',
                videoUrl: 'https://www.youtube.com/watch?v=7u3S-9o047M',
                duration: '1:45:00',
                description: 'Introduction to dimensions and their applications.',
                resources: []
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'lakshya-neet-2025',
    title: 'Lakshya NEET 2025: Class 12th PCB',
    description: 'Intensive preparation batch for NEET 2025. Covering full Class 12th syllabus with special focus on MCQ speed and accuracy.',
    instructor: 'Expert NEET Faculty',
    price: 3800,
    originalPrice: 9000,
    rating: 4.8,
    students: 95000,
    category: 'Class 12th',
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=1000',
    subjects: []
  },
  {
    id: 'udaan-class-10-2025',
    title: 'Udaan 2025: Class 10th Boards',
    description: 'Complete year-long batch for Class 10th Board Exams. Subjects covered: Science, Maths, SST, English, and Hindi.',
    instructor: 'Team Udaan',
    price: 1800,
    originalPrice: 4000,
    rating: 4.9,
    students: 150000,
    category: 'Class 10th',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000',
    subjects: []
  },
  {
    id: 'neev-class-9-2025',
    title: 'Neev 2025: Class 9th Full Year',
    description: 'Building a strong foundation for Class 9th students to excel in school and future competitive exams.',
    instructor: 'Team Neev',
    price: 1500,
    originalPrice: 3500,
    rating: 4.7,
    students: 60000,
    category: 'Class 9th',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1000',
    subjects: []
  }
];

export const DAILY_SCHEDULE: ScheduleEvent[] = [
  { id: '1', title: 'Live: Kinematics L-04', time: '10:00 AM', subject: 'Physics', type: 'Live' },
  { id: '2', title: 'Periodic Table Test', time: '04:00 PM', subject: 'Chemistry', type: 'Test' }
];

export const TEST_SERIES: TestSeries[] = [
  { id: 't1', title: 'AITS: Full Syllabus Test 01', subject: 'JEE Mains', duration: '180 mins', questions: 90, status: 'Live' }
];
