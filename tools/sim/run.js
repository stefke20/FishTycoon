const load=require('./load.js'); const vm=require('vm'); const fs=require('fs');
const ctx=load(process.argv[3]||undefined);
vm.runInContext(fs.readFileSync(__dirname+'/bot.js','utf8'),ctx,{filename:'bot'});
const hours=+process.argv[2]||2;
const t0=Date.now();
const rows=vm.runInContext(`runSim(${hours})`,ctx);
const B=vm.runInContext('BOT',ctx);
console.log('sim wall seconds',(Date.now()-t0)/1000);
console.log('min lvl money sales earn/h tanks fish cases ads');
rows.forEach(r=>{ if(r.t%(hours>6?60:30)===0||r.t===10) console.log(String(r.t).padStart(5),r.lvl,String(r.money).padStart(12),String(r.sales).padStart(6),String(r.earnH).padStart(12),r.tanks,r.fish,r.cases,r.ads); });
console.log('level times (min)',JSON.stringify(B.lvlAt));
console.log('earned at level start',JSON.stringify(B.lvlEarn),'\nspent',JSON.stringify(B.lvlSpent));
console.log('milestones (min)',JSON.stringify(B.ms));
console.log('eggs bought',B.eggsBought,'egg spend',Math.round(B.eggSpend||0),'cust rev',Math.round(B.custRev||0),'market sold',B.marketSold,'market rev',Math.round(B.marketRev||0));
if(process.argv[4]) { console.log(B.log.map(x=>`${Math.round(x[0]/60)}m L${x[1]} ${x[2]} $${x[3]}`).join('\n')); }
