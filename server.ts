import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcryptjs from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { getDB, saveDB, DBStructure, syncWithSupabase, supabaseStatus, saveToSupabase, ensureInit, deleteFromSupabase, deleteFromSupabaseByField } from './server/dbStore';
import { 
  User, ClassRoom, Subject, Chapter, Note, Video, AccessGrant, 
  Announcement, Quiz, QuizAttempt, Assignment, AssignmentSubmission, 
  Bookmark, Progress, AuditLog, Attendance, Testimonial 
} from './src/types';
import { getGeminiClient, BOT_ROLES, BotRoleId } from './server/gemini';

export const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for external cross-origin requests (e.g. from Vercel)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Password Security Migration Script
export function runPasswordMigration() {
  try {
    const db = getDB();
    let migratedCount = 0;
    let createdCount = 0;

    if (!db.userCredentials) {
      db.userCredentials = [];
    }

    db.users.forEach(user => {
      let cred = db.userCredentials.find(c => c.userId === user.id);
      if (!cred) {
        // Create missing credential record with a default secure hashed password
        const defaultPlainPassword = user.role === 'admin' ? 'admin123' : 'student123';
        const defaultHashedPassword = bcryptjs.hashSync(defaultPlainPassword, 10);
        db.userCredentials.push({
          id: 'cred-' + Date.now() + '-' + Math.round(Math.random() * 1000),
          userId: user.id,
          email: user.email,
          passwordText: defaultHashedPassword,
          updatedAt: new Date().toISOString()
        });
        createdCount++;
      } else {
        // Check if existing password is plaintext
        const isHashed = cred.passwordText.startsWith('$2a$') || cred.passwordText.startsWith('$2b$') || cred.passwordText.startsWith('$2y$');
        if (!isHashed) {
          console.log(`Migrating plaintext password for user ${user.email}`);
          cred.passwordText = bcryptjs.hashSync(cred.passwordText, 10);
          cred.updatedAt = new Date().toISOString();
          migratedCount++;
        }
      }
    });

    if (migratedCount > 0 || createdCount > 0) {
      saveDB(db);
      console.log(`[Security Migration] Successfully secured database. Migrated ${migratedCount} plaintext passwords and created ${createdCount} secure credentials.`);
    } else {
      console.log('[Security Migration] Database already secured. No actions needed.');
    }
  } catch (err) {
    console.error('[Security Migration] Migration failed:', err);
  }
}

// Ensure Supabase synchronization on Vercel boot or container boot before serving any request
app.use(async (req, res, next) => {
  try {
    await ensureInit();
    runPasswordMigration();
  } catch (err) {
    console.error('Initialization middleware failed:', err);
  }
  next();
});

// Create upload storage directory (use writeable /tmp on Vercel serverless functions)
const UPLOADS_DIR = process.env.VERCEL 
  ? path.join('/tmp', 'uploads') 
  : path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique name to prevent collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// YouTube parsing utility
