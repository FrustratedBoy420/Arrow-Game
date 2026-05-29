// Quick overlap checker — prints which arrows overlap in level.json
import { readFileSync } from 'fs';

function checkOverlaps(level) {
  const all = level.arrows.flatMap(a => a.fullPath.map(c => ({ ...c, id: a.id })));
  let found = false;
  
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      if (all[i].x === all[j].x && all[i].y === all[j].y) {
        console.log(`Level ${level.id} (${level.title}): ${all[i].id} & ${all[j].id} overlap at (${all[i].x},${all[i].y})`);
        found = true;
      }
    }
  }
  
  if (!found) {
    console.log(`Level ${level.id} (${level.title}): no overlaps`);
  }
}

try {
  const levels = JSON.parse(readFileSync('./src/levels/level.json', 'utf8'));
  for (const lvl of levels) {
    checkOverlaps(lvl);
  }
} catch (err) {
  console.error('Error:', err.message);
}
