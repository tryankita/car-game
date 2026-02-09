import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Home.css';
import monsterTruck from '../../assets/monster_truck.svg';

const Home = () => {
    const navigate = useNavigate();
    const [isStarting, setIsStarting] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const handlePlay = () => {
        setIsStarting(true);
        setTimeout(() => navigate('/game'), 1000);
    };

    return (
        <div className="home-container">
            {/* Background Elements */}
            <div className="cloud c1"></div>
            <div className="cloud c2"></div>

            <div className="hills-container">
                <div className="hill hill-1"></div>
                <div className="hill hill-2"></div>
            </div>

            {/* Header */}
            <header className="home-header">
                <div className="coin-counter">
                    <div className="coin-icon">🪙</div>
                    <span>0</span>
                </div>
                <button className="settings-btn" onClick={() => setShowSettings(!showSettings)} aria-label="Toggle settings" aria-expanded={showSettings} aria-controls="settings-panel">⚙️</button>
            </header>

            {/* Settings Panel */}
            {showSettings && (
                <>
                    <div className="settings-backdrop" onClick={() => setShowSettings(false)} />
                    <div className="settings-panel" id="settings-panel" aria-hidden={!showSettings}>
                        <h2>Settings</h2>
                        <button onClick={() => setShowSettings(false)} aria-label="Close settings">✕</button>
                    </div>
                </>
            )}

            {/* Main Content / Logo */}
            <main className="main-content">
                <div className="game-logo">
                    <div className="logo-top">Car Hill</div>
                    <div className="logo-main">RACING</div>
                    <div className="logo-bottom">Lite</div>
                </div>
                <img src={monsterTruck} alt="Monster Truck" className={`home-car-img ${isStarting ? 'starting' : ''}`} />
            </main>

            {/* Bottom Navigation */}
            < nav className="bottom-nav" >
                <button className="menu-btn btn-vehicle">
                    <span className="btn-icon">🔧</span>
                    Vehicle
                </button>
                <button className="menu-btn btn-stage">
                    <span className="btn-icon">⛰️</span>
                    Stage
                </button>
                <button className="menu-btn btn-start" onClick={handlePlay}>
                    <span className="btn-icon">▶️</span>
                    Start
                </button>
            </nav >
        </div >
    );
};

export default Home;
