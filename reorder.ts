import fs from 'fs';
import { levels } from './src/levels/levels.ts';

const easies = levels.filter(l => l.difficulty === 'Easy');
const mediums = levels.filter(l => l.difficulty === 'Medium');
const hards = levels.filter(l => l.difficulty === 'Hard');
const experts = levels.filter(l => l.difficulty === 'Expert');

const queues = [easies, mediums, hards, experts];
const newLevels = [];
let queueIndex = 0;
const total = levels.length;

while (newLevels.length < total) {
  for (let offset = 0; offset < queues.length; offset++) {
    const idx = (queueIndex + offset) % queues.length;
    const q = queues[idx];
    if (q.length > 0) {
      newLevels.push(q.shift()!);
      queueIndex = (idx + 1) % queues.length;
      break;
    }
  }
}

// Reassign IDs and Titles
newLevels.forEach((level, index) => {
  level.id = index + 1;
  level.title = `Level ${index + 1}`;
});

const fileContent = `import type { ArrowNode, LevelDefinition } from '../game/types';

export const levels: LevelDefinition[] = ${JSON.stringify(newLevels, null, 2)};

export function getLevel(id: number): LevelDefinition {
  const level = levels.find((l) => l.id === id);
  if (!level) throw new Error(\`Level \${id} not found\`);
  return level;
}

export function getTotalLevels(): number {
  return levels.length;
}

export function getNextLevelId(currentId: number): number {
  return currentId < levels.length ? currentId + 1 : currentId;
}
`;

fs.writeFileSync('./src/levels/levels.ts', fileContent, 'utf-8');
console.log('Successfully reordered levels!');
