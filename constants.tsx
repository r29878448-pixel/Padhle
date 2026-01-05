
import { Course, ScheduleEvent, TestSeries } from './types';

export const COURSES: Course[] = [
  {
    id: 'delta-jee-2025',
    title: 'Delta JEE 2025: Ultimate Ranker Batch',
    description: 'The most comprehensive course for JEE Mains & Advanced 2025. Covers Physics, Chemistry, and Maths with 500+ hours of content and daily DPPs.',
    instructor: 'Team Delta Legends',
    price: 4500,
    originalPrice: 12000,
    rating: 5.0,
    students: 85000,
    category: 'JEE',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1000',
    subjects: [
      {
        id: 'delta-jee-phy',
        title: 'Physics',
        chapters: [
          {
            id: 'jee-phy-ch1',
            title: 'Electrostatics & Gauss Law',
            lectures: [
              {
                id: 'jee-l-live',
                title: 'LIVE | Advanced Problem Solving - Gauss Law',
                videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                duration: 'LIVE',
                description: 'Solving IIT-JEE Advanced level problems live with students.',
                resources: [
                  { id: 'res-n1', title: 'Electrostatics Class Notes', url: '#', type: 'pdf' },
                  { id: 'res-d1', title: 'DPP-01: Gauss Law Applications', url: '#', type: 'dpp' }
                ]
              },
              {
                id: 'jee-l1',
                title: 'L-01 | Introduction to Electric Charges',
                videoUrl: 'https://www.youtube.com/watch?v=7u3S-9o047M',
                duration: '1:45:00',
                description: 'Fundamental concepts of charge and Coulomb\'s law.',
                resources: [{ id: 'res-n2', title: 'Summary Sheet', url: '#', type: 'pdf' }]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'class-10-boards-2025',
    title: 'Top 1% Batch: Class 10th Board Exam',
    description: 'Designed for students aiming for 98%+ in Board Exams. Full coverage of NCERT and Exemplar with weekly tests.',
    instructor: 'Delta Board Experts',
    price: 1500,
    originalPrice: 4999,
    rating: 4.9,
    students: 25000,
    category: 'Class 10th',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1000',
    subjects: [
      {
        id: 'c10-maths',
        title: 'Mathematics',
        chapters: [
          {
            id: 'c10-m-ch1',
            title: 'Real Numbers & Polynomials',
            lectures: [
              {
                id: 'c10-l1',
                title: 'L-01 | Real Numbers One-Shot',
                videoUrl: 'https://www.youtube.com/watch?v=7u3S-9o047M',
                duration: '2:30:00',
                description: 'Complete revision of Real Numbers in one go.',
                resources: [
                  { id: 'res-m1', title: 'Quick Revision Notes', url: '#', type: 'pdf' },
                  { id: 'res-m2', title: 'NCERT Important Questions', url: '#', type: 'pdf' }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'neet-conqueror-2025',
    title: 'NEET Conqueror: Biology Focused Batch',
    description: 'Expert NEET guidance with heavy focus on NCERT Biology lines and Physics numerical techniques.',
    instructor: 'Dr. Delta Specialist',
    price: 3200,
    originalPrice: 8500,
    rating: 4.8,
    students: 62000,
    category: 'NEET',
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=1000',
    subjects: [
      {
        id: 'neet-bio',
        title: 'Biology',
        chapters: [
          {
            id: 'neet-b-ch1',
            title: 'Cell: The Unit of Life',
            lectures: [
              {
                id: 'neet-l1',
                title: 'L-01 | Cell Structure & Functions',
                videoUrl: 'https://www.youtube.com/watch?v=7u3S-9o047M',
                duration: '1:55:00',
                description: 'Deep dive into cell organelles and their functions.',
                resources: [{ id: 'res-b1', title: 'Cell Diagrams PDF', url: '#', type: 'pdf' }]
              }
            ]
          }
        ]
      }
    ]
  }
];

export const DAILY_SCHEDULE: ScheduleEvent[] = [
  { id: '1', title: 'Live: Electrostatics L-05', time: '09:00 AM', subject: 'Physics', type: 'Live' }
];

export const TEST_SERIES: TestSeries[] = [
  { id: 't1', title: 'AITS Full Syllabus 01', subject: 'JEE Mains', duration: '180m', questions: 90, status: 'Live' }
];
