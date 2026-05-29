import { readFileSync } from 'fs';

const dv = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

function getExitDirection(arrow) {
  const fp = arrow.fullPath;
  if (fp.length < 2) return 'RIGHT';
  const last = fp[fp.length - 1];
  const prev = fp[fp.length - 2];
  const dx = last.x - prev.x;
  const dy = last.y - prev.y;
  if (dx > 0) return 'RIGHT';
  if (dx < 0) return 'LEFT';
  if (dy > 0) return 'DOWN';
  return 'UP';
}

function isInsideGrid(pos, gridSize) {
  return pos.x >= 0 && pos.y >= 0 && pos.x < gridSize.columns && pos.y < gridSize.rows;
}

function frontClear(arrow, arrows, gridSize) {
  const dir = getExitDirection(arrow);
  const v = dv[dir];
  const head = arrow.fullPath[arrow.fullPath.length - 1];
  let cursor = { x: head.x + v.x, y: head.y + v.y };

  const occupied = arrows
    .filter((a) => a.id !== arrow.id)
    .flatMap((a) => a.fullPath);

  while (isInsideGrid(cursor, gridSize)) {
    if (occupied.some((cell) => cell.x === cursor.x && cell.y === cursor.y)) {
      return false;
    }
    cursor = { x: cursor.x + v.x, y: cursor.y + v.y };
  }
  return true;
}

function checkOverlap(arrows) {
  const all = arrows.flatMap((a) => a.fullPath.map((c) => ({ ...c, id: a.id })));
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      if (all[i].x === all[j].x && all[i].y === all[j].y) {
        return `${all[i].id} & ${all[j].id} at (${all[i].x},${all[i].y})`;
      }
    }
  }
  return null;
}

const levels = JSON.parse(readFileSync('./src/levels/level.json', 'utf8'));
console.log('Levels count: ' + levels.length + '\n');

let ok = true;
for (const l of levels) {
  const overlap = checkOverlap(l.arrows);
  let rem = [...l.arrows];
  let order = [];
  let solvable = true;

  while (rem.length > 0) {
    const r = rem.find((a) => frontClear(a, rem, l.gridSize));
    if (!r) {
      solvable = false;
      break;
    }
    order.push(r.id);
    rem = rem.filter((x) => x.id !== r.id);
  }

  const s = solvable ? 'OK' : 'FAIL';
  const o = overlap ? 'OVERLAP: ' + overlap : 'no-overlap';
  console.log(`L${l.id} (${l.arrows.length} arr): ${s} | ${o} | ${solvable ? order.join('>') : ''}`);
  if (!solvable || overlap) ok = false;
}

console.log(ok ? '\nALL PASS' : 'SOME FAIL');
