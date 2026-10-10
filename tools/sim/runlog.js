const load=require('./load.js'); const vm=require('vm'); const fs=require('fs');
const ctx=load(); vm.runInContext(fs.readFileSync(__dirname+'/bot.js','utf8'),ctx,{filename:'bot'});
const hours=+process.argv[2]||6; const min=+process.argv[3]||0;
vm.runInContext(`runSim(${hours})`,ctx);
const B=vm.runInContext('BOT',ctx);
fs.writeFileSync(process.argv[4]||'log.txt', B.log.filter(x=>x[3]>=min).map(x=>`${String(Math.round(x[0]/60)).padStart(5)}m L${x[1]} ${x[2]} $${x[3]}`).join('\n'));
console.log('level times',JSON.stringify(B.lvlAt),'purchases',B.log.length);
