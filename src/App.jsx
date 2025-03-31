import './App.css';
import { useState } from 'react';

function Square({ value, onClick }) {
  return (
    <button className="square" onClick={onClick}>
      {value}
    </button>
  );
}

export default function Board() {
  // Track selected squares as individual states
  const [square1, setSquare1] = useState('🌊');
  const [square2, setSquare2] = useState('🌊');
  const [square3, setSquare3] = useState('🌊');
  const [square4, setSquare4] = useState('🌊');
  const [square5, setSquare5] = useState('🌊');
  const [square6, setSquare6] = useState('🌊');
  const [square7, setSquare7] = useState('🌊');
  const [square8, setSquare8] = useState('🌊');
  const [square9, setSquare9] = useState('🌊');

  // Track total selected count
  const [selectedCount, setSelectedCount] = useState(0);

  // Generic click handler
  const handleClick = (currentValue, setter) => {
    if (currentValue === '🚤') {
      setter('🌊');
      setSelectedCount(prev => prev - 1);
    } else if (selectedCount < 3) {
      setter('🚤');
      setSelectedCount(prev => prev + 1);
    }
  };

  return (
    <>
      <div className="button-container">
        <div className="row">
          <Square value={square1} onClick={() => handleClick(square1, setSquare1)} />
          <Square value={square2} onClick={() => handleClick(square2, setSquare2)} />
          <Square value={square3} onClick={() => handleClick(square3, setSquare3)} />
        </div>
        <div className="row">
          <Square value={square4} onClick={() => handleClick(square4, setSquare4)} />
          <Square value={square5} onClick={() => handleClick(square5, setSquare5)} />
          <Square value={square6} onClick={() => handleClick(square6, setSquare6)} />
        </div>
        <div className="row">
          <Square value={square7} onClick={() => handleClick(square7, setSquare7)} />
          <Square value={square8} onClick={() => handleClick(square8, setSquare8)} />
          <Square value={square9} onClick={() => handleClick(square9, setSquare9)} />
        </div>
      </div>
      <div className="message">
        {selectedCount === 3 ? <button className='ready to start'>Ready to Start</button> : `Select ${3 - selectedCount} more squares`}
      </div>
    </>
  );
}