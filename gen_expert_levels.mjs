// Generates valid Expert levels 31-50 using a proven template
// Construction: "frame + chain" — frame arrows form outer shell, chain arrows inside
import { writeFileSync } from 'fs';

const dv={UP:{x:0,y:-1},DOWN:{x:0,y:1},LEFT:{x:-1,y:0},RIGHT:{x:1,y:0}};
const cells=a=>{const v=dv[a.d];return Array.from({length:a.l},(_,i)=>({x:a.x+v.x*i,y:a.y+v.y*i}));};
const head=a=>{const c=cells(a);return c[c.length-1];};
const inside=(p,C,R)=>p.x>=0&&p.y>=0&&p.x<C&&p.y<R;
const noOverlap=arrows=>{
  const all=arrows.flatMap((a,i)=>cells(a).map(c=>({...c,i})));
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++)
    if(all[i].x===all[j].x&&all[i].y===all[j].y&&all[i].i!==all[j].i)
      return `${arrows[all[i].i].id}&${arrows[all[j].i].id}@(${all[i].x},${all[i].y})`;
  return null;
};
const solvable=(arrows,C,R,dbg=false)=>{
  let rem=[...arrows];
  while(rem.length){
    const r=rem.find(a=>{
      const v=dv[a.d],h=head(a);let c={x:h.x+v.x,y:h.y+v.y};
      const occ=rem.filter(x=>x!==a).flatMap(cells);
      while(inside(c,C,R)){if(occ.some(o=>o.x===c.x&&o.y===c.y))return false;c={x:c.x+v.x,y:c.y+v.y};}
      return true;
    });
    if(!r){if(dbg)console.log('STUCK:',rem.map(x=>`${x.id}(${x.d},${x.l},${x.x},${x.y})`));return false;}
    rem=rem.filter(x=>x!==r);
  }
  return true;
};
const a=(id,d,l,x,y)=>({id,d,l,x,y});
const check=(id,C,R,arrs)=>{
  const ov=noOverlap(arrs);if(ov){console.error(`L${id} OVERLAP:${ov}`);process.exit(1);}
  if(!solvable(arrs,C,R,id===34)){console.error(`L${id} NOT SOLVABLE`);process.exit(1);}
  return {id,C,R,arrs};
};

// Template: each level uses a "frame" of 4 outer arrows + N inner arrows
// Frame: A=RIGHT(top), B=DOWN(right-col), E=RIGHT(mid-left), F=DOWN(mid-col) [inner pair 1]
// + more inner pairs. Frame arrows proven non-overlapping by construction.
// Key rule: all arrows use distinct rows (for H) and distinct columns (for V).

