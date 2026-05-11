// Quick overlap checker — prints which arrows overlap for debugging
const dv = { UP:{x:0,y:-1}, DOWN:{x:0,y:1}, LEFT:{x:-1,y:0}, RIGHT:{x:1,y:0} };
function cells(a){ const v=dv[a.d]; return Array.from({length:a.l},(_,i)=>({x:a.x+v.x*i,y:a.y+v.y*i})); }

function checkAll(id, cols, rows, defs) {
  const arrows = defs.map(([id,d,l,x,y])=>({id,d,l,x,y}));
  const all = arrows.flatMap(a=>cells(a).map(c=>({...c,id:a.id})));
  let found=false;
  for(let i=0;i<all.length;i++) for(let j=i+1;j<all.length;j++)
    if(all[i].x===all[j].x&&all[i].y===all[j].y&&all[i].id!==all[j].id){
      console.log(`L${id}: ${all[i].id} & ${all[j].id} overlap at (${all[i].x},${all[i].y})`);
      found=true;
    }
  if(!found) console.log(`L${id}: no overlap`);
}

// L31 - check
checkAll(31,12,10,[
  ['31a','RIGHT',5, 6,0],  // (6,0)(7,0)(8,0)(9,0)(10,0)
  ['31b','DOWN', 4, 1,0],  // (1,0)(1,1)(1,2)(1,3)
  ['31c','LEFT', 3, 6,4],  // (6,4)(5,4)(4,4)
  ['31d','UP',   3,10,7],  // (10,7)(10,6)(10,5)
  ['31e','RIGHT',3, 0,5],  // (0,5)(1,5)(2,5)
  ['31f','DOWN', 3, 3,3],  // (3,3)(3,4)(3,5)  ← does (3,5) conflict with 31e? 31e: (0,5)(1,5)(2,5) no!
  ['31g','LEFT', 3, 8,8],  // (8,8)(7,8)(6,8)
  ['31h','UP',   2, 2,6],  // (2,6)(2,5)  ← (2,5) same as 31e(2,5)! CONFLICT
  ['31i','RIGHT',2, 5,9],
  ['31j','DOWN', 2, 9,1],
]);
