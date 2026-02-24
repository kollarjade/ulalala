import { prisma } from './auth';
import { containerManager } from './container';
import crypto from 'crypto';

export class BuildManager {
  async runFastBuild(projectId: string, envJson: any): Promise<void> {
    const configHash = crypto.createHash('sha256').update(JSON.stringify(envJson)).digest('hex');

    const cacheEntry = await prisma.buildCacheEntry.findUnique({
      where: { projectId_configHash: { projectId, configHash } },
    });

    if (cacheEntry) {
      // Use cache
      return;
    }

    await this.runFullBuild(projectId, envJson);
  }

  async runFullBuild(projectId: string, envJson: any): Promise<void> {
    const configHash = crypto.createHash('sha256').update(JSON.stringify(envJson)).digest('hex');

    // Run build steps in container
    for (const step of envJson.build) {
      await containerManager.execCommand(projectId, step.split(' '));
    }

    // Save cache
    await prisma.buildCacheEntry.create({
      data: {
        projectId,
        configHash,
        envJson,
        storePathsJson: {},
      },
    });
  }
}

export const buildManager = new BuildManager();
