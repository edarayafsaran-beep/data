const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const DEFAULT_DATABASE_URL = "postgresql://postgres:VARrUP1de0MZaBqevGejQtpd@van-able-lake-pooler.sage.cloud.layerbase.dev/van?sslmode=require";
const connectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on("error", (err) => {
  console.warn("[Layerbase Pool Warning]:", err.message);
});

const TABLE_MAP = {
  branches: "branches",
  users: "users",
  patients: "patients",
  appointments: "appointments",
  treatments: "treatments",
  rooms: "rooms",
  expenses: "expenses",
  inventory: "inventory",
  whatsappLogs: "whatsapp_logs",
  whatsapp_logs: "whatsapp_logs",
  campaigns: "campaigns",
  treatmentPackages: "treatment_packages",
  treatment_packages: "treatment_packages",
  membershipTiers: "membership_tiers",
  membership_tiers: "membership_tiers",
  patientComplaints: "patient_complaints",
  patient_complaints: "patient_complaints",
  systemAuditLogs: "system_audit_logs",
  system_audit_logs: "system_audit_logs",
  labTests: "lab_tests",
  lab_tests: "lab_tests",
  prescriptions: "prescriptions",
  cashBoxes: "cash_boxes",
  cash_boxes: "cash_boxes",
  bankAccounts: "bank_accounts",
  bank_accounts: "bank_accounts",
  fixedAssets: "fixed_assets",
  fixed_assets: "fixed_assets",
  employeePayroll: "employee_payroll",
  employee_payroll: "employee_payroll",
  employeeBonuses: "employee_bonuses",
  employee_bonuses: "employee_bonuses",
  financialAuditLogs: "financial_audit_logs",
  financial_audit_logs: "financial_audit_logs",
  staffAttendance: "staff_attendance",
  staff_attendance: "staff_attendance",
  staffLeaveRequests: "staff_leave_requests",
  staff_leave_requests: "staff_leave_requests",
  workShiftConfigs: "work_shift_configs",
  work_shift_configs: "work_shift_configs",
  systemSettings: "system_settings",
  system_settings: "system_settings",
  customFormFields: "custom_form_fields",
  custom_form_fields: "custom_form_fields"
};

function getSafeTableName(col) {
  return TABLE_MAP[col] || null;
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "25mb" }));

// Normalize request URL for Firebase Hosting rewrites
app.use((req, res, next) => {
  if (req.url && !req.url.startsWith("/api")) {
    req.url = "/api" + req.url;
  }
  next();
});

// 1. Health check
app.get(["/api/db/health", "/api/health"], async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT NOW() as server_time, version() as pg_version");
      const tablesRes = await client.query("SELECT count(*) as tables_count FROM information_schema.tables WHERE table_schema = 'public'");
      res.json({
        status: "connected",
        provider: "Layerbase Cloud PostgreSQL via Firebase Cloud Function",
        host: "van-able-lake-pooler.sage.cloud.layerbase.dev",
        database: "van",
        details: {
          ok: true,
          serverTime: result.rows[0].server_time,
          version: result.rows[0].pg_version,
          tablesCount: parseInt(tablesRes.rows[0]?.tables_count || "0", 10)
        }
      });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({
      status: "error",
      provider: "Layerbase Cloud PostgreSQL",
      error: err.message
    });
  }
});

// Network status
app.get("/api/network-status", (req, res) => {
  res.json({
    status: "active",
    universalIpAccess: true,
    serverTime: new Date().toISOString(),
    cloudBridge: "Firebase Functions -> Layerbase PostgreSQL"
  });
});

