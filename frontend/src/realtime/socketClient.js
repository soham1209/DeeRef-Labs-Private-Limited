// src/realtime/socketClient.js
import { io } from 'socket.io-client';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const createSocket = (token) => {
  return io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket'],
  });
};