export function extractYoutubeId(url: string): { videoId: string | null; isValid: boolean } {
  if (!url) return { videoId: null, isValid: false };
  const cleaned = url.trim();
  const regexes = [
    /youtu\.be\/([^#\&\?]+)/,
    /youtube\.com\/watch\?v=([^#\&\?]+)/,
    /m\.youtube\.com\/watch\?v=([^#\&\?]+)/,
    /youtube\.com\/embed\/([^#\&\?]+)/,
    /youtube-nocookie\.com\/embed\/([^#\&\?]+)/,
    /youtube\.com\/shorts\/([^#\&\?]+)/,
    /youtube\.com\/live\/([^#\&\?]+)/
  ];
  
  for (const regex of regexes) {
    const match = cleaned.match(regex);
    if (match && match[1]) {
      // Clean query params if any
      const id = match[1].split('?')[0];
      return { videoId: id, isValid: true };
    }
  }
  
  try {
    const parsed = new URL(cleaned);
    const v = parsed.searchParams.get('v');
    if (v) return { videoId: v, isValid: true };
  } catch (e) {}

  return { videoId: null, isValid: false };
}

// Middleware: Get current user from X-User-Id header (Iframe safe Auth)
function getUserFromRequest(req: express.Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const userId = authHeader.substring(7).trim();
  const db = getDB();
  return db.users.find(u => u.id === userId) || null;
}

// Authentication Guards
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized. Please login first.' });
    return;
  }
  if (user.status === 'suspended') {
    res.status(403).json({ error: 'Your account has been suspended. Please contact Admin.' });
    return;
  }
  if (user.status === 'pending') {
    res.status(403).json({ error: 'Your account is pending admin approval.' });
    return;
  }
  (req as any).user = user;
  next();
};

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  requireAuth(req, res, () => {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      res.status(403).json({ error: 'Access forbidden. Admin role required.' });
      return;
    }
    next();
  });
};

// Log action helper
function logAction(actor: User, action: string, target: string) {
  const db = getDB();
  const log: AuditLog = {
    id: 'log-' + Date.now() + '-' + Math.round(Math.random() * 1000),
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    target,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log); // newest first
  saveDB(db);
}

// Access Checker Helper: determines if a student has access to a specific item or class or subject
function hasAccessToSubject(user: User, subjectId: string): boolean {
  if (user.role === 'admin') return true;
  const db = getDB();
  const subject = db.subjects.find(s => s.id === subjectId);
  if (!subject) return false;

  // 1. Direct subject access grant
  const hasSubjectGrant = db.accessGrants.some(
    g => g.studentId === user.id && g.scope === 'subject' && g.targetId === subjectId
  );
  if (hasSubjectGrant) return true;

  // 2. Direct class access grant (if student is granted the parent class of the subject)
  const hasClassGrant = db.accessGrants.some(
    g => g.studentId === user.id && g.scope === 'class' && g.targetId === subject.classId
  );
  if (hasClassGrant) return true;

  // 3. User pre-assigned classes (e.g. assignedClasses list on user profile)
  if (user.assignedClasses.includes(subject.classId)) return true;

  return false;
}

function hasAccessToNoteOrVideo(user: User, itemId: string, itemType: 'note' | 'video'): boolean {
  if (user.role === 'admin') return true;
  const db = getDB();
  
  // Check individual item grant first
  const hasItemGrant = db.accessGrants.some(
    g => g.studentId === user.id && g.scope === 'item' && g.targetId === itemId
  );
  if (hasItemGrant) return true;

  // Trace back to chapter -> subject
  if (itemType === 'note') {
    const note = db.notes.find(n => n.id === itemId);
    if (!note) return false;
    const chap = db.chapters.find(c => c.id === note.chapterId);
    if (!chap) return false;
    return hasAccessToSubject(user, chap.subjectId);
  } else {
    const video = db.videos.find(v => v.id === itemId);
    if (!video) return false;
    const chap = db.chapters.find(c => c.id === video.chapterId);
    if (!chap) return false;
    return hasAccessToSubject(user, chap.subjectId);
  }
}

// ==================== AUTHENTICATION API ====================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  const db = getDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // Get credentials for this specific user
  const creds = db.userCredentials?.find(c => c.userId === user.id);
  if (!creds) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const isMatch = bcryptjs.compareSync(password, creds.passwordText);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ error: 'Your account is suspended. Please contact Prof. Ali.' });
    return;
  }

  logAction(user, 'User Login', 'TACLMS Platform');
  res.json({ user });
});

app.post('/api/auth/register', (req, res) => {
  const { email, name, grNumber, firstName, lastName, phone, country, city, accaId, password, classIds } = req.body;
  
  // Accept name as passed or construct it from firstName & lastName
  const finalName = name || (firstName && lastName ? `${firstName} ${lastName}`.trim() : '');
  
  // Use accaId as grNumber or generate a unique ID
  const finalGrNumber = grNumber || accaId || ('ACCA-' + Math.floor(100000 + Math.random() * 900000));
  
  if (!email || !finalName || !finalGrNumber) {
    res.status(400).json({ error: 'Email, Full Name, and unique identifier are required' });
    return;
  }

  const rawPassword = password || 'student123';
  
  // Enforce password strength validation at signup: min 8 characters, must have letters and numbers
  const hasLetter = /[a-zA-Z]/.test(rawPassword);
  const hasNumber = /[0-9]/.test(rawPassword);
  if (rawPassword.length < 8 || !hasLetter || !hasNumber) {
    res.status(400).json({ error: 'Password must be at least 8 characters long and contain both letters and numbers.' });
    return;
  }
  
  const db = getDB();
  const exists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase() || u.grNumber === finalGrNumber);
  if (exists) {
    res.status(400).json({ error: 'User with this email or ID already exists' });
    return;
  }

  // Check if an admin is logged in
  const requestingUser = getUserFromRequest(req);
  const isAdmin = requestingUser && requestingUser.role === 'admin';

  const newUser: User = {
    id: 'user-' + Date.now() + '-' + Math.round(Math.random() * 1000),
    email: email.toLowerCase(),
    name: finalName,
    grNumber: finalGrNumber,
    role: 'student',
    status: isAdmin ? 'active' : 'pending', // Active immediately if admin registered them
    xp: 0,
    level: 1,
    assignedClasses: classIds || [],
    createdAt: new Date().toISOString(),
    firstName,
    lastName,
    phone,
    country,
    city,
    accaId
  };

  db.users.push(newUser);

  // Issue custom password to the credentials table
  if (!db.userCredentials) {
    db.userCredentials = [];
  }
  const hashedPassword = bcryptjs.hashSync(rawPassword, 10);
  db.userCredentials.push({
    id: 'cred-' + Date.now() + '-' + Math.round(Math.random() * 1000),
    userId: newUser.id,
    email: newUser.email,
    passwordText: hashedPassword,
    updatedAt: new Date().toISOString()
  });

  saveDB(db);

  // Log in system logs
  const systemAdmin: User = requestingUser || { id: 'system', name: 'System Registrations', role: 'admin', email: '', grNumber: '', status: 'active', xp: 0, level: 1, assignedClasses: [], createdAt: '' };
  logAction(systemAdmin, isAdmin ? 'Admin Registered Student' : 'New Self-Registration Request', `Student ${finalName} (GR: ${finalGrNumber})`);

  res.json({ 
    message: isAdmin 
      ? 'Student account registered and activated successfully with password.' 
      : 'Registration submitted successfully. Please wait for Admin approval.', 
    user: newUser 
  });
});

// ==================== ADMIN CREDENTIALS API ====================

app.get('/api/admin/credentials', requireAdmin, (req, res) => {
  const db = getDB();
  res.json(db.userCredentials || []);
});

app.post('/api/admin/credentials/update', requireAdmin, (req, res) => {
  const { userId, passwordText } = req.body;
  if (!userId || !passwordText) {
    res.status(400).json({ error: 'User ID and password are required' });
    return;
  }
  
  // Enforce password strength on admin-set passwords as well
  const hasLetter = /[a-zA-Z]/.test(passwordText);
  const hasNumber = /[0-9]/.test(passwordText);
  if (passwordText.length < 8 || !hasLetter || !hasNumber) {
    res.status(400).json({ error: 'Password must be at least 8 characters long and contain both letters and numbers.' });
    return;
  }

  const db = getDB();
  if (!db.userCredentials) {
    db.userCredentials = [];
  }
  
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  const hashedPassword = bcryptjs.hashSync(passwordText, 10);

  let cred = db.userCredentials.find(c => c.userId === userId);
  if (cred) {
    cred.passwordText = hashedPassword;
    cred.updatedAt = new Date().toISOString();
  } else {
    db.userCredentials.push({
      id: 'cred-' + Date.now() + '-' + Math.round(Math.random() * 1000),
      userId,
      email: user.email,
      passwordText: hashedPassword,
      updatedAt: new Date().toISOString()
    });
  }
  
  saveDB(db);
  res.json({ message: 'Student credential updated successfully.' });
});

// ==================== STUDENT SELF-SERVICE PASSWORD CHANGE API ====================

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = (req as any).user;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required.' });
    return;
  }

  // Enforce password strength: min 8 characters, must have letters and numbers
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  if (newPassword.length < 8 || !hasLetter || !hasNumber) {
    res.status(400).json({ error: 'New password must be at least 8 characters long and contain both letters and numbers.' });
    return;
  }

  const db = getDB();
  if (!db.userCredentials) {
    db.userCredentials = [];
  }

  const cred = db.userCredentials.find(c => c.userId === user.id);
  if (!cred) {
    res.status(404).json({ error: 'Credentials not found.' });
    return;
  }

  // Check current password
  const isMatch = bcryptjs.compareSync(currentPassword, cred.passwordText);
  if (!isMatch) {
    res.status(400).json({ error: 'Incorrect current password.' });
    return;
  }

  // Hash and save new password
  cred.passwordText = bcryptjs.hashSync(newPassword, 10);
  cred.updatedAt = new Date().toISOString();

  saveDB(db);
  logAction(user, 'Changed Password', 'Student Self-Service');

  res.json({ message: 'Password updated successfully.' });
});


app.get('/api/auth/me', (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  if (user.status === 'suspended') {
    res.status(403).json({ error: 'Account suspended' });
    return;
  }
  res.json({ user });
});

// ==================== BRANDING & LOGO API ====================

app.get('/api/branding/logo', (req, res) => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR);
    }
    const files = fs.readdirSync(UPLOADS_DIR);
    const logoFile = files.find(f => f.startsWith('custom-logo.'));
    if (logoFile) {
      return res.sendFile(path.join(UPLOADS_DIR, logoFile));
    }
  } catch (err) {
    console.error('Error finding custom logo:', err);
  }
  
  const defaultPath = process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), 'dist', 'logo.svg')
    : path.join(process.cwd(), 'public', 'logo.svg');
  return res.sendFile(defaultPath);
});

app.post('/api/branding/logo', requireAdmin, upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No logo file provided' });
  }

  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR);
    }
    // Delete existing custom-logo.* files to avoid duplicates
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const file of files) {
      if (file.startsWith('custom-logo.')) {
        try {
          fs.unlinkSync(path.join(UPLOADS_DIR, file));
        } catch (unlinkErr) {
          console.warn('Could not delete old logo file:', unlinkErr);
        }
      }
    }

    // Rename the uploaded file to custom-logo.[ext]
    const ext = path.extname(req.file.originalname) || '.png';
    const newPath = path.join(UPLOADS_DIR, `custom-logo${ext}`);
    fs.renameSync(req.file.path, newPath);

    logAction((req as any).user, 'Updated Branding Logo', `custom-logo${ext}`);

    return res.json({ success: true, logoUrl: `/api/branding/logo?t=${Date.now()}` });
  } catch (err: any) {
    console.error('Failed to save custom logo', err);
    return res.status(500).json({ error: 'Failed to save custom logo: ' + err.message });
  }
});

// ==================== CLASSES & SUBJECTS API ====================

app.get('/api/classes', (req, res) => {
  const db = getDB();
  res.json(db.classes);
});

app.post('/api/classes', requireAdmin, (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Class name is required' });
    return;
  }
  const db = getDB();
  const newClass: ClassRoom = {
    id: 'class-' + Date.now(),
    name,
    description: description || ''
  };
  db.classes.push(newClass);
  saveDB(db);
  logAction((req as any).user, 'Created Class', name);
  res.json(newClass);
});

app.delete('/api/classes/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const db = getDB();
  const cls = db.classes.find(c => c.id === id);
  if (!cls) {
    res.status(404).json({ error: 'Class not found' });
    return;
  }
  db.classes = db.classes.filter(c => c.id !== id);
  db.subjects = db.subjects.filter(s => s.classId !== id);
  saveDB(db);
  
  // Delete from Supabase tables
  deleteFromSupabase('classes', id).catch(err => console.error(err));
  deleteFromSupabaseByField('subjects', 'classId', id).catch(err => console.error(err));
  
  logAction((req as any).user, 'Deleted Class', cls.name);
  res.json({ success: true, message: 'Class and its subjects deleted.' });
});

