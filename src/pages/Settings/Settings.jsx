import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const Settings = () => {
	const navigate = useNavigate();
	const [soundLevel, setSoundLevel] = useState(50);
	const [musicLevel, setMusicLevel] = useState(50);
	const [pedalsEnabled, setPedalsEnabled] = useState(true);
	const [language, setLanguage] = useState('en');
	const soundMuted = soundLevel === 0;
	const musicPaused = musicLevel === 0;

	return (
	<div className="settings-container">
		{/* Background — same as Home */}
		<div className="cloud c1" aria-hidden="true"></div>
		<div className="cloud c2" aria-hidden="true"></div>
		<div className="hills-container" aria-hidden="true">
			<div className="hill hill-1"></div>
			<div className="hill hill-2"></div>
		</div>

		{/* Header */}
		<header className="settings-header">
			<button type="button" className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
				<span aria-hidden="true">←</span>
			</button>
			<h1 className="settings-title">⚙️ Settings</h1>
			<div className="header-spacer"></div>
		</header>

		{/* Card */}
		<main className="settings-card">
			{/* Audio Section */}
			<div className="card-section">
				<h2 className="section-heading">🔊 Audio</h2>
				<label className="setting-row" data-setting="sfx">
					<span className="setting-label">Sound Effects {soundMuted ? '(Muted)' : ''}</span>
					<input type="range" min="0" max="100" value={soundLevel} onChange={(e) => setSoundLevel(Number(e.target.value))} className="setting-slider" />
					<span className="setting-value">{soundLevel}%</span>
				</label>
				<label className="setting-row" data-setting="music">
					<span className="setting-label">Music {musicPaused ? '(Paused)' : ''}</span>
					<input type="range" min="0" max="100" value={musicLevel} onChange={(e) => setMusicLevel(Number(e.target.value))} className="setting-slider" />
					<span className="setting-value">{musicLevel}%</span>
				</label>
			</div>

			{/* Controls Section */}
			<div className="card-section">
				<h2 className="section-heading">🎮 Controls</h2>
				<button type="button" className="setting-row setting-toggle" data-setting="pedals" aria-pressed={pedalsEnabled} onClick={() => setPedalsEnabled((prev) => !prev)}>
					<span className="setting-label">Pedals</span>
					<span className={`toggle-pill ${pedalsEnabled ? 'on' : 'off'}`}>{pedalsEnabled ? 'ON' : 'OFF'}</span>
				</button>
			</div>

			{/* Language Section */}
			<div className="card-section">
				<h2 className="section-heading">🌐 Language</h2>
				<label className="setting-row" data-setting="language">
					<span className="setting-label">Language</span>
					<select value={language} onChange={(e) => setLanguage(e.target.value)} className="setting-select">
						<option value="en">English</option>
						<option value="es">Español</option>
						<option value="fr">Français</option>
					</select>
				</label>
			</div>
		</main>
	</div>
	);
};

export default Settings;
