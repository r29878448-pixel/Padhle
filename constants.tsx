
import { Course, ScheduleEvent, TestSeries } from './types';

export const COURSES: Course[] = [
  {
    id: 'delta-jee-2025',
    title: 'Delta JEE 2025: Ultimate Ranker Batch',
    description: 'The absolute standard for JEE Mains & Advanced 2025 prep. In-depth concept building with Team Delta experts.',
    instructor: 'Delta Master Team',
    price: 4500,
    originalPrice: 12000,
    rating: 5.0,
    students: 125000,
    category: 'JEE',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200',
    subjects: [
      {
        id: 'jee-phy',
        title: 'Physics',
        chapters: [
          {
            id: 'jee-phy-ch1',
            title: 'Electrostatics & Field Theory',
            lectures: [
              {
                id: 'jee-l-live-01',
                title: 'LIVE | Advanced Electric Flux - Gauss Theorem',
                videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                duration: 'LIVE',
                description: 'Solving IIT-JEE Advanced level flux problems.',
                resources: [
                  { id: 'res-n1', title: 'Electrostatics Master Notes', url: '#', type: 'pdf' },
                  { id: 'res-d1', title: 'DPP-01: Flux & Gauss Law', url: '#', type: 'dpp' }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'class-12-boards-delta',
    title: 'Delta Boards: Class 12th Full Course',
    description: 'Complete syllabus coverage for CBSE & State Boards with high-quality revision notes.',
    instructor: 'Board Specialists',
    price: 2500,
    originalPrice: 5999,
    rating: 4.9,
    students: 45000,
    category: 'Class 12th',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200',
    subjects: [
      {
        id: 'c12-maths',
        title: 'Mathematics',
        chapters: [
          {
            id: 'c12-m-ch1',
            title: 'Calculus: Differentiation',
            lectures: [
              {
                id: 'c12-l1',
                title: 'L-01 | Continuity & Differentiability One-Shot',
                videoUrl: 'https://www.youtube.com/watch?v=7u3S-9o047M',
                duration: '3:15:00',
                description: 'Complete boards level revision of continuity.',
                resources: [{ id: 'res-m1', title: 'Calculus Board Notes', url: '#', type: 'pdf' }]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'neet-conqueror-delta',
    title: 'NEET Conqueror: Biology Core Batch',
    description: 'Specialized NEET preparation focusing on NCERT line-by-line Biology and logic-based Physics.',
    instructor: 'Delta Bio Faculty',
    price: 3200,
    originalPrice: 7999,
    rating: 4.8,
    students: 88000,
    category: 'NEET',
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=1200',
    subjects: [
      {
        id: 'neet-bio',
        title: 'Biology',
        chapters: [
          {
            id: 'neet-b-ch1',
            title: 'Genetics & Evolution',
            lectures: [
              {
                id: 'neet-l1',
                title: 'L-01 | Principles of Inheritance',
                videoUrl: 'https://www.youtube.com/watch?v=7u3S-9o047M',
                duration: '2:45:00',
                description: 'Understanding Mendelian genetics for NEET aspirants.',
                resources: [{ id: 'res-b1', title: 'Genetics Diagram Set', url: '#', type: 'pdf' }]
              }
            ]
          }
        ]
      }
    ]
  }
];

export const DAILY_SCHEDULE: ScheduleEvent[] = [
  { id: '1', title: 'Physics Advanced: Gauss Law', time: '10:00 AM', subject: 'Physics', type: 'Live' }
];

export const TEST_SERIES: TestSeries[] = [
  { id: 't1', title: 'Delta Mock Test 01', subject: 'JEE Mains', duration: '180m', questions: 90, status: 'Live' }
];
