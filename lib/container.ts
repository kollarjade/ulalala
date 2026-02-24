import Docker from 'dockerode';
import path from 'path';
import fs from 'fs/promises';

const docker = new Docker({ socketPath: process.env.DOCKER_HOST || '/var/run/docker.sock' });

export class ContainerManager {
  async createContainer(projectId: string, manifestId: string): Promise<string> {
    const containerName = \`workspace-\${projectId}\`;
    const workspacePath = path.join(process.cwd(), 'data', 'workspaces', projectId);

    await fs.mkdir(workspacePath, { recursive: true });

    const container = await docker.createContainer({
      Image: 'node:20-alpine',
      name: containerName,
      Cmd: ['tail', '-f', '/dev/null'],
      HostConfig: {
        Binds: [\`\${workspacePath}:/workspace\`],
        Memory: 1024 * 1024 * 1024, // 1GB
        MemorySwap: 1024 * 1024 * 1024,
        CpuQuota: 100000,
        CpuPeriod: 100000,
      },
      WorkingDir: '/workspace',
    });

    await container.start();
    return container.id;
  }

  async stopContainer(projectId: string): Promise<void> {
    const containerName = \`workspace-\${projectId}\`;
    try {
      const container = docker.getContainer(containerName);
      await container.stop();
      await container.remove();
    } catch (e) {
      // Ignore if container doesn't exist
    }
  }

  async execCommand(projectId: string, command: string[]): Promise<string> {
    const containerName = \`workspace-\${projectId}\`;
    const container = docker.getContainer(containerName);

    const exec = await container.exec({
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ Detach: false, Tty: false });

    return new Promise((resolve, reject) => {
      let output = '';
      stream.on('data', (chunk) => {
        output += chunk.toString();
      });
      stream.on('end', () => {
        resolve(output);
      });
      stream.on('error', (err) => {
        reject(err);
      });
    });
  }
}

export const containerManager = new ContainerManager();
