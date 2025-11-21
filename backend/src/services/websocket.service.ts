import { Server as HTTPServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload, WSClient, WSMessage } from '../types';
import url from 'url';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, WSClient & { ws: WebSocket }> = new Map();
  private characterRooms: Map<string, Set<string>> = new Map(); // characterId -> Set<socketId>

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleConnection(ws, req);
    });

    console.log('WebSocket server initialized');
  }

  private async handleConnection(ws: WebSocket, req: any) {
    try {
      // Parse token from query string
      const queryParams = url.parse(req.url, true).query;
      const token = queryParams.token as string;

      if (!token) {
        ws.close(1008, 'Token required');
        return;
      }

      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      const socketId = this.generateSocketId();

      const client: WSClient & { ws: WebSocket } = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        socketId,
        connectedAt: new Date(),
        ws,
      };

      this.clients.set(socketId, client);

      console.log(`WebSocket client connected: ${client.username} (${socketId})`);

      // Send welcome message
      this.sendToClient(socketId, {
        type: 'user_online',
        payload: { username: client.username },
        timestamp: new Date(),
      });

      // Set up message handlers
      ws.on('message', (data: string) => {
        this.handleMessage(socketId, data);
      });

      ws.on('close', () => {
        this.handleDisconnect(socketId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${socketId}:`, error);
        this.handleDisconnect(socketId);
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  private handleMessage(socketId: string, data: string) {
    try {
      const message = JSON.parse(data);
      const client = this.clients.get(socketId);

      if (!client) return;

      switch (message.type) {
        case 'join_character':
          this.joinCharacterRoom(socketId, message.characterId);
          break;

        case 'leave_character':
          this.leaveCharacterRoom(socketId, message.characterId);
          break;

        case 'ping':
          this.sendToClient(socketId, {
            type: 'pong' as any,
            payload: {},
            timestamp: new Date(),
          });
          break;

        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private handleDisconnect(socketId: string) {
    const client = this.clients.get(socketId);

    if (client) {
      // Remove from all character rooms
      for (const [characterId, sockets] of this.characterRooms.entries()) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          this.characterRooms.delete(characterId);
        }
      }

      this.clients.delete(socketId);
      console.log(`WebSocket client disconnected: ${client.username} (${socketId})`);

      // Notify other clients
      this.broadcast({
        type: 'user_offline',
        payload: { username: client.username },
        timestamp: new Date(),
      });
    }
  }

  private joinCharacterRoom(socketId: string, characterId: string) {
    if (!this.characterRooms.has(characterId)) {
      this.characterRooms.set(characterId, new Set());
    }

    this.characterRooms.get(characterId)!.add(socketId);
    console.log(`Client ${socketId} joined character room ${characterId}`);
  }

  private leaveCharacterRoom(socketId: string, characterId: string) {
    const room = this.characterRooms.get(characterId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.characterRooms.delete(characterId);
      }
      console.log(`Client ${socketId} left character room ${characterId}`);
    }
  }

  private sendToClient(socketId: string, message: WSMessage) {
    const client = this.clients.get(socketId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: WSMessage, excludeSocketId?: string) {
    for (const [socketId, client] of this.clients.entries()) {
      if (socketId !== excludeSocketId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  // Public methods for broadcasting events
  public broadcastCharacterUpdate(characterId: string, updatedData: any) {
    const room = this.characterRooms.get(characterId);
    if (room) {
      const message: WSMessage = {
        type: 'character_update',
        payload: { characterId, data: updatedData },
        timestamp: new Date(),
      };

      for (const socketId of room) {
        this.sendToClient(socketId, message);
      }

      console.log(`Broadcast character update to ${room.size} clients`);
    }
  }

  public broadcastCharacterDelete(characterId: string) {
    const room = this.characterRooms.get(characterId);
    if (room) {
      const message: WSMessage = {
        type: 'character_delete',
        payload: { characterId },
        timestamp: new Date(),
      };

      for (const socketId of room) {
        this.sendToClient(socketId, message);
      }
    }
  }

  private generateSocketId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getConnectedClients(): WSClient[] {
    return Array.from(this.clients.values()).map(({ ws, ...client }) => client);
  }

  public getClientCount(): number {
    return this.clients.size;
  }
}

// Export singleton instance
let wsServiceInstance: WebSocketService | null = null;

export function initializeWebSocketService(server: HTTPServer): WebSocketService {
  if (!wsServiceInstance) {
    wsServiceInstance = new WebSocketService(server);
  }
  return wsServiceInstance;
}

export function getWebSocketService(): WebSocketService {
  if (!wsServiceInstance) {
    throw new Error('WebSocket service not initialized');
  }
  return wsServiceInstance;
}
