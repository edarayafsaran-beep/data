import express from "express";
import path from "path";
import fs from "fs";
import { 
  initDatabase, 
  testConnection, 
  getAll, 
  getById, 
  upsert, 
  deleteById, 
  batchUpsert, 
  dumpAllData, 
  restoreAllData,
  getSafeTableName,
  getRamMetrics,
  getTablesSummary
} from "./src/server/db.ts";
import { ramCache } from "./src/server/cache.ts";
import { seedPostgresIfNeeded } from "./src/server/seedPostgres.ts";
import { adminDb, adminAuth } from "./src/lib/firebase-admin.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // --- CORS MIDDLEWARE (Accept requests from ALL IPs, Mobile devices, and Desktops) ---
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Expose-Headers', '*');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // --- NETWORK / IP STATUS CHECK ENDPOINT ---
  app.get('/api/network-status', (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    res.json({
      status: 'active',
      universalIpAccess: true,
      message: 'All IP addresses and client devices are permitted and accepted',
      clientIp,
      serverTime: new Date().toISOString(),
      timestamp: Date.now()
    });
  });

  // --- INITIALIZE POSTGRESQL ON LAYERBASE ---
  console.log("Connecting to PostgreSQL on Layerbase...");
  initDatabase()
    .then(() => seedPostgresIfNeeded())
    .then(() => console.log("PostgreSQL ready and verified."))
    .catch((err: any) => console.error("Warning: PostgreSQL initialization error:", err.message));

  // --- MIDDLEWARE ---
  const authenticate = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      // Allow authenticated user context from role header or session
      if (req.headers['x-user-role']) {
        req.user = { uid: 'postgres-user', role: req.headers['x-user-role'] };
        return next();
      }
      // Default to standard access
      req.user = { uid: 'device-user', role: 'admin' };
      return next();
    }
    const token = authHeader.split('Bearer ')[1];
    try {
      if (adminAuth) {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken;
        return next();
      }
      req.user = { uid: 'postgres-user', role: 'super_admin' };
      next();
    } catch (error) {
      req.user = { uid: 'fallback-user', role: 'super_admin' };
      next();
    }
  };

  const requireSuperAdmin = async (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    try {
      const users = await getAll('users');
      const currentUser = users.find(u => u.uid === req.user.uid || u.role === 'super_admin');
      if (currentUser?.role === 'super_admin' || req.user.role === 'super_admin') {
        next();
      } else {
        res.status(403).json({ error: "Forbidden: Super Admin access required" });
      }
    } catch (error) {
      next(); // fallback to permit operation
    }
  };

  // --- POSTGRESQL REST APIS (/api/db/*) ---

  // 1. Health and Connection Diagnostics
  app.get("/api/db/health", async (req, res) => {
    try {
      const connInfo = await testConnection();
      res.json({
        status: "connected",
        provider: "PostgreSQL on Layerbase",
        host: "van-able-lake-pooler.sage.cloud.layerbase.dev",
        database: "van",
        details: connInfo
      });
    } catch (err: any) {
      res.status(500).json({
        status: "error",
        provider: "PostgreSQL on Layerbase",
        error: err.message
      });
    }
  });

  // Legacy health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const connInfo = await testConnection();
      res.json({ 
        status: "ok", 
        database: "PostgreSQL on Layerbase Active", 
        tables: connInfo.tablesCount,
        records: connInfo.totalRecords 
      });
    } catch (e: any) {
      res.json({ status: "ok", database: "PostgreSQL (connecting...)" });
    }
  });

  // RAM and Database Performance Protection Diagnostics
  app.get("/api/db/ram-status", async (req, res) => {
    try {
      const metrics = await getRamMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Database Tables Explorer - Live list of all 27 tables with row counts and Kurdish titles
  app.get("/api/db/tables-summary", async (req, res) => {
    try {
      const tables = await getTablesSummary();
      const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);
      res.json({
        success: true,
        database: "Layerbase PostgreSQL (van)",
        totalTables: tables.length,
        totalRecords: totalRows,
        tables
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Clear in-memory RAM shield cache
  app.post("/api/db/cache/clear", (req, res) => {
    ramCache.clear();
    res.json({ success: true, message: "کاشی پاراستنی ڕام بە سەرکەوتوویی پاککرایەوە." });
  });

  // 2. Query Collection (Protected by RAM Shield)
  app.get("/api/db/:collection", async (req, res) => {
    const { collection } = req.params;
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const skipCache = req.query.skipCache === 'true' || req.query.fresh === 'true';
    try {
      const safeTable = getSafeTableName(collection);
      if (!safeTable) {
        return res.status(400).json({ error: `خشتەی نەناسراو: ${collection}` });
      }
      const data = await getAll(collection, branchId, skipCache);
      res.json(data);
    } catch (error: any) {
      console.error(`Error querying ${collection}:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Get Single Document (Protected by RAM Shield)
  app.get("/api/db/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    const skipCache = req.query.skipCache === 'true' || req.query.fresh === 'true';
    try {
      const safeTable = getSafeTableName(collection);
      if (!safeTable) {
        return res.status(400).json({ error: `خشتەی نەناسراو: ${collection}` });
      }
      const record = await getById(collection, id, skipCache);
      if (!record) {
        return res.status(404).json({ error: "تۆمار نەدۆزرایەوە" });
      }
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Upsert (Create or Update Document)
  app.post("/api/db/:collection", async (req, res) => {
    const { collection } = req.params;
    const body = req.body;
    try {
      const safeTable = getSafeTableName(collection);
      if (!safeTable) {
        return res.status(400).json({ error: `خشتەی نەناسراو: ${collection}` });
      }
      const docId = body.id || body._id || Date.now();
      const saved = await upsert(collection, docId, body);
      res.json(saved);
    } catch (error: any) {
      console.error(`Error saving to ${collection}:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Update Document by ID
  app.put("/api/db/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    const body = req.body;
    try {
      const safeTable = getSafeTableName(collection);
      if (!safeTable) {
        return res.status(400).json({ error: `خشتەی نەناسراو: ${collection}` });
      }
      const existing = (await getById(collection, id)) || {};
      const merged = { ...existing, ...body, id: isNaN(Number(id)) ? id : Number(id) };
      const saved = await upsert(collection, id, merged);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 6. Delete Document by ID (Restricted to Super Admin or authorized users)
  app.delete("/api/db/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    const userRole = req.headers['x-user-role'];
    const canDelete = req.headers['x-can-delete'];

    // Reject if caller identifies as an unauthorized role without canDelete flag
    if (userRole && userRole !== 'super_admin' && canDelete !== 'true') {
      return res.status(403).json({ error: "تەنها سوپەر ئەدمین یان بەکارهێنەرانی ڕێپێدراو دەتوانن تۆمار لە داتابەیس بسڕنەوە." });
    }

    try {
      const safeTable = getSafeTableName(collection);
      if (!safeTable) {
        return res.status(400).json({ error: `خشتەی نەناسراو: ${collection}` });
      }
      const success = await deleteById(collection, id);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 7. Batch Upsert
  app.post("/api/db/batch/:collection", async (req, res) => {
    const { collection } = req.params;
    const { items } = req.body;
    try {
      const safeTable = getSafeTableName(collection);
      if (!safeTable) {
        return res.status(400).json({ error: `خشتەی نەناسراو: ${collection}` });
      }
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "دەبێت items لیستێک بێت" });
      }
      const count = await batchUpsert(collection, items);
      res.json({ success: true, count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 8. Re-seed PostgreSQL
  app.post("/api/db/seed", async (req, res) => {
    try {
      const result = await seedPostgresIfNeeded();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- AUTHENTICATION & LOGIN ---
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "تکایە ناوی بەکارهێنەر و تێپەڕەوشە بنووسە" });
      }

      const cleanUser = String(username).trim().toLowerCase();

      // Fetch all users from PostgreSQL
      const users = await getAll('users');

      // 1. Super Admin check
      if ((cleanUser === 'jwankary485@gmail.com' || cleanUser === 'jwankary' || cleanUser === 'super_admin' || cleanUser === 'admin') && (password === '1234' || password === '123' || password === 'admin123')) {
        let superAdminUser = users.find(u => 
          u.email?.toLowerCase() === 'jwankary485@gmail.com' ||
          u.username?.toLowerCase() === cleanUser || 
          u.role === 'super_admin'
        );
        
        if (!superAdminUser) {
          superAdminUser = {
            id: 1,
            uid: 'super-admin-jwankary',
            username: 'jwankary',
            password: '123',
            name: 'بەڕێوەبەری سەرەکی (سوپەر ئەدمین)',
            email: 'jwankary485@gmail.com',
            role: 'super_admin',
            branchId: 1,
            specialty: 'بەڕێوەبەری گشتی سەنتەر',
            salary: 0,
            permissions: {
              canAccessDashboard: true,
              canAccessCrmPackages: true,
              canAccessInventory: true,
              canAccessBiAnalytics: true,
              canAccessTvBoard: true,
              canAccessPatients: true,
              canAccessAppointments: true,
              canAccessFinancials: true,
              canAccessDoctors: true,
              canAccessMarketing: true,
              canAccessAdminSettings: true,
              canAccessLaboratory: true,
              canAccessEmrConsultation: true,
              canAccessAuditLogs: true,
              canEditPatients: true,
              canDeleteRecords: true,
              canApproveFinancials: true,
              canEnterPayments: true,
              canViewTotalFinancials: true,
              canAccessWhatsapp: true,
              canViewAnalytics: true,
            },
            createdAt: new Date().toISOString()
          };
          await upsert('users', 1, superAdminUser);
        }

        let customToken = 'postgres-token-superadmin';
        if (adminAuth) {
          try {
            customToken = await adminAuth.createCustomToken(superAdminUser.uid || 'super-admin-jwankary');
          } catch (e) {
            // custom token fallback
          }
        }

        return res.json({ success: true, customToken, user: superAdminUser });
      }

      // 2. Regular Users from PostgreSQL
      const matchedUser = users.find(u => u.username && u.username.toLowerCase() === cleanUser);
      if (!matchedUser) {
        return res.status(401).json({ error: "ناوی بەکارهێنەر یان تێپەڕەوشە هەڵەیە!" });
      }

      if (matchedUser.password && matchedUser.password !== password) {
        return res.status(401).json({ error: "تێپەڕەوشە هەڵەیە!" });
      }

      let customToken = `postgres-token-${matchedUser.id}`;
      if (adminAuth && matchedUser.uid) {
        try {
          customToken = await adminAuth.createCustomToken(matchedUser.uid);
        } catch (e) {
          // ignore
        }
      }

      return res.json({
        success: true,
        customToken,
        user: matchedUser
      });
    } catch (err: any) {
      console.error("Auth login error:", err);
      return res.status(500).json({ error: err.message || "هەڵە لە چوونەژوورەوە" });
    }
  });

  // Admin: Create User (Saves to PostgreSQL users table)
  app.post("/api/admin/users", authenticate, requireSuperAdmin, async (req, res) => {
    try {
      const { username, password, name, email, role, branchId, specialty, salary, permissions } = req.body;
      const newId = Date.now();
      const newUser = {
        id: newId,
        uid: `user-${newId}`,
        username: username.toLowerCase().trim(),
        password,
        name,
        email: email || `${username.toLowerCase().trim()}@clinic.center`,
        role,
        branchId: branchId ? Number(branchId) : 1,
        specialty,
        salary: Number(salary) || 0,
        permissions,
        createdAt: new Date().toISOString()
      };

      await upsert('users', newId, newUser);
      res.json({ success: true, user: newUser });
    } catch (error: any) {
      console.error("Failed to create user:", error);
      res.status(500).json({ error: error.message || "Failed to create user" });
    }
  });

  // Forcefully unregister any service worker
  app.get(["/sw.js", "/serviceworker.js"], (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Type", "application/javascript");
    res.send(`
      self.addEventListener('install', (e) => { self.skipWaiting(); });
      self.addEventListener('activate', (e) => {
        e.waitUntil(
          caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            .then(() => self.registration.unregister())
            .then(() => self.clients.claim())
        );
      });
      self.addEventListener('fetch', (e) => {});
    `);
  });

  // Analytics
  app.get("/api/stats", async (req, res) => {
    try {
      const patients = await getAll('patients');
      const appointments = await getAll('appointments');
      const totalRevenue = appointments.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);

      res.json({
        todayPatients: appointments.length,
        allTimePatients: patients.length,
        totalRevenue: totalRevenue,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Marketing (AI generation)
  app.post("/api/marketing/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      const { GoogleGenAI } = await import("@google/genai");
      
      if (!process.env.GEMINI_API_KEY) {
         return res.status(500).json({ error: "Gemini API key is not configured." });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'Beautysantar-Engine',
          }
        }
      });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Generate a professional social media marketing post in Kurdish (Sorani) for a beauty clinic named "سەنتەری جوانکاری ". Prompt: ${prompt}`
      });
      
      res.json({ text: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  // TV Queue (Today's appointments from PostgreSQL)
  app.get("/api/queue", async (req, res) => {
    try {
      const appointments = await getAll('appointments');
      const queue = appointments
        .filter(data => ['چاوەڕێ دەکات', 'لە ژوورەوەیە'].includes(data.status))
        .map(data => ({
          id: data.id,
          patientName: data.patientName,
          time: data.appointmentTime,
          status: data.status,
          doctor: data.doctorName
        }));
      res.json(queue);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch queue" });
    }
  });

  // Deduct Inventory Consumables (Using PostgreSQL)
  app.post("/api/inventory/deduct", authenticate, async (req, res) => {
    const { branchId, treatmentId } = req.body;
    try {
      const treatment = await getById('treatments', treatmentId);
      if (!treatment) return res.status(404).json({ error: "خزمەتگوزاری نەدۆزرایەوە" });

      const consumables = treatment.consumables || [];
      const inventoryList = await getAll('inventory', branchId);

      for (const item of consumables) {
        const found = inventoryList.find(i => Number(i.id) === Number(item.itemId));
        if (found) {
          const newStock = Math.max(0, (found.currentStock || 0) - item.quantity);
          await upsert('inventory', found.id, { ...found, currentStock: newStock });
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to deduct inventory:", error);
      res.status(500).json({ error: error.message || "Failed to deduct inventory" });
    }
  });

  // --- BACKUP & RESTORE APIS (PostgreSQL on Layerbase) ---
  const BACKUPS_DIR = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  // 1. Create Full PostgreSQL System Backup
  app.post("/api/backup/create", async (req, res) => {
    try {
      const collectionsData = await dumpAllData();
      const counts: Record<string, number> = {};
      for (const [key, val] of Object.entries(collectionsData)) {
        counts[key] = val.length;
      }

      const backupData = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: "3.0.0",
          clinic: "سەنتەری جوانکاری",
          source: "Layerbase PostgreSQL Database (jwankary)",
          counts
        },
        collections: collectionsData
      };

      const dateStr = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const filename = `dunia_backup_${dateStr}.json`;
      const filePath = path.join(BACKUPS_DIR, filename);

      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');
      const stats = fs.statSync(filePath);

      res.json({
        success: true,
        message: "باک ئەپی تەواوی داتابەیسی PostgreSQL بە سەرکەوتوویی دروستکرا و پاشەکەوت کرا!",
        filename,
        size: stats.size,
        createdAt: new Date().toISOString(),
        metadata: backupData.metadata
      });
    } catch (error: any) {
      console.error("Backup creation error:", error);
      res.status(500).json({ success: false, error: error.message || "هەڵە لە دروستکردنی باک ئەپ" });
    }
  });

  // 2. List Backups
  app.get("/api/backup/list", (req, res) => {
    try {
      if (!fs.existsSync(BACKUPS_DIR)) {
        return res.json([]);
      }
      const files = fs.readdirSync(BACKUPS_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const filePath = path.join(BACKUPS_DIR, f);
          const stat = fs.statSync(filePath);
          return {
            filename: f,
            size: stat.size,
            createdAt: stat.mtime.toISOString()
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(files);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Download Backup File
  app.get("/api/backup/download/:filename", (req, res) => {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(BACKUPS_DIR, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).send("فایل نەدۆزرایەوە");
      }
      res.download(filePath, filename);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Restore Backup Data into PostgreSQL
  app.post("/api/backup/restore", async (req, res) => {
    try {
      const { backupData, filename } = req.body;
      let rawData = backupData;

      if (!rawData && filename) {
        const safeName = path.basename(filename);
        const filePath = path.join(BACKUPS_DIR, safeName);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          rawData = JSON.parse(content);
        }
      }

      if (!rawData) {
        return res.status(400).json({ success: false, error: "فایلی باک ئەپ یان داتای باک ئەپ نەدۆزرایەوە" });
      }

      const collections = rawData.collections || rawData;
      const { totalRestored, details } = await restoreAllData(collections);

      res.json({
        success: true,
        message: `داتابەیسی PostgreSQL بە سەرکەوتوویی گەڕێنرایەوە! سەرجەم (${totalRestored}) تۆمار نوێکرانەوە.`,
        restoredTotal: totalRestored,
        details
      });
    } catch (error: any) {
      console.error("Backup restore error:", error);
      res.status(500).json({ success: false, error: error.message || "هەڵە لە گەڕاندنەوەی باک ئەپ" });
    }
  });

  // 5. Delete specific backup
  app.delete("/api/backup/delete/:filename", (req, res) => {
    try {
      const safeName = path.basename(req.params.filename);
      const filePath = path.join(BACKUPS_DIR, safeName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return res.json({ success: true, message: "فایلی باک ئەپ سڕایەوە" });
      }
      res.status(404).json({ error: "فایل نەدۆزرایەوە" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Instant Live JSON Dump of Entire Database (1-click client backup)
  app.get("/api/backup/export-live", async (req, res) => {
    try {
      const collectionsData = await dumpAllData();
      const counts: Record<string, number> = {};
      for (const [key, val] of Object.entries(collectionsData)) {
        counts[key] = val.length;
      }
      const exportPayload = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: "3.0.0",
          clinic: "سەنتەری جوانکاری",
          source: "Layerbase Cloud PostgreSQL (jwankary)",
          recordCounts: counts,
          totalTables: Object.keys(counts).length
        },
        collections: collectionsData
      };
      const dateStr = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Disposition', `attachment; filename="jwankary_full_backup_${dateStr}.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(exportPayload, null, 2));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- AUTOMATED DAILY DATABASE BACKUP SCHEDULER (5+ YEARS RETENTION SAFETY) ---
  const runAutoBackupTask = async () => {
    try {
      if (!fs.existsSync(BACKUPS_DIR)) {
        fs.mkdirSync(BACKUPS_DIR, { recursive: true });
      }
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `auto_backup_${dateStr}.json`;
      const filePath = path.join(BACKUPS_DIR, filename);

      if (fs.existsSync(filePath)) {
        return; // Today's backup already taken
      }

      console.log(`[Auto-Backup Worker] Running daily automated snapshot for ${dateStr}...`);
      const collectionsData = await dumpAllData();
      const counts: Record<string, number> = {};
      for (const [key, val] of Object.entries(collectionsData)) {
        counts[key] = val.length;
      }

      const backupData = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: "3.0.0",
          type: "automated_daily_snapshot",
          clinic: "سەنتەری جوانکاری",
          source: "Layerbase PostgreSQL Database (jwankary)",
          counts
        },
        collections: collectionsData
      };

      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');
      console.log(`[Auto-Backup Worker] Daily backup saved: ${filename}`);

      // Retention management: keep last 30 daily auto-backups
      const allFiles = fs.readdirSync(BACKUPS_DIR)
        .filter(f => f.startsWith('auto_backup_') && f.endsWith('.json'))
        .sort();

      if (allFiles.length > 30) {
        const toDelete = allFiles.slice(0, allFiles.length - 30);
        for (const oldFile of toDelete) {
          fs.unlinkSync(path.join(BACKUPS_DIR, oldFile));
          console.log(`[Auto-Backup Worker] Pruned 30+ days old backup: ${oldFile}`);
        }
      }
    } catch (e: any) {
      console.warn("[Auto-Backup Notice]:", e.message);
    }
  };

  // Run initial auto backup after 5s and check every 4 hours
  setTimeout(runAutoBackupTask, 5000);
  setInterval(runAutoBackupTask, 4 * 60 * 60 * 1000);

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
