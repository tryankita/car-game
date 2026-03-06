import{w as A,r as e,b as u,c as y,A as F,V as C,x as P,S as R,e as j,j as o,h as m}from"./index-FED-y1WV.js";import{nightFactorRef as _}from"./Lighting-B8xIkPGM.js";import{S as z}from"./Sky--2iMDSa0.js";import{E as I}from"./Environment-IdbnBTGU.js";import"./extends-MpcJSOm4.js";const T=()=>parseInt(A.replace(/\D+/g,"")),V=T();class k extends R{constructor(){super({uniforms:{time:{value:0},fade:{value:1}},vertexShader:`
      uniform float time;
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 0.5);
        gl_PointSize = size * (30.0 / -mvPosition.z) * (3.0 + sin(time + 100.0));
        gl_Position = projectionMatrix * mvPosition;
      }`,fragmentShader:`
      uniform sampler2D pointTexture;
      uniform float fade;
      varying vec3 vColor;
      void main() {
        float opacity = 1.0;
        if (fade == 1.0) {
          float d = distance(gl_PointCoord, vec2(0.5, 0.5));
          opacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
        }
        gl_FragColor = vec4(vColor, opacity);

        #include <tonemapping_fragment>
	      #include <${V>=154?"colorspace_fragment":"encodings_fragment"}>
      }`})}}const D=r=>new C().setFromSpherical(new P(r,Math.acos(1-Math.random()*2),Math.random()*2*Math.PI)),O=e.forwardRef(({radius:r=100,depth:a=50,count:t=5e3,saturation:c=0,factor:p=4,fade:n=!1,speed:s=1},d)=>{const i=e.useRef(),[b,x,M]=e.useMemo(()=>{const l=[],h=[],w=Array.from({length:t},()=>(.5+.5*Math.random())*p),f=new u;let v=r+a;const E=a/t;for(let g=0;g<t;g++)v-=E*Math.random(),l.push(...D(v).toArray()),f.setHSL(g/t,c,.9),h.push(f.r,f.g,f.b);return[new Float32Array(l),new Float32Array(h),new Float32Array(w)]},[t,a,p,r,c]);y(l=>i.current&&(i.current.uniforms.time.value=l.clock.elapsedTime*s));const[S]=e.useState(()=>new k);return e.createElement("points",{ref:d},e.createElement("bufferGeometry",null,e.createElement("bufferAttribute",{attach:"attributes-position",args:[b,3]}),e.createElement("bufferAttribute",{attach:"attributes-color",args:[x,3]}),e.createElement("bufferAttribute",{attach:"attributes-size",args:[M,1]})),e.createElement("primitive",{ref:i,object:S,attach:"material",blending:F,"uniforms-fade-value":n,depthWrite:!1,transparent:!0,vertexColors:!0}))}),G=90,L=Math.PI*2,N=new u("#b0c4de"),U=new u("#050510"),W=new u;function q(){const r=e.useRef(),a=e.useRef(),{scene:t}=j();return y(({clock:c})=>{const n=c.getElapsedTime()/G%1*L,s=m.clamp(Math.sin(n)*1.3+.15,0,1);if(r.current){const d=Math.sin(n)*120,i=Math.cos(n)*50;r.current.material.uniforms.sunPosition.value.set(i,Math.max(d,-20),30)}t.fog&&(t.fog.color.copy(W.copy(U).lerp(N,s)),t.fog.near=m.lerp(80,350,s),t.fog.far=m.lerp(400,900,s)),a.current&&(a.current.material.opacity=m.lerp(0,1,_.current))}),o.jsxs(o.Fragment,{children:[o.jsx(z,{ref:r,distance:45e4,sunPosition:[50,80,30],inclination:.6,azimuth:.25,rayleigh:2,turbidity:8,mieCoefficient:.005,mieDirectionalG:.8}),o.jsx(O,{ref:a,radius:200,depth:80,count:3e3,factor:4,saturation:.2,fade:!0,speed:1.5}),o.jsx(I,{preset:"city",background:!1}),o.jsx("fog",{attach:"fog",args:["#b0c4de",350,900]})]})}export{q as default};
