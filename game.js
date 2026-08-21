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
  $("#status-grid").innerHTML = Object.entries(stats).map(([key,value]) => { const low=value !== Infinity && value<30; return `<article class="stat"><div class="stat-head"><span>${labels[key]}${trueMode?key.includes("106")?"":"":""}</span><b>${value===Infinity?"∞":value}</b></div><div class="meter ${low?"low":""}"><i style="width:${value===Infinity?100:value}%"></i></div></article>`; }).join("");
}
function normalChoices(){
  const r=state.route, items = r === "106" ? [["A","人口を増やす","人口 +20"],["B","保守を行う","保守 +20"],["C","治安と自治を整える","治安 +10 / 自治 +10"],["D","何もしない","状況を見守る"]] : r === "1993" ? [["A","人口と治安を整える","人口 +10 / 治安 +10"],["B","保守を行う","保守 +20"],["C","106からの移行",state.day>=10?`移行進行度 +1（${state.migration}/5）`:"DAY10以降に解放",state.day<10],["D","何もしない","状況を見守る"]] : [["A","人口を増やす","人口 +30"],["B","保守を行う","保守 +30"],["C","治安と自治を整える","治安 +15 / 自治 +15"],["D","何もしない","状況を見守る"]];
  if(state.mystery) items.push(["?","???","もしも、別の道があったなら……",false,"mystery"]);
  return items;
}
function render(){
  $("#route-badge").textContent=routeNames[state.route]; $("#day-label").textContent=state.route === "true" ? `TRUE DAY ${state.day}` : `DAY ${state.day}`;
  $("#objective").innerHTML=objective();
  renderStats(state.route === "true" ? state.trueStats : state.stats, state.route === "true");
  let alerts=[]; if(state.route !== "true") finiteEntries(state.stats).filter(([,v])=>v<30).forEach(([k])=>alerts.push(`${labels[k]}：${({population:"過疎化",maintenance:"管理不足",security:"治安悪化",autonomy:"運営不和"})[k]}が発生中`));
  $("#alerts").innerHTML=alerts.map(x=>`<p class="alert">⚠ ${x}</p>`).join("");
  const items = state.route === "true" ? trueChoices() : normalChoices();
  $("#choices").innerHTML=items.map(([key,name,detail,disabled,klass])=>`<button class="choice ${klass||""}" data-action="${key}" ${disabled?"disabled":""}><span class="key">${key}</span><span><b>${name}</b><small>${detail}</small></span></button>`).join("");
}
function applyNormal(action){
  if(action === "?"){ enterTrue(); return; }
  const s=state.stats, r=state.route;
  if(action !== "D") state.dStreak=0; else state.dStreak++;
  if(action === "A"){ s.population=cap(s.population+(r==="third"?30:r==="106"?20:10)); if(r==="1993")s.security=cap(s.security+10); }
  if(action === "B" && s.maintenance !== Infinity) s.maintenance=cap(s.maintenance+(r==="third"?30:20));
  if(action === "C"){ if(r==="106"){s.security=cap(s.security+10);s.autonomy=cap(s.autonomy+10);} else if(r==="third"){s.security=cap(s.security+15);s.autonomy=cap(s.autonomy+15);} else state.migration++; }
  const decay = action === "D" ? 3 + (state.dStreak-1)*2 : 3;
  finiteEntries(s).forEach(([k,v])=>s[k]=cap(v-decay));
  let notes=[`${action}を選択。自然減少 ${decay}。`];
  if(state.day===10){s.population=cap(s.population-(r==="106"?45:30)); notes.push("夏休み明け：人口が大きく減少した。");}
  const trouble=finiteEntries(s).filter(([,v])=>v<30); trouble.forEach(([k,v])=>s[k]=cap(v-3));
  if(trouble.length)notes.push("トラブルの影響が出ている。");
  if(gameOver(s)){ end(false, state.route==="true"?trueOverText():"鯖を維持できなくなった。GAME OVER。"); return; }
  if(r==="106"){state.survival=s.population>=30?state.survival+1:0;if(state.day>=10&&state.survival>=5){end(true,"106を生き残らせた。\n\nあなたのクリア条件：DAY10以降、人口30以上を5ターン連続で維持する。");return;}}
  if(r==="1993"&&state.migration>=5){end(true,"106からの移行を完遂した。\n\nあなたのクリア条件：DAY10以降、移行を5回進める。");return;}
  if(r==="third"&&finiteEntries(s).every(([,v])=>v>=70)){end(true,"新しい鯖を、すべての面で育て上げた。\n\nあなたのクリア条件：人口・保守・治安・自治のすべてを70以上にする。");return;}
  state.day++; if(state.day===10){state.mystery=finiteEntries(s).every(([,v])=>v<=30);if(state.mystery)notes.push("……もしも、別の選択肢が存在したなら。 ");}
  setMessage(notes.join(" ")); render();
}
function enterTrue(){ state.route="true";state.day=1;state.dStreak=0;state.trueStats={"population106":80,"population1993":50}; labels.population106="👥 106 人口"; labels.population1993="👥 1993 人口";setMessage("二つの鯖を共存させる道を選んだ。だが、人口は足りない。 ");render(); }
function trueChoices(){return [["A","106を支援する","106人口 +2（通常の1/10）"],["B","1993を支援する","1993人口 +1（通常の1/10）"],["D","何もしない","両方を見守る"]];}
function applyTrue(action){ const s=state.trueStats;if(action==="A")s.population106=cap(s.population106+2);if(action==="B")s.population1993=cap(s.population1993+1);s.population106=cap(s.population106-6);s.population1993=cap(s.population1993-6);if(s.population106>=100&&s.population1993>=100){end(false,"⚠ SYSTEM ERROR\n\nこのルートはクリアを想定されていません。間違いなく不具合ですので、ぬーんに連絡してください。");return;}if(gameOver(s)){end(false,trueOverText());return;}state.day++;setMessage("二つの鯖から、同時に人が離れていく。 ");render(); }
function gameOver(stats){return Object.values(stats).some(v=>v !== Infinity && v<=0);}
function trueOverText(){return "共存ルートは攻略不可能な難易度だっただろう。攻略不可能なのは、2つの鯖を維持するだけの人口が遊び鯖コミュニティになかったからだ。もしも遊び鯖の人口が多かったなら、共存ルートは攻略不能ルートではなく、真の正解のルートとして君臨していたでしょう。";}
function end(clear,text){state.ended=true;$("#game-area").classList.add("hidden");const el=$("#ending");el.className=`ending ${clear?"clear":"over"}`;el.innerHTML=`<h2>${clear?"🏆 CLEAR":"💀 GAME OVER"}</h2><p>${text}</p><button class="restart">最初から遊ぶ</button>`;el.classList.remove("hidden");}
let lastTouchAt = 0;
function handleSelection(e){
  if(e.type === "click" && Date.now() - lastTouchAt < 700) return;
  if(e.type === "touchend"){ lastTouchAt = Date.now(); e.preventDefault(); }
  const r=e.target.closest("[data-route]");
  if(r) start(r.dataset.route);
  const a=e.target.closest("[data-action]");
  if(a&&!state.ended) (state.route==="true"?applyTrue:applyNormal)(a.dataset.action);
  if(e.target.closest(".restart")) location.reload();
}
document.addEventListener("click",handleSelection);
document.addEventListener("touchend",handleSelection,{passive:false});

