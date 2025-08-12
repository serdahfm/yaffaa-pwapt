import { Database } from 'sqlite3';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import archiver from 'archiver';

interface Job {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  request: any;
  results?: any;
  created_at: string;
  updated_at: string;
}

interface JobLog {
  id: string;
  job_id: string;
  timestamp: string;
  message: string;
}

export class JobService {
  private db: Database;

  constructor() {
    this.db = new Database('./data/yafa.db');
    this.db.run = promisify(this.db.run.bind(this.db));
    this.db.get = promisify(this.db.get.bind(this.db));
    this.db.all = promisify(this.db.all.bind(this.db));
  }

  async createJob(request: any): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await (this.db.run as any)(
      `INSERT INTO jobs (id, status, progress, request, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, 'pending', 0, JSON.stringify(request), now, now]
    );
    
    await this.addJobLog(id, 'Job created and queued for execution');
    return id;
  }

  async updateJobStatus(id: string, status: string, progress: number): Promise<void> {
    const now = new Date().toISOString();
    await (this.db.run as any)(
      `UPDATE jobs SET status = ?, progress = ?, updated_at = ? WHERE id = ?`,
      [status, progress, now, id]
    );
  }

  async completeJob(id: string, results: any): Promise<void> {
    const now = new Date().toISOString();
    await (this.db.run as any)(
      `UPDATE jobs SET status = ?, progress = ?, results = ?, updated_at = ? WHERE id = ?`,
      ['completed', 100, JSON.stringify(results), now, id]
    );
    
    // Save files to disk
    await this.saveJobFiles(id, results.files || []);
  }

  async failJob(id: string, error: string): Promise<void> {
    const now = new Date().toISOString();
    await (this.db.run as any)(
      `UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?`,
      ['failed', now, id]
    );
    
    await this.addJobLog(id, `Job failed: ${error}`);
  }

  async getJobResult(id: string): Promise<any | null> {
    const job = await (this.db.get as any)('SELECT * FROM jobs WHERE id = ?', [id]) as Job;
    if (!job) return null;
    
    const logs = await (this.db.all as any)('SELECT * FROM job_logs WHERE job_id = ? ORDER BY timestamp', [id]) as JobLog[];
    
    return {
      status: job.status,
      progress: job.progress,
      results: job.results ? JSON.parse(job.results) : null,
      logs: logs.map(log => ({
        timestamp: log.timestamp,
        message: log.message
      }))
    };
  }

  async addJobLog(jobId: string, message: string): Promise<void> {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    await (this.db.run as any)(
      `INSERT INTO job_logs (id, job_id, timestamp, message) VALUES (?, ?, ?, ?)`,
      [id, jobId, timestamp, message]
    );
  }

  async getJobBundle(id: string): Promise<Buffer | null> {
    try {
      const zipPath = path.join('./data/bundles', `${id}.zip`);
      const buffer = await fs.readFile(zipPath);
      return buffer;
    } catch {
      return null;
    }
  }

  private async saveJobFiles(jobId: string, files: any[]): Promise<void> {
    if (!files.length) return;

    // Ensure directories exist
    await fs.mkdir('./data/bundles', { recursive: true });
    await fs.mkdir(`./data/files/${jobId}`, { recursive: true });

    // Save individual files
    for (const file of files) {
      const filePath = path.join(`./data/files/${jobId}`, file.path);
      const fileDir = path.dirname(filePath);
      await fs.mkdir(fileDir, { recursive: true });
      await fs.writeFile(filePath, file.content, 'utf8');
    }

    // Create zip bundle
    await this.createZipBundle(jobId, files);
  }

  private async createZipBundle(jobId: string, files: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const zipPath = path.join('./data/bundles', `${jobId}.zip`);
      const output = require('fs').createWriteStream(zipPath);

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);

      for (const file of files) {
        archive.append(file.content, { name: file.path });
      }

      archive.finalize();
    });
  }

  close(): void {
    this.db.close();
  }
}
