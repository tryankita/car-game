import React from 'react';
import './Car.css';

const Car = ({ lane, isPlayer = false }) => {
    const leftPosition = lane * 33.33 + 16.66;

    return (
        <div
            className={`car ${isPlayer ? 'player' : ''}`}
            style={{ left: `${leftPosition}%` }}
            tabIndex={isPlayer ? 0 : -1}
            aria-label={isPlayer ? 'Player car' : 'Traffic car'}
        />
    );
};

export default Car;
