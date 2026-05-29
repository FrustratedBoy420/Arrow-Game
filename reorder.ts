import fs from 'fs';
import path from 'path';

// Read levels directly from the JSON file
const levelJsonPath = path.join(__dirname, 'src', 'levels', 'level.json');
const levelData = JSON.parse(fs.readFileSync(levelJsonPath, 'utf-8'));

const easies = levelData.filter((l: any) => l.difficulty === 'Easy');
const mediums = levelData.filter((l: any) => l.difficulty === 'Medium');
const hards = levelData.filter((l: any) => l.difficulty === 'Hard');
const experts = levelData.filter((l: any) => l.difficulty === 'Expert');

const queues = [easies, mediums, hards, experts];
const newLevels = [];
let queueIndex = 0;
const total = levelData.length;

while (newLevels.length < total) {
  for (let offset = 0; offset < queues.length; offset++) {
    const idx = (queueIndex + offset) % queues.length;
    const q = queues[idx];
    if (q && q.length > 0) {
      newLevels.push(q.shift()!);
      queueIndex = (idx + 1) % queues.length;
      break;
    }
  }
}

// Reassign IDs and Titles sequentially
newLevels.forEach((level, index) => {
  level.id = index + 1;
  level.title = `Level ${index + 1}`;
});

fs.writeFileSync(levelJsonPath, JSON.stringify(newLevels, null, 2), 'utf-8');
console.log('Successfully reordered levels inside level.json!');
