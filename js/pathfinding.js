(function(RQ){
"use strict";

const D = RQ.DATA;
const { T, W, H, PLAZA, CROSS, inRect, isPath, hits } = D;

const size = W * H;
const walkable = new Uint8Array(size);
const tileCost = new Float32Array(size);

const idx = (tx, ty) => ty * W + tx;
const inBounds = (tx, ty) => tx >= 2 && tx < W - 2 && ty >= 2 && ty < H - 2;

for(let ty = 0; ty < H; ty++){
  for(let tx = 0; tx < W; tx++){
    const i = idx(tx, ty);
    if(!inBounds(tx, ty)){ walkable[i] = 0; tileCost[i] = 99; continue; }
    const cx = tx * T + 8, cy = ty * T + 11;
    walkable[i] = hits(cx, cy) ? 0 : 1;
    const paved = isPath(tx, ty) || inRect(PLAZA, tx, ty) || inRect(CROSS, tx, ty);
    tileCost[i] = paved ? 1.0 : 1.28;
  }
}

function nearestWalkable(tx, ty){
  tx = Math.max(2, Math.min(W - 3, tx));
  ty = Math.max(2, Math.min(H - 3, ty));
  if(walkable[idx(tx, ty)]) return [tx, ty];
  for(let r = 1; r <= 6; r++){
    let best = null, bestD = Infinity;
    for(let dy = -r; dy <= r; dy++){
      for(let dx = -r; dx <= r; dx++){
        if(Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const nx = tx + dx, ny = ty + dy;
        if(inBounds(nx, ny) && walkable[idx(nx, ny)]){
          const d = dx*dx + dy*dy;
          if(d < bestD){ bestD = d; best = [nx, ny]; }
        }
      }
    }
    if(best) return best;
  }
  return null;
}

const DIRS = [
  [1,0,1], [-1,0,1], [0,1,1], [0,-1,1],
  [1,1,1.414], [-1,1,1.414], [1,-1,1.414], [-1,-1,1.414]
];

function findPath(sx, sy, gx, gy){
  const st = nearestWalkable(Math.floor(sx / T), Math.floor((sy - 3) / T));
  const gl = nearestWalkable(Math.floor(gx / T), Math.floor((gy - 3) / T));
  if(!st || !gl) return [];
  const [stx, sty] = st, [gtx, gty] = gl;

  // Same tile: go straight if clear
  if(stx === gtx && sty === gty){
    if(!hits(gx, gy)) return [{x: gx, y: gy}];
    return [{x: gtx * T + 8, y: gty * T + 11}];
  }

  const gScore = new Float32Array(size);
  const fScore = new Float32Array(size);
  const cameFrom = new Int32Array(size);
  const closed = new Uint8Array(size);
  const inOpen = new Uint8Array(size);
  gScore.fill(Infinity);
  cameFrom.fill(-1);

  const startI = idx(stx, sty);
  const goalI = idx(gtx, gty);
  gScore[startI] = 0;
  fScore[startI] = Math.hypot(gtx - stx, gty - sty);

  const open = [startI];
  inOpen[startI] = 1;

  while(open.length){
    let bestPos = 0, bestF = fScore[open[0]];
    for(let i = 1; i < open.length; i++){
      const f = fScore[open[i]];
      if(f < bestF){ bestF = f; bestPos = i; }
    }
    const curr = open[bestPos];
    open[bestPos] = open[open.length - 1];
    open.pop();
    inOpen[curr] = 0;

    if(curr === goalI) break;
    closed[curr] = 1;

    const cx = curr % W, cy = (curr / W) | 0;
    for(let d = 0; d < DIRS.length; d++){
      const [dx, dy, dist] = DIRS[d];
      const nx = cx + dx, ny = cy + dy;
      if(!inBounds(nx, ny)) continue;
      const ni = idx(nx, ny);
      if(!walkable[ni] || closed[ni]) continue;
      // Prevent corner clipping on diagonals
      if(dx !== 0 && dy !== 0){
        if(!walkable[idx(cx + dx, cy)] || !walkable[idx(cx, cy + dy)]) continue;
      }
      const tentative = gScore[curr] + dist * tileCost[ni];
      if(tentative < gScore[ni]){
        cameFrom[ni] = curr;
        gScore[ni] = tentative;
        fScore[ni] = tentative + Math.hypot(gtx - nx, gty - ny);
        if(!inOpen[ni]){
          open.push(ni);
          inOpen[ni] = 1;
        }
      }
    }
  }

  if(cameFrom[goalI] === -1) return [];

  const tiles = [];
  let cur = goalI;
  while(cur !== -1 && cur !== startI){
    tiles.push([cur % W, (cur / W) | 0]);
    cur = cameFrom[cur];
  }
  tiles.reverse();

  // Remove redundant collinear intermediate tiles
  const pruned = [];
  for(let i = 0; i < tiles.length; i++){
    const prev = i === 0 ? [stx, sty] : tiles[i - 1];
    const curr = tiles[i];
    const next = tiles[i + 1];
    if(next){
      const dx1 = curr[0] - prev[0], dy1 = curr[1] - prev[1];
      const dx2 = next[0] - curr[0], dy2 = next[1] - curr[1];
      if(dx1 === dx2 && dy1 === dy2) continue;
    }
    pruned.push({x: curr[0] * T + 8, y: curr[1] * T + 11});
  }

  // Replace last waypoint with exact pixel coordinate if walkable
  if(!hits(gx, gy)){
    if(pruned.length) pruned[pruned.length - 1] = {x: gx, y: gy};
    else pruned.push({x: gx, y: gy});
  }
  return pruned;
}

RQ.Path = { findPath, walkable };
})(window.RQ = window.RQ || {});
