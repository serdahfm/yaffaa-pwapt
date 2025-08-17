import { logger } from "./logger.js";
import { JobData, JobResult, JobStatus } from "../lib/validators.js";

// Simple in-memory job queue implementation
export class JobQueue {
  private jobs: Map<string, JobStatus> = new Map();
  private queue: Array<JobData> = [];
  private processing: Set<string> = new Set();
  private maxConcurrent: number = 5;

  async addJob(type: string, data: any, metadata: Record<string, any> = {}): Promise<string> {
    const jobId = this.generateJobId();
    const jobData: JobData = {
      id: jobId,
      type: type as any,
      data,
      metadata,
      priority: metadata.priority || 5,
      delay: metadata.delay || 0,
      attempts: metadata.attempts || 3,
    };

    const jobStatus: JobStatus = {
      id: jobId,
      type,
      status: "queued",
      progress: 0,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: jobData.attempts,
    };

    this.jobs.set(jobId, jobStatus);
    this.queue.push(jobData);
    
    // Sort by priority (higher priority first)
    this.queue.sort((a, b) => b.priority - a.priority);
    
    logger.info("Job added to queue", { jobId, type, priority: jobData.priority });
    
    // Process jobs if we have capacity
    this.processNextJob();
    
    return jobId;
  }

  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    return this.jobs.get(jobId) || null;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const jobStatus = this.jobs.get(jobId);
    if (!jobStatus) {
      return false;
    }

    if (jobStatus.status === "queued") {
      // Remove from queue
      this.queue = this.queue.filter(job => job.id !== jobId);
      jobStatus.status = "cancelled";
      jobStatus.completedAt = new Date();
      return true;
    }

    if (jobStatus.status === "running") {
      // Mark as cancelled (will be cleaned up when processing completes)
      jobStatus.status = "cancelled";
      return true;
    }

    return false;
  }

  async getStats(): Promise<{
    total: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  }> {
    const stats = {
      total: this.jobs.size,
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const job of this.jobs.values()) {
      switch (job.status) {
        case "queued":
          stats.queued++;
          break;
        case "running":
          stats.running++;
          break;
        case "completed":
          stats.completed++;
          break;
        case "failed":
          stats.failed++;
          break;
        case "cancelled":
          stats.cancelled++;
          break;
      }
    }

    return stats;
  }

  private async processNextJob(): Promise<void> {
    if (this.processing.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const jobData = this.queue.shift();
    if (!jobData) {
      return;
    }

    const jobStatus = this.jobs.get(jobData.id);
    if (!jobStatus || jobStatus.status !== "queued") {
      return;
    }

    this.processing.add(jobData.id);
    jobStatus.status = "running";
    jobStatus.startedAt = new Date();

    // Process the job asynchronously
    this.processJob(jobData, jobStatus).finally(() => {
      this.processing.delete(jobData.id);
      // Process next job
      this.processNextJob();
    });
  }

  private async processJob(jobData: JobData, jobStatus: JobStatus): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info("Processing job", { jobId: jobData.id, type: jobData.type });
      
      // Simulate job processing
      await this.simulateJobProcessing(jobData, jobStatus);
      
      const duration = Date.now() - startTime;
      
      jobStatus.status = "completed";
      jobStatus.completedAt = new Date();
      jobStatus.progress = 100;
      jobStatus.result = {
        success: true,
        data: { message: "Job completed successfully" },
        metadata: {
          jobId: jobData.id,
          duration,
          timestamp: Date.now(),
        },
      };
      
      logger.info("Job completed", { jobId: jobData.id, type: jobData.type, duration });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      jobStatus.attempts++;
      
      if (jobStatus.attempts >= jobStatus.maxAttempts) {
        jobStatus.status = "failed";
        jobStatus.completedAt = new Date();
        jobStatus.error = error instanceof Error ? error.message : String(error);
        
        logger.error("Job failed permanently", { 
          jobId: jobData.id, 
          type: jobData.type, 
          error: jobStatus.error,
          attempts: jobStatus.attempts 
        });
      } else {
        // Retry the job
        jobStatus.status = "queued";
        this.queue.push(jobData);
        
        logger.warn("Job failed, retrying", { 
          jobId: jobData.id, 
          type: jobData.type, 
          attempts: jobStatus.attempts,
          maxAttempts: jobStatus.maxAttempts 
        });
      }
    }
  }

  private async simulateJobProcessing(jobData: JobData, jobStatus: JobStatus): Promise<void> {
    // Simulate different processing times based on job type
    const processingTimes: Record<string, number> = {
      compile: 2000,
      critique: 1000,
      export: 3000,
    };
    
    const processingTime = processingTimes[jobData.type] || 1000;
    const steps = 10;
    const stepTime = processingTime / steps;
    
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepTime));
      jobStatus.progress = (i / steps) * 100;
    }
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const jobQueue = new JobQueue();
