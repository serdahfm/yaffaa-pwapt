import { Database } from 'sqlite3';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function setupDatabase(): Promise<void> {
  // Ensure data directory exists
  await fs.mkdir('./data', { recursive: true });
  
  const db = new Database('./data/yafa.db');
  const run = promisify(db.run.bind(db));
  
  try {
    // Create jobs table
    await run(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        request TEXT NOT NULL,
        results TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    // Create job_logs table
    await run(`
      CREATE TABLE IF NOT EXISTS job_logs (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        message TEXT NOT NULL,
        FOREIGN KEY (job_id) REFERENCES jobs (id)
      )
    `);
    
    // Create indexes for better performance
    await run(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON job_logs(job_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_job_logs_timestamp ON job_logs(timestamp)`);
    
    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    db.close();
  }
}
