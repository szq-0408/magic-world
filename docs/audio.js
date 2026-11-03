// One persistent audio engine for the entire application; route/language changes never recreate it.
// To bundle an authorized soundtrack, set this URL to e.g. './assets/hedwigs-theme.mp3'.
export const BUNDLED_MUSIC_URL = null;
export class Soundscape {
 constructor(settings,onChange){this.settings=settings;this.onChange=onChange;this.music=new Audio();this.music.loop=true;this.music.preload='metadata';this.ready=false;this.status='missing';this.scene=null;this.sceneNode=null;this.lastEffect=0;
  this.music.addEventListener('playing',()=>{this.status='playing';this.onChange();});
  this.music.addEventListener('pause',()=>{if(this.ready)this.status='paused';this.onChange();});
  this.music.addEventListener('error',()=>{this.status='error';this.onChange();});
 }
 async db(){return new Promise((resolve,reject)=>{const r=indexedDB.open('hogwarts-audio',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 async restore(){try{const db=await this.db();const file=await new Promise((resolve,reject)=>{const r=db.transaction('files').objectStore('files').get('music');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});db.close();if(file)this.setSource(file);else if(BUNDLED_MUSIC_URL){this.music.src=BUNDLED_MUSIC_URL;this.ready=true;this.status='ready';}}catch{if(BUNDLED_MUSIC_URL){this.music.src=BUNDLED_MUSIC_URL;this.ready=true;this.status='ready';}}this.onChange();}
 setSource(file){this.music.pause();if(this.blobURL)URL.revokeObjectURL(this.blobURL);this.blobURL=URL.createObjectURL(file);this.music.src=this.blobURL;this.ready=true;this.status='ready';}
 async choose(file){if(!file)return;this.setSource(file);try{const db=await this.db();await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(file,'music');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}catch{this.onStorageFailure?.();}await this.enable(false);}
 async remove(){this.music.pause();this.music.removeAttribute('src');this.music.load();if(this.blobURL)URL.revokeObjectURL(this.blobURL);this.ready=false;this.status='missing';try{const db=await this.db();const tx=db.transaction('files','readwrite');tx.objectStore('files').delete('music');tx.oncomplete=()=>db.close();}catch{}this.onChange();}
 async enable(unmute=true){if(unmute)this.settings.muted=false;try{if(!this.ctx){this.ctx=new AudioContext();this.ambience=this.ctx.createGain();this.ambience.gain.value=0;this.ambience.connect(this.ctx.destination);this.setScene(this.scene,true);}await this.ctx.resume();await this.apply(true);}catch{this.status='error';this.onChange();}}
 async apply(fade=false){const revision=this.revision=(this.revision||0)+1;const s=this.settings;const volume=s.muted||!s.music.enabled?0:s.music.volume/100;cancelAnimationFrame(this.fade);
  if(this.ready){if(volume===0){this.music.volume=0;this.music.pause();this.status='paused';}else if(this.ctx?.state==='running'){try{if(this.music.paused){this.music.volume=0;await this.music.play();if(revision!==this.revision)return;fade=true;}const start=performance.now(),from=this.music.volume;const tick=now=>{if(revision!==this.revision)return;const p=fade?Math.min(1,(now-start)/2000):1;this.music.volume=Math.max(0,Math.min(1,from+(volume-from)*p));if(p<1)this.fade=requestAnimationFrame(tick);};this.fade=requestAnimationFrame(tick);}catch{if(revision===this.revision)this.status='error';}}}
  if(this.ctx){const g=s.muted||!s.ambience.enabled?0:s.ambience.volume/100*.4;this.ambience.gain.setTargetAtTime(g,this.ctx.currentTime,.18);}this.onChange();
 }
 setScene(id,force=false){if(!force&&this.scene===id)return;this.scene=id;if(!this.ctx)return;const now=this.ctx.currentTime;
  if(this.sceneNode){const old=this.sceneNode;old.gain.gain.cancelScheduledValues(now);old.gain.gain.setTargetAtTime(0,now,.3);setTimeout(()=>{old.source.stop();old.source.disconnect();old.filter.disconnect();old.gain.disconnect();},1800);this.sceneNode=null;}
  if(!id)return;
  const ctx=this.ctx,buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),data=buffer.getChannelData(0);let brown=0;for(let i=0;i<data.length;i++){brown=(brown+Math.random()*.04-.02)/1.02;data[i]=brown*4;}
  const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value={gryffindor:800,slytherin:260,ravenclaw:1400,hufflepuff:620}[id]||700;const gain=ctx.createGain();gain.gain.value=0;gain.gain.setTargetAtTime(1,now,.5);source.connect(filter).connect(gain).connect(this.ambience);source.start();this.sceneNode={source,filter,gain};
 }
 effect(type='spell'){if(!this.ctx||this.settings.muted||!this.settings.effects.enabled||performance.now()-this.lastEffect<220)return;this.lastEffect=performance.now();const ctx=this.ctx,now=ctx.currentTime;[0,1,2].forEach(i=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=(type==='reward'?523.25:392)*[1,1.25,1.5][i];gain.gain.setValueAtTime(0,now+i*.08);gain.gain.linearRampToValueAtTime(this.settings.effects.volume/100*.15,now+i*.08+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+i*.08+.7);osc.connect(gain).connect(ctx.destination);osc.start(now+i*.08);osc.stop(now+i*.08+.8);osc.onended=()=>{osc.disconnect();gain.disconnect();};});}
}
