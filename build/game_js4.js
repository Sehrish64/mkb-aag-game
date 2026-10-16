
/* ================= RENDER ================= */
const canvas=document.getElementById('game'), ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
function srand(seed){ let s=seed; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }

const Render={
  draw(){
    const G=Game, L=G.L;
    ctx.clearRect(0,0,VW,VH);
    if(!L||!Sprites.ready){ if(Game.state!=='menu') this.drawLoading(); return; }
    const cx=Math.round(G.camX);
    /* sky */
    const sky=ctx.createLinearGradient(0,0,0,VH);
    sky.addColorStop(0,L.theme.sky[0]); sky.addColorStop(1,L.theme.sky[1]);
    ctx.fillStyle=sky; ctx.fillRect(0,0,VW,VH);
    ctx.save(); ctx.translate(-cx,0);
    this.decor(L,cx);
    for(const p of G.plats) this.platform(p,L);
    this.flag(L.checkpoint.x, G.checkpointDone?'#39d353':'#8a8f9d', '🚩');
    this.goalFlag(L.goal.x);
    for(const c of G.cols) if(!c.taken) this.collectible(c);
    for(const f of G.fires) this.fire(f);
    if(G.state!=='menu') this.hero(G.hero);
    this.particles(G); this.floats(G);
    ctx.restore();
    if(G.state==='menu') this.titleBackdrop();
  },
  drawLoading(){ ctx.fillStyle='#0b0e1a'; ctx.fillRect(0,0,VW,VH);
    ctx.fillStyle='#ffd94a'; ctx.font='bold 28px monospace'; ctx.textAlign='center';
    ctx.fillText('Loading...',VW/2,VH/2); },
  titleBackdrop(){ /* dim behind menu overlay */ },

  decor(L,cx){
    const R=srand(Game.levelIdx*991+7);
    const now=performance.now()/1000;
    if(Game.levelIdx===0){ // BEACH: sun, clouds, sea, palm trees
      ctx.fillStyle='#fff6d8'; ctx.beginPath(); ctx.arc(cx+VW-110,90,44,0,7); ctx.fill();
      ctx.fillStyle='rgba(255,246,216,.35)'; ctx.beginPath(); ctx.arc(cx+VW-110,90,66,0,7); ctx.fill();
      // distant sea with animated waves
      ctx.fillStyle='#2e9fe8'; ctx.fillRect(cx-120,300,VW+240,64);
      ctx.fillStyle='#7fd0ff'; ctx.fillRect(cx-120,300,VW+240,10);
      ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=3;
      for(let i=0;i<7;i++){ const wx=cx-100+((i*190+now*46)%(VW+200));
        ctx.beginPath(); ctx.arc(wx,332,24,Math.PI,0); ctx.stroke(); }
      // clouds
      ctx.fillStyle='rgba(255,255,255,.92)';
      for(let i=0;i<8;i++){ const x=R()*L.width, y=40+R()*120, s=0.7+R()*0.9;
        const px=x-cx*0.25; if(px<-120||px>VW+120) continue;
        ctx.beginPath();
        ctx.ellipse(px,y,46*s,18*s,0,0,7); ctx.ellipse(px-30*s,y+6*s,28*s,13*s,0,0,7); ctx.ellipse(px+30*s,y+6*s,28*s,13*s,0,0,7);
        ctx.fill();
      }
      // palm trees
      for(let i=0;i<12;i++){ const x=R()*L.width; if(x<cx-60||x>cx+VW+60) continue;
        const p=Game.groundAt(x,470); if(!p||p.kind!=='ground') continue;
        const h=90+R()*50, lean=(R()-0.5)*24;
        ctx.fillStyle='#8a5a2e'; ctx.fillRect(x-7,p.y-h,14,h);
        const txp=x+lean;
        ctx.fillStyle='#3e9e4f';
        for(let f=0;f<5;f++){ const a=-Math.PI/2+(f-2)*0.5;
          ctx.beginPath(); ctx.ellipse(txp+Math.cos(a)*32,p.y-h+Math.sin(a)*13,30,9,a,0,7); ctx.fill(); }
        ctx.fillStyle='#6b3a1e';
        ctx.beginPath(); ctx.arc(txp-9,p.y-h+4,8,0,7); ctx.arc(txp+9,p.y-h+4,8,0,7); ctx.fill();
      }
    } else if(Game.levelIdx===1){ // SNOW: mountains, pines, falling snow
      ctx.fillStyle='rgba(150,172,205,.6)';
      for(let i=0;i<8;i++){ const x=R()*L.width, bx=x-cx*0.35;
        if(bx<-160||bx>VW+160) continue;
        const mh=180+R()*120;
        ctx.beginPath(); ctx.moveTo(bx-130,470); ctx.lineTo(bx,470-mh); ctx.lineTo(bx+130,470); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.9)';
        ctx.beginPath(); ctx.moveTo(bx-32,470-mh+64); ctx.lineTo(bx,470-mh); ctx.lineTo(bx+32,470-mh+64);
        ctx.lineTo(bx+15,470-mh+52); ctx.lineTo(bx,470-mh+64); ctx.lineTo(bx-15,470-mh+52); ctx.fill();
        ctx.fillStyle='rgba(150,172,205,.6)'; }
      for(let i=0;i<16;i++){ const x=R()*L.width; if(x<cx-50||x>cx+VW+50) continue;
        const p=Game.groundAt(x,470); if(!p||p.kind!=='ground') continue;
        const h=60+R()*50;
        ctx.fillStyle='#5a3a22'; ctx.fillRect(x-5,p.y-18,10,18);
        ctx.fillStyle='#2e6b3e';
        for(let ti=0;ti<3;ti++){ const tw=46-ti*11, ty=p.y-18-ti*22;
          ctx.beginPath(); ctx.moveTo(x-tw/2,ty); ctx.lineTo(x,ty-26); ctx.lineTo(x+tw/2,ty); ctx.fill(); }
        ctx.fillStyle='rgba(255,255,255,.85)';
        ctx.beginPath(); ctx.moveTo(x-10,p.y-84); ctx.lineTo(x,p.y-106); ctx.lineTo(x+10,p.y-84); ctx.fill();
      }
      // falling snowflakes
      ctx.fillStyle='rgba(255,255,255,.92)';
      for(let i=0;i<70;i++){
        const fx0=R()*VW, spd=40+R()*70, ph=R()*7, fy0=R()*(VH+40);
        const fy=((fy0+now*spd)%(VH+40))-20;
        ctx.fillRect(cx+fx0+Math.sin(now*1.6+ph)*20, fy, 3.5, 3.5);
      }
    } else { // CASTLE: moon, towers, banners, torch glow
      ctx.fillStyle='#f4ead0'; ctx.beginPath(); ctx.arc(cx+VW-120,84,36,0,7); ctx.fill();
      ctx.fillStyle='rgba(244,234,208,.22)'; ctx.beginPath(); ctx.arc(cx+VW-120,84,56,0,7); ctx.fill();
      ctx.fillStyle='#1c1430';
      for(let i=0;i<7;i++){ const x=R()*L.width, bx=x-cx*0.45;
        if(bx<-120||bx>VW+120) continue;
        const th=220+R()*140;
        ctx.fillRect(bx,470-th,90,th);
        for(let b=0;b<5;b++) ctx.fillRect(bx+b*20,470-th-16,12,16);
        ctx.fillStyle='#ffb35c'; ctx.fillRect(bx+35,470-th+70,20,44);
        ctx.fillStyle='#1c1430'; }
      for(let i=0;i<10;i++){ const x=R()*L.width; if(x<cx-40||x>cx+VW+40) continue;
        const p=Game.groundAt(x,470); if(!p||p.kind!=='ground') continue;
        ctx.fillStyle='#3a3a44'; ctx.fillRect(x-3,p.y-150,6,150);
        ctx.fillStyle=i%2?'#a83232':'#2e4a8f';
        ctx.beginPath(); ctx.moveTo(x+3,p.y-150); ctx.lineTo(x+57,p.y-150); ctx.lineTo(x+57,p.y-112);
        ctx.lineTo(x+30,p.y-124); ctx.lineTo(x+3,p.y-112); ctx.fill();
        ctx.fillStyle='#ffd94a'; ctx.fillRect(x+3,p.y-150,54,6);
      }
      for(let i=0;i<12;i++){ const x=R()*L.width; if(x<cx-70||x>cx+VW+70) continue;
        const p=Game.groundAt(x,470); if(!p||p.kind!=='ground') continue;
        const flick=0.4+0.15*Math.sin(now*11+i*2.3);
        const gr=ctx.createRadialGradient(x,p.y-52,4,x,p.y-52,64);
        gr.addColorStop(0,'rgba(255,150,40,'+flick+')'); gr.addColorStop(1,'rgba(255,150,40,0)');
        ctx.fillStyle=gr; ctx.fillRect(x-64,p.y-116,128,128);
        ctx.fillStyle='#5a3a1e'; ctx.fillRect(x-3,p.y-52,6,52);
        ctx.fillStyle='#ff9a2e';
        ctx.beginPath(); ctx.ellipse(x,p.y-56,7,11+3*Math.sin(now*13+i),0,0,7); ctx.fill();
      }
    }
  },

  platform(p,L){
    const t=L.theme;
    if(p.kind==='ground'){
      ctx.fillStyle=t.ground; ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.fillStyle=t.groundDark; ctx.fillRect(p.x,p.y+p.h-26,p.w,26);
      ctx.fillStyle=t.accent; ctx.fillRect(p.x,p.y,p.w,10); // top highlight
      // speckles
      ctx.fillStyle='rgba(0,0,0,.12)';
      const R=srand(Math.floor(p.x));
      for(let i=0;i<p.w/46;i++){ ctx.fillRect(p.x+8+R()*(p.w-16), p.y+22+R()*40, 6, 5); }
      if(Game.levelIdx===2){ // lava-moat cracks in the castle stone
        ctx.fillStyle='#ff5a2e';
        for(let i=0;i<p.w/130;i++){ const lx=p.x+20+i*130; ctx.fillRect(lx,p.y+2,26,5); }
      }
      if(Game.levelIdx===1){ // icy sheen on snow
        ctx.fillStyle='rgba(255,255,255,.55)'; ctx.fillRect(p.x,p.y,p.w,5);
        ctx.fillStyle='rgba(160,200,255,.35)'; ctx.fillRect(p.x,p.y+5,p.w,4);
      }
    } else if(p.kind==='brick'){
      ctx.fillStyle=t.plat; ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.strokeStyle=t.platDark; ctx.lineWidth=3; ctx.strokeRect(p.x+1,p.y+1,p.w-2,p.h-2);
      ctx.beginPath(); ctx.moveTo(p.x+p.w/2,p.y); ctx.lineTo(p.x+p.w/2,p.y+p.h); ctx.stroke();
    } else if(p.kind==='pipe'){
      ctx.fillStyle='#3e9e4f'; ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.fillStyle='#2c7a3a'; ctx.fillRect(p.x,p.y,p.w,10);
      ctx.fillStyle='#57c06a'; ctx.fillRect(p.x+6,p.y+10,10,p.h-10);
      ctx.strokeStyle='#1d5c28'; ctx.lineWidth=3; ctx.strokeRect(p.x+1,p.y+1,p.w-2,p.h-2);
    } else if(p.kind==='move'){
      ctx.fillStyle='#7d5cff'; ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.fillStyle='#a68cff'; ctx.fillRect(p.x,p.y,p.w,7);
      ctx.strokeStyle='#4a34a8'; ctx.lineWidth=3; ctx.strokeRect(p.x+1,p.y+1,p.w-2,p.h-2);
      ctx.fillStyle='#fff'; ctx.font='bold 13px monospace'; ctx.textAlign='center';
      ctx.fillText(p.axis==='x'?'◀ ▶':'▲ ▼', p.x+p.w/2, p.y+p.h/2+5);
    }
  },

  flame(x,yBase,w,h,seed){
    if(h<=4) return;
    const fl=Math.sin(seed*17)+Math.sin(seed*29+1.7)*0.5;
    const hh=h*(1+fl*0.12);
    // glow
    const gr=ctx.createRadialGradient(x,yBase-hh/2,4,x,yBase-hh/2,w*1.4);
    gr.addColorStop(0,'rgba(255,140,30,.45)'); gr.addColorStop(1,'rgba(255,140,30,0)');
    ctx.fillStyle=gr; ctx.fillRect(x-w*1.6,yBase-hh-w*1.6,w*3.2,hh+w*3.2);
    const layer=(ww,hh2,col,dy)=>{
      ctx.fillStyle=col; ctx.beginPath();
      ctx.ellipse(x+Math.sin(seed*23)*3, yBase-hh2/2-dy, ww/2, hh2/2, 0, 0, 7);
      ctx.fill();
    };
    layer(w,hh,'#e8301e',0);
    layer(w*0.68,hh*0.68,'#ff7a2e',2);
    layer(w*0.4,hh*0.42,'#ffd94a',4);
  },
  fire(f){
    if(f.kind==='small'||f.kind==='pit'){
      this.flame(f.x, f.y, f.w, f.h*(0.92+0.08*Math.sin(f.seed*21)), f.seed);
      // charred base
      ctx.fillStyle='rgba(20,10,10,.85)';
      ctx.fillRect(f.x-f.w/2-6, f.y-8, f.w+12, 10);
    } else if(f.kind==='pillar'){
      if(f.curH>4){
        ctx.fillStyle='#3a3a3a'; ctx.fillRect(f.x-f.w/2-8, f.y-14, f.w+16, 16); // vent
        this.flame(f.x, f.y-10, f.w, f.curH, f.seed);
      } else {
        ctx.fillStyle='#3a3a3a'; ctx.fillRect(f.x-f.w/2-8, f.y-14, f.w+16, 16);
        ctx.fillStyle='rgba(255,90,30,.5)'; ctx.fillRect(f.x-f.w/2-8, f.y-18, f.w+16, 4);
      }
    } else if(f.kind==='ball'){
      const g=ctx.createRadialGradient(f.x-5,f.y-6,2,f.x,f.y,f.r+10);
      g.addColorStop(0,'#ffd94a'); g.addColorStop(0.55,'#ff7a2e'); g.addColorStop(1,'rgba(232,48,30,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(f.x,f.y,f.r+8+Math.sin(f.seed*25)*3,0,7); ctx.fill();
      ctx.fillStyle='#e8301e'; ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,7); ctx.fill();
      ctx.fillStyle='#ffd94a'; ctx.beginPath(); ctx.arc(f.x-4,f.y-5,f.r*0.45,0,7); ctx.fill();
    }
  },

  collectible(c){
    const bob=Math.sin(c.seed*2+performance.now()/450)*6;
    const w=34, h=68, x=c.x-w/2, y=c.y-h/2+bob;
    if(Sprites.ready) ctx.drawImage(Sprites.collect,x,y,w,h);
    // sparkle ring
    ctx.strokeStyle=`rgba(255,217,74,${0.5+0.4*Math.sin(performance.now()/300)})`;
    ctx.lineWidth=2; ctx.beginPath(); ctx.arc(c.x,c.y+bob,26+3*Math.sin(performance.now()/350),0,7); ctx.stroke();
  },

  flag(x,color,emoji){
    ctx.fillStyle='#8a6f2e'; ctx.fillRect(x-3,346,6,114);
    ctx.fillStyle=color; ctx.beginPath();
    ctx.moveTo(x+3,346); ctx.lineTo(x+43,358); ctx.lineTo(x+3,370); ctx.fill();
    ctx.font='20px monospace'; ctx.fillText(emoji,x-32,352);
  },
  goalFlag(x){
    ctx.fillStyle='#d8b93e'; ctx.fillRect(x-4,320,8,140);
    ctx.fillStyle='#ffd94a';
    for(let i=0;i<3;i++) for(let j=0;j<2;j++){ if((i+j)%2===0) ctx.fillRect(x+4+i*16,320+j*16,16,16); }
    ctx.strokeStyle='#8a6f2e'; ctx.lineWidth=2; ctx.strokeRect(x+4,320,48,32);
    ctx.fillStyle='#fff'; ctx.font='bold 15px monospace'; ctx.textAlign='center';
    ctx.fillText('GOAL',x+28,372);
  },

  hero(h){
    if(h.invuln>0 && Math.floor(performance.now()/90)%2===0 && h.flash<=0) return; // blink
    const dw=50, dh=75;
    let sx=1, sy=1;
    if(h.grounded&&Math.abs(h.vx)>40){ const s=Math.sin(h.runPh); sx=1+0.09*s; sy=1-0.09*s; }
    if(!h.grounded){ sx=0.92; sy=1.12; }
    if(h.squashT>0){ const k=h.squashT/0.18; sx=1+0.22*k; sy=1-0.2*k; }
    ctx.save();
    ctx.translate(h.x,h.y+HERO_H/2); ctx.scale(h.face*sx,sy);
    if(Sprites.ready) ctx.drawImage(Sprites.hero,-dw/2,-dh/2-(HERO_H-dh)/2-4,dw,dh);
    ctx.restore();
    if(h.flash>0){ ctx.fillStyle=`rgba(255,40,40,${h.flash})`;
      ctx.fillRect(h.x-dw/2,h.y-6,dw,dh); }
  },

  particles(G){
    for(const p of G.parts){
      const k=1-p.life/p.max;
      ctx.globalAlpha=k; ctx.fillStyle=p.color;
      ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
    }
    ctx.globalAlpha=1;
  },
  floats(G){
    ctx.textAlign='center'; ctx.font='bold 21px "Courier New",monospace';
    for(const f of G.floats){
      const k=1-f.t/f.life;
      ctx.globalAlpha=Math.min(1,k*2);
      ctx.lineWidth=4; ctx.strokeStyle='#000'; ctx.strokeText(f.txt,f.x,f.y);
      ctx.fillStyle=f.color; ctx.fillText(f.txt,f.x,f.y);
    }
    ctx.globalAlpha=1;
  },
};

