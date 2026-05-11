import fs from 'fs';
const levelsTs = fs.readFileSync('src/levels/levels.ts', 'utf8');
const lines = levelsTs.split('\n');
const newLevels = fs.readFileSync('new_expert_levels.txt', 'utf8');

const prefix = lines.slice(0, 138).join('\n');
const suffix = lines.slice(506).join('\n');

const out = prefix + '\n  // === EXPERT 31-50 ===\n' + newLevels + suffix;
fs.writeFileSync('src/levels/levels.ts', out);
console.log('Patched levels.ts');
