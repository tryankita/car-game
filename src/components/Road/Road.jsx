import React from 'react';
import './Road.css';

const Road = ({ children }) => {
    return (
        <div className="road">
            <div className="lane-marker"></div>
            <div className="lane-marker"></div>
            {children}
        </div>
    );
};

export default Road;
