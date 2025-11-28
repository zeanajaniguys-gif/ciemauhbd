/* NEXT LEVEL JS
   Features:
   - Parallax mouse move
   - Countdown to Dec 9 local 00:00 (this year or next)
   - Sparkles, hearts, balloons particles
   - Butterfly particle system (fxCanvas)
   - Confetti & fireworks
   - Music fade-in using WebAudio gain node
   - Floating messages
   - Celebration mode auto-trigger at exact time (and manual)
   - WhatsApp auto-open (and fallback modal)
   - Easter-egg: triple click on photo
*/

/* -------------------------
   Utilities
--------------------------*/
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* Timezone note: this uses user's local time (browser) */
/* Elements */
const canvas = document.getElementById('fxCanvas');
const ctx = canvas.getContext('2d');
const photo = document.getElementById('photo');
const photoWrap = document.getElementById('photoWrap');
const photoAura = document.getElementById('photoAura');
const birthdayAudio = document.getElementById('birthdayAudio');
const celebrateBtn = document.getElementById('celebrateBtn');
const secretBtn = document.getElementById('secretBtn');
const waModal = document.getElementById('waModal');
const waLink = document.getElementById('waLink');
const waClose = document.getElementById('waClose');
const sparklesRoot = document.getElementById('sparkles');
const headline = document.getElementById('headline');
const portal = document.getElementById('portal');

let W = window.innerWidth, H = window.innerHeight;
canvas.width = W; canvas.height = H;

/* -------------------------
   Parallax
--------------------------*/
(function setupParallax(){
  const layers = document.querySelectorAll('.layer');
  window.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth/2, cy = window.innerHeight/2;
    const dx = (e.clientX - cx)/cx;
    const dy = (e.clientY - cy)/cy;
    layers.forEach(layer => {
      const depth = parseFloat(layer.dataset.depth) || 0.05;
      const tx = -dx * 20 * depth;
      const ty = -dy * 18 * depth;
      layer.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    });
  });
})();

/* -------------------------
   Countdown timer
--------------------------*/
function getTargetDate(){
  const now = new Date();
  const year = now.getFullYear();
  const candidate = new Date(year, 11, 9, 0, 0, 0); // month 11 = Dec
  if (now > candidate) return new Date(year+1, 11, 9, 0, 0, 0);
  return candidate;
}
let target = getTargetDate();

function pad(n){ return n.toString().padStart(2,'0') }
function updateCountdown(){
  const now = new Date();
  const diff = target - now;
  if (diff <= 0){
    // trigger once and update display to zeros
    document.getElementById('days').textContent='0';
    document.getElementById('hours').textContent='00';
    document.getElementById('minutes').textContent='00';
    document.getElementById('seconds').textContent='00';
    if(!window._celebrationFired){
      startCelebration();
      window._celebrationFired = true;
    }
    return;
  }
  const d = Math.floor(diff / (1000*60*60*24));
  const h = Math.floor((diff/(1000*60*60))%24);
  const m = Math.floor((diff/(1000*60))%60);
  const s = Math.floor((diff/1000)%60);
  document.getElementById('days').textContent = d;
  document.getElementById('hours').textContent = pad(h);
  document.getElementById('minutes').textContent = pad(m);
  document.getElementById('seconds').textContent = pad(s);

  // if exactly at midnight (0h0m0s) we rely above to fire
}
setInterval(updateCountdown, 1000);
updateCountdown();

/* -------------------------
   Audio: WebAudio for fade-in & simple filter
--------------------------*/
let audioCtx, gainNode, sourceNode;
function setupAudio(){
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;
    sourceNode = audioCtx.createMediaElementSource(birthdayAudio);
    // optional gentle lowpass for warm vibe
    const biquad = audioCtx.createBiquadFilter();
    biquad.type = "lowpass";
    biquad.frequency.value = 12000;

    sourceNode.connect(biquad);
    biquad.connect(gainNode);
    gainNode.connect(audioCtx.destination);
  } catch(e){
    console.warn('WebAudio not supported', e);
    audioCtx = null;
  }
}

function fadeInAudio(duration = 4000){
  if(!audioCtx) return birthdayAudio.play().catch(()=>{});
  const now = audioCtx.currentTime;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(1.0, now + duration/1000);
  birthdayAudio.play().catch(e => {
    // autoplay may be blocked; user must click to enable
    console.warn('Autoplay blocked', e);
  });
}