/* ================= UI ================= */
const UI={
  show(id){
    for(const o of ['menuOv','levelOv','overOv','winOv'])
      document.getElementById(o).classList.toggle('hidden', o!==id);
  },
  hud(rekhas,lives,t){
    document.getElementById('rekhaCount').textContent=rekhas;
    document.getElementById('lives').textContent='❤'.repeat(lives)+'🖤'.repeat(3-lives);
    document.getElementById('timer').textContent=fmtTime(t);
  }
};

/* ================= BOOT ================= */
function resize(){
  const ar=16/9; let w=window.innerWidth, h=window.innerHeight;
  if(w/h>ar) w=h*ar; else h=w/ar;
  canvas.style.width=w+'px'; canvas.style.height=h+'px';
}
window.addEventListener('resize',resize); resize();

document.getElementById('playBtn').onclick=()=>{ Game.start(); };
document.getElementById('nextBtn').onclick=()=>{ Game.nextLevel(); };
document.getElementById('retryBtn').onclick=()=>{ Game.retry(); };
document.getElementById('againBtn').onclick=()=>{ Game.start(); };
document.getElementById('menuBtn1').onclick=()=>{ Game.toMenu(); };
document.getElementById('menuBtn2').onclick=()=>{ Game.toMenu(); };
document.getElementById('muteBtn').onclick=e=>{ AudioSys.init(); e.target.textContent=AudioSys.toggleMute()?'🔇':'🔊'; };
window.addEventListener('contextmenu',e=>{ if(e.target.closest('#touch')) e.preventDefault(); });

Input.init(canvas);
Sprites.init('__HERO_B64__','__COLLECT_B64__',()=>{ UI.show('menuOv'); });

let last=0, acc=0; const STEP=1/60;
function frame(t){
  requestAnimationFrame(frame);
  let dt=(t-last)/1000; last=t; if(!(dt>0)||dt>0.25) dt=0.016;
  if(Game.state==='play'){ acc+=dt; let n=0; while(acc>=STEP&&n<5){ Game.update(STEP); acc-=STEP; n++; } }
  else Input.postUpdate();
  Render.draw();
}
requestAnimationFrame(frame);
</script>
</body>
</html>
