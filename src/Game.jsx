import React, { useState, useEffect, useRef } from 'react';
import { Road, Car, Obstacle, HUD, GameOverlay } from './components';
import './Game.css';

const Game = () => {
    const [gameState, setGameState] = useState('start'); // start, playing, gameover
    const [score, setScore] = useState(0);
    const [playerPos, setPlayerPos] = useState(1); // 0: left, 1: center, 2: right
    const [obstacles, setObstacles] = useState([]);
    const OBSTACLE_SPEED = 0.35;

    // Game config
    const LANES = 3;
    const SPAWN_RATE = 1000; // ms

    // Refs for game loop
    const playerPosRef = useRef(playerPos);
    const gameStateRef = useRef(gameState);

    useEffect(() => {
        playerPosRef.current = playerPos;
    }, [playerPos]);

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameStateRef.current !== 'playing') return;

            if (e.key === 'ArrowLeft') {
                setPlayerPos(prev => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowRight') {
                setPlayerPos(prev => Math.min(LANES - 1, prev + 1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Game loop
    useEffect(() => {
        if (gameState !== 'playing') return;

        let animationFrameId;
        let lastSpawnTime = 0;

        const loop = (timestamp) => {
            if (gameStateRef.current !== 'playing') return;

            // Spawn obstacles
            if (timestamp - lastSpawnTime > SPAWN_RATE) {
                setObstacles(prev => [
                    ...prev,
                    { id: Date.now(), lane: Math.floor(Math.random() * LANES), y: -20 }
                ]);
                lastSpawnTime = timestamp;
            }

            // Move obstacles
            setObstacles(prev => {
                return prev
                    .map(obs => ({ ...obs, y: obs.y + OBSTACLE_SPEED }))
                    .filter(obs => obs.y < 120);
            });

            // Update score
            setScore(s => s + 1);

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [gameState]);

    // Collision detection
    useEffect(() => {
        if (gameState !== 'playing') return;

        const checkCollision = setInterval(() => {
            obstacles.forEach(obs => {
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

    // Start game function
    const startGame = () => {
        setGameState('playing');
        setScore(0);
        setObstacles([]);
        setPlayerPos(1);
    };

    return (
        <div className="game-container">
            {(gameState === 'start' || gameState === 'gameover') && (
                <GameOverlay
                    type={gameState}
                    score={score}
                    onStart={startGame}
                />
            )}

            <Road>
                <Car lane={playerPos} isPlayer={true} />

                {obstacles.map(obs => (
                    <Obstacle
                        key={obs.id}
                        lane={obs.lane}
                        y={obs.y}
                    />
                ))}
            </Road>

            <HUD score={score} />
        </div>
    );
};

export default Game;