app.get('/api/subjects', requireAuth, (req, res) => {
  const user = (req as any).user;
  const db = getDB();
  if (user.role === 'admin') {
    res.json(db.subjects.map(s => ({ ...s, isUnlocked: true })));
  } else {
    // Return all subjects with an isUnlocked property computed for this student
    const subjectsWithAccess = db.subjects.map(sub => ({
      ...sub,
      isUnlocked: hasAccessToSubject(user, sub.id)
    }));
    res.json(subjectsWithAccess);
  }
});

app.post('/api/subjects', requireAdmin, (req, res) => {
  const { classId, name } = req.body;
  if (!classId || !name) {
    res.status(400).json({ error: 'Class ID and Subject name are required' });
    return;
  }
  const db = getDB();
  const newSubject: Subject = {
    id: 'subject-' + Date.now(),
    classId,
    name
  };
  db.subjects.push(newSubject);
  saveDB(db);
  logAction((req as any).user, 'Created Subject', name);
  res.json(newSubject);
});

app.delete('/api/subjects/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const db = getDB();
  const sub = db.subjects.find(s => s.id === id);
  if (!sub) {
    res.status(404).json({ error: 'Subject not found' });
    return;
  }
  db.subjects = db.subjects.filter(s => s.id !== id);
  saveDB(db);
  
  // Delete from Supabase
  deleteFromSupabase('subjects', id).catch(err => console.error(err));
  
  logAction((req as any).user, 'Deleted Subject', sub.name);
  res.json({ success: true });
});

// ==================== CHAPTERS API ====================

app.get('/api/chapters', requireAuth, (req, res) => {
  const db = getDB();
  res.json(db.chapters);
});

app.post('/api/chapters', requireAdmin, (req, res) => {
  const { subjectId, title, order } = req.body;
  if (!subjectId || !title) {
    res.status(400).json({ error: 'Subject ID and Title are required' });
    return;
  }
  const db = getDB();
  const newChapter: Chapter = {
    id: 'chap-' + Date.now(),
    subjectId,
    title,
    order: Number(order) || (db.chapters.filter(c => c.subjectId === subjectId).length + 1)
  };
  db.chapters.push(newChapter);
  saveDB(db);
  logAction((req as any).user, 'Created Chapter', title);
  res.json(newChapter);
});

app.delete('/api/chapters/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const db = getDB();
  const chap = db.chapters.find(c => c.id === id);
  if (!chap) {
    res.status(404).json({ error: 'Chapter not found' });
    return;
  }
  db.chapters = db.chapters.filter(c => c.id !== id);
  saveDB(db);
  
  // Delete from Supabase
  deleteFromSupabase('chapters', id).catch(err => console.error(err));
  
  logAction((req as any).user, 'Deleted Chapter', chap.title);
  res.json({ success: true });
});

// ==================== TOPICS & TOPIC CONTENT API ====================

const DEFAULT_TOPIC_SUFFIXES = [
  { order: 1, suffix: 'Fundamental Principles & Core Axioms' },
  { order: 2, suffix: 'Advanced Formulations & Derivations' },
  { order: 3, suffix: 'Practical Board Applications & Exam Questions' }
];

app.get('/api/topics/:chapterId', requireAuth, (req, res) => {
  const chapterId = req.params.chapterId;
  const db = getDB();
  const topics = db.topics ? db.topics.filter(t => t.chapterId === chapterId) : [];
  if (topics.length > 0) {
    res.json(topics);
  } else {
    // Return default deterministic topics
    const defaultTopics = DEFAULT_TOPIC_SUFFIXES.map(item => ({
      id: `${chapterId}-t${item.order}`,
      chapterId,
      title: `Topic ${item.order}: ${item.suffix}`,
      order: item.order
    }));
    res.json(defaultTopics);
  }
});

app.post('/api/topics/:chapterId', requireAdmin, (req, res) => {
  const chapterId = req.params.chapterId;
  const { topics } = req.body;
  if (!Array.isArray(topics)) {
    res.status(400).json({ error: 'Topics array is required' });
    return;
  }
  const db = getDB();
  if (!db.topics) db.topics = [];
  
  // Remove existing topics for this chapter
  db.topics = db.topics.filter(t => t.chapterId !== chapterId);
  
  // Push new ones
  db.topics.push(...topics);
  
  saveDB(db);
  logAction((req as any).user, 'Updated Topics List', `Chapter: ${chapterId}`);
  res.json({ success: true, topics });
});

app.get('/api/topic-content/:topicId', requireAuth, (req, res) => {
  const topicId = req.params.topicId;
  const subjectName = req.query.subjectName as string;
  const db = getDB();
  const content = db.topicContents ? db.topicContents.find(c => c.topicId === topicId) : null;
  if (content) {
    res.json(content);
  } else {
    // Generate default mock fallback content to prevent empty screens
    const topicNum = topicId.split('-t').pop() || '1';
    const sub = subjectName || 'this subject';
    const title = `Topic ${topicNum}: ${DEFAULT_TOPIC_SUFFIXES[Number(topicNum) - 1]?.suffix || 'Advanced Material'}`;

    const defaultContent = {
      topicId,
      videoUrl: 'https://www.youtube.com/watch?v=KzXgZf8eLQA',
      videoTitle: `Syllabus Overview: ${title}`,
      feedbackEnabled: true,
      mcqs: [
        {
          id: 1,
          q: `Which of the following is the fundamental governing principle of ${sub} inside ${title}?`,
          options: ['Standard Linear Transformation', 'Isothermal Equilibrium State', 'Direct Proportional Acceleration', 'Newtonian Relativistic Limit'],
          correct: 0,
          explanation: 'Standard linear transformation governs coordinates under direct proportional limits.'
        },
        {
          id: 2,
          q: `What primary variable represents the change rate inside ${title}?`,
          options: ['Integrand factor', 'SI Derivative ratio', 'Planck ratio constant', 'Universal field flux'],
          correct: 1,
          explanation: 'The SI Derivative ratio is the fundamental metric measuring variable shifts.'
        },
        {
          id: 3,
          q: `Under practical board conditions, what coefficient is critical for analyzing ${sub} variables?`,
          options: ['The Euler ratio', 'The proportional density limit', 'Direct proportional constant', 'Frictional resistance threshold'],
          correct: 2,
          explanation: 'Direct proportional constant defines coordinate proportionality during shifts.'
        }
      ],
      pastPapers: [
        { year: 'Board Exam 2024 - Sec B', q: `State and prove the fundamental proportional relation defined under ${title}. [6 Marks]` },
        { year: 'Board Exam 2023 - Sec C', q: `A closed system experiences a double proportional shift. Compute its terminal coefficient step-by-step. [10 Marks]` },
        { year: 'Board Exam 2022 - Sec A', q: `Define the primary SI unit of measurement for ${sub} and show its dimensional analysis. [4 Marks]` }
      ],
      notesText: `### OFFICIAL SYLLABUS NOTES: ${title.toUpperCase()}
Subject: ${sub}

1. INTRODUCTION & SCOPE
These notes highlight the core concepts defined by the Board of Intermediate and Secondary Education. Ensure complete retention of each highlighted equation to maximize your assessment performance.

2. CORE CONCEPTS & DEFINITIONS
- Fundamental proportional shift operates on a closed linear system.
- Direct change vectors represent the instantaneous rate of shift of values.
- Yellow highlighted areas indicate questions frequently repeated in board examinations.

3. DERIVATIONS AND EQUATIONS
- Secondary vector: dV/dt = K(x - x0)
- Constant proportional factor is always verified at standard zero-point levels.

4. BOARD PREPARATION HIGHLIGHTS
- Pay close attention to unit scales; mix-matching coordinate units is a common error.
- Always provide written answers in complete numbered bullets to capture maximal step-marks.`,
      importantPoints: [
        `Syllabus Keypoint: Memorize the exact direct relationship constants verbatim for potential definitions.`,
        `High-Yield Concept: Draw clean vector sketches illustrating coordinate shifts; examiners heavily penalize missing graphs.`,
        `Exam Short-cut: Relational density always scales symmetrically inside regular coordinate fields.`,
        `Repeated Past Paper Alert: This exact derivation is worth 8 marks and has been queried 4 times since 2018.`
      ]
    };
    res.json(defaultContent);
  }
});

