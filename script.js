
const overlay=document.getElementById("menuOverlay");
const openBtn=document.getElementById("menuOpen");
const closeBtn=document.getElementById("menuClose");

function openMenu(){
  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden","false");
  openBtn.setAttribute("aria-expanded","true");
  document.body.classList.add("menu-open");
}
function closeMenu(){
  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden","true");
  openBtn.setAttribute("aria-expanded","false");
  document.body.classList.remove("menu-open");
}
if(openBtn) openBtn.addEventListener("click",openMenu);
if(closeBtn) closeBtn.addEventListener("click",closeMenu);
if(overlay){
  overlay.addEventListener("click",e=>{if(e.target===overlay)closeMenu()});
  overlay.querySelectorAll("a").forEach(a=>a.addEventListener("click",closeMenu));
}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu()});

async function copyServerAddress(){
  const address="mc.yutene.net";
  const button=document.getElementById("copyAddress");
  const status=document.getElementById("copyStatus");
  let copied=false;

  if(navigator.clipboard && window.isSecureContext){
    try{
      await navigator.clipboard.writeText(address);
      copied=true;
    }catch(e){}
  }

  if(!copied){
    try{
      const el=document.createElement("textarea");
      el.value=address;
      el.setAttribute("readonly","");
      el.style.position="fixed";
      el.style.opacity="0";
      el.style.pointerEvents="none";
      document.body.appendChild(el);
      el.focus({preventScroll:true});
      el.select();
      el.setSelectionRange(0,address.length);
      copied=document.execCommand("copy");
      el.remove();
    }catch(e){}
  }

  if(copied){
    if(button) button.textContent="COPIED";
    if(status) status.textContent="mc.yutene.net をコピーしました";
    setTimeout(()=>{
      if(button) button.textContent="COPY";
      if(status) status.textContent="";
    },1600);
  }else{
    if(status) status.textContent="コピーできませんでした：mc.yutene.net";
  }
}

const copyButton=document.getElementById("copyAddress");
if(copyButton) copyButton.addEventListener("click",copyServerAddress);

const year=document.getElementById("year");
if(year) year.textContent=new Date().getFullYear();
