'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {Volume2,VolumeX,Music2} from 'lucide-react';
import Dialog from './Dialog.jsx';
import {SoundEngine} from './sound-engine.mjs';
export default function GameAudio({state,remaining,online=true}){
 const engine=useRef(null),previous=useRef(null),attempt=useRef(0);
 const [enabled,setEnabled]=useState(false),[loading,setLoading]=useState(false),[volume,setVolume]=useState(35),[music,setMusic]=useState(true),[open,setOpen]=useState(false),[message,setMessage]=useState(''),[visible,setVisible]=useState(true);
 const close=useCallback(()=>setOpen(false),[]);
 const hostMusic=!state||!!state.host;
 const phase=state?.phase||'lobby',code=state?.code||'',round=state?.round??-1,choice=state?.me?.choice;
 const outcome=state?.me?state.me.roundPnl:(state?.event?.reveal??0)-(state?.event?.execution??0);
 const track=hostMusic&&music&&(phase==='lobby'?'lobby':phase==='decision'&&remaining>0?(remaining<=10?'tension':'decision'):null);
 useEffect(()=>{
  engine.current=new SoundEngine();
  try{const saved=JSON.parse(localStorage.getItem('stock-game-audio')||'null');if(saved){if(Number.isFinite(saved.volume))setVolume(Math.max(0,Math.min(100,saved.volume)));setMusic(saved.music!==false);}}catch{}
  const visibility=()=>{setVisible(!document.hidden);if(document.hidden)engine.current?.silence();};visibility();document.addEventListener('visibilitychange',visibility);
  return()=>{attempt.current++;document.removeEventListener('visibilitychange',visibility);engine.current?.close();};
 },[]);
 useEffect(()=>{engine.current?.volume(volume/100);try{localStorage.setItem('stock-game-audio',JSON.stringify({volume,music}));}catch{}},[volume,music]);
 useEffect(()=>{if(enabled&&visible&&online)engine.current?.music(track);else engine.current?.silence();},[enabled,visible,online,track]);
 useEffect(()=>{
  const old=previous.current;previous.current={code,round,phase,choice,remaining};
  if(!old||!enabled||!visible||!online||old.code!==code)return;
  const audio=engine.current;
  if(old.round===round&&old.phase==='decision'&&phase==='decision'){
   if(!old.choice&&choice)audio?.effect('confirm');
   if(remaining>0&&remaining<=3&&old.remaining>remaining)audio?.effect('tick');
  }
  if(old.round===round&&old.phase==='decision'&&phase==='reveal')audio?.effect(outcome>0?'gain':outcome<0?'loss':'neutral');
  if(old.phase==='reveal'&&phase==='finished')audio?.effect('finish');
 },[code,round,phase,choice,remaining,outcome,enabled,visible,online]);
 async function toggle(){
  if(enabled||loading){attempt.current++;setEnabled(false);setLoading(false);engine.current?.silence();return;}
  const id=++attempt.current;setLoading(true);setMessage('');
  try{await engine.current.unlock();if(id!==attempt.current)return;setEnabled(true);engine.current.volume(volume/100);engine.current.effect('confirm');}
  catch{if(id===attempt.current)setMessage('Chưa phát được âm thanh. Kiểm tra mạng rồi bấm bật lại.');}
  finally{if(id===attempt.current)setLoading(false);}
 }
 return <>
  <button className={'icon sound-toggle '+(enabled?'sound-on':'')} aria-label="Cài đặt âm thanh" title="Âm thanh" onClick={()=>setOpen(true)}>{enabled?<Volume2 size={18}/>:<VolumeX size={18}/>}</button>
  {open&&<Dialog title="Âm thanh sàn giao dịch" onClose={close}>
   <div className="sound-intro"><Music2 size={26}/><p>Funky nhẹ khi chờ. Hồi hộp lúc chốt.</p></div>
   <button className="primary wide" onClick={toggle}>{loading?'Đang tải · bấm để hủy':enabled?'Tắt âm thanh':'Bật âm thanh'}</button>
   <label className="sound-volume">Âm lượng <b>{volume}%</b><input type="range" min="0" max="100" value={volume} aria-label="Âm lượng" onChange={e=>setVolume(Number(e.target.value))}/></label>
   {hostMusic?<label className="sound-check"><input type="checkbox" checked={music} onChange={e=>setMusic(e.target.checked)}/> Nhạc nền cho máy quản trò / chơi thử</label>:<p className="small-note">Máy người chơi chỉ phát hiệu ứng. Nhạc nền do máy quản trò phát cho cả lớp.</p>}
   <div className="sound-samples">{[['confirm','Chốt lệnh'],['gain','Có lãi'],['loss','Có lỗ'],['finish','Tổng kết']].map(([name,label])=><button className="secondary" key={name} disabled={!enabled||!visible} onClick={()=>{engine.current.effect(name);}}>{label}</button>)}</div>
   {message&&<p role="alert" className="sheet-error">{message}</p>}
   <p className="small-note">Nhạc dừng khi chuyển tab hoặc mất kết nối. Mỗi lần mở lại trang, bấm bật để nghe. Âm lượng và lựa chọn nhạc được ghi nhớ.</p>
  </Dialog>}
 </>;
}
