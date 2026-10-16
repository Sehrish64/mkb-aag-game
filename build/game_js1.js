
/* ================= CONFIG ================= */
const VW = 960, VH = 540, GRAV = 2300;
const HERO_W = 46, HERO_H = 70;          // hero hitbox
const RUN_ACCEL = 2800, RUN_MAX = 350, FRICTION = 2600;
const JUMP_V = 800, JUMP_HOLD_GRAV = 900; // held jump = low gravity
const COYOTE = 0.10, JBUF = 0.14;

/* ================= AUDIO =================
   All procedural WebAudio. Swap any method body to use a file. */
const AudioSys = {
  ctx:null, muted:false, musicTimer:null, master:null, musicGain:null,
  init(){
    if(this.ctx) { if(this.ctx.state==='suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext||window.webkitAudioContext;
    if(!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.30; this.musicGain.connect(this.master);
  },
  toggleMute(){ this.muted=!this.muted; if(this.master) this.master.gain.value=this.muted?0:0.9; return this.muted; },
  tone(freq, dur, type='square', vol=0.5, when=0, slideTo=null, dest=null){
    if(!this.ctx||this.muted) return;
    const t=this.ctx.currentTime+when, o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,t);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20,slideTo),t+dur);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g); g.connect(dest||this.master); o.start(t); o.stop(t+dur+0.02);
  },
  noise(dur, vol=0.4, when=0, hp=800){
    if(!this.ctx||this.muted) return;
    const t=this.ctx.currentTime+when, n=this.ctx.sampleRate*dur, buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate);
    const d=buf.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
    const s=this.ctx.createBufferSource(); s.buffer=buf;
    const f=this.ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp;
    const g=this.ctx.createGain(); g.gain.value=vol;
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t);
  },
  /* --- SFX (swap bodies to use aag.mp3 / hania.mp3) --- */
  jump(){ // "aag" whoosh — replace with aag.mp3 for the real voice
    this.noise(0.28,0.5,0,400); this.tone(300,0.25,'sawtooth',0.25,0,900);
  },
  collect(){ // sparkle chime
    [880,1174,1568].forEach((f,i)=>this.tone(f,0.18,'sine',0.35,i*0.07));
  },
  sayHania(){ // TTS "Hania" — swap for hania.mp3 later
    try{
      if(!('speechSynthesis' in window)) return;
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance('Hania');
      u.rate=1.05; u.pitch=1.1; speechSynthesis.speak(u);
    }catch(e){}
  },
  hurt(){ this.tone(220,0.3,'sawtooth',0.5,0,60); this.noise(0.2,0.4); },
  checkpoint(){ [523,659,784].forEach((f,i)=>this.tone(f,0.15,'square',0.3,i*0.09)); },
  win(){ [523,659,784,1046,1318].forEach((f,i)=>this.tone(f,0.22,'square',0.35,i*0.11)); },
  lose(){ [400,300,220,150].forEach((f,i)=>this.tone(f,0.25,'sawtooth',0.35,i*0.14)); },
  /* --- chiptune loop: cheerful original, per-level key/tempo --- */
  startMusic(levelIdx){
    this.stopMusic(); if(!this.ctx) return;
    const scales=[[0,2,4,7,9],[0,2,3,7,8],[0,1,5,6,10]]; // major-ish, minor-ish, phrygian-ish
    const roots=[262,294,220]; const bpm=[132,140,150][levelIdx]||132;
    const beat=60/bpm/2; let step=0;
    const sc=scales[levelIdx%3], root=roots[levelIdx%3];
    const bassLine=[0,0,7,0, 5,5,7,5];
    this.musicTimer=setInterval(()=>{
      if(this.muted) { step++; return; }
      const s=step%16, bar=Math.floor(step/16)%4;
      // lead: bouncy arpeggio
      if(s%2===0){
        const n=sc[(s/2+bar*2)%sc.length];
        this.tone(root*Math.pow(2,n/12)*2, beat*0.9,'square',0.16,0,null,this.musicGain);
      }
      // bass on quarters
      if(s%4===0){
        const b=bassLine[(s/4+bar)%bassLine.length];
        this.tone(root*Math.pow(2,b/12)/2, beat*1.8,'triangle',0.30,0,null,this.musicGain);
      }
      // hat
      if(s%2===1) this.noise(0.03,0.06,0,6000);
      step++;
    }, beat*1000);
  },
  stopMusic(){ if(this.musicTimer){clearInterval(this.musicTimer); this.musicTimer=null;} }
};

/* ================= INPUT ================= */
const Input = {
  left:false,right:false,jump:false,jumpPressed:false,
  init(canvas){
    const key=(e,down)=>{
      const k=e.key.toLowerCase();
      if(['arrowleft','a'].includes(k)) this.left=down;
      if(['arrowright','d'].includes(k)) this.right=down;
      if([' ','arrowup','w'].includes(k)){ if(down&&!this.jump) this.jumpPressed=true; this.jump=down; }
      if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
    };
    window.addEventListener('keydown',e=>key(e,true));
    window.addEventListener('keyup',e=>key(e,false));
    const bind=(id,prop)=>{
      const el=document.getElementById(id);
      const on=e=>{e.preventDefault(); if(prop==='jump'&&!this.jump) this.jumpPressed=true; this[prop]=true; el.classList.add('on');};
      const off=e=>{e.preventDefault(); this[prop]=false; el.classList.remove('on');};
      el.addEventListener('pointerdown',on); el.addEventListener('pointerup',off);
      el.addEventListener('pointercancel',off); el.addEventListener('pointerleave',off);
    };
    bind('tLeft','left'); bind('tRight','right'); bind('tJump','jump');
    canvas.addEventListener('pointerdown',()=>AudioSys.init(),{once:true});
  },
  postUpdate(){ this.jumpPressed=false; }
};

/* ================= SPRITES ================= */
const Sprites = {
  hero:new Image(), collect:new Image(), ready:false,
  init(heroB64, colB64, cb){
    let n=0; const done=()=>{ if(++n===2){this.ready=true; cb&&cb();} };
    this.hero.onload=done; this.collect.onload=done;
    this.hero.src='data:image/png;base64,'+heroB64;
    this.collect.src='data:image/png;base64,'+colB64;
    document.getElementById('heroPreview').src=this.hero.src;
    document.getElementById('rekhaIcon').src=this.collect.src;
  }
};
