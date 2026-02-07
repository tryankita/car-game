import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <h1 className="title">🏎️ Car Race</h1>
            <button className="play-btn" onClick={() => navigate('/game')}>Play</button>
        </div>
    );
};

export default Home;

