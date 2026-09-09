(async function(){
  const config=window.YUTENE_ACCOUNT_CONFIG || {};
  const warning=document.getElementById("accountConfigWarning");
  const message=document.getElementById("accountMessage");
  const authArea=document.getElementById("authArea");
  const verifyArea=document.getElementById("verifyArea");
  const profileArea=document.getElementById("profileArea");
  const recoveryArea=document.getElementById("recoveryArea");

  const loginTab=document.getElementById("loginTab");
  const signupTab=document.getElementById("signupTab");
  const loginPanel=document.getElementById("loginPanel");
  const signupPanel=document.getElementById("signupPanel");

  let pendingSignupEmail="";

  function showMessage(text,type="info"){
    if(!message) return;
    message.textContent=text || "";
    message.className="account-message";
    if(text) message.classList.add("show",type);
  }

  function configured(){
    return typeof config.supabaseUrl==="string"
      && config.supabaseUrl.startsWith("https://")
      && typeof config.supabaseAnonKey==="string"
      && config.supabaseAnonKey.length>30
      && !config.supabaseUrl.includes("YOUR_")
      && !config.supabaseAnonKey.includes("YOUR_");
  }

  function setAuthDisabled(disabled){
    document.querySelectorAll("#authArea input,#authArea button").forEach(el=>el.disabled=disabled);
  }

  function switchTab(tab){
    const login=tab==="login";
    loginTab.classList.toggle("active",login);
    signupTab.classList.toggle("active",!login);
    loginPanel.hidden=!login;
    signupPanel.hidden=login;
    verifyArea.hidden=true;
    showMessage("");
  }

  loginTab?.addEventListener("click",()=>switchTab("login"));
  signupTab?.addEventListener("click",()=>switchTab("signup"));

  if(!configured()){
    warning.hidden=false;
    setAuthDisabled(true);
    showMessage("認証設定を入れると、このページから新規登録・ログインできるようになります。","info");
    return;
  }

  const client=window.supabase.createClient(config.supabaseUrl,config.supabaseAnonKey,{
    auth:{
      persistSession:true,
      autoRefreshToken:true,
      detectSessionInUrl:true
    }
  });

  function formatDate(value){
    if(!value) return "—";
    const d=new Date(value);
    if(Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"long",day:"numeric"}).format(d);
  }

  function renderUser(user){
    verifyArea.hidden=true;
    recoveryArea.hidden=true;

    if(!user){
      authArea.hidden=false;
      profileArea.hidden=true;
      return;
    }

    const username=(user.user_metadata?.username || user.email?.split("@")[0] || "Yutene User").trim();
    document.getElementById("profileUsername").textContent=username;
    document.getElementById("profileUsernameInput").value=username;
    document.getElementById("profileEmail").textContent=user.email || "—";
    document.getElementById("profileCreatedAt").textContent=formatDate(user.created_at);
    authArea.hidden=true;
    profileArea.hidden=false;
  }

  function validateUsername(value){
    const name=value.trim();
    if(name.length<2 || name.length>20) throw new Error("ユーザー名は2〜20文字にしてください。");
    return name;
  }

  function openVerify(email){
    pendingSignupEmail=email;
    authArea.hidden=true;
    profileArea.hidden=true;
    recoveryArea.hidden=true;
    verifyArea.hidden=false;
    document.getElementById("verifyCode").value="";
    document.getElementById("verifyCode").focus();
  }

  document.getElementById("signupForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    showMessage("");

    const username=document.getElementById("signupUsername").value;
    const email=document.getElementById("signupEmail").value.trim();
    const password=document.getElementById("signupPassword").value;
    const confirm=document.getElementById("signupPasswordConfirm").value;

    try{
      const cleanUsername=validateUsername(username);
      if(password.length<8) throw new Error("パスワードは8文字以上にしてください。");
      if(password!==confirm) throw new Error("確認用パスワードが一致していません。");

      const {data,error}=await client.auth.signUp({
        email,
        password,
        options:{
          data:{username:cleanUsername},
          emailRedirectTo:`${location.origin}/account/`
        }
      });
      if(error) throw error;

      if(data.session){
        showMessage("アカウントを作成しました。","ok");
        renderUser(data.user);
      }else{
        openVerify(email);
        showMessage("Yuteneから確認コードを送信しました。","ok");
      }
    }catch(err){
      showMessage(err.message || "アカウントを作成できませんでした。","error");
    }
  });

  document.getElementById("verifyForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    showMessage("");

    const token=document.getElementById("verifyCode").value.trim();

    if(!pendingSignupEmail){
      showMessage("確認するメールアドレスがありません。新規登録からやり直してください。","error");
      return;
    }
    if(!/^\d{6}$/.test(token)){
      showMessage("6桁の確認コードを入力してください。","error");
      return;
    }

    try{
      const {data,error}=await client.auth.verifyOtp({
        email:pendingSignupEmail,
        token,
        type:"email"
      });
      if(error) throw error;

      pendingSignupEmail="";
      renderUser(data.user);
      showMessage("メール確認が完了しました。アカウントを作成しました。","ok");
    }catch(err){
      showMessage("確認コードが違うか、有効期限が切れています。","error");
    }
  });

  document.getElementById("resendCodeButton")?.addEventListener("click",async()=>{
    if(!pendingSignupEmail){
      showMessage("確認するメールアドレスがありません。","error");
      return;
    }

    try{
      const {error}=await client.auth.resend({
        type:"signup",
        email:pendingSignupEmail,
        options:{
          emailRedirectTo:`${location.origin}/account/`
        }
      });
      if(error) throw error;
      showMessage("確認コードを再送しました。","ok");
    }catch(err){
      showMessage(err.message || "確認コードを再送できませんでした。","error");
    }
  });

  document.getElementById("backToSignupButton")?.addEventListener("click",()=>{
    verifyArea.hidden=true;
    authArea.hidden=false;
    switchTab("signup");
  });

  document.getElementById("loginForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    showMessage("");
    const email=document.getElementById("loginEmail").value.trim();
    const password=document.getElementById("loginPassword").value;

    try{
      const {data,error}=await client.auth.signInWithPassword({email,password});
      if(error) throw error;
      renderUser(data.user);
      showMessage("ログインしました。","ok");
    }catch(err){
      showMessage("メールアドレスまたはパスワードを確認してください。","error");
    }
  });

  document.getElementById("forgotPasswordButton")?.addEventListener("click",async()=>{
    const email=document.getElementById("loginEmail").value.trim();
    if(!email){
      showMessage("先にメールアドレスを入力してください。","error");
      return;
    }
    try{
      const {error}=await client.auth.resetPasswordForEmail(email,{
        redirectTo:`${location.origin}/account/?reset=1`
      });
      if(error) throw error;
      showMessage("パスワード再設定メールを送信しました。","ok");
    }catch(err){
      showMessage(err.message || "再設定メールを送信できませんでした。","error");
    }
  });

  document.getElementById("logoutButton")?.addEventListener("click",async()=>{
    const {error}=await client.auth.signOut();
    if(error){
      showMessage(error.message,"error");
      return;
    }
    renderUser(null);
    switchTab("login");
    showMessage("ログアウトしました。","ok");
  });

  document.getElementById("usernameForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    try{
      const username=validateUsername(document.getElementById("profileUsernameInput").value);
      const {data,error}=await client.auth.updateUser({data:{username}});
      if(error) throw error;
      renderUser(data.user);
      showMessage("ユーザー名を変更しました。","ok");
    }catch(err){
      showMessage(err.message || "ユーザー名を変更できませんでした。","error");
    }
  });

  document.getElementById("recoveryForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    const password=document.getElementById("recoveryPassword").value;
    const confirm=document.getElementById("recoveryPasswordConfirm").value;

    if(password.length<8){
      showMessage("パスワードは8文字以上にしてください。","error");
      return;
    }
    if(password!==confirm){
      showMessage("確認用パスワードが一致していません。","error");
      return;
    }

    try{
      const {error}=await client.auth.updateUser({password});
      if(error) throw error;
      recoveryArea.hidden=true;
      profileArea.hidden=false;
      history.replaceState(null,"","/account/");
      showMessage("パスワードを変更しました。","ok");
    }catch(err){
      showMessage(err.message || "パスワードを変更できませんでした。","error");
    }
  });

  client.auth.onAuthStateChange((event,session)=>{
    if(event==="PASSWORD_RECOVERY"){
      authArea.hidden=true;
      verifyArea.hidden=true;
      profileArea.hidden=true;
      recoveryArea.hidden=false;
      showMessage("新しいパスワードを設定してください。","info");
      return;
    }

    if(event==="SIGNED_IN" || event==="USER_UPDATED" || event==="TOKEN_REFRESHED"){
      if(!recoveryArea.hidden) return;
      renderUser(session?.user || null);
    }

    if(event==="SIGNED_OUT"){
      renderUser(null);
    }
  });

  const {data:{session}}=await client.auth.getSession();
  renderUser(session?.user || null);

  if(new URLSearchParams(location.search).get("reset")==="1" && session?.user){
    authArea.hidden=true;
    verifyArea.hidden=true;
    profileArea.hidden=true;
    recoveryArea.hidden=false;
    showMessage("新しいパスワードを設定してください。","info");
  }
})();