import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '../auth';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const agentQueue = new Queue('agent-tasks', { connection: redis });

export const agentWorker = new Worker('agent-tasks', async (job) => {
  const { taskId, agentType, input } = job.data;

  await prisma.agentTask.update({
    where: { id: taskId },
    data: { status: 'running' },
  });

  try {
    let outputSummary = '';
    if (agentType === 'planner') {
      outputSummary = await plannerAgent(input);
    } else if (agentType === 'editor') {
      outputSummary = await editorAgent(input);
    } else if (agentType === 'verifier') {
      outputSummary = await verifierAgent(input);
    }

    await prisma.agentTask.update({
      where: { id: taskId },
      data: { status: 'completed', outputSummary },
    });
  } catch (error: any) {
    await prisma.agentTask.update({
      where: { id: taskId },
      data: { status: 'failed', outputSummary: error.message },
    });
  }
}, { connection: redis });

async function plannerAgent(input: string): Promise<string> {
  return \`Planned tasks: \${input}\`;
}

async function editorAgent(input: string): Promise<string> {
  return \`Edited files: \${input}\`;
}

async function verifierAgent(input: string): Promise<string> {
  return \`Verified changes: \${input}\`;
}
