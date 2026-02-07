import React, { useState, useEffect, useRef } from 'react';
import './Game.css';

const Game = () => {
    const [gameState, setGameState] = useState('start'); // start, playing, gameover
    const [score, setScore] = useState(0);
    const [playerPos, setPlayerPos] = useState(1); // 0: left, 1: center, 2: right
    const [obstacles, setObstacles] = useState([]);

    // Game config
    const LANES = 3;
    const GAME_SPEED = 5;
    const SPAWN_RATE = 1000; // ms

    useEffect(() => {
        let animationFrameId;
        let lastTime = 0;
        let lastSpawnTime = 0;

        const gameLoop = (timestamp) => {
            if (gameState !== 'playing') return;

            if (!lastTime) lastTime = timestamp;
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;

            // Spawn obstacles
            if (timestamp - lastSpawnTime > SPAWN_RATE) {
                const lane = Math.floor(Math.random() * LANES);
                setObstacles(prev => [
                    ...prev,
                    { id: Date.now(), lane, y: -100 }
                ]);
                lastSpawnTime = timestamp;
            }

            // Move obstacles and check collisions
            setObstacles(prev => {
                const newObstacles = prev
                    .map(obs => ({ ...obs, y: obs.y + GAME_SPEED }))
                    .filter(obs => obs.y < 1000); // Remove if off screen (assuming height ~800px, safer to check window height or % logic)

                // Simple collision detection
                // Player is at bottom: ~80% to 90% (css: bottom 20px, height 100px)
                // Obstacles move by pixels.
                // Let's normalize y to % or use pixels consistently.
                // Current CSS: .car bottom 20px. container height 100vh.
                // Let's switch obstacle Y to percentage for easier logic or keep pixels and get container height.
                // For simplicity, let's use % for Y in logic.
                return newObstacles;
            });

            // Refined logic needs state access, but simple setObstacles func update is limited for collision with playerPos.
            // We need to check collision outside the setter or use a ref for playerPos.

            animationFrameId = requestAnimationFrame(gameLoop);
        };

        if (gameState === 'playing') {
            animationFrameId = requestAnimationFrame(gameLoop);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [gameState]);

    // Use refs for mutable state in loop to avoid dependency hell or stale closures
    const playerPosRef = useRef(playerPos);
    const gameStateRef = useRef(gameState);

    useEffect(() => {
        playerPosRef.current = playerPos;
    }, [playerPos]);

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
        if (gameState !== 'playing') return;

        let animationFrameId;
        let lastSpawnTime = 0;

        const loop = (timestamp) => {
            if (gameStateRef.current !== 'playing') return;

            // Spawn
            if (timestamp - lastSpawnTime > SPAWN_RATE) {
                setObstacles(prev => [
                    ...prev,
                    { id: Date.now(), lane: Math.floor(Math.random() * LANES), y: -20 } // Start slightly above (-20%)
                ]);
                lastSpawnTime = timestamp;
            }

            setObstacles(prev => {
                return prev
                    .map(obs => ({ ...obs, y: obs.y + 0.5 })) // Move down 0.5% per frame
                    .filter(obs => obs.y < 120);
            });

            setScore(s => s + 1);

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [gameState]);

    // Separate collision check to access latest obstacles and playerPos
    useEffect(() => {
        if (gameState !== 'playing') return;

        const checkCollision = setInterval(() => {
            obstacles.forEach(obs => {
                // Hitbox: Player is at Y ~80-90% (bottom 20px in 100vh ~ 10-15% space depending on screen). 
                // Let's say player is at Y=85% roughly.
                // Obstacle Y is percentage from top.
                const playerYStart = 80;
                const playerYEnd = 95;

                if (
                    obs.lane === playerPos &&
                    obs.y > playerYStart &&
                    obs.y < playerYEnd
                ) {
                    setGameState('gameover');
                }
            });
        }, 100);

        return () => clearInterval(checkCollision);
    }, [gameState, obstacles, playerPos]);

    return (
        <div className="game-container">
            {gameState === 'start' && (
                <div className="overlay">
                    <h1>Car Game</h1>
                    <button onClick={startGame}>Start Game</button>
                </div>
            )}

            {gameState === 'gameover' && (
                <div className="overlay">
                    <h1>Game Over</h1>
                    <p>Score: {score}</p>
                    <button onClick={startGame}>Restart</button>
                </div>
            )}

            <div className="road">
                <div className="lane-marker"></div>
                <div className="lane-marker"></div>

                {/* Player Car */}
                <div
                    className="car player"
                    style={{
                        left: `${playerPos * 33.33 + 16.66}%`,
                        transition: 'left 0.1s ease'
                    }}
                ></div>

                {/* Obstacles */}
                {obstacles.map(obs => (
                    <div
                        key={obs.id}
                        className="car obstacle"
                        style={{
                            left: `${obs.lane * 33.33 + 16.66}%`,
                            top: `${obs.y}%`,
                            backgroundColor: 'blue' // Overridden by CSS class but kept for safety/debug
                        }}
                    ></div>
                ))}
            </div>

            <div className="hud">
                Score: {score}
            </div>
        </div>
    );
}; // End logic replacement


export default Game;