// 2. Query Collection
app.get("/api/db/:collection", async (req, res) => {
  const { collection } = req.params;
  const branchId = req.query.branchId ? String(req.query.branchId) : undefined;
  const table = getSafeTableName(collection);

  if (!table) {
    return res.status(400).json({ error: `خشتەی نەناسراو: ${collection}` });
  }

  try {
    let queryText = `SELECT * FROM "${table}"`;
    const params = [];

    if (branchId !== undefined && table !== "branches") {
      queryText += ` WHERE (branch_id::text = $1 OR data->>'branchId' = $1 OR data->>'branch_id' = $1)`;
      params.push(branchId);
    }
    queryText += ` ORDER BY id ASC`;

    const result = await pool.query(queryText, params);
    const data = result.rows.map((row) => {
      const rawData = row.data || {};
      const finalId = row.id !== undefined && row.id !== null
        ? (isNaN(Number(row.id)) ? row.id : Number(row.id))
        : (row.uid || rawData.id);
      const finalBranchId = row.branch_id !== undefined && row.branch_id !== null
        ? (isNaN(Number(row.branch_id)) ? row.branch_id : Number(row.branch_id))
        : (rawData.branchId ?? null);
      return {
        ...row,
        ...rawData,
        id: finalId,
        branchId: finalBranchId
      };
    });

    res.json(data);
  } catch (error) {
    console.error(`Error querying ${collection}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Single Document
app.get("/api/db/:collection/:id", async (req, res) => {
  const { collection, id } = req.params;
  const table = getSafeTableName(collection);

  if (!table) return res.status(400).json({ error: `خشتەی نەناسراو: ${collection}` });

  try {
    const strId = String(id);
    const result = await pool.query(
      `SELECT * FROM "${table}" WHERE (id = $1 OR uid = $1 OR (data->>'id') = $1 OR (data->>'uid') = $1) LIMIT 1`,
      [strId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "تۆمار نەدۆزرایەوە" });
    }

    const row = result.rows[0];
    const rawData = row.data || {};
    const finalId = row.id !== undefined && row.id !== null
      ? (isNaN(Number(row.id)) ? row.id : Number(row.id))
      : (row.uid || rawData.id);

    res.json({
      ...row,
      ...rawData,
      id: finalId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Upsert (Save/Insert Document)
app.post("/api/db/:collection", async (req, res) => {
  const { collection } = req.params;
  const body = req.body;
  const table = getSafeTableName(collection);

  if (!table) return res.status(400).json({ error: `خشتەی نەناسراو: ${collection}` });

  try {
    const strId = String(body.id || body._id || Date.now());
    const branchId = body.branchId !== undefined && body.branchId !== null
      ? String(body.branchId)
      : (body.branch_id ? String(body.branch_id) : null);

    const payload = { ...body, id: isNaN(Number(strId)) ? strId : Number(strId) };
    const uidVal = payload.uid || payload.username || strId;
    const isUsers = table === "users";

    const queryText = isUsers
      ? `
        INSERT INTO "${table}" (id, uid, branch_id, data, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (id) DO UPDATE SET
          uid = EXCLUDED.uid,
          branch_id = EXCLUDED.branch_id,
          data = EXCLUDED.data,
          updated_at = NOW()
        RETURNING *;
      `
      : `
        INSERT INTO "${table}" (id, branch_id, data, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (id) DO UPDATE SET
          branch_id = EXCLUDED.branch_id,
          data = EXCLUDED.data,
          updated_at = NOW()
        RETURNING *;
      `;

    const queryParams = isUsers
      ? [strId, uidVal, branchId, JSON.stringify(payload)]
      : [strId, branchId, JSON.stringify(payload)];

    const result = await pool.query(queryText, queryParams);
    const row = result.rows[0];
    const rawData = row.data || {};
    res.json({
      ...row,
      ...rawData,
      id: isNaN(Number(strId)) ? strId : Number(strId)
    });
  } catch (error) {
    console.error(`Error saving to ${collection}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// 5. Update Document
app.put("/api/db/:collection/:id", async (req, res) => {
  const { collection, id } = req.params;
  const body = req.body;
  const table = getSafeTableName(collection);

  if (!table) return res.status(400).json({ error: `خشتەی نەناسراو: ${collection}` });

  try {
    const strId = String(id);
    const existingRes = await pool.query(
      `SELECT * FROM "${table}" WHERE (id = $1 OR uid = $1 OR (data->>'id') = $1) LIMIT 1`,
      [strId]
    );
    const existing = existingRes.rows[0]?.data || {};
    const merged = { ...existing, ...body, id: isNaN(Number(strId)) ? strId : Number(strId) };
    const branchId = merged.branchId !== undefined ? String(merged.branchId) : null;
    const uidVal = merged.uid || merged.username || strId;

    const queryText = table === "users"
      ? `
        INSERT INTO "${table}" (id, uid, branch_id, data, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (id) DO UPDATE SET
          uid = EXCLUDED.uid,
          branch_id = EXCLUDED.branch_id,
          data = EXCLUDED.data,
          updated_at = NOW()
        RETURNING *;
      `
      : `
        INSERT INTO "${table}" (id, branch_id, data, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (id) DO UPDATE SET
          branch_id = EXCLUDED.branch_id,
          data = EXCLUDED.data,
          updated_at = NOW()
        RETURNING *;
      `;

    const queryParams = table === "users"
      ? [strId, uidVal, branchId, JSON.stringify(merged)]
      : [strId, branchId, JSON.stringify(merged)];

    const result = await pool.query(queryText, queryParams);
    const row = result.rows[0];
    res.json({ ...row, ...merged });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Delete Document
app.delete("/api/db/:collection/:id", async (req, res) => {
  const { collection, id } = req.params;
  const table = getSafeTableName(collection);

  if (!table) return res.status(400).json({ error: `خشتەی نەناسراو: ${collection}` });

  try {
    const strId = String(id);
    const result = await pool.query(
      `DELETE FROM "${table}" WHERE id = $1 OR uid = $1 OR (data->>'id') = $1 OR (data->>'uid') = $1`,
      [strId]
    );
    res.json({ success: (result.rowCount ?? 0) > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Batch Upsert
app.post("/api/db/batch/:collection", async (req, res) => {
  const { collection } = req.params;
  const { items } = req.body;
  const table = getSafeTableName(collection);

  if (!table) return res.status(400).json({ error: `خشتەی نەناسراو: ${collection}` });
  if (!Array.isArray(items)) return res.status(400).json({ error: "دەبێت items لیستێک بێت" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let count = 0;

    for (const item of items) {
      const strId = String(item.id || item._id || item.uid || Date.now() + Math.floor(Math.random() * 100000));
      const branchId = item.branchId !== undefined ? String(item.branchId) : null;
      const payload = { ...item, id: isNaN(Number(strId)) ? strId : Number(strId) };
      const uidVal = payload.uid || payload.username || strId;

      if (table === "users") {
        await client.query(`
          INSERT INTO "${table}" (id, uid, branch_id, data, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (id) DO UPDATE SET
            uid = EXCLUDED.uid,
            branch_id = EXCLUDED.branch_id,
            data = EXCLUDED.data,
            updated_at = NOW();
        `, [strId, uidVal, branchId, JSON.stringify(payload)]);
      } else {
        await client.query(`
          INSERT INTO "${table}" (id, branch_id, data, updated_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (id) DO UPDATE SET
            branch_id = EXCLUDED.branch_id,
            data = EXCLUDED.data,
            updated_at = NOW();
        `, [strId, branchId, JSON.stringify(payload)]);
      }
      count++;
    }

    await client.query("COMMIT");
    res.json({ success: true, count });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 8. Auth Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "تکایە ناوی بەکارهێنەر و تێپەڕەوشە بنووسە" });
    }

    const cleanUser = String(username).trim().toLowerCase();

    // Fetch users from PostgreSQL
    const result = await pool.query("SELECT * FROM users");
    const users = result.rows.map(r => ({ ...r, ...(r.data || {}) }));

    // Super Admin check
    if (
      (cleanUser === "jwankary485@gmail.com" || cleanUser === "jwankary" || cleanUser === "super_admin" || cleanUser === "admin") &&
      (password === "123" || password === "1234" || password === "admin123")
    ) {
      let superAdmin = users.find(u =>
        u.email?.toLowerCase() === "jwankary485@gmail.com" ||
        u.username?.toLowerCase() === cleanUser ||
        u.role === "super_admin"
      );

      if (!superAdmin) {
        superAdmin = {
          id: 1,
          uid: "super-admin-jwankary",
          username: "jwankary",
          name: "بەڕێوەبەری سەرەکی",
          email: "jwankary485@gmail.com",
          role: "super_admin",
          branchId: 1,
          specialty: "بەڕێوەبەری گشتی",
          salary: 0,
          createdAt: new Date().toISOString()
        };
      }

      return res.json({
        success: true,
        user: superAdmin,
        customToken: "layerbase-token-superadmin"
      });
    }

    // Regular User
    const matchedUser = users.find(u => u.username && u.username.toLowerCase() === cleanUser);
    if (!matchedUser) {
      return res.status(401).json({ error: "ناوی بەکارهێنەر یان تێپەڕەوشە هەڵەیە!" });
    }

    if (matchedUser.password && matchedUser.password !== password) {
      return res.status(401).json({ error: "تێپەڕەوشە هەڵەیە!" });
    }

    return res.json({
      success: true,
      user: matchedUser,
      customToken: `layerbase-token-${matchedUser.id}`
    });
  } catch (err) {
    console.error("Auth login error in Cloud Function:", err);
    res.status(500).json({ error: err.message || "هەڵە لە چوونەژوورەوە" });
  }
});

// Export both /api and root handlers for Firebase Functions v2
exports.api = onRequest({ cors: true, maxInstances: 10, memory: "256MiB" }, app);
exports.app = exports.api;
