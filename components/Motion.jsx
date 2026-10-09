'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v/100);

export function AnimatedMoney({value}) {
  const [display,setDisplay]=useState(value);
  const shown=useRef(value);
  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){shown.current=value;setDisplay(value);return;}
    const from=shown.current,start=performance.now();let frame;
    function tick(now){const progress=Math.min(1,(now-start)/480);const next=Math.round(from+(value-from)*(1-Math.pow(1-progress,3)));shown.current=next;setDisplay(next);if(progress<1)frame=requestAnimationFrame(tick);}
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[value]);
  return <span><span aria-hidden="true">{money(display)}</span><span className="sr-only">{money(value)}</span></span>;
}

export function RevealPulse({code,round,phase}) {
  const previous=useRef(null);
  const [active,setActive]=useState(false);
  useEffect(()=>{
    const before=previous.current;previous.current={code,round,phase};
    const changed=before?.code===code&&before?.round===round&&before?.phase==='decision'&&phase==='reveal';
    setActive(false);
    if(!changed)return;
    document.getElementById('round-result')?.scrollIntoView({behavior:'instant',block:'start'});
    if(document.visibilityState!=='visible'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    setActive(true);const timer=setTimeout(()=>setActive(false),780);
    return()=>clearTimeout(timer);
  },[code,round,phase]);
  if(!active)return null;
  return createPortal(<div className="reveal-pulse" role="status"><span>VÒNG {String(round+1).padStart(2,'0')} · ĐÃ HẾT GIỜ</span><strong>Thị trường lên tiếng.</strong><i/></div>,document.body);
}
