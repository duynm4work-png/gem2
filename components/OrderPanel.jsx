'use client';
import {useState,useEffect,useCallback} from 'react';
import {TrendingUp,TrendingDown,Minus,Plus,LockKeyhole,ShieldCheck,Radio} from 'lucide-react';
import Dialog from './Dialog.jsx';
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v/100);
const count=v=>new Intl.NumberFormat('vi-VN').format(v);

export default function OrderPanel({state:s,remaining,busy,online,onConfirm,error}) {
  const [choice,setChoice]=useState(null),[draft,setDraft]=useState(''),[open,setOpen]=useState(false);
  const close=useCallback(()=>setOpen(false),[]);
  const me=s.me,price=s.event.execution;
  const buyingPower=me?Math.floor(me.cash/price):0;
  const quantityMode=s.rules.orderMode==='quantity';
  const locked=!!me?.choice,action=me?.choice||choice;
  const max=action==='BUY'?buyingPower:me?.shares||0;
  const quantity=action==='HOLD'?0:quantityMode?(draft===''?NaN:Number(draft)):max;
  const valid=action==='HOLD'||!!action&&Number.isSafeInteger(quantity)&&quantity>0&&quantity<=max;
  const disabled=busy||locked||remaining===0||!online;
  const value=valid?quantity*price:0;
  const nextCash=me?me.cash+(action==='BUY'?-value:action==='SELL'?value:0):0;
  const nextShares=me?me.shares+(action==='BUY'&&valid?quantity:action==='SELL'&&valid?-quantity:0):0;
  useEffect(()=>{if(locked||remaining===0)setOpen(false);},[locked,remaining]);
  function choose(decision){
    setChoice(decision);const limit=decision==='BUY'?buyingPower:me.shares;
    setDraft(decision==='HOLD'||!limit?'':String(Math.max(1,Math.floor(limit/4))));setOpen(true);
  }
  function step(n){setDraft(String(Math.min(max,Math.max(1,(Number(draft)||0)+n))));}
  if(!me)return <section className="panel decision-panel host-orders">
    <div className="section-head"><h3>Tiến độ chốt lệnh</h3><Radio size={17}/></div>
    <div className="host-count"><strong>{s.locked}</strong><span>/ {s.count} người chơi</span></div>
    <div className="participation-track"><i style={{width:(s.count?s.locked/s.count*100:0)+'%'}}/></div>
    <p className="small-note">Cả phòng có cùng {s.rules.seconds} giây.<br/>Kết quả mở khi hết thời gian.</p>
  </section>;
  return <>
    <section className="panel decision-panel player-orders">
      <div className="section-head"><h3>Quyết định của bạn</h3><span className="muted">{s.locked} / {s.count} đã chốt</span></div>
      <div className="order-balance"><span>Tiền mặt <b>{money(me.cash)}</b></span><span>Đang giữ <b>{count(me.shares)} CP</b></span></div>
      {locked?<div className="locked" role="status"><ShieldCheck size={18}/><div>Đã khóa <b>{action}{action!=='HOLD'?' · '+count(me.choiceQuantity??max)+' CP':''}</b><small>Lệnh được xử lý khi hết giờ.</small></div></div>:
        <><div className="decisions">{[['BUY',quantityMode?'Chọn số cổ mua':'Mua tối đa',TrendingUp],['HOLD','Giữ vị thế',Minus],['SELL',quantityMode?'Chọn số cổ bán':'Bán toàn bộ',TrendingDown]].map(([decision,label,Icon])=><button key={decision}
          className={decision.toLowerCase()+(choice===decision?' selected':'')} aria-label={decision+' '+label}
          disabled={disabled||decision==='BUY'&&buyingPower===0||decision==='SELL'&&me.shares===0}
          onClick={()=>choose(decision)}><Icon size={18}/><b>{decision}</b><span>{label}</span></button>)}</div>
        <p className="order-status" role="status">{remaining===0?'Đã hết giờ · đang chốt kết quả…':!online?'Đang kết nối lại · tạm khóa gửi lệnh':'Chốt một lần · Không xác nhận: tự động HOLD'}</p></>}
    </section>
    {open&&!locked&&remaining>0&&<Dialog title={choice==='BUY'?'Mua thêm '+s.rules.symbol:choice==='SELL'?'Bán cổ phiếu '+s.rules.symbol:'Giữ nguyên danh mục'} onClose={close} sheet>
      <div className="sheet-market"><span>{s.rules.symbol} · {money(price)} / CP</span><b className={remaining<=10?'red':''}>{remaining}s còn lại</b></div>
      <div className="sheet-balance"><span>Tiền mặt <b>{money(me.cash)}</b></span><span>Đang giữ <b>{count(me.shares)} CP</b></span></div>
      {choice!=='HOLD'&&quantityMode&&<div className="quantity-editor">
        <div className="quantity-label"><label htmlFor="order-quantity">Số cổ phiếu {choice==='BUY'?'mua':'bán'}</label><span>Tối đa {count(max)} CP</span></div>
        <div className="quantity-control"><button className="secondary" aria-label="Giảm một cổ phiếu" disabled={disabled||Number(draft)<=1} onClick={()=>step(-1)}><Minus size={18}/></button>
          <input id="order-quantity" type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={draft} aria-invalid={draft!==''&&!valid} aria-describedby="quantity-help" disabled={disabled}
            onChange={ev=>{if(/^\d{0,15}$/.test(ev.target.value))setDraft(ev.target.value);}}
            onKeyDown={ev=>{if(ev.key==='ArrowUp'){ev.preventDefault();step(1);}if(ev.key==='ArrowDown'){ev.preventDefault();step(-1);}}}/>
          <button className="secondary" aria-label="Tăng một cổ phiếu" disabled={disabled||Number(draft)>=max} onClick={()=>step(1)}><Plus size={18}/></button></div>
        <div className="quantity-presets">{[25,50,75,100].map(percent=><button key={percent} disabled={disabled||max===0}
          className={Number(draft)===Math.max(1,Math.floor(max*percent/100))?'active':''}
          onClick={()=>setDraft(String(Math.max(1,Math.floor(max*percent/100))))}>{percent===100?'Tối đa':percent+'%'}</button>)}</div>
        <p id="quantity-help" className={'quantity-help '+(draft!==''&&!valid?'red':'')}>{draft!==''&&!valid?'Nhập số nguyên từ 1 đến '+count(max)+'.':'Cổ phiếu nguyên · Không vay, bán khống hoặc phí'}</p>
      </div>}
      {valid&&<div className="order-preview" aria-label="Xem trước giao dịch">
        <div><span>{choice==='BUY'?'Tổng tiền mua':choice==='SELL'?'Tiền thu về':'Không giao dịch'}</span><strong>{money(value)}</strong></div>
        <div><span>Tiền mặt sau lệnh</span><b>{money(nextCash)}</b></div><div><span>Cổ phiếu sau lệnh</span><b>{count(nextShares)} CP</b></div>
      </div>}
      {error&&<p className="sheet-error" role="alert">{error}</p>}
      <button className="primary wide confirm-order" disabled={!valid||disabled} onClick={()=>onConfirm({decision:choice,quantity:choice==='HOLD'?0:quantity})}>
        <LockKeyhole size={16}/>{busy?'Đang gửi lệnh…':!online?'Đang kết nối lại…':'Xác nhận '+choice+(choice!=='HOLD'&&valid?' · '+count(quantity)+' CP':'')}</button>
      <p className="small-note">Xác nhận xong không đổi lệnh.<br/>Đóng phiếu này chưa gửi lệnh; đồng hồ vẫn chạy.</p>
    </Dialog>}
  </>;
}
