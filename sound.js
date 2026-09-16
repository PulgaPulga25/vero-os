// VERO OS Chrome-safe Web Audio engine.
let audioCtx=null;
let soundOn=localStorage.getItem("veroSoundOn")!=="false";
let masterVol=parseFloat(localStorage.getItem("veroVolume")||"0.55");

function getAudio(){
  if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  return audioCtx;
}
async function unlockAudio(){
  try{
    const c=getAudio();
    await c.resume();
    // silent buffer primes Chrome's audio pipeline inside the click gesture
    const b=c.createBuffer(1,1,22050),s=c.createBufferSource(); s.buffer=b;s.connect(c.destination);s.start(0);
    soundOn=true; localStorage.setItem("veroSoundOn","true");
    syncSoundUI();
    // unmistakable startup sequence
    tone(440,.12,"sine",.22,0); tone(660,.12,"sine",.22,.13); tone(990,.22,"sine",.25,.26);
    setTimeout(()=>document.querySelector("#audioGate")?.classList.add("ready"),650);
    const st=document.querySelector("#audioTestStatus"); if(st)st.textContent="CHANNEL: ACTIVE";
  }catch(e){
    const st=document.querySelector("#audioTestStatus"); if(st)st.textContent="CHANNEL ERROR — TAP AGAIN";
  }
}
function tone(freq=440,dur=.08,type="sine",gain=.15,delay=0,slide=null){
  if(!soundOn||masterVol<=0)return;
  const c=getAudio(); if(c.state!=="running")return;
  const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;
  o.type=type;o.frequency.setValueAtTime(freq,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0001,gain*masterVol),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.03);
}
function noise(dur=.12,gain=.05,delay=0){
  if(!soundOn||masterVol<=0)return; const c=getAudio();if(c.state!=="running")return;
  const len=Math.floor(c.sampleRate*dur),buf=c.createBuffer(1,len,c.sampleRate),a=buf.getChannelData(0);
  for(let i=0;i<len;i++)a[i]=(Math.random()*2-1)*(1-i/len);
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime+delay;
  s.buffer=buf;f.type="highpass";f.frequency.value=700;g.gain.value=gain*masterVol;s.connect(f);f.connect(g);g.connect(c.destination);s.start(t);
}
const SFX={
 click(){tone(520,.045,"sine",.11);tone(850,.035,"sine",.07,.035)},
 open(){noise(.12,.04);tone(250,.15,"sine",.12,0,650);tone(850,.08,"sine",.08,.10)},
 close(){tone(650,.08,"sine",.09,0,260)},
 lock(){tone(190,.08,"square",.09);tone(120,.14,"sine",.13,.08);tone(1100,.05,"sine",.12,.20)},
 transmission(){tone(1050,.05,"sine",.12);tone(760,.05,"sine",.12,.07);tone(1250,.11,"sine",.14,.14)},
 reroll(){noise(.18,.05);tone(320,.10,"triangle",.10,0,720);tone(820,.06,"triangle",.08,.12)},
 complete(){[523,659,784,1046].forEach((f,i)=>tone(f,i===3?.22:.09,"sine",.14,i*.10))},
 xp(){tone(620,.05,"sine",.08);tone(780,.05,"sine",.09,.06);tone(980,.07,"sine",.10,.12)},
 achievement(){[392,523,659,784,1046].forEach((f,i)=>tone(f,i===4?.25:.11,"triangle",.13,i*.10));noise(.3,.025,.35)},
 level(){[440,554,659,880,1108].forEach((f,i)=>tone(f,.15,"sine",.13,i*.09))},
 denied(){tone(220,.12,"square",.10);tone(155,.20,"square",.10,.13)},
 secret(){noise(.25,.04);tone(120,.38,"sine",.12,0,420);tone(1050,.06,"sine",.14,.32);tone(1350,.15,"sine",.12,.40)},
 archive(){tone(440,.06,"triangle",.09);tone(650,.08,"triangle",.10,.07)},
 boot(){tone(440,.12,"sine",.2);tone(660,.12,"sine",.2,.13);tone(990,.22,"sine",.22,.26)}
};
function play(name){try{if(getAudio().state==="running")(SFX[name]||SFX.click)()}catch(e){}}
async function toggleSound(){
 soundOn=!soundOn;localStorage.setItem("veroSoundOn",soundOn);syncSoundUI();
 if(soundOn){await getAudio().resume();SFX.boot();}
}
function setVolume(v){masterVol=Number(v)/100;localStorage.setItem("veroVolume",masterVol);if(soundOn)tone(660,.05,"sine",.10)}
function syncSoundUI(){
 const b=document.querySelector("#soundToggle"),s=document.querySelector("#soundState"),v=document.querySelector("#volume");
 if(b)b.textContent=soundOn?"SFX ON":"SFX OFF";if(s)s.textContent=soundOn?"ARMED":"MUTED";if(v)v.value=Math.round(masterVol*100);
}
document.addEventListener("DOMContentLoaded",()=>{
 syncSoundUI();
 document.querySelector("#audioInitBtn")?.addEventListener("click",unlockAudio);
 document.querySelectorAll(".tile").forEach(el=>el.addEventListener("click",()=>play("click")));
});
