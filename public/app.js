const $ = (id) => document.getElementById(id);
const chatArea = $("chatArea"), welcome = $("welcome"), imageArea = $("imageArea");
const input = $("messageInput"), form = $("chatForm"), sendBtn = $("sendBtn");
let messages = [], mode = "chat", attachedImage = null, busy = false;

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tool-link").forEach(b => b.classList.toggle("active", (b.dataset.mode || "chat") === mode));
  imageArea.classList.toggle("hidden", mode !== "image");
  if (mode === "image") { welcome.classList.add("hidden"); chatArea.classList.remove("visible"); input.placeholder = "Describe the image you want…"; }
  else { input.placeholder = "Message INDO AI…"; if (!messages.length) welcome.classList.remove("hidden"); else chatArea.classList.add("visible"); }
}
function scrollBottom(){ chatArea.scrollTop = chatArea.scrollHeight; }
function addMessage(role, text, extraClass="") {
  welcome.classList.add("hidden"); chatArea.classList.add("visible");
  const wrap = document.createElement("div"); wrap.className = `message ${role} ${extraClass}`;
  const avatar = document.createElement("div"); avatar.className = "avatar"; avatar.textContent = role === "user" ? "Y" : "I";
  const bubble = document.createElement("div"); bubble.className = "bubble"; bubble.textContent = text;
  wrap.append(avatar,bubble); chatArea.append(wrap); scrollBottom(); return bubble;
}
function setBusy(v){busy=v;sendBtn.disabled=v;sendBtn.textContent=v?"…":"↑";}
async function sendChat(text) {
  if (!text.trim() || busy) return;
  setMode("chat"); addMessage("user", text); messages.push({role:"user",content:text});
  if (attachedImage) { const note = addMessage("user","📷 Image attached"); }
  const typing = addMessage("assistant","INDO AI is thinking…","typing"); setBusy(true);
  const image = attachedImage; attachedImage=null; $("attachmentPreview").classList.add("hidden");
  try {
    const r = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages,image})});
    const data = await r.json(); if(!r.ok) throw new Error(data.error || "Request failed");
    typing.textContent=data.reply; typing.parentElement.classList.remove("typing");
    messages.push({role:"assistant",content:data.reply});
  } catch(e){typing.textContent="Error: "+e.message;typing.parentElement.classList.add("error");}
  finally{setBusy(false);input.focus();}
}
async function makeImage(prompt) {
  if(!prompt.trim()||busy)return;
  setMode("image"); $("generatedImage").innerHTML="";
  const status=document.createElement("p");status.className="typing";status.textContent="Creating your image…";$("generatedImage").append(status);setBusy(true);
  try{
    const r=await fetch("/api/image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});
    const data=await r.json();if(!r.ok)throw new Error(data.error||"Image generation failed");
    status.remove();const img=document.createElement("img");img.className="generated";img.src=data.image;img.alt=prompt;
    const link=document.createElement("a");link.className="download-link";link.href=data.image;link.download="indo-ai-image.png";link.textContent="Download image ↓";
    $("generatedImage").append(img,link);
  }catch(e){status.classList.remove("typing");status.textContent="Error: "+e.message;}
  finally{setBusy(false);}
}
form.addEventListener("submit",e=>{e.preventDefault();const text=input.value.trim();if(!text)return;input.value="";input.style.height="auto";mode==="image"?makeImage(text):sendChat(text);});
input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,150)+"px";});
document.querySelectorAll("[data-prompt]").forEach(b=>b.addEventListener("click",()=>{setMode("chat");input.value=b.dataset.prompt;input.focus();input.setSelectionRange(input.value.length,input.value.length);}));
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
$("newChat").addEventListener("click",()=>{messages=[];chatArea.innerHTML="";chatArea.classList.remove("visible");welcome.classList.remove("hidden");setMode("chat");$("sidebar").classList.remove("open");});
$("clearChat").addEventListener("click",()=>{$("newChat").click();});
$("attachBtn").addEventListener("click",()=>$("imageUpload").click());
$("imageUpload").addEventListener("change",e=>{
 const file=e.target.files[0];if(!file)return;
 if(file.size>7*1024*1024){alert("Please choose an image smaller than 7 MB.");return;}
 const reader=new FileReader();reader.onload=()=>{attachedImage=reader.result;$("attachmentPreview").innerHTML=`<img src="${reader.result}" alt="Selected image"> Image ready to send`; $("attachmentPreview").classList.remove("hidden");};reader.readAsDataURL(file);
});
$("voiceBtn").addEventListener("click",()=>{
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){alert("Voice typing is not supported in this browser. Try your keyboard microphone.");return;}
 const rec=new Speech();rec.lang="hi-IN";rec.onresult=e=>{input.value+=(input.value?" ":"")+e.results[0][0].transcript;input.focus();};rec.start();
});
$("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
fetch("/api/health").then(r=>r.json()).then(d=>{$("serviceStatus").textContent=d.configured?"ready":"API key needed";$("serviceStatus").previousElementSibling.style.background=d.configured?"#5de0a0":"#e5b85c";}).catch(()=>$("serviceStatus").textContent="offline");
