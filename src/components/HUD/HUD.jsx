import React from 'react';
import './HUD.css';

const HUD = ({ score }) => {
    return (
        <div className="hud" aria-live="polite" aria-label="Score tracker">
            Score: <strong>{score}</strong> pts
        </div>
    );
};

export default HUD;
