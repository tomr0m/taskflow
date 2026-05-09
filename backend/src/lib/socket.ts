import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyToken } from './jwt.js';
import { prisma } from './db.js';

// ── Typed event interfaces ────────────────────────────────────────────────────

export interface ServerToClientEvents {
  'item:created': (payload: { item: Record<string, unknown> }) => void;
  'item:updated': (payload: { item: Record<string, unknown>; actorId: number }) => void;
  'item:deleted': (payload: { id: number; title: string; actorId: number }) => void;
  'member:joined': (payload: { member: Record<string, unknown> }) => void;
  'member:role_changed': (payload: { userId: number; newRole: string }) => void;
  'member:removed': (payload: { userId: number }) => void;
  'presence:update': (payload: { userIds: number[] }) => void;
}

export interface ClientToServerEvents {
  'board:join': (boardId: number) => void;
  'board:leave': (boardId: number) => void;
}

interface SocketData {
  userId: number;
  joinedBoards: Set<number>;
}

// ── Presence map: boardId → Set of userIds viewing that board ─────────────────
const presence = new Map<number, Set<number>>();

let io: SocketServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

// ── Init ──────────────────────────────────────────────────────────────────────

export function initSocket(httpServer: HttpServer): void {
  io = new SocketServer(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    },
  });

  // JWT auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) { next(new Error('No token')); return; }
    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.id;
      socket.data.joinedBoards = new Set<number>();
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>) => {
    const userId = socket.data.userId;

    // ── board:join ─────────────────────────────────────────────────────────
    socket.on('board:join', async (boardId: number) => {
      const member = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId, userId } },
      });
      if (!member) return;

      void socket.join(`board:${boardId}`);
      socket.data.joinedBoards.add(boardId);

      if (!presence.has(boardId)) presence.set(boardId, new Set());
      presence.get(boardId)!.add(userId);

      emitPresence(boardId);
    });

    // ── board:leave ────────────────────────────────────────────────────────
    socket.on('board:leave', (boardId: number) => {
      void socket.leave(`board:${boardId}`);
      socket.data.joinedBoards.delete(boardId);
      removePresence(boardId, userId);
    });

    // ── disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      for (const boardId of socket.data.joinedBoards) {
        removePresence(boardId, userId);
      }
    });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function emitPresence(boardId: number): void {
  const userIds = Array.from(presence.get(boardId) ?? []);
  io.to(`board:${boardId}`).emit('presence:update', { userIds });
}

function removePresence(boardId: number, userId: number): void {
  const set = presence.get(boardId);
  if (!set) return;
  set.delete(userId);
  if (set.size === 0) presence.delete(boardId);
  emitPresence(boardId);
}

// ── Accessor for controllers ──────────────────────────────────────────────────

export function getIo(): SocketServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
