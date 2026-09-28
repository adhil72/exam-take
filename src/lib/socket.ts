import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(role: "admin" | "client", clientId?: string): Socket {
  if (socket) {
    // If the socket query details are different, we might want to recreate it.
    // For our use case, the role or clientId is stable once set.
    return socket;
  }
  
  const query: Record<string, string> = { role };
  if (clientId) {
    query.clientId = clientId;
  }
  
  // Connect to the same origin serving the app
  socket = io(window.location.origin, {
    query,
    auth: { token: localStorage.getItem('gexam_admin_token') },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });
  
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