app.post('/api/topic-content/:topicId', requireAdmin, (req, res) => {
  const topicId = req.params.topicId;
  const content = req.body;
  const db = getDB();
  if (!db.topicContents) db.topicContents = [];

  // Remove existing content for this topicId
  db.topicContents = db.topicContents.filter(c => c.topicId !== topicId);

  // Push new content
  db.topicContents.push(content);

  saveDB(db);
  logAction((req as any).user, 'Updated Topic Content', `Topic: ${topicId}`);
  res.json({ success: true, content });
});

// ==================== NOTES / FILES API ====================

app.get('/api/notes', requireAuth, (req, res) => {
  const user = (req as any).user;
  const db = getDB();
  if (user.role === 'admin') {
    res.json(db.notes);
  } else {
    // Filter notes based on chapter access
    const allowedNotes = db.notes.filter(note => hasAccessToNoteOrVideo(user, note.id, 'note'));
    res.json(allowedNotes);
  }
});

// Handle notes upload (Multer)
app.post('/api/notes', requireAdmin, upload.single('file'), (req, res) => {
  const { chapterId, title, tags, downloadAllowed, viewOnly, noteId } = req.body;
  
  if (!chapterId || !title) {
    res.status(400).json({ error: 'Chapter ID and Title are required' });
    return;
  }

  const db = getDB();

  // If re-uploading/updating an existing note
  if (noteId) {
    const existingNote = db.notes.find(n => n.id === noteId);
    if (!existingNote) {
      res.status(404).json({ error: 'Note to update not found' });
      return;
    }

    // Capture version history
    const oldVersion = {
      version: existingNote.versions.length + 1,
      fileUrl: existingNote.fileUrl,
      originalName: existingNote.originalName,
      createdAt: existingNote.createdAt
    };

    existingNote.title = title;
    existingNote.tags = tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : existingNote.tags;
    existingNote.downloadAllowed = downloadAllowed === 'true' || downloadAllowed === true;
    existingNote.viewOnly = viewOnly === 'true' || viewOnly === true;
    
    if (req.file) {
      existingNote.versions.push(oldVersion);
      existingNote.fileUrl = `/uploads/${req.file.filename}`;
      existingNote.originalName = req.file.originalname;
      existingNote.fileType = req.file.mimetype;
      existingNote.size = req.file.size;
    }

    saveDB(db);
    logAction((req as any).user, 'Updated Note File', title);
    res.json(existingNote);
    return;
  }

  // Creating a new note
  if (!req.file) {
    res.status(400).json({ error: 'File attachment is required for a new note' });
    return;
  }

  const newNote: Note = {
    id: 'note-' + Date.now(),
    chapterId,
    title,
    fileUrl: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    fileType: req.file.mimetype,
    size: req.file.size,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : [],
    downloadAllowed: downloadAllowed === 'true' || downloadAllowed === true,
    viewOnly: viewOnly === 'true' || viewOnly === true,
    versions: [],
    createdAt: new Date().toISOString()
  };

  db.notes.push(newNote);
  saveDB(db);
  logAction((req as any).user, 'Uploaded Note', title);
  res.json(newNote);
});

app.delete('/api/notes/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const db = getDB();
  const note = db.notes.find(n => n.id === id);
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  // Delete actual file if exists
  const filename = note.fileUrl.replace('/uploads/', '');
  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {}
  }

  db.notes = db.notes.filter(n => n.id !== id);
  saveDB(db);
  
  // Delete from Supabase
  deleteFromSupabase('notes', id).catch(err => console.error(err));
  
  logAction((req as any).user, 'Deleted Note', note.title);
  res.json({ success: true });
});

// Secure PDF / Document streaming API (Database access enforced)
app.get('/api/notes/:id/file', requireAuth, (req, res) => {
  const noteId = req.params.id;
  const user = (req as any).user;
  const db = getDB();

  const note = db.notes.find(n => n.id === noteId);
  if (!note) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  // Enforce role-based access check
  if (!hasAccessToNoteOrVideo(user, note.id, 'note')) {
    res.status(403).json({ error: 'Access Denied. You do not have permissions for this file.' });
    return;
  }

  // Check download restriction
  const isDownloadRequest = req.query.download === 'true';
  if (isDownloadRequest && !note.downloadAllowed && user.role !== 'admin') {
    res.status(403).json({ error: 'Downloading is disabled for this secure file.' });
    return;
  }

  const filename = note.fileUrl.replace('/uploads/', '');
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    // Try fallback for seed files
    const seedPath = path.join(process.cwd(), 'uploads', filename);
    if (fs.existsSync(seedPath)) {
      res.setHeader('Content-Type', note.fileType);
      if (isDownloadRequest) {
        res.setHeader('Content-Disposition', `attachment; filename="${note.originalName}"`);
      }
      res.sendFile(seedPath);
      return;
    }
    res.status(404).json({ error: 'Physical file not found on disk.' });
    return;
  }

  res.setHeader('Content-Type', note.fileType);
  if (isDownloadRequest) {
    res.setHeader('Content-Disposition', `attachment; filename="${note.originalName}"`);
  }
  res.sendFile(filePath);
});

// ==================== VIDEOS API ====================

app.get('/api/videos', requireAuth, (req, res) => {
  const user = (req as any).user;
  const db = getDB();
  if (user.role === 'admin') {
    res.json(db.videos);
  } else {
    const allowedVideos = db.videos.filter(vid => hasAccessToNoteOrVideo(user, vid.id, 'video'));
    res.json(allowedVideos);
  }
});

app.get('/api/youtube-parse', requireAuth, (req, res) => {
  const url = req.query.url as string;
  const parseResult = extractYoutubeId(url);
  res.json(parseResult);
});

app.post('/api/videos', requireAdmin, (req, res) => {
  const { chapterId, title, url, description } = req.body;
  if (!chapterId || !title || !url) {
    res.status(400).json({ error: 'Chapter, Title, and URL are required' });
    return;
  }

  const { videoId, isValid } = extractYoutubeId(url);
  const db = getDB();

  const newVideo: Video = {
    id: 'vid-' + Date.now(),
    chapterId,
    title,
    url,
    youtubeId: videoId,
    thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null,
    isEmbeddable: isValid, // if valid YouTube ID, we can embed it
    description: description || '',
    createdAt: new Date().toISOString()
  };

  db.videos.push(newVideo);
  saveDB(db);
  logAction((req as any).user, 'Added Video', title);
  res.json(newVideo);
});

app.delete('/api/videos/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const db = getDB();
  const vid = db.videos.find(v => v.id === id);
  if (!vid) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }
  db.videos = db.videos.filter(v => v.id !== id);
  saveDB(db);
  
  // Delete from Supabase
  deleteFromSupabase('videos', id).catch(err => console.error(err));
  
  logAction((req as any).user, 'Deleted Video', vid.title);
  res.json({ success: true });
});

// ==================== ACCESS CONTROL & STUDENTS API ====================

app.get('/api/students', requireAdmin, (req, res) => {
  const db = getDB();
  const students = db.users.filter(u => u.role === 'student');
  res.json(students);
});

app.post('/api/students/:id/status', requireAdmin, (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: 'Status is required' });
    return;
  }
  const db = getDB();
  const user = db.users.find(u => u.id === id);
  if (!user) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }
  user.status = status;
  saveDB(db);
  logAction((req as any).user, 'Changed Student Status', `${user.name} to ${status}`);
  res.json(user);
});

app.post('/api/students/:id/classes', requireAdmin, (req, res) => {
  const id = req.params.id;
  const { classIds } = req.body;
  const db = getDB();
  const user = db.users.find(u => u.id === id);
  if (!user) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }
  user.assignedClasses = classIds || [];
  saveDB(db);
  logAction((req as any).user, 'Assigned Classes', `${user.name}`);
  res.json(user);
});

