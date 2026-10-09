export const SOUND_NAMES=['lobby','decision','tension','confirm','tick','gain','loss','neutral','finish'];
export class SoundEngine {
 constructor(url=name=>'/audio/'+name+'.wav') {this.url=url;this.buffers={};this.voices=new Set();this.context=null;this.track=null;this.disposed=false;}
 async unlock(){
  if(this.disposed)throw Error('Audio closed');
  if(!this.context){const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)throw Error('Audio unsupported');this.context=new C();this.master=this.context.createGain();this.master.gain.value=.35;this.master.connect(this.context.destination);}
  await this.context.resume();
  if(this.context.state!=='running')throw Error('Audio blocked');
  if(!this.loading)this.loading=Promise.all(SOUND_NAMES.map(async name=>{const r=await fetch(this.url(name));if(!r.ok)throw Error('Missing '+name);this.buffers[name]=await this.context.decodeAudioData(await r.arrayBuffer());})).catch(e=>{this.loading=null;throw e;});
  await this.loading;
 }
 volume(value){if(this.context)this.master.gain.setTargetAtTime(Math.max(0,Math.min(1,value)),this.context.currentTime,.04);}
 play(name,{loop=false,level=1}={}){
  const c=this.context;if(this.disposed||!c||c.state!=='running'||!this.buffers[name])return null;
  const source=c.createBufferSource(),gain=c.createGain();source.buffer=this.buffers[name];source.loop=loop;source.connect(gain);gain.connect(this.master);gain.gain.setValueAtTime(0,c.currentTime);gain.gain.linearRampToValueAtTime(level,c.currentTime+.015);
  const voice={source,gain,name};this.voices.add(voice);source.onended=()=>{this.voices.delete(voice);source.disconnect();gain.disconnect();};source.start();return voice;
 }
 stop(voice,fade=.08){if(!voice||!this.context)return;const now=this.context.currentTime;voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(0,now,.015);try{voice.source.stop(now+fade);}catch{} }
 music(name){if(this.track?.name===name)return;this.stop(this.track);this.track=name?this.play(name,{loop:true,level:.48}):null;}
 effect(name){for(const voice of this.voices)if(voice!==this.track)this.stop(voice,.03);return this.play(name,{level:.8});}
 silence(){this.track=null;for(const voice of this.voices)this.stop(voice,.03);}
 close(){this.disposed=true;this.silence();this.context?.close().catch(()=>{});}
}
