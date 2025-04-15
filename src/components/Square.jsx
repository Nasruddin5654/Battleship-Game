// src/components/Square.jsx
export default function Square({ value, onClick, disabled }) {
    return (
      <button 
        className="square" 
        onClick={onClick}
        disabled={disabled}
      >
        {value}
      </button>
    );
  }