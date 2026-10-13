import { io, type Socket } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, { autoConnect: true, transports: ["websocket", "polling"] });
  }
  return socket;
}
