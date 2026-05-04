import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Initialization
const db = new Database('naac_system.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('TEACHER', 'HOD')),
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT
  );

  CREATE TABLE IF NOT EXISTS criteria_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    criterionType TEXT NOT NULL, -- e.g., 'C1', 'C2'... 'C7'
    subCriterionId TEXT NOT NULL, -- e.g., '1.1.1'
    data TEXT NOT NULL, -- JSON string
    status TEXT DEFAULT 'SUBMITTED' CHECK(status IN ('SUBMITTED', 'APPROVED', 'REVISION', 'PENDING')),
    comments TEXT,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

// Migration for users table to add email verification columns
try {
  const columns = db.prepare("PRAGMA table_info(users)").all() as any[];
  const hasIsVerified = columns.some(c => c.name === 'is_verified');
  if (!hasIsVerified) {
    console.log('Adding is_verified and verification_token columns to users table...');
    db.prepare("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0").run();
    db.prepare("ALTER TABLE users ADD COLUMN verification_token TEXT").run();
    // Mark existing users as verified
    db.prepare("UPDATE users SET is_verified = 1").run();
  }
} catch (err) {
  console.error('User migration failed:', err);
}

// Migration for existing databases that might have different CHECK constraints
try {
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='criteria_data'").get() as any;
  if (tableInfo && !tableInfo.sql.includes('SUBMITTED')) {
    console.log('Migrating criteria_data table...');
    db.transaction(() => {
      // 1. Create a temporary table with the correct schema
      db.exec(`
        CREATE TABLE criteria_data_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          criterionType TEXT NOT NULL,
          subCriterionId TEXT NOT NULL,
          data TEXT NOT NULL,
          status TEXT DEFAULT 'SUBMITTED' CHECK(status IN ('SUBMITTED', 'APPROVED', 'REVISION', 'PENDING')),
          comments TEXT,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(userId) REFERENCES users(id)
        );
      `);
      // 2. Copy data, mapping PENDING to SUBMITTED if needed
      db.exec(`
        INSERT INTO criteria_data_new (id, userId, criterionType, subCriterionId, data, status, comments, updatedAt)
        SELECT id, userId, criterionType, subCriterionId, data, 
               CASE WHEN status = 'PENDING' THEN 'SUBMITTED' ELSE status END, 
               comments, updatedAt 
        FROM criteria_data;
      `);
      // 3. Drop old table and rename new one
      db.exec("DROP TABLE criteria_data;");
      db.exec("ALTER TABLE criteria_data_new RENAME TO criteria_data;");
    })();
    console.log('Migration completed successfully.');
  }
} catch (err) {
  console.error('Migration failed:', err);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    filename TEXT NOT NULL,
    originalName TEXT NOT NULL,
    mimeType TEXT NOT NULL,
    size INTEGER NOT NULL,
    criterionType TEXT NOT NULL,
    subCriterionId TEXT NOT NULL,
    status TEXT DEFAULT 'UPLOADED' CHECK(status IN ('UPLOADED', 'PENDING', 'VERIFIED')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

// Authentication Secret
const JWT_SECRET = process.env.JWT_SECRET || 'naac-system-secret-key-default';

// Seed Initial Users
async function seedUsers() {
  const users = [
    { email: 'teacher@university.edu', password: 'password123', name: 'Dr. Sarah Wilson', role: 'TEACHER', department: 'Computer Science', is_verified: 1 },
    { email: 'hod@university.edu', password: 'password123', name: 'Prof. James Miller', role: 'HOD', department: 'Computer Science', is_verified: 1 }
  ];

  for (const user of users) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email);
    if (!existing) {
      console.log(`Seeding user: ${user.email}`);
      const hashedPassword = await bcrypt.hash(user.password, 10);
      db.prepare('INSERT INTO users (email, password, name, role, department, is_verified) VALUES (?, ?, ?, ?, ?, ?)')
        .run(user.email, hashedPassword, user.name, user.role, user.department, user.is_verified);
    }
  }
}

