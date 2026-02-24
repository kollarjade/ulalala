import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from './auth';

export class CAS {
  private baseDir: string;
  public readonly chunkSize = 16 * 1024 * 1024; // 16 MiB

  constructor(baseDir: string = './data/chunks') {
    this.baseDir = baseDir;
  }

  async init() {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  private getChunkPath(hash: string): string {
    const first2 = hash.substring(0, 2);
    const rest = hash.substring(2);
    return path.join(this.baseDir, first2, rest);
  }

  async writeChunk(buffer: Buffer): Promise<string> {
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const chunkPath = this.getChunkPath(hash);

    await fs.mkdir(path.dirname(chunkPath), { recursive: true });

    try {
      await fs.access(chunkPath);
      // Exists, increment refCount
      await prisma.chunk.update({
        where: { hash },
        data: { refCount: { increment: 1 } },
      });
    } catch {
      // Does not exist, write it
      await fs.writeFile(chunkPath, buffer);
      await prisma.chunk.create({
        data: {
          hash,
          size: buffer.length,
          storagePath: chunkPath,
          refCount: 1,
        },
      });
    }

    return hash;
  }

  async readChunk(hash: string): Promise<Buffer> {
    const chunkPath = this.getChunkPath(hash);
    return fs.readFile(chunkPath);
  }

  async deleteChunk(hash: string): Promise<void> {
    const chunk = await prisma.chunk.update({
      where: { hash },
      data: { refCount: { decrement: 1 } },
    });

    if (chunk.refCount <= 0) {
      const chunkPath = this.getChunkPath(hash);
      try {
        await fs.unlink(chunkPath);
      } catch (e) {
        // Ignore if file doesn't exist
      }
      await prisma.chunk.delete({ where: { hash } });
    }
  }
}

export const globalCAS = new CAS();
