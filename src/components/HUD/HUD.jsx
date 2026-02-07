import React from 'react';
import './HUD.css';

const HUD = ({ score }) => {
    return (
        <div className="hud">
            Score: {score}
        </div>
    );
};

export default HUD;