const levels=[
// L31: 12×10, 10 arrows
check(31,12,10,[
  a('31a','RIGHT',4, 7,0), a('31b','DOWN', 4,11,0),
  a('31c','LEFT', 3, 9,3), a('31d','UP',   4,10,7),
  a('31e','RIGHT',3, 0,6), a('31f','DOWN', 3, 4,3),
  a('31g','LEFT', 3, 8,8), a('31h','UP',   2, 6,7),
  a('31i','RIGHT',2, 5,9), a('31j','DOWN', 2, 2,1),
]),
// L32: 12×10, 11 arrows
check(32,12,10,[
  a('32a','RIGHT',4, 7,0), a('32b','DOWN', 4, 0,0),
  a('32c','LEFT', 3, 9,3), a('32d','UP',   3,11,6),
  a('32e','RIGHT',3, 0,6), a('32f','DOWN', 3, 4,3),
  a('32g','LEFT', 2, 8,8), a('32h','UP',   2, 6,7),
  a('32i','RIGHT',2, 5,9), a('32j','DOWN', 2, 9,1),
  a('32k','LEFT', 2, 3,1),
]),
// L33: 13×11, 11 arrows
check(33,13,11,[
  a('33a','RIGHT',4, 8,0), a('33b','DOWN', 4, 0,0),
  a('33c','LEFT', 4,10,3), a('33d','UP',   4,12,7),
  a('33e','RIGHT',3, 0,6), a('33f','DOWN', 3, 5,3),
  a('33g','LEFT', 3, 9,9), a('33h','UP',   2, 7,8),
  a('33i','RIGHT',2, 6,10),a('33j','DOWN', 2,10,1),
  a('33k','LEFT', 2, 3,1),
]),
// L34: 13×11, 12 arrows
check(34,13,11,[
  a('34a','RIGHT',4, 8,0), a('34b','DOWN', 5, 0,0),
  a('34c','LEFT', 4,10,4), a('34d','UP',   4,12,8),
  a('34e','RIGHT',3, 1,7), a('34f','DOWN', 3, 5,4),
  a('34g','LEFT', 3, 9,9), a('34h','UP',   2, 7,8),
  a('34i','RIGHT',2, 6,10),a('34j','DOWN', 2,10,1),
  a('34k','LEFT', 2, 3,1), a('34l','RIGHT',2, 1,5),
]),
// L35: 14×12, 12 arrows
check(35,14,12,[
  a('35a','RIGHT',4, 9,0), a('35b','DOWN', 5, 0,0),
  a('35c','LEFT', 4,11,4), a('35d','UP',   4,13,8),
  a('35e','RIGHT',3, 0,7), a('35f','DOWN', 3, 5,4),
  a('35g','LEFT', 3,10,10),a('35h','UP',   2, 8,9),
  a('35i','RIGHT',2, 7,11),a('35j','DOWN', 2,11,1),
  a('35k','LEFT', 2, 3,1), a('35l','UP',   2, 2,5),
]),
// L36: 14×12, 13 arrows
check(36,14,12,[
  a('36a','RIGHT',4, 9,0), a('36b','DOWN', 5, 0,0),
  a('36c','LEFT', 4,11,4), a('36d','UP',   4,13,8),
  a('36e','RIGHT',3, 0,8), a('36f','DOWN', 3, 6,4),
  a('36g','LEFT', 3,10,10),a('36h','UP',   2, 8,9),
  a('36i','RIGHT',2, 7,11),a('36j','DOWN', 2,11,1),
  a('36k','LEFT', 2, 3,1), a('36l','UP',   2, 2,5),
  a('36m','RIGHT',2, 4,6),
]),
// L37: 15×13, 13 arrows
check(37,15,13,[
  a('37a','RIGHT',4,10,0), a('37b','DOWN', 5, 0,0),
  a('37c','LEFT', 4,12,4), a('37d','UP',   5,14,9),
  a('37e','RIGHT',3, 0,8), a('37f','DOWN', 3, 6,4),
  a('37g','LEFT', 3,11,11),a('37h','UP',   2, 9,10),
  a('37i','RIGHT',2, 8,12),a('37j','DOWN', 2,12,1),
  a('37k','LEFT', 2, 3,1), a('37l','UP',   2, 2,5),
  a('37m','RIGHT',2, 4,6),
]),
// L38: 15×13, 14 arrows
check(38,15,13,[
  a('38a','RIGHT',4,10,0), a('38b','DOWN', 5, 0,0),
  a('38c','LEFT', 4,12,4), a('38d','UP',   5,14,9),
  a('38e','RIGHT',3, 0,8), a('38f','DOWN', 3, 6,4),
  a('38g','LEFT', 3,11,11),a('38h','UP',   2, 9,10),
  a('38i','RIGHT',2, 8,12),a('38j','DOWN', 2,12,1),
  a('38k','LEFT', 2, 3,1), a('38l','UP',   2, 2,5),
  a('38m','RIGHT',2, 4,6), a('38n','DOWN', 2,13,7),
]),
// L39: 16×13, 14 arrows
check(39,16,13,[
  a('39a','RIGHT',4,11,0), a('39b','DOWN', 5, 0,0),
  a('39c','LEFT', 4,13,4), a('39d','UP',   5,15,9),
  a('39e','RIGHT',3, 0,8), a('39f','DOWN', 3, 7,4),
  a('39g','LEFT', 3,12,11),a('39h','UP',   2,10,10),
  a('39i','RIGHT',2, 9,12),a('39j','DOWN', 2,13,1),
  a('39k','LEFT', 2, 3,1), a('39l','UP',   2, 2,5),
  a('39m','RIGHT',2, 4,6), a('39n','DOWN', 2,14,7),
]),
// L40: 16×13, 15 arrows
check(40,16,13,[
  a('40a','RIGHT',4,11,0), a('40b','DOWN', 5, 0,0),
  a('40c','LEFT', 4,13,4), a('40d','UP',   5,15,9),
  a('40e','RIGHT',3, 0,8), a('40f','DOWN', 3, 7,4),
  a('40g','LEFT', 3,12,11),a('40h','UP',   2,10,10),
  a('40i','RIGHT',2, 9,12),a('40j','DOWN', 2,13,1),
  a('40k','LEFT', 2, 3,1), a('40l','UP',   2, 2,5),
  a('40m','RIGHT',2, 4,6), a('40n','DOWN', 2,14,7),
  a('40o','LEFT', 2, 5,9),
]),
// L41: 16×14, 15 arrows
check(41,16,14,[
  a('41a','RIGHT',5,10,0), a('41b','DOWN', 5, 0,0),
  a('41c','LEFT', 4,13,4), a('41d','UP',   5,15,10),
  a('41e','RIGHT',3, 0,9), a('41f','DOWN', 3, 7,4),
  a('41g','LEFT', 3,12,12),a('41h','UP',   2,10,11),
  a('41i','RIGHT',2, 9,13),a('41j','DOWN', 2,13,1),
  a('41k','LEFT', 2, 3,1), a('41l','UP',   2, 2,5),
  a('41m','RIGHT',2, 4,6), a('41n','DOWN', 2,14,8),
  a('41o','LEFT', 2, 6,9),
]),
// L42: 17×14, 16 arrows
check(42,17,14,[
  a('42a','RIGHT',5,11,0), a('42b','DOWN', 5, 0,0),
  a('42c','LEFT', 4,14,4), a('42d','UP',   5,16,10),
  a('42e','RIGHT',3, 0,9), a('42f','DOWN', 3, 7,4),
  a('42g','LEFT', 3,13,12),a('42h','UP',   2,11,11),
  a('42i','RIGHT',2,10,13),a('42j','DOWN', 2,14,1),
  a('42k','LEFT', 2, 3,1), a('42l','UP',   2, 2,5),
  a('42m','RIGHT',2, 4,6), a('42n','DOWN', 2,15,8),
  a('42o','LEFT', 2, 6,9), a('42p','UP',   2, 9,10),
]),
// L43: 17×14, 16 arrows
check(43,17,14,[
  a('43a','RIGHT',5,11,0), a('43b','DOWN', 5, 0,0),
  a('43c','LEFT', 4,14,4), a('43d','UP',   5,16,10),
  a('43e','RIGHT',3, 0,10),a('43f','DOWN', 3, 8,4),
  a('43g','LEFT', 3,13,12),a('43h','UP',   2,11,11),
  a('43i','RIGHT',2,10,13),a('43j','DOWN', 2,14,1),
  a('43k','LEFT', 2, 3,1), a('43l','RIGHT',2, 1,5),
  a('43m','RIGHT',2, 4,6), a('43n','DOWN', 2,15,8),
  a('43o','LEFT', 2, 6,10),a('43p','UP',   2, 9,10),
]),
// L44: 18×15, 17 arrows
check(44,18,15,[
  a('44a','RIGHT',5,12,0), a('44b','DOWN', 5, 0,0),
  a('44c','LEFT', 4,15,4), a('44d','UP',   5,17,11),
  a('44e','RIGHT',3, 0,10),a('44f','DOWN', 3, 8,4),
  a('44g','LEFT', 3,14,13),a('44h','UP',   2,12,12),
  a('44i','RIGHT',2,11,14),a('44j','DOWN', 2,15,1),
  a('44k','LEFT', 2, 3,1), a('44l','UP',   2, 2,5),
  a('44m','RIGHT',2, 4,6), a('44n','DOWN', 2,16,9),
  a('44o','LEFT', 2, 6,10),a('44p','UP',   2, 9,10),
  a('44q','RIGHT',2,10,8),
]),
// L45: 18×15, 17 arrows
check(45,18,15,[
  a('45a','RIGHT',5,12,0), a('45b','DOWN', 5, 0,0),
  a('45c','LEFT', 4,15,4), a('45d','UP',   5,17,11),
  a('45e','RIGHT',3, 0,11),a('45f','DOWN', 3, 9,4),
  a('45g','LEFT', 3,14,13),a('45h','UP',   2,12,12),
  a('45i','RIGHT',2,11,14),a('45j','DOWN', 2,15,1),
  a('45k','LEFT', 2, 3,1), a('45l','UP',   2, 2,5),
  a('45m','RIGHT',2, 4,6), a('45n','DOWN', 2,16,9),
  a('45o','LEFT', 2, 6,11),a('45p','UP',   2,10,10),
  a('45q','RIGHT',2,11,8),
]),
// L46: 18×16, 18 arrows
check(46,18,16,[
  a('46a','RIGHT',5,12,0), a('46b','DOWN', 6, 0,0),
  a('46c','LEFT', 4,15,5), a('46d','UP',   5,17,12),
  a('46e','RIGHT',3, 0,11),a('46f','DOWN', 3, 9,5),
  a('46g','LEFT', 3,14,14),a('46h','UP',   2,12,13),
  a('46i','RIGHT',2,11,15),a('46j','DOWN', 2,15,1),
  a('46k','LEFT', 2, 3,1), a('46l','UP',   2, 2,6),
  a('46m','RIGHT',2, 4,7), a('46n','DOWN', 2,16,10),
  a('46o','LEFT', 2, 6,11),a('46p','UP',   2,10,11),
  a('46q','RIGHT',2,11,9), a('46r','DOWN', 2, 7,13),
]),
// L47: 19×16, 18 arrows
check(47,19,16,[
  a('47a','RIGHT',5,13,0), a('47b','DOWN', 6, 0,0),
  a('47c','LEFT', 4,16,5), a('47d','UP',   5,18,12),
  a('47e','RIGHT',3, 0,11),a('47f','DOWN', 3,10,5),
  a('47g','LEFT', 3,15,14),a('47h','UP',   2,13,13),
  a('47i','RIGHT',2,12,15),a('47j','DOWN', 2,16,1),
  a('47k','LEFT', 2, 3,1), a('47l','UP',   2, 2,6),
  a('47m','RIGHT',2, 4,7), a('47n','DOWN', 2,17,10),
  a('47o','LEFT', 2, 6,11),a('47p','UP',   2,11,11),
  a('47q','RIGHT',2,12,9), a('47r','DOWN', 2, 8,13),
]),
// L48: 19×17, 19 arrows
check(48,19,17,[
  a('48a','RIGHT',5,13,0), a('48b','DOWN', 6, 0,0),
  a('48c','LEFT', 4,16,5), a('48d','UP',   6,18,12),
  a('48e','RIGHT',3, 0,12),a('48f','DOWN', 3,10,5),
  a('48g','LEFT', 3,15,15),a('48h','UP',   2,13,14),
  a('48i','RIGHT',2,12,16),a('48j','DOWN', 2,16,1),
  a('48k','LEFT', 2, 3,1), a('48l','UP',   2, 2,6),
  a('48m','RIGHT',2, 4,7), a('48n','DOWN', 2,17,11),
  a('48o','LEFT', 2, 6,12),a('48p','UP',   2,11,12),
  a('48q','RIGHT',2,12,10),a('48r','DOWN', 2, 8,14),
  a('48s','LEFT', 2, 9,6),
]),
// L49: 20×17, 19 arrows
check(49,20,17,[
  a('49a','RIGHT',5,14,0), a('49b','DOWN', 6, 0,0),
  a('49c','LEFT', 4,17,5), a('49d','UP',   6,19,12),
  a('49e','RIGHT',3, 0,12),a('49f','DOWN', 3,11,5),
  a('49g','LEFT', 3,16,15),a('49h','UP',   2,14,14),
  a('49i','RIGHT',2,13,16),a('49j','DOWN', 2,17,1),
  a('49k','LEFT', 2, 3,1), a('49l','UP',   2, 2,6),
  a('49m','RIGHT',2, 4,7), a('49n','DOWN', 2,18,11),
  a('49o','LEFT', 2, 6,12),a('49p','UP',   2,12,12),
  a('49q','RIGHT',2,13,10),a('49r','DOWN', 2, 9,14),
  a('49s','LEFT', 2,10,6),
]),
// L50: 20×18, 20 arrows
check(50,20,18,[
  a('50a','RIGHT',5,14,0), a('50b','DOWN', 6, 0,0),
  a('50c','LEFT', 4,17,5), a('50d','UP',   6,19,13),
  a('50e','RIGHT',3, 0,13),a('50f','DOWN', 3,11,5),
  a('50g','LEFT', 3,16,16),a('50h','UP',   2,14,15),
  a('50i','RIGHT',2,13,17),a('50j','DOWN', 2,17,1),
  a('50k','LEFT', 2, 3,1), a('50l','UP',   2, 2,6),
  a('50m','RIGHT',2, 4,7), a('50n','DOWN', 2,18,12),
  a('50o','LEFT', 2, 6,13),a('50p','UP',   2,12,13),
  a('50q','RIGHT',2,13,11),a('50r','DOWN', 2, 9,15),
  a('50s','LEFT', 2,10,6), a('50t','UP',   2,15,14),
]),
];

// Output TypeScript
let out='';
for(const lv of levels){
  const arrs=lv.arrs.map(x=>`a('${x.id}','${x.d}',${x.l},${x.x},${x.y})`).join(', ');
  out+=`  { id:${lv.id}, title:'Level ${lv.id}', difficulty:'Expert', gridSize:{columns:${lv.C},rows:${lv.R}},\n    arrows:[${arrs}] },\n`;
}
writeFileSync('expert_levels_output.txt', out);
console.log('ALL VALID — written to expert_levels_output.txt');
