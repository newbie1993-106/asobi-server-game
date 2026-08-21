"use strict";
const $ = (s) => document.querySelector(s);
const routeNames = { "106":"🟦 106", "1993":"🟩 1993", third:"🟪 新鯖", true:"🌟 TRUE ROUTE" };
const labels = { population:"👥 人口", maintenance:"🛠 保守", security:"🛡 治安", autonomy:"🏛 自治", population106:"🟦 106・人口", maintenance106:"🟦 106・保守", security106:"🟦 106・治安", autonomy106:"🟦 106・自治", population1993:"🟩 1993・人口", maintenance1993:"🟩 1993・保守", security1993:"🟩 1993・治安", autonomy1993:"🟩 1993・自治" };
const state = { route:null, day:1, stats:{}, dStreak:0, migration:0, survival:0, mystery:false, ended:false, trueStats:null, trueTarget:null };

function cap(v){ return Math.max(0, Math.min(100, v)); }
function finiteEntries(stats){ return Object.entries(stats).filter(([,v]) => v !== Infinity); }
function setMessage(text){ $("#message").textContent = text; }

// 選択肢の結果だけを材料にして文章を組み立てる、ゲーム内ナレーション。
// 実際には起きていない出来事を作らないよう、stateの値・選択肢・発生イベントだけを参照する。
function statMood(stats, key){
  const v = stats[key];
  if(v === Infinity) return "限界を気にする必要はない。";
  if(v <= 0) return "すでに限界を超えている。";
  if(v < 30) return "かなり危険な水準だ。";
  if(v < 50) return "まだ余裕はあるが、油断はできない。";
  if(v < 80) return "ひとまず安定している。";
  return "かなり余裕がある。";
}

function responseNormal(action, before, after, notes){
  const r = state.route;
  const name = routeNames[r];
  const lines = [];
  const delta = (key) => {
    if(before[key] === undefined || after[key] === undefined || before[key] === Infinity || after[key] === Infinity) return null;
    return after[key] - before[key];
  };

  const intros = {
    A: ["人を動かすには、まずきっかけが必要だ。", "参加者を呼び込む動きを始めた。", "今できることから、少しずつ人を集める。"],
    B: ["表からは見えないところも、鯖を支えている。", "運営側の手を入れ、維持するための作業を進めた。", "派手さはないが、こういう積み重ねが後で効いてくる。"],
    C: ["ルールと運営について、今できることを進めた。", "鯖の中で話し合い、運営を整える方向へ動いた。", "人が増えるだけでは運営は回らない。仕組みも必要だ。"],
    D: ["今回はあえて手を出さず、状況を見ることにした。", "静かに様子を見守った。", "何もしないのも、一つの判断ではある。"]
  };
  lines.push(intros[action][(state.day + state.dStreak) % intros[action].length]);

  const changed = [];
  for(const key of ["population","maintenance","security","autonomy"]){
    const d = delta(key);
    if(d !== null && d !== 0) changed.push(`${labels[key]}${d > 0 ? "+" : ""}${d}`);
  }
  if(changed.length) lines.push(`今回の変化は ${changed.join("、")}。`);

  if(action === "D" && state.dStreak >= 2) lines.push(`「何もしない」が${state.dStreak}回続いている。自然減少も大きくなっている。`);
  if(after.population < 30) lines.push(`人口は${after.population}。${statMood(after,"population")} 過疎化の影響にも注意が必要だ。`);
  else if(after.population >= 80) lines.push(`人口は${after.population}。${statMood(after,"population")}`);
  if(after.maintenance < 30) lines.push(`保守は${after.maintenance}。${statMood(after,"maintenance")}`);
  if(after.security < 30) lines.push(`治安は${after.security}。${statMood(after,"security")}`);
  if(after.autonomy < 30) lines.push(`自治は${after.autonomy}。${statMood(after,"autonomy")}`);

  if(r === "106" && state.day >= 10 && after.population >= 30 && state.survival > 0){
    lines.push(`DAY10以降の人口30以上維持は現在${state.survival}/5。あと${Math.max(0,5-state.survival)}ターン。`);
  }
  if(r === "1993" && state.day >= 11){
    lines.push(`106からの移行進行度は${state.migration}/5。`);
  }
  if(r === "third" && ["population","maintenance","security","autonomy"].every(k => after[k] >= 70)){
    lines.push("4つの項目がすべて70以上に届いた。条件を満たしている。");
  }
  if(state.day === 10) lines.push(r === "106" ? "夏休みが終わり、人口が大きく減った。" : "夏休みが終わり、人口が大きく減った。");
  if(notes.includes("トラブルの影響が出ている。")) lines.push("低下した項目が30未満に入り、トラブルの影響が発生している。");

  return `${name}・DAY ${state.day}\n\n${lines.join("\n")}`;
}

