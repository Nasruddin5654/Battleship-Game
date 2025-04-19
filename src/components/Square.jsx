import React from 'react';
import '../../Styles/App.css';

export default function Square({ value, onClick, disabled }) {
  return (
    <button 
      className={`square ${disabled ? 'disabled' : ''}`} 
      onClick={(e) => {
        if (!disabled && typeof onClick === 'function') {
          onClick(e);
        }
      }}
      disabled={disabled}
    >
      {value}
    </button>
  );
}
