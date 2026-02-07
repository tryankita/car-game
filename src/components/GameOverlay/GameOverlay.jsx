import React from 'react';
import './GameOverlay.css';

const GameOverlay = ({ type, score, onStart }) => {
    if (type === 'start') {
        return (
            <div className="overlay">
                <h1>🏎️ Car Game</h1>
                <p className="instructions">Use ← → arrow keys to move</p>
                <button onClick={onStart}>Start Game</button>
            </div>
        );
    }

    if (type === 'gameover') {
        return (
            <div className="overlay gameover">
                <h1>💥 Game Over</h1>
                <p className="final-score">Score: {score}</p>
                <button onClick={onStart}>Play Again</button>
            </div>
        );
    }

    return null;
};

export default GameOverlay;
