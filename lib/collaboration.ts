import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export class CollaborationManager {
  private doc: Y.Doc;
  private provider: WebsocketProvider;

  constructor(roomName: string) {
    this.doc = new Y.Doc();
    this.provider = new WebsocketProvider('ws://localhost:1234', roomName, this.doc);
  }

  getDoc(): Y.Doc {
    return this.doc;
  }

  getProvider(): WebsocketProvider {
    return this.provider;
  }

  destroy() {
    this.provider.destroy();
    this.doc.destroy();
  }
}

export const collaborationManager = new CollaborationManager('default-room');
