/* loads the game logic into a VM context (no DOM) */
const fs=require('fs'),vm=require('vm');
module.exports = function load(root){
  root = root || '/home/user/FishTycoon/js/';
  const ctx={console,Math,Date,JSON,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0}}; ctx.window=ctx; vm.createContext(ctx); let _s=(+process.env.SEED||1)>>>0; ctx.Math=Object.create(Math); ctx.Math.random=function(){ _s=(_s+0x6D2B79F5)>>>0; let t=_s; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
  for(const f of ['data','fish','events','expdata','game','game2','game3','research','campaign_logic','economy','game4']){
    let src = f==='campaign_logic' ? fs.readFileSync(root+'campaign.js','utf8').split('/* ---------- island models')[0] : fs.readFileSync(root+f+'.js','utf8');
    vm.runInContext(src.replace(/^'use strict';/,''),ctx,{filename:f});
  }
  return ctx;
};
