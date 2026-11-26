(function(RQ){
"use strict";

const D = RQ.DATA;
const {
  T, W, H, PLACES, VISITABLE, CATS_DATA, YARD, CERBERUS_DATA, INFRA_PATROL, ICONS, ACHIEVEMENTS,
  AVATAR_SKINS, BUGS_DATA, WISHES, PROPS, FOUNTAIN, POND,
  doorOf, hits, esc
} = D;

const $ = id => document.getElementById(id);

const els = {
  canvas: $("world"),
  minimap: $("minimap"),
  miniWrap: $("miniWrap"),
  btnMiniToggle: $("btnMiniToggle"),
  count: $("count"),
  cats: $("cats"),
  achBadge: $("achBadge"),
  btnStats: $("btnStats"),
  btnRain: $("btnRain"),
  btnTime: $("btnTime"),
  btnSfx: $("btnSfx"),
  btnCV: $("btnCV"),
  btnTerm: $("btnTerm"),
  btnList: $("btnList"),
  prompt: $("prompt"),
  toast: $("toast"),
  intro: $("intro"),
  btnStart: $("btnStart"),
  btnIntroList: $("btnIntroList"),
  btnIntroCV: $("btnIntroCV"),
  dlg: $("dlg"),
  dlgBox: $("dlgBox"),
  list: $("list"),
  listFilters: $("listFilters"),
  listMeta: $("listMeta"),
  groups: $("groups"),
  btnListClose: $("btnListClose"),
  cv: $("cv"),
  cvBox: $("cvBox"),
  ach: $("ach"),
  achBox: $("achBox"),
  term: $("term"),
  termOut: $("termOut"),
  termForm: $("termForm"),
  termIn: $("termIn"),
  btnTermClose: $("btnTermClose"),
  lightbox: $("lightbox"),
  lbImg: $("lbImg"),
  lbCap: $("lbCap"),
  btnLbClose: $("btnLbClose"),
  printCV: $("printCV")
};

const ctx = els.canvas.getContext("2d");
const RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const COARSE = window.matchMedia && matchMedia("(pointer: coarse)").matches;

function loadSet(key, valid){
  try {
    const s = JSON.parse(localStorage.getItem(key) || "[]");
    if(Array.isArray(s)) return new Set(s.filter(valid));
  } catch(e){}
  return new Set();
}

function loadFlags(){
  try {
    const o = JSON.parse(localStorage.getItem("rq2-flags") || "{}");
    if(o && typeof o === "object") return o;
  } catch(e){}
  return {};
}

let savedTimePref = "auto";
try {
  const t = localStorage.getItem("rq2-time-pref");
  if(["auto","day","sunset","night"].includes(t)) savedTimePref = t;
} catch(e){}

function resolveTimeFromClock(pref){
  if(pref && pref !== "auto") return pref;
  const h = new Date().getHours();
  if(h >= 6 && h < 17) return "day";
  if(h >= 17 && h < 19) return "sunset";
  return "night";
}

let savedSkin = "normal";
try {
  const sk = localStorage.getItem("rq2-skin");
  if(AVATAR_SKINS.some(s => s.id === sk)) savedSkin = sk;
} catch(e){}

const state = {
  dpr: 1, S: 3, offX: 0, offY: 0, camX: 0, camY: 0,
  RM, COARSE,
  timePref: savedTimePref,
  timeMode: resolveTimeFromClock(savedTimePref),
  skin: savedSkin,
  weather: "clear",
  followingCat: null,
  player: {x: 26*T, y: 20*T + 4, dir: "down", moving: false, running: false, anim: 0},
  cats: CATS_DATA.map(c => Object.assign({}, c, {dir: 1, state: "sit", timer: 1 + Math.random()*2, tx: c.x, ty: c.y, anim: 0, kind: "cat", homeX: c.x, homeY: c.y, heartTimer: 0})),
  cerberus: Object.assign({}, CERBERUS_DATA, {dir: 1, state: "sit", timer: 1.5, tx: CERBERUS_DATA.x, ty: CERBERUS_DATA.y, anim: 0, kind: "cerberus", homeX: CERBERUS_DATA.x, homeY: CERBERUS_DATA.y, heartTimer: 0}),
  visited: loadSet("rq2-visited", id => VISITABLE.some(p => p.id === id)),
  petted: loadSet("rq2-cats", id => CATS_DATA.some(c => c.id === id)),
  caughtBugs: loadSet("rq2-bugs", id => BUGS_DATA.some(b => b.id === id)),
  achievements: loadSet("rq2-ach", id => ACHIEVEMENTS.some(a => a.id === id)),
  flags: loadFlags(),
  path: [],
  pending: null,
  hovered: null,
  near: null
};

const keys = new Set();
let dustTimer = 0;
let stuck = 0;
let wishIdx = Math.floor(Math.random() * WISHES.length);

function save(){
  try {
    localStorage.setItem("rq2-visited", JSON.stringify([...state.visited]));
    localStorage.setItem("rq2-cats", JSON.stringify([...state.petted]));
    localStorage.setItem("rq2-bugs", JSON.stringify([...state.caughtBugs]));
    localStorage.setItem("rq2-ach", JSON.stringify([...state.achievements]));
    localStorage.setItem("rq2-flags", JSON.stringify(state.flags));
    localStorage.setItem("rq2-skin", state.skin);
  } catch(e){}
}

function updateCount(){
  els.count.textContent = state.visited.size + "/" + VISITABLE.length;
  els.cats.textContent = state.petted.size + "/" + CATS_DATA.length;
  els.achBadge.textContent = state.achievements.size + "/" + ACHIEVEMENTS.length;
}

function anyOverlay(){
  return !els.intro.hidden || !els.dlg.hidden || !els.list.hidden || !els.term.hidden || !els.cv.hidden || !els.ach.hidden || !els.lightbox.hidden;
}

function setHash(id){
  if(!id){
    if(location.hash) history.replaceState(null, "", location.pathname + location.search);
    return;
  }
  const next = "#" + id;
  if(location.hash !== next) history.replaceState(null, "", next);
}

function showOverlay(el, focusSel){
  el.hidden = false;
  keys.clear();
  renderPrompt();
  const f = focusSel ? el.querySelector(focusSel) : el.querySelector("button, a");
  if(f) setTimeout(() => f.focus(), 0);
}

function hideOverlay(el){
  if(el.hidden) return;
  el.hidden = true;
  RQ.Audio.close();
  if(!anyOverlay()){
    setHash("");
    els.canvas.focus({preventScroll: true});
  }
  renderPrompt();
}

function setTimeMode(pref){
  state.timePref = ["auto","day","sunset","night"].includes(pref) ? pref : "auto";
  state.timeMode = resolveTimeFromClock(state.timePref);
  try { localStorage.setItem("rq2-time-pref", state.timePref); } catch(e){}
  const ico = state.timeMode === "day" ? ICONS.sun : state.timeMode === "sunset" ? ICONS.sunset : ICONS.moon;
  const phaseLabel = state.timeMode === "day" ? "Día" : state.timeMode === "sunset" ? "Tarde" : "Noche";
  const btnText = state.timePref === "auto" ? "Auto" : phaseLabel;
  els.btnTime.innerHTML = ico + "<span>" + btnText + "</span>";
  els.btnTime.title = "Hora actual: " + phaseLabel + (state.timePref === "auto" ? " (automático según tu reloj)" : " (manual)") + ". Clic para cambiar.";
}

function setAudio(on){
  const active = RQ.Audio.set(on);
  els.btnSfx.innerHTML = (active ? ICONS.sfxOn : ICONS.sfxOff) + "<span>" + (active ? "ON" : "OFF") + "</span>";
  els.btnSfx.setAttribute("aria-pressed", active ? "true" : "false");
  els.btnSfx.classList.toggle("is-on", active);
}

function toggleMinimap(force){
  const isHidden = els.miniWrap.classList.contains("collapsed");
  const nextOpen = typeof force === "boolean" ? force : isHidden;
  els.miniWrap.classList.toggle("collapsed", !nextOpen);
  els.btnMiniToggle.textContent = nextOpen ? "Mapa [M]" : "Mapa +";
  els.btnMiniToggle.setAttribute("aria-expanded", nextOpen ? "true" : "false");
}

function syncRainBtn(){
  const unlocked = state.caughtBugs.size >= BUGS_DATA.length || state.weather === "rain";
  els.btnRain.hidden = !unlocked;
  const on = state.weather === "rain";
  els.btnRain.innerHTML = ICONS.rain + "<span>" + (on ? "Lluvia" : "Seco") + "</span>";
  els.btnRain.setAttribute("aria-pressed", on ? "true" : "false");
  els.btnRain.classList.toggle("is-on", on);
}

function setWeather(mode){
  state.weather = mode === "rain" ? "rain" : "clear";
  syncRainBtn();
  RQ.Audio.key();
}

function setSkin(skinId){
  if(!AVATAR_SKINS.some(s => s.id === skinId)) return;
  state.skin = skinId;
  save();
  RQ.World.spawnWarp(state.player.x, state.player.y);
  RQ.Audio.discover();
}

function setFollowingCat(catId){
  if(state.followingCat && state.followingCat !== catId){
    if(state.followingCat === state.cerberus.id){
      state.cerberus.x = state.cerberus.homeX;
      state.cerberus.y = state.cerberus.homeY;
      state.cerberus.state = "sit";
      state.cerberus.timer = 2;
    } else {
      const prev = state.cats.find(c => c.id === state.followingCat);
      if(prev){ prev.x = prev.homeX; prev.y = prev.homeY; prev.state = "sit"; prev.timer = 2; }
    }
  }
  state.followingCat = catId || null;
  if(catId === state.cerberus.id){
    RQ.World.spawnCyberHearts(state.cerberus.x, state.cerberus.y);
    RQ.Audio.bark();
    ui.showNotice(ICONS.bolt, "Patrulla activa", "Mini Cerberus te escolta", "Sus tres cabezas te acompañan por todo el pueblo.", 3400);
  } else if(catId){
    const c = state.cats.find(x => x.id === catId);
    if(c){
      RQ.World.spawnHeart(c.x, c.y);
      RQ.Audio.snack();
      ui.showNotice(ICONS.paw, "Snack aceptado", c.name + " te acompaña", "Ahora caminará contigo por todo el pueblo.", 3200);
    }
    markFlag("catWalk");
  } else {
    RQ.Audio.close();
  }
}

function teleport(p){
  const d = (p.kind === "cat" || p.kind === "cerberus") ? {x: p.x, y: p.y + 10} : doorOf(p);
  state.player.x = d.x;
  state.player.y = d.y;
  state.player.dir = "up";
  state.path = [];
  state.pending = null;
  if(state.followingCat){
    const fc = state.followingCat === state.cerberus.id ? state.cerberus : state.cats.find(c => c.id === state.followingCat);
    if(fc){ fc.x = d.x - 14; fc.y = d.y + 2; fc.state = "sit"; }
  }
  RQ.World.spawnWarp(d.x, d.y);
  RQ.Audio.teleport();
}

function walkTo(dest, pendingTarget){
  const d = Math.hypot(dest.x - state.player.x, dest.y - state.player.y);
  if(pendingTarget && d < 16){
    state.path = [];
    state.pending = null;
    interact(pendingTarget);
    return;
  }
  const route = RQ.Path.findPath(state.player.x, state.player.y, dest.x, dest.y);
  state.path = route.length ? route : [dest];
  state.pending = pendingTarget || null;
  stuck = 0;
}

function checkAchievements(){
  let unlockedAny = false;
  ACHIEVEMENTS.forEach(a => {
    if(state.achievements.has(a.id)) return;
    if(a.check(state)){
      state.achievements.add(a.id);
      unlockedAny = true;
      ui.showToast(a);
      RQ.Audio.achievement();
      if(a.id === "town-legend"){
        RQ.World.triggerCelebration(state.player);
      }
    }
  });
  if(unlockedAny){
    save();
    updateCount();
  }
}

function markFlag(name){
  if(!state.flags[name]){
    state.flags[name] = true;
    save();
    checkAchievements();
  }
}

const app = {
  state, save, updateCount, showOverlay, hideOverlay, setHash,
  setTimeMode, setAudio, setSkin, setWeather, setFollowingCat,
  teleport, walkTo, checkAchievements, markFlag,
  openPlace: b => ui.openPlace(b),
  openCV: () => ui.openCV()
};

const ui = RQ.createUI(app, els);
const term = RQ.createTerminal(app, els);

function catchBug(b){
  if(state.caughtBugs.has(b.id)) return;
  state.caughtBugs.add(b.id);
  save();
  RQ.World.spawnBugCatch(b.x, b.y);
  RQ.Audio.bug();
  const n = state.caughtBugs.size;
  ui.showNotice(ICONS.bug, "Bug atrapado (" + n + "/" + BUGS_DATA.length + ")", b.name, b.note, 4200);
  syncRainBtn();
  checkAchievements();
  if(n >= BUGS_DATA.length){
    RQ.World.triggerCelebration(state.player);
  }
}

function interactProp(p){
  if(p.prop === "board"){ ui.openBoard(); return; }
  if(p.prop === "mailbox"){ ui.openMailbox(); return; }
  if(p.prop === "bowl"){ ui.openBowl(); return; }
  if(p.prop === "fountain"){
    const fx = (FOUNTAIN.x + FOUNTAIN.w / 2) * T, fy = (FOUNTAIN.y + FOUNTAIN.h / 2) * T;
    RQ.World.spawnCoin(state.player.x, state.player.y, fx, fy);
    RQ.Audio.coin();
    const w = WISHES[wishIdx % WISHES.length];
    wishIdx++;
    ui.showNotice(ICONS.star.replace("px-ico","px-ico lg"), "Fuente de los deseos", "Moneda al agua", w, 4800);
    return;
  }
  if(p.prop === "pond"){
    const px = (POND.x + POND.w / 2) * T, py = (POND.y + POND.h / 2) * T;
    RQ.World.spawnPondRipple(px, py);
    RQ.Audio.quack();
    ui.showNotice(ICONS.heart, "Estanque del patio", "¡Cuac! Miguitas recibidas", "El patito y los peces koi nadan felices hacia la orilla.", 3500);
  }
}

function interact(b){
  if(b.kind === "bug"){ catchBug(b); return; }
  if(b.kind === "prop"){ interactProp(b); return; }
  if(b.kind === "cerberus"){ ui.openCerberus(b); return; }
  if(b.kind === "cat"){ ui.openCat(b); return; }
  if(b.kind === "kiosk"){ term.open(); return; }
  ui.openPlace(b);
}

/* ---------- Geometry & Nearby ---------- */
function findNear(){
  for(const b of BUGS_DATA){
    if(!state.caughtBugs.has(b.id) && Math.hypot(state.player.x - b.x, state.player.y - b.y) < 18){
      return Object.assign({kind: "bug"}, b);
    }
  }
  if(state.cerberus && Math.hypot(state.player.x - state.cerberus.x, state.player.y - state.cerberus.y) < 22){
    return state.cerberus;
  }
  for(const c of state.cats){
    if(Math.hypot(state.player.x - c.x, state.player.y - c.y) < 20) return c;
  }
  for(const p of PROPS){
    const cx = (p.x + p.w/2)*T, cy = (p.y + p.h/2)*T;
    const rx = (p.w/2)*T + 14, ry = (p.h/2)*T + 16;
    if(Math.abs(state.player.x - cx) < rx && Math.abs(state.player.y - cy) < ry) return p;
  }
  for(const b of PLACES){
    const d = doorOf(b), by = (b.y + b.h) * T;
    const reach = (b.kind === "garage" || b.kind === "lot") ? 24 : 14;
    if(Math.abs(state.player.x - d.x) < reach && state.player.y > by && state.player.y < by + 20) return b;
  }
  return null;
}

function renderPrompt(){
  if(!state.near || anyOverlay()){ els.prompt.hidden = true; return; }
  const how = COARSE ? "Toca" : "<kbd>E</kbd>";
  if(state.near.kind === "bug"){
    els.prompt.innerHTML = how + " · Atrapar: " + esc(state.near.name);
    els.prompt.hidden = false;
    return;
  }
  if(state.near.kind === "prop"){
    els.prompt.innerHTML = how + " · " + esc(state.near.verb) + ": " + esc(state.near.label);
    els.prompt.hidden = false;
    return;
  }
  if(state.near.kind === "cerberus"){
    els.prompt.innerHTML = how + " · Saludar a " + esc(state.near.name);
    els.prompt.hidden = false;
    return;
  }
  const verb = state.near.kind === "cat" ? "Saludar a" : state.near.kind === "kiosk" ? "Usar" : state.near.kind === "lot" ? "Ver obra" : "Entrar";
  els.prompt.innerHTML = how + " · " + verb + (state.near.kind === "cat" ? " " : ": ") + esc(state.near.label || state.near.name);
  els.prompt.hidden = false;
}

/* ---------- Update ---------- */
function updateCerberus(dt){
  const g = state.cerberus;
  if(!g) return;
  if(state.followingCat === g.id){
    const offX = state.player.dir === "left" ? 18 : state.player.dir === "right" ? -18 : -14;
    const offY = state.player.dir === "up" ? 10 : state.player.dir === "down" ? -6 : 4;
    const gx = state.player.x + offX, gy = state.player.y + offY;
    const dx = gx - g.x, dy = gy - g.y, d = Math.hypot(dx, dy);
    if(d > 15){
      g.state = "walk";
      const sp = Math.min(118, 66 + d * 0.9) * dt;
      g.x += (dx / d) * sp;
      g.y += (dy / d) * sp;
      if(Math.abs(dx) > 0.5) g.dir = dx < 0 ? -1 : 1;
      g.anim += dt;
    } else {
      g.state = "sit";
    }
    g.heartTimer = (g.heartTimer || 0) - dt;
    if(g.heartTimer <= 0){
      g.heartTimer = 6 + Math.random() * 4;
      if(!RM) RQ.World.spawnCyberHearts(g.x, g.y);
    }
    return;
  }
  if(g.state === "sit"){
    g.timer -= dt;
    if(g.timer <= 0){
      g.state = "walk";
      g.tx = INFRA_PATROL.x + Math.random() * INFRA_PATROL.w;
      g.ty = INFRA_PATROL.y + Math.random() * INFRA_PATROL.h;
    }
  } else {
    const dx = g.tx - g.x, dy = g.ty - g.y, d = Math.hypot(dx, dy);
    if(d < 1.8){ g.state = "sit"; g.timer = 2.2 + Math.random() * 3.5; }
    else {
      const sp = 26 * dt;
      g.x += (dx / d) * sp;
      g.y += (dy / d) * sp;
      if(Math.abs(dx) > 0.5) g.dir = dx < 0 ? -1 : 1;
      g.anim += dt;
    }
  }
}
function updateCats(dt){
  state.cats.forEach(c => {
    if(state.followingCat === c.id){
      const offX = state.player.dir === "left" ? 16 : state.player.dir === "right" ? -16 : -12;
      const offY = state.player.dir === "up" ? 10 : state.player.dir === "down" ? -6 : 4;
      const gx = state.player.x + offX, gy = state.player.y + offY;
      const dx = gx - c.x, dy = gy - c.y, d = Math.hypot(dx, dy);
      if(d > 14){
        c.state = "walk";
        const sp = Math.min(115, 62 + d * 0.9) * dt;
        c.x += (dx / d) * sp;
        c.y += (dy / d) * sp;
        if(Math.abs(dx) > 0.5) c.dir = dx < 0 ? -1 : 1;
        c.anim += dt;
      } else {
        c.state = "sit";
      }
      c.heartTimer = (c.heartTimer || 0) - dt;
      if(c.heartTimer <= 0){
        c.heartTimer = 5.5 + Math.random() * 4;
        if(!RM) RQ.World.spawnHeart(c.x, c.y);
      }
      return;
    }
    if(c.state === "sit"){
      c.timer -= dt;
      if(c.timer <= 0){
        c.state = "walk";
        c.tx = YARD.x + 8 + Math.random() * (YARD.w - 16);
        c.ty = YARD.y + 10 + Math.random() * (YARD.h - 16);
      }
    } else {
      const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
      if(d < 1.5){ c.state = "sit"; c.timer = 2 + Math.random() * 4; }
      else {
        const sp = 20 * dt;
        c.x += (dx / d) * sp;
        c.y += (dy / d) * sp;
        if(Math.abs(dx) > 0.5) c.dir = dx < 0 ? -1 : 1;
        c.anim += dt;
      }
    }
  });
}

function update(dt){
  if(!RM){ updateCats(dt); updateCerberus(dt); }
  RQ.World.updateParticles(dt, state);
  if(anyOverlay()){ state.player.moving = false; state.player.running = false; return; }

  let ix = 0, iy = 0;
  if(keys.has("ArrowLeft") || keys.has("a")) ix -= 1;
  if(keys.has("ArrowRight") || keys.has("d")) ix += 1;
  if(keys.has("ArrowUp") || keys.has("w")) iy -= 1;
  if(keys.has("ArrowDown") || keys.has("s")) iy += 1;
  const sprinting = keys.has("Shift");

  if(ix || iy){
    state.path = [];
    state.pending = null;
  } else if(state.path.length){
    // If chasing a moving cat or Mini Cerberus, keep final waypoint synced
    const isMovingMob = state.pending && (state.pending.kind === "cat" || state.pending.kind === "cerberus");
    if(isMovingMob && state.path.length === 1){
      state.path[0] = {x: state.pending.x, y: state.pending.y + 6};
    }
    const wp = state.path[0];
    const dx = wp.x - state.player.x, dy = wp.y - state.player.y, dist = Math.hypot(dx, dy);
    const isLast = state.path.length === 1;
    const arrive = (isLast && isMovingMob) ? 16 : (isLast ? 2.5 : 4.5);
    if(dist < arrive){
      state.path.shift();
      if(!state.path.length && state.pending){
        const p = state.pending;
        state.pending = null;
        interact(p);
      }
    } else {
      ix = dx / dist;
      iy = dy / dist;
    }
  }

  const len = Math.hypot(ix, iy);
  state.player.moving = len > 0;
  state.player.running = len > 0 && sprinting;

  if(len > 0){
    const sp = (sprinting ? 122 : 78) * dt;
    const mx = (ix / len) * sp, my = (iy / len) * sp;
    const bx = state.player.x, by = state.player.y;
    if(!hits(state.player.x + mx, state.player.y)) state.player.x += mx;
    if(!hits(state.player.x, state.player.y + my)) state.player.y += my;
    if(Math.abs(ix) > Math.abs(iy)) state.player.dir = ix < 0 ? "left" : "right";
    else state.player.dir = iy < 0 ? "up" : "down";
    state.player.anim += dt;
    RQ.Audio.step(sprinting);

    if(sprinting && !RM){
      dustTimer -= dt;
      if(dustTimer <= 0){
        dustTimer = 0.12;
        RQ.World.spawnDust(state.player.x, state.player.y);
      }
    }

    if(state.path.length){
      if(Math.hypot(state.player.x - bx, state.player.y - by) < sp * 0.15) stuck++;
      else stuck = 0;
      if(stuck > 18){
        stuck = 0;
        state.path = [];
        if(state.pending){
          const n = findNear();
          if(n && n.id === state.pending.id) interact(state.pending);
          state.pending = null;
        }
      }
    }
  }

  const n = findNear();
  if(n !== state.near){ state.near = n; renderPrompt(); }
}

/* ---------- Camera & Resize ---------- */
function resize(){
  state.dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cw = els.canvas.clientWidth, ch = els.canvas.clientHeight;
  els.canvas.width = Math.max(1, Math.round(cw * state.dpr));
  els.canvas.height = Math.max(1, Math.round(ch * state.dpr));
  const across = cw < 600 ? 12 : cw < 1100 ? 18 : 24;
  state.S = Math.max(1, Math.round(els.canvas.width / (T * across)));
  state.S = Math.max(1, Math.min(state.S, Math.floor(els.canvas.height / (T * 9))));
}
window.addEventListener("resize", resize);

function updateCamera(){
  const vw = els.canvas.width / state.S, vh = els.canvas.height / state.S;
  if(vw >= W * T){ state.camX = 0; state.offX = Math.round((els.canvas.width - W * T * state.S) / 2); }
  else { state.offX = 0; state.camX = Math.max(0, Math.min(W * T - vw, state.player.x - vw / 2)); }
  if(vh >= H * T){ state.camY = 0; state.offY = Math.round((els.canvas.height - H * T * state.S) / 2); }
  else { state.offY = 0; state.camY = Math.max(0, Math.min(H * T - vh, state.player.y - 8 - vh / 2)); }
  state.camX = Math.round(state.camX * state.S) / state.S;
  state.camY = Math.round(state.camY * state.S) / state.S;
}

/* ---------- Screen-to-world helper ---------- */
function hitEntityAt(wx, wy){
  for(const b of BUGS_DATA){
    if(!state.caughtBugs.has(b.id) && Math.hypot(wx - b.x, wy - b.y) < 12){
      return Object.assign({kind: "bug"}, b);
    }
  }
  if(state.cerberus && Math.abs(wx - state.cerberus.x) < 15 && wy > state.cerberus.y - 26 && wy < state.cerberus.y + 5){
    return state.cerberus;
  }
  const cat = state.cats.find(c => Math.abs(wx - c.x) < 11 && wy > c.y - 15 && wy < c.y + 5);
  if(cat) return cat;
  const prop = PROPS.find(p => wx >= p.x*T - 2 && wx < (p.x + p.w)*T + 2 && wy >= p.y*T - 8 && wy < (p.y + p.h)*T + 4);
  if(prop) return prop;
  return PLACES.find(p => wx >= p.x*T && wx < (p.x + p.w)*T && wy >= p.y*T - 14 && wy < (p.y + p.h)*T + 8) || null;
}

/* ---------- Input ---------- */
const GAME_KEYS = new Set(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","a","d","w","s","Shift"]);

window.addEventListener("keydown", e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if(e.key === "Escape"){
    if(!els.lightbox.hidden){ ui.closeLightbox(); return; }
    if(!els.term.hidden) hideOverlay(els.term);
    else if(!els.dlg.hidden) hideOverlay(els.dlg);
    else if(!els.list.hidden) hideOverlay(els.list);
    else if(!els.cv.hidden) hideOverlay(els.cv);
    else if(!els.ach.hidden) hideOverlay(els.ach);
    else if(!els.intro.hidden) hideOverlay(els.intro);
    return;
  }
  if(anyOverlay()) return;
  if(e.target && e.target.tagName === "INPUT") return;
  if(k === "`" || k === "º" || k === "|"){ e.preventDefault(); term.open(); return; }
  if(k === "m"){ e.preventDefault(); toggleMinimap(); return; }
  if(GAME_KEYS.has(k)){ keys.add(k); if(k !== "Shift") e.preventDefault(); return; }
  const tag = document.activeElement ? document.activeElement.tagName : "";
  if((k === "e" || k === " " || k === "Enter") && !["BUTTON","A","INPUT"].includes(tag)){
    if(state.near){ e.preventDefault(); interact(state.near); }
  }
});

window.addEventListener("keyup", e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keys.delete(k);
});
window.addEventListener("blur", () => keys.clear());

els.canvas.addEventListener("pointermove", e => {
  if(anyOverlay() || COARSE){ state.hovered = null; return; }
  const rect = els.canvas.getBoundingClientRect();
  const wx = ((e.clientX - rect.left) * state.dpr - state.offX) / state.S + state.camX;
  const wy = ((e.clientY - rect.top) * state.dpr - state.offY) / state.S + state.camY;
  state.hovered = hitEntityAt(wx, wy);
  els.canvas.style.cursor = state.hovered ? "pointer" : "crosshair";
});

els.canvas.addEventListener("pointerleave", () => { state.hovered = null; });

els.canvas.addEventListener("pointerdown", e => {
  if(anyOverlay()) return;
  els.canvas.focus({preventScroll: true});
  const rect = els.canvas.getBoundingClientRect();
  const wx = ((e.clientX - rect.left) * state.dpr - state.offX) / state.S + state.camX;
  const wy = ((e.clientY - rect.top) * state.dpr - state.offY) / state.S + state.camY;
  const ent = hitEntityAt(wx, wy);
  if(ent && ent.kind === "bug"){
    walkTo({x: ent.x, y: ent.y + 4}, ent);
    return;
  }
  if(ent && (ent.kind === "cat" || ent.kind === "cerberus")){
    walkTo({x: ent.x, y: ent.y + 6}, ent);
    return;
  }
  if(ent){
    walkTo(doorOf(ent), ent);
    return;
  }
  walkTo({x: wx, y: wy}, null);
});

els.minimap.addEventListener("pointerdown", e => {
  if(anyOverlay()) return;
  const rect = els.minimap.getBoundingClientRect();
  const wx = ((e.clientX - rect.left) / rect.width) * (W * T);
  const wy = ((e.clientY - rect.top) / rect.height) * (H * T);
  const ent = hitEntityAt(wx, wy);
  if(ent && ent.kind !== "cat" && ent.kind !== "bug" && ent.kind !== "cerberus"){
    if(e.shiftKey){ teleport(ent); interact(ent); }
    else walkTo(doorOf(ent), ent);
  } else if(ent && (ent.kind === "cat" || ent.kind === "cerberus")){
    walkTo({x: ent.x, y: ent.y + 6}, ent);
  } else {
    walkTo({x: wx, y: wy}, null);
  }
});

/* ---------- Buttons & Overlay Backdrop ---------- */
els.btnStart.addEventListener("click", () => hideOverlay(els.intro));
els.btnIntroList.addEventListener("click", () => { els.intro.hidden = true; ui.openList(); });
els.btnIntroCV.addEventListener("click", () => { els.intro.hidden = true; ui.openCV(); });
els.btnList.addEventListener("click", () => ui.openList());
els.btnListClose.addEventListener("click", () => hideOverlay(els.list));
els.btnCV.addEventListener("click", () => ui.openCV());
els.btnTerm.addEventListener("click", () => term.open());
els.btnTermClose.addEventListener("click", () => hideOverlay(els.term));
els.btnStats.addEventListener("click", () => ui.openAchievements());
els.btnRain.addEventListener("click", () => setWeather(state.weather === "rain" ? "clear" : "rain"));
els.btnTime.addEventListener("click", () => {
  const order = ["auto","day","sunset","night"];
  const next = order[(order.indexOf(state.timePref) + 1) % order.length];
  setTimeMode(next);
  RQ.Audio.key();
});
els.btnSfx.addEventListener("click", () => setAudio(!RQ.Audio.isEnabled()));
els.btnMiniToggle.addEventListener("click", () => toggleMinimap());

[els.dlg, els.list, els.term, els.cv, els.ach].forEach(o => {
  o.addEventListener("pointerdown", e => { if(e.target === o) hideOverlay(o); });
});

/* ---------- Deep-linking via #hash ---------- */
function syncFromHash(){
  const h = (location.hash || "").replace(/^#/, "").trim().toLowerCase();
  if(!h) return;
  [els.intro, els.dlg, els.list, els.term, els.cv, els.ach].forEach(o => { o.hidden = true; });
  if(h === "terminal"){ term.open(); return; }
  if(h === "cv"){ ui.openCV(); return; }
  if(h === "logros" || h === "achievements"){ ui.openAchievements(); return; }
  if(h === "tablon" || h === "board"){ ui.openBoard(); return; }
  if(h === "buzon" || h === "mailbox" || h === "contacto"){ ui.openMailbox(); return; }
  if(h === "mini-cerberus" || h === "cerberus-pup"){ teleport(state.cerberus); ui.openCerberus(state.cerberus); return; }
  const cat = state.cats.find(c => c.id === h);
  if(cat){ teleport(cat); ui.openCat(cat); return; }
  const place = VISITABLE.find(p => p.id === h);
  if(place){ teleport(place); ui.openPlace(place); return; }
}
window.addEventListener("hashchange", syncFromHash);

/* ---------- Init & Loop ---------- */
updateCount();
setTimeMode(state.timePref);
syncRainBtn();
setInterval(() => { if(state.timePref === "auto") setTimeMode("auto"); }, 60000);
setAudio(RQ.Audio.isEnabled());
toggleMinimap(window.innerWidth > 680);
resize();
syncFromHash();

let last = performance.now();
function loop(t){
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  update(dt);
  updateCamera();
  RQ.World.render(ctx, els.canvas, state, t);
  RQ.World.renderMinimap(els.minimap, state, t);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
})(window.RQ = window.RQ || {});
