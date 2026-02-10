import React from 'react';
import './Road.css';

const Road = ({ children }) => {
    return (
        <div className="road" role="application" aria-label="Race lanes">
            <div className="lane-marker" aria-hidden="true"></div>
            <div className="lane-marker" aria-hidden="true"></div>
            {children}
        </div>
    );
};

export default Road;
