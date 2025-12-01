import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (userId: string) => {
  if (!socket) {
    console.log("🌐 Connecting to:", process.env.NEXT_PUBLIC_API_URL);

    socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      transports: ["websocket"],
      auth: { userId },
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("✅ CONNECTED:", socket?.id);
    });
    socket.onAny((event, data) => {
      console.log("📩 CLIENT RECEIVED EVENT:", event, data);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ CONNECT ERROR:", err);
    });
  }

  return socket;
};

export const getSocket = () => socket;
