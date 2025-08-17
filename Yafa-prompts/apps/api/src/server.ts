import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import basicAuth from 'express-basic-auth';
import { config } from 'dotenv';
import { z } from 'zod';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { 
  PromptContract, 
  ArtifactPlan, 
  SovereignRequest,
  ApiResponse,
  PromptContractType,
  ArtifactPlanType,
  SovereignRequestType
} from '@yafa/types';
import { buildArtifacts } from '@yafa/artifact-builders';
import { createCompiler } from '../../../packages/compiler/src';
import { runProbes } from '../../../packages/eval-harness/src';

// Load environment variables
config();

// Initialize services
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);
const queue = new Queue('yafa', { connection: redis });

// S3 client for MinIO
const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.S3_ENDPOINT!,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

// OpenAI client
import OpenAI from 'openai';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for ngrok compatibility
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : process.env.CORS_ORIGINS?.split(','),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Basic auth for production
if (process.env.NODE_ENV === 'production' && process.env.BASIC_AUTH_USER) {
  app.use(basicAuth({
    users: { [process.env.BASIC_AUTH_USER]: process.env.BASIC_AUTH_PASS || 'yafa' },
    challenge: true,
    realm: 'YAFFA Engine'
  }));
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis
    await redis.ping();
    
    // Check S3/MinIO
    await s3Client.send({
      $metadata: {},
      input: { Bucket: process.env.S3_BUCKET },
      middlewareStack: { add: () => {}, use: () => {}, remove: () => {}, removeByTag: () => {}, concat: () => ({} as any), resolve: () => Promise.resolve({} as any), identify: () => [], addRelativeTo: () => {}, clone: () => ({} as any) }
    } as any);
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: {
        database: 'connected',
        redis: 'connected',
        storage: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Serve the ChatGPT-style UI at /cartridge for backwards compatibility
app.use('/cartridge', express.static('../../../Yafa-prompts/public/chatgpt-style.html'));

// API Routes

// Compile endpoint - transforms user request into PromptContract
app.post('/compile', async (req, res) => {
  try {
    const parsed = PromptContract.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid prompt contract',
          details: parsed.error.format()
        }
      });
    }

    const compiler = await createCompiler();
    const contract = await compiler.compile(parsed.data);
    
    // Store in database
    const run = await prisma.run.create({
      data: {
        mode: parsed.data.meta.mode,
        promptContract: contract as any,
        status: 'succeeded'
      }
    });

    return res.json({
      success: true,
      data: { contract, runId: run.id },
      metadata: {
        timestamp: new Date().toISOString(),
        request_id: run.id,
        version: '2.0.0'
      }
    });
  } catch (error) {
    console.error('Compile error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'COMPILATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Probe endpoint - tests determinism and compliance
app.post('/probe', async (req, res) => {
  try {
    const parsed = PromptContract.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid prompt contract',
          details: parsed.error.format()
        }
      });
    }

    const probeResults = await runProbes(parsed.data);
    
    // Store probe results
    const run = await prisma.run.create({
      data: {
        mode: parsed.data.meta.mode,
        promptContract: parsed.data as any,
        determinism: probeResults.determinism_score,
        status: 'succeeded'
      }
    });

    await prisma.probeResult.create({
      data: {
        runId: run.id,
        probeType: 'determinism',
        score: probeResults.determinism_score,
        details: probeResults as any
      }
    });

    return res.json({
      success: true,
      data: probeResults,
      metadata: {
        timestamp: new Date().toISOString(),
        request_id: run.id,
        version: '2.0.0'
      }
    });
  } catch (error) {
    console.error('Probe error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PROBE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Synthesize endpoint - generates artifacts (files)
app.post('/synthesize', async (req, res) => {
  try {
    const parsed = ArtifactPlan.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid artifact plan',
          details: parsed.error.format()
        }
      });
    }

    // Create run record
    const run = await prisma.run.create({
      data: {
        mode: 'yaffa', // Default for synthesis
        promptContract: {} as any,
        artifactPlan: parsed.data as any,
        status: 'queued'
      }
    });

    // Queue the synthesis job
    const job = await queue.add('synthesize', {
      runId: run.id,
      plan: parsed.data
    }, {
      priority: 1,
      attempts: 3,
      delay: 0
    });

    // Update run with job ID
    await prisma.run.update({
      where: { id: run.id },
      data: { jobId: job.id }
    });

    return res.json({
      success: true,
      data: { 
        jobId: job.id, 
        runId: run.id,
        status: 'queued'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        request_id: run.id,
        version: '2.0.0'
      }
    });
  } catch (error) {
    console.error('Synthesize error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SYNTHESIS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Sovereign endpoint - iterative improvement
app.post('/sovereign', async (req, res) => {
  try {
    const parsed = SovereignRequest.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid sovereign request',
          details: parsed.error.format()
        }
      });
    }

    const compiler = await createCompiler();
    const improvedContract = await compiler.sovereign(
      parsed.data.previous_contract,
      parsed.data.downstream_response,
      parsed.data.user_feedback
    );

    // Store the improved contract
    const run = await prisma.run.create({
      data: {
        mode: parsed.data.previous_contract.meta.mode,
        promptContract: improvedContract as any,
        status: 'succeeded'
      }
    });

    return res.json({
      success: true,
      data: { 
        contract: improvedContract,
        runId: run.id
      },
      metadata: {
        timestamp: new Date().toISOString(),
        request_id: run.id,
        version: '2.0.0'
      }
    });
  } catch (error) {
    console.error('Sovereign error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SOVEREIGN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Job status endpoint
app.get('/jobs/:jobId', async (req, res) => {
  try {
    const job = await queue.getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found'
        }
      });
    }

    const state = await job.getState();
    return res.json({
      success: true,
      data: {
        id: job.id,
        status: state,
        progress: job.progress,
        data: job.data,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason
      }
    });
  } catch (error) {
    console.error('Job status error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'JOB_STATUS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Artifacts endpoint - download generated files
app.get('/artifacts/:runId', async (req, res) => {
  try {
    const artifacts = await prisma.artifact.findMany({
      where: { runId: req.params.runId }
    });

    if (artifacts.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ARTIFACTS_NOT_FOUND',
          message: 'No artifacts found for this run'
        }
      });
    }

    // Generate presigned URLs for download
    const artifactsWithUrls = await Promise.all(
      artifacts.map(async (artifact) => {
        const getObjectCommand = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: artifact.s3Key
        });
        const url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
        
        return {
          ...artifact,
          downloadUrl: url
        };
      })
    );

    return res.json({
      success: true,
      data: artifactsWithUrls
    });
  } catch (error) {
    console.error('Artifacts error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ARTIFACTS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
});