function start(route){
  state.route=route; state.day=1; state.dStreak=0; state.migration=0; state.survival=0; state.mystery=false; state.ended=false; state.trueStats=null; state.trueTarget=null;
  state.stats = route === "106" ? {population:80,maintenance:Infinity,security:50,autonomy:40} : route === "1993" ? {population:50,maintenance:40,security:80,autonomy:Infinity} : {population:40,maintenance:40,security:70,autonomy:60};
  $("#route-select").classList.add("hidden"); $("#game-area").classList.remove("hidden"); render();
  setMessage(`${routeNames[route]}の運営を引き受けた。毎日の選択が、鯖の未来を決める。`);
}
function objective(){
  if(state.route === "106") return "人口を守り続けよう。<br><b>目標：</b>DAY10以降、人口を一定以上で維持する。";
  if(state.route === "1993") return `受け入れ体制を整えよう。<br><b>目標：</b>DAY11以降に移行を進める。 ${state.day>=11?`（進行 ${state.migration}/5）`:""}`;
  if(state.route === "third") return "新しい鯖を育てよう。<br><b>目標：</b>4つの力を、すべて十分な水準まで高める。";
  return state.trueTarget ? `${routeNames[state.trueTarget]}を運営中。<br><b>注意：</b>もう片方の鯖は、このターン操作できない。` : "二つの鯖を、同時に維持する。<br><b>目標：</b>まず、今ターン運営する鯖を選ぶ。";
}
function renderStats(stats){
  $("#status-grid").innerHTML = Object.entries(stats).map(([key,value]) => { const low=value !== Infinity && value<30; return `<article class="stat"><div class="stat-head"><span>${labels[key]}</span><b>${value===Infinity?"∞":value}</b></div><div class="meter ${low?"low":""}"><i style="width:${value===Infinity?100:value}%"></i></div></article>`; }).join("");
}
function normalChoices(){
  const r=state.route, items = r === "106" ? [["A","企画を立てて参加者を呼ぶ","人口 +20"],["B","鯖の設備を点検する","保守 +20"],["C","ルール会議を開く","治安 +10 / 自治 +10"],["D","あえて手を出さず見守る","状況を見守る"]] : r === "1993" ? [["A","新規参加者を募集し、見回りを増やす","人口 +10 / 治安 +10"],["B","有志と鯖を整備する","保守 +20"],["C","106の人を迎える準備を進める",state.day>=11?`移行進行度 +1（${state.migration}/5）`:"DAY11以降に解放",state.day<11],["D","あえて手を出さず見守る","状況を見守る"]] : [["A","交流イベントを開いて仲間を集める","人口 +20"],["B","みんなで鯖を整備する","保守 +20"],["C","ルールと運営方針を話し合う","治安 +10 / 自治 +10"],["D","あえて手を出さず見守る","状況を見守る"]];
  if(state.mystery) items.push(["?","???","もしも、別の道があったなら……",false,"mystery"]);
  return items;
}
function render(){
  $("#route-badge").textContent=routeNames[state.route]; $("#day-label").textContent=state.route === "true" ? `TRUE DAY ${state.day}` : `DAY ${state.day}`;
  $("#objective").innerHTML=objective();
  const displayedStats = state.route === "true" ? state.trueStats : state.stats;
  renderStats(displayedStats);
  let alerts=[]; finiteEntries(displayedStats).filter(([,v])=>v<30).forEach(([k])=>alerts.push(`${labels[k]}：${k.includes("population")?"過疎化":k.includes("maintenance")?"管理不足":k.includes("security")?"治安悪化":"運営不和"}が発生中`));
  $("#alerts").innerHTML=alerts.map(x=>`<p class="alert">⚠ ${x}</p>`).join("");
  const items = state.route === "true" ? trueChoices() : normalChoices();
  $("#choices").innerHTML=items.map(([key,name,detail,disabled,klass])=>`<button class="choice ${klass||""}" data-action="${key}" ${disabled?"disabled":""}><span class="key">${key}</span><span><b>${name}</b><small>${detail}</small></span></button>`).join("");
}
function applyNormal(action){
  if(action === "?"){ enterTrue(); return; }
  const before = {...state.stats};
  const s=state.stats, r=state.route;
  if(action !== "D") state.dStreak=0; else state.dStreak++;
  if(action === "A"){ s.population=cap(s.population+(r==="106"||r==="third"?20:10)); if(r==="1993")s.security=cap(s.security+10); }
  if(action === "B" && s.maintenance !== Infinity) s.maintenance=cap(s.maintenance+20);
  if(action === "C"){ if(r==="106"||r==="third"){s.security=cap(s.security+10);s.autonomy=cap(s.autonomy+10);} else state.migration++; }
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
  state.day++;
  if(state.day>=10){state.mystery=finiteEntries(s).every(([,v])=>v<=30);if(state.mystery)notes.push("……もしも、別の選択肢が存在したなら。 ");}
  setMessage(responseNormal(action, before, s, notes)); render();
}
function enterTrue(){ state.route="true";state.day=1;state.dStreak=0;state.trueTarget=null;state.trueStats={population106:80,maintenance106:Infinity,security106:50,autonomy106:40,population1993:50,maintenance1993:40,security1993:80,autonomy1993:Infinity};setMessage("二つの鯖を共存させる道を選んだ。どちらを運営する？");render(); }
function trueChoices(){
  if(!state.trueTarget) return [["106","106を運営する","106の人口・保守・治安・自治に手を入れる"],["1993","1993を運営する","1993の人口・保守・治安・自治に手を入れる"]];
  const target=state.trueTarget, is106=target==="106";
  return [["A","交流企画で人を呼び戻す",`人口 +${is106?2:1}（通常の1/10）`],["B","鯖の設備を整備する","保守 +20"],["C","ルール会議を開く","治安 +10 / 自治 +10"],["D","あえて手を出さず見守る","状況を見守る"],["change","運営する鯖を選び直す","このターンはまだ進まない"]];
}
function trueResponse(action, target, before, after, decay){
  const targetName = routeNames[target];
  const lines = [];
  const delta = (key) => {
    if(before[key] === Infinity || after[key] === Infinity) return null;
    return after[key] - before[key];
  };
  const intro = {
    A:"人を呼び戻すため、交流企画を動かした。",
    B:"運営の土台を整えるため、設備の維持に手を入れた。",
    C:"ルールと運営方針について話し合った。",
    D:"今回は手を出さず、二つの鯖の様子を見守った。"
  };
  lines.push(`${targetName}を運営した。`);
  lines.push(intro[action]);
  const popKey = `population${target}`;
  const mKey = `maintenance${target}`;
  const secKey = `security${target}`;
  const autKey = `autonomy${target}`;
  const changed = [];
  for(const key of [popKey,mKey,secKey,autKey]){ const d=delta(key); if(d!==null&&d!==0) changed.push(`${labels[key]}${d>0?"+":""}${d}`); }
  if(changed.length) lines.push(`今回の変化は ${changed.join("、")}。`);
  lines.push(`自然減少 ${decay} に加え、106と1993の人口はそれぞれ6減少した。`);
  if(after[popKey] < 30) lines.push(`${labels[popKey]}は${after[popKey]}。${statMood(after,popKey)} 過疎化の影響にも注意が必要だ。`);
  if(after.population106 < 30 || after.population1993 < 30) lines.push("どちらかの人口が30未満に入った。共存はさらに厳しくなっている。");
  return `TRUE・DAY ${state.day}\n\n${lines.join("\n")}`;
}
function applyTrue(action){
  if(action==="106"||action==="1993"){state.trueTarget=action;setMessage(`${routeNames[action]}を運営する。行動を選んでください。`);render();return;}
  if(action==="change"){state.trueTarget=null;setMessage("今ターン運営する鯖を選び直す。");render();return;}
  const before = {...state.trueStats};
  const s=state.trueStats, suffix=state.trueTarget, key=(name)=>`${name}${suffix}`;
  if(action!=="D")state.dStreak=0;else state.dStreak++;
  if(action==="A")s[key("population")]=cap(s[key("population")]+(suffix==="106"?2:1));
  if(action==="B"&&s[key("maintenance")]!==Infinity)s[key("maintenance")]=cap(s[key("maintenance")]+20);
  if(action==="C"){s[key("security")]=cap(s[key("security")]+10);if(s[key("autonomy")]!==Infinity)s[key("autonomy")]=cap(s[key("autonomy")]+10);}
  const decay=action==="D"?3+(state.dStreak-1)*2:3;
  finiteEntries(s).forEach(([k,v])=>s[k]=cap(v-decay));
  s.population106=cap(s.population106-6);s.population1993=cap(s.population1993-6);
  const trouble=finiteEntries(s).filter(([,v])=>v<30);trouble.forEach(([k,v])=>s[k]=cap(v-3));
  if(finiteEntries(s).every(([,v])=>v>=100)){end(false,"⚠ SYSTEM ERROR\n\nこのルートはクリアを想定されていません。間違いなく不具合ですので、ぬーんに連絡してください。");return;}
  if(gameOver(s)){end(false,trueOverText());return;}
  const message = trueResponse(action, suffix, before, s, decay);
  state.day++;state.trueTarget=null;setMessage(message);render();
}
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
