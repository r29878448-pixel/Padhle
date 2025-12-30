
import { Course, ScheduleEvent, TestSeries } from './types';

export const COURSES: Course[] = [
  {
    id: 'lakshya-jee-2025',
    title: 'Lakshya JEE 2025: Grade 12th PCM',
    description: 'Comprehensive batch for JEE Mains & Advanced 2025. Includes live lectures, daily practice papers (DPP), and personalized doubt clearing sessions.',
    instructor: 'PW Star Faculty',
    price: 4500,
    originalPrice: 12000,
    rating: 4.9,
    students: 45000,
    category: 'JEE',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1000',
    subjects: [
      {
        id: 'phy-12',
        title: 'Physics',
        color: 'blue',
        chapters: [
          {
            id: 'ch-electrostatics',
            title: 'Electrostatics',
            lectures: [
              {
                id: 'lec-e1',
                title: 'L-01 | Coulomb\'s Law & Electric Field',
                videoUrl: 'https://www.youtube.com/watch?v=7u3S-9o047M',
                duration: '1:15:20',
                description: 'Fundamentals of electric charges and the principle of superposition.',
                resources: [
                  { id: 'notes-e1', title: 'Class Notes - L01', url: '#', type: 'pdf' },
                  { id: 'dpp-e1', title: 'DPP-01 (Daily Practice)', url: '#', type: 'dpp' }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'udaan-class-10',
    title: 'Udaan 2025: Class 10th Full Year',
    description: 'Complete syllabus for Class 10th Boards with special focus on Science, Maths, and SST.',
    instructor: 'Team Udaan',
    price: 2100,
    originalPrice: 5000,
    rating: 4.8,
    students: 85000,
    category: 'Class 10th',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000',
    subjects: []
  }
];

export const DAILY_SCHEDULE: ScheduleEvent[] = [
  { id: '1', title: 'Live Lecture: Optics', time: '10:00 AM', subject: 'Physics', type: 'Live' },
  { id: '2', title: 'Weekly Test: Periodic Table', time: '02:00 PM', subject: 'Chemistry', type: 'Test' },
  { id: '3', title: 'Doubt Clearing Session', time: '05:30 PM', subject: 'Mathematics', type: 'Doubt' }
];

export const TEST_SERIES: TestSeries[] = [
  { id: 't1', title: 'JEE Main Full Mock Test 01', subject: 'PCM', duration: '180 mins', questions: 90, status: 'Live' },
  { id: 't2', title: 'Physics Chapter Test: Heat', subject: 'Physics', duration: '45 mins', questions: 25, status: 'Upcoming' }
];
