import { io } from 'socket.io-client';

export const socket = io('http://localhost:4000', { // Update this port to match your server
  autoConnect: false, // We want to manually control the connection
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to server with socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  // Update UI state or handle logic on disconnect
});

socket.on('connect_error', (err) => {
  console.log('Connection error:', err);
  // Handle error state in UI
});

socket.on('reconnect_attempt', (attempt) => {
  console.log(`Reconnecting... Attempt ${attempt}`);
});

socket.on('reconnect_failed', () => {
  console.log('Reconnection failed!');
});

socket.on('reconnect', () => {
  console.log('Reconnected to server');
  // Optionally, emit a rejoin event if needed
});

// Export a function to manually start the connection (e.g., in your React component)
export const connectSocket = () => {
  socket.connect();
};
