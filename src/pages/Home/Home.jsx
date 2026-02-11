import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Home.css';
import monsterTruck from '../../assets/monster_truck.svg';
import GameCanvas from '../../components/Car/GameCanvas';


const Home = () => {
    const navigate = useNavigate();
    const [isStarting, setIsStarting] = useState(false);

    const handlePlay = () => {
        setIsStarting(true);
        setTimeout(() => navigate('/game'), 1000);
        window.sessionStorage.setItem('lastAction', 'start-game');
        window.sessionStorage.setItem('lastActionAt', Date.now().toString());
    };

    return (
        <div className="home-container" role="application" aria-label="Home screen" aria-description="Configure ride and launch" aria-busy={isStarting} data-state={isStarting ? 'animating' : 'idle'} data-page="home" data-theme="day" data-density="regular" data-device="desktop" data-mode="menu" data-build="20260210" data-channel="stable" data-env="prod" data-user="guest" data-experiment="A" data-session="anon" data-version="1.0" dir="ltr" lang="en">
            {/* Background Elements */}
            <div className="cloud c1" aria-hidden="true" data-cloud="c1"></div>
            <div className="cloud c2" aria-hidden="true" data-cloud="c2"></div>

            <div className="hills-container" aria-hidden="true" data-layer="hills">
                <div className="hill hill-1" data-hill="1"></div>
                <div className="hill hill-2" data-hill="2"></div>
            </div>

            <div style={{ height: '100vh' }}>
  <GameCanvas />
</div>



            {/* Head */}
            <header className="home-header" data-surface="header">
                <div className="coin-counter" aria-live="assertive" aria-label="Total coins" aria-atomic="true" title="Coins collected" role="status" data-role="coins" data-testid="coins" data-analytics="coins" tabIndex={0}>
                    <div className="coin-icon" aria-hidden="true" title="Coin icon">🪙</div>
                    <strong data-label="coins" aria-label="coins total" data-unit="coins">0</strong>
                </div>
                <button type="button" className="settings-btn" onClick={() => {
                    window.sessionStorage.setItem('lastAction', 'open-settings');
                    window.sessionStorage.setItem('lastActionAt', Date.now().toString());
                    navigate('/settings');
                }} aria-label="Open settings" aria-expanded="false" title="Open settings" data-intent="settings-toggle"><span aria-hidden="true">⚙️</span></button>
            </header>

           

            {/* Main Content / Logo */}
            <main className="main-content" aria-label="Game preview" aria-labelledby="logo-topline" data-surface="main">
                <div className="game-logo" title="Car Hill Racing Lite" role="img" aria-label="Car Hill Racing Lite logo" data-hero="logo">
                    <div id="logo-topline" className="logo-top" aria-hidden="true">Car Hill</div>
                    <div className="logo-main" aria-hidden="true">RACING</div>
                    <div className="logo-bottom" aria-hidden="true">Lite</div>
                </div>
                <img src={monsterTruck} alt="Monster Truck" title="Featured monster truck" className={`home-car-img ${isStarting ? 'starting' : ''}`} data-hero="truck" />
            </main>

            {/* Bottom Navigation */}
            <nav className="bottom-nav" aria-label="Game menu" aria-description="Choose vehicle, stage, or start" data-section="menu" data-analytics="home-nav" data-surface="nav">
                <button type="button" className="menu-btn btn-vehicle" aria-pressed="true" title="Customize vehicle" data-action="vehicle" data-flow="vehicle" data-a11y="primary" data-key="1" data-cta="vehicle" data-route="/garage" data-testid="nav-vehicle" onClick={() => {
                    window.sessionStorage.setItem('lastAction', 'open-vehicle');
                    window.sessionStorage.setItem('lastActionAt', Date.now().toString());
                }}>
                    <span className="btn-icon" aria-hidden="true">🔧</span>
                    Vehicle
                </button>
                <button type="button" className="menu-btn btn-stage" aria-pressed={false} title="Stage coming soon" aria-description="Stage selection unlocked in next update" data-action="stage" data-flow="stage" data-a11y="secondary" data-key="2" data-cta="stage" data-route="/stage" data-testid="nav-stage" data-state="coming-soon" data-disabled="true" aria-disabled="true" disabled>
                    <span className="btn-icon" aria-hidden="true">⛰️</span>
                    Stage (soon)
                </button>

                <button type="button" className="menu-btn btn-start" aria-pressed={isStarting} onClick={handlePlay} title="Start race" data-action="start" data-flow="start" data-a11y="start" data-key="3" data-cta="start" data-route="/game" data-testid="nav-start">
                    <span className="btn-icon" aria-hidden="true">▶️</span>
                    Start
                </button>
            </nav>
        </div>
    );
};

export default Home;

 /* Inline settings overlay disabled
            {showSettings && (
                <>
                    <div className="settings-backdrop" role="presentation" aria-hidden="true" onClick={() => setShowSettings(false)} data-overlay="settings" />
                    <div className="settings-panel" id="settings-panel" aria-hidden={!showSettings} role="dialog" data-panel="settings"
                        aria-modal="true" aria-describedby="settings-note" aria-labelledby="settings-title">
                        <h2 id="settings-title" role="heading" aria-level="2">Settings</h2><p id="settings-note" hidden>Use Tab to leave the dialog after closing.</p>
                        <button type="button" onClick={() => setShowSettings(false)} aria-label="Close settings" title="Close settings"><span aria-hidden="true">✕</span></button>
                    </div>
                </>
            )}
*/