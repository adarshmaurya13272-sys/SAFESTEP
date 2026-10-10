import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

type SocketEventHandler = (...args: any[]) => void;

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(WS_URL, {
        withCredentials: true,
        autoConnect: true,
        reconnectionAttempts: 5,
      });
    }
    if (!this.socket.connected) {
      this.socket.connect();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  on(event: string, handler: SocketEventHandler) {
    const socket = this.connect();
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }

  off(event: string, handler?: SocketEventHandler) {
    this.socket?.off(event, handler);
  }

  emit(event: string, data?: unknown) {
    const socket = this.connect();
    socket.emit(event, data);
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }
}

export const socketService = new SocketService();
