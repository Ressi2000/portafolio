(function(RQ){
"use strict";

const D = RQ.DATA;
const {
  T, W, H, ZONES, PLACES, VISITABLE, YARD, BUGS_DATA, PROPS,
  PLAZA, CROSS, GRAVEL, DIRT, FOUNTAIN, POND, TREES, LAMPS, ZONE_SIGNS,
  inRect, isPath
} = D;

function rng(seed){
  return function(){
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------- Static world prerender ---------- */
const worldCanvas = document.createElement("canvas");
worldCanvas.width = W * T;
worldCanvas.height = H * T;

const miniBase = document.createElement("canvas");
miniBase.width = W * 2;
miniBase.height = H * 2;

const lightCanvas = document.createElement("canvas");
lightCanvas.width = (W * T) >> 1;
lightCanvas.height = (H * T) >> 1;
const lctx = lightCanvas.getContext("2d");

const windowLights = [];

(function prerender(){
  const g = worldCanvas.getContext("2d");
  const mg = miniBase.getContext("2d");
  const r = rng(11);
  const R = (x,y,w,h,c) => { g.fillStyle = c; g.fillRect(x,y,w,h); };
  const paved = (tx,ty) => isPath(tx,ty) || inRect(PLAZA,tx,ty) || inRect(CROSS,tx,ty);

  for(let ty = 0; ty < H; ty++){
    for(let tx = 0; tx < W; tx++){
      const x = tx * T, y = ty * T;
      let mc = "#315b3a";
      if(inRect(PLAZA,tx,ty) || inRect(CROSS,tx,ty)){
        mc = "#887e6f";
        R(x,y,T,T,"#a59a88");
        R(x,y,T,1,"#8d8270"); R(x,y,1,T,"#8d8270");
        R(x+8,y,1,8,"#8d8270"); R(x,y+8,T,1,"#8d8270");
        if(r()<.4) R(x+2+((r()*12)|0), y+2+((r()*12)|0), 2,1,"#b9ae9b");
      } else if(isPath(tx,ty)){
        mc = "#a98758";
        R(x,y,T,T,"#c9a56f");
        for(let i=0;i<3;i++) R(x+((r()*14)|0), y+((r()*14)|0), 2,1,"#b38f5c");
        if(r()<.3) R(x+((r()*14)|0), y+((r()*14)|0), 1,1,"#dcbb86");
        if(!paved(tx,ty-1)) R(x,y,T,1,"#9c7a4c");
        if(!paved(tx,ty+1)) R(x,y+T-1,T,1,"#9c7a4c");
        if(!paved(tx-1,ty)) R(x,y,1,T,"#9c7a4c");
        if(!paved(tx+1,ty)) R(x+T-1,y,1,T,"#9c7a4c");
      } else if(inRect(GRAVEL,tx,ty)){
        mc = "#556158";
        R(x,y,T,T,"#6f7d72");
        for(let i=0;i<5;i++) R(x+((r()*15)|0), y+((r()*15)|0), 1,1, r()<.5?"#5d6a60":"#8a978c");
      } else if(inRect(DIRT,tx,ty)){
        mc = "#7e5e3d";
        R(x,y,T,T,"#9b7650");
        for(let i=0;i<4;i++) R(x+((r()*15)|0), y+((r()*15)|0), 2,1, r()<.5?"#87653f":"#ae8a62");
      } else {
        R(x,y,T,T,(tx+ty)%2 ? "#4a8a55" : "#4c8d57");
        for(let i=0;i<3;i++){ const c = r()<.5 ? "#3f7b4a" : "#5d9e68"; R(x+((r()*15)|0), y+((r()*14)|0), 1,2,c); }
        if(r()<.05){ const fc=["#ffd36b","#ff8aa6","#f4f1ff"][(r()*3)|0]; const fx=x+3+((r()*9)|0), fy=y+3+((r()*9)|0); R(fx,fy,2,2,fc); R(fx+2,fy+1,1,1,"#3f7b4a"); }
      }
      if(tx < 2 || tx >= W-2 || ty < 2 || ty >= H-2) mc = "#213f28";
      mg.fillStyle = mc;
      mg.fillRect(tx*2, ty*2, 2, 2);
    }
  }

  // Fountain
  {
    const fx=FOUNTAIN.x*T, fy=FOUNTAIN.y*T, fw=FOUNTAIN.w*T, fh=FOUNTAIN.h*T;
    R(fx+3,fy+fh-1,fw-2,4,"rgba(0,0,0,.2)");
    R(fx+4,fy,fw-8,fh,"#d8d0c0"); R(fx,fy+4,fw,fh-8,"#d8d0c0");
    R(fx+2,fy+2,fw-4,fh-4,"#d8d0c0");
    R(fx+6,fy+5,fw-12,fh-10,"#3f7fc4"); R(fx+5,fy+7,fw-10,fh-14,"#3f7fc4");
    R(fx+6,fy+5,fw-12,2,"#2f679f");
    R(fx+fw/2-5,fy+fh/2-6,10,12,"#c9c0ae"); R(fx+fw/2-3,fy+fh/2-14,6,10,"#e3dccd"); R(fx+fw/2-4,fy+fh/2-15,8,2,"#c9c0ae");
    R(fx+4,fy+fh-4,fw-8,1,"#b8ae9a");
    mg.fillStyle = "#4d8fd6";
    mg.fillRect(FOUNTAIN.x*2, FOUNTAIN.y*2, FOUNTAIN.w*2, FOUNTAIN.h*2);
  }

  // Pond in the yard
  {
    const px=POND.x*T, py=POND.y*T, pw=POND.w*T, ph=POND.h*T;
    R(px+2,py,pw-4,ph,"#d9c48f"); R(px,py+2,pw,ph-4,"#d9c48f");
    R(px+5,py+3,pw-10,ph-6,"#3b6fb3"); R(px+3,py+5,pw-6,ph-10,"#3b6fb3");
    R(px+5,py+3,pw-10,3,"#2f5d9c");
    R(px+14,py+24,6,1,"#6d9be0"); R(px+34,py+40,6,1,"#6d9be0");
    R(px+4,py+ph-14,1,8,"#3f7b4a"); R(px+6,py+ph-12,1,6,"#5d9e68"); R(px+5,py+ph-15,1,2,"#8a5a32");
    mg.fillStyle = "#3b6fb3";
    mg.fillRect(POND.x*2, POND.y*2, POND.w*2, POND.h*2);
  }

  // Yard fence
  for(let x=28*T+8; x<44*T; x+=8){ R(x,28*T-4,2,8,"#8a5a32"); }
  R(28*T+8,28*T-2,15*T,2,"#a86f3e");
  R(28*T+8,28*T+2,15*T,1,"#a86f3e");

  // Infra wires: tower to Cerberus and to bunker
  wire(31*T, 3*T-8, 35*T+8, 4*T+2);
  wire(31*T, 3*T-8, 43*T+8, 5*T+4);
  function wire(x1,y1,x2,y2){
    const n = Math.ceil(Math.abs(x2-x1));
    for(let i=0;i<=n;i++){
      const t = i/n;
      const x = x1 + (x2-x1)*t;
      const y = y1 + (y2-y1)*t + Math.sin(Math.PI*t)*10;
      R(Math.round(x), Math.round(y), 1, 1, "#2a2a36");
    }
  }

  // Trees
  const all = [];
  for(let tx=0; tx<W; tx++){ all.push([tx,0],[tx,1],[tx,H-2],[tx,H-1]); }
  for(let ty=2; ty<H-2; ty++){ all.push([0,ty],[1,ty],[W-2,ty],[W-1,ty]); }
  TREES.forEach(t => all.push(t));
  all.sort((a,b)=>a[1]-b[1]);
  all.forEach(([tx,ty])=>{
    const cx=tx*T+8, base=ty*T+16, v=r();
    R(cx-6,base-2,12,3,"rgba(0,0,0,.18)");
    R(cx-2,base-7,4,7,"#5a3b26"); R(cx-2,base-7,1,7,"#6e4a30");
    const dark = v<.5 ? "#2f6b3e" : "#2b6239", mid = v<.5 ? "#3d8550" : "#3a7d4b", lite="#58a467";
    R(cx-8,base-19,16,12,dark); R(cx-6,base-22,12,17,dark);
    R(cx-7,base-18,13,9,mid); R(cx-5,base-21,9,13,mid);
    R(cx-4,base-19,4,3,lite); R(cx-6,base-16,2,2,lite);
  });

  // Streetlamps (decorative poles; glow rendered dynamically)
  LAMPS.forEach(([tx,ty])=>{
    const cx = tx*T + 8, base = ty*T + 14;
    R(cx-3, base-1, 6, 2, "rgba(0,0,0,.22)");
    R(cx-2, base-3, 4, 3, "#3c3752");
    R(cx-1, base-15, 2, 12, "#4f496b");
    R(cx-3, base-16, 6, 1, "#3c3752");
    R(cx-2, base-20, 4, 4, "#f6d88b");
    R(cx-3, base-21, 6, 1, "#3c3752");
    R(cx-1, base-22, 2, 1, "#5c567d");
  });

  // Bulletin board at central crossroads (x:23, y:19, w:2, h:1)
  {
    const bx = 23*T + 2, by = 19*T - 4;
    R(bx+1, by+18, 26, 3, "rgba(0,0,0,.22)");
    R(bx+3, by+12, 3, 8, "#5a3b26"); R(bx+22, by+12, 3, 8, "#5a3b26");
    R(bx+1, by+2, 26, 12, "#6b4426");
    R(bx+3, by+4, 22, 8, "#c9a56f");
    // pinned colorful notes
    R(bx+4, by+5, 5, 5, "#f4efe6"); R(bx+6, by+4, 1, 1, "#e04856");
    R(bx+11, by+5, 6, 6, "#ffd88a"); R(bx+13, by+4, 1, 1, "#3b62b8");
    R(bx+19, by+6, 5, 5, "#9fe8ff"); R(bx+21, by+5, 1, 1, "#e04856");
    // little roof
    R(bx-1, by, 30, 3, "#8a4a4a"); R(bx, by-1, 28, 1, "#b36262");
    mg.fillStyle = "#f2b84b";
    mg.fillRect(23*2, 19*2, 4, 2);
  }

  // Cat snack bowl in yard (tile 34, 29)
  {
    const bx = 34*T + 4, by = 29*T + 5;
    R(bx, by+4, 8, 2, "rgba(0,0,0,.2)");
    R(bx, by+1, 8, 4, "#d94e5a");
    R(bx+1, by, 6, 2, "#8a5a32");
    R(bx+2, by, 1, 1, "#b5793f"); R(bx+5, by+1, 1, 1, "#b5793f");
  }

  // Wooden district signpost bases
  ZONE_SIGNS.forEach(z => {
    const sx = Math.round(z.x * T), sy = Math.round(z.y * T);
    R(sx - 6, sy + 5, 12, 2, "rgba(0,0,0,.22)");
    R(sx - 5, sy, 2, 6, "#4d311e"); R(sx - 4, sy, 1, 6, "#6e472d");
    R(sx + 3, sy, 2, 6, "#4d311e"); R(sx + 4, sy, 1, 6, "#6e472d");
  });

  PLACES.forEach(b => {
    drawBuilding(b);
    mg.fillStyle = ZONES[b.zone].mapColor || "#f2b84b";
    mg.fillRect(b.x*2, b.y*2, Math.max(2, b.w*2), Math.max(2, b.h*2));
  });

  function drawDoor(cx, bottom, c1, c2){
    R(cx-6,bottom-16,12,16,c2||"#3e2716");
    R(cx-5,bottom-15,10,15,c1||"#6b4426");
    R(cx-5,bottom-15,10,1,"#86572f");
    R(cx+2,bottom-8,1,2,"#f2b84b");
  }
  function windows(x,w,cx,winY,doorW,house){
    for(let wx=x+6; wx+10<=x+w-4; wx+=18){
      if(Math.abs((wx+5)-cx) < doorW/2+8) continue;
      R(wx,winY,10,10,"#3a2f4f"); R(wx+1,winY+1,8,8,"#f6e7a8"); R(wx+4,winY+1,1,8,"#3a2f4f"); R(wx+1,winY+4,8,1,"#3a2f4f"); R(wx+1,winY+1,2,2,"#fff6cf");
      windowLights.push({x:wx+5, y:winY+5, r:26, color:"rgba(255,214,120,0.22)"});
      if(house){ R(wx-1,winY+10,12,3,"#8a5a32"); R(wx,winY+9,2,2,"#ff8aa6"); R(wx+5,winY+9,2,2,"#ffd36b"); R(wx+8,winY+9,2,2,"#ff8aa6"); }
    }
  }
  function pitched(b,z){
    const x=b.x*T, y=b.y*T, w=b.w*T, h=b.h*T;
    const roofH = Math.round(h*0.42);
    R(x,y+roofH,w,h-roofH,z.wall);
    R(x,y+h-3,w,3,z.trim);
    R(x-2,y,w+4,roofH,z.roof);
    for(let xx=x; xx<x+w; xx+=4) R(xx,y+2,1,roofH-4,z.roofDark);
    R(x-2,y,w+4,2,z.roofLight);
    R(x-2,y+roofH-2,w+4,2,z.roofDark);
    return roofH;
  }

  function drawBuilding(b){
    const z = ZONES[b.zone];
    const x=b.x*T, y=b.y*T, w=b.w*T, h=b.h*T, cx=x+w/2;
    if(b.kind!=="lot") R(x+3,y+h-1,w,4,"rgba(0,0,0,.22)");

    if(b.kind==="kiosk"){
      R(x+4,y+6,w-8,h-6,"#3a3650"); R(x+4,y+h-3,w-8,3,"#2a2740");
      R(x+6,y+2,w-12,16,"#55507a"); R(x+8,y+4,w-16,12,"#1a140c");
      R(x+w/2-2,y+h-10,4,6,"#55507a");
      return;
    }

    if(b.kind==="lot"){
      R(x,y,w,h,"#8a6844");
      for(let i=0;i<14;i++) R(x+2+((r()*(w-6))|0), y+2+((r()*(h-6))|0), 3,2, r()<.5?"#76583a":"#a07c55");
      R(x+8,y+h-20,w-16,8,"#9c9aa6"); R(x+8,y+h-20,w-16,1,"#b8b6c2");
      const cols=[x+10,x+w/2-1,x+w-12];
      cols.forEach(c=>R(c,y+12,3,h-30,"#b0aebb"));
      R(x+10,y+12,w-20,3,"#b0aebb"); R(x+10,y+28,w-20,2,"#8e8c99");
      for(let yy=y+10; yy<y+h-16; yy+=8) R(x+4,yy,w-8,1,"#d9a441");
      R(x+4,y+10,1,h-26,"#d9a441"); R(x+w-5,y+10,1,h-26,"#d9a441");
      for(let xx=x; xx<x+w; xx+=8){ R(xx,y+h-4,4,2,"#f2c230"); R(xx+4,y+h-4,4,2,"#222"); }
      [[x+3,y+h-11],[x+w-9,y+h-11]].forEach(([cx2,cy2])=>{ R(cx2+2,cy2,2,2,"#ff7a2e"); R(cx2+1,cy2+2,4,2,"#f4f1ff"); R(cx2,cy2+4,6,3,"#ff7a2e"); R(cx2-1,cy2+7,8,1,"#c4561c"); });
      R(cx-9,y+h-14,18,9,"#f2c230"); R(cx-8,y+h-13,16,7,"#2b2216");
      R(cx-6,y+h-11,12,1,"#f2c230"); R(cx-6,y+h-8,8,1,"#f2c230");
      R(cx-1,y+h-5,2,5,"#6b4426");
      return;
    }

    if(b.kind==="tower"){
      R(x+4,y+10,w-8,h-10,z.wall);
      for(let yy=y+14; yy<y+h-4; yy+=8) R(x+4,yy,w-8,1,z.trim);
      R(x,y+6,w,6,z.roof); R(x,y+6,w,1,z.roofLight); R(x,y+11,w,1,z.roofDark);
      R(cx-1,y-10,2,16,"#55506e"); R(cx-5,y-4,10,1,"#55506e"); R(cx-3,y-8,6,1,"#55506e");
      for(let yy=y+16; yy<y+h-18; yy+=12){
        R(cx-4,yy,8,7,"#2f2a44"); R(cx-3,yy+1,6,5,"#9fe8ff"); R(cx-3,yy+1,2,2,"#d8f6ff");
        windowLights.push({x:cx, y:yy+3, r:22, color:"rgba(143,218,255,0.2)"});
      }
      drawDoor(cx, y+h);
      return;
    }

    if(b.kind==="bunker"){
      R(x,y+8,w,h-8,z.wall);
      for(let yy=y+14; yy<y+h; yy+=6) for(let xx=x+((yy/6)%2?0:6); xx<x+w; xx+=12) R(xx,yy,1,6,z.trim);
      for(let yy=y+14; yy<y+h; yy+=6) R(x,yy,w,1,z.trim);
      R(x-2,y+2,w+4,8,z.roof); R(x-2,y+2,w+4,1,z.roofLight); R(x-2,y+9,w+4,1,z.roofDark);
      R(x+8,y+20,16,4,"#1c1a24"); R(x+w-24,y+20,16,4,"#1c1a24");
      R(x+9,y+21,3,2,"#ff6b5e");
      windowLights.push({x:x+10, y:y+22, r:18, color:"rgba(255,107,94,0.22)"});
      drawDoor(cx, y+h, "#3d3a46", "#55516a");
      [[x+6,y+h-8],[x+w-26,y+h-8]].forEach(([sx,sy])=>{ for(let i=0;i<3;i++){ R(sx+i*7,sy,6,4,"#a8925e"); R(sx+i*7,sy,6,1,"#c4ad74"); } R(sx+3,sy-4,6,4,"#a8925e"); R(sx+10,sy-4,6,4,"#a8925e"); });
      return;
    }

    if(b.kind==="stall"){
      const top = y+18;
      R(x,top,w,h-18,z.wall); R(x,y+h-3,w,3,z.trim);
      for(let xx=x-2, i=0; xx<x+w+2; xx+=8, i++) R(xx,y+4,8,14, i%2 ? "#f4efe6" : "#d23a3a");
      R(x-2,y+4,w+4,2,"#a52626");
      for(let xx=x-2, i=0; xx<x+w+2; xx+=8, i++){ R(xx+1,y+18,6,2, i%2 ? "#f4efe6" : "#d23a3a"); R(xx+2,y+20,4,1, i%2 ? "#f4efe6" : "#d23a3a"); }
      R(x+2,y+2,2,6,"#6b4426"); R(x+w-4,y+2,2,6,"#6b4426");
      R(x+4,y+h-22,w-8,6,"#8a5a32"); R(x+4,y+h-22,w-8,1,"#a8743f");
      const crates=[["#e2463b","#ff7a6e"],["#f2b84b","#ffd88a"],["#6fbf4a","#9be37a"]];
      crates.forEach((c,i)=>{ const bx=x+8+i*16; if(Math.abs(bx+5-cx)<10) return; R(bx,y+h-15,11,9,"#a8743f"); R(bx,y+h-15,11,1,"#c08a52"); R(bx+1,y+h-18,9,4,c[0]); R(bx+2,y+h-18,2,1,c[1]); R(bx+6,y+h-17,2,1,c[1]); });
      drawDoor(cx, y+h);
      windowLights.push({x:cx, y:y+h-24, r:36, color:"rgba(255,214,130,0.22)"});
      return;
    }

    if(b.kind==="tent"){
      for(let xx=x, i=0; xx<x+w; xx+=8, i++) R(xx,y+22,8,h-22, i%2 ? "#f4efe6" : "#7a5bd6");
      const steps = 11;
      for(let i=0;i<steps;i++){
        const yy = y+2+i*2, half = Math.round((w/2+3)*(i+1)/steps);
        for(let xx=cx-half, j=0; xx<cx+half; xx+=6, j++) R(xx,yy,Math.min(6,cx+half-xx),2, (j+i)%2 ? "#f4efe6" : "#7a5bd6");
      }
      R(x-3,y+22,w+6,2,"#573db0");
      for(let xx=x-3; xx<x+w+3; xx+=6) R(xx+2,y+24,3,2,"#f2b84b");
      R(cx,y-8,1,12,"#5a3b26"); R(cx+1,y-8,6,4,"#f2b84b"); R(cx+1,y-5,4,1,"#c98d22");
      R(cx-7,y+h-18,14,18,"#2a1d3d"); R(cx-7,y+h-18,3,18,"#573db0"); R(cx+4,y+h-18,3,18,"#573db0");
      R(cx-2,y+h-12,4,3,"#f2b84b");
      windowLights.push({x:cx, y:y+h-10, r:34, color:"rgba(242,184,75,0.22)"});
      return;
    }

    if(b.kind==="post"){
      const roofH = pitched(b,z);
      windows(x,w,cx,y+roofH+5,10,false);
      drawDoor(cx, y+h, "#2f4f9a", "#1f3770");
      R(cx-8,y+roofH-12,16,10,"#f4efe6"); R(cx-8,y+roofH-12,16,1,"#c3bdd6");
      for(let i=0;i<5;i++){ R(cx-7+i,y+roofH-11+i,1,1,"#7a7598"); R(cx+6-i,y+roofH-11+i,1,1,"#7a7598"); }
      R(x+w+3,y+h-14,8,8,"#3b62b8"); R(x+w+3,y+h-14,8,2,"#6f94e0"); R(x+w+5,y+h-11,4,1,"#1c2d5e"); R(x+w+6,y+h-6,2,6,"#55506e");
      return;
    }

    const roofH = pitched(b,z);
    if(b.kind==="house"){ R(x+w-16,y-8,7,12,"#8a4a4a"); R(x+w-17,y-9,9,2,"#6b3838"); }
    const doorW = b.kind==="garage" ? 30 : 10;
    windows(x,w,cx,y+roofH+5,doorW,b.kind==="house");

    if(b.kind==="garage"){
      const gx=cx-15, gy=y+h-20;
      R(gx-1,gy-1,32,21,"#4f5f66"); R(gx,gy,30,20,"#8aa0a8");
      for(let yy=gy+3; yy<gy+20; yy+=3) R(gx,yy,30,1,"#6b7f88");
      R(gx+12,gy+15,6,2,"#3b4a50");
      windowLights.push({x:cx, y:gy+6, r:26, color:"rgba(143,208,255,0.16)"});
    } else {
      drawDoor(cx, y+h);
    }
    if(b.zone==="gesrutas"){
      R(x,y+roofH,w,2,"#951f2c");
    }
  }
})();

/* ---------- Particles & Ambient Life ---------- */
const particles = [];
const fireflies = Array.from({length: 14}, (_, i) => ({
  baseX: (i < 8 ? YARD.x + 12 + (i / 8) * (YARD.w - 16) : (POND.x - 1) * T + Math.random() * (POND.w + 2) * T),
  baseY: (i < 8 ? YARD.y + 8 + Math.random() * (YARD.h - 10) : (POND.y - 1) * T + Math.random() * (POND.h + 1) * T),
  phase: Math.random() * Math.PI * 2,
  speed: 0.7 + Math.random() * 0.8
}));

let smokeTimer = 0;
let sparkTimer = 0;
let fireworkWaves = 0;
let fireworkTimer = 0;
let duckExcited = 0;

const rainDrops = Array.from({length: 68}, () => ({
  x: Math.random() * W * T,
  y: Math.random() * H * T,
  len: 4 + ((Math.random() * 4) | 0),
  sp: 120 + Math.random() * 55
}));

function spawnHeart(x, y){
  for(let i = 0; i < 3; i++){
    particles.push({
      kind:"heart", x: x + (Math.random()-0.5)*10, y: y - 10 - i*3,
      vx: (Math.random()-0.5)*8, vy: -14 - Math.random()*8,
      life: 1.2 + Math.random()*0.4, maxLife: 1.6,
      color: i % 2 ? "#ff7ca8" : "#ffd3e0"
    });
  }
}

function spawnCyberHearts(x, y){
  for(let i = 0; i < 3; i++){
    particles.push({
      kind:"heart", x: x + (Math.random()-0.5)*12, y: y - 12 - i*3,
      vx: (Math.random()-0.5)*9, vy: -15 - Math.random()*8,
      life: 1.2 + Math.random()*0.4, maxLife: 1.6,
      color: i % 2 ? "#4cf6ff" : "#a4d5ed"
    });
  }
}

function spawnDust(x, y){
  particles.push({
    kind:"dust", x: x + (Math.random()-0.5)*4, y: y - 1,
    vx: (Math.random()-0.5)*10, vy: -4 - Math.random()*4,
    life: 0.38, maxLife: 0.38, color:"#e5d8bd"
  });
}

function spawnWarp(x, y){
  for(let i = 0; i < 12; i++){
    const a = (i / 12) * Math.PI * 2;
    particles.push({
      kind:"spark", x, y: y - 6,
      vx: Math.cos(a) * (20 + Math.random()*14),
      vy: Math.sin(a) * (20 + Math.random()*14),
      life: 0.45 + Math.random()*0.15, maxLife: 0.6,
      color: i % 2 ? "#f2b84b" : "#a98fff"
    });
  }
}

function spawnCoin(sx, sy, tx, ty){
  particles.push({
    kind:"coin", x: sx, y: sy - 8,
    sx, sy: sy - 8, tx, ty,
    vx: 0, vy: 0, life: 0.55, maxLife: 0.55, color:"#ffd966"
  });
}

function spawnPaperPlane(x, y){
  particles.push({
    kind:"plane", x, y: y - 10,
    vx: 46, vy: -24,
    life: 2.2, maxLife: 2.2, color:"#f4efe6"
  });
}

function spawnPondRipple(x, y){
  duckExcited = 3.2;
  for(let i = 0; i < 3; i++){
    particles.push({
      kind:"ripple", x: x + (Math.random()-0.5)*10, y: y + (Math.random()-0.5)*8,
      vx: 0, vy: 0, life: 0.9 + i*0.25, maxLife: 1.15, color:"#bfe3ff"
    });
  }
  for(let i = 0; i < 5; i++){
    particles.push({
      kind:"spark", x, y,
      vx: (Math.random()-0.5)*18, vy: -12 - Math.random()*10,
      life: 0.45, maxLife: 0.45, color:"#ffd88a"
    });
  }
}

function spawnBugCatch(x, y){
  for(let i = 0; i < 14; i++){
    const a = (i / 14) * Math.PI * 2;
    particles.push({
      kind:"spark", x, y: y - 3,
      vx: Math.cos(a) * (18 + Math.random()*18),
      vy: Math.sin(a) * (18 + Math.random()*18) - 8,
      life: 0.55 + Math.random()*0.2, maxLife: 0.75,
      color: i % 2 ? "#5fd3c4" : "#f2b84b"
    });
  }
}

function spawnFireworkBurst(x, y){
  const palette = ["#f2b84b", "#ff7ca8", "#5fd3c4", "#a98fff", "#8fd0ff", "#ff9b54"];
  const c1 = palette[(Math.random()*palette.length)|0];
  const c2 = palette[(Math.random()*palette.length)|0];
  for(let i = 0; i < 20; i++){
    const a = (i / 20) * Math.PI * 2 + Math.random()*0.15;
    const sp = 18 + Math.random()*28;
    particles.push({
      kind:"fw", x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 10,
      life: 0.9 + Math.random()*0.5, maxLife: 1.4,
      color: i % 2 ? c1 : c2
    });
  }
  if(RQ.Audio) RQ.Audio.firework();
}

function triggerCelebration(player){
  fireworkWaves = 7;
  fireworkTimer = 0.05;
  spawnFireworkBurst(player.x, player.y - 38);
}

function updateParticles(dt, state){
  if(state.RM) return;
  // Chimney smoke on Casa de Ressi (x:37, y:20, w:7 -> chimney at 37*16+7*16-13 = 691, y=311)
  smokeTimer -= dt;
  if(smokeTimer <= 0){
    smokeTimer = 0.55 + Math.random()*0.4;
    particles.push({
      kind:"smoke", x: 37*T + 7*T - 13 + (Math.random()-0.5)*2, y: 20*T - 10,
      vx: 4 + Math.random()*3, vy: -10 - Math.random()*4,
      life: 1.8, maxLife: 1.8, color:"#d8d2ea"
    });
  }
  // Occasional spark in Zona en Obra
  sparkTimer -= dt;
  if(sparkTimer <= 0){
    sparkTimer = 1.1 + Math.random()*1.2;
    const lots = PLACES.filter(p => p.kind === "lot");
    const lot = lots[(Math.random()*lots.length)|0];
    const sx = (lot.x + 1 + Math.random()*(lot.w - 2)) * T;
    const sy = (lot.y + 1 + Math.random()*(lot.h - 2)) * T;
    for(let i = 0; i < 3; i++){
      particles.push({
        kind:"spark", x: sx, y: sy,
        vx: (Math.random()-0.5)*24, vy: -14 - Math.random()*16,
        life: 0.45, maxLife: 0.45, color: i ? "#ff9b54" : "#ffe08a"
      });
    }
  }
  // Celebration firework waves
  if(fireworkWaves > 0){
    fireworkTimer -= dt;
    if(fireworkTimer <= 0){
      fireworkWaves--;
      fireworkTimer = 0.45 + Math.random()*0.35;
      const fx = state.player.x + (Math.random()-0.5)*140;
      const fy = state.player.y - 24 + (Math.random()-0.5)*70;
      spawnFireworkBurst(Math.max(40, Math.min(W*T-40, fx)), Math.max(40, Math.min(H*T-40, fy)));
    }
  }
  if(duckExcited > 0) duckExcited = Math.max(0, duckExcited - dt);
  if(state.weather === "rain"){
    rainDrops.forEach(d => {
      d.x -= d.sp * 0.25 * dt;
      d.y += d.sp * dt;
      if(d.y > H * T){ d.y = -4; d.x = Math.random() * W * T; }
      if(d.x < 0) d.x += W * T;
    });
  }
  for(let i = particles.length - 1; i >= 0; i--){
    const p = particles[i];
    p.life -= dt;
    if(p.life <= 0){
      if(p.kind === "coin"){
        for(let s = 0; s < 8; s++){
          const a = (s / 8) * Math.PI * 2;
          particles.push({
            kind:"spark", x: p.tx, y: p.ty,
            vx: Math.cos(a) * 14, vy: Math.sin(a) * 10 - 12,
            life: 0.35, maxLife: 0.35, color: s % 2 ? "#bfe3ff" : "#ffffff"
          });
        }
      }
      particles.splice(i, 1);
      continue;
    }
    if(p.kind === "coin"){
      const u = 1 - p.life / p.maxLife;
      p.x = p.sx + (p.tx - p.sx) * u;
      p.y = p.sy + (p.ty - p.sy) * u - Math.sin(u * Math.PI) * 26;
    } else if(p.kind === "plane"){
      p.x += p.vx * dt;
      p.y += (p.vy + Math.sin(p.life * 8) * 8) * dt;
      if(Math.random() < 0.35){
        particles.push({kind:"dust", x:p.x-2, y:p.y+1, vx:-4, vy:2, life:0.35, maxLife:0.35, color:"#ffd88a"});
      }
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if(p.kind === "fw") p.vy += 28 * dt;
      else if(p.kind === "spark") p.vy += 42 * dt;
    }
  }
}

/* ---------- Sprites ---------- */
function drawCat(ctx, c, RM){
  const walking = c.state==="walk" && !RM;
  const step = walking ? Math.floor(c.anim*8)%2 : 0;
  const ox = Math.round(c.x)-6, oy = Math.round(c.y)-9;
  const m = c.dir<0;
  const P=(x,y,w,h,col)=>{ ctx.fillStyle=col; const xx = m ? 12-x-w : x; ctx.fillRect(ox+xx, oy+y, w, h); };
  ctx.fillStyle="rgba(0,0,0,.22)"; ctx.fillRect(Math.round(c.x)-5, Math.round(c.y)-1, 10, 2);
  if(c.fur==="long"){
    const B="#5b4b3d", D="#2b231d", L="#7d6a56", O="#b5793f", Wt="#d9ccb6", EYE="#b8c45a";
    if(c.state==="sit"){
      P(0,4,3,3,D); P(0,3,2,1,B);
      P(3,2,6,6,B); P(4,3,1,4,D); P(6,3,1,4,D); P(5,2,1,1,O); P(7,5,2,2,L); P(3,7,6,1,D);
      P(7,0,5,5,B); P(7,-1,1,1,B); P(11,-1,1,1,B); P(8,0,1,2,D); P(10,0,1,2,D);
      P(10,3,2,2,Wt); P(10,2,1,1,EYE); P(8,4,2,2,L);
    } else {
      P(0,0,2,5,D); P(1,4,2,2,B);
      P(2,2,7,4,B); P(3,2,1,4,D); P(5,2,1,4,D); P(7,2,1,4,D); P(4,2,1,1,O); P(2,6,7,1,L);
      P(8,0,4,5,B); P(8,-1,1,1,B); P(11,-1,1,1,B); P(9,0,1,2,D);
      P(10,3,2,2,Wt); P(10,2,1,1,EYE);
      P(3,7,1,step?1:2,D); P(7,7,1,step?2:1,D);
    }
  } else {
    const O="#e39a3c", D="#c27624", Wt="#fbf6ec", EYE="#c79a3a";
    if(c.state==="sit"){
      P(0,6,3,1,O); P(1,6,1,1,D);
      P(3,3,5,5,O); P(4,3,1,2,D); P(6,5,3,3,Wt); P(3,7,3,1,Wt);
      P(7,0,5,4,O); P(7,-1,1,1,O); P(11,-1,1,1,O); P(9,0,1,1,D);
      P(9,2,3,2,Wt); P(10,1,1,1,EYE);
    } else {
      P(0,1,1,3,O); P(0,2,1,1,D); P(1,3,1,1,O);
      P(2,3,7,3,O); P(4,3,1,2,D); P(6,3,1,2,D); P(2,5,7,1,Wt);
      P(8,1,4,4,O); P(8,0,1,1,O); P(11,0,1,1,O);
      P(9,3,3,2,Wt); P(10,2,1,1,EYE);
      P(3,6,1,step?1:2,Wt); P(7,6,1,step?2:1,Wt);
    }
  }
}

const cerberusSheet = new Image();
cerberusSheet.src = "img/cerberus-sheet.png";
const CERB_WALK = [1, 2, 3, 2];

function drawCerberus(ctx, g, sec, RM){
  const walking = g.state === "walk" && !RM;
  const frame = walking ? CERB_WALK[Math.floor(g.anim * 7.5) % 4] : 0;
  const gx = Math.round(g.x), gy = Math.round(g.y);

  // Soft ground shadow
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.fillRect(gx - 9, gy - 2, 18, 3);

  if(cerberusSheet.complete && cerberusSheet.naturalWidth > 0){
    const sz = 25;
    const fw = cerberusSheet.naturalWidth / 4;
    const fh = cerberusSheet.naturalHeight;
    ctx.save();
    ctx.translate(gx, gy);
    // Original sprite faces left (heads on left, tails on right), so flip when moving right
    if(g.dir > 0) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cerberusSheet, frame * fw, 0, fw, fh, -sz / 2, -sz + 1, sz, sz);
    ctx.restore();
    return;
  }

  // Fallback while image loads
  ctx.fillStyle = "#44739a";
  ctx.fillRect(gx - 6, gy - 12, 12, 10);
  ctx.fillStyle = "#4cf6ff";
  ctx.fillRect(gx - 3, gy - 9, 2, 2);
  ctx.fillRect(gx + 1, gy - 9, 2, 2);
}

function drawPlayer(ctx, player, skin){
  const isHacker = skin === "hacker";
  const HAIR="#2a1c19", SKIN="#e8b48c", GL=isHacker?"#5fd3c4":"#e2ddf2", BR=isHacker?"#1f7469":"#8f88a8";
  const JK=isHacker?"#25293d":"#7d55d9", JKD=isHacker?"#5fd3c4":"#5e3db5", PANTS="#2b2e48", SHOE="#1a1626";
  const rate = player.running ? 12 : 8;
  const step = player.moving ? (Math.floor(player.anim*rate)%2) : 0;
  const ox = Math.round(player.x)-6, oy = Math.round(player.y)-16 - (player.moving && step ? 1 : 0);
  const mirror = player.dir==="right";
  const P = (x,y,w,h,c)=>{ ctx.fillStyle=c; const xx = mirror ? 12-x-w : x; ctx.fillRect(ox+xx, oy+y, w, h); };
  ctx.fillStyle="rgba(0,0,0,.25)"; ctx.fillRect(Math.round(player.x)-4, Math.round(player.y)-1, 8, 2);
  const d = player.dir;
  if(d==="down"){
    P(2,0,8,2,HAIR); P(1,2,10,2,HAIR); P(1,4,2,6,HAIR); P(9,4,2,6,HAIR);
    P(3,4,6,4,SKIN); P(4,8,4,1,SKIN);
    P(3,5,2,1,GL); P(7,5,2,1,GL); P(5,5,2,1,BR);
    P(5,7,2,1,"#c07a6a");
    P(2,9,8,4,JK); P(5,9,2,4,JKD); P(1,9,1,3,JK); P(10,9,1,3,JK); P(1,12,1,1,SKIN); P(10,12,1,1,SKIN);
    P(3,13,2,step?1:2,PANTS); P(7,13,2,step?2:1,PANTS);
    P(3,step?14:15,2,1,SHOE); P(7,step?15:14,2,1,SHOE);
  } else if(d==="up"){
    P(2,0,8,2,HAIR); P(1,2,10,8,HAIR); P(2,10,8,1,HAIR);
    P(2,9,8,4,JK); P(1,9,1,3,JK); P(10,9,1,3,JK); P(1,12,1,1,SKIN); P(10,12,1,1,SKIN);
    P(2,11,8,1,JKD);
    P(3,13,2,step?1:2,PANTS); P(7,13,2,step?2:1,PANTS);
    P(3,step?14:15,2,1,SHOE); P(7,step?15:14,2,1,SHOE);
  } else {
    P(3,0,7,2,HAIR); P(2,2,9,2,HAIR); P(6,4,5,7,HAIR);
    P(2,4,5,4,SKIN); P(3,8,3,1,SKIN); P(1,6,1,1,SKIN);
    P(2,5,3,1,GL); P(5,5,1,1,BR);
    P(3,7,2,1,"#c07a6a");
    P(3,9,6,4,JK); P(5,10,2,3,JKD); P(5,12,2,1,SKIN);
    P(4,13,2,2,PANTS); P(6,13,2,step?1:2,PANTS);
    P(step?3:4,15,2,1,SHOE); P(6,step?14:15,2,1,SHOE);
  }
  // Accessories
  if(skin === "obra"){
    P(2,-2,8,3,"#f2c230"); P(1,1,10,1,"#d99c18"); P(5,-2,2,3,"#fff6cf");
  } else if(skin === "corona"){
    P(2,-3,1,2,"#f2b84b"); P(5,-4,2,3,"#f2b84b"); P(9,-3,1,2,"#f2b84b");
    P(2,-1,8,2,"#f2b84b"); P(5,-1,2,1,"#ef5b67");
  }
}

function drawBug(ctx, b, sec, RM){
  const bob = RM ? 0 : Math.round(Math.sin(sec * 6 + b.x) * 1.5);
  const bx = Math.round(b.x), by = Math.round(b.y) + bob;
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(bx - 3, Math.round(b.y) + 2, 6, 2);
  // glowing aura pixel
  if(!RM && Math.floor(sec * 5) % 2 === 0){
    ctx.fillStyle = "rgba(95,211,196,.45)";
    ctx.fillRect(bx - 4, by - 4, 8, 6);
  }
  // wings & shell
  const wing = (!RM && Math.floor(sec * 12) % 2 === 0) ? -1 : 0;
  ctx.fillStyle = "#c8fff5";
  ctx.fillRect(bx - 4, by - 3 + wing, 2, 2);
  ctx.fillRect(bx + 2, by - 3 + wing, 2, 2);
  ctx.fillStyle = "#2bc4ad";
  ctx.fillRect(bx - 2, by - 3, 4, 4);
  ctx.fillStyle = "#f2b84b";
  ctx.fillRect(bx - 1, by - 2, 1, 1);
  ctx.fillRect(bx + 1, by - 1, 1, 1);
  // antennae
  ctx.fillStyle = "#1b1429";
  ctx.fillRect(bx - 2, by - 4, 1, 1);
  ctx.fillRect(bx + 1, by - 4, 1, 1);
}

function drawPondLife(ctx, sec, RM){
  const px = POND.x * T, py = POND.y * T, pw = POND.w * T, ph = POND.h * T;
  const cx = px + pw / 2, cy = py + ph / 2;
  // 2 Koi fish swimming smoothly
  const koi = [
    {a: sec * 0.7, rx: 14, ry: 9, c1:"#ff7a3d", c2:"#fff2e0"},
    {a: -sec * 0.55 + 2.2, rx: 10, ry: 12, c1:"#f2b84b", c2:"#e04856"}
  ];
  koi.forEach(k => {
    const a = RM ? 0.8 : k.a;
    const fx = Math.round(cx + Math.cos(a) * k.rx);
    const fy = Math.round(cy + Math.sin(a) * k.ry);
    ctx.fillStyle = k.c1;
    ctx.fillRect(fx - 2, fy - 1, 4, 2);
    ctx.fillStyle = k.c2;
    ctx.fillRect(fx, fy - 1, 1, 2);
  });
  // Cute pixel duck floating in pond
  const speed = duckExcited > 0 ? 1.8 : 0.45;
  const da = RM ? 0 : sec * speed;
  const dx = Math.round(cx + Math.sin(da) * 9);
  const dy = Math.round(cy - 4 + Math.cos(da * 0.8) * 5 + (duckExcited > 0 ? Math.sin(sec*16)*1.2 : 0));
  const faceR = Math.cos(da) >= 0;
  ctx.fillStyle = "rgba(191,227,255,.65)";
  ctx.fillRect(dx - 3, dy + 2, 7, 1);
  ctx.fillStyle = "#ffd954";
  ctx.fillRect(dx - 3, dy - 1, 6, 3);
  ctx.fillRect(faceR ? dx + 1 : dx - 3, dy - 4, 3, 3);
  ctx.fillStyle = "#ff8a3d";
  ctx.fillRect(faceR ? dx + 4 : dx - 4, dy - 3, 1, 1);
  ctx.fillStyle = "#1a1626";
  ctx.fillRect(faceR ? dx + 3 : dx - 2, dy - 3, 1, 1);
}

/* ---------- Sunset & Night lighting pass ---------- */
function drawAtmosphere(ctx, state, sec){
  const isSunset = state.timeMode === "sunset";
  const lw = lightCanvas.width, lh = lightCanvas.height;
  lctx.globalCompositeOperation = "source-over";
  lctx.clearRect(0, 0, lw, lh);
  lctx.fillStyle = isSunset ? "rgba(68, 24, 44, 0.32)" : "rgba(13, 9, 34, 0.56)";
  lctx.fillRect(0, 0, lw, lh);

  lctx.globalCompositeOperation = "destination-out";
  function punch(wx, wy, wr, strength){
    const x = wx * 0.5, y = wy * 0.5, r = wr * 0.5;
    const gr = lctx.createRadialGradient(x, y, r * 0.12, x, y, r);
    gr.addColorStop(0, "rgba(0,0,0," + (strength || 0.92) + ")");
    gr.addColorStop(0.65, "rgba(0,0,0," + ((strength || 0.92) * 0.45) + ")");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    lctx.fillStyle = gr;
    lctx.beginPath();
    lctx.arc(x, y, r, 0, Math.PI * 2);
    lctx.fill();
  }

  const mult = isSunset ? 0.65 : 1;
  punch(state.player.x, state.player.y - 6, 68, 0.78 * mult);

  const flick = state.RM ? 0 : Math.sin(sec * 3.1) * 2;
  LAMPS.forEach(([tx,ty]) => punch(tx*T + 8, ty*T - 4, 58 + flick, 0.95 * mult));
  windowLights.forEach(w => punch(w.x, w.y, w.r, 0.72 * mult));

  const k = PLACES.find(p => p.kind === "kiosk");
  punch((k.x + k.w/2)*T, (k.y + 1)*T, 44, 0.9 * mult);

  const tower = PLACES.find(p => p.id === "monitoreo");
  if(state.RM || Math.floor(sec*2)%2 === 0){
    punch((tower.x + tower.w/2)*T, tower.y*T - 11, 32, 0.7 * mult);
  }

  particles.forEach(p => {
    if(p.kind === "fw") punch(p.x, p.y, 26, 0.65);
  });

  BUGS_DATA.forEach(b => {
    if(!state.caughtBugs.has(b.id)) punch(b.x, b.y, 22, 0.72 * mult);
  });

  if(state.cerberus){
    punch(state.cerberus.x, state.cerberus.y - 11, 36, 0.78 * mult);
  }

  ctx.drawImage(lightCanvas, 0, 0, W * T, H * T);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  if(isSunset){
    ctx.fillStyle = "rgba(255, 130, 56, 0.08)";
    ctx.fillRect(0, 0, W * T, H * T);
  }
  function bloom(wx, wy, wr, color){
    const gr = ctx.createRadialGradient(wx, wy, 1, wx, wy, wr);
    gr.addColorStop(0, color);
    gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(wx, wy, wr, 0, Math.PI * 2);
    ctx.fill();
  }
  LAMPS.forEach(([tx,ty]) => bloom(tx*T + 8, ty*T - 4, 34, isSunset ? "rgba(255, 198, 108, 0.14)" : "rgba(255, 206, 112, 0.22)"));
  windowLights.forEach(w => bloom(w.x, w.y, w.r * (isSunset ? 0.55 : 0.75), w.color));
  bloom((k.x + k.w/2)*T, k.y*T + 10, 26, isSunset ? "rgba(255, 191, 94, 0.16)" : "rgba(255, 191, 94, 0.25)");
  if(state.cerberus){
    bloom(state.cerberus.x, state.cerberus.y - 11, 22, isSunset ? "rgba(76, 246, 255, 0.16)" : "rgba(76, 246, 255, 0.28)");
  }

  if(!state.RM && !isSunset){
    fireflies.forEach(f => {
      const fx = f.baseX + Math.sin(sec * f.speed + f.phase) * 9;
      const fy = f.baseY + Math.cos(sec * f.speed * 0.8 + f.phase) * 6;
      const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(sec * 2.6 + f.phase * 2));
      bloom(fx, fy, 8, "rgba(195, 255, 130, " + (0.28 * pulse).toFixed(2) + ")");
      ctx.fillStyle = "rgba(235, 255, 175, " + (0.85 * pulse).toFixed(2) + ")";
      ctx.fillRect(Math.round(fx), Math.round(fy), 2, 2);
    });
  }
  ctx.restore();
}

/* ---------- Main World Render ---------- */
function render(ctx, canvas, state, t){
  const { dpr, S, offX, offY, camX, camY, player, cats, visited, petted, path, hovered, timeMode, RM } = state;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = timeMode === "night" ? "#110d20" : timeMode === "sunset" ? "#291828" : "#1d3b27";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.setTransform(S,0,0,S, offX - camX*S, offY - camY*S);
  ctx.drawImage(worldCanvas, 0, 0);

  const F = (x,y,w,h,c)=>{ ctx.fillStyle = c; ctx.fillRect(x,y,w,h); };
  const sec = t / 1000;

  // Pathfinding dotted breadcrumb trail
  if(path && path.length){
    let px = player.x, py = player.y - 2;
    ctx.fillStyle = "rgba(242, 184, 75, 0.72)";
    for(let i = 0; i < path.length; i++){
      const wp = path[i];
      const dx = wp.x - px, dy = wp.y - py, dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.floor(dist / 7));
      for(let s = 1; s <= steps; s++){
        const mx = px + (dx * s) / steps;
        const my = py + (dy * s) / steps;
        ctx.fillRect(Math.round(mx) - 1, Math.round(my) - 1, 2, 2);
      }
      px = wp.x; py = wp.y;
    }
    const last = path[path.length - 1];
    if(!RM && Math.floor(sec*4)%2 === 0){
      const tx = Math.round(last.x), ty = Math.round(last.y);
      F(tx-1,ty-3,2,1,"#f2b84b"); F(tx-2,ty-2,4,1,"#f2b84b"); F(tx-1,ty-1,2,1,"#f2b84b");
    }
  }

  // Hover highlight outline on building or prop
  if(hovered && hovered.kind !== "cat" && hovered.kind !== "bug" && hovered.kind !== "cerberus"){
    const hx = hovered.x*T - 1, hy = hovered.y*T - 1, hw = hovered.w*T + 2, hh = hovered.h*T + 2;
    ctx.strokeStyle = (hovered.zone && ZONES[hovered.zone]) ? ZONES[hovered.zone].roofLight : "#f2b84b";
    ctx.lineWidth = 1;
    ctx.strokeRect(hx + 0.5, hy + 0.5, hw - 1, hh - 1);
  }

  // Pond koi fish & floating duck
  drawPondLife(ctx, sec, RM);

  // Fountain spray
  {
    const cx = (FOUNTAIN.x + FOUNTAIN.w/2)*T, top = (FOUNTAIN.y + FOUNTAIN.h/2)*T - 16;
    const ph = RM ? 0 : Math.floor(sec*6)%3;
    F(cx-1,top-4-ph,2,4,"#bfe3ff"); F(cx-4,top-1+ph%2,2,2,"#8fc6f2"); F(cx+3,top-1+(ph+1)%2,2,2,"#8fc6f2");
    if(!RM) F(cx-14+((sec*8)%24),(FOUNTAIN.y+FOUNTAIN.h)*T-14,4,1,"rgba(220,240,255,.7)");
  }

  // Data pulses traveling along infra wires
  if(!RM){
    const wires = [
      [31*T, 3*T-8, 35*T+8, 4*T+2, "#5fd3c4", 0],
      [31*T, 3*T-8, 43*T+8, 5*T+4, "#f2b84b", 0.45]
    ];
    wires.forEach(([x1,y1,x2,y2,col,off]) => {
      const u = (sec * 0.45 + off) % 1;
      const wx = x1 + (x2 - x1) * u;
      const wy = y1 + (y2 - y1) * u + Math.sin(Math.PI * u) * 10;
      F(Math.round(wx)-1, Math.round(wy)-1, 2, 2, col);
    });
  }

  // Tower light
  const tower = PLACES.find(p => p.id === "monitoreo");
  const blink = RM ? true : (Math.floor(sec*2)%2 === 0);
  F((tower.x + tower.w/2)*T - 1, tower.y*T - 12, 2, 2, blink ? "#ff5e5e" : "#7a2a2a");

  // Kiosk screen
  const k = PLACES.find(p => p.kind === "kiosk"), kx = k.x*T + 8, ky = k.y*T + 4;
  F(kx,ky,16,12,"#1a140c");
  F(kx+2,ky+2,8,1,"#ffbf5e"); F(kx+2,ky+5,11,1,"#c99449"); F(kx+2,ky+8,5,1,"#ffbf5e");
  if(RM || Math.floor(sec*2.5)%2 === 0) F(kx+8,ky+8,2,2,"#ffbf5e");

  // Crane hook swing on lots
  PLACES.filter(p => p.kind === "lot").forEach((p, i) => {
    const x = p.x*T, y = p.y*T, w = p.w*T;
    const sw = RM ? 0 : Math.round(Math.sin(sec*1.5 + i)*2);
    F(x+w-14,y-14,2,28,"#d9a441"); F(x+12,y-14,w-24,2,"#d9a441");
    F(x+20+sw,y-12,1,10,"#3a3650"); F(x+18+sw,y-2,5,2,"#3a3650");
  });

  // Flags on visited buildings
  VISITABLE.forEach(b => {
    if(!visited.has(b.id)) return;
    const fx = b.x*T + 3, fy = b.y*T - 8;
    F(fx,fy,1,10,"#3b2a1a"); F(fx+1,fy,6,4,"#f2b84b"); F(fx+1,fy+3,4,1,"#c98d22");
  });

  // Uncaught QA bugs
  BUGS_DATA.forEach(b => {
    if(!state.caughtBugs.has(b.id)) drawBug(ctx, b, sec, RM);
  });

  // Y-sorted entities
  const ents = cats.map(c => ({y: c.y, draw: () => drawCat(ctx, c, RM)}))
    .concat([{y: player.y, draw: () => drawPlayer(ctx, player, state.skin)}]);
  if(state.cerberus) ents.push({y: state.cerberus.y, draw: () => drawCerberus(ctx, state.cerberus, sec, RM)});
  ents.sort((a,b) => a.y - b.y).forEach(e => e.draw());

  // Particles
  particles.forEach(p => {
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.globalAlpha = alpha;
    if(p.kind === "smoke"){
      const sz = 2 + Math.round((1 - alpha) * 3);
      F(Math.round(p.x), Math.round(p.y), sz, sz, p.color);
    } else if(p.kind === "heart"){
      const hx = Math.round(p.x), hy = Math.round(p.y);
      F(hx-2,hy,2,2,p.color); F(hx+1,hy,2,2,p.color);
      F(hx-2,hy+1,5,2,p.color); F(hx-1,hy+3,3,1,p.color); F(hx,hy+4,1,1,p.color);
    } else if(p.kind === "coin"){
      const cx2 = Math.round(p.x), cy2 = Math.round(p.y);
      F(cx2-1, cy2-1, 3, 3, "#ffd966"); F(cx2, cy2, 1, 1, "#fff6cf");
    } else if(p.kind === "plane"){
      const px2 = Math.round(p.x), py2 = Math.round(p.y);
      F(px2-2, py2, 6, 1, "#ffffff"); F(px2-1, py2-1, 5, 1, "#e8e4f2");
      F(px2-2, py2+1, 4, 1, "#c3bdd6"); F(px2+3, py2-1, 2, 1, "#ffffff");
    } else if(p.kind === "ripple"){
      const rad = Math.round((1 - alpha) * 10) + 2;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(p.x) - rad, Math.round(p.y) - Math.round(rad*0.6), rad*2, Math.round(rad*1.2));
    } else {
      F(Math.round(p.x), Math.round(p.y), p.kind === "fw" ? 2 : 1, p.kind === "fw" ? 2 : 1, p.color);
    }
  });
  ctx.globalAlpha = 1;

  // Rain weather effect
  if(state.weather === "rain" && !RM){
    ctx.strokeStyle = "rgba(164, 214, 255, 0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    rainDrops.forEach(d => {
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 1.5, d.y + d.len);
    });
    ctx.stroke();
  }

  // Sunset / Night lighting pass
  if(timeMode === "night" || timeMode === "sunset"){
    drawAtmosphere(ctx, state, sec);
  }

  // Labels in screen space
  ctx.setTransform(1,0,0,1,0,0);
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  const zfs = Math.round(7.5 * dpr);
  ctx.font = zfs + 'px "Press Start 2P", monospace';
  ZONE_SIGNS.forEach(z => {
    const sx = (z.x * T - camX) * S + offX, sy = (z.y * T - camY) * S + offY;
    if(sx < -300*dpr || sx > canvas.width+300*dpr || sy < -40*dpr || sy > canvas.height+40*dpr) return;
    const tw = ctx.measureText(z.text).width;
    const padX = 9 * dpr, ph = zfs + 10 * dpr;
    const bw = tw + padX * 2 + 4 * dpr;
    const bx = Math.round(sx - bw / 2), by = Math.round(sy - ph);
    const bt = Math.max(1, Math.round(2 * dpr));
    const accent = (z.zone && ZONES[z.zone] && ZONES[z.zone].roofLight) || "#f2b84b";
    // Wooden signboard outer shadow & dark timber border
    ctx.fillStyle = "rgba(10,7,18,.55)";
    ctx.fillRect(bx + bt, by + bt, bw, ph);
    ctx.fillStyle = "#26170f";
    ctx.fillRect(bx, by, bw, ph);
    // Warm cedar wood fill + top bevel highlight
    ctx.fillStyle = "#543522";
    ctx.fillRect(bx + bt, by + bt, bw - bt*2, ph - bt*2);
    ctx.fillStyle = "#7a4e33";
    ctx.fillRect(bx + bt, by + bt, bw - bt*2, Math.max(1, Math.round(1.5*dpr)));
    // District color strip on left edge
    ctx.fillStyle = accent;
    ctx.fillRect(bx + bt, by + bt, Math.round(4*dpr), ph - bt*2);
    // Tiny brass corner nails
    ctx.fillStyle = "#f2b84b";
    const nail = Math.max(1, Math.round(1.5 * dpr));
    ctx.fillRect(bx + bw - bt - nail*2, by + bt + nail, nail, nail);
    ctx.fillRect(bx + bw - bt - nail*2, by + ph - bt - nail*2, nail, nail);
    // Crisp engraved wood-sign text
    ctx.fillStyle = "rgba(22,12,6,.85)";
    ctx.fillText(z.text, bx + padX + 3*dpr + tw/2 + dpr, by + ph/2 + dpr*1.5);
    ctx.fillStyle = "#ffe8b0";
    ctx.fillText(z.text, bx + padX + 3*dpr + tw/2, by + ph/2 + dpr*0.5);
  });

  const fs = Math.round(9*dpr);
  ctx.font = fs + 'px "Press Start 2P", monospace';
  PLACES.forEach(b => {
    const sx = ((b.x + b.w/2)*T - camX)*S + offX;
    const lift = b.kind==="tower" ? 18 : b.kind==="tent" ? 14 : b.kind==="lot" ? 18 : 6;
    const sy = ((b.y*T - lift) - camY)*S + offY - 8*dpr;
    if(sx < -200*dpr || sx > canvas.width+200*dpr || sy < -40*dpr || sy > canvas.height+40*dpr) return;
    const text = b.label, tw = ctx.measureText(text).width, padX = 7*dpr, ph = fs + 10*dpr;
    const seen = visited.has(b.id);
    const isHov = hovered && hovered.id === b.id;
    const bw = tw + padX*2 + (seen ? 10*dpr : 0);
    const bx = Math.round(sx - bw/2), by = Math.round(sy - ph/2);
    ctx.fillStyle = isHov ? "rgba(39,31,66,.96)" : "rgba(18,14,31,.9)";
    ctx.fillRect(bx,by,bw,ph);
    ctx.fillStyle = isHov ? "#f2b84b" : ZONES[b.zone].roofLight;
    const bt = Math.max(1, Math.round(2*dpr));
    ctx.fillRect(bx,by,bw,bt); ctx.fillRect(bx,by+ph-bt,bw,bt); ctx.fillRect(bx,by,bt,ph); ctx.fillRect(bx+bw-bt,by,bt,ph);
    ctx.fillStyle = "#f1ecff";
    ctx.fillText(text, bx + padX + tw/2, by + ph/2 + dpr);
    if(seen){ ctx.fillStyle="#f2b84b"; ctx.fillRect(bx+bw-padX-5*dpr, by+ph/2-2.5*dpr, 5*dpr, 5*dpr); }
  });

  // Cat name tags when close, hovered, following, or petted
  ctx.font = Math.round(8*dpr) + 'px "Press Start 2P", monospace';
  cats.forEach(c => {
    const isHov = hovered && hovered.id === c.id;
    const isFol = state.followingCat === c.id;
    if(!isHov && !isFol && Math.hypot(player.x-c.x, player.y-c.y) > 48 && !petted.has(c.id)) return;
    const sx = (c.x - camX)*S + offX, sy = (c.y - 16 - camY)*S + offY;
    ctx.fillStyle = "rgba(10,7,18,.82)"; ctx.fillText(c.name, sx+dpr, sy+dpr);
    ctx.fillStyle = isHov ? "#f2b84b" : isFol ? "#5fd3c4" : "#ffd3e0"; ctx.fillText(c.name, sx, sy);
  });

  // Mini Cerberus name tag when close, hovered, or patrolling with player
  if(state.cerberus){
    const g = state.cerberus;
    const isHov = hovered && hovered.id === g.id;
    const isFol = state.followingCat === g.id;
    if(isHov || isFol || Math.hypot(player.x - g.x, player.y - g.y) < 62){
      const sx = (g.x - camX)*S + offX, sy = (g.y - 28 - camY)*S + offY;
      ctx.fillStyle = "rgba(10,7,18,.82)"; ctx.fillText(g.name, sx+dpr, sy+dpr);
      ctx.fillStyle = isHov ? "#f2b84b" : "#4cf6ff"; ctx.fillText(g.name, sx, sy);
    }
  }

  // Interactive prop tags (Tablón always softly visible; others on hover/nearby)
  PROPS.forEach(p => {
    const cx = (p.x + p.w/2)*T, cy = p.y*T - 6;
    const isHov = hovered && hovered.id === p.id;
    const close = Math.hypot(player.x - cx, player.y - (p.y + p.h/2)*T) < 42;
    if(p.id !== "board" && !isHov && !close) return;
    const sx = (cx - camX)*S + offX, sy = (cy - camY)*S + offY;
    ctx.fillStyle = "rgba(10,7,18,.82)"; ctx.fillText(p.label, sx+dpr, sy+dpr);
    ctx.fillStyle = isHov ? "#f2b84b" : "#8fd0ff"; ctx.fillText(p.label, sx, sy);
  });

  // Uncaught bug tag when hovered or close
  BUGS_DATA.forEach(b => {
    if(state.caughtBugs.has(b.id)) return;
    const isHov = hovered && hovered.id === b.id;
    if(!isHov && Math.hypot(player.x - b.x, player.y - b.y) > 42) return;
    const sx = (b.x - camX)*S + offX, sy = (b.y - 12 - camY)*S + offY;
    ctx.fillStyle = "rgba(10,7,18,.82)"; ctx.fillText("BUG!", sx+dpr, sy+dpr);
    ctx.fillStyle = "#5fd3c4"; ctx.fillText("BUG!", sx, sy);
  });
}