/* Start audio context on first user interaction to avoid autoplay block */
['click','touchstart','keydown'].forEach(evt=>{
  window.addEventListener(evt, function initAudioOnce(){
    if(!audioCtx) setupAudio();
    window.removeEventListener(evt, initAudioOnce);
  }, {once:true});
});

/* -------------------------
   Sparkles (DOM small elements)
--------------------------*/
function spawnSparkle(){
  const s = document.createElement('div');
  s.className = 'sparkle';
  const size = 4 + Math.random()*8;
  s.style.width = `${size}px`; s.style.height = `${size}px`;
  s.style.left = `${Math.random()*W}px`;
  s.style.top = `${Math.random()*H}px`;
  s.style.opacity = 0.8 + Math.random()*0.3;
  s.style.filter = `blur(${Math.random()*2}px)`;
  sparklesRoot.appendChild(s);
  setTimeout(()=> s.remove(), 1800 + Math.random()*800);
}
setInterval(spawnSparkle, 160);

/* -------------------------
   Hearts & balloons (DOM) — lightweight
--------------------------*/
function spawnHeart(){
  const el = document.createElement('div');
  el.className = 'particle heartDom';
  el.textContent = '❤️';
  el.style.position = 'fixed';
  el.style.left = `${Math.random()*W}px`;
  el.style.top = `${-30 - Math.random()*40}px`;
  el.style.fontSize = `${16 + Math.random()*22}px`;
  el.style.zIndex = 6;
  el.style.pointerEvents = 'none';
  document.body.appendChild(el);
  const duration = 4200 + Math.random()*2600;
  el.animate([
    { transform: `translateY(0) scale(1)`, opacity:1 },
    { transform: `translateY(${H+60}px) scale(.9)`, opacity:0.0 }
  ], {duration, easing:'linear'});
  setTimeout(()=> el.remove(), duration+100);
}
setInterval(spawnHeart, 700);

function spawnBalloon(){
  const el = document.createElement('div');
  el.className = 'particle balloonDom';
  el.textContent = ['🎈','🎈','🎈'][Math.floor(Math.random()*3)];
  el.style.position = 'fixed';
  const left = Math.random()*(W-60);
  el.style.left = `${left}px`;
  el.style.bottom = `-60px`;
  el.style.fontSize = `${26 + Math.random()*26}px`;
  el.style.zIndex = 6;
  el.style.pointerEvents='none';
  document.body.appendChild(el);
  const duration = 6000 + Math.random()*4000;
  el.animate([
    { transform: `translateY(0)`, opacity:1 },
    { transform: `translateY(-${H+180}px)`, opacity:0 }
  ], {duration, easing:'cubic-bezier(.2,.9,.2,1)'});
  setTimeout(()=> el.remove(), duration+80);
}
setInterval(spawnBalloon, 1800);

