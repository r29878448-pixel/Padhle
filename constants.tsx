
import { Course, ScheduleEvent, TestSeries } from './types';

export const COURSES: Course[] = [
  {
    id: 'jee-ultimate-2025',
    title: 'JEE Ultimate 2025: Alpha Ranker Batch',
    description: 'The definitive course for JEE Mains & Advanced 2025. Comprehensive coverage with 4K recorded lectures and daily live doubt sessions.',
    instructor: 'Dr. V.K. Sharma & Team',
    price: 4999,
    originalPrice: 15000,
    rating: 5.0,
    students: 142000,
    category: 'JEE',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200',
    subjects: [
      {
        id: 'jee-phy-master',
        title: 'Physics',
        chapters: [
          {
            id: 'phy-ch-electro',
            title: 'Electrostatics & Gauss Law',
            lectures: [
              {
                id: 'l-phy-01',
                title: 'L-01 | Properties of Charges & Coulomb\'s Law',
                videoUrl: 'https://www.youtube.com/watch?v=7u3S-9o047M',
                duration: '1:55:00',
                thumbnail: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&q=60&w=600',
                description: 'Deep dive into electric charge quantization and force calculation.',
                resources: [
                  { id: 'res-1', title: 'Lecture Notes PDF', url: '#', type: 'pdf' },
                  { id: 'res-2', title: 'DPP-01 Practice Sheet', url: '#', type: 'dpp' }
                ]
              },
              {
                id: 'l-phy-live',
                title: 'LIVE | Electric Field Intensity & Problem Solving',
                videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                duration: 'LIVE',
                thumbnail: 'https://images.unsplash.com/photo-1636466484294-3407604f51e0?auto=format&fit=crop&q=60&w=600',
                description: 'Interactive session solving previous year JEE Advanced problems.',
                resources: []
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'neet-conquer-2025',
    title: 'NEET Conquer 2025: Biology Intensive',
    description: 'Master every line of NCERT with our specialized NEET batch. Features diagram-based learning and weekly mock tests.',
    instructor: 'Prof. Anjali Mehta',
    price: 3500,
    originalPrice: 9999,
    rating: 4.9,
    students: 98000,
    category: 'NEET',
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=1200',
    subjects: [
      {
        id: 'neet-bio-core',
        title: 'Biology',
        chapters: [
          {
            id: 'bio-ch-cell',
            title: 'Cell: The Unit of Life',
            lectures: [
              {
                id: 'l-bio-01',
                title: 'L-01 | Cell Theory & Prokaryotic Cells',
                videoUrl: 'https://www.youtube.com/watch?v=7u3S-9o047M',
                duration: '1:40:00',
                thumbnail: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=60&w=600',
                description: 'Complete breakdown of cell fundamentals according to latest NCERT.',
                resources: [{ id: 'res-b1', title: 'NCERT Highlighted PDF', url: '#', type: 'pdf' }]
              }
            ]
          }
        ]
      }
    ]
  }
];

export const DAILY_SCHEDULE: ScheduleEvent[] = [
  { id: '1', title: 'Physics: Gauss Law', time: '09:00 AM', subject: 'JEE 2025', type: 'Live' }
];

export const TEST_SERIES: TestSeries[] = [
  { id: 't1', title: 'AITS - Mock Test 05', subject: 'JEE Mains', duration: '180m', questions: 90, status: 'Live' }
];
