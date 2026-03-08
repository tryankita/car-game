# PRODUCT REQUIREMENTS DOCUMENT

**Project:** React Web Racing Game — Visual & Gameplay Redesign

---

## Objective

Transform the current neon-style racing game into a daytime circuit racing experience inspired by F1-style arcade racers. The game should emphasize:

- Realistic racing track environments
- High-visibility daylight lighting
- Immersive cockpit camera view
- Functional race HUD
- Competitive racing feel with AI opponents

The goal is to create a polished arcade racing experience inside a React + Three.js environment.

---

## 1. TARGET VISUAL STYLE

### Current Issues

The existing implementation has the following problems:

**Environment**
- Dark lighting
- Empty environment
- Minimal track details
- No stadium or racing infrastructure

**Vehicle Presentation**
- Simplistic car model
- No cockpit immersion
- Limited camera feedback

**Track**
- Track looks like a simple road
- No curbs, grandstands, barriers, or pit structures

**Lighting**
- Mostly ambient darkness
- No sunlight direction
- No realistic shadows

**HUD**
- Game HUD feels disconnected from gameplay
- UI styling mismatched with racing environment

---

## 2. TARGET EXPERIENCE

The new experience should resemble arcade F1 racing with:

**Racing Atmosphere**
- Professional race circuit
- Grandstands filled with spectators
- Race start lights
- Trackside banners
- Camera towers and pit buildings

**Environment Feel**
- Bright daylight
- Blue sky with clouds
- Open racing track surroundings

**Gameplay Feel**
- Fast speed sensation
- Smooth camera tracking
- Competitive AI racers

---

## 3. TECH STACK

| Technology | Purpose |
|---|---|
| React | UI framework |
| React Three Fiber | 3D rendering layer |
| Three.js | 3D engine |
| Drei helpers | R3F utilities |
| Cannon or Rapier | Physics simulation |
| Postprocessing | Visual effects |

---

## 4. CORE GAME SCREENS

### 4.1 Main Menu

**Purpose:** Entry point of the game.

**Components:**
- Game logo
- Start race
- Garage
- Settings

**Design:**
- Minimal
- Clean racing theme
- Subtle motion background (track camera flythrough)

---

### 4.2 Track Selection

**Purpose:** Choose race circuit.

**Features:**
- Track cards
- Difficulty indicator
- Track preview image
- Lap count

**Example tracks:**
- Rookie Circuit
- Coastal Circuit
- City Grand Prix
- Mountain Circuit

---

### 4.3 Race Setup Screen

**Shows:**
- Track name
- Lap targets
- Vehicle stats
- Start race button

---

### 4.4 In-Game Racing Screen

**Camera — Primary: Cockpit View**

Camera positioning:
- Located behind steering wheel
- Slight vertical shake
- Slight FOV increase during acceleration

**Optional cameras:**
- Third person chase camera
- Trackside camera

---

## 5. RACE TRACK ENVIRONMENT

### Road Surface

Dark asphalt with:
- Texture detail
- Tire marks
- Specular highlights

### Track Markings

- White lane lines
- Red/white curbs
- Grid start markers

### Track Barriers

- Metal guard rails
- F1 barrier walls
- Safety fencing

### Grandstands

Large stadium stands with:
- Seating rows
- Audience texture

### Race Infrastructure

- Start lights
- Pit building
- Trackside screens
- Camera towers
- Sponsor banners

### Trackside Decorations

- Light poles
- Safety marshals
- Track cameras

---

## 6. LIGHTING SYSTEM

Lighting must simulate daytime racing conditions.

### Sunlight

Directional light representing the sun.

Settings:
- Strong intensity
- Realistic shadows
- Angle across the track

### Ambient Light

Soft fill lighting to prevent dark shadows.

### Sky

HDRI sky or procedural sky.

Features:
- Blue sky
- Cloud movement

---

## 7. VEHICLE SYSTEM

### Player Vehicle

Model requirements:
- F1-style open wheel car
- Detailed cockpit
- Steering wheel display

### Vehicle Physics

- Acceleration
- Braking
- Steering responsiveness
- Grip simulation

---

## 8. CAMERA SYSTEM

### Cockpit Camera

Features:
- Slight vibration
- Acceleration tilt
- Corner lean

### Motion Effects

- Speed blur
- Camera shake
- FOV expansion at high speed

---

## 9. AI RACERS

AI racers must:
- Follow racing line
- Avoid collisions
- Compete for position

**Minimum racers:** 8–10 cars

---

## 10. RACE HUD

HUD elements must resemble modern racing games.

### Left Side
- Race position
- Leaderboard

Example:
```
1  Player
2  Alonso
3  Leclerc
```

### Top Right
- Best lap time
- Current lap

### Bottom Right
- Speedometer
- Gear indicator

### Bottom Left
- Mini track map showing car positions

---

## 11. RACE START SYSTEM

Race should begin with:
- Starting grid positions
- Race start lights

**Sequence:**
1. Lights appear
2. Lights turn red
3. Lights go off
4. Race starts

---

## 12. VISUAL EFFECTS

| Effect | Trigger |
|---|---|
| Motion Blur | Simulates speed |
| Tire Smoke | Hard braking |
| Skid Marks | Aggressive turns |
| Screen Shake | High speed or collisions |

---

## 13. PERFORMANCE REQUIREMENTS

**Target:** 60 FPS minimum in browser.

**Optimization methods:**
- Instanced meshes
- LOD models
- Compressed textures

---

## 14. AUDIO SYSTEM

Sounds required:
- Engine acceleration
- Gear shifts
- Tire screech
- Crowd ambience

---

## 15. GAME PROGRESSION

Tracks unlock after finishing top positions.

**Example rule:** Finish top 3 → unlock next track.

---

## 16. ART ASSETS REQUIRED

- Track models
- Grandstands
- Race barriers
- Trackside objects
- Vehicle models
- Sky HDRI

---

## 17. DEVELOPMENT MILESTONES

| Phase | Focus |
|---|---|
| Phase 1 | Track redesign |
| Phase 2 | Vehicle physics |
| Phase 3 | HUD system |
| Phase 4 | AI racers |
| Phase 5 | Optimization |
