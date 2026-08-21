"use strict";
(function(){
  // game.js advances its internal DAY before composing the result message.
  // Keep the visible result attached to the DAY the player actually chose.
  let chosenDay = null;
  const dayLabel = () => document.querySelector("#day-label");
  const message = () => document.querySelector("#message");

  document.addEventListener("click", (e) => {
    const button = e.target.closest(".choice");
    if(!button) return;
    const label = dayLabel();
    if(!label) return;
    const m = label.textContent.match(/DAY\s+(\d+)/);
    if(m) chosenDay = Number(m[1]);
    setTimeout(() => {
      if(chosenDay === null) return;
      const l = dayLabel();
      if(!l) return;
      const now = l.textContent.match(/DAY\s+(\d+)/);
      if(now && Number(now[1]) === chosenDay + 1 && !document.querySelector("#ending:not(.hidden)")) {
        l.textContent = l.textContent.replace(/DAY\s+\d+/, `DAY ${chosenDay}`);
        const p = message();
        if(p) {
          p.textContent = p.textContent.replace(/DAY\s+(\d+)/, `DAY ${chosenDay}`);
          if(chosenDay === 10 && !p.textContent.includes("夏休み")) {
            p.textContent += "\n\n夏休みが終わり、人口が大きく減った。";
          }
        }
      }
      chosenDay = null;
    }, 0);
  }, true);

  // Migration is intentionally available from DAY10 onward.
  const observer = new MutationObserver(() => {
    const label = dayLabel();
    if(!label || !label.textContent.includes("DAY 10")) return;
    const route = document.querySelector("#route-badge");
    if(!route || !route.textContent.includes("1993")) return;
    const buttons = document.querySelectorAll("#choices .choice");
    buttons.forEach(btn => {
      const key = btn.querySelector(".key");
      if(key && key.textContent.trim() === "C") {
        btn.disabled = false;
        const small = btn.querySelector("small");
        if(small && small.textContent.includes("DAY11")) small.textContent = small.textContent.replace("DAY11", "DAY10");
      }
    });
  });
  observer.observe(document.body, {subtree:true, childList:true, characterData:true});
})();