app.get('/api/access-grants', requireAdmin, (req, res) => {
  const db = getDB();
  res.json(db.accessGrants);
});

app.get('/api/access-grants/student/:studentId', requireAdmin, (req, res) => {
  const studentId = req.params.studentId;
  const db = getDB();
  const grants = db.accessGrants.filter(g => g.studentId === studentId);
  res.json(grants);
});

// Save complete student Access Matrix
app.post('/api/access-grants/save', requireAdmin, (req, res) => {
  const { studentId, classIds, subjectIds, itemGrants } = req.body;
  
  if (!studentId) {
    res.status(400).json({ error: 'Student ID is required' });
    return;
  }

  const db = getDB();
  // Clear existing grants for this student
  db.accessGrants = db.accessGrants.filter(g => g.studentId !== studentId);

  // 1. Save Class Grants
  if (Array.isArray(classIds)) {
    classIds.forEach((cid: string) => {
      db.accessGrants.push({
        id: `g-${Date.now()}-${Math.round(Math.random() * 1000)}`,
        studentId,
        scope: 'class',
        targetId: cid
      });
    });
  }

  // 2. Save Subject Grants
  if (Array.isArray(subjectIds)) {
    subjectIds.forEach((sid: string) => {
      db.accessGrants.push({
        id: `g-${Date.now()}-${Math.round(Math.random() * 1000)}`,
        studentId,
        scope: 'subject',
        targetId: sid
      });
    });
  }

  // 3. Save Item level Grants (individual notes/videos)
  if (Array.isArray(itemGrants)) {
    itemGrants.forEach((item: { targetId: string; scope: 'item' }) => {
      db.accessGrants.push({
        id: `g-${Date.now()}-${Math.round(Math.random() * 1000)}`,
        studentId,
        scope: 'item',
        targetId: item.targetId
      });
    });
  }

  saveDB(db);
  const student = db.users.find(u => u.id === studentId);
  logAction((req as any).user, 'Updated Access Matrix', student ? student.name : studentId);
  res.json({ success: true, message: 'Access permissions saved successfully.' });
});

// ==================== ENGAGEMENT: QUIZZES MODULE ====================

app.get('/api/quizzes', requireAuth, (req, res) => {
  const db = getDB();
  res.json(db.quizzes);
});

app.post('/api/quizzes', requireAdmin, (req, res) => {
  const { chapterId, title, description, questions, timeLimit, xpReward } = req.body;
  if (!chapterId || !title || !questions || questions.length === 0) {
    res.status(400).json({ error: 'Chapter, Title, and Questions are required' });
    return;
  }
  const db = getDB();
  const newQuiz: Quiz = {
    id: 'quiz-' + Date.now(),
    chapterId,
    title,
    description: description || '',
    questions,
    timeLimit: Number(timeLimit) || 10,
    xpReward: Number(xpReward) || 50,
    createdAt: new Date().toISOString()
  };
  db.quizzes.push(newQuiz);
  saveDB(db);
  logAction((req as any).user, 'Created Quiz', title);
  res.json(newQuiz);
});

app.post('/api/quizzes/:id/submit', requireAuth, (req, res) => {
  const quizId = req.params.id;
  const { answers } = req.body; // Map of question index -> option index
  const user = (req as any).user;
  const db = getDB();

  const quiz = db.quizzes.find(q => q.id === quizId);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found' });
    return;
  }

  // Calculate score
  let score = 0;
  quiz.questions.forEach((q, idx) => {
    if (answers[q.id] === q.correctOptionIndex) {
      score++;
    }
  });

  const maxScore = quiz.questions.length;
  // XP rewarded on 100% completion or proportional
  const percentage = (score / maxScore) * 100;
  const xpEarned = Math.round((percentage / 100) * quiz.xpReward);

  // Update user stats
  const dbUser = db.users.find(u => u.id === user.id)!;
  dbUser.xp += xpEarned;
  // Dynamic Level Up math (100XP per level)
  const previousLevel = dbUser.level;
  dbUser.level = Math.floor(dbUser.xp / 100) + 1;

  const attempt: QuizAttempt = {
    id: 'attempt-' + Date.now(),
    quizId,
    studentId: user.id,
    answers,
    score,
    maxScore,
    xpEarned,
    completedAt: new Date().toISOString()
  };

  db.quizAttempts.push(attempt);

  // Record progress
  db.progress.push({
    id: 'prog-' + Date.now(),
    studentId: user.id,
    itemId: quizId,
    itemType: 'quiz',
    completedAt: new Date().toISOString(),
    xpEarned
  });

  saveDB(db);
  logAction(user, 'Submitted Quiz', `${quiz.title} (Score: ${score}/${maxScore})`);

  res.json({
    attempt,
    levelUp: dbUser.level > previousLevel,
    newLevel: dbUser.level,
    xpEarned
  });
});

app.get('/api/quizzes/attempts', requireAuth, (req, res) => {
  const user = (req as any).user;
  const db = getDB();
  if (user.role === 'admin') {
    res.json(db.quizAttempts);
  } else {
    res.json(db.quizAttempts.filter(a => a.studentId === user.id));
  }
});

app.delete('/api/quizzes/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const db = getDB();
  db.quizzes = db.quizzes.filter(q => q.id !== id);
  db.quizAttempts = db.quizAttempts.filter(a => a.quizId !== id);
  saveDB(db);
  logAction((req as any).user, 'Deleted Quiz', id);
  res.json({ success: true });
});

// ==================== ENGAGEMENT: ASSIGNMENTS MODULE ====================

app.get('/api/assignments', requireAuth, (req, res) => {
  const db = getDB();
  res.json(db.assignments);
});

app.post('/api/assignments', requireAdmin, (req, res) => {
  const { chapterId, title, description, dueDate, xpReward } = req.body;
  if (!chapterId || !title || !dueDate) {
    res.status(400).json({ error: 'Chapter, Title, and Due Date are required' });
    return;
  }
  const db = getDB();
  const newAssignment: Assignment = {
    id: 'assign-' + Date.now(),
    chapterId,
    title,
    description: description || '',
    dueDate,
    xpReward: Number(xpReward) || 100,
    createdAt: new Date().toISOString()
  };
  db.assignments.push(newAssignment);
  saveDB(db);
  logAction((req as any).user, 'Created Assignment', title);
  res.json(newAssignment);
});

app.delete('/api/assignments/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const db = getDB();
  db.assignments = db.assignments.filter(a => a.id !== id);
  db.submissions = db.submissions.filter(s => s.assignmentId !== id);
  saveDB(db);
  logAction((req as any).user, 'Deleted Assignment', id);
  res.json({ success: true });
});

app.post('/api/assignments/:id/submit', requireAuth, upload.single('file'), (req, res) => {
  const assignmentId = req.params.id;
  const user = (req as any).user;
  
  if (!req.file) {
    res.status(400).json({ error: 'File submission is required' });
    return;
  }

  const db = getDB();
  const assignment = db.assignments.find(a => a.id === assignmentId);
  if (!assignment) {
    res.status(404).json({ error: 'Assignment not found' });
    return;
  }

  // Remove previous submission if any
  db.submissions = db.submissions.filter(s => !(s.assignmentId === assignmentId && s.studentId === user.id));

  const submission: AssignmentSubmission = {
    id: 'sub-' + Date.now(),
    assignmentId,
    studentId: user.id,
    fileUrl: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    submittedAt: new Date().toISOString()
  };

  db.submissions.push(submission);
  saveDB(db);
  logAction(user, 'Submitted Assignment', assignment.title);
  res.json(submission);
});

app.get('/api/submissions', requireAuth, (req, res) => {
  const user = (req as any).user;
  const db = getDB();
  if (user.role === 'admin') {
    res.json(db.submissions);
  } else {
    res.json(db.submissions.filter(s => s.studentId === user.id));
  }
});

