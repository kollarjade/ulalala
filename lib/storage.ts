import { globalCAS } from './cas';
import { snapshotManager } from './snapshot';

export class StorageManager {
  async init() {
    await globalCAS.init();
  }

  async storeFile(buffer: Buffer): Promise<string[]> {
    const chunks: string[] = [];
    for (let i = 0; i < buffer.length; i += globalCAS.chunkSize) {
      const chunk = buffer.subarray(i, i + globalCAS.chunkSize);
      const hash = await globalCAS.writeChunk(chunk);
      chunks.push(hash);
    }
    return chunks;
  }

  async readFile(chunks: string[]): Promise<Buffer> {
    const buffers: Buffer[] = [];
    for (const hash of chunks) {
      const chunk = await globalCAS.readChunk(hash);
      buffers.push(chunk);
    }
    return Buffer.concat(buffers);
  }
}

export const storageManager = new StorageManager();
