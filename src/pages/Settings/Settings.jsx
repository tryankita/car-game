import { useState } from 'react';
import './Settings.css';

const Settings = () => {
	const [soundOn, setSoundOn] = useState(true);
	const [musicOn, setMusicOn] = useState(true);
	const [pedalAssist, setPedalAssist] = useState(false);
	const [language, setLanguage] = useState('en');

	return (
	<section className="settings-page" aria-label="Game settings" data-page="settings">
		<h1 data-heading="settings-title">Settings</h1>
		<p className="settings-lede">Adjust audio, input, and language preferences before racing.</p>
		<div className="settings-panel" role="group" aria-label="Audio and controls" data-section="panel">
			<h2 className="settings-subhead" data-heading="audio" data-group="audio">Audio</h2>
			<button type="button" className="setting-row" aria-pressed={soundOn} data-setting="sfx" data-intent="toggle-sfx" onClick={() => setSoundOn((prev) => !prev)}>Sound Effects</button>
			<button type="button" className="setting-row" aria-pressed={musicOn} data-setting="music" data-intent="toggle-music" onClick={() => setMusicOn((prev) => !prev)}>Music</button>
			<h2 className="settings-subhead" data-heading="controls" data-group="controls">Controls & Language</h2>
			<button type="button" className="setting-row" aria-pressed={pedalAssist} data-setting="pedal" data-intent="toggle-pedal" onClick={() => setPedalAssist((prev) => !prev)}>Pedal Assist</button>
			<label className="setting-row" data-setting="language" data-intent="select-language">
				<span>Language</span>
				<select aria-label="Language" value={language} data-field="language" onChange={(event) => setLanguage(event.target.value)}>
					<option value="en">English</option>
					<option value="es">Español</option>
					<option value="fr">Français</option>
				</select>
			</label>
		</div>
	</section>
);
};
export default Settings;
