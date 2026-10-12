const { Pool } = require('pg');

const DEFAULT_DATABASE_URL = "postgresql://postgres:VARrUP1de0MZaBqevGejQtpd@van-able-lake-pooler.sage.cloud.layerbase.dev/van?sslmode=require";
const connectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

async function check() {
  console.log("Connecting to Layerbase PostgreSQL (waking up cloud database if idle)...");
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000
  });

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const client = await pool.connect();
      const res = await client.query('SELECT NOW() as server_time, version() as pg_version');
      console.log("=================================================");
      console.log(" SUCCESS: Layerbase Cloud PostgreSQL is CONNECTED!");
      console.log(" Server Time: " + res.rows[0].server_time);
      console.log("=================================================");
      client.release();
      await pool.end();
      process.exit(0);
    } catch (err) {
      console.warn(`[Attempt ${attempts}/${maxAttempts}] Connection notice: ${err.message}`);
      if (attempts < maxAttempts) {
        console.log("Waiting 3 seconds before retry...");
        await new Promise(r => setTimeout(r, 3000));
      } else {
        console.error("FAILED to connect to Layerbase after " + maxAttempts + " attempts: " + err.message);
        await pool.end();
        process.exit(1);
      }
    }
  }
}

check();
