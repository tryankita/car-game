import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Game.css';

/* ─── Terrain Generation ─── */
function generateTerrain(startX, length, seed) {
    const points = [];
    const step = 2;
    for (let i = 0; i <= length; i++) {
        const x = startX + i * step;
        const y =
            Math.sin(x * 0.015 + seed) * 50 +
            Math.sin(x * 0.04 + seed * 2) * 25 +
            Math.cos(x * 0.008 + seed * 0.5) * 35;
        points.push({ x, y });
    }
    return points;
}

function getTerrainYAt(terrain, worldX) {
    for (let i = 0; i < terrain.length - 1; i++) {
        if (worldX >= terrain[i].x && worldX <= terrain[i + 1].x) {
            const t = (worldX - terrain[i].x) / (terrain[i + 1].x - terrain[i].x);
            return terrain[i].y + t * (terrain[i + 1].y - terrain[i].y);
        }
    }
    return 0;
}

function getTerrainAngleAt(terrain, worldX) {
    const dx = 4;
    const y1 = getTerrainYAt(terrain, worldX - dx);
    const y2 = getTerrainYAt(terrain, worldX + dx);
    return Math.atan2(y2 - y1, dx * 2);
}

/* ─── Main Game ─── */
const Game = () => {
    const navigate = useNavigate();
    const terrainCanvasRef = useRef(null);

    // Game state
    const [gameState, setGameState] = useState('start');
    const [paused, setPaused] = useState(false);

    // Physics state (refs for animation loop)
    const carX = useRef(100);
    const carVelX = useRef(0);
    const terrainRef = useRef(null);

    // Display state
    const [distance, setDistance] = useState(0);
    const [coins, setCoins] = useState(0);
    const [fuel, setFuel] = useState(100);
    const [rpm, setRpm] = useState(0);
    const boostRef = useRef(0);
    const [boost, setBoost] = useState(0);
    const [tilt, setTilt] = useState(0);
    const [bestRecord, setBestRecord] = useState(() => {
        return parseInt(localStorage.getItem('ccr_best') || '0', 10);
    });
    const [newRecord, setNewRecord] = useState(false);
    const [speed, setSpeed] = useState(0);

    // Controls
    const gasPressed = useRef(false);
    const brakePressed = useRef(false);

    // Terrain
    const terrainSeed = useRef(Math.random() * 1000);
    const terrain = useMemo(
        () => generateTerrain(0, 8000, terrainSeed.current),
        []
    );
    // Keep ref in sync
    terrainRef.current = terrain;

    // Coins on map
    const [mapCoins, setMapCoins] = useState(() => {
        const c = [];
        for (let i = 30; i < 8000; i += Math.floor(Math.random() * 30 + 15)) {
            const x = i * 2;
            c.push({ x, collected: false, id: i });
        }
        return c;
    });
    const [coinPopups, setCoinPopups] = useState([]);

    // Fuel canisters on map
    const [fuelCans, setFuelCans] = useState(() => {
        const f = [];
        for (let i = 50; i < 8000; i += Math.floor(Math.random() * 80 + 80)) {
            f.push({ x: i * 2, collected: false, id: i + 50000 });
        }
        return f;
    });

    // Camera offset
    const cameraX = useRef(0);

    // Animation frame
    const animFrame = useRef(null);
    const lastTime = useRef(0);
    const lastUIUpdate = useRef(0);

    // Ground Y base
    const GROUND_RATIO = 0.55;
    const TERRAIN_SCALE = 0.9;

    /* ─── Draw 2D car on canvas ─── */
    const drawCar = useCallback((ctx, screenX, screenY, angle, w, h) => {
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(-angle);

        const bw = w;
        const bh = h * 0.5;
        const wheelR = h * 0.24;

        // ── Suspension arms
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-bw * 0.32, -4);
        ctx.lineTo(-bw * 0.32, 0);
        ctx.moveTo(bw * 0.32, -4);
        ctx.lineTo(bw * 0.32, 0);
        ctx.stroke();

        // ── Car body (main)
        const bodyGrad = ctx.createLinearGradient(0, -bh - 10, 0, 0);
        bodyGrad.addColorStop(0, '#ff4757');
        bodyGrad.addColorStop(0.5, '#e74c3c');
        bodyGrad.addColorStop(1, '#c0392b');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(-bw / 2, -bh - 8, bw, bh, 8);
        ctx.fill();

        // Body highlight (top shine)
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.roundRect(-bw / 2 + 4, -bh - 6, bw - 8, bh * 0.35, [6, 6, 0, 0]);
        ctx.fill();

        // Body outline
        ctx.strokeStyle = '#a93226';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-bw / 2, -bh - 8, bw, bh, 8);
        ctx.stroke();

        // ── Cabin / windshield
        const glassGrad = ctx.createLinearGradient(-bw * 0.25, -bh - 4, bw * 0.15, -bh + 10);
        glassGrad.addColorStop(0, '#85c1e9');
        glassGrad.addColorStop(0.5, '#aed6f1');
        glassGrad.addColorStop(1, '#5dade2');
        ctx.fillStyle = glassGrad;
        ctx.beginPath();
        ctx.roundRect(-bw * 0.28, -bh - 2, bw * 0.42, bh * 0.52, 4);
        ctx.fill();
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Windshield reflection
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-bw * 0.2, -bh + 1);
        ctx.lineTo(-bw * 0.1, -bh + bh * 0.4);
        ctx.stroke();

        // ── Headlight
        ctx.shadowColor = '#ffeaa7';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffeaa7';
        ctx.beginPath();
        ctx.roundRect(bw / 2 - 10, -bh + 2, 8, 10, 3);
        ctx.fill();
        ctx.shadowBlur = 0;

        // ── Tail light
        ctx.fillStyle = '#e74c3c';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.roundRect(-bw / 2 + 2, -bh + 2, 6, 8, 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // ── Bumper
        ctx.fillStyle = '#777';
        ctx.beginPath();
        ctx.roundRect(bw / 2 - 4, -bh + 14, 6, bh * 0.35, 2);
        ctx.fill();

        // ── Wheels with detail
        const drawWheel = (wx) => {
            // Tire
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(wx, 0, wheelR, 0, Math.PI * 2);
            ctx.fill();
            // Tire edge
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Rim
            const rimGrad = ctx.createRadialGradient(wx - 2, -2, 0, wx, 0, wheelR * 0.55);
            rimGrad.addColorStop(0, '#ccc');
            rimGrad.addColorStop(0.5, '#999');
            rimGrad.addColorStop(1, '#666');
            ctx.fillStyle = rimGrad;
            ctx.beginPath();
            ctx.arc(wx, 0, wheelR * 0.55, 0, Math.PI * 2);
            ctx.fill();
            // Hub
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(wx, 0, wheelR * 0.18, 0, Math.PI * 2);
            ctx.fill();
            // Spokes
            ctx.strokeStyle = '#777';
            ctx.lineWidth = 1.5;
            for (let a = 0; a < 5; a++) {
                const sa = (a / 5) * Math.PI * 2 + (carX.current * 0.03);
                ctx.beginPath();
                ctx.moveTo(wx + Math.cos(sa) * wheelR * 0.2, Math.sin(sa) * wheelR * 0.2);
                ctx.lineTo(wx + Math.cos(sa) * wheelR * 0.5, Math.sin(sa) * wheelR * 0.5);
                ctx.stroke();
            }
        };
        drawWheel(-bw * 0.32);
        drawWheel(bw * 0.32);

        // ── Driver
        ctx.fillStyle = '#f5cba7';
        ctx.beginPath();
        ctx.arc(-bw * 0.08, -bh - 1, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e0a87c';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Helmet
        const helmetGrad = ctx.createLinearGradient(-bw * 0.14, -bh - 12, -bw * 0.02, -bh - 5);
        helmetGrad.addColorStop(0, '#e74c3c');
        helmetGrad.addColorStop(1, '#c0392b');
        ctx.fillStyle = helmetGrad;
        ctx.beginPath();
        ctx.arc(-bw * 0.08, -bh - 5, 9, Math.PI, 0);
        ctx.fill();

        // ── Exhaust pipe
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.roundRect(-bw / 2 - 6, -6, 8, 6, 2);
        ctx.fill();

        ctx.restore();
    }, []);

    /* ─── Draw terrain on 2D canvas ─── */
    const drawTerrain = useCallback(() => {
        const canvas = terrainCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const offsetX = cameraX.current;
        const groundY = H * GROUND_RATIO;

        // ── Sky gradient (vibrant blue to warm horizon)
        const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6);
        sky.addColorStop(0, '#1a8fe0');
        sky.addColorStop(0.4, '#4da6e8');
        sky.addColorStop(0.7, '#87ceeb');
        sky.addColorStop(1, '#ffecd2');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // ── Sun
        const sunX = W * 0.8;
        const sunY = H * 0.12;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#fff5cc';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(255,215,0,0.15)';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 55, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // ── Distant mountains (parallax 0.1) — purple/blue
        const mtnGrad1 = ctx.createLinearGradient(0, H * 0.25, 0, H * 0.5);
        mtnGrad1.addColorStop(0, '#6c5b7b');
        mtnGrad1.addColorStop(1, '#8e7da0');
        ctx.fillStyle = mtnGrad1;
        ctx.beginPath();
        ctx.moveTo(0, H * 0.5);
        for (let x = 0; x <= W; x += 5) {
            const wx = x + offsetX * 0.1;
            const y = Math.sin(wx * 0.0018) * 50 + Math.cos(wx * 0.0035) * 30 + Math.sin(wx * 0.006) * 15;
            ctx.lineTo(x, H * 0.35 - y);
        }
        ctx.lineTo(W, H * 0.5);
        ctx.lineTo(0, H * 0.5);
        ctx.fill();

        // Snow caps on distant mountains
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.moveTo(0, H * 0.5);
        for (let x = 0; x <= W; x += 5) {
            const wx = x + offsetX * 0.1;
            const y = Math.sin(wx * 0.0018) * 50 + Math.cos(wx * 0.0035) * 30 + Math.sin(wx * 0.006) * 15;
            const peakY = H * 0.35 - y;
            ctx.lineTo(x, peakY);
        }
        for (let x = W; x >= 0; x -= 5) {
            const wx = x + offsetX * 0.1;
            const y = Math.sin(wx * 0.0018) * 50 + Math.cos(wx * 0.0035) * 30 + Math.sin(wx * 0.006) * 15;
            const peakY = H * 0.35 - y;
            ctx.lineTo(x, peakY + 12);
        }
        ctx.fill();

        // ── Midground hills (parallax 0.3) — green
        const hillGrad = ctx.createLinearGradient(0, H * 0.35, 0, H * 0.55);
        hillGrad.addColorStop(0, '#5a9e4b');
        hillGrad.addColorStop(1, '#3d7a32');
        ctx.fillStyle = hillGrad;
        ctx.beginPath();
        ctx.moveTo(0, H * 0.56);
        for (let x = 0; x <= W; x += 4) {
            const wx = x + offsetX * 0.3;
            const y = Math.sin(wx * 0.0025) * 35 + Math.cos(wx * 0.005) * 20 + Math.sin(wx * 0.009) * 10;
            ctx.lineTo(x, H * 0.42 - y);
        }
        ctx.lineTo(W, H * 0.56);
        ctx.lineTo(0, H * 0.56);
        ctx.fill();

        // ── Near hills (parallax 0.5) — darker green
        ctx.fillStyle = '#2d6a1e';
        ctx.beginPath();
        ctx.moveTo(0, H * 0.58);
        for (let x = 0; x <= W; x += 3) {
            const wx = x + offsetX * 0.5;
            const y = Math.sin(wx * 0.004) * 20 + Math.cos(wx * 0.007) * 12;
            ctx.lineTo(x, H * 0.5 - y);
        }
        ctx.lineTo(W, H * 0.58);
        ctx.lineTo(0, H * 0.58);
        ctx.fill();

        // ── Grass strip (above road)
        ctx.fillStyle = '#4a8c35';
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 2) {
            const wx = x + offsetX;
            const ty = getTerrainYAt(terrain, wx);
            ctx.lineTo(x, groundY - ty * TERRAIN_SCALE - 3);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();

        // ── Road surface (main terrain)
        const roadGrad = ctx.createLinearGradient(0, groundY - 60, 0, H);
        roadGrad.addColorStop(0, '#4a4a4a');
        roadGrad.addColorStop(0.08, '#3d3d3d');
        roadGrad.addColorStop(0.25, '#353535');
        roadGrad.addColorStop(1, '#2a2015');
        ctx.fillStyle = roadGrad;
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 2) {
            const wx = x + offsetX;
            const ty = getTerrainYAt(terrain, wx);
            ctx.lineTo(x, groundY - ty * TERRAIN_SCALE);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();

        // ── Road top edge
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
            const wx = x + offsetX;
            const ty = getTerrainYAt(terrain, wx);
            if (x === 0) ctx.moveTo(x, groundY - ty * TERRAIN_SCALE);
            else ctx.lineTo(x, groundY - ty * TERRAIN_SCALE);
        }
        ctx.stroke();

        // ── Dirt layer (underground)
        for (let x = 0; x <= W; x += 45) {
            const wx = x + offsetX;
            const ty = getTerrainYAt(terrain, wx);
            const base = groundY - ty * TERRAIN_SCALE + 25 + Math.sin(wx * 0.04) * 15;
            const sz = 5 + Math.abs(Math.sin(wx * 0.07)) * 7;
            ctx.fillStyle = `rgba(90,70,50,${0.3 + Math.sin(wx * 0.1) * 0.15})`;
            ctx.beginPath();
            ctx.arc(x, base, sz, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Guardrail (metallic posts + rail)
        for (let x = 0; x <= W; x += 55) {
            const wx = x + offsetX;
            const ty = getTerrainYAt(terrain, wx);
            const base = groundY - ty * TERRAIN_SCALE;
            // Post
            const postGrad = ctx.createLinearGradient(x - 2, base, x + 2, base);
            postGrad.addColorStop(0, '#999');
            postGrad.addColorStop(0.5, '#ccc');
            postGrad.addColorStop(1, '#888');
            ctx.fillStyle = postGrad;
            ctx.fillRect(x - 2, base - 24, 4, 24);
        }
        // Rail
        ctx.strokeStyle = '#bbb';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
            const wx = x + offsetX;
            const ty = getTerrainYAt(terrain, wx);
            const base = groundY - ty * TERRAIN_SCALE - 20;
            if (x === 0) ctx.moveTo(x, base);
            else ctx.lineTo(x, base);
        }
        ctx.stroke();
        // Rail shadow
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
            const wx = x + offsetX;
            const ty = getTerrainYAt(terrain, wx);
            const base = groundY - ty * TERRAIN_SCALE - 18;
            if (x === 0) ctx.moveTo(x, base);
            else ctx.lineTo(x, base);
        }
        ctx.stroke();

        // ── Draw coins (glowing)
        mapCoins.forEach((coin) => {
            if (coin.collected) return;
            const sx = coin.x - offsetX;
            if (sx < -20 || sx > W + 20) return;
            const ty = getTerrainYAt(terrain, coin.x);
            const cy = groundY - ty * TERRAIN_SCALE - 45;

            // Outer glow
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 14;
            // Coin body
            const coinGrad = ctx.createRadialGradient(sx - 2, cy - 2, 0, sx, cy, 10);
            coinGrad.addColorStop(0, '#fff7a0');
            coinGrad.addColorStop(0.4, '#ffd700');
            coinGrad.addColorStop(1, '#daa520');
            ctx.fillStyle = coinGrad;
            ctx.beginPath();
            ctx.arc(sx, cy, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Coin border
            ctx.strokeStyle = '#b8860b';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner ring
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(sx, cy, 6, 0, Math.PI * 2);
            ctx.stroke();

            // $ sign
            ctx.fillStyle = '#8b6914';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', sx, cy);
        });

        // ── Flag markers (styled)
        for (let m = 100; m < 20000; m += 200) {
            const fwx = m * 5;
            const sx = fwx - offsetX;
            if (sx < -20 || sx > W + 20) continue;
            const ty = getTerrainYAt(terrain, fwx);
            const base = groundY - ty * TERRAIN_SCALE;
            // Pole shadow
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(sx + 1, base + 1);
            ctx.lineTo(sx + 1, base - 39);
            ctx.stroke();
            // Pole
            ctx.strokeStyle = '#777';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(sx, base);
            ctx.lineTo(sx, base - 40);
            ctx.stroke();
            // Flag
            const isMajor = m % 1000 === 0;
            ctx.fillStyle = isMajor ? '#e74c3c' : '#ecf0f1';
            ctx.beginPath();
            ctx.moveTo(sx, base - 40);
            ctx.lineTo(sx + 20, base - 34);
            ctx.lineTo(sx, base - 28);
            ctx.fill();
            if (isMajor) {
                ctx.strokeStyle = '#c0392b';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            // Label with shadow
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`${m}m`, sx + 1, base - 43);
            ctx.fillStyle = '#fff';
            ctx.fillText(`${m}m`, sx, base - 44);
        }

        // ── Draw fuel canisters (styled)
        fuelCans.forEach((can) => {
            if (can.collected) return;
            const sx = can.x - offsetX;
            if (sx < -20 || sx > W + 20) return;
            const ty = getTerrainYAt(terrain, can.x);
            const cy = groundY - ty * TERRAIN_SCALE - 42;
            // Glow
            ctx.shadowColor = '#2ecc71';
            ctx.shadowBlur = 12;
            // Canister body
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.roundRect(sx - 8, cy - 10, 16, 20, 4);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Border
            ctx.strokeStyle = '#1a9c54';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Handle
            ctx.strokeStyle = '#1a9c54';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(sx - 4, cy - 14, 8, 5, 2);
            ctx.stroke();
            // Plus symbol
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', sx, cy + 1);
        });

        // ── Draw the 2D car on the terrain
        const carWorldX = carX.current;
        const carScreenX = carWorldX - offsetX;
        const carTerrainY = getTerrainYAt(terrain, carWorldX);
        const carScreenY = groundY - carTerrainY * TERRAIN_SCALE;
        const carAngle = getTerrainAngleAt(terrain, carWorldX);

        drawCar(ctx, carScreenX, carScreenY, carAngle, 110, 60);

    }, [terrain, mapCoins, fuelCans, drawCar]);

    /* ─── Game Loop ─── */
    const gameLoop = useCallback(
        (timestamp) => {
            if (!lastTime.current) lastTime.current = timestamp;
            const dt = Math.min((timestamp - lastTime.current) / 1000, 0.05);
            lastTime.current = timestamp;

            if (paused || gameState !== 'playing') return;

            // Fuel drain — slower: only when accelerating
            if (gasPressed.current) {
                setFuel((prev) => {
                    const next = prev - dt * 1.8;
                    if (next <= 0) {
                        setGameState('gameover');
                        return 0;
                    }
                    return next;
                });
            }
            if (brakePressed.current) {
                setFuel((prev) => {
                    const next = prev - dt * 0.8;
                    if (next <= 0) {
                        setGameState('gameover');
                        return 0;
                    }
                    return next;
                });
            }

            // Physics
            const angle = getTerrainAngleAt(terrain, carX.current);
            const gravity = -450;
            const gravityX = Math.sin(angle) * gravity;

            let engineForce = 0;
            if (gasPressed.current) engineForce = 650;
            if (brakePressed.current) engineForce = -450;

            // Friction
            const friction = -carVelX.current * 1.8;

            carVelX.current += (engineForce + gravityX + friction) * dt;

            // Clamp speed
            const maxSpeed = 600;
            carVelX.current = Math.max(-250, Math.min(maxSpeed, carVelX.current));

            carX.current += carVelX.current * dt;
            if (carX.current < 0) carX.current = 0;
            if (carX.current > 15800) {
                carX.current = 15800;
                setGameState('finished');
            }

            // Camera follows car smoothly (car stays at ~30% from left)
            const targetCamX = carX.current - window.innerWidth * 0.30;
            cameraX.current += (targetCamX - cameraX.current) * 0.04;
            if (cameraX.current < 0) cameraX.current = 0;

            // Update display states
            const dist = Math.floor(carX.current / 5);
            boostRef.current = gasPressed.current ? Math.min(100, boostRef.current + dt * 50) : Math.max(0, boostRef.current - dt * 30);

            // Throttle UI state updates to every ~100ms
            if (timestamp - lastUIUpdate.current > 100) {
                lastUIUpdate.current = timestamp;
                setDistance(dist);
                setSpeed(Math.abs(Math.floor(carVelX.current * 0.36)));
                setTilt(angle * (180 / Math.PI));
                setRpm(Math.min(100, Math.abs(carVelX.current) / maxSpeed * 100));
                setBoost(boostRef.current);
            }

            // Check new record
            if (dist > bestRecord) {
                setBestRecord(dist);
                setNewRecord(true);
                localStorage.setItem('ccr_best', dist.toString());
            }

            // Coin collection
            setMapCoins((prev) =>
                prev.map((coin) => {
                    if (coin.collected) return coin;
                    if (Math.abs(coin.x - carX.current) < 35) {
                        setCoins((c) => c + 1);
                        return { ...coin, collected: true };
                    }
                    return coin;
                })
            );

            // Fuel canister collection
            setFuelCans((prev) =>
                prev.map((can) => {
                    if (can.collected) return can;
                    if (Math.abs(can.x - carX.current) < 40) {
                        setFuel((f) => Math.min(100, f + 25));
                        return { ...can, collected: true };
                    }
                    return can;
                })
            );

            drawTerrain();
            animFrame.current = requestAnimationFrame(gameLoop);
        },
        [terrain, paused, gameState, drawTerrain, bestRecord]
    );

    /* ─── Start / Restart ─── */
    const startGame = useCallback(() => {
        carX.current = 100;
        carVelX.current = 0;
        cameraX.current = 0;
        setGameState('playing');
        setDistance(0);
        setCoins(0);
        setFuel(100);
        setRpm(0);
        setBoost(0);
        setNewRecord(false);
        setSpeed(0);
        setMapCoins(() => {
            const c = [];
            for (let i = 30; i < 8000; i += Math.floor(Math.random() * 30 + 15)) {
                c.push({ x: i * 2, collected: false, id: i });
            }
            return c;
        });
        setFuelCans(() => {
            const f = [];
            for (let i = 50; i < 8000; i += Math.floor(Math.random() * 80 + 80)) {
                f.push({ x: i * 2, collected: false, id: i + 50000 });
            }
            return f;
        });
        lastTime.current = 0;
    }, []);

    /* ─── Run loop when playing ─── */
    useEffect(() => {
        if (gameState === 'playing' && !paused) {
            lastTime.current = 0;
            animFrame.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (animFrame.current) cancelAnimationFrame(animFrame.current);
        };
    }, [gameState, paused, gameLoop]);

    /* ─── Resize canvas ─── */
    useEffect(() => {
        const resize = () => {
            const canvas = terrainCanvasRef.current;
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                drawTerrain();
            }
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [drawTerrain]);

    /* ─── Keyboard controls ─── */
    useEffect(() => {
        const down = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'd') gasPressed.current = true;
            if (e.key === 'ArrowLeft' || e.key === 'a') brakePressed.current = true;
            if (e.key === 'Escape') setPaused((p) => !p);
        };
        const up = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'd') gasPressed.current = false;
            if (e.key === 'ArrowLeft' || e.key === 'a') brakePressed.current = false;
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
        };
    }, []);

    /* ─── Touch pedal handlers ─── */
    const onGasStart = (e) => { e.preventDefault(); gasPressed.current = true; };
    const onGasEnd = (e) => { if (e) e.preventDefault(); gasPressed.current = false; };
    const onBrakeStart = (e) => { e.preventDefault(); brakePressed.current = true; };
    const onBrakeEnd = (e) => { if (e) e.preventDefault(); brakePressed.current = false; };

    /* ─── Gauge angles ─── */
    const fuelAngle = -90 + (fuel / 100) * 180;
    const rpmAngle = -90 + (rpm / 100) * 180;
    const boostAngle = -90 + (boost / 100) * 180;

    return (
        <div className="hcr-game">
            {/* 2D terrain canvas */}
            <canvas ref={terrainCanvasRef} className="terrain-canvas" />

            {/* ─── TOP HUD ─── */}
            <div className="hcr-hud-top">
                <div className="hud-coins">
                    <span className="hud-coin-icon">🪙</span>
                    <span className="hud-coin-count">{coins}</span>
                </div>
                <div className="hud-top-center">
                    <div className="hud-minimap">
                        <span className="hud-vehicle-icon">🚗</span>
                        <div className="hud-progress-bar">
                            <div className="hud-progress-fill" style={{ width: `${Math.min(100, distance / 10)}%` }} />
                        </div>
                        <span className="hud-flag-icon">🏁</span>
                        <span className="hud-distance">{distance}m</span>
                    </div>
                    <div className="hud-speed">{speed} km/h</div>
                </div>
                <button className="hud-pause-btn" onClick={() => setPaused((p) => !p)}>
                    {paused ? '▶' : '⏸'}
                </button>
            </div>

            {/* New Record banner */}
            {newRecord && gameState === 'playing' && (
                <div className="new-record-banner">NEW RECORD!</div>
            )}

            {/* ─── BOTTOM DASHBOARD ─── */}
            <div className="hcr-dashboard">
                {/* Brake pedal */}
                <button
                    className="pedal pedal-brake"
                    onMouseDown={onBrakeStart} onMouseUp={onBrakeEnd} onMouseLeave={onBrakeEnd}
                    onTouchStart={onBrakeStart} onTouchEnd={onBrakeEnd} onTouchCancel={onBrakeEnd}
                    aria-label="Brake"
                >
                    <div className="pedal-dots">
                        {[...Array(6)].map((_, i) => <div key={i} className="pedal-dot" />)}
                    </div>
                </button>

                {/* Gauges */}
                <div className="gauges-row">
                    <div className="hud-record-badges">
                        <div className="record-badge"><span className="badge-icon">📍</span><span>{distance}m</span></div>
                        <div className="record-badge"><span className="badge-icon">🏆</span><span>{bestRecord}m</span></div>
                    </div>
                    <div className="gauges-cluster">
                        {/* RPM Gauge */}
                        <div className="gauge gauge-side">
                            <svg viewBox="0 0 100 60" className="gauge-svg">
                                <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#444" strokeWidth="8" />
                                <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#c0392b" strokeWidth="5" strokeDasharray="125.6" strokeDashoffset={125.6 - (rpm / 100) * 125.6} />
                                <line x1="50" y1="55" x2={50 + 32 * Math.cos((rpmAngle * Math.PI) / 180)} y2={55 + 32 * Math.sin((rpmAngle * Math.PI) / 180)} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                <circle cx="50" cy="55" r="5" fill="#555" />
                            </svg>
                            <span className="gauge-label">RPM</span>
                        </div>

                        {/* Fuel Gauge (center, larger) */}
                        <div className="gauge gauge-center">
                            <svg viewBox="0 0 120 70" className="gauge-svg">
                                <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#444" strokeWidth="10" />
                                <path d="M 10 65 A 50 50 0 0 1 45 20" fill="none" stroke="#e74c3c" strokeWidth="7" />
                                <path d="M 45 20 A 50 50 0 0 1 80 18" fill="none" stroke="#f39c12" strokeWidth="7" />
                                <path d="M 80 18 A 50 50 0 0 1 110 65" fill="none" stroke="#27ae60" strokeWidth="7" />
                                <line x1="60" y1="65" x2={60 + 40 * Math.cos((fuelAngle * Math.PI) / 180)} y2={65 + 40 * Math.sin((fuelAngle * Math.PI) / 180)} stroke="white" strokeWidth="3" strokeLinecap="round" />
                                <circle cx="60" cy="65" r="6" fill="#555" />
                                <text x="60" y="56" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">⛽</text>
                            </svg>
                            <span className="gauge-label">FUEL</span>
                        </div>

                        {/* Boost Gauge */}
                        <div className="gauge gauge-side">
                            <svg viewBox="0 0 100 60" className="gauge-svg">
                                <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#444" strokeWidth="8" />
                                <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#3498db" strokeWidth="5" strokeDasharray="125.6" strokeDashoffset={125.6 - (boost / 100) * 125.6} />
                                <line x1="50" y1="55" x2={50 + 32 * Math.cos((boostAngle * Math.PI) / 180)} y2={55 + 32 * Math.sin((boostAngle * Math.PI) / 180)} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                <circle cx="50" cy="55" r="5" fill="#555" />
                            </svg>
                            <span className="gauge-label">BOOST</span>
                        </div>
                    </div>
                </div>

                {/* Gas pedal */}
                <button
                    className="pedal pedal-gas"
                    onMouseDown={onGasStart} onMouseUp={onGasEnd} onMouseLeave={onGasEnd}
                    onTouchStart={onGasStart} onTouchEnd={onGasEnd} onTouchCancel={onGasEnd}
                    aria-label="Gas"
                >
                    <div className="pedal-dots">
                        {[...Array(6)].map((_, i) => <div key={i} className="pedal-dot" />)}
                    </div>
                </button>
            </div>

            {/* ─── OVERLAYS ─── */}
            {gameState === 'start' && (
                <div className="hcr-overlay">
                    <h1 className="hcr-overlay-title">🏔️ Car Climbing Race</h1>
                    <p className="hcr-overlay-sub">Use pedals or Arrow keys to drive on hills</p>
                    <p className="hcr-overlay-sub">⬅️ Brake &nbsp; | &nbsp; ➡️ Gas</p>
                    <button className="hcr-overlay-btn" onClick={startGame}>START</button>
                    <button className="hcr-overlay-btn hcr-back-btn" onClick={() => navigate('/')}>HOME</button>
                </div>
            )}

            {paused && gameState === 'playing' && (
                <div className="hcr-overlay">
                    <h1 className="hcr-overlay-title">⏸️ PAUSED</h1>
                    <div className="gameover-stats">
                        <div className="stat-row"><span>📏 Distance</span><strong>{distance}m</strong></div>
                        <div className="stat-row"><span>⛽ Fuel</span><strong>{Math.floor(fuel)}%</strong></div>
                        <div className="stat-row"><span>🪙 Coins</span><strong>{coins}</strong></div>
                    </div>
                    <button className="hcr-overlay-btn" onClick={() => setPaused(false)}>RESUME</button>
                    <button className="hcr-overlay-btn hcr-back-btn" onClick={() => navigate('/')}>QUIT</button>
                </div>
            )}

            {gameState === 'gameover' && (
                <div className="hcr-overlay gameover-overlay">
                    <h1 className="hcr-overlay-title">💥 OUT OF FUEL!</h1>
                    <div className="gameover-stats">
                        <div className="stat-row"><span>📏 Distance</span><strong>{distance}m</strong></div>
                        <div className="stat-row"><span>🪙 Coins</span><strong>{coins}</strong></div>
                        <div className="stat-row"><span>🏆 Best</span><strong>{bestRecord}m</strong></div>
                    </div>
                    <button className="hcr-overlay-btn" onClick={startGame}>RETRY</button>
                    <button className="hcr-overlay-btn hcr-back-btn" onClick={() => navigate('/')}>HOME</button>
                </div>
            )}

            {gameState === 'finished' && (
                <div className="hcr-overlay gameover-overlay">
                    <h1 className="hcr-overlay-title">🏁 FINISH!</h1>
                    <p className="hcr-overlay-sub">You completed the track!</p>
                    <div className="gameover-stats">
                        <div className="stat-row"><span>📏 Distance</span><strong>{distance}m</strong></div>
                        <div className="stat-row"><span>🪙 Coins</span><strong>{coins}</strong></div>
                        <div className="stat-row"><span>🏆 Best</span><strong>{bestRecord}m</strong></div>
                    </div>
                    <button className="hcr-overlay-btn" onClick={startGame}>PLAY AGAIN</button>
                    <button className="hcr-overlay-btn hcr-back-btn" onClick={() => navigate('/')}>HOME</button>
                </div>
            )}
        </div>
    );
};

export default Game;
