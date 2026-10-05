// Image-space flowing realm: geometric UV deformation + advected gold highlights.
// Deliberately 2.5D, not a falsely advertised real-time 3D scene.
export function createRealm(canvas,options={}){
 const mq=matchMedia('(prefers-reduced-motion: reduce)');
 let mode=options.mode|| (mq.matches?'paused':'full');
 let paused=mode==='paused',raf=0,last=0,time=0,loaded=false,focused=false,kick=0,drawCount=0,inView=true;
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
 const report=()=>window.dispatchEvent(new CustomEvent('realm-state',{detail:{paused,available:!!gl&&loaded}}));
 const api={get paused(){return paused;},get available(){return !!gl&&loaded;},setMode(value){mode=value;paused=value==='paused';resize();sync();report();},focus(value){focused=value;},transition(){if(!paused)kick=1;}};
 if(!gl){queueMicrotask(report);return api;}
 const vert='attribute vec2 a; varying vec2 v; void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
 const frag=`precision mediump float;
 varying vec2 v; uniform sampler2D picture; uniform vec2 resolution; uniform vec2 imageSize; uniform float time; uniform float motion; uniform float intro; uniform float quiet;
 vec3 source(vec2 p){return texture2D(picture,clamp(p,vec2(.002),vec2(.998))).rgb;}
 float gold(vec3 c){return smoothstep(.025,.19,c.r-c.b)*smoothstep(.12,.48,c.r)*smoothstep(-.02,.12,c.g-c.b);}
 void main(){
  float ar=resolution.x/resolution.y, ir=imageSize.x/imageSize.y;
  vec2 scale=ar>ir?vec2(1.,ir/ar):vec2(ar/ir,1.);
  vec2 p=(vec2(v.x,1.-v.y)-.5)*scale+.5;
  p=(p-.5)/(1.035+intro*.035)+.5;
  vec3 base=source(p); float top=1.-smoothstep(.40,.57,p.y);
  // Broad deformation makes the river's outline bend, not just its highlights.
  float t=time; float flow=motion*(1.-quiet*.55);
  vec2 bend=vec2(sin(p.y*9.+p.x*4.-t*.18),sin(p.x*8.-t*.21)+.25*sin(p.x*15.+t*.11));
  vec2 displaced=p+bend*vec2(.007,.009)*top*flow;
  vec3 moved=source(displaced);float g=gold(moved)*top;
  // Two overlapping transport phases prevent a visible reset of the brush flow.
  // Estimate local stroke tangent from broad texture gradients, keeping direction coherent.
  vec3 weights=vec3(.299,.587,.114);
  float gx=dot(source(displaced+vec2(.004,0.))-source(displaced-vec2(.004,0.)),weights);
  float gy=dot(source(displaced+vec2(0.,.004))-source(displaced-vec2(0.,.004)),weights);
  vec2 tangent=normalize(vec2(-gy,gx)+vec2(.0001,0.));
  if(tangent.x<0.)tangent=-tangent;
  vec2 direction=normalize(mix(vec2(1.,.30*cos(p.x*8.+p.y*3.)),tangent,.6));
  float phase=fract(t*.075),phaseB=fract(t*.075+.5);
  float blend=abs(phase*2.-1.);
  // Water has smaller horizontal ripples; waterfall textures drift vertically.
  float water=smoothstep(.72,.81,p.y)*(1.-smoothstep(.84,.91,p.y));
  displaced.x+=sin(p.y*160.-t*.7+p.x*9.)*.0007*water*flow;
  float cool=(1.-gold(base))*smoothstep(.16,.4,base.g)*(1.-top)*(1.-smoothstep(.69,.78,p.y))*.3;
  displaced.y+=sin(p.y*80.-t*.9)*.0011*cool*flow;
  vec3 c=source(displaced);
  vec3 transportA=source(displaced-direction*(phase-.5)*.026*flow);
  vec3 transportB=source(displaced-direction*(phaseB-.5)*.026*flow);
  c=mix(c,mix(transportA,transportB,blend),g*.75);
  g=gold(c)*top;
  float along=p.x*18.+sin(p.x*7.+p.y*2.)*1.5+p.y*6.;
  float travelling=.5+.5*sin(along-t*.85);
  c+=vec3(1.,.67,.28)*g*travelling*.10*flow;
  // Gentle haze with near constant luminance, no flashes or global breathing.
  float haze=sin(p.x*7.+p.y*9.+t*.07)*sin(p.x*11.-t*.045)*.012*(1.-g)*flow;
  float air=smoothstep(.43,.60,p.y)*(1.-smoothstep(.70,.79,p.y));
  c+=vec3(.5,.68,.61)*haze*air;
  c*=1.-quiet*.13;
  gl_FragColor=vec4(c,1.);
 }`;
 function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 let program;try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vert));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,frag));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Realm shader link failed');}catch(e){console.warn('Static realm fallback:',e.message);return api;}
 gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
 const u=Object.fromEntries(['resolution','imageSize','time','motion','intro','quiet','picture'].map(k=>[k,gl.getUniformLocation(program,k)]));
 let width=1672,height=941,q=0;const img=new Image();img.onload=()=>{width=img.width;height=img.height;const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);loaded=true;resize();canvas.parentElement.classList.add('ready');sync();report();};img.onerror=report;img.src=new URL('./realm-ink-v3.png',import.meta.url).href;
 function resize(){if(!gl)return;const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.25),limit=mode==='reduced'?1100:1600;const f=Math.min(d,limit/Math.max(1,r.width));canvas.width=Math.round(r.width*f);canvas.height=Math.round(r.height*f);gl.viewport(0,0,canvas.width,canvas.height);if(loaded)draw();}
 function draw(){q+=(Number(focused)-q)*.07;gl.uniform2f(u.resolution,canvas.width,canvas.height);gl.uniform2f(u.imageSize,width,height);gl.uniform1f(u.time,time);gl.uniform1f(u.motion,mq.matches?0:mode==='reduced'?.35:1);gl.uniform1f(u.intro,mode!=='full'||options.intro===false?0:Math.exp(-time*.5)+kick*.32);gl.uniform1f(u.quiet,q);gl.uniform1i(u.picture,0);gl.drawArrays(gl.TRIANGLES,0,6);drawCount++;canvas.dataset.frames=String(drawCount);canvas.dataset.time=time.toFixed(2);}
 function loop(now){raf=0;if(paused||document.hidden||!loaded||!inView)return;const dt=Math.min((now-(last||now))/1000,.10);if(now-last>=(mode==='reduced'?65:32)||!last){time+=dt*(mode==='reduced'?.6:1);last=now;kick*=.97;draw();}raf=requestAnimationFrame(loop);}
 function sync(){cancelAnimationFrame(raf);raf=0;last=0;if(loaded){draw();if(!paused&&!document.hidden&&inView)raf=requestAnimationFrame(loop);}}
 new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();}).observe(canvas);
 addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',sync);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();loaded=false;cancelAnimationFrame(raf);canvas.parentElement.classList.remove('ready');report();});return api;
}
