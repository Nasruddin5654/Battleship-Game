// src/components/GameScreen.jsx
import { useState, useEffect, useRef } from 'react';
import Square from './Square';
import { socket } from '../../Server/socket'; // Verify this path matches your structure
import '../../Styles/App.css'; 

export default function GameScreen({ gameId, playerBoard }) {
  const [opponentBoard, setOpponentBoard] = useState(Array(9).fill('🌊'));
  const [myTurn, setMyTurn] = useState(false);
  const [gameStatus, setGameStatus] = useState('Waiting for game to start...');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const prevGameId = useRef();

  // Socket event handlers
  useEffect(() => {
    console.log(`Initializing game ${gameId}`);
    
    const onGameStart = ({ startingPlayer }) => {
      const isMyTurn = socket.id === startingPlayer;
      setMyTurn(isMyTurn);
      setGameStatus(isMyTurn ? 'Your turn!' : 'Opponent\'s turn');
      console.log(`Game started! First turn: ${startingPlayer}`);
    };

    const onAttackResult = ({ position, result }) => {
      const newBoard = [...opponentBoard];
      newBoard[position] = result === 'hit' ? '💥' : '❌';
      setOpponentBoard(newBoard);
      setMyTurn(true);
      setGameStatus('Your turn!');
    };

    const onOpponentAttack = (position) => {
      const newBoard = [...playerBoard];
      const wasHit = newBoard[position] === '🚤';
      newBoard[position] = wasHit ? '💥' : '❌';
      
      socket.emit('attackResult', { 
        gameId, 
        position, 
        result: wasHit ? 'hit' : 'miss' 
      });
      
      setGameStatus(wasHit ? 'Hit! Your turn next' : 'Miss! Your turn next');
    };

    const onDisconnect = () => {
      setConnectionStatus('Disconnected - attempting to reconnect...');
    };

    const onReconnect = () => {
      setConnectionStatus('Reconnected!');
      socket.emit('rejoinGame', { gameId });
    };

    // Only setup new listeners if gameId changes
    if (gameId !== prevGameId.current) {
      socket.on('gameStart', onGameStart);
      socket.on('attackResult', onAttackResult);
      socket.on('opponentAttack', onOpponentAttack);
      socket.on('disconnect', onDisconnect);
      socket.on('reconnect', onReconnect);
      
      prevGameId.current = gameId;
    }

    // Send ready status when component mounts
    socket.emit('playerReady', { gameId });

    return () => {
      socket.off('gameStart', onGameStart);
      socket.off('attackResult', onAttackResult);
      socket.off('opponentAttack', onOpponentAttack);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect', onReconnect);
    };
  }, [gameId, opponentBoard, playerBoard]);

  const handleAttack = (position) => {
    if (!myTurn) return;
    
    console.log(`Attacking position ${position}`);
    socket.emit('attack', { 
      gameId, 
      position,
      timestamp: Date.now() 
    }, (ack) => {
      if (ack?.success) {
        setMyTurn(false);
        setGameStatus('Waiting for opponent...');
      } else {
        console.error('Attack failed:', ack?.error);
        setGameStatus(ack?.error || 'Attack failed');
      }
    });
  };

  // Connection status indicator
  useEffect(() => {
    const onConnect = () => setConnectionStatus('Connected');
    const onConnectError = (err) => setConnectionStatus(`Error: ${err.message}`);
    
    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    
    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  return (
    <div className="game-container">
      <div className="connection-status">
        {connectionStatus} | Game ID: {gameId}
      </div>
      
      <div className="boards">
        <div className="board-section">
          <h3>Your Board</h3>
          <div className="board-grid">
            {playerBoard.map((value, index) => (
              <Square 
                key={`player-${index}`} 
                value={value}
                disabled={true} // Can't click your own board
              />
            ))}
          </div>
        </div>
        
        <div className="board-section">
          <h3>Attack Board</h3>
          <div className="board-grid">
            {opponentBoard.map((value, index) => (
              <Square
                key={`opponent-${index}`}
                value={value}
                onClick={() => handleAttack(index)}
                disabled={!myTurn || value !== '🌊'}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className={`game-status ${myTurn ? 'your-turn' : 'opponent-turn'}`}>
        {gameStatus}
        {myTurn && <div className="pulse-animation">▼</div>}
      </div>
    </div>
  );
}