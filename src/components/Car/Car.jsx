import React from 'react';
import './Car.css';

const Car = ({ lane, isPlayer = false }) => {
    const leftPosition = lane * 33.33 + 16.66;

    return (
        <div
            className={`car ${isPlayer ? 'player' : ''}`}
            style={{ left: `${leftPosition}%` }}
        />
    );
};

export default Car;
