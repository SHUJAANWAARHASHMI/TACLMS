import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { 
  User, ClassRoom, Subject, Chapter, Note, Video, AccessGrant, 
  Announcement, Quiz, QuizAttempt, Assignment, AssignmentSubmission, 
  Bookmark, Progress, AuditLog, Attendance, UserCredential 
} from '../src/types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hxqmadzterpmdbveameg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_i2lv3uegeMxQn4Sk5AKj4w_yFMcUpc_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export let supabaseStatus = {
  connected: false,
  lastSync: null as string | null,
  error: null as string | null,
  tableChecked: false,
};

const DB_PATH = path.join(process.cwd(), 'db.json');

export interface DBStructure {
  users: User[];
  userCredentials: UserCredential[];
  classes: ClassRoom[];
  subjects: Subject[];
  chapters: Chapter[];
  notes: Note[];
  videos: Video[];
  accessGrants: AccessGrant[];
  announcements: Announcement[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  bookmarks: Bookmark[];
  progress: Progress[];
  auditLogs: AuditLog[];
  attendance: Attendance[];
}

const emptyDB: DBStructure = {
  users: [],
  userCredentials: [],
  classes: [],
  subjects: [],
  chapters: [],
  notes: [],
  videos: [],
  accessGrants: [],
  announcements: [],
  quizzes: [],
  quizAttempts: [],
  assignments: [],
  submissions: [],
  bookmarks: [],
  progress: [],
  auditLogs: [],
  attendance: []
};

export async function saveToSupabase(data: DBStructure) {
  try {
    const { error } = await supabase
      .from('lms_state')
      .upsert({
        key: 'taclms_database',
        value: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (error) {
      console.error('Failed to save state to Supabase:', error.message);
      if (error.message.toLowerCase().includes('row-level security') || error.message.toLowerCase().includes('rls')) {
        supabaseStatus.error = `Failed to write: ${error.message}\n\n💡 FIX: Please run this command in your Supabase SQL Editor to disable Row Level Security on the lms_state table:\n\nALTER TABLE lms_state DISABLE ROW LEVEL SECURITY;`;
      } else {
        supabaseStatus.error = `Failed to write: ${error.message}`;
      }
    } else {
      console.log('Successfully pushed database state to Supabase!');
      supabaseStatus.connected = true;
      supabaseStatus.lastSync = new Date().toISOString();
      supabaseStatus.error = null;
    }
  } catch (err: any) {
    console.error('Error writing to Supabase:', err);
    supabaseStatus.error = err.message || 'Unknown write error';
  }
}

export async function syncWithSupabase() {
  try {
    const { data, error } = await supabase
      .from('lms_state')
      .select('*')
      .eq('key', 'taclms_database')
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
        console.log('lms_state table found, but taclms_database key is missing. Initializing in Supabase...');
        const currentDB = getDB();
        await saveToSupabase(currentDB);
        supabaseStatus.connected = true;
        supabaseStatus.lastSync = new Date().toISOString();
        supabaseStatus.error = null;
        supabaseStatus.tableChecked = true;
      } else {
        console.warn('Could not read from Supabase (is table "lms_state" created yet?):', error.message);
        supabaseStatus.connected = false;
        
        const isRlsError = error.message.toLowerCase().includes('row-level security') || error.message.toLowerCase().includes('rls');
        if (isRlsError) {
          supabaseStatus.error = `Row-Level Security (RLS) is blocking access to 'lms_state'. Please run this SQL in your Supabase SQL Editor to disable it:\n\nALTER TABLE lms_state DISABLE ROW LEVEL SECURITY;`;
        } else {
          supabaseStatus.error = `Table 'lms_state' not found or inaccessible. Please run this SQL in your Supabase SQL Editor:\n\nCREATE TABLE lms_state (\n  key TEXT PRIMARY KEY,\n  value JSONB NOT NULL,\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc\'::text, now()) NOT NULL\n);\n\nALTER TABLE lms_state DISABLE ROW LEVEL SECURITY;`;
        }
        supabaseStatus.tableChecked = true;
      }
      return;
    }

    if (data && data.value) {
      console.log('Successfully loaded database state from Supabase!');
      fs.writeFileSync(DB_PATH, JSON.stringify(data.value, null, 2), 'utf-8');
      supabaseStatus.connected = true;
      supabaseStatus.lastSync = new Date().toISOString();
      supabaseStatus.error = null;
      supabaseStatus.tableChecked = true;
    }
  } catch (err: any) {
    console.error('Supabase synchronization error:', err);
    supabaseStatus.connected = false;
    supabaseStatus.error = err.message || 'Unknown network error';
    supabaseStatus.tableChecked = true;
  }
}

export function getDB(): DBStructure {
  if (!fs.existsSync(DB_PATH)) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(emptyDB, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing emptyDB to file', e);
    }
    seedDB();
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, returning empty', err);
    return emptyDB;
  }
}