// Download student assignment file
app.get('/api/submissions/:id/file', requireAuth, (req, res) => {
  const submissionId = req.params.id;
  const user = (req as any).user;
  const db = getDB();

  const sub = db.submissions.find(s => s.id === submissionId);
  if (!sub) {
    res.status(404).json({ error: 'Submission not found' });
    return;
  }

  if (user.role !== 'admin' && sub.studentId !== user.id) {
    res.status(403).json({ error: 'Permission denied.' });
    return;
  }

  const filename = sub.fileUrl.replace('/uploads/', '');
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Submitted file not found.' });
    return;
  }

  res.setHeader('Content-Disposition', `attachment; filename="${sub.originalName}"`);
  res.sendFile(filePath);
});

app.post('/api/submissions/:id/grade', requireAdmin, (req, res) => {
  const subId = req.params.id;
  const { grade, feedback } = req.body;
  const db = getDB();

  const sub = db.submissions.find(s => s.id === subId);
  if (!sub) {
    res.status(404).json({ error: 'Submission not found' });
    return;
  }

  const assignment = db.assignments.find(a => a.id === sub.assignmentId);
  const rewardXp = assignment ? assignment.xpReward : 100;

  sub.grade = grade;
  sub.feedback = feedback || '';
  sub.xpEarned = rewardXp;

  // Credit student XP
  const student = db.users.find(u => u.id === sub.studentId);
  if (student) {
    student.xp += rewardXp;
    student.level = Math.floor(student.xp / 100) + 1;
  }

  // Record progress
  db.progress.push({
    id: 'prog-' + Date.now(),
    studentId: sub.studentId,
    itemId: sub.assignmentId,
    itemType: 'assignment',
    completedAt: new Date().toISOString(),
    xpEarned: rewardXp
  });

  saveDB(db);
  logAction((req as any).user, 'Graded Assignment', student ? `${student.name} - ${grade}` : subId);
  res.json(sub);
});

// ==================== ATTENDANCE TRACKING API ====================

app.get('/api/attendance', requireAuth, (req, res) => {
  const db = getDB();
  res.json(db.attendance);
});

