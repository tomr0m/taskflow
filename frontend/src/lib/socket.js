import { io } from 'socket.io-client';
// Use the same base URL the REST API uses (no /api suffix for socket)
const SOCKET_URL = import.meta.env.VITE_API_URL
    || 'http://localhost:3001';
let socket = null;
export function connectSocket(token) {
    if (socket?.connected)
        return socket;
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
export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
}
export function getSocket() {
    return socket;
}
