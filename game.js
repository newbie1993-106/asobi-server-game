Warning: truncated output (original token count: 2122)
Total output lines: 66

"use strict";
const $ = (s) => document.querySelector(s);
const routeNames = { "106":"🟦 106", "1993":"🟩 1993", third:"🟪 第三", true:"🌟 TRUE ROUTE" };
const labels = { population:"👥 人口", maintenance:"🛠 保守", security:"🛡 治安", autonomy:"🏛 自治" };
const state = { route:null, day:1, stats:{}, dStreak:0, migration:0, survival:0, mystery:false, ended:false, trueStats:null };

function cap(v){ return Math.max(0, Math.min(100, v)); }
function finiteEntries(stats){ return Object.entries(stats).filter(([,v]) => v !== Infinity); }
function setMessage(text){ $("#message").textContent = text; }
function start(route){
  state.route=route; state.day=1; state.dStreak=0; state.migration=0; state.survival=0; state.mystery=false; state.ended=false; state.trueStats=null;
  state.stats = route === "106" ? {population:80,maintenance:Infinity,security:50,autonomy:40} : route === "1993" ? {population:50,maintenance:40,security:80,autonomy:Infinity} : {population:40,maintenance:40,security:70,autonomy:60};
  $("#route-select").classList.add("hidden"); $("#game-area").classList.remove("hidden"); render();
  setMessage(`${routeNames[route]}の運営を引き受けた。毎日の選択が、鯖の未来を決める。`);
}
function objective(){
  if(state.route === "106") return "人口を守り続けよう。<br><b>目標：</b>DAY10以降、人口を一定以上で維持する。";
  if(state.route === "1993") return `受け入れ体制を整えよう。<br><b>目標：</b>DAY10以降に移行を進める。 ${state.day>=10?`（進行 ${state.migration}/5）`:""}`;
  if(state.route === "third") return "新しい鯖を育てよう。<br><b>目標：</b>4つの力を、すべて十分な水準まで高める。";
  return "二つの鯖を、同時に維持する。<br><b>目標：</b>共存の道を探す。";
}
function renderStats(stats, trueMode=false){
  $("#status-grid").innerHTML = Object.entries(stats).map(([key,value]) => { const low=value !== Inf…1122 tokens truncated…e("二つの鯖を共存させる道を選んだ。だが、人口は足りない。 ");render(); }
function trueChoices(){return [["A","106を支援する","106人口 +2（通常の1/10）"],["B","1993を支援する","1993人口 +1（通常の1/10）"],["D","何もしない","両方を見守る"]];}
function applyTrue(action){ const s=state.trueStats;if(action==="A")s.population106=cap(s.population106+2);if(action==="B")s.population1993=cap(s.population1993+1);s.population106=cap(s.population106-6);s.population1993=cap(s.population1993-6);if(s.population106>=100&&s.population1993>=100){end(false,"⚠ SYSTEM ERROR\n\nこのルートはクリアを想定されていません。間違いなく不具合ですので、ぬーんに連絡してください。");return;}if(gameOver(s)){end(false,trueOverText());return;}state.day++;setMessage("二つの鯖から、同時に人が離れていく。 ");render(); }
function gameOver(stats){return Object.values(stats).some(v=>v !== Infinity && v<=0);}
function trueOverText(){return "共存ルートは攻略不可能な難易度だっただろう。攻略不可能なのは、2つの鯖を維持するだけの人口が遊び鯖コミュニティになかったからだ。もしも遊び鯖の人口が多かったなら、共存ルートは攻略不能ルートではなく、真の正解のルートとして君臨していたでしょう。";}
function end(clear,text){state.ended=true;$("#game-area").classList.add("hidden");const el=$("#ending");el.className=`ending ${clear?"clear":"over"}`;el.innerHTML=`<h2>${clear?"🏆 CLEAR":"💀 GAME OVER"}</h2><p>${text}</p><button class="restart">最初から遊ぶ</button>`;el.classList.remove("hidden");}
document.addEventListener("click",e=>{const r=e.target.closest("[data-route]");if(r)start(r.dataset.route);const a=e.target.closest("[data-action]");if(a&&!state.ended)(state.route==="true"?applyTrue:applyNormal)(a.dataset.action);if(e.target.closest(".restart"))location.reload();});