app.post('/api/attendance', requireAdmin, (req, res) => {
  const { date, attendanceList } = req.body; // attendanceList: { studentId: string, status: 'present'|'absent' }[]
  if (!date || !attendanceList || !Array.isArray(attendanceList)) {
    res.status(400).json({ error: 'Date and Attendance list are required.' });
    return;
  }

  const db = getDB();
  // Clear records for this date
  db.attendance = db.attendance.filter(a => a.date !== date);

  attendanceList.forEach((att: { studentId: string; status: 'present' | 'absent' }) => {
    db.attendance.push({
      id: `att-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      date,
      studentId: att.studentId,
      status: att.status
    });
  });

  saveDB(db);
  logAction((req as any).user, 'Saved Attendance', date);
  res.json({ success: true });
});

// ==================== DISCUSSIONS API ====================

interface DiscussionComment {
  id: string;
  itemId: string; // note or video id
  userId: string;
  userName: string;
  userRole: string;
  text: string;
  isPinned: boolean;
  createdAt: string;
}

// Stored in db as dynamic array or custom JSON file
const COMMENTS_PATH = process.env.VERCEL
  ? path.join('/tmp', 'comments.json')
  : path.join(process.cwd(), 'comments.json');
function getComments(): DiscussionComment[] {
  if (!fs.existsSync(COMMENTS_PATH)) {
    fs.writeFileSync(COMMENTS_PATH, '[]');
  }
  return JSON.parse(fs.readFileSync(COMMENTS_PATH, 'utf-8'));
}
function saveComments(comments: DiscussionComment[]) {
  fs.writeFileSync(COMMENTS_PATH, JSON.stringify(comments, null, 2));
}

app.get('/api/discussions/:itemId', requireAuth, (req, res) => {
  const itemId = req.params.itemId;
  const comments = getComments().filter(c => c.itemId === itemId);
  res.json(comments);
});

app.post('/api/discussions/:itemId', requireAuth, (req, res) => {
  const itemId = req.params.itemId;
  const { text } = req.body;
  const user = (req as any).user;

  if (!text) {
    res.status(400).json({ error: 'Comment text cannot be empty' });
    return;
  }

  const comments = getComments();
  const newComment: DiscussionComment = {
    id: 'c-' + Date.now(),
    itemId,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    text,
    isPinned: false,
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  saveComments(comments);
  res.json(newComment);
});

app.post('/api/discussions/pin/:commentId', requireAdmin, (req, res) => {
  const commentId = req.params.commentId;
  const comments = getComments();
  const c = comments.find(com => com.id === commentId);
  if (c) {
    c.isPinned = !c.isPinned;
    saveComments(comments);
  }
  res.json({ success: true });
});

// ==================== BOOKMARKS API ====================

app.get('/api/bookmarks', requireAuth, (req, res) => {
  const user = (req as any).user;
  const db = getDB();
  const userBookmarks = db.bookmarks.filter(b => b.studentId === user.id);
  res.json(userBookmarks);
});

app.post('/api/bookmarks/toggle', requireAuth, (req, res) => {
  const { itemId, itemType } = req.body;
  const user = (req as any).user;
  const db = getDB();

  const index = db.bookmarks.findIndex(b => b.studentId === user.id && b.itemId === itemId);
  if (index !== -1) {
    db.bookmarks.splice(index, 1);
    saveDB(db);
    res.json({ bookmarked: false });
  } else {
    const b: Bookmark = {
      id: 'bmark-' + Date.now(),
      studentId: user.id,
      itemId,
      itemType,
      createdAt: new Date().toISOString()
    };
    db.bookmarks.push(b);
    saveDB(db);
    res.json({ bookmarked: true });
  }
});

// ==================== PROGRESS & TIMELINE API ====================

app.get('/api/progress', requireAuth, (req, res) => {
  const user = (req as any).user;
  const db = getDB();
  if (user.role === 'admin') {
    res.json(db.progress);
  } else {
    res.json(db.progress.filter(p => p.studentId === user.id));
  }
});

app.post('/api/progress/mark-done', requireAuth, (req, res) => {
  const { itemId, itemType, score, maxScore } = req.body;
  const user = (req as any).user;
  const db = getDB();

  // Prevent duplicate completion
  const alreadyCompleted = db.progress.some(p => p.studentId === user.id && p.itemId === itemId && p.itemType === itemType);
  if (alreadyCompleted) {
    res.json({ success: true, xpEarned: 0, message: 'Already marked as complete.' });
    return;
  }

  const xpReward = itemType === 'note' ? 25 : (itemType === 'mcq' ? 30 : 35); // 25 XP for note, 30 for mcq, 35 for video/other

  // Credit user XP
  const dbUser = db.users.find(u => u.id === user.id)!;
  dbUser.xp += xpReward;
  const previousLevel = dbUser.level;
  dbUser.level = Math.floor(dbUser.xp / 100) + 1;

  // Add progress entry
  db.progress.push({
    id: 'prog-' + Date.now(),
    studentId: user.id,
    itemId,
    itemType,
    completedAt: new Date().toISOString(),
    xpEarned: xpReward,
    score,
    maxScore
  });

  saveDB(db);
  logAction(user, 'Completed Content', `${itemType} - ${itemId}`);
  res.json({
    success: true,
    xpEarned: xpReward,
    levelUp: dbUser.level > previousLevel,
    newLevel: dbUser.level
  });
});

// ==================== TOP 3 STUDENTS / RANKINGS MODULE ====================

function seedSampleProgress(db: any) {
  const hamzaId = 'student-1';
  const tahaId = 'user-1783598099841-901';
  const aliId = 'user-1783601996553-344';

  const hamza = db.users.find((u: any) => u.id === hamzaId);
  const taha = db.users.find((u: any) => u.id === tahaId);
  const ali = db.users.find((u: any) => u.id === aliId);

  if (!hamza && !taha && !ali) return;

  console.log('[Seeder] Seeding initial mock progress for leaderboard demo...');

  const class1Subjects = db.subjects.filter((s: any) => s.classId === 'class-1');
  const class1Chaps = db.chapters.filter((c: any) => class1Subjects.some((s: any) => s.id === c.subjectId));
  const class1Notes = db.notes.filter((n: any) => class1Chaps.some((c: any) => c.id === n.chapterId));
  const class1Videos = db.videos.filter((v: any) => class1Chaps.some((c: any) => c.id === v.chapterId));
  const class1Quizzes = db.quizzes.filter((q: any) => class1Chaps.some((c: any) => c.id === q.chapterId));
  const class1Assignments = db.assignments.filter((a: any) => class1Chaps.some((c: any) => c.id === a.chapterId));

  const class3Subjects = db.subjects.filter((s: any) => s.classId === 'class-3');
  const class3Chaps = db.chapters.filter((c: any) => class3Subjects.some((s: any) => s.id === c.subjectId));
  const class3Notes = db.notes.filter((n: any) => class3Chaps.some((c: any) => c.id === n.chapterId));
  const class3Videos = db.videos.filter((v: any) => class3Chaps.some((c: any) => c.id === v.chapterId));
  const class3Quizzes = db.quizzes.filter((q: any) => class3Chaps.some((c: any) => c.id === q.chapterId));
  const class3Assignments = db.assignments.filter((a: any) => class3Chaps.some((c: any) => c.id === a.chapterId));

  const now = new Date().toISOString();

  // Hamza Noman: Completes Class-1 (All items) + Class-3 (All items)
  if (hamza) {
    const allClass1Items = [...class1Notes, ...class1Videos, ...class1Quizzes, ...class1Assignments];
    const allClass3Items = [...class3Notes, ...class3Videos, ...class3Quizzes, ...class3Assignments];
    
    [...allClass1Items, ...allClass3Items].forEach((item, idx) => {
      if (!db.progress.some((p: any) => p.studentId === hamzaId && p.itemId === item.id)) {
        db.progress.push({
          id: `prog-seed-hamza-${idx}`,
          studentId: hamzaId,
          itemId: item.id,
          itemType: item.dueDate ? 'assignment' : (item.questions ? 'quiz' : (item.fileType ? 'note' : 'video')),
          completedAt: now,
          xpEarned: 35
        });
      }
    });

    class1Quizzes.forEach((q: any, idx: number) => {
      if (!db.quizAttempts.some((qa: any) => qa.studentId === hamzaId && qa.quizId === q.id)) {
        db.quizAttempts.push({
          id: `attempt-seed-hamza-${idx}`,
          quizId: q.id,
          studentId: hamzaId,
          answers: { 1: 0, 2: 1, 3: 2 },
          score: q.questions.length,
          maxScore: q.questions.length,
          xpEarned: q.xpReward,
          completedAt: now
        });
      }
    });
  }

  // Taha: Completes Class-1 (All items) but NOT Class-3
  if (taha) {
    const allClass1Items = [...class1Notes, ...class1Videos, ...class1Quizzes, ...class1Assignments];
    allClass1Items.forEach((item, idx) => {
      if (!db.progress.some((p: any) => p.studentId === tahaId && p.itemId === item.id)) {
        db.progress.push({
          id: `prog-seed-taha-${idx}`,
          studentId: tahaId,
          itemId: item.id,
          itemType: item.dueDate ? 'assignment' : (item.questions ? 'quiz' : (item.fileType ? 'note' : 'video')),
          completedAt: now,
          xpEarned: 35
        });
      }
    });

    class1Quizzes.forEach((q: any, idx: number) => {
      if (!db.quizAttempts.some((qa: any) => qa.studentId === tahaId && qa.quizId === q.id)) {
        db.quizAttempts.push({
          id: `attempt-seed-taha-${idx}`,
          quizId: q.id,
          studentId: tahaId,
          answers: { 1: 0, 2: 0, 3: 0 },
          score: Math.max(1, q.questions.length - 1),
          maxScore: q.questions.length,
          xpEarned: Math.round(q.xpReward * 0.8),
          completedAt: now
        });
      }
    });
  }

  // ALI ASLAM: Completes 50% of Class-1
  if (ali) {
    const halfClass1Items = [...class1Notes, ...class1Videos].slice(0, Math.ceil(([...class1Notes, ...class1Videos].length) / 2));
    halfClass1Items.forEach((item, idx) => {
      if (!db.progress.some((p: any) => p.studentId === aliId && p.itemId === item.id)) {
        db.progress.push({
          id: `prog-seed-ali-${idx}`,
          studentId: aliId,
          itemId: item.id,
          itemType: item.fileType ? 'note' : 'video',
          completedAt: now,
          xpEarned: 25
        });
      }
    });

    class1Quizzes.slice(0, 1).forEach((q: any, idx: number) => {
      if (!db.quizAttempts.some((qa: any) => qa.studentId === aliId && qa.quizId === q.id)) {
        db.quizAttempts.push({
          id: `attempt-seed-ali-${idx}`,
          quizId: q.id,
          studentId: aliId,
          answers: { 1: 1, 2: 1, 3: 1 },
          score: Math.max(1, q.questions.length - 2),
          maxScore: q.questions.length,
          xpEarned: Math.round(q.xpReward * 0.6),
          completedAt: now
        });
      }
    });
  }

  saveDB(db);
}

function getRankingsData(db: any) {
  const students = db.users.filter((u: any) => u.role === 'student' && u.status !== 'suspended');
  
  const studentRankings = students.map((student: any) => {
    let classesCompleted = 0;
    const assignedClasses = student.assignedClasses || [];
    
    assignedClasses.forEach((classId: string) => {
      const classSubjects = db.subjects.filter((s: any) => s.classId === classId);
      if (classSubjects.length === 0) return;
      
      let totalItems = 0;
      let completedItems = 0;
      
      classSubjects.forEach((sub: any) => {
        const chaps = db.chapters.filter((c: any) => c.subjectId === sub.id);
        chaps.forEach((chap: any) => {
          const chapNotes = db.notes.filter((n: any) => n.chapterId === chap.id);
          const chapVideos = db.videos.filter((v: any) => v.chapterId === chap.id);
          const chapQuizzes = db.quizzes.filter((q: any) => q.chapterId === chap.id);
          const chapAssignments = db.assignments.filter((a: any) => a.chapterId === chap.id);
          
          totalItems += chapNotes.length + chapVideos.length + chapQuizzes.length + chapAssignments.length;
          
          const compNotes = chapNotes.filter((n: any) => db.progress.some((p: any) => p.studentId === student.id && p.itemId === n.id)).length;
          const compVideos = chapVideos.filter((v: any) => db.progress.some((p: any) => p.studentId === student.id && p.itemId === v.id)).length;
          const compQuizzes = chapQuizzes.filter((q: any) => db.progress.some((p: any) => p.studentId === student.id && p.itemId === q.id)).length;
          const compAssignments = chapAssignments.filter((a: any) => db.progress.some((p: any) => p.studentId === student.id && p.itemId === a.id)).length;
          
          completedItems += compNotes + compVideos + compQuizzes + compAssignments;
        });
      });
      
      if (totalItems > 0 && completedItems === totalItems) {
        classesCompleted++;
      }
    });

    const quizAttempts = db.quizAttempts.filter((qa: any) => qa.studentId === student.id);
    let totalCorrectAnswers = 0;
    let totalQuestionsCount = 0;
    
    quizAttempts.forEach((attempt: any) => {
      totalCorrectAnswers += attempt.score || 0;
      totalQuestionsCount += attempt.maxScore || 0;
    });

    const progressMcqs = db.progress.filter((p: any) => p.studentId === student.id && p.itemType === 'mcq' && p.score !== undefined);
    progressMcqs.forEach((pm: any) => {
      totalCorrectAnswers += pm.score || 0;
      totalQuestionsCount += pm.maxScore || 0;
    });

    const mcqPercentage = totalQuestionsCount > 0 ? Math.round((totalCorrectAnswers / totalQuestionsCount) * 100) : 0;
    
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      grNumber: student.grNumber,
      xp: student.xp || 0,
      level: student.level || 1,
      classesCompleted,
      mcqScore: totalCorrectAnswers,
      mcqPercentage
    };
  });

  studentRankings.sort((a: any, b: any) => {
    if (b.classesCompleted !== a.classesCompleted) {
      return b.classesCompleted - a.classesCompleted;
    }
    return b.mcqScore - a.mcqScore;
  });

  return studentRankings;
}

app.get('/api/students/rankings', requireAuth, (req, res) => {
  const db = getDB();
  
  // Seed sample data if quizAttempts are completely empty to make demo leaderboard beautiful
  if (!db.quizAttempts || db.quizAttempts.length === 0) {
    try {
      seedSampleProgress(db);
    } catch (e) {
      console.error('Failed to seed progress:', e);
    }
  }

  const rankings = getRankingsData(db);
  res.json({ rankings });
});

app.get('/api/student-stats', requireAuth, (req, res) => {
  const db = getDB();
  // Return students sorted by XP (leaderboard)
  const leaderboard = db.users
    .filter(u => u.role === 'student')
    .sort((a, b) => b.xp - a.xp)
    .map(u => ({
      id: u.id,
      name: u.name,
      xp: u.xp,
      level: u.level,
      grNumber: u.grNumber
    }));
  res.json({ leaderboard });
});

// ==================== ANNOUNCEMENTS API ====================

app.get('/api/announcements', requireAuth, (req, res) => {
  const db = getDB();
  res.json(db.announcements);
});

app.post('/api/announcements', requireAdmin, (req, res) => {
  const { title, body, category, urduTitle, urduContent } = req.body;
  if (!title || !body) {
    res.status(400).json({ error: 'Title and body are required' });
    return;
  }
  const db = getDB();
  const announcement: Announcement = {
    id: 'ann-' + Date.now(),
    title,
    body,
    createdAt: new Date().toISOString(),
    authorName: (req as any).user.name,
    category,
    urduTitle,
    urduContent
  };
  db.announcements.unshift(announcement); // newest first
  saveDB(db);
  logAction((req as any).user, 'Posted Announcement', title);
  res.json(announcement);
});

app.delete('/api/announcements/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const db = getDB();
  db.announcements = db.announcements.filter(a => a.id !== id);
  saveDB(db);
  logAction((req as any).user, 'Deleted Announcement', id);
  res.json({ success: true });
});

// ==================== TESTIMONIALS API ====================

const TESTIMONIALS_PATH = process.env.VERCEL
  ? path.join('/tmp', 'testimonials.json')
  : path.join(process.cwd(), 'testimonials.json');

function getTestimonials(): Testimonial[] {
  if (!fs.existsSync(TESTIMONIALS_PATH)) {
    fs.writeFileSync(TESTIMONIALS_PATH, '[]');
  }
  return JSON.parse(fs.readFileSync(TESTIMONIALS_PATH, 'utf-8'));
}

function saveTestimonials(testimonials: Testimonial[]) {
  fs.writeFileSync(TESTIMONIALS_PATH, JSON.stringify(testimonials, null, 2));
}

app.get('/api/testimonials', requireAuth, (req, res) => {
  const user = (req as any).user;
  const testimonials = getTestimonials();
  
  if (user.role === 'admin') {
    res.json(testimonials);
  } else {
    // Only return approved testimonials for students
    res.json(testimonials.filter(t => t.isApproved));
  }
});

app.post('/api/testimonials', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { rating, feedback } = req.body;

  if (!feedback) {
    res.status(400).json({ error: 'Feedback text is required' });
    return;
  }

  const db = getDB();
  const userClasses = db.classes
    .filter(c => user.assignedClasses.includes(c.id))
    .map(c => c.name)
    .join(', ') || 'General Student';

  const testimonials = getTestimonials();
  const newTestimonial: Testimonial = {
    id: 'tst-' + Date.now() + '-' + Math.round(Math.random() * 1000),
    studentId: user.id,
    studentName: user.name,
    studentClass: userClasses,
    rating: typeof rating === 'number' ? rating : 5,
    feedback,
    isApproved: user.role === 'admin', // Auto-approved if created by admin
    createdAt: new Date().toISOString()
  };

  testimonials.push(newTestimonial);
  saveTestimonials(testimonials);
  
  logAction(user, 'Submitted Feedback', newTestimonial.id);
  res.json(newTestimonial);
});

app.post('/api/testimonials/approve/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const testimonials = getTestimonials();
  const t = testimonials.find(item => item.id === id);
  if (!t) {
    res.status(404).json({ error: 'Testimonial not found' });
    return;
  }

  t.isApproved = true;
  saveTestimonials(testimonials);
  
  logAction((req as any).user, 'Approved Testimonial', id);
  res.json({ success: true, testimonial: t });
});

app.delete('/api/testimonials/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  let testimonials = getTestimonials();
  const exists = testimonials.some(item => item.id === id);
  if (!exists) {
    res.status(404).json({ error: 'Testimonial not found' });
    return;
  }

  testimonials = testimonials.filter(item => item.id !== id);
  saveTestimonials(testimonials);
  
  logAction((req as any).user, 'Deleted Testimonial', id);
  res.json({ success: true });
});

// ==================== AUDIT LOGS API ====================

app.get('/api/audit-logs', requireAdmin, (req, res) => {
  const db = getDB();
  res.json(db.auditLogs);
});

// ==================== GEMINI AI CHATBOT API ====================

app.post('/api/gemini/chat', requireAuth, async (req, res) => {
  const { messages, roleId } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  const selectedRole = roleId as BotRoleId;
  const botConfig = BOT_ROLES[selectedRole] || BOT_ROLES.academic_tutor;

  try {
    const ai = getGeminiClient();
    
    // Transform messages array from client format { sender: 'user'|'bot', text: string } 
    // to Gemini API format: { role: 'user'|'model', parts: [{ text: string }] }
    const formattedContents = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: botConfig.model,
      contents: formattedContents,
      config: {
        systemInstruction: botConfig.systemInstruction
      }
    });

    const replyText = response.text || "I apologize, but I could not formulate a response.";
    res.json({ text: replyText });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ 
      error: err.message || 'An error occurred while communicating with the Gemini AI service. Please verify your GEMINI_API_KEY settings.' 
    });
  }
});

// ==================== SUPABASE STATUS & SYNC API ====================

app.get('/api/supabase-status', (req, res) => {
  res.json({
    connected: supabaseStatus.connected,
    lastSync: supabaseStatus.lastSync,
    error: supabaseStatus.error,
    tableChecked: supabaseStatus.tableChecked,
    url: process.env.SUPABASE_URL || 'https://hxqmadzterpmdbveameg.supabase.co',
    projectId: 'hxqmadzterpmdbveameg'
  });
});

app.post('/api/supabase-sync', requireAdmin, async (req, res) => {
  const { direction } = req.body;
  try {
    if (direction === 'pull') {
      await syncWithSupabase();
      res.json({ success: true, message: 'Successfully fetched latest state from Supabase!', status: supabaseStatus });
    } else {
      const db = getDB();
      await saveToSupabase(db);
      res.json({ success: true, message: 'Successfully backed up local state to Supabase!', status: supabaseStatus });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Synchronization failed.' });
  }
});

// ==================== VITE DEVELOPMENT & PROD CONFIG ====================

async function startServer() {
  if (process.env.VERCEL) {
    // On Vercel, the express app is used solely as a serverless API handler.
    // Static file serving and SPA routing are handled natively by vercel.json rewrites.
    return;
  }

  // Sync with Supabase on boot
  console.log('Initializing Supabase synchronization...');
  syncWithSupabase().then(() => {
    runPasswordMigration();
  }).catch(err => {
    console.error('Error in startup Supabase sync:', err);
  });

  if (process.env.NODE_ENV !== 'production') {
    // Seed db if first time in dev mode
    getDB();
    
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving static files
    const distPath = path.join(process.cwd(), 'dist');
    
    // Ensure uploads directory is served statically for direct access
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
    app.use(express.static(distPath));
    
    // SPA Fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
