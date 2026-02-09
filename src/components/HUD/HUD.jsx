import React from 'react';
import './HUD.css';

const HUD = ({ score }) => {
    return (
        <div className="hud" aria-live="polite">
            Score: {score} pts
        </div>
    );
};

export default HUD;
