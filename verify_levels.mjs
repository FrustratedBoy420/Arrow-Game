import { readFileSync } from 'fs';
const dv = { UP:{x:0,y:-1}, DOWN:{x:0,y:1}, LEFT:{x:-1,y:0}, RIGHT:{x:1,y:0} };
function cells(a){ const v=dv[a.direction]; return Array.from({length:a.length},(_,i)=>({x:a.position.x+v.x*i,y:a.position.y+v.y*i})); }
function head(a){ const c=cells(a); return c[c.length-1]; }
function inside(p,l){ return p.x>=0&&p.y>=0&&p.x<l.gridSize.columns&&p.y<l.gridSize.rows; }
function frontClear(arrow,arrows,level){
  const v=dv[arrow.direction], h=head(arrow);
  let c={x:h.x+v.x,y:h.y+v.y};
  const occ=arrows.filter(a=>a.id!==arrow.id).flatMap(a=>cells(a));
  while(inside(c,level)){if(occ.some(o=>o.x===c.x&&o.y===c.y))return false;c={x:c.x+v.x,y:c.y+v.y};}
  return true;
}
function checkOverlap(arrows){
  const all=arrows.flatMap(a=>cells(a).map(c=>({...c,id:a.id})));
  for(let i=0;i<all.length;i++) for(let j=i+1;j<all.length;j++)
    if(all[i].x===all[j].x&&all[i].y===all[j].y) return `${all[i].id} & ${all[j].id} at (${all[i].x},${all[i].y})`;
  return null;
}
const src=readFileSync('d:/WORK_RELATED/Arrow-Game/src/levels/levels.ts','utf8');
const blocks=src.split(/\{\s*id:\s*(\d+)/g).slice(1);
const lvls=[];
for(let i=0;i<blocks.length;i+=2){
  const id=parseInt(blocks[i]),b=blocks[i+1];
  const gm=b.match(/columns:\s*(\d+),\s*rows:\s*(\d+)/); if(!gm)continue;
  const arrows=[]; let m;
  const re=/a\('([^']+)','([^']+)',(\d+),(\d+),(\d+)\)/g;
  while((m=re.exec(b))!==null) arrows.push({id:m[1],direction:m[2],length:+m[3],position:{x:+m[4],y:+m[5]}});
  lvls.push({id,gridSize:{columns:+gm[1],rows:+gm[2]},arrows});
}
console.log('Levels: '+lvls.length+'\n');
let ok=true;
for(const l of lvls){
  const overlap=checkOverlap(l.arrows);
  let rem=[...l.arrows],order=[],solvable=true;
  while(rem.length>0){const r=rem.find(a=>frontClear(a,rem,l));if(!r){solvable=false;break;}order.push(r.id);rem=rem.filter(x=>x.id!==r.id);}
  const s=solvable?'OK':'FAIL';
  const o=overlap?'OVERLAP:'+overlap:'no-overlap';
  console.log(`L${l.id} (${l.arrows.length}arr): ${s} | ${o} | ${solvable?order.join('>'):''}`);
  if(!solvable||overlap)ok=false;
}
console.log(ok?'\nALL PASS':'SOME FAIL');
