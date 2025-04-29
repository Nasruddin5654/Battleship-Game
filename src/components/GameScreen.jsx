import { useState, useEffect } from 'react';
import Square from './Square';
import { socket, connectSocket } from '../../Server/socket';
import '../../Styles/App.css';

export default function GameScreen({ gameId, playerBoard }) {
  const [opponentBoard, setOpponentBoard] = useState(Array(36).fill('🌊'));
  const [myTurn, setMyTurn] = useState(false);
  const [gameStatus, setGameStatus] = useState('Waiting for game to start...');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(false);

  useEffect(() => {
    connectSocket();

    const onGameStart = ({ startingPlayer }) => {
      const isMyTurn = socket.id === startingPlayer;
      setMyTurn(isMyTurn);
      setGameStatus(isMyTurn ? 'Your turn!' : 'Opponent\'s turn');
    };

    const onAttackResult = ({ position, result }) => {
      setOpponentBoard(prev => {
        const updated = [...prev];
        updated[position] = result === 'hit' ? '💥' : '❌';
        return updated;
      });

      if (result === 'miss') {
        setMyTurn(false);
        setGameStatus('Opponent\'s turn');
      } else {
        setGameStatus('Your turn!');
      }
    };

    const onOpponentAttack = (position) => {
      const wasHit = playerBoard[position] === '🚤';
      playerBoard[position] = wasHit ? '💥' : '❌';

      socket.emit('attackResult', {
        gameId,
        position,
        result: wasHit ? 'hit' : 'miss',
      });

      if (!wasHit) {
        setMyTurn(true);
        setGameStatus('Your turn!');
      }
    };

    const onGameOver = ({ winner, message }) => {
      setGameOver(true);
      setWinner(winner);
      setGameStatus(message);
    };

    socket.on('gameStart', onGameStart);
    socket.on('attackResult', onAttackResult);
    socket.on('opponentAttack', onOpponentAttack);
    socket.on('gameOver', onGameOver);

    socket.emit('playerReady', { gameId });

    return () => {
      socket.off('gameStart', onGameStart);
      socket.off('attackResult', onAttackResult);
      socket.off('opponentAttack', onOpponentAttack);
      socket.off('gameOver', onGameOver);
    };
  }, [gameId, playerBoard]);

  const handleAttack = (position) => {
    if (!myTurn || opponentBoard[position] !== '🌊' || gameOver) return;

    socket.emit(
      'attack',
      { gameId, position },
      (ack) => {
        if (ack?.success) {
          setGameStatus('Waiting for opponent...');
        } else {
          setGameStatus('Attack failed');
        }
      }
    );
  };

  return (
    <div className="game-container">
      <div className="connection-status">
        {connectionStatus} | Game ID: {gameId}
      </div>

      {gameOver ? (
        <div className="winner-screen">
          <h1>{winner ? '🏆 You Win! 🏆' : '❌ You Lost ❌'}</h1>
        </div>
      ) : (
        <>
          <div className="boards">
            <div className="board-section">
              <h3>Your Board</h3>
              <div className="board-grid grid-6x6">
                {playerBoard.map((value, index) => (
                  <Square key={`player-${index}`} value={value} disabled={true} />
                ))}
              </div>
            </div>

            <div className="board-section">
              <h3>Attack Board</h3>
              <div className="board-grid grid-6x6">
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
        </>
      )}
    </div>
  );
}
