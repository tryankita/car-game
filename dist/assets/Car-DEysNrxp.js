import{r as a,e as N,W as te,P as ce,M as ue,f as le,b as ne,S as re,c as X,u as M,j as e,d as fe,D as se,h as Q,s as ve,V as q,n as me,a as de,i as pe}from"./index-FED-y1WV.js";import{nightFactorRef as xe}from"./Lighting-B8xIkPGM.js";import{_ as he}from"./extends-MpcJSOm4.js";import{u as H}from"./Gltf-rR6tGtTU.js";const ge={uniforms:{tDiffuse:{value:null},h:{value:1/512}},vertexShader:`
      varying vec2 vUv;

      void main() {

        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

      }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float h;

    varying vec2 vUv;

    void main() {

    	vec4 sum = vec4( 0.0 );

    	sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * h, vUv.y ) ) * 0.051;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * h, vUv.y ) ) * 0.0918;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * h, vUv.y ) ) * 0.12245;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * h, vUv.y ) ) * 0.1531;
    	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * h, vUv.y ) ) * 0.1531;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * h, vUv.y ) ) * 0.12245;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * h, vUv.y ) ) * 0.0918;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * h, vUv.y ) ) * 0.051;

    	gl_FragColor = sum;

    }
  `},ye={uniforms:{tDiffuse:{value:null},v:{value:1/512}},vertexShader:`
    varying vec2 vUv;

    void main() {

      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }
  `,fragmentShader:`

  uniform sampler2D tDiffuse;
  uniform float v;

  varying vec2 vUv;

  void main() {

    vec4 sum = vec4( 0.0 );

    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * v ) ) * 0.051;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * v ) ) * 0.051;

    gl_FragColor = sum;

  }
  `},Me=a.forwardRef(({scale:o=10,frames:s=1/0,opacity:v=1,width:c=1,height:i=1,blur:f=1,near:p=0,far:x=10,resolution:r=512,smooth:u=!0,color:j="#000000",depthWrite:k=!1,renderOrder:T,...D},I)=>{const w=a.useRef(null),U=N(y=>y.scene),S=N(y=>y.gl),l=a.useRef(null);c=c*(Array.isArray(o)?o[0]:o||1),i=i*(Array.isArray(o)?o[1]:o||1);const[h,n,C,t,g,E,b]=a.useMemo(()=>{const y=new te(r,r),F=new te(r,r);F.texture.generateMipmaps=y.texture.generateMipmaps=!1;const V=new ce(c,i).rotateX(Math.PI/2),O=new ue(V),R=new le;R.depthTest=R.depthWrite=!1,R.onBeforeCompile=m=>{m.uniforms={...m.uniforms,ucolor:{value:new ne(j)}},m.fragmentShader=m.fragmentShader.replace("void main() {",`uniform vec3 ucolor;
           void main() {
          `),m.fragmentShader=m.fragmentShader.replace("vec4( vec3( 1.0 - fragCoordZ ), opacity );","vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );")};const A=new re(ge),W=new re(ye);return W.depthTest=A.depthTest=!1,[y,V,R,O,A,W,F]},[r,c,i,o,j]),_=y=>{t.visible=!0,t.material=g,g.uniforms.tDiffuse.value=h.texture,g.uniforms.h.value=y*1/256,S.setRenderTarget(b),S.render(t,l.current),t.material=E,E.uniforms.tDiffuse.value=b.texture,E.uniforms.v.value=y*1/256,S.setRenderTarget(h),S.render(t,l.current),t.visible=!1};let P=0,G,z;return X(()=>{l.current&&(s===1/0||P<s)&&(P++,G=U.background,z=U.overrideMaterial,w.current.visible=!1,U.background=null,U.overrideMaterial=C,S.setRenderTarget(h),S.render(U,l.current),_(f),u&&_(f*.4),S.setRenderTarget(null),w.current.visible=!0,U.overrideMaterial=z,U.background=G)}),a.useImperativeHandle(I,()=>w.current,[]),a.createElement("group",he({"rotation-x":Math.PI/2},D,{ref:w}),a.createElement("mesh",{renderOrder:T,geometry:n,scale:[1,-1,1],rotation:[-Math.PI/2,0,0]},a.createElement("meshBasicMaterial",{transparent:!0,map:h.texture,opacity:v,depthWrite:k})),a.createElement("orthographicCamera",{ref:l,args:[-c/2,c/2,i/2,-i/2,p,x]}))}),d={};function De({color:o,modelPath:s,modelScale:v,modelRotY:c,modelPosY:i}){const{scene:f}=H(s||"/models/muscle_car.glb"),p=a.useMemo(()=>{const x=f.clone(!0);return x.traverse(r=>{if(r.isMesh&&(r.castShadow=!0,r.receiveShadow=!0,r.material)){r.material=r.material.clone();const u=(r.material.name||"").toLowerCase();u.includes("body")||u.includes("paint")||u.includes("car")?(r.material.color=new ne(o),r.material.metalness=.65,r.material.roughness=.18,r.material.envMapIntensity=2):u.includes("chrome")||u.includes("metal")||u.includes("trim")?(r.material.metalness=.95,r.material.roughness=.05,r.material.envMapIntensity=2.5):u.includes("glass")||u.includes("window")||u.includes("windshield")?(r.material.metalness=.1,r.material.roughness=.05,r.material.envMapIntensity=2,r.material.transparent=!0,r.material.opacity=.4):r.material.envMapIntensity=1}}),x},[f,o]);return e.jsx("primitive",{object:p,scale:v||1.5,rotation:[0,c||0,0],position:[0,i??.35,0]})}function we({color:o}){return e.jsxs("group",{position:[0,.35,0],children:[e.jsxs("mesh",{position:[0,.55,0],castShadow:!0,children:[e.jsx("boxGeometry",{args:[2.1,.5,4.2]}),e.jsx("meshStandardMaterial",{color:o,metalness:.65,roughness:.18,envMapIntensity:2})]}),e.jsxs("mesh",{position:[0,1,-.2],castShadow:!0,children:[e.jsx("boxGeometry",{args:[1.7,.45,2]}),e.jsx("meshStandardMaterial",{color:o,metalness:.65,roughness:.18,envMapIntensity:2})]}),[[-1.15,.3,1.35],[1.15,.3,1.35],[-1.15,.3,-1.35],[1.15,.3,-1.35]].map((s,v)=>e.jsxs("mesh",{position:s,rotation:[0,0,Math.PI/2],castShadow:!0,children:[e.jsx("cylinderGeometry",{args:[.32,.32,.26,16]}),e.jsx("meshStandardMaterial",{color:"#1a1a1a"})]},v))]})}function Ue({color:o,modelPath:s,modelScale:v,modelRotY:c,modelPosY:i}){return e.jsx(a.Suspense,{fallback:e.jsx(we,{color:o}),children:e.jsx(De,{color:o,modelPath:s,modelScale:v,modelRotY:c,modelPosY:i})})}H.preload("/models/muscle_car.glb");H.preload("/models/sport_car.glb");function Se({velocityRef:o}){const s=a.useRef(),v=a.useRef(),c=a.useRef(),i=a.useRef(),f=a.useRef(),p=a.useRef(),x=a.useRef(),r=a.useRef();return X(()=>{const u=xe.current,j=u>.3,k=j?Q.lerp(.2,4,(u-.3)/.7):0,T=j?Q.lerp(.1,3,(u-.3)/.7):0;s.current&&(s.current.intensity=k),v.current&&(v.current.intensity=k),c.current&&(c.current.emissiveIntensity=T),i.current&&(i.current.emissiveIntensity=T);const D=o?Math.abs(o.current):0,I=.4+(D>.1?1:0),w=.8+(D>.1?1.6:0);x.current&&(x.current.intensity=I),r.current&&(r.current.intensity=I),f.current&&(f.current.emissiveIntensity=w),p.current&&(p.current.emissiveIntensity=w)}),e.jsxs("group",{children:[e.jsxs("mesh",{position:[-.72,.9,2.15],children:[e.jsx("circleGeometry",{args:[.18,12]}),e.jsx("meshStandardMaterial",{ref:c,color:"#ffffee",emissive:"#ffffee",side:se})]}),e.jsxs("mesh",{position:[.72,.9,2.15],children:[e.jsx("circleGeometry",{args:[.18,12]}),e.jsx("meshStandardMaterial",{ref:i,color:"#ffffee",emissive:"#ffffee",side:se})]}),e.jsx("pointLight",{ref:s,position:[-.72,.9,5],color:"#fff4d0",distance:60}),e.jsx("pointLight",{ref:v,position:[.72,.9,5],color:"#fff4d0",distance:60}),e.jsxs("mesh",{position:[-.65,.9,-2.15],children:[e.jsx("boxGeometry",{args:[.4,.14,.04]}),e.jsx("meshStandardMaterial",{ref:f,color:"#880000",emissive:"#ff1100"})]}),e.jsxs("mesh",{position:[.65,.9,-2.15],children:[e.jsx("boxGeometry",{args:[.4,.14,.04]}),e.jsx("meshStandardMaterial",{ref:p,color:"#880000",emissive:"#ff1100"})]}),e.jsx("pointLight",{ref:x,position:[-.65,.9,-3],color:"#ff2200",distance:12}),e.jsx("pointLight",{ref:r,position:[.65,.9,-3],color:"#ff2200",distance:12})]})}function ke(){const o=a.useRef(),s=a.useRef(0),{camera:v}=N(),c=a.useRef(0),i=a.useRef(0),f=a.useRef(!1),p=a.useRef(0),x=M(n=>n.selectedCar),r=M(n=>n.selectedLevel),u=M(n=>n.cars),j=M(n=>n.raceStarted),k=M(n=>n.raceFinished),T=M(n=>n.paused),D=M(n=>n.keybinds),I=M(n=>n.setSpeed),w=M(n=>n.setRaceTime),U=M(n=>n.setCarPosition),S=M(n=>n.completeLap);ve(r);const l=fe(),h=u[x];return a.useEffect(()=>{const n=t=>{d[t.code]=!0},C=t=>{d[t.code]=!1};return window.addEventListener("keydown",n),window.addEventListener("keyup",C),()=>{window.removeEventListener("keydown",n),window.removeEventListener("keyup",C),Object.keys(d).forEach(t=>delete d[t])}},[]),a.useEffect(()=>{o.current&&(o.current.position.set(l.spawn[0],.5,l.spawn[1]),o.current.rotation.set(0,0,0),s.current=0,c.current=l.spawn[1],f.current=!1,i.current=0,p.current=0)},[x,r]),X((n,C)=>{if(!o.current)return;const t=o.current,g=Math.min(C,.05),E=new q(0,7,-15);if(E.applyQuaternion(t.quaternion),v.position.lerp(t.position.clone().add(E),4*g),v.lookAt(t.position.x,1,t.position.z),!j||k||T)return;p.current===0&&(p.current=n.clock.getElapsedTime(),i.current=n.clock.getElapsedTime());const{topSpeed:b,handling:_,acceleration:P}=h,G=d[D.forward]||d.ArrowUp,z=d[D.backward]||d.ArrowDown,y=d[D.left]||d.ArrowLeft,F=d[D.right]||d.ArrowRight,V=d[D.brake];G?s.current+=P*g:z&&(s.current-=P*.6*g),V&&(s.current*=1-5*g),!G&&!z&&(s.current*=1-1.5*g),s.current=Q.clamp(s.current,-b*.3,b),Math.abs(s.current)<.05&&(s.current=0),t.position.y<.5&&(t.position.y=.5);const O=Math.abs(s.current)/b,R=_*g*Math.min(O*3,1),A=s.current>=0?1:-1;y&&(t.rotation.y+=R*A),F&&(t.rotation.y-=R*A);const W=new q(0,0,1).applyQuaternion(t.quaternion);t.position.addScaledVector(W,s.current*g),t.position.y=.5;const m=me(t.position.x,t.position.z),K=Math.abs(m.signedDist),J=pe-1.4;if(K>J){const L=m.signedDist>0?1:-1,B=K-J+.05;t.position.x-=m.nx*B*L,t.position.z-=m.nz*B*L;const ae=m.nx*L,oe=m.nz*L,ee=new q(0,0,1).applyQuaternion(t.quaternion),Y=ee.x*ae+ee.z*oe;if(Y>0&&s.current>0||Y<0&&s.current<0){const ie=Math.abs(Y);s.current*=Math.max(1-ie*.85,.08)}}I(Math.abs(s.current)),w(n.clock.getElapsedTime()-p.current),U(t.position.x,t.position.z,t.rotation.y),de.updateEngineSound(Math.abs(s.current),b);const $=t.position.x,Z=t.position.z;if(f.current||(Z>l.sfLeaveZ||Z<-l.sfLeaveZ)&&(f.current=!0),f.current&&$>l.sfX-l.sfRange&&$<l.sfX+l.sfRange&&c.current<0&&Z>=0){const L=n.clock.getElapsedTime(),B=L-i.current;B>3&&(S(B),i.current=L,f.current=!1)}c.current=Z}),e.jsxs("group",{ref:o,position:[l.spawn[0],.5,l.spawn[1]],children:[e.jsx(Ue,{color:h.color,modelPath:h.model,modelScale:h.scale,modelRotY:h.modelRotY,modelPosY:h.modelPosY}),e.jsx(Se,{velocityRef:s}),e.jsx(Me,{position:[0,.01,0],opacity:.55,scale:10,blur:2.5,far:4,color:"#000010"})]})}export{ke as default};
