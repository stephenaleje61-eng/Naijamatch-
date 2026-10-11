import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { verifyToken } from './auth.ts';
import { db } from './db.ts';

interface AuthenticatedClient {
  ws: WebSocket;
  userId: string;
  email: string;
  activeConversationId?: string;
}

class RealtimeHub {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, Set<AuthenticatedClient>>(); // userId -> Set of connections
  private allSockets = new Set<WebSocket>(); // all active connections including guests

  public init(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.allSockets.add(ws);
      let currentUserId: string | null = null;
      let clientRef: AuthenticatedClient | null = null;

      ws.on('message', (messageRaw: string) => {
        try {
          const payload = JSON.parse(messageRaw.toString());

          switch (payload.type) {
            case 'auth': {
              const token = payload.token;
              const decoded = verifyToken(token);
              if (!decoded) {
                ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed: Invalid or expired token' }));
                ws.close();
                return;
              }

              currentUserId = decoded.id;
              clientRef = {
                ws,
                userId: decoded.id,
                email: decoded.email
              };

              if (!this.clients.has(currentUserId)) {
                this.clients.set(currentUserId, new Set());
              }
              this.clients.get(currentUserId)!.add(clientRef);

              // Mark presence as online in DB
              db.updateProfilePresence(currentUserId, true);

              // Acknowledge auth
              ws.send(JSON.stringify({
                type: 'auth_success',
                userId: currentUserId,
                timestamp: new Date().toISOString()
              }));

              // Broadcast presence to interested clients
              this.broadcastPresence(currentUserId, true);
              break;
            }

            case 'join_conversation': {
              if (clientRef && payload.conversationId) {
                clientRef.activeConversationId = payload.conversationId;
              }
              break;
            }

            case 'leave_conversation': {
              if (clientRef) {
                clientRef.activeConversationId = undefined;
              }
              break;
            }

            case 'typing': {
              if (!currentUserId || !payload.conversationId || !payload.recipientId) return;
              this.sendToUser(payload.recipientId, {
                type: 'typing',
                conversationId: payload.conversationId,
                senderId: currentUserId
              });
              break;
            }

            case 'stop_typing': {
              if (!currentUserId || !payload.conversationId || !payload.recipientId) return;
              this.sendToUser(payload.recipientId, {
                type: 'stop_typing',
                conversationId: payload.conversationId,
                senderId: currentUserId
              });
              break;
            }

            case 'ping': {
              ws.send(JSON.stringify({ type: 'pong' }));
              break;
            }
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      });

      ws.on('close', () => {
        this.allSockets.delete(ws);
        if (currentUserId && clientRef) {
          const userConns = this.clients.get(currentUserId);
          if (userConns) {
            userConns.delete(clientRef);
            if (userConns.size === 0) {
              this.clients.delete(currentUserId);
              db.updateProfilePresence(currentUserId, false);
              this.broadcastPresence(currentUserId, false);
            }
          }
        }
      });

      ws.on('error', (err) => {
        this.allSockets.delete(ws);
        console.error('WebSocket client error:', err);
      });
    });

    console.log('[NAIJAMATCH] Realtime WebSocket Server initialized on /ws');
  }

  public sendToUser(userId: string, data: object): void {
    const userConns = this.clients.get(userId);
    if (!userConns || userConns.size === 0) return;

    const payload = JSON.stringify(data);
    for (const client of userConns) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    }
  }

  public broadcastMessage(recipientId: string, messageData: object): void {
    this.sendToUser(recipientId, {
      type: 'new_message',
      message: messageData
    });
  }

  public broadcastNotification(userId: string, notificationData: object): void {
    this.sendToUser(userId, {
      type: 'new_notification',
      notification: notificationData
    });
  }

  public broadcastPublicChatMessage(messageData: object): void {
    const payload = JSON.stringify({
      type: 'public_chat_message',
      message: messageData
    });

    for (const ws of this.allSockets) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch (e) {
          // ignore broken pipe
        }
      }
    }
  }

  public broadcastPublicChatDelete(messageId: string): void {
    const payload = JSON.stringify({
      type: 'public_chat_delete',
      messageId
    });

    for (const ws of this.allSockets) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch (e) {
          // ignore broken pipe
        }
      }
    }
  }

  public broadcastPublicChatReaction(messageId: string, reactions: any): void {
    const payload = JSON.stringify({
      type: 'public_chat_reaction',
      messageId,
      reactions
    });

    for (const ws of this.allSockets) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch (e) {
          // ignore broken pipe
        }
      }
    }
  }

  public getOnlineCount(): number {
    return Math.max(1, this.clients.size, this.allSockets.size);
  }

  private broadcastPresence(userId: string, isOnline: boolean): void {
    const payload = JSON.stringify({
      type: 'presence_update',
      userId,
      isOnline,
      onlineCount: this.clients.size,
      lastActiveAt: new Date().toISOString()
    });

    for (const [uid, conns] of this.clients.entries()) {
      if (uid === userId) continue;
      for (const client of conns) {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(payload);
        }
      }
    }
  }

  public isUserOnline(userId: string): boolean {
    const conns = this.clients.get(userId);
    return !!(conns && conns.size > 0);
  }
}

export const realtimeHub = new RealtimeHub();
