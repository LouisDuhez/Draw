import { io, type Socket } from 'socket.io-client';
import { useSocketStore } from '../store/useSocketStore';
import type { User } from '../types/user.type';
import type { Drawpoint, DrawStroke, Point } from '../types/drawing.type';

/* This class is a singleton, it exports a single instance */
const VITE_SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL;

// Événements envoyés par le client vers le serveur
export type SocketClientToServerEvents = {
  'myUser:join': (player: Omit<User, 'id' | 'socketId' | 'hasJoined'>) => void;
  'myUser:leave': (userId: string) => void;
  'myUser:edit': (userId: string, updates: Partial<User>) => void;
  'draw:start': (data: Drawpoint) => void; /* @todo */
  'draw:move': (data: Point) => void; /* @todo */
  'draw:end': () => void; /* @todo */
  'canvas:reset': () => void;
}

// Événements reçus du serveur vers le client
export type SocketServerToClientEvents = {
  'myUser:joined': (payload: { user: User }) => void;
  'user:left': (payload: { user: User }) => void;
  'myUser:edited': (payload: { user: User }) => void;
  'users:updated': (payload: { users: User[] }) => void;
  'draw:start': (payload: DrawStroke) => void; 
// @todo: ajouter les types pour les traits de dessin
  'draw:move': (payload: DrawStroke) => void; 
// @todo: ajouter les types pour les traits de dessin
  'draw:end':(payload: DrawStroke) => void; 
// @todo: ajouter les types pour les traits de dessin
  'canvas:reset': () => void;
}

export type GetEndpoints = {
  'users': {users: User[]};
  'strokes': {strokes: DrawStroke[]} // @todo: ajouter les types pour les traits de dessin
}

class _SocketManager {
  private socketManager: Socket | null;

  constructor() {
    this.socketManager = null;
    this.connect();
  }

  private connect() {
    const socketManagerInstance = io(VITE_SOCKET_SERVER_URL);
   
    socketManagerInstance.on("connect", () => {
      console.log(`%c SocketProvider: Connected to Socket ${VITE_SOCKET_SERVER_URL} with ID ${socketManagerInstance?.id}`, 'color: green');
      this.socketManager = socketManagerInstance;

      useSocketStore.setState({ isConnectedToServer: true });
    }); 

    socketManagerInstance.on("connect_error", (error) => {
      console.error('SocketProvider: Connection Error', {error});

      useSocketStore.setState({ isConnectedToServer: false });
    });

    socketManagerInstance.on("disconnect", (reason) => {
      console.error('SocketProvider: DisConnectedToServer', {reason});
      this.socketManager = null;

      useSocketStore.setState({ isConnectedToServer: false });
    });
  }

  // Méthode typée pour écouter les événements du serveur
  listen<K extends keyof SocketServerToClientEvents>(
    eventName: K, 
    callback: SocketServerToClientEvents[K]
  ): void {
    if (!this.socketManager) {
      console.warn(`Cannot listen to ${String(eventName)}: Socket not connected`);
      return;
    }
    // Utilisation d'une assertion de type pour contourner les problèmes de typage Socket.IO
    this.socketManager.on(eventName as string, callback as (...args: unknown[]) => void);
  }

  // Méthode typée pour émettre des événements vers le serveur
  emit<K extends keyof SocketClientToServerEvents>(
    eventName: K, 
    ...args: Parameters<SocketClientToServerEvents[K]>
  ): void {
    console.log('EMIT', { eventName, args, socketManger: this.socketManager });
    if (!this.socketManager) {
      console.warn(`Cannot emit ${String(eventName)}: Socket not connected`);
      return;
    }
    this.socketManager.emit(eventName as string, ...args);
  }

  // Méthode pour arrêter l'écoute d'un événement
  off<K extends keyof SocketServerToClientEvents>(
    eventName: K, 
    callback?: SocketServerToClientEvents[K]
  ): void {
    if (!this.socketManager) return;
    this.socketManager.off(eventName as string, callback as (...args: unknown[]) => void);
  }

  // Méthodes utilitaires
  get isConnectedToServer(): boolean {
    return this.socketManager?.connected ?? false;
  }

  get socketId(): string | undefined {
    return this.socketManager?.id;
  }

  disconnect(): void {
    if (this.socketManager) {
      this.socketManager.disconnect();
      this.socketManager = null;
    }
  }

  reconnect(): void {
    if (this.socketManager) {
      this.socketManager.connect();
    } else {
      this.connect();
    }
  }

  async get<K extends keyof GetEndpoints>(
    endpoint: K
  ): Promise<GetEndpoints[K] | undefined> {
    const payload = await fetch(`${VITE_SOCKET_SERVER_URL}/api/${endpoint}/get`, { method: 'GET' });
    if (payload.ok) {
      const data = await payload.json();
      return data;
    }
  }
}

export const SocketManager = new _SocketManager();