(function(RQ){
"use strict";

let ctx = null;
let enabled = false;
try { enabled = localStorage.getItem("rq2-sfx") === "1"; } catch(e){}

function ensureCtx(){
  if(!enabled) return null;
  if(!ctx){
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    ctx = new AC();
  }
  if(ctx.state === "suspended") ctx.resume().catch(()=>{});
  return ctx;
}

function tone(freq, dur, type, vol, delay, endFreq){
  const c = ensureCtx();
  if(!c) return;
  const now = c.currentTime + (delay || 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type || "triangle";
  osc.frequency.setValueAtTime(freq, now);
  if(endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(vol || 0.06, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

let lastStep = 0;

RQ.Audio = {
  isEnabled(){ return enabled; },
  set(on){
    enabled = !!on;
    try { localStorage.setItem("rq2-sfx", enabled ? "1" : "0"); } catch(e){}
    if(enabled) this.open();
    return enabled;
  },
  toggle(){ return this.set(!enabled); },

  step(running){
    if(!enabled) return;
    const now = performance.now();
    if(now - lastStep < (running ? 160 : 240)) return;
    lastStep = now;
    tone(running ? 170 : 135, 0.045, "triangle", 0.025, 0, 90);
  },
  open(){
    tone(440, 0.07, "square", 0.03, 0);
    tone(587.33, 0.09, "square", 0.03, 0.06);
  },
  close(){
    tone(440, 0.06, "triangle", 0.03, 0);
    tone(329.63, 0.08, "triangle", 0.025, 0.05);
  },
  discover(){
    tone(523.25, 0.09, "square", 0.035, 0);
    tone(659.25, 0.09, "square", 0.035, 0.08);
    tone(783.99, 0.16, "triangle", 0.045, 0.16);
  },
  cat(id){
    if(id === "pirulina"){
      tone(660, 0.12, "triangle", 0.055, 0, 880);
      tone(880, 0.18, "sine", 0.045, 0.11, 560);
    } else {
      tone(520, 0.11, "triangle", 0.055, 0, 720);
      tone(720, 0.17, "sine", 0.045, 0.10, 440);
    }
  },
  achievement(){
    tone(523.25, 0.09, "square", 0.035, 0);
    tone(659.25, 0.09, "square", 0.035, 0.09);
    tone(783.99, 0.09, "square", 0.035, 0.18);
    tone(1046.5, 0.28, "triangle", 0.055, 0.27);
  },
  teleport(){
    tone(280, 0.14, "sine", 0.04, 0, 860);
    tone(620, 0.10, "triangle", 0.03, 0.09, 1080);
  },
  firework(){
    tone(240, 0.16, "sawtooth", 0.02, 0, 740);
    tone(980, 0.09, "triangle", 0.035, 0.17, 320);
    tone(1240, 0.12, "sine", 0.025, 0.21, 520);
  },
  key(){
    tone(760 + Math.random()*140, 0.025, "square", 0.015, 0);
  },
  error(){
    tone(190, 0.10, "sawtooth", 0.03, 0, 140);
    tone(140, 0.12, "sawtooth", 0.025, 0.09, 110);
  },
  coin(){
    tone(987.77, 0.07, "square", 0.035, 0);
    tone(1318.5, 0.14, "square", 0.04, 0.06);
    tone(360, 0.10, "sine", 0.03, 0.18, 620);
  },
  bug(){
    tone(587.33, 0.06, "square", 0.035, 0);
    tone(783.99, 0.06, "square", 0.035, 0.05);
    tone(1174.66, 0.14, "triangle", 0.045, 0.10);
  },
  quack(){
    tone(420, 0.08, "sawtooth", 0.035, 0, 310);
    tone(440, 0.09, "sawtooth", 0.03, 0.11, 290);
  },
  paper(){
    tone(420, 0.18, "sine", 0.035, 0, 960);
    tone(720, 0.14, "triangle", 0.025, 0.12, 1220);
  },
  snack(){
    tone(520, 0.05, "triangle", 0.04, 0, 620);
    tone(660, 0.06, "triangle", 0.04, 0.07, 780);
    tone(880, 0.11, "sine", 0.035, 0.14, 720);
  },
  bark(){
    tone(360, 0.06, "square", 0.035, 0, 230);
    tone(430, 0.06, "square", 0.035, 0.08, 280);
    tone(510, 0.08, "triangle", 0.045, 0.16, 320);
  }
};
})(window.RQ = window.RQ || {});
