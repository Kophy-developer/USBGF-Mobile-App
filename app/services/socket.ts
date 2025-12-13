const BASE_URL = 'https://sp-usbgf.3kguzm.easypanel.host/api';

let socketInstance: any = null;
let socketIoClient: any = null;

const getSocketIo = () => {
  if (!socketIoClient) {
    try {
      socketIoClient = require('socket.io-client');
    } catch (error) {
      console.warn('socket.io-client not available:', error);
      return null;
    }
  }
  return socketIoClient;
};

export interface SocketMessage {
  messageId: string;
  sender: {
    _id: string;
    username: string;
    picture: string;
    phone: string;
  };
  receiver: {
    _id: string;
    username: string;
    picture: string;
    phone: string;
  };
  receiverUsername: string;
  content: string;
  messageType: string;
  timestamp: string;
  readBy: string[];
}

export function connectSocket(playerId: number | string): any {
  const io = getSocketIo();
  if (!io) {
    console.warn('socket.io-client not available, socket connection disabled');
    return null;
  }

  if (socketInstance?.connected) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
  }

  const socketUrl = BASE_URL;
  socketInstance = io(socketUrl, {
    query: {
      accessID: String(playerId),
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function getSocket(): any {
  return socketInstance;
}

