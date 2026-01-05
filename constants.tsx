
import { Course, ScheduleEvent, TestSeries } from './types';

export const COURSES: Course[] = [
  {
    id: 'project-45-class-10',
    title: 'Project 45: Class 10th Board Power Batch',
    description: 'A 45-day intensive revision program designed to help Class 10 students ace their Board Exams with 95%+ scores. Includes live daily practice sessions.',
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
            title: 'Light & Optics',
            lectures: [
              {
                id: 'p45-l-live',
                title: 'LIVE | Numericals on Lens Formula',
                videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                duration: 'LIVE',
                description: 'Join the live interactive session to solve complex lens numericals for boards.',
                resources: [
                  { id: 'res1', title: 'Session Notes PDF', url: '#', type: 'pdf' },
                  { id: 'res2', title: 'Lens Formula Sheet', url: '#', type: 'pdf' }
                ]
              },
              {
                id: 'p45-l1',
                title: 'L-01 | Reflection & Refraction One-Shot',
                videoUrl: 'https://www.youtube.com/watch?v=7u3S-9o047M',
                duration: '2:15:00',
                description: 'Complete revision of Light chapter for Board Exams.',
                resources: [
                  { id: 'res3', title: 'Chapter Summary', url: '#', type: 'pdf' },
                  { id: 'res4', title: 'DPP-01 Light', url: '#', type: 'dpp' }
                ]
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
    category: 'JEE',
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
                resources: [{ id: 'res5', title: 'Dimensions Table', url: '#', type: 'pdf' }]
              }
            ]
          }
        ]
      }
    ]
  }
];

export const DAILY_SCHEDULE: ScheduleEvent[] = [
  { id: '1', title: 'Live: Kinematics L-04', time: '10:00 AM', subject: 'Physics', type: 'Live' }
];

export const TEST_SERIES: TestSeries[] = [
  { id: 't1', title: 'AITS: Full Syllabus Test 01', subject: 'JEE Mains', duration: '180 mins', questions: 90, status: 'Live' }
];