/* ---------- Minimap Render ---------- */
function renderMinimap(mCanvas, state, t){
  if(!mCanvas || mCanvas.offsetParent === null) return;
  const mctx = mCanvas.getContext("2d");
  mctx.imageSmoothingEnabled = false;
  mctx.drawImage(miniBase, 0, 0);

  const sec = t / 1000;
  const pulse = state.RM ? true : (Math.floor(sec * 2.5) % 2 === 0);

  // Building status markers
  VISITABLE.forEach(b => {
    const bx = Math.round((b.x + b.w/2) * 2);
    const by = Math.round((b.y + b.h/2) * 2);
    if(state.visited.has(b.id)){
      mctx.fillStyle = "#f2b84b";
      mctx.fillRect(bx - 1, by - 1, 2, 2);
    } else if(pulse){
      mctx.fillStyle = "#ffffff";
      mctx.fillRect(bx - 1, by - 1, 2, 2);
    }
  });

  // Active path preview
  if(state.path && state.path.length){
    mctx.fillStyle = "rgba(242,184,75,0.85)";
    state.path.forEach(wp => {
      mctx.fillRect(Math.round((wp.x / T) * 2), Math.round((wp.y / T) * 2), 1, 1);
    });
  }

  // Cats
  state.cats.forEach(c => {
    mctx.fillStyle = "#ff9bc0";
    mctx.fillRect(Math.round((c.x / T) * 2) - 1, Math.round((c.y / T) * 2) - 1, 2, 2);
  });

  // Mini Cerberus (cyan dot)
  if(state.cerberus){
    mctx.fillStyle = "#4cf6ff";
    mctx.fillRect(Math.round((state.cerberus.x / T) * 2) - 1, Math.round((state.cerberus.y / T) * 2) - 1, 2, 2);
  }

  // Player dot
  const px = Math.round((state.player.x / T) * 2);
  const py = Math.round((state.player.y / T) * 2);
  mctx.fillStyle = "#120e1f";
  mctx.fillRect(px - 2, py - 2, 5, 5);
  mctx.fillStyle = pulse ? "#ffffff" : "#f2b84b";
  mctx.fillRect(px - 1, py - 1, 3, 3);
}

RQ.World = {
  render, renderMinimap, updateParticles,
  spawnHeart, spawnCyberHearts, spawnDust, spawnWarp, spawnCoin, spawnPaperPlane, spawnPondRipple, spawnBugCatch,
  triggerCelebration
};
})(window.RQ = window.RQ || {});