// Job worker
const worker = new Worker('yafa', async (job) => {
  console.log(`Processing job ${job.id} of type ${job.name}`);
  
  if (job.name === 'synthesize') {
    const { runId, plan } = job.data;
    
    try {
      // Update run status
      await prisma.run.update({
        where: { id: runId },
        data: { status: 'running' }
      });

      // Build artifacts
      const artifacts = await buildArtifacts(plan);
      
      // Upload to S3 and save to database
      for (const artifact of artifacts) {
        const key = `runs/${runId}/${artifact.filename}`;
        
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: key,
          Body: artifact.buffer,
          ContentType: artifact.contentType
        }));

        await prisma.artifact.create({
          data: {
            runId,
            type: artifact.type,
            filename: artifact.filename,
            s3Key: key,
            contentType: artifact.contentType,
            size: artifact.size
          }
        });
      }

      // Update run status
      await prisma.run.update({
        where: { id: runId },
        data: { 
          status: 'succeeded',
          message: `Generated ${artifacts.length} artifact(s)`
        }
      });

      return { success: true, artifactCount: artifacts.length };
    } catch (error) {
      // Update run status on failure
      await prisma.run.update({
        where: { id: runId },
        data: { 
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      throw error;
    }
  }
}, {
  connection: redis,
  concurrency: 3
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 YAFFA Engine API Server`);
  console.log(`🌐 Running on http://localhost:${port}`);
  console.log(`❤️  Health: http://localhost:${port}/health`);
  console.log(`🎨 UI: http://localhost:${port}/cartridge`);
  console.log(`🐛 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚡ Ready for production workloads!`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await worker.close();
  await redis.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});
