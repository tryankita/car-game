const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/Game-M7ntGNjt.js","assets/index-BjzGFQGR.js","assets/index-Osr0aN3W.css"])))=>i.map(i=>d[i]);
import{u as d,r as o,j as e,_ as c}from"./index-BjzGFQGR.js";const l=`
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Outfit:wght@400;700;900&display=swap');

  #arcade-root * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  #arcade-root {
    position: fixed; inset: 0; z-index: 9000; overflow: hidden;
    background: #a0d7e6; font-family: 'Press Start 2P', cursive, sans-serif;
    touch-action: none;
  }
  #arcade-root canvas { display: block; }
  #arcade-root #loading-screen {
    position: absolute; top:0; left:0; width:100%; height:100%;
    background:#000; color:#fff; display:flex; flex-direction:column;
    justify-content:center; align-items:center; z-index:1000;
    transition:opacity 0.1s ease-out; gap:20px; padding:30px; text-align:center;
  }
  #arcade-root #loading-screen.hidden { opacity:0; pointer-events:none; }
  #arcade-root #loading-text { font-size:clamp(0.9rem,4.5vw,2rem); line-height:1.4; letter-spacing:1px; }
  #arcade-root #loading-progress { font-size:clamp(1rem,4vw,1.5rem); color:#55efc4; }
  #arcade-root #ui-container {
    position:absolute; top:20px; left:20px; color:#fff;
    text-shadow:1px 1px 3px black; z-index:50;
    font-size:clamp(1rem,4vw,1.5rem); pointer-events:none;
  }
  #arcade-root #score { margin-bottom:5px; }
  #arcade-root #game-over {
    position:absolute; top:0; left:0; width:100%; height:100%;
    background:rgba(0,0,0,0.7); backdrop-filter:blur(5px);
    display:none; z-index:101; justify-content:center; align-items:center;
  }
  #arcade-root .game-over-card {
    background:#fdcb6e; border:8px solid #2d3436; padding:40px 30px;
    width:90%; max-width:550px; border-radius:40px;
    display:flex; flex-direction:column; align-items:center; gap:20px;
    box-shadow:15px 15px 0px rgba(0,0,0,0.3);
    transform:scale(0.8); animation:arcadeBounceIn 0.6s cubic-bezier(0.68,-0.55,0.265,1.55) forwards;
    font-family:'Press Start 2P',cursive;
  }
  @keyframes arcadeBounceIn { to { transform:scale(1); } }
  #arcade-root .game-over-title {
    color:#ff7675; font-size:clamp(1.8rem,6vw,2.6rem); margin:0; text-align:center;
    line-height:1.2; text-shadow:4px 4px 0px #2d3436;
  }
  #arcade-root #final-score-container {
    font-size:1.1em; color:#fdcb6e; background:#2d3436; padding:15px 25px;
    border-radius:15px; margin-bottom:5px; border:4px solid #000;
    display:flex; align-items:center; gap:15px;
  }
  #arcade-root #final-score-value { color:#55efc4; font-size:1.6em; text-shadow:2px 2px 0px #000; }
  #arcade-root #restart-button {
    background:#55efc4; color:#2d3436; padding:20px 40px;
    border:6px solid #2d3436; border-radius:20px;
    font-family:'Press Start 2P',cursive; font-size:1em; cursor:pointer;
    box-shadow:0 10px 0px #00b894; transition:all 0.1s; text-transform:uppercase;
  }
  #arcade-root #restart-button:hover { transform:translateY(-5px); box-shadow:0 15px 0px #00b894; background:#81ecec; }
  #arcade-root #restart-button:active { transform:translateY(8px); box-shadow:0 2px 0px #00b894; }
  #arcade-root #home-button {
    background:#74b9ff; color:#2d3436; padding:20px 40px;
    border:6px solid #2d3436; border-radius:20px;
    font-family:'Press Start 2P',cursive; font-size:1em; cursor:pointer;
    box-shadow:0 10px 0px #0984e3; transition:all 0.1s; text-transform:uppercase;
  }
  #arcade-root #home-button:hover { transform:translateY(-5px); box-shadow:0 15px 0px #0984e3; background:#a29bfe; }
  #arcade-root #countdown {
    position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
    color:#fff; font-size:8em; font-weight:bold;
    text-shadow:4px 4px 10px rgba(0,0,0,0.8); z-index:200; display:none; pointer-events:none;
  }
  #arcade-root #settings-button {
    position:absolute; top:20px; right:20px; width:55px; height:55px;
    background:linear-gradient(135deg,#fff,#dff9fb); border:4px solid #2d3436;
    border-radius:50%; z-index:600; display:flex; justify-content:center; align-items:center;
    font-size:2.2em; cursor:pointer; box-shadow:0 6px 0px rgba(0,0,0,0.2);
    user-select:none; transition:all 0.2s;
  }
  #arcade-root #settings-button:hover { transform:scale(1.1); }
  #arcade-root #settings-button svg { width:35px; height:35px; fill:#2d3436; transition:transform 0.4s; }
  #arcade-root #settings-button:hover svg { transform:rotate(90deg); }
  #arcade-root .modal-backdrop {
    position:absolute; top:0; left:0; width:100%; height:100%;
    background:rgba(0,0,0,0.6); backdrop-filter:blur(8px);
    z-index:1500; display:none;
  }
  #arcade-root .modal {
    position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
    width:90%; max-width:420px; background:#fdcb6e; color:#2d3436; padding:30px;
    border-radius:25px; border:6px solid #2d3436; z-index:2000; display:none;
    flex-direction:column; gap:20px; font-family:'Press Start 2P',cursive;
  }
  #arcade-root .modal h2, #arcade-root .modal-title {
    margin-top:5px; text-align:center; color:#fff; font-size:1.4em; letter-spacing:3px;
    margin-bottom:20px; -webkit-text-stroke:3px #2d3436; paint-order:stroke fill;
  }
  #arcade-root .modal-button {
    margin-top:10px; padding:18px; background:#fff; color:#2d3436;
    border:5px solid #2d3436; border-radius:18px; cursor:pointer; font-size:0.9em;
    font-family:'Press Start 2P',cursive; text-transform:uppercase; font-weight:900;
    box-shadow:0 8px 0px #2d3436; transition:all 0.1s;
  }
  #arcade-root .modal-button:hover { transform:translateY(2px); box-shadow:0 6px 0px #2d3436; }
  #arcade-root .modal-button:active { transform:translateY(8px); box-shadow:0 0 0 #2d3436; }
  #arcade-root .setting-row {
    display:flex; flex-direction:column; gap:15px;
    background:rgba(255,255,255,0.5); padding:15px; border-radius:18px; border:4px solid #2d3436;
  }
  #arcade-root .setting-label { font-size:0.65em; color:#2d3436; text-transform:uppercase; font-weight:900; }
  #arcade-root input[type=range] { -webkit-appearance:none; appearance:none; width:100%; background:transparent; }
  #arcade-root input[type=range]::-webkit-slider-runnable-track {
    width:100%; height:18px; cursor:pointer; background:#2d3436; border-radius:9px;
  }
  #arcade-root input[type=range]::-webkit-slider-thumb {
    height:32px; width:32px; border-radius:50%; background:#55efc4;
    cursor:pointer; -webkit-appearance:none; margin-top:-9px; border:5px solid #2d3436;
  }
  #arcade-root .camera-options, #arcade-root .control-options { display:flex; justify-content:space-between; gap:12px; }
  #arcade-root .camera-tile, #arcade-root .control-tile {
    flex:1; display:flex; flex-direction:column; align-items:center; cursor:pointer;
    transition:transform 0.2s;
  }
  #arcade-root .camera-preview {
    width:100%; aspect-ratio:1/1; background:#fff; border:4px solid #2d3436;
    border-radius:15px; overflow:hidden; display:flex; justify-content:center; align-items:center;
  }
  #arcade-root .camera-tile.active .camera-preview { border-color:#55efc4; transform:translateY(-4px); box-shadow:0 8px 0 #00b894; }
  #arcade-root .camera-tile img { width:100%; height:100%; object-fit:cover; opacity:0.7; transition:opacity 0.3s; }
  #arcade-root .camera-tile:hover img, #arcade-root .camera-tile.active img { opacity:1; }
  #arcade-root .camera-tile span { margin-top:12px; font-size:0.5em; color:#2d3436; }
  #arcade-root .camera-tile.active span { color:#00b894; }
  #arcade-root .control-tile {
    padding:15px 10px; background:#fff; border:4px solid #2d3436; border-radius:12px;
    justify-content:center;
  }
  #arcade-root .control-tile span { font-size:0.55em !important; letter-spacing:1.5px; color:#2d3436; font-weight:900; }
  #arcade-root .control-tile.active { background:#55efc4; transform:translateY(-3px); box-shadow:0 6px 0 #00b894; }
  #arcade-root .control-tile.active span { color:#fff; }
  #arcade-root #steering-mode-row { display:none; }
  #arcade-root .control-button {
    position:absolute; bottom:40px; width:90px; height:90px;
    background:rgba(255,255,255,0.8); border:4px solid #fff; border-radius:50%; z-index:60;
    display:flex; justify-content:center; align-items:center;
    font-size:3.5em; color:#333; cursor:pointer; user-select:none; pointer-events:auto;
  }
  #arcade-root .control-button:active { transform:scale(0.92); }
  #arcade-root #left-button { left:20px; }
  #arcade-root #right-button { right:20px; }
  @media (min-width:1025px) { #arcade-root .control-button { display:none !important; } }
  #arcade-root #start-screen {
    position:absolute; top:0; left:0; width:100%; height:100%;
    background:radial-gradient(circle at center,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.8) 100%);
    backdrop-filter:blur(15px); z-index:150; display:flex; flex-direction:column;
    justify-content:center; align-items:center; padding:20px; transition:opacity 0.1s; overflow:hidden;
  }
  #arcade-root #start-screen.hidden { opacity:0; pointer-events:none; transform:scale(1.1); }
  #arcade-root .game-title-container { text-align:center; z-index:5; margin-bottom:60px; perspective:1000px; }
  #arcade-root .main-title {
    font-size:clamp(2rem,6vw,4rem); font-weight:900; text-transform:uppercase; color:#fff;
    margin:0; letter-spacing:clamp(4px,1.5vw,12px); transform:rotateX(20deg);
    background:linear-gradient(to bottom,#00f5ff 0%,#00d4ff 50%,#0099ff 100%);
    -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
    filter:drop-shadow(0 0 20px rgba(0,245,255,0.8));
    animation:arcadeTitlePulse 2.5s infinite alternate ease-in-out;
  }
  @keyframes arcadeTitlePulse {
    from { filter:drop-shadow(0 0 15px rgba(0,212,255,0.6)); transform:rotateX(20deg) scale(1); }
    to { filter:drop-shadow(0 0 35px rgba(0,245,255,1)); transform:rotateX(20deg) scale(1.02); }
  }
  #arcade-root .subtitle { font-size:clamp(0.7rem,2.5vw,1.4rem); color:#55efc4; margin-top:20px; letter-spacing:8px; text-transform:uppercase; }
  #arcade-root #start-game-button, #arcade-root #maps-button {
    position:relative; z-index:10; background:rgba(255,255,255,0.05); border:4px solid #fff;
    color:#fff; padding:20px 0; font-size:clamp(0.9rem,3vw,1.3rem);
    font-family:'Press Start 2P',cursive; cursor:pointer; text-transform:uppercase; letter-spacing:2px;
    overflow:hidden; transition:all 0.3s; width:300px; max-width:85%; margin:10px 0; border-radius:4px;
  }
  #arcade-root #start-game-button:hover, #arcade-root #maps-button:hover { background:#fff; color:#000; transform:translateY(-5px); }
  #arcade-root .controls-hint { position:relative; z-index:5; margin-top:40px; display:flex; gap:20px; justify-content:center; }
  #arcade-root .key-hint { display:flex; align-items:center; gap:10px; background:rgba(0,0,0,0.4); padding:10px 15px; border-radius:8px; }
  #arcade-root .key {
    display:flex; justify-content:center; align-items:center; min-width:28px; height:28px; padding:0 6px;
    background:linear-gradient(to bottom,#4a4a4a,#2b2b2b); border:1px solid #999; border-bottom-width:3px;
    border-radius:4px; font-size:10px; font-family:inherit; color:#fff; font-weight:bold;
  }
  #arcade-root .controls-hint span { font-size:0.7em; color:#ccc; letter-spacing:1px; }
  #arcade-root #map-selector-overlay {
    position:absolute; top:0; left:0; width:100%; height:100%;
    background:rgba(0,0,0,0.4); backdrop-filter:blur(8px); z-index:2000;
    display:flex; flex-direction:column; justify-content:center; align-items:center; transition:opacity 0.4s;
  }
  #arcade-root #map-selector-overlay.hidden { opacity:0; pointer-events:none; }
  #arcade-root .map-carousel {
    display:flex; gap:25px; overflow-x:auto; padding:40px; width:100%; max-width:1200px;
    justify-content:center; align-items:center; scrollbar-width:none; scroll-snap-type:x mandatory;
  }
  #arcade-root .map-carousel::-webkit-scrollbar { display:none; }
  #arcade-root .map-card {
    position:relative; flex:0 0 200px; height:290px; border-radius:16px; overflow:hidden;
    cursor:pointer; transition:all 0.3s; border:4px solid rgba(255,255,255,0.5); background:#000;
    scroll-snap-align:center;
  }
  #arcade-root .map-card-bg {
    position:absolute; top:0; left:0; width:100%; height:100%;
    background-size:cover; background-position:center; transition:transform 0.5s; opacity:0.8;
  }
  #arcade-root .city-preview { background-image:url('/arcade-img/city.png'); }
  #arcade-root .cyber-preview { background-image:url('/arcade-img/cyber-city.png'); }
  #arcade-root .desert-preview { background-image:url('/arcade-img/dessert.png'); }
  #arcade-root .snow-preview { background-image:url('/arcade-img/snow.png'); }
  #arcade-root .map-card:hover { transform:translateY(-8px); border-color:rgba(255,255,255,0.8); }
  #arcade-root .map-card.active { border-color:#fff; transform:scale(1.1) translateY(-10px); z-index:10; }
  #arcade-root .map-card-content {
    position:absolute; bottom:0; left:0; width:100%; padding:12px 10px;
    background:rgba(0,0,0,0.85); backdrop-filter:blur(5px); color:#fff; text-align:center;
    display:flex; flex-direction:column; align-items:center; gap:3px;
  }
  #arcade-root .map-card-content h3 { margin:0; font-size:0.85em; text-transform:uppercase; color:#fff; }
  #arcade-root .map-card-content p { margin:0; font-size:0.55em; color:#bdc3c7; text-transform:uppercase; }
  #arcade-root .map-card.active .map-card-content { background:#fff; }
  #arcade-root .map-card.active .map-card-content h3 { color:#000; text-shadow:none; }
  #arcade-root #speed-lines-canvas {
    position:absolute; top:0; left:0; width:100%; height:100%;
    pointer-events:none; z-index:40; opacity:0; transition:opacity 0.3s;
  }
  #arcade-root #nitro-vignette {
    position:absolute; top:0; left:0; width:100%; height:100%;
    pointer-events:none; z-index:45; box-shadow:inset 0 0 200px rgba(255,0,0,0); opacity:0; transition:all 0.3s;
  }
  #arcade-root.nitro-active #nitro-vignette { opacity:1; box-shadow:inset 0 0 150px rgba(255,0,0,0.6); animation:arcadeNitroPulse 0.5s infinite alternate; }
  #arcade-root.nitro-active #speed-lines-canvas { opacity:1; }
  @keyframes arcadeNitroPulse { from { box-shadow:inset 0 0 100px rgba(255,0,0,0.4); } to { box-shadow:inset 0 0 200px rgba(255,0,0,0.8); } }
  #arcade-root #selected-map-display {
    position:absolute; bottom:30px; right:30px; color:#fff;
    font-family:'Press Start 2P',cursive; font-size:1rem;
    text-shadow:2px 2px 0px #2d3436; pointer-events:none; opacity:0.8;
  }
  @media (max-width:1024px) {
    #arcade-root #steering-mode-row { display:flex; }
    #arcade-root .controls-hint { display:none !important; }
    #arcade-root .map-card.active { transform:none !important; }
  }
`;function x(){const i=d(t=>t.goHome),a=o.useRef(null);return o.useEffect(()=>{let t=null;async function n(){try{const{NeonRushGame:r}=await c(async()=>{const{NeonRushGame:s}=await import("./Game-M7ntGNjt.js");return{NeonRushGame:s}},__vite__mapDeps([0,1,2]));t=new r(()=>i()),a.current=t}catch(r){console.error("Arcade game init failed:",r)}}return n(),()=>{a.current&&(a.current.destroy(),a.current=null)}},[]),e.jsxs("div",{id:"arcade-root",children:[e.jsx("style",{children:l}),e.jsxs("div",{id:"loading-screen",children:[e.jsx("div",{id:"loading-text",children:"Loading Neon Rush…"}),e.jsx("div",{id:"loading-progress",children:"0%"})]}),e.jsx("div",{id:"modal-backdrop",className:"modal-backdrop"}),e.jsxs("div",{id:"start-screen",className:"hidden",children:[e.jsxs("div",{className:"game-title-container",children:[e.jsxs("h1",{className:"main-title",children:["NEON ",e.jsx("span",{style:{color:"#55efc4"},children:"RUSH"})]}),e.jsx("div",{className:"subtitle",children:"HYPER-ARCADE RACING"})]}),e.jsx("button",{id:"start-game-button",children:"START RACE"}),e.jsx("button",{id:"maps-button",style:{marginTop:20},children:"MAPS"}),e.jsx("div",{id:"selected-map-display",children:"MAP: CITY"}),e.jsxs("div",{className:"controls-hint",children:[e.jsxs("div",{className:"key-hint",children:[e.jsx("div",{className:"key",children:"◀"}),e.jsx("div",{className:"key",children:"▶"}),e.jsx("span",{children:"STEER"})]}),e.jsxs("div",{className:"key-hint",children:[e.jsx("div",{className:"key",style:{width:80},children:"SPACE"}),e.jsx("span",{children:"PAUSE"})]})]})]}),e.jsxs("div",{id:"map-selector-overlay",className:"hidden",children:[e.jsx("h1",{className:"main-title",style:{fontSize:"clamp(1.5rem,5vw,3rem)",marginBottom:20},children:"SELECT TRACK"}),e.jsxs("div",{className:"map-carousel",children:[e.jsxs("div",{className:"map-card active","data-map":"city",children:[e.jsx("div",{className:"map-card-bg city-preview"}),e.jsxs("div",{className:"map-card-content",children:[e.jsx("h3",{children:"CENTRAL CITY"}),e.jsx("p",{children:"Urban Streets"})]})]}),e.jsxs("div",{className:"map-card","data-map":"cybercity",children:[e.jsx("div",{className:"map-card-bg cyber-preview"}),e.jsxs("div",{className:"map-card-content",children:[e.jsx("h3",{children:"CYBER PUNK"}),e.jsx("p",{children:"Neon & Rain"})]})]}),e.jsxs("div",{className:"map-card","data-map":"desert",children:[e.jsx("div",{className:"map-card-bg desert-preview"}),e.jsxs("div",{className:"map-card-content",children:[e.jsx("h3",{children:"SCORCHED"}),e.jsx("p",{children:"Hot Sands"})]})]}),e.jsxs("div",{className:"map-card","data-map":"snow",children:[e.jsx("div",{className:"map-card-bg snow-preview"}),e.jsxs("div",{className:"map-card-content",children:[e.jsx("h3",{children:"FROST PEAK"}),e.jsx("p",{children:"Ice & Snow"})]})]})]}),e.jsx("button",{id:"close-map-selector",className:"modal-button",style:{marginTop:30,padding:"15px 50px",background:"#fff",color:"#2d3436",width:"auto",maxWidth:250},children:"BACK"})]}),e.jsx("div",{id:"arcade-container"}),e.jsx("canvas",{id:"speed-lines-canvas"}),e.jsx("div",{id:"nitro-vignette"}),e.jsx("div",{id:"countdown",children:"3"}),e.jsx("div",{id:"ui-container",style:{display:"none"},children:e.jsx("div",{id:"score",children:"Score: 0"})}),e.jsx("div",{id:"game-over",children:e.jsxs("div",{className:"game-over-card",children:[e.jsx("h1",{className:"game-over-title",children:"GAME OVER"}),e.jsx("div",{id:"final-score-container",children:"Final Score: 0"}),e.jsxs("div",{style:{display:"flex",gap:15,flexWrap:"wrap",justifyContent:"center"},children:[e.jsx("button",{id:"restart-button",children:"RESTART"}),e.jsx("button",{id:"home-button",children:"HOME"})]})]})}),e.jsx("div",{id:"settings-button",children:e.jsx("svg",{viewBox:"0 0 24 24",children:e.jsx("path",{d:"M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.13,5.91,7.62,6.29L5.23,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.72,8.87C2.61,9.08,2.66,9.34,2.84,9.48l2.03,1.58C4.82,11.36,4.8,11.68,4.8,12c0,0.32,0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"})})}),e.jsxs("div",{id:"settings-modal",className:"modal",children:[e.jsx("h2",{children:"SETTINGS"}),e.jsxs("div",{className:"setting-row",children:[e.jsx("span",{className:"setting-label",children:"Volume"}),e.jsx("input",{type:"range",id:"volume-slider",min:"0",max:"1",step:"0.1",defaultValue:"0.5"})]}),e.jsxs("div",{className:"setting-row",style:{marginTop:5},children:[e.jsx("span",{className:"setting-label",children:"Camera View"}),e.jsxs("div",{className:"camera-options",children:[e.jsxs("div",{className:"camera-tile active","data-mode":"normal",id:"cam-normal",children:[e.jsx("div",{className:"camera-preview",children:e.jsx("img",{src:"/arcade-img/BEHIND.png",alt:"Behind View"})}),e.jsx("span",{children:"BEHIND"})]}),e.jsxs("div",{className:"camera-tile","data-mode":"driver",id:"cam-driver",children:[e.jsx("div",{className:"camera-preview",children:e.jsx("img",{src:"/arcade-img/DRIVER.png",alt:"Driver View"})}),e.jsx("span",{children:"DRIVER"})]}),e.jsxs("div",{className:"camera-tile","data-mode":"top",id:"cam-top",children:[e.jsx("div",{className:"camera-preview",children:e.jsx("img",{src:"/arcade-img/TOP.png",alt:"Top View"})}),e.jsx("span",{children:"TOP"})]})]})]}),e.jsxs("div",{className:"setting-row",id:"steering-mode-row",style:{marginTop:5},children:[e.jsx("span",{className:"setting-label",children:"Steering Mode"}),e.jsxs("div",{className:"control-options",children:[e.jsx("div",{className:"control-tile active","data-mode":"buttons",id:"ctrl-buttons",children:e.jsx("span",{children:"BUTTONS"})}),e.jsx("div",{className:"control-tile","data-mode":"swipe",id:"ctrl-swipe",children:e.jsx("span",{children:"SWIPE"})}),e.jsx("div",{className:"control-tile","data-mode":"tilt",id:"ctrl-tilt",children:e.jsx("span",{children:"TILT"})})]})]}),e.jsxs("div",{style:{display:"flex",gap:10,marginTop:10},children:[e.jsx("button",{id:"close-settings",className:"modal-button",style:{flex:2},children:"BACK"}),e.jsx("button",{id:"home-button-settings",className:"modal-button",style:{flex:1,background:"#74b9ff",fontSize:"0.7em",boxShadow:"0 8px 0px #0984e3"},children:"HOME"})]})]}),e.jsx("div",{id:"left-button",className:"control-button",children:"◀"}),e.jsx("div",{id:"right-button",className:"control-button",children:"▶"})]})}export{x as default};
