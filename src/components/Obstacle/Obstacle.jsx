import React from 'react';
import './Obstacle.css';

const Obstacle = ({ lane, y }) => {
    const leftPosition = lane * 33.33 + 16.66;

    return (
        <div
            className="car obstacle"
            style={{
                left: `${leftPosition}%`,
                top: `${y}%`
            }}
        />
    );
};

export default Obstacle;
