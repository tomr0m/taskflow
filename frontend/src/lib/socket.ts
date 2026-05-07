import { io, Socket } from 'socket.io-client';

// Mirror of server event shapes (frontend only needs what it listens to)
export interface ItemPayload {
  id: number;
  boardId: number;
  type: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  startDate?: string | null;
  endDate?: string | null;
  assigneeId?: number | null;
  assignee?: { id: number; name: string; email: string; avatarUrl?: string | null } | null;
  createdById: number;
  createdBy: { id: number; name: string; email: string; avatarUrl?: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface MemberPayload {
  id: number;
  userId: number;
  role: string;
  createdAt: string;
  user: { id: number; name: string; email: string; avatarUrl?: string | null };
}

export interface ServerToClientEvents {
  'item:created': (payload: { item: ItemPayload }) => void;
  'item:updated': (payload: { item: ItemPayload; actorId: number }) => void;
  'item:deleted': (payload: { id: number; title: string; actorId: number }) => void;
  'member:joined': (payload: { member: MemberPayload }) => void;
  'member:role_changed': (payload: { userId: number; newRole: string }) => void;
  'member:removed': (payload: { userId: number }) => void;
  'presence:update': (payload: { userIds: number[] }) => void;
}

export interface ClientToServerEvents {
  'board:join': (boardId: number) => void;
  'board:leave': (boardId: number) => void;
}

// Use the same base URL the REST API uses (no /api suffix for socket)
const SOCKET_URL = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL
  || 'http://localhost:3001';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function connectSocket(token: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket?.connected) return socket;

  // Disconnect stale socket before reconnecting with a new token
  socket?.disconnect();

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
  return socket;
}
