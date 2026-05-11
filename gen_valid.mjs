import { writeFileSync } from 'fs';

const DIRS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const dv = { UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 }, LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 } };

const cells = (a) => {
  const v = dv[a.d];
  return Array.from({ length: a.l }, (_, i) => ({ x: a.x + v.x * i, y: a.y + v.y * i }));
};

const head = (a) => {
  const c = cells(a);
  return c[c.length - 1];
};

const inside = (p, C, R) => p.x >= 0 && p.y >= 0 && p.x < C && p.y < R;

const noOverlap = (arrows, C, R) => {
  const grid = new Set();
  for (const a of arrows) {
    for (const c of cells(a)) {
      if (!inside(c, C, R)) return false;
      const key = `${c.x},${c.y}`;
      if (grid.has(key)) return false;
      grid.add(key);
    }
  }
  return true;
};

const solvable = (arrows, C, R) => {
  let rem = [...arrows];
  while (rem.length > 0) {
    const r = rem.find(a => {
      const v = dv[a.d];
      const h = head(a);
      let c = { x: h.x + v.x, y: h.y + v.y };
      const occ = new Set();
      for (const x of rem) {
        if (x !== a) {
          for (const cell of cells(x)) occ.add(`${cell.x},${cell.y}`);
        }
      }
      while (inside(c, C, R)) {
        if (occ.has(`${c.x},${c.y}`)) return false;
        c = { x: c.x + v.x, y: c.y + v.y };
      }
      return true;
    });
    if (!r) return false;
    rem = rem.filter(x => x !== r);
  }
  return true;
};

// Ensure there is at least some complexity (some arrows block others)
const isComplex = (arrows, C, R) => {
  let rem = [...arrows];
  let steps = 0;
  while (rem.length > 0) {
    const clearArrows = rem.filter(a => {
      const v = dv[a.d];
      const h = head(a);
      let c = { x: h.x + v.x, y: h.y + v.y };
      const occ = new Set();
      for (const x of rem) {
        if (x !== a) {
          for (const cell of cells(x)) occ.add(`${cell.x},${cell.y}`);
        }
      }
      while (inside(c, C, R)) {
        if (occ.has(`${c.x},${c.y}`)) return false;
        c = { x: c.x + v.x, y: c.y + v.y };
      }
      return true;
    });
    if (clearArrows.length === rem.length && steps === 0) return false; // all clear from start
    if (clearArrows.length === 0) return false;
    // Just remove one to simulate game
    rem = rem.filter(x => x !== clearArrows[0]);
    steps++;
  }
  return steps > Math.floor(arrows.length / 2);
};

function generateLevel(id, C, R, numArrows) {
  let attempts = 0;
  while (true) {
    attempts++;
    const arrows = [];
    for (let i = 0; i < numArrows; i++) {
      arrows.push({
        id: `${id}${String.fromCharCode(97 + (i % 26))}${i >= 26 ? Math.floor(i/26) : ''}`,
        d: DIRS[Math.floor(Math.random() * DIRS.length)],
        l: Math.floor(Math.random() * 3) + 2, // length 2 to 4
        x: Math.floor(Math.random() * C),
        y: Math.floor(Math.random() * R)
      });
    }
    if (noOverlap(arrows, C, R) && solvable(arrows, C, R) && isComplex(arrows, C, R)) {
      console.log(`Generated L${id} in ${attempts} attempts`);
      return { id, C, R, arrs: arrows };
    }
  }
}

const levels = [];
for (let i = 31; i <= 50; i++) {
  let C = 12 + Math.floor((i - 31) / 3);
  let R = 10 + Math.floor((i - 31) / 3);
  let N = 10 + Math.floor((i - 31) / 2);
  levels.push(generateLevel(i, C, R, N));
}

let out = '';
for (const lv of levels) {
  const arrs = lv.arrs.map(x => `a('${x.id}','${x.d}',${x.l},${x.x},${x.y})`).join(', ');
  out += `  { id:${lv.id}, title:'Level ${lv.id}', difficulty:'Expert', gridSize:{columns:${lv.C},rows:${lv.R}},\n    arrows:[${arrs}] },\n`;
}
writeFileSync('new_expert_levels.txt', out);
