import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export async function setupDatabase() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../data/yafa.db');
  const dbDir = path.dirname(dbPath);
  
  // Ensure data directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      run_id TEXT PRIMARY KEY,
      mission TEXT NOT NULL,
      mode TEXT NOT NULL,
      yafa INTEGER NOT NULL,
      dial TEXT NOT NULL,
      plan TEXT,
      status TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      result TEXT,
      error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  // Create job_logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (run_id) REFERENCES jobs(run_id) ON DELETE CASCADE
    )
  `);
  
  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
    CREATE INDEX IF NOT EXISTS idx_job_logs_run_id ON job_logs(run_id);
  `);
  
  db.close();
  
  console.log('✅ Database setup complete');
}