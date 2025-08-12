import Fastify from 'fastify';
import cors from '@fastify/cors';
import { YAFAEngine } from './engine/yafa-engine';
import { JobService } from './services/job-service';
import { setupDatabase } from './database/setup';

const fastify = Fastify({ logger: true });

// Register plugins
async function startServer() {
  await fastify.register(cors, {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000']
  });

  // Initialize services
  const yafeEngine = new YAFAEngine();
  const jobService = new JobService();

  // Setup database
  await setupDatabase();

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

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

  // Start server
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 YAFA-MS Backend running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
