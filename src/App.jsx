import { useState, useEffect, useCallback } from 'react';
import { socket } from '../Server/socket'; 
import Square from './components/Square';
import GameScreen from './components/GameScreen';
import '/Styles/App.css';

export default function App() {
  const [screen, setScreen] = useState('setup');
  const [gameId, setGameId] = useState(null);
  const [joinGameId, setJoinGameId] = useState('');
  const [board, setBoard] = useState(Array(36).fill('🌊')); // 6x6 grid (36 squares)
  const [selectedCount, setSelectedCount] = useState(0); // Track selected boats (now 6)
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  // Socket connection
  useEffect(() => {
    const onConnect = () => {
      console.log('Socket connected:', socket.id);
      setConnectionStatus('Connected');
    };

    const onDisconnect = () => {
      console.log('Socket disconnected');
      setConnectionStatus('Disconnected');
    };

    const onConnectError = (err) => {
      console.error('Connection error:', err);
      setConnectionStatus(`Error: ${err.message}`);
    };

    socket.connect();
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.disconnect();
    };
  }, []);

  // Handle square clicks
  const handleSquareClick = useCallback((index) => {
    setBoard(prevBoard => {
      const newBoard = [...prevBoard];
      if (newBoard[index] === '🚤') {
        newBoard[index] = '🌊';
      } else if (prevBoard.filter(x => x === '🚤').length < 6) { // Allow 6 boats now
        newBoard[index] = '🚤';
      }
      return newBoard;
    });
  }, []);

  useEffect(() => {
    setSelectedCount(board.filter(cell => cell === '🚤').length);
  }, [board]);

  const createGame = useCallback(() => {
    setConnectionStatus('Creating game...');
    socket.emit('createGame', (response) => {
      if (response?.success) {
        setGameId(response.gameId);
        setConnectionStatus('Connected');
      } else {
        setConnectionStatus(`Error: ${response?.error || 'Unknown error'}`);
      }
    });
  }, []);

  const joinGame = useCallback(() => {
    if (!joinGameId) return;

    setConnectionStatus('Joining game...');
    socket.emit('joinGame', { gameId: joinGameId }, (response) => {
      if (response?.success) {
        setGameId(joinGameId);
        setConnectionStatus('Connected to game');
      } else {
        setConnectionStatus(`Error: ${response?.error || 'Join failed'}`);
      }
    });
  }, [joinGameId]);

  const startGame = useCallback(() => {
    if (selectedCount !== 6 || !gameId) return; // Check for 6 boats now

    setConnectionStatus('Submitting board...');
    socket.emit('submitBoard', { gameId, board }, (response) => {
      if (!response) {
        setConnectionStatus('Error: No server response');
        return;
      }

      if (response.success) {
        if (response.playersReady === response.totalPlayers) {
          setScreen('game');
          setConnectionStatus('Game started!');
        } else {
          setConnectionStatus('Waiting for opponent...');
        }
      } else {
        setConnectionStatus(`Error: ${response.error}`);
      }
    });
  }, [selectedCount, gameId, board]);

  useEffect(() => {
    socket.on('gameStart', (data) => {
      console.log('Game started by server:', data);
      setScreen('game');
      setConnectionStatus('Game started!');
    });

    return () => {
      socket.off('gameStart');
    };
  }, []);

  return (
    <div className="app-container">
      <div className="connection-banner">
        Status: {connectionStatus} | {socket?.id ? `ID: ${socket.id}` : 'Connecting...'}
      </div>

      {screen === 'setup' ? (
        <div className="setup-phase">
          <h1>Battleship Setup</h1>
          <div className="board">
            {board.map((value, index) => (
              <Square
                key={`square-${index}`}
                value={value}
                onClick={() => handleSquareClick(index)}
                disabled={connectionStatus !== 'Connected' && connectionStatus !== 'Connected to game'}
              />
            ))}
          </div>

          <div className="controls">
            <p className="selection-status">
              {selectedCount === 6 ? 'Ready to start!' : `Select ${6 - selectedCount} more squares`} {/* Update message for 6 boats */}
            </p>

            <div className="button-group">
              {!gameId && (
                <>
                  <button onClick={createGame} disabled={!socket.connected} className="create-button">
                    {socket.connected ? 'Create Game' : 'Connecting...'}
                  </button>
                  <div className="join-section">
                    <input
                      type="text"
                      placeholder="Enter Game ID"
                      value={joinGameId}
                      onChange={(e) => setJoinGameId(e.target.value)}
                      disabled={!socket.connected}
                    />
                    <button
                      onClick={joinGame}
                      disabled={!joinGameId || !socket.connected}
                      className="join-button"
                    >
                      Join Game
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={startGame}
                disabled={selectedCount !== 6 || !gameId || !socket.connected} // Disable start if not 6 boats
                className="start-button"
              >
                Start Game
              </button>
            </div>
          </div>
        </div>
      ) : (
        gameId ? (
          <GameScreen 
            gameId={gameId} 
            playerBoard={board} 
            onBack={() => setScreen('setup')}
          />
        ) : (
          <div className="error-screen">
            <h2>Error: Missing Game ID</h2>
            <button onClick={() => setScreen('setup')}>
              Return to Setup
            </button>
          </div>
        )
      )}
    </div>
  );
}
