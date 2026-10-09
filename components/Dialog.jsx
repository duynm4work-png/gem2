'use client';
import {useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import {X} from 'lucide-react';

// Portals keep sheets above sticky headers and outside transformed game panels.
export default function Dialog({title, onClose, children, sheet=false}) {
  const ref=useRef(null);
  useEffect(()=>{
    const previous=document.activeElement;
    const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    ref.current?.focus({preventScroll:true});
    function key(event) {
      if(event.key==='Escape'){event.preventDefault();onClose();}
      if(event.key!=='Tab')return;
      const elements=[...ref.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]')]
        .filter(el=>el.getClientRects().length);
      if(!elements.length){event.preventDefault();return;}
      const first=elements[0],last=elements.at(-1);
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===ref.current)){event.preventDefault();first.focus();}
    }
    document.addEventListener('keydown',key);
    return()=>{
      document.removeEventListener('keydown',key);
      document.body.style.overflow=overflow;
      if(previous?.isConnected)previous.focus({preventScroll:true});
    };
  },[onClose]);
  return createPortal(<div className={'overlay '+(sheet?'sheet-overlay':'')} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <section ref={ref} className={'modal '+(sheet?'order-sheet':'')} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
      <div className="section-head"><h2>{title}</h2><button className="icon" onClick={onClose} aria-label="Đóng"><X size={20}/></button></div>
      {children}
    </section>
  </div>,document.body);
}
