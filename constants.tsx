
import { Course, ScheduleEvent, TestSeries } from './types';

export const COURSES: Course[] = [
  {
    id: 'class-10-project-45',
    title: 'Class 10th PROJECT 45',
    description: 'High-speed revision batch for Class 10th boards. Synced with Delta Study v2 engine.',
    instructor: 'Delta Faculty Team',
    price: 0,
    rating: 5.0,
    students: 15000,
    category: 'Class 10th',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200',
    subjects: [],
    shortLink: 'https://deltastudy.site/study-v2/batches/67be1ea9e92878bc16923fe8?name=Class%2010th%20PROJECT%2045'
  }
];

export const DAILY_SCHEDULE: ScheduleEvent[] = [
  { id: '1', title: 'Mathematics: Trigonometry', time: '10:00 AM', subject: 'Class 10th', type: 'Live' }
];

export const TEST_SERIES: TestSeries[] = [
  { id: 't1', title: 'Board Mock 01', subject: 'Science', duration: '180m', questions: 80, status: 'Upcoming' }
];