/* -------------------------
   Butterfly particle system on canvas (gentle motion)
--------------------------*/
const butterflies = [];
function Butterfly(){
  this.x = Math.random()*W;
  this.y = H + Math.random()*60;
  this.size = 6 + Math.random()*10;
  this.speed = 0.2 + Math.random()*0.8;
  this.angle = Math.random()*Math.PI*2;
  this.phase = Math.random()*Math.PI*2;
  this.hue = 260 + Math.random()*60; // pastel
}
Butterfly.prototype.update = function(t){
  this.angle += 0.002 + Math.random()*0.006;
  this.x += Math.cos(this.angle)*this.speed*2;
  this.y += - (0.1 + Math.abs(Math.sin(this.phase))*this.speed);
  this.phase += 0.02;
  if(this.y < -60 || this.x < -80 || this.x > W+80){
    // reset
    this.x = Math.random()*W;
    this.y = H + 40 + Math.random()*40;
  }
};
Butterfly.prototype.draw = function(ctx){
  ctx.save();
  ctx.translate(this.x, this.y);
  ctx.rotate(Math.sin(this.phase)*0.5);
  // simple wings
  ctx.fillStyle = `hsla(${this.hue},80%,70%,0.95)`;
  ctx.beginPath();
  ctx.ellipse(-this.size/2, 0, this.size, this.size*0.7, Math.PI/6, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(this.size/2, 0, this.size, this.size*0.7, -Math.PI/6, 0, Math.PI*2);
  ctx.fill();
  // body
  ctx.fillStyle = `hsla(${this.hue-30},60%,35%,0.95)`;
  ctx.fillRect(-1, -this.size*0.5, 2, this.size);
  ctx.restore();
};
for(let i=0;i<16;i++) butterflies.push(new Butterfly());

/* -------------------------
   Confetti & fireworks (canvas)
--------------------------*/
let confetti = [], fireworks = [];
function spawnConfettiBurst(x,y,count=120){
  for(let i=0;i<count;i++){
    confetti.push({
      x:x + (Math.random()-0.5)*80,
      y:y + (Math.random()-0.5)*40,
      vx:(Math.random()-0.5)*6,
      vy:(Math.random()-3.5)*6,
      size: 6 + Math.random()*8,
      color: `hsl(${Math.random()*360}, 85%, 65%)`,
      life: 120 + Math.random()*80
    });
  }
}
function spawnFirework(){
  const x = Math.random()*W*0.8 + W*0.1;
  const y = Math.random()*H*0.4 + 40;
  for(let i=0;i<30;i++){
    fireworks.push({
      x,y,
      vx:(Math.random()-0.5)*6,
      vy:(Math.random()-0.5)*6,
      r:1+Math.random()*3,
      color:`hsl(${Math.random()*360},80%,65%)`,
      life: 60 + Math.random()*60
    });
  }
}

/* -------------------------
   Render loop
--------------------------*/
function render(t){
  ctx.clearRect(0,0,W,H);

  // butterflies
  butterflies.forEach(b => { b.update(t); b.draw(ctx); });

  // confetti
  for(let i=confetti.length-1;i>=0;i--){
    const p = confetti[i];
    p.vy += 0.12; // gravity
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size*0.6);
    if(p.life<=0 || p.y>H+80) confetti.splice(i,1);
  }

  // fireworks
  for(let i=fireworks.length-1;i>=0;i--){
    const f = fireworks[i];
    f.vy += 0.06;
    f.x += f.vx;
    f.y += f.vy;
    f.life--;
    ctx.beginPath();
    ctx.fillStyle = f.color;
    ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
    ctx.fill();
    if(f.life<=0) fireworks.splice(i,1);
  }

  requestAnimationFrame(render);
}
requestAnimationFrame(render);

/* -------------------------
   Floating message bubbles
--------------------------*/
const messages = [
  "ciee bentar lagi ultahh.",
  "asekkk mau ultahh.",
  "9 Desember traktirr yaa.",
  "Terima kasih sudah jadi dirimu.",
  "ndut jelek mau ultah."
];
let msgIndex = 0;
const bubbleRoot = document.getElementById('messageBubble');
function floatMessage(){
  const text = messages[msgIndex++ % messages.length];
  const el = document.createElement('div');
  el.className = 'message';
  el.textContent = text;
  bubbleRoot.appendChild(el);
  // animate in
  requestAnimationFrame(()=>{ el.style.opacity=1; el.style.transform='translateY(0)'; });
  setTimeout(()=> {
    el.style.opacity=0; el.style.transform='translateY(-10px)';
    setTimeout(()=> el.remove(), 800);
  }, 5200 + Math.random()*1500);
}
setInterval(floatMessage, 5200);
floatMessage();

/* -------------------------
   Resize handling
--------------------------*/
window.addEventListener('resize', ()=> {
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W; canvas.height = H;
});

/* -------------------------
   Celebration / trigger
--------------------------*/
let celebrationRunning = false;

function startCelebration(){
  if(celebrationRunning) return;
  celebrationRunning = true;
  document.body.classList.add('celebrate');

  // enlarge photo & pulse aura
  photo.style.transform = 'scale(1.06)';
  photoAura.classList.add('pulse');

  // play music fade-in
  fadeInAudio(4000);

  // spawn a few fireworks & confetti bursts
  spawnConfettiBurst(W/2, H/3, 220);
  for(let i=0;i<8;i++) setTimeout(()=> spawnFirework(), i*400);

  // show big headline glow & pulse
  headline.textContent = "ADA YANG MAU HBD NIH BENTAR LAGI ❤️";
  headline.animate([
    { transform: 'translateY(0) scale(1)', opacity:1, textShadow: '0 6px 20px rgba(255,120,160,0.12)' },
    { transform: 'translateY(-6px) scale(1.04)', opacity:1, textShadow: '0 30px 60px rgba(255,190,220,0.28)' },
    { transform: 'translateY(0) scale(1)', opacity:1 }
  ], { duration: 900, iterations: 6, easing:'ease-in-out' });

  // Try to open WA automatically; if blocked, show modal with link
}

/* manual celebrate button */
celebrateBtn.addEventListener('click', ()=> {
  startCelebration();
});

