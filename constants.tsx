
import { Course } from './types';

export const COURSES: Course[] = [
  {
    id: 'batch-project-45-class-10',
    title: 'Project 45: Class 10th Board Mastery',
    description: 'A dedicated 45-day intensive crash course covering the entire Class 10 syllabus with top faculty, daily practice papers, and AI-driven doubt support.',
    instructor: 'Team Study Portal',
    price: 999,
    rating: 4.9,
    students: 12500,
    category: 'Class 10th',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000',
    subjects: [
      {
        id: 'sub-physics-10',
        title: 'Physics',
        chapters: [
          {
            id: 'ch-light-10',
            title: 'Light - Reflection and Refraction',
            lectures: [
              {
                id: 'lec-light-01',
                title: 'L-01 | Spherical Mirrors & Reflection Laws',
                videoUrl: 'https://www.youtube.com/watch?v=7u3S-9o047M',
                duration: '45:20',
                description: 'Detailed explanation of concave and convex mirrors, sign conventions, and mirror formula derivation.',
                resources: [
                  { id: 'res-pdf-01', title: 'Mirror Formula Notes', url: '#', type: 'pdf' },
                  { id: 'res-pdf-02', title: 'DPP - 01 (Reflection)', url: '#', type: 'pdf' }
                ]
              },
              {
                id: 'lec-light-02',
                title: 'L-02 | Refraction through Glass Prism',
                videoUrl: 'https://www.youtube.com/watch?v=XWp_OQz_f_M',
                duration: '38:15',
                description: 'Understanding Snell\'s Law, refractive index, and lateral displacement.',
                resources: [
                  { id: 'res-pdf-03', title: 'Refraction Class Notes', url: '#', type: 'pdf' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'sub-chem-10',
        title: 'Chemistry',
        chapters: [
          {
            id: 'ch-chemical-reactions',
            title: 'Chemical Reactions and Equations',
            lectures: [
              {
                id: 'lec-chem-01',
                title: 'L-01 | Types of Chemical Reactions',
                videoUrl: 'https://www.youtube.com/watch?v=gS8N86-H58U',
                duration: '52:10',
                description: 'Combination, Decomposition, Displacement, and Redox reactions explained with experiments.',
                resources: []
              }
            ]
          }
        ]
      }
    ]
  }
];
