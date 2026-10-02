/* Neon Spider — local-only cursor overlay. No telemetry; underlying page links/content stay untouched. */
(() => {
  'use strict';
  const API_KEY = '__neonSpiderCursorExtensionV1';
  if (window[API_KEY] && typeof window[API_KEY].toggle === 'function') { window[API_KEY].toggle(); return; }
  const host = document.createElement('div');
  host.id = 'neon-spider-overlay';
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none';
  const shadow = host.attachShadow({mode:'open'});
  shadow.innerHTML = `<style>
    canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
    aside{position:absolute;bottom:18px;right:18px;pointer-events:auto;background:#101220ed;color:#cbd5e1;border:1px solid #394354;border-radius:12px;padding:10px 14px;font:12px system-ui;display:flex;align-items:center;gap:12px;box-shadow:0 8px 30px #0006}
    button{background:#242c40;color:#d7faff;border:1px solid #49576a;border-radius:6px;padding:6px 9px;cursor:pointer} input{width:75px;accent-color:#00e5ff} label{display:flex;align-items:center;gap:6px}
    @media(prefers-reduced-motion:reduce){aside:before{content:'Reduced motion · ';color:#ffb74d}}
  </style><canvas aria-hidden="true"></canvas><aside aria-label="Neon Spider controls"><span>NEON SPIDER</span><button id="pause">Pause</button><label>Glitch <input aria-label="Glitch intensity" type="range" min="0" max="100" value="55"></label><button id="close" aria-label="Remove Neon Spider">×</button></aside>`;
  document.documentElement.append(host);
  const canvas = shadow.querySelector('canvas'), ctx = canvas.getContext('2d');
  const palette = ['#00e5ff','#ff22dc','#ab72ff','#48ffab'];
  const pointer = {x:innerWidth/2,y:innerHeight/2}, body = {...pointer};
  const legs = Array.from({length:8}, (_,i) => ({x:body.x,y:body.y,kx:body.x,ky:body.y,i}));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let running = !reduced.matches, intensity = .55, raf = 0, last = 0, refresh = 0, anchors = [], width, height, burst = 0, destroyed = false;
  const listeners = [];
  function on(target,event,fn,opts) { target.addEventListener(event,fn,opts); listeners.push(()=>target.removeEventListener(event,fn,opts)); }
  function resize() { width=innerWidth; height=innerHeight; const d=Math.min(devicePixelRatio||1,2); canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);refresh=0; }
  function collect() {
    anchors=[];
    // Bounded sampling, rebuilt after scrolling; never change the underlying links.
    const nodes=document.querySelectorAll('a[href]');
    for(let i=0;i<Math.min(nodes.length,1200);i++) {
      const el=nodes[i], r=el.getBoundingClientRect(), text=(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,65);
      if(text && r.width>4 && r.bottom>0 && r.top<height && r.right>0 && r.left<width) anchors.push({x:r.x,y:r.y,w:Math.min(r.width,360),h:Math.min(r.height,24),text});
    }
  }
  function line(x,y,a,b,color,alpha=1) {ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();}
  function draw(now) {
    if(!running||destroyed) return;
    const dt=Math.min((now-last)||16,50);last=now;
    ctx.clearRect(0,0,width,height);
    if(now>refresh){collect();refresh=now+500;}
    const ease=1-Math.exp(-dt/65);body.x+=(pointer.x-body.x)*ease;body.y+=(pointer.y-body.y)*ease;
    const speed=Math.min(Math.hypot(pointer.x-body.x,pointer.y-body.y)/100,1), t=now/1000;
    ctx.lineWidth=1.15;
    const near=anchors.filter(r=>Math.hypot(r.x+r.w/2-body.x,r.y-body.y)<150);
    legs.forEach((leg,i)=>{
      const side=i<4?-1:1, index=i%4;
      const a=side<0?Math.PI*.68+index*.22:Math.PI*.32-index*.22;
      const radius=52+index*7+Math.sin(t*3+i)*8;
      let tx=body.x+Math.cos(a)*radius, ty=body.y+(index-1.5)*30+Math.sin(t*4+i)*8;
      if(near.length){const r=near[i%near.length];tx=side<0?r.x:r.x+r.w;ty=r.y+r.h/2;}
      leg.x+=(tx-leg.x)*.15;leg.y+=(ty-leg.y)*.15;
      leg.kx=body.x+side*(24+index*3);leg.ky=body.y+(index-1.5)*19;
      const c=palette[i%4];line(body.x,body.y,leg.kx,leg.ky,c);line(leg.kx,leg.ky,leg.x,leg.y,c);
      const next=legs[(i+1)%8];line(leg.x,leg.y,next.x,next.y,palette[(i+1)%4],.35);
      ctx.globalAlpha=1;ctx.fillStyle=c;ctx.fillRect(leg.x-2,leg.y-2,4,4);
      ctx.beginPath();ctx.arc(leg.kx,leg.ky,2,0,Math.PI*2);ctx.fill();
    });
    ctx.globalAlpha=1;ctx.strokeStyle='#b3ffff';ctx.beginPath();ctx.ellipse(body.x,body.y,6,12,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#00e5ff';ctx.fillRect(body.x-2,body.y-15,4,4);
    burst=Math.max(0,burst-dt/700);
    const power=intensity*(.4+speed*.6)+burst*.5;
    const nearby=anchors.filter(r=>Math.hypot(r.x+r.w/2-body.x,r.y-body.y)<220).slice(0,10);
    nearby.forEach((r,i)=>{
      const c=palette[i%4], wave=Math.sin(t*4+i*2), amount=power*(.5+.5*wave);
      ctx.globalAlpha=.45+amount*.45;ctx.strokeStyle=c;ctx.strokeRect(r.x,r.y,r.w,r.h);
      if(amount>.32){
        ctx.save();ctx.translate(r.x,r.y);ctx.rotate(Math.sin(t+i)*amount*.4);
        ctx.fillStyle=c;ctx.globalAlpha=.8;ctx.fillRect(0,0,r.w*(1+amount),r.h);
        ctx.fillStyle='#090915';ctx.font=`${Math.round(12+amount*12)}px monospace`;ctx.fillText(r.text,3,r.h-3);ctx.restore();
        line(body.x,body.y,r.x,r.y,c,.45);
      }
    });
    ctx.globalAlpha=1;raf=requestAnimationFrame(draw);
  }
  function toggle() { running=!running;shadow.querySelector('#pause').textContent=running?'Pause':'Resume';cancelAnimationFrame(raf);ctx.clearRect(0,0,width,height);if(running){last=performance.now();raf=requestAnimationFrame(draw);} }
  function destroy() {destroyed=true;cancelAnimationFrame(raf);listeners.forEach(f=>f());host.remove();delete window[API_KEY];}
  on(window,'pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;},{passive:true});
  on(window,'resize',resize);on(window,'scroll',()=>{refresh=0;},true);
  on(window,'pointerdown',e=>{if(!e.composedPath().includes(host))burst=1;});
  on(window,'keydown',e=>{if(e.altKey&&e.shiftKey&&e.code==='KeyS'){e.preventDefault();toggle();}});
  on(document,'visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden&&running){last=performance.now();raf=requestAnimationFrame(draw);}});
  on(reduced,'change',e=>{if(e.matches&&running)toggle();});
  on(shadow.querySelector('#pause'),'click',toggle);on(shadow.querySelector('#close'),'click',destroy);
  on(shadow.querySelector('input'),'input',e=>intensity=Number(e.target.value)/100);
  window[API_KEY]={toggle,destroy,get running(){return running;}};
  resize();shadow.querySelector('#pause').textContent=running?'Pause':'Resume';if(running)raf=requestAnimationFrame(draw);
})();