export function saveDB(data: DBStructure) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    saveToSupabase(data).catch(err => {
      console.error('Async Supabase save error:', err);
    });
  } catch (err) {
    console.error('Error saving db.json', err);
  }
}

export function seedDB() {
  const db = emptyDB;

  // 1. Create Super Admin
  const adminUser: User = {
    id: 'admin-1',
    email: 'admin@taclms.edu',
    name: 'Professor Ali',
    grNumber: 'ADMIN-01',
    role: 'admin',
    status: 'active',
    xp: 0,
    level: 1,
    assignedClasses: [],
    createdAt: new Date().toISOString()
  };

  // 2. Create Student
  const studentUser: User = {
    id: 'student-1',
    email: 'student@taclms.edu',
    name: 'Hamza Noman',
    grNumber: 'GR-101',
    role: 'student',
    status: 'active',
    xp: 120,
    level: 2,
    assignedClasses: ['class-1', 'class-3'],
    createdAt: new Date().toISOString()
  };

  // 3. Classes
  const classesList: ClassRoom[] = [
    { id: 'class-1', name: '9th Grade', description: 'Secondary High School Education (Syllabus 2026)' },
    { id: 'class-2', name: '10th Grade', description: 'Secondary Board Preparation Class' },
    { id: 'class-3', name: 'BSCS 3rd Semester', description: 'Bachelor of Science in Computer Science - Batch 2025' }
  ];

  // 4. Subjects
  const subjectsList: Subject[] = [
    { id: 'subject-1', classId: 'class-1', name: 'Physics' },
    { id: 'subject-2', classId: 'class-1', name: 'Chemistry' },
    { id: 'subject-3', classId: 'class-3', name: 'Data Structures & Algorithms' },
    { id: 'subject-4', classId: 'class-3', name: 'Software Engineering' }
  ];

  // 5. Chapters
  const chaptersList: Chapter[] = [
    { id: 'chap-1', subjectId: 'subject-1', title: 'Chapter 1: Kinematics & Motion', order: 1 },
    { id: 'chap-2', subjectId: 'subject-1', title: 'Chapter 2: Dynamics & Forces', order: 2 },
    { id: 'chap-3', subjectId: 'subject-3', title: 'Chapter 1: Dynamic Arrays & Linked Lists', order: 1 },
    { id: 'chap-4', subjectId: 'subject-3', title: 'Chapter 2: Stacks, Queues & Recursion', order: 2 }
  ];

  // 6. Notes (stored files paths are simulated or seeded in server uploads dir)
  const notesList: Note[] = [
    {
      id: 'note-1',
      chapterId: 'chap-1',
      title: 'Kinematics Formulas Cheat Sheet',
      fileUrl: '/uploads/kinematics_cheat_sheet.pdf',
      originalName: 'kinematics_formulas.pdf',
      fileType: 'application/pdf',
      size: 245000,
      tags: ['Important', 'Exam Focus'],
      downloadAllowed: true,
      viewOnly: false,
      versions: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'note-2',
      chapterId: 'chap-1',
      title: 'Equations of Motion Solved Numerical Problems',
      fileUrl: '/uploads/equations_solved.pdf',
      originalName: 'solved_numericals.pdf',
      fileType: 'application/pdf',
      size: 1540000,
      tags: ['Solved Notes', 'Past Paper'],
      downloadAllowed: false, // Students cannot download this
      viewOnly: true, // Only viewable in app
      versions: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'note-3',
      chapterId: 'chap-3',
      title: 'Linked List implementation in TypeScript',
      fileUrl: '/uploads/linked_lists.pdf',
      originalName: 'linked_list_notes.pdf',
      fileType: 'application/pdf',
      size: 412000,
      tags: ['Solved Notes'],
      downloadAllowed: true,
      viewOnly: false,
      versions: [],
      createdAt: new Date().toISOString()
    }
  ];

  // 7. Videos
  const videosList: Video[] = [
    {
      id: 'vid-1',
      chapterId: 'chap-1',
      title: 'Introduction to Kinematics - Rectilinear Motion',
      url: 'https://www.youtube.com/watch?v=KzXgZf8eLQA',
      youtubeId: 'KzXgZf8eLQA',
      thumbnailUrl: 'https://img.youtube.com/vi/KzXgZf8eLQA/hqdefault.jpg',
      isEmbeddable: true,
      description: 'An elementary introduction to distance, displacement, speed, velocity, and uniform acceleration with visual graphics.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'vid-2',
      chapterId: 'chap-3',
      title: 'Data Structures Easy to Advanced Course - Linked Lists',
      url: 'https://www.youtube.com/watch?v=R9_Qk4vFjKk',
      youtubeId: 'R9_Qk4vFjKk',
      thumbnailUrl: 'https://img.youtube.com/vi/R9_Qk4vFjKk/hqdefault.jpg',
      isEmbeddable: true,
      description: 'Complete linked list explanation including Node insertion, deletion, and traversal algorithms in memory.',
      createdAt: new Date().toISOString()
    }
  ];

  // 8. Access Grants (Admin grants student access explicitly)
  const accessGrantsList: AccessGrant[] = [
    { id: 'grant-1', studentId: 'student-1', scope: 'class', targetId: 'class-1' },
    { id: 'grant-2', studentId: 'student-1', scope: 'class', targetId: 'class-3' },
    { id: 'grant-3', studentId: 'student-1', scope: 'subject', targetId: 'subject-1' },
    { id: 'grant-4', studentId: 'student-1', scope: 'subject', targetId: 'subject-3' }
  ];

  // 9. Announcements
  const announcementsList: Announcement[] = [
    {
      id: 'ann-1',
      title: 'Welcome to The Ali Collegates LMS (TACLMS)',
      body: 'Welcome students and teachers! This portal will house your class notes, recorded video lectures, assignments, and mini-quizzes. Ensure your GR number is accurate and report any subject access discrepancies directly to Prof. Ali.',
      createdAt: new Date().toISOString(),
      authorName: 'Professor Ali'
    },
    {
      id: 'ann-2',
      title: 'Weekly Attendance and Quiz Reminders',
      body: 'Starting this week, quizzes will be posted for each chapter. Completing notes and scoring high on quizzes will grant you XP to level up. Keep tracking your progress bar!',
      createdAt: new Date().toISOString(),
      authorName: 'Professor Ali'
    }
  ];

  // 10. Quizzes
  const quizzesList: Quiz[] = [
    {
      id: 'quiz-1',
      chapterId: 'chap-1',
      title: 'Kinematics Fundamental MCQ Quiz',
      description: 'Quick check of distance, velocity, acceleration, and equations of motion.',
      timeLimit: 5,
      xpReward: 50,
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: 1,
          question: 'What is the rate of change of displacement called?',
          options: [{ text: 'Speed' }, { text: 'Acceleration' }, { text: 'Velocity' }, { text: 'Force' }],
          correctOptionIndex: 2,
          explanation: 'Velocity is defined as displacement per unit time.'
        },
        {
          id: 2,
          question: 'If a body starts from rest, its initial velocity (u) is:',
          options: [{ text: '0 m/s' }, { text: '9.8 m/s' }, { text: 'Infinite' }, { text: 'Cannot be determined' }],
          correctOptionIndex: 0,
          explanation: 'Rest implies velocity is zero at the start.'
        },
        {
          id: 3,
          question: 'Which of the following is a scalar quantity?',
          options: [{ text: 'Displacement' }, { text: 'Acceleration' }, { text: 'Force' }, { text: 'Speed' }],
          correctOptionIndex: 3,
          explanation: 'Speed only has magnitude, while displacement, acceleration, and force have both magnitude and direction.'
        }
      ]
    }
  ];

  // 11. Assignments
  const assignmentsList: Assignment[] = [
    {
      id: 'assign-1',
      chapterId: 'chap-1',
      title: 'Kinematics Practical Problem Sheet',
      description: 'Solve the attached problems in the notes and upload your handwritten solution as a PDF/image.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      xpReward: 100,
      createdAt: new Date().toISOString()
    }
  ];

  // Populate Database
  db.users = [adminUser, studentUser];
  db.userCredentials = [
    {
      id: 'cred-1',
      userId: 'admin-1',
      email: 'admin@taclms.edu',
      passwordText: 'admin123',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cred-2',
      userId: 'student-1',
      email: 'student@taclms.edu',
      passwordText: 'student123',
      updatedAt: new Date().toISOString()
    }
  ];
  db.classes = classesList;
  db.subjects = subjectsList;
  db.chapters = chaptersList;
  db.notes = notesList;
  db.videos = videosList;
  db.accessGrants = accessGrantsList;
  db.announcements = announcementsList;
  db.quizzes = quizzesList;
  db.assignments = assignmentsList;

  // Initialize other tables as empty
  db.quizAttempts = [];
  db.submissions = [];
  db.bookmarks = [];
  db.progress = [];
  db.auditLogs = [
    {
      id: 'log-1',
      actorId: 'admin-1',
      actorName: 'Professor Ali',
      actorRole: 'admin',
      action: 'Initialize LMS System',
      target: 'TACLMS Platform',
      timestamp: new Date().toISOString()
    }
  ];
  db.attendance = [
    { id: 'att-1', date: new Date().toISOString().split('T')[0], studentId: 'student-1', status: 'present' }
  ];

  saveDB(db);

  // Ensure uploads directory exists and put a dummy text file to act as the pdf seed
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  // Create dummy files for seeds
  fs.writeFileSync(path.join(uploadsDir, 'kinematics_cheat_sheet.pdf'), 'DUMMY PDF CONTENT: Kinematics Cheat Sheet');
  fs.writeFileSync(path.join(uploadsDir, 'equations_solved.pdf'), 'DUMMY PDF CONTENT: Equations of Motion Solved Numericals');
  fs.writeFileSync(path.join(uploadsDir, 'linked_lists.pdf'), 'DUMMY PDF CONTENT: Linked Lists TypeScript Implementation');
}
