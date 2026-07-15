// TACLMS API client for full-stack communication with Express backend
import { 
  User, ClassRoom, Subject, Chapter, Note, Video, AccessGrant, 
  Announcement, Quiz, QuizAttempt, Assignment, AssignmentSubmission, 
  Bookmark, Progress, AuditLog, Attendance, StudentAccess, UserCredential, Testimonial 
} from '../types';

let currentUserId: string | null = localStorage.getItem('taclms_user_id');

export function setApiUser(userId: string | null) {
  currentUserId = userId;
  if (userId) {
    localStorage.setItem('taclms_user_id', userId);
  } else {
    localStorage.removeItem('taclms_user_id');
    localStorage.removeItem('taclms_user');
  }
}

export function getApiUser(): string | null {
  return currentUserId;
}

export function getApiBaseUrl(): string {
  const rawApiUrl = import.meta.env.VITE_API_URL || '';
  return rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
}

// Global fetch wrapper with headers and error handling
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  // Attach user ID as Bearer token for iframe-safe session preservation
  if (currentUserId) {
    headers.set('Authorization', `Bearer ${currentUserId}`);
  }
  
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const API_BASE_URL = getApiBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // --- AUTH ---
  login: async (email: string, password: string) => {
    const data = await apiRequest<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setApiUser(data.user.id);
    localStorage.setItem('taclms_user', JSON.stringify(data.user));
    return data.user;
  },

  register: async (payload: { 
    email: string; 
    name: string; 
    grNumber: string; 
    password?: string; 
    classIds: string[];
    firstName?: string;
    lastName?: string;
    phone?: string;
    country?: string;
    city?: string;
    accaId?: string;
  }) => {
    return apiRequest<{ message: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  logout: () => {
    setApiUser(null);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  getMe: async () => {
    if (!currentUserId) return null;
    try {
      const data = await apiRequest<{ user: User }>('/api/auth/me');
      localStorage.setItem('taclms_user', JSON.stringify(data.user));
      return data.user;
    } catch (e) {
      setApiUser(null);
      return null;
    }
  },

  getCurrentUser: async () => {
    return api.getMe();
  },

  // --- CLASSES ---
  getClasses: () => apiRequest<ClassRoom[]>('/api/classes'),
  createClass: (name: string, description: string) => 
    apiRequest<ClassRoom>('/api/classes', {
      method: 'POST',
      body: JSON.stringify({ name, description })
    }),
  deleteClass: (id: string) => 
    apiRequest<{ success: boolean; message: string }>(`/api/classes/${id}`, {
      method: 'DELETE'
    }),

  // --- SUBJECTS ---
  getSubjects: () => apiRequest<Subject[]>('/api/subjects'),
  createSubject: (classId: string, name: string) => 
    apiRequest<Subject>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify({ classId, name })
    }),
  deleteSubject: (id: string) => 
    apiRequest<{ success: boolean }>(`/api/subjects/${id}`, {
      method: 'DELETE'
    }),

  // --- CHAPTERS ---
  getChapters: () => apiRequest<Chapter[]>('/api/chapters'),
  createChapter: (subjectId: string, title: string, order?: number) => 
    apiRequest<Chapter>('/api/chapters', {
      method: 'POST',
      body: JSON.stringify({ subjectId, title, order })
    }),
  deleteChapter: (id: string) => 
    apiRequest<{ success: boolean }>(`/api/chapters/${id}`, {
      method: 'DELETE'
    }),

  // --- NOTES / FILES ---
  getNotes: () => apiRequest<Note[]>('/api/notes'),
  uploadNote: (formData: FormData) => 
    apiRequest<Note>('/api/notes', {
      method: 'POST',
      body: formData
    }),
  deleteNote: (id: string) => 
    apiRequest<{ success: boolean }>(`/api/notes/${id}`, {
      method: 'DELETE'
    }),
  getFileUrl: (noteId: string, download = false) => {
    const API_BASE_URL = getApiBaseUrl();
    return `${API_BASE_URL}/api/notes/${noteId}/file${download ? '?download=true' : ''}`;
  },

  // --- VIDEOS ---
  getVideos: () => apiRequest<Video[]>('/api/videos'),
  addVideo: (payload: { chapterId: string; title: string; url: string; description?: string }) => 
    apiRequest<Video>('/api/videos', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  deleteVideo: (id: string) => 
    apiRequest<{ success: boolean }>(`/api/videos/${id}`, {
      method: 'DELETE'
    }),
  parseYoutube: (url: string) => 
    apiRequest<{ videoId: string | null; isValid: boolean }>(`/api/youtube-parse?url=${encodeURIComponent(url)}`),

  // --- STUDENTS & ACCESS MATRIX ---
  getStudents: () => apiRequest<User[]>('/api/students'),
  changeStudentStatus: (id: string, status: string) => 
    apiRequest<User>(`/api/students/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    }),
  updateStudentStatus: (id: string, status: string) => 
    apiRequest<User>(`/api/students/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    }),
  approveStudent: (id: string) => 
    apiRequest<User>(`/api/students/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: 'active' })
    }),
  assignStudentClasses: (id: string, classIds: string[]) => 
    apiRequest<User>(`/api/students/${id}/classes`, {
      method: 'POST',
      body: JSON.stringify({ classIds })
    }),
  getAccessGrants: () => apiRequest<AccessGrant[]>('/api/access-grants'),
  saveAccessGrants: (payload: { 
    studentId: string; 
    classIds: string[]; 
    subjectIds: string[]; 
    itemGrants: { targetId: string; scope: 'item' }[] 
  }) => apiRequest<{ success: boolean; message: string }>('/api/access-grants/save', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // --- QUIZZES ---
  getQuizzes: () => apiRequest<Quiz[]>('/api/quizzes'),
  createQuiz: (payload: any) => 
    apiRequest<Quiz>('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  submitQuiz: (quizId: string, answers: Record<string | number, number>) => 
    apiRequest<{ 
      attempt: QuizAttempt; 
      levelUp: boolean; 
      newLevel: number; 
      xpEarned: number; 
    }>(`/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    }),
  getQuizAttempts: () => apiRequest<QuizAttempt[]>('/api/quizzes/attempts'),
  deleteQuiz: (id: string) => 
    apiRequest<{ success: boolean }>(`/api/quizzes/${id}`, {
      method: 'DELETE'
    }),

  // --- ASSIGNMENTS ---
  getAssignments: () => apiRequest<Assignment[]>('/api/assignments'),
  createAssignment: (payload: any) => 
    apiRequest<Assignment>('/api/assignments', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  submitAssignment: (assignmentId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiRequest<AssignmentSubmission>(`/api/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: fd
    });
  },
  getSubmissions: () => apiRequest<AssignmentSubmission[]>('/api/submissions'),
  gradeSubmission: (id: string, grade: string, feedback: string) => 
    apiRequest<AssignmentSubmission>(`/api/submissions/${id}/grade`, {
      method: 'POST',
      body: JSON.stringify({ grade, feedback })
    }),
  deleteAssignment: (id: string) => 
    apiRequest<{ success: boolean }>(`/api/assignments/${id}`, {
      method: 'DELETE'
    }),
  getSubmissionFileUrl: (submissionId: string) => {
    const API_BASE_URL = getApiBaseUrl();
    return `${API_BASE_URL}/api/submissions/${submissionId}/file`;
  },

  // --- ATTENDANCE ---
  getAttendance: (date?: string) => {
    const url = date ? `/api/attendance?date=${encodeURIComponent(date)}` : '/api/attendance';
    return apiRequest<Attendance[]>(url);
  },
  getStudentAttendanceLogs: async (userId: string) => {
    const list = await apiRequest<Attendance[]>('/api/attendance');
    return list.filter(a => a.studentId === userId);
  },
  saveAttendance: (date: string, attendanceList: { studentId: string; status: 'present' | 'absent' | 'late' | 'excused' }[]) => 
    apiRequest<{ success: boolean }>('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({ date, attendanceList })
    }),

  // --- DISCUSSIONS (DOUBT SECTIONS) ---
  getComments: (itemId: string) => apiRequest<any[]>(`/api/discussions/${itemId}`),
  addComment: (itemId: string, text: string) => 
    apiRequest<any>(`/api/discussions/${itemId}`, {
      method: 'POST',
      body: JSON.stringify({ text })
    }),
  togglePinComment: (commentId: string) => 
    apiRequest<{ success: boolean }>(`/api/discussions/pin/${commentId}`, {
      method: 'POST'
    }),

  // --- BOOKMARKS ---
  getBookmarks: () => apiRequest<Bookmark[]>('/api/bookmarks'),
  toggleBookmark: (itemId: string, itemType: 'note' | 'video') => 
    apiRequest<{ bookmarked: boolean }>('/api/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({ itemId, itemType })
    }),

  // --- PROGRESS ---
  getProgress: () => apiRequest<Progress[]>('/api/progress'),
  markAsCompleted: (itemId: string, itemType: string, score?: number, maxScore?: number) => 
    apiRequest<{ 
      success: boolean; 
      xpEarned: number; 
      levelUp: boolean; 
      newLevel: number; 
    }>('/api/progress/mark-done', {
      method: 'POST',
      body: JSON.stringify({ itemId, itemType, score, maxScore })
    }),
  getLeaderboard: () => apiRequest<{ leaderboard: any[] }>('/api/student-stats'),
  getRankings: () => apiRequest<{ rankings: any[] }>('/api/students/rankings'),

  // --- ANNOUNCEMENTS ---
  getAnnouncements: () => apiRequest<Announcement[]>('/api/announcements'),
  createAnnouncement: (titleOrPayload: string | any, body?: string) => {
    if (typeof titleOrPayload === 'object') {
      const title = titleOrPayload.title;
      const b = titleOrPayload.body || titleOrPayload.content;
      return apiRequest<Announcement>('/api/announcements', {
        method: 'POST',
        body: JSON.stringify({ 
          title, 
          body: b,
          category: titleOrPayload.category,
          urduTitle: titleOrPayload.urduTitle,
          urduContent: titleOrPayload.urduContent
        })
      });
    }
    return apiRequest<Announcement>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify({ title: titleOrPayload, body })
    });
  },
  deleteAnnouncement: (id: string) => 
    apiRequest<{ success: boolean }>(`/api/announcements/${id}`, {
      method: 'DELETE'
    }),

  // --- AUDIT LOGS ---
  getAuditLogs: () => apiRequest<AuditLog[]>('/api/audit-logs'),

  // --- COMPATIBILITY ADAPTERS FOR ACCESS MATRIX ---
  getAccessRecords: async (): Promise<StudentAccess[]> => {
    const grants = await api.getAccessGrants();
    const subjects = await api.getSubjects();
    const records: StudentAccess[] = [];
    grants.forEach(g => {
      if (g.scope === 'class') {
        records.push({
          id: g.id,
          studentId: g.studentId,
          classId: g.targetId,
          subjectId: null,
          isUnlocked: true
        });
      } else if (g.scope === 'subject') {
        const sub = subjects.find(s => s.id === g.targetId);
        records.push({
          id: g.id,
          studentId: g.studentId,
          classId: sub ? sub.classId : '',
          subjectId: g.targetId,
          isUnlocked: true
        });
      }
    });
    return records;
  },

  updateAccess: async (studentId: string, classId: string, subjectId: string | null, isUnlocked: boolean): Promise<any> => {
    // 1. Get all current grants
    const grants = await api.getAccessGrants();
    // 2. Filter for other students
    const studentGrants = grants.filter(g => g.studentId === studentId);
    
    // Convert current student grants to sets of classIds and subjectIds
    let classIds = studentGrants.filter(g => g.scope === 'class').map(g => g.targetId);
    let subjectIds = studentGrants.filter(g => g.scope === 'subject').map(g => g.targetId);
    let itemGrants = studentGrants.filter(g => g.scope === 'item').map(g => ({ targetId: g.targetId, scope: 'item' as const }));

    if (subjectId === null) {
      // Toggling Class
      if (isUnlocked) {
        if (!classIds.includes(classId)) classIds.push(classId);
      } else {
        classIds = classIds.filter(id => id !== classId);
      }
    } else {
      // Toggling Subject
      if (isUnlocked) {
        if (!subjectIds.includes(subjectId)) subjectIds.push(subjectId);
      } else {
        subjectIds = subjectIds.filter(id => id !== subjectId);
      }
    }

    return api.saveAccessGrants({
      studentId,
      classIds,
      subjectIds,
      itemGrants
    });
  },

  getSupabaseStatus: async (): Promise<any> => {
    return apiRequest<any>('/api/supabase-status');
  },

  triggerSupabaseSync: async (direction: 'push' | 'pull'): Promise<any> => {
    return apiRequest<any>('/api/supabase-sync', {
      method: 'POST',
      body: JSON.stringify({ direction })
    });
  },

  getCredentials: async (): Promise<UserCredential[]> => {
    return apiRequest<UserCredential[]>('/api/admin/credentials');
  },

  updateCredential: async (userId: string, passwordText: string): Promise<any> => {
    return apiRequest<any>('/api/admin/credentials/update', {
      method: 'POST',
      body: JSON.stringify({ userId, passwordText })
    });
  },

  getTestimonials: async (): Promise<Testimonial[]> => {
    return apiRequest<Testimonial[]>('/api/testimonials');
  },

  submitTestimonial: async (rating: number, feedback: string): Promise<Testimonial> => {
    return apiRequest<Testimonial>('/api/testimonials', {
      method: 'POST',
      body: JSON.stringify({ rating, feedback })
    });
  },

  approveTestimonial: async (id: string): Promise<any> => {
    return apiRequest<any>(`/api/testimonials/approve/${id}`, {
      method: 'POST'
    });
  },

  deleteTestimonial: async (id: string): Promise<any> => {
    return apiRequest<any>(`/api/testimonials/${id}`, {
      method: 'DELETE'
    });
  }
};
