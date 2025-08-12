import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { readFile } from 'fs/promises';
import { YAFAEngine } from './engine/yafa-engine';
import { JobService } from './services/job-service';
import { setupDatabase } from './database/setup';

const fastify = Fastify({ 
  logger: { level: process.env.LOG_LEVEL || 'info' }
});

async function start() {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',')
    });

    // Setup database
    await setupDatabase();

    // Serve SPA in production (Docker). In dev, Vite serves on 3000 via proxy.
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      const distRoot = path.join(__dirname, '../../web/dist');
      await fastify.register(fastifyStatic, {
        root: distRoot,
        prefix: '/', // serve assets from /
        decorateReply: false
      });
    }

    // Initialize services
    const yafeEngine = new YAFAEngine();
    const jobService = new JobService();

    // Health check
    fastify.get('/health', async () => ({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }));

    // Plan endpoint
    fastify.post<{
      Body: { mission: string; mode: string; yafa: string; dial: string }
    }>('/api/plan', async (request, reply) => {
      try {
        const { mission, mode, yafa, dial } = request.body;
        
        if (!mission?.trim()) {
          return reply.code(400).send({ error: 'Mission is required' });
        }
        
        const plan = await yafeEngine.generatePlan({
          mission: mission.trim(),
          mode,
          yafa: yafa === 'On',
          dial
        });
        
        return plan;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Plan generation failed' });
      }
    });

    // Execute endpoint
    fastify.post<{
      Body: { mission: string; mode: string; yafa: string; dial: string; plan?: any }
    }>('/api/execute', async (request, reply) => {
      try {
        const { mission, mode, yafa, dial, plan } = request.body;
        
        const runId = await jobService.createJob({
          mission: mission.trim(),
          mode,
          yafa: yafa === 'On',
          dial,
          plan
        });
        
        // Start execution asynchronously
        yafeEngine.execute(runId, { mission, mode, yafa: yafa === 'On', dial, plan })
          .catch(error => fastify.log.error('Execution failed:', error));
        
        return { runId };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Execution failed to start' });
      }
    });

    // Results endpoint
    fastify.get<{
      Params: { runId: string }
    }>('/api/results/:runId', async (request, reply) => {
      try {
        const { runId } = request.params;
        const result = await jobService.getJobResult(runId);
        
        if (!result) {
          return reply.code(404).send({ error: 'Job not found' });
        }
        
        return result;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to get results' });
      }
    });

    // Download endpoint
    fastify.get<{
      Params: { runId: string }
    }>('/api/download/:runId', async (request, reply) => {
      try {
        const { runId } = request.params;
        const zipBuffer = await jobService.getJobBundle(runId);
        
        if (!zipBuffer) {
          return reply.code(404).send({ error: 'Bundle not found' });
        }
        
        reply.header('Content-Type', 'application/zip');
        reply.header('Content-Disposition', `attachment; filename="yafa-results-${runId}.zip"`);
        return zipBuffer;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Download failed' });
      }
    });

    // SPA fallback (history API) – after API routes are registered
    if (isProduction) {
      const distRoot = path.join(__dirname, '../../web/dist');
      fastify.get('/*', async (req, reply) => {
        // Avoid intercepting API routes
        if (req.url.startsWith('/api') || req.url.startsWith('/health')) return reply.callNotFound();
        try {
          const html = await readFile(path.join(distRoot, 'index.html'), 'utf8');
          reply.header('Content-Type', 'text/html').send(html);
        } catch {
          reply.callNotFound();
        }
      });
    }

    // Start server
    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`🚀 YAFA-MS Backend running on http://localhost:${port}`);
    console.log(`📱 Frontend served at http://localhost:${port} (Docker) or http://localhost:3000 (dev)`);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();