/* -------------------------
   WhatsApp open & fallback
--------------------------*/
const WA_NUMBER = "https://wa.me/6285375905671"; // optional: you can put +62XXXXXXXXXX (with country code and plus removed is okay for wa.me? we will open wa.me/?text)
const WA_MESSAGE = encodeURIComponent("Selamat ulang tahun sayang 🎂💖 Semoga bahagia selalu — dari aku.");
function buildWALink(){
  // We use generic wa.me/?text= so user can choose phone in WA, or you can put wa.me/62... to choose number
  if(WA_NUMBER && WA_NUMBER.trim().length>0){
    const num = WA_NUMBER.replace(/\D/g,''); // digits only
    return `https://wa.me/${num}?text=${WA_MESSAGE}`;
  }
  return `https://wa.me/?text=${WA_MESSAGE}`;
}
function attemptOpenWA(){
  const url = buildWALink();
  const newWin = window.open(url, '_blank');
  if(!newWin || newWin.closed || typeof newWin.closed == 'undefined'){
    // popup blocked: show modal with link
    waLink.href = url;
    waModal.classList.remove('hidden');
  } else {
    // success; focus the new window if possible
    try { newWin.focus(); } catch(e){}
  }
}
waClose.addEventListener('click', ()=> waModal.classList.add('hidden'));

/* secret button: manual open */
secretBtn.addEventListener('click', ()=>{
  attemptOpenWA();
});

/* -------------------------
   Portal intro open animation
--------------------------*/
setTimeout(()=> {
  portal.style.transition = 'opacity 900ms var(--ease), transform 900ms var(--ease)';
  portal.style.opacity = 0;
  portal.style.transform = 'scale(.98) translateY(-6px)';
  setTimeout(()=> portal.remove(), 900);
  document.getElementById('card').style.opacity = 1;
}, 1300);

/* -------------------------
   Easter egg: triple click on photo
--------------------------*/
let clickCount = 0, clickTimer = null;
photoWrap.addEventListener('click', ()=>{
  clickCount++;
  if(clickTimer) clearTimeout(clickTimer);
  clickTimer = setTimeout(()=> { clickCount = 0; }, 1200);

  if(clickCount >= 3){
    triggerEasterEgg();
    clickCount = 0;
    clearTimeout(clickTimer);
  }
});
function triggerEasterEgg(){
  // burst hearts around photo and show a special message
  for(let i=0;i<28;i++){
    const el = document.createElement('div');
    el.textContent = '💗';
    el.style.position='fixed';
    const r = photoWrap.getBoundingClientRect();
    el.style.left = `${r.left + r.width/2}px`;
    el.style.top = `${r.top + r.height/2}px`;
    el.style.fontSize = `${10 + Math.random()*30}px`;
    el.style.zIndex = 30;
    document.body.appendChild(el);
    const angle = Math.random()*Math.PI*2;
    const dist = 40 + Math.random()*220;
    el.animate([
      { transform: 'translate(0,0) scale(1)', opacity:1 },
      { transform: `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px) scale(0.8)`, opacity:0 }
    ], { duration: 900 + Math.random()*700, easing:'cubic-bezier(.2,.9,.2,1)'});
    setTimeout(()=> el.remove(), 1800);
  }
  // special message bubble
  const special = document.createElement('div');
  special.className = 'message';
  special.textContent = "Aku mencintaimu lebih dari yang bisa aku tulis...";
  bubbleRoot.appendChild(special);
  requestAnimationFrame(()=>{ special.style.opacity=1; special.style.transform='translateY(0)'; });
  setTimeout(()=> {
    special.style.opacity = 0; special.style.transform='translateY(-8px)';
    setTimeout(()=> special.remove(), 700);
  }, 5200);
}

/* -------------------------
   Auto-trigger at exact local midnight of target date
   We'll poll every 900ms to detect exact 00:00:00 local time at target
--------------------------*/
function pollAutoTrigger(){
  const now = new Date();
  if (now >= target && !window._celebrationFired){
    startCelebration();
    window._celebrationFired = true;
  }
}
setInterval(pollAutoTrigger, 900);

/* -------------------------
   Small initialization touches
--------------------------*/
// subtle floating of photo aura
let auraDir = 1;
setInterval(()=>{
  const s = 1 + Math.sin(Date.now()/2400)/40;
  photoAura.style.transform = `scale(${s})`;
}, 80);

document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState === 'visible'){
    // resume canvas size
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W; canvas.height = H;
  }
});

/* Ensure the fx canvas has correct devicePixelRatio */
function fixHiDPI(){
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
fixHiDPI();
window.addEventListener('resize', fixHiDPI);

/* Accessibility: keyboard to trigger celebrate */
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') startCelebration();
});

/* End of file */
