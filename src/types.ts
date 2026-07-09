export type UserRole = 'admin' | 'student';
export type UserStatus = 'active' | 'pending' | 'suspended';

export interface User {
  id: string;
  email: string;
  name: string;
  grNumber: string; // GR/Roll Number
  role: UserRole;
  status: UserStatus;
  xp: number;
  level: number;
  assignedClasses: string[]; // Class IDs
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  description: string;
}

export interface Subject {
  id: string;
  classId: string;
  name: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  order: number;
}

export interface NoteVersion {
  version: number;
  fileUrl: string;
  originalName: string;
  createdAt: string;
}

export interface Note {
  id: string;
  chapterId: string;
  title: string;
  fileUrl: string; // Path on disk
  originalName: string;
  fileType: string;
  size: number;
  tags: string[];
  downloadAllowed: boolean;
  viewOnly: boolean;
  versions: NoteVersion[];
  createdAt: string;
}

export interface Video {
  id: string;
  chapterId: string;
  title: string;
  url: string;
  youtubeId: string | null;
  thumbnailUrl: string | null;
  isEmbeddable: boolean;
  description: string;
  createdAt: string;
}

export interface AccessGrant {
  id: string;
  studentId: string;
  scope: 'class' | 'subject' | 'item';
  targetId: string; // ID of Class, Subject, Note, or Video
}

export interface StudentAccess {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string | null;
  isUnlocked: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string; // This corresponds to content in some contexts
  createdAt: string;
  authorName: string;
  category?: 'general' | 'exam' | 'holiday' | 'schedule';
  urduTitle?: string;
  urduContent?: string;
}

export interface MCQOption {
  text: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: MCQOption[];
  correctOptionIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit: number; // in minutes
  xpReward: number;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: Record<number, number>; // questionId -> selectedIndex
  score: number;
  maxScore: number;
  xpEarned: number;
  completedAt: string;
}

export interface Assignment {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  dueDate: string;
  xpReward: number;
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl: string;
  originalName: string;
  submittedAt: string;
  grade?: string; // 'A', 'B', 'C', etc. or marks
  feedback?: string;
  xpEarned?: number;
}

export interface Bookmark {
  id: string;
  studentId: string;
  itemId: string;
  itemType: 'note' | 'video';
  createdAt: string;
}

export interface Progress {
  id: string;
  studentId: string;
  itemId: string; // note, video, quiz, or assignment
  itemType: 'note' | 'video' | 'quiz' | 'assignment';
  completedAt: string;
  xpEarned: number;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  timestamp: string;
}

export interface Attendance {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  status: 'present' | 'absent';
}

export interface UserCredential {
  id: string;
  userId: string;
  email: string;
  passwordText: string;
  updatedAt: string;
}

