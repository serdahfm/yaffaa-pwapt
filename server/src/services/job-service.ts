import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';
import { Writable } from 'stream';
import Database from 'better-sqlite3';
import path from 'path';

interface JobRequest {
  mission: string;
  mode: string;
  yafa: boolean;
  dial: string;
  plan?: any;
}

interface JobResult {
  runId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  logs: string[];
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export class JobService {
  private db: Database.Database;

  constructor() {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../data/yafa.db');
    this.db = new Database(dbPath);
  }

  async createJob(request: JobRequest): Promise<string> {
    const runId = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO jobs (run_id, mission, mode, yafa, dial, status, progress, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(runId, request.mission, request.mode, request.yafa ? 1 : 0, request.dial, 'pending', 0, now, now);
    
    if (request.plan) {
      const planStmt = this.db.prepare(`
        UPDATE jobs SET plan = ? WHERE run_id = ?
      `);
      planStmt.run(JSON.stringify(request.plan), runId);
    }
    
    return runId;
  }

  async updateJobStatus(runId: string, status: string, progress: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE jobs SET status = ?, progress = ?, updated_at = ? WHERE run_id = ?
    `);
    stmt.run(status, progress, new Date().toISOString(), runId);
  }

  async addJobLog(runId: string, message: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO job_logs (run_id, message, created_at) VALUES (?, ?, ?)
    `);
    stmt.run(runId, message, new Date().toISOString());
  }

  async completeJob(runId: string, result: any): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE jobs SET status = ?, progress = ?, result = ?, updated_at = ? WHERE run_id = ?
    `);
    stmt.run('completed', 100, JSON.stringify(result), new Date().toISOString(), runId);
  }

  async failJob(runId: string, error: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE jobs SET status = ?, error = ?, updated_at = ? WHERE run_id = ?
    `);
    stmt.run('failed', error, new Date().toISOString(), runId);
  }

  async getJobResult(runId: string): Promise<JobResult | null> {
    const jobStmt = this.db.prepare(`
      SELECT * FROM jobs WHERE run_id = ?
    `);
    const job = jobStmt.get(runId) as any;
    
    if (!job) {
      return null;
    }
    
    const logsStmt = this.db.prepare(`
      SELECT message FROM job_logs WHERE run_id = ? ORDER BY created_at ASC
    `);
    const logs = logsStmt.all(runId) as any[];
    
    return {
      runId: job.run_id,
      status: job.status,
      progress: job.progress,
      logs: logs.map(l => l.message),
      result: job.result ? JSON.parse(job.result) : undefined,
      error: job.error,
      createdAt: job.created_at,
      updatedAt: job.updated_at
    };
  }

  async getJobBundle(runId: string): Promise<Buffer | null> {
    const jobResult = await this.getJobResult(runId);
    
    if (!jobResult || jobResult.status !== 'completed' || !jobResult.result) {
      return null;
    }
    
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    
    const stream = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      }
    });
    
    archive.pipe(stream);
    
    // Add metadata
    archive.append(JSON.stringify(jobResult.result.metadata, null, 2), { name: 'metadata.json' });
    
    // Add files
    for (const file of jobResult.result.files) {
      archive.append(file.content, { name: file.path });
    }
    
    // Add execution log
    archive.append(jobResult.logs.join('\n'), { name: 'execution.log' });
    
    await archive.finalize();
    
    return Buffer.concat(chunks);
  }
}