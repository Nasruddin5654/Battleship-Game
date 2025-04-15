import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io'; 
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';

// For __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const server = createServer(app);
const io = new SocketServer(server, { 
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000 
  }
});

// Game state management
const activeGames = new Map();

// Improved ID generation
function generateId() {
  return Math.random().toString(36).slice(2, 8) + 
         Date.now().toString(36).slice(-4);
}

io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] New connection:`, socket.id);

  
  socket.on('ping', (cb) => cb(Date.now()));

  socket.on('createGame', (callback) => {
    try {
      const gameId = generateId();
      activeGames.set(gameId, {
        players: [socket.id],
        boards: new Map(),
        createdAt: Date.now()
      });
      
      socket.join(gameId);
      console.log(`Game created: ${gameId}`);
      callback({ success: true, gameId });
    } catch (err) {
      console.error('CreateGame error:', err);
      callback({ success: false, error: err.message });
    }
  });
  
  socket.on('joinGame', ({ gameId }, callback) => {
    try {
      const game = activeGames.get(gameId);
      if (!game) {
        return callback({ success: false, error: 'Game not found' });
      }
  
      if (game.players.length >= 2) {
        return callback({ success: false, error: 'Game is full' });
      }
  
      game.players.push(socket.id);
      socket.join(gameId);
      console.log(`Player ${socket.id} joined game ${gameId}`);
      callback({ success: true });
    } catch (err) {
      console.error('JoinGame error:', err);
      callback({ success: false, error: err.message });
    }
  });
  
  socket.on('submitBoard', ({ gameId, board }, callback) => {
    try {
      const game = activeGames.get(gameId);
      if (!game) {
        throw new Error(`Game ${gameId} not found`);
      }

      game.boards.set(socket.id, board);
      console.log(`Player ${socket.id} submitted board for ${gameId}`);

      callback({ 
        success: true, 
        playersReady: game.boards.size,
        totalPlayers: game.players.length 
      });

      if (game.boards.size === game.players.length) {
        console.log(`Starting game ${gameId}`);
        io.to(gameId).emit('gameStart', { 
          startTime: Date.now(),
          players: [...game.players],
          startingPlayer: game.players[Math.floor(Math.random() * game.players.length)]
        });
      }
    } catch (err) {
      console.error('SubmitBoard error:', err);
      callback({ success: false, error: err.message });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`Disconnected (${socket.id}):`, reason);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`
  🚀 Server running on port ${PORT}
  🌐 CORS configured for: http://localhost:5173
  `);
});


// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