// Multer Setup for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, JPG, and PNG are allowed.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure default users exist
  await seedUsers();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Ensure uploads directory exists
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });
      req.user = user;
      next();
    });
  };

  // Roles Middleware
  const authorizeRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };

  // API ROUTES

  // Auth - Signup
  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, name, role, department } = req.body;
    console.log(`[SIGNUP] Attempt for email: ${email}, role: ${role}`);
    try {
      if (!email || !password || !name || !role || !department) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const stmt = db.prepare('INSERT INTO users (email, password, name, role, department, is_verified) VALUES (?, ?, ?, ?, ?, ?)');
      const info = stmt.run(email, hashedPassword, name, role, department, 1);
      
      const userId = Number(info.lastInsertRowid);
      const token = jwt.sign({ id: userId, email, role, name, department }, JWT_SECRET);
      
      console.log(`[SIGNUP] Success for user ID: ${userId}`);
      res.status(201).json({ token, user: { id: userId, email, name, role, department } });
    } catch (error: any) {
      console.error('[SIGNUP] Error:', error);
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Institutional email is already registered' });
      }
      res.status(400).json({ error: 'Invalid data provided or system error' });
    }
  });

  // Auth - Login
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name, department: user.department }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department } });
  });

  // Criteria Data
  app.get('/api/criteria/all', authenticateToken, (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = db.prepare('SELECT * FROM criteria_data WHERE userId = ?').all(userId);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch all criteria data' });
    }
  });

  app.get('/api/criteria/:criterionType', authenticateToken, (req: any, res) => {
    try {
      const { criterionType } = req.params;
      const userId = req.user.id;
      
      let query = 'SELECT * FROM criteria_data WHERE criterionType = ?';
      let params: any[] = [criterionType];

      if (req.user.role === 'TEACHER') {
        query += ' AND userId = ?';
        params.push(userId);
      }

      const data = db.prepare(query).all(...params);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch criteria data' });
    }
  });

  app.post('/api/criteria/save', authenticateToken, (req: any, res) => {
    try {
      const { criterionType, subCriterionId, data, status: requestedStatus } = req.body;
      const userId = req.user.id;
      const status = requestedStatus || 'SUBMITTED';
      console.log(`[SAVE] User ${userId} saving ${criterionType} - ${subCriterionId} with status ${status}`);

      const existing: any = db.prepare('SELECT id FROM criteria_data WHERE userId = ? AND subCriterionId = ? AND criterionType = ?')
        .get(userId, subCriterionId, criterionType);

      if (existing) {
        console.log(`[SAVE] Updating existing record ${existing.id}`);
        db.prepare('UPDATE criteria_data SET data = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
          .run(JSON.stringify(data), status, existing.id);
      } else {
        console.log(`[SAVE] Creating new record`);
        db.prepare('INSERT INTO criteria_data (userId, criterionType, subCriterionId, data, status) VALUES (?, ?, ?, ?, ?)')
          .run(userId, criterionType, subCriterionId, JSON.stringify(data), status);
      }

      // Audit Log
      db.prepare('INSERT INTO audit_logs (userId, action, details) VALUES (?, ?, ?)')
        .run(userId, 'SAVE_CRITERIA', `Saved data for ${criterionType} - ${subCriterionId}`);

      console.log(`[SAVE] Success`);
      res.json({ success: true });
    } catch (err) {
      console.error('[SAVE] Error:', err);
      res.status(500).json({ error: 'Failed to save criteria data' });
    }
  });

  // File Management
  app.post('/api/files/upload', authenticateToken, upload.single('file'), (req: any, res) => {
    const { criterionType, subCriterionId } = req.body;
    const userId = req.user.id;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const stmt = db.prepare('INSERT INTO uploads (userId, filename, originalName, mimeType, size, criterionType, subCriterionId) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(userId, file.filename, file.originalname, file.mimetype, file.size, criterionType, subCriterionId);

    // Audit Log
    db.prepare('INSERT INTO audit_logs (userId, action, details) VALUES (?, ?, ?)')
      .run(userId, 'UPLOAD_FILE', `Uploaded file: ${file.originalname} for ${criterionType}`);

    res.json({ 
      success: true, 
      id: info.lastInsertRowid,
      filename: file.filename,
      originalName: file.originalname
    });
  });

  app.get('/api/files', authenticateToken, (req: any, res) => {
    const userId = req.user.id;
    const department = req.user.department;
    let query = 'SELECT * FROM uploads';
    let params: any[] = [];

    if (req.user.role === 'TEACHER') {
      query += ' WHERE userId = ?';
      params.push(userId);
    } else if (req.user.role === 'HOD') {
      query = 'SELECT up.* FROM uploads up JOIN users u ON up.userId = u.id WHERE u.department = ?';
      params.push(department);
    }

    const files = db.prepare(query).all(...params);
    res.json(files);
  });

  // Serve files securely
  app.get('/api/files/download/:id', authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const file: any = db.prepare('SELECT * FROM uploads WHERE id = ?').get(id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    if (req.user.role !== 'HOD' && file.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.join(__dirname, 'uploads', file.filename);
    if (fs.existsSync(filePath)) {
      res.download(filePath, file.originalName);
    } else {
      res.status(404).json({ error: 'Physical file not found' });
    }
  });

  // HOD Specific Routes
  app.get('/api/hod/teachers', authenticateToken, authorizeRole(['HOD']), (req: any, res) => {
    const department = req.user.department;
    const teachers = db.prepare("SELECT id, name, email, department FROM users WHERE role = 'TEACHER' AND department = ?").all(department);
    
    // Add completion status for each teacher
    const teachersWithStatus = teachers.map((teacher: any) => {
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
          MAX(updatedAt) as lastActivity
        FROM criteria_data 
        WHERE userId = ?
      `).get(teacher.id) as any;
      
      const criterionDetails = db.prepare(`
        SELECT criterionType, status FROM criteria_data WHERE userId = ?
      `).all(teacher.id);
      
      return { ...teacher, stats, criterionDetails };
    });

    res.json(teachersWithStatus);
  });

  app.post('/api/hod/remind', authenticateToken, authorizeRole(['HOD']), (req: any, res) => {
    const { teacherId, message } = req.body;
    const userId = req.user.id;
    const department = req.user.department;

    // Verify teacher belongs to HOD's department
    const teacher = db.prepare('SELECT department FROM users WHERE id = ?').get(teacherId) as any;
    if (!teacher || teacher.department !== department) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // In a real app, this would send an email/notification.
    // For now, we'll log it in the audit trail.
    db.prepare('INSERT INTO audit_logs (userId, action, details) VALUES (?, ?, ?)')
      .run(userId, 'SEND_REMINDER', `Reminder sent to teacher ${teacherId}: ${message}`);

    res.json({ success: true, message: 'Reminder sent' });
  });

  app.get('/api/hod/teacher-data/:teacherId', authenticateToken, authorizeRole(['HOD']), (req: any, res) => {
    try {
      const { teacherId } = req.params;
      const { criterionType } = req.query;
      const department = req.user.department;

      // Verify teacher belongs to HOD's department
      const teacher = db.prepare('SELECT department FROM users WHERE id = ?').get(teacherId) as any;
      if (!teacher || teacher.department !== department) {
        return res.status(403).json({ error: 'Access denied: Teacher belongs to a different department' });
      }
      
      let query = 'SELECT * FROM criteria_data WHERE userId = ?';
      let params = [Number(teacherId)];

      if (criterionType) {
        query += ' AND criterionType = ?';
        params.push(criterionType as any);
      }

      const data = db.prepare(query).all(...params);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/hod/verify', authenticateToken, authorizeRole(['HOD']), (req: any, res) => {
    try {
      const { dataId, status, comments } = req.body;
      const userId = req.user.id;

      db.prepare('UPDATE criteria_data SET status = ?, comments = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
        .run(status, comments, dataId);

      // Audit Log
      db.prepare('INSERT INTO audit_logs (userId, action, details) VALUES (?, ?, ?)')
        .run(userId, 'VERIFY_SUBMISSION', `Verified submission ID ${dataId} as ${status}`);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/hod/stats', authenticateToken, authorizeRole(['HOD']), (req: any, res) => {
    const department = req.user.department;
    
    const totalTeachers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'TEACHER' AND department = ?").get(department) as any;
    const teachersStarted = db.prepare(`
      SELECT COUNT(DISTINCT userId) as count 
      FROM criteria_data 
      WHERE userId IN (SELECT id FROM users WHERE role = 'TEACHER' AND department = ?)
    `).get(department) as any;
    
    const totalFiles = db.prepare(`
      SELECT COUNT(*) as count FROM uploads 
      WHERE userId IN (SELECT id FROM users WHERE department = ?)
    `).get(department) as any;
    
    const pendingVerifications = db.prepare(`
      SELECT COUNT(*) as count FROM criteria_data 
      WHERE status = 'SUBMITTED' 
      AND userId IN (SELECT id FROM users WHERE department = ?)
    `).get(department) as any;
    
    const criterionStats = db.prepare(`
      SELECT criterionType, COUNT(*) as count, SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved
      FROM criteria_data
      WHERE userId IN (SELECT id FROM users WHERE department = ?)
      GROUP BY criterionType
    `).all(department);

    res.json({
      totalTeachers: totalTeachers.count,
      teachersStarted: teachersStarted.count,
      totalFiles: totalFiles.count,
      pendingVerifications: pendingVerifications.count,
      criterionStats
    });
  });

  app.get('/api/hod/audit-logs', authenticateToken, authorizeRole(['HOD']), (req: any, res) => {
    const department = req.user.department;
    const logs = db.prepare(`
      SELECT a.*, u.name as userName 
      FROM audit_logs a 
      JOIN users u ON a.userId = u.id 
      WHERE u.department = ? OR a.details LIKE ?
      ORDER BY a.timestamp DESC 
      LIMIT 100
    `).all(department, `%department: ${department}%`); // This is a bit loose but audit logs should ideally be filtered correctly
    res.json(logs);
  });

  // Consolidation for Export
  app.get('/api/hod/consolidated-data', authenticateToken, authorizeRole(['HOD']), (req: any, res) => {
    const department = req.user.department;
    const allData = db.prepare(`
      SELECT c.*, u.name as teacherName, u.department 
      FROM criteria_data c 
      JOIN users u ON c.userId = u.id
      WHERE u.department = ?
    `).all(department);
    res.json(allData);
  });

  // Teacher specific stats
  app.get('/api/teacher/stats', authenticateToken, authorizeRole(['TEACHER']), (req: any, res) => {
    const userId = req.user.id;
    const stats = db.prepare(`
      SELECT criterionType, COUNT(*) as count, SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved
      FROM criteria_data
      WHERE userId = ?
      GROUP BY criterionType
    `).all(userId);

    const totalFiles = db.prepare('SELECT COUNT(*) as count FROM uploads WHERE userId = ?').get(userId) as any;

    const recentActivity = db.prepare(`
      SELECT * FROM audit_logs WHERE userId = ? ORDER BY timestamp DESC LIMIT 5
    `).all(userId);

    res.json({ 
      stats, 
      totalFiles: totalFiles.count,
      recentActivity 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Server Error:', err);
    res.status(err.status || 500).json({ 
      error: err.message || 'Internal Server Error' 
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
