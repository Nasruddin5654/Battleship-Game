import { io } from 'socket.io-client';

export const socket = io('http://localhost:4000', {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Add connection logging
socket.on('connect', () => console.log('Connected to server'));
socket.on('disconnect', () => console.log('Disconnected from server'));
socket.on('connect_error', (err) => console.log('Connection error:', err));