import { Server as SocketIOServer } from 'socket.io';
import { containerManager } from './container';
import Docker from 'dockerode';

export class PTYManager {
  private io: SocketIOServer;

  constructor(server: any) {
    this.io = new SocketIOServer(server, {
      path: '/api/terminal',
    });

    this.io.on('connection', (socket) => {
      socket.on('join', async (projectId) => {
        socket.join(projectId);

        const containerName = \`workspace-\${projectId}\`;
        const docker = new Docker({ socketPath: process.env.DOCKER_HOST || '/var/run/docker.sock' });
        const container = docker.getContainer(containerName);

        const exec = await container.exec({
          Cmd: ['sh'],
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          Tty: true,
        });

        const stream = await exec.start({ Detach: false, Tty: true });

        socket.on('data', (data) => {
          stream.write(data);
        });

        stream.on('data', (chunk) => {
          socket.emit('data', chunk.toString());
        });

        socket.on('disconnect', () => {
          stream.end();
        });
      });
    });
  }
}
