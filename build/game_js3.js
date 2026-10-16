
/* ================= GAME ================= */
const Game = {
  state:'menu', levelIdx:0, L:null,
  hero:{x:0,y:0,vx:0,vy:0,face:1,grounded:false,coyote:0,jbuf:0,runPh:0,squashT:0,invuln:0,flash:0,groundPlat:null},
  lives:3, levelTime:0, totalTime:0, totalHanias:0, levelHanias:0,
  camX:0, plats:[], fires:[], cols:[], parts:[], floats:[],
  respawn:{x:0,y:0}, checkpointDone:false, goalT:0,

  loadLevel(i){
    this.levelIdx=i; this.L=LEVELS[i];
    const L=this.L;
    this.plats=L.platforms.map(p=>({...p, ox:p.x, oy:p.y, t:Math.random()*10}));
    this.fires=L.fires.map(f=>{
      const o={...f};
      if(o.kind==='small'){ o.y=o.y??460; o.w=36; o.h=48; o.seed=Math.random()*10; }
      if(o.kind==='pillar'){ o.y=460; o.w=46; o.maxH=175; o.seed=o.phase||0; }
      if(o.kind==='pit'){ o.h=56; o.seed=Math.random()*10; }
      if(o.kind==='ball'){ o.r=20; o.y=(o.y??460)-20; o.vx=0; o.vy=0; o.dirT=0; o.dir=1; o.seed=Math.random()*10; }
      return o;
    });
    this.cols=L.collectibles.map(c=>({...c, taken:false, seed:Math.random()*10}));
    this.parts=[]; this.floats=[];
    this.lives=3; this.levelTime=0; this.levelHanias=0;
    this.checkpointDone=false;
    this.respawn={x:L.spawn.x, y:L.spawn.y};
    this.spawnHero();
    this.camX=0;
    document.getElementById('levelLabel').textContent='LV '+(i+1);
  },
  spawnHero(){
    const h=this.hero;
    h.x=this.respawn.x; h.y=this.respawn.y; h.vx=0; h.vy=0;
    h.face=1; h.invuln=2; h.flash=0; h.grounded=false; h.groundPlat=null;
  },
  start(){ AudioSys.init(); this.totalHanias=0; this.totalTime=0; this.loadLevel(0);
    this.state='play'; UI.show(null); AudioSys.startMusic(0); },
  nextLevel(){
    this.totalTime+=this.levelTime;
    if(this.levelIdx+1>=LEVELS.length){ this.state='win'; AudioSys.win(); AudioSys.stopMusic();
      UI.show('winOv'); document.getElementById('winStats').innerHTML=
        `🔥 Hanias: <b>${this.totalHanias}</b> &nbsp;•&nbsp; ⏱ ${fmtTime(this.totalTime)}`;
    } else { this.loadLevel(this.levelIdx+1); this.state='play'; UI.show(null);
      AudioSys.startMusic(this.levelIdx); }
  },
  retry(){ this.totalTime+=this.levelTime; this.loadLevel(this.levelIdx); this.state='play';
    UI.show(null); AudioSys.startMusic(this.levelIdx); },
  toMenu(){ this.state='menu'; AudioSys.stopMusic(); UI.show('menuOv'); },

  hurt(){
    const h=this.hero;
    if(h.invuln>0||this.state!=='play') return;
    this.lives--; AudioSys.hurt(); h.flash=0.6; h.invuln=2;
    this.float(h.x,h.y-30,'OUCH!','#ff5d5d');
    if(this.lives<=0){
      this.state='over'; AudioSys.lose(); AudioSys.stopMusic(); UI.show('overOv');
      document.getElementById('overStats').innerHTML=
        `Reached <b>${this.L.name}</b> &nbsp;•&nbsp; 🔥 ${this.totalHanias+this.levelHanias} Hanias`;
    } else {
      this.spawnHero();
      this.float(h.x,h.y-30,'-1 ❤','#ff5d5d');
    }
  },
  float(x,y,txt,color){ this.floats.push({x,y,txt,color:color||'#fff',t:0,life:1.1}); },
  burst(x,y,color,n,spd){ for(let i=0;i<n;i++){ const a=Math.random()*6.28,s=spd*(0.4+Math.random());
    this.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,life:0,max:0.5+Math.random()*0.4,color,size:3+Math.random()*4,grav:500}); } },

  update(dt){
    const h=this.hero, L=this.L;
    this.levelTime+=dt;
    /* --- moving platforms --- */
    for(const p of this.plats){
      if(p.kind==='move'){
        p.t+=dt;
        const off=Math.sin(p.t*p.speed/60)*(p.range/2);
        const nx=p.axis==='x'?p.ox+off:p.ox, ny=p.axis==='y'?p.oy+off:p.oy;
        p.dx=nx-p.x; p.dy=ny-p.y; p.x=nx; p.y=ny;
      } else { p.dx=0; p.dy=0; }
    }
    /* --- input (ice levels are slippery!) --- */
    const icy=this.L.ice?1:0;
    const ax=(Input.right?1:0)-(Input.left?1:0);
    if(ax!==0){ h.vx+=ax*RUN_ACCEL*(icy?0.7:1)*dt; h.face=ax; h.runPh+=Math.abs(h.vx)*dt*0.06; }
    else { const f=FRICTION*(icy?0.10:1)*dt; h.vx-=Math.sign(h.vx)*Math.min(Math.abs(h.vx),f); }
    h.vx=Math.max(-RUN_MAX,Math.min(RUN_MAX,h.vx));
    if(h.grounded) h.coyote=COYOTE; else h.coyote-=dt;
    if(Input.jumpPressed) h.jbuf=JBUF; else h.jbuf-=dt;
    if(h.jbuf>0&&h.coyote>0){
      h.vy=-JUMP_V; h.grounded=false; h.coyote=0; h.jbuf=0; h.squashT=0.18;
      AudioSys.jump(); this.float(h.x,h.y-40,'Aag','#ffb35c');
      this.burst(h.x,h.y+HERO_H,'#c9c9c9',6,90);
    }
    /* variable jump: low gravity while rising & held */
    const g=(Input.jump&&h.vy<0)?JUMP_HOLD_GRAV:GRAV;
    if(!Input.jump&&h.vy<-260) h.vy=-260; // jump cut
    h.vy+=g*dt; if(h.vy>1100) h.vy=1100;
    /* --- integrate + collide --- */
    const wasGrounded=h.grounded, oldVy=h.vy;
    h.groundPlat=null;
    h.x+=h.vx*dt; this.collideX();
    h.y+=h.vy*dt; h.grounded=false; this.collideY();
    if(!wasGrounded&&h.grounded){ h.squashT=0.16; this.burst(h.x,h.y+HERO_H,'#ffffff',5,70); } // land
    if(h.groundPlat){ h.x+=h.groundPlat.dx; h.y+=h.groundPlat.dy; }
    if(h.invuln>0) h.invuln-=dt;
    if(h.flash>0) h.flash-=dt;
    if(h.squashT>0) h.squashT-=dt;
    /* fell out of world */
    if(h.y>720) { this.hurt(); return; }
    /* --- fires --- */
    for(const f of this.fires) this.updateFire(f,dt);
    /* --- collectibles --- */
    for(const c of this.cols){
      if(c.taken) continue;
      if(Math.abs(h.x-c.x)<44&&Math.abs(h.y+35-c.y)<55){
        c.taken=true; this.levelHanias++;
        AudioSys.collect(); AudioSys.sayHania();
        this.float(c.x,c.y-24,'Hania','#ffd94a');
        this.burst(c.x,c.y,'#ffd94a',14,150);
        this.burst(c.x,c.y,'#fff',8,110);
      }
    }
    /* --- checkpoint & goal --- */
    if(!this.checkpointDone&&h.x>L.checkpoint.x){
      this.checkpointDone=true; this.respawn={x:L.checkpoint.x,y:390};
      AudioSys.checkpoint(); this.float(h.x,h.y-50,'🚩 Checkpoint!','#7ddfff');
    }
    if(Math.abs(h.x-L.goal.x)<40&&h.y>300){ this.levelDone(); return; }
    /* --- camera --- */
    const tx=Math.max(0,Math.min(L.width-VW, h.x-VW*0.42));
    this.camX+=(tx-this.camX)*Math.min(1,7*dt);
    /* --- particles --- */
    this.updateParts(dt);
    /* --- HUD --- */
    UI.hud(this.totalHanias+this.levelHanias, this.lives, this.levelTime);
    Input.postUpdate();
  },

  collideX(){
    const h=this.hero;
    for(const p of this.plats){
      if(h.x+HERO_W/2>p.x&&h.x-HERO_W/2<p.x+p.w&&h.y+HERO_H>p.y&&h.y<p.y+p.h){
        if(h.vx>0) h.x=p.x-HERO_W/2; else if(h.vx<0) h.x=p.x+p.w+HERO_W/2;
        h.vx=0;
      }
    }
    h.x=Math.max(HERO_W/2,Math.min(this.L.width-HERO_W/2,h.x));
  },
  collideY(){
    const h=this.hero;
    for(const p of this.plats){
      if(h.x+HERO_W/2>p.x&&h.x-HERO_W/2<p.x+p.w&&h.y+HERO_H>p.y&&h.y<p.y+p.h){
        if(h.vy>0){ h.y=p.y-HERO_H; h.vy=0; h.grounded=true; h.groundPlat=p; }
        else if(h.vy<0){ h.y=p.y+p.h; h.vy=0; }
      }
    }
  },
  groundAt(x,y){ // any platform containing point?
    for(const p of this.plats) if(x>p.x&&x<p.x+p.w&&y>p.y&&y<p.y+p.h) return p;
    return null;
  },
  heroHits(x0,y0,x1,y1){
    const h=this.hero;
    return h.x+HERO_W/2>x0&&h.x-HERO_W/2<x1&&h.y+HERO_H>y0&&h.y<y1;
  },

  updateFire(f,dt){
    const h=this.hero;
    f.seed+=dt;
    if(f.kind==='small'||f.kind==='pit'){
      const w=f.w, hh=f.h, x0=f.x-w/2, y0=f.y-hh;
      // ember particles
      if(Math.random()<dt*14) this.parts.push({x:f.x+(Math.random()-0.5)*w*0.8,y:f.y-hh*0.4,
        vx:(Math.random()-0.5)*30,vy:-60-Math.random()*60,life:0,max:0.7,color:'#ffb35c',size:2+Math.random()*3,grav:-40});
      if(this.heroHits(x0+6,y0+8,x0+w-6,f.y)) this.hurt();
      f.hx=x0; f.hy=y0;
    } else if(f.kind==='pillar'){
      const T=f.period, t=(f.seed%T);
      let k; // 0..1 height factor: rise, hold, fall
      if(t<T*0.4) k=t/(T*0.4); else if(t<T*0.6) k=1; else k=1-(t-T*0.6)/(T*0.4);
      f.curH=k*f.maxH;
      const x0=f.x-f.w/2, y0=f.y-f.curH;
      if(f.curH>20&&this.heroHits(x0+8,y0,x0+f.w-8,f.y)) this.hurt();
      if(Math.random()<dt*20*k) this.parts.push({x:f.x+(Math.random()-0.5)*f.w,y:f.y-f.curH*Math.random(),
        vx:(Math.random()-0.5)*40,vy:-80-Math.random()*60,life:0,max:0.6,color:'#ff7a2e',size:3,grav:-30});
    } else if(f.kind==='ball'){
      // roll toward hero, turn at edges
      f.dirT-=dt;
      if(f.dirT<=0){ f.dirT=1; f.dir=Math.sign(h.x-f.x)||1; }
      const ahead=f.x+f.dir*(f.r+14);
      if(!this.groundAt(ahead,f.y+f.r+8)) f.dir*=-1;
      f.vx=f.dir*58;
      f.vy+=GRAV*dt;
      f.x+=f.vx*dt;
      const p=this.groundAt(f.x,f.y+f.r+4);
      if(p&&f.vy>0){ f.y=p.y-f.r; f.vy=0; }
      if(Math.random()<dt*10) this.parts.push({x:f.x+(Math.random()-0.5)*f.r,y:f.y,
        vx:(Math.random()-0.5)*30,vy:-50-Math.random()*40,life:0,max:0.5,color:'#ffb35c',size:2.5,grav:-20});
      if(Math.abs(h.x-f.x)<f.r+20&&Math.abs(h.y+35-f.y)<f.r+30) this.hurt();
    }
  },
  updateParts(dt){
    for(let i=this.parts.length-1;i>=0;i--){ const p=this.parts[i];
      p.life+=dt; if(p.life>=p.max){this.parts.splice(i,1);continue;}
      p.vy+=p.grav*dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
    }
    for(let i=this.floats.length-1;i>=0;i--){ const f=this.floats[i];
      f.t+=dt; if(f.t>=f.life){this.floats.splice(i,1);continue;} f.y-=34*dt;
    }
  },
  levelDone(){
    this.state='leveldone'; this.totalHanias+=this.levelHanias;
    AudioSys.win();
    this.burst(this.hero.x,this.hero.y,'#ffd94a',30,220);
    UI.show('levelOv');
    document.getElementById('levelTitle').textContent=this.L.name+' Complete!';
    document.getElementById('levelStats').innerHTML=
      `🔥 Hanias: <b>${this.levelHanias}</b> &nbsp;•&nbsp; ⏱ ${fmtTime(this.levelTime)}`;
    Input.postUpdate();
  },
};
function fmtTime(s){ const m=Math.floor(s/60), ss=Math.floor(s%60); return m+':'+String(ss).padStart(2,'0'); }
