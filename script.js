(function(){
  // Keep the same drawer design, but normalize its order everywhere.
  // Home → Servers → Join → Rules → News → Creations → Status → Account
  const drawerNav=document.querySelector(".drawer-nav");
  if(drawerNav){
    drawerNav.innerHTML=`
      <a href="/"><span>ホーム</span><small>HOME</small></a>
      <a href="/servers/"><span>サーバー</span><small>SERVERS</small></a>
      <a href="/join/"><span>参加方法</span><small>JOIN</small></a>
      <a href="/rules/"><span>ルール</span><small>RULES</small></a>
      <a href="/news/"><span>お知らせ</span><small>NEWS</small></a>
      <a href="/creations/"><span>制作物</span><small>CREATIONS</small></a>
      <a href="/status/"><span>ステータス</span><small>STATUS</small></a>
      <div class="drawer-sep"></div>
      <a href="/account/"><span>アカウント</span><small>ACCOUNT</small></a>
    `;
  }

  const overlay=document.getElementById("menuOverlay");
  const openBtn=document.getElementById("menuOpen");
  const closeBtn=document.getElementById("menuClose");

  function openMenu(){
    if(!overlay) return;
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden","false");
    openBtn?.setAttribute("aria-expanded","true");
    document.body.classList.add("menu-open");
  }
  function closeMenu(){
    if(!overlay) return;
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden","true");
    openBtn?.setAttribute("aria-expanded","false");
    document.body.classList.remove("menu-open");
  }

  openBtn?.addEventListener("click",openMenu);
  closeBtn?.addEventListener("click",closeMenu);
  overlay?.addEventListener("click",e=>{if(e.target===overlay)closeMenu()});
  overlay?.querySelectorAll("a").forEach(a=>a.addEventListener("click",closeMenu));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu()});

  document.querySelectorAll("[data-copy-address]").forEach(button=>{
    button.addEventListener("click",async()=>{
      const address=button.dataset.copyAddress || "mc.yutene.net";
      const status=document.getElementById(button.dataset.copyStatus || "copyStatus");
      try{
        if(!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard API unavailable");
        await navigator.clipboard.writeText(address);
        const old=button.textContent;
        button.textContent="COPIED";
        if(status) status.textContent=`${address} をコピーしました`;
        setTimeout(()=>{
          button.textContent=old;
          if(status) status.textContent="";
        },1600);
      }catch(e){
        if(status) status.textContent=`コピーできませんでした。${address} を長押ししてコピーしてください。`;
      }
    });
  });

  const year=document.getElementById("year");
  if(year) year.textContent=new Date().getFullYear();

  // Live Minecraft network status
  const statusRoot=document.getElementById("liveStatus");
  if(statusRoot){
    const pill=document.getElementById("statusPill");
    const label=document.getElementById("statusLabel");
    const players=document.getElementById("statusPlayers");
    const version=document.getElementById("statusVersion");
    const motd=document.getElementById("statusMotd");
    const time=document.getElementById("statusTime");
    const refresh=document.getElementById("statusRefresh");

    async function loadStatus(){
      refresh.disabled=true;
      label.textContent="確認中";
      pill.className="status-pill";
      try{
        const response=await fetch("https://api.mcstatus.io/v2/status/java/mc.yutene.net?query=false&timeout=5",{
          headers:{"Accept":"application/json"}
        });
        if(!response.ok) throw new Error("status api");
        const data=await response.json();

        if(data.online){
          pill.className="status-pill online";
          label.textContent="オンライン";
          players.textContent=`${data.players?.online ?? 0} / ${data.players?.max ?? "—"}`;
          version.textContent=data.version?.name_clean || data.version?.name || "—";

          let clean=data.motd?.clean;
          if(Array.isArray(clean)) clean=clean.join(" ");
          motd.textContent=(clean || "—").toString().replace(/\s+/g," ").trim();
        }else{
          pill.className="status-pill offline";
          label.textContent="オフライン";
          players.textContent="—";
          version.textContent="—";
          motd.textContent="—";
        }
        time.textContent=`最終確認 ${new Date().toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}`;
      }catch(e){
        pill.className="status-pill";
        label.textContent="取得できません";
        players.textContent="—";
        version.textContent="—";
        motd.textContent="—";
        time.textContent="状態の取得に失敗しました";
      }finally{
        refresh.disabled=false;
      }
    }

    refresh.addEventListener("click",loadStatus);
    loadStatus();
  }
})();