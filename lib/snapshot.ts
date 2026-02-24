import { prisma } from './auth';
import { globalCAS } from './cas';

export interface ManifestData {
  version: number;
  files: Record<string, { chunks: string[]; mode: number }>;
}

export class SnapshotManager {
  async createFork(projectId: string, parentManifestId: string): Promise<string> {
    const parentManifest = await prisma.manifest.findUnique({
      where: { id: parentManifestId },
    });

    if (!parentManifest) {
      throw new Error('Parent manifest not found');
    }

    const manifestJson = parentManifest.manifestJson as unknown as ManifestData;

    // Increment ref counts for all chunks in the manifest
    for (const file of Object.values(manifestJson.files)) {
      for (const chunkHash of file.chunks) {
        await prisma.chunk.update({
          where: { hash: chunkHash },
          data: { refCount: { increment: 1 } },
        });
      }
    }

    const newManifest = await prisma.manifest.create({
      data: {
        projectId,
        version: parentManifest.version + 1,
        manifestJson: manifestJson as any,
        parentManifestId,
      },
    });

    return newManifest.id;
  }

  async commit(projectId: string, manifestId: string): Promise<void> {
    await prisma.project.update({
      where: { id: projectId },
      data: { currentManifestId: manifestId },
    });
  }

  async rollback(projectId: string, targetManifestId: string): Promise<void> {
    await prisma.project.update({
      where: { id: projectId },
      data: { currentManifestId: targetManifestId },
    });
  }
}

export const snapshotManager = new SnapshotManager();
