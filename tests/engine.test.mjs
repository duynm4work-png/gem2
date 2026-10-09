import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRoom,addPlayer,act,view,trade,settle,auth} from '../lib/engine.mjs';
import {EVENTS,RULES} from '../lib/events.mjs';
const host='h'.repeat(64), player='p'.repeat(64);
function room(){const r=makeRoom('ABC234',host);addPlayer(r,'Duy',player);return r;}
function start(r,t=1000){act(r,host,{action:'start',round:-1,phase:'lobby'},t);}
test('partial BUY and SELL preserve the remainder, with exact cent arithmetic',()=>{
 assert.deepEqual(trade(800000,20,'BUY',10000,30),{cash:500000,shares:50});
 assert.deepEqual(trade(800000,20,'SELL',10000,7),{cash:870000,shares:13});
 assert.deepEqual(trade(1050,4,'BUY',400,2),{cash:250,shares:6});
 assert.deepEqual(trade(1050,4,'SELL',400,4),{cash:2650,shares:0});
 assert.deepEqual(trade(20,4,'HOLD',400,0),{cash:20,shares:4});
});
test('invalid quantities, overdraft, shorts, unsafe totals and fake HOLD are rejected',()=>{
 for(const q of [undefined,null,0,-1,1.1,'2',NaN,Infinity,Number.MAX_SAFE_INTEGER])
   assert.throws(()=>trade(1000,10,'BUY',123,q));
 assert.throws(()=>trade(1000,10,'BUY',123,9));
 assert.throws(()=>trade(1000,10,'SELL',123,11));
 assert.throws(()=>trade(1000,10,'HOLD',123,2));
 assert.throws(()=>trade(Number.MAX_SAFE_INTEGER,1,'SELL',123,1));
});
test('500 varied transactions conserve execution-price wealth and leave non-negative holdings',()=>{
 for(let i=1;i<=500;i++){
  const cash=i*17053+999, shares=i%47, price=i%179+1;
  const quantity=Math.floor(cash/price)%(i+1);
  if(quantity){
   const r=trade(cash,shares,'BUY',price,quantity);
   assert.equal(BigInt(r.cash)+BigInt(r.shares)*BigInt(price),BigInt(cash)+BigInt(shares)*BigInt(price));
   assert.ok(r.cash>=0&&r.shares>=shares);
   assert.deepEqual(trade(r.cash,r.shares,'SELL',price,quantity),{cash,shares});
  }
 }
});
test('all 9 rolling datasets agree on event date, execution price and next-session outcome',()=>{
 assert.equal(EVENTS.length,9);
 for(const e of EVENTS){
  assert.ok(e.chart.length>=9 && e.chart.length<=22);
  const executionIndex=e.chart.findIndex(point=>point.date===e.date);
  const revealIndex=e.chart.findIndex(point=>point.date===e.revealDate);
  assert.ok(executionIndex>=0 && revealIndex>executionIndex);
  assert.equal(e.chart[executionIndex].close,e.execution);
  assert.equal(e.chart[revealIndex].close,e.reveal);
  assert.equal(new Set(e.chart.map(p=>p.date)).size,e.chart.length);
  e.chart.forEach((p,i)=>{assert.ok(Number.isSafeInteger(p.close)&&p.close>0);if(i)assert.ok(p.date>e.chart[i-1].date);});
 }
 for(let i=1;i<EVENTS.length;i++) assert.equal(EVENTS[i].execution,EVENTS[i-1].reveal);
 assert.equal(EVENTS[0].execution,18504);
 assert.equal(EVENTS[0].reveal,19257);
 assert.equal(EVENTS[5].execution,18028);
 assert.equal(EVENTS[6].execution,19521);
 assert.equal(EVENTS[8].execution,18652);
 assert.ok(EVENTS[0].bullets.some(s=>s.includes('20 tỷ USD')));
});
test('server filters future chart points, outcomes, other quantities and credentials',()=>{
 const r=room();start(r);act(r,player,{action:'decide',round:0,decision:'BUY',quantity:57},1100);
 const v=view(r,host,1200);
 assert.equal(v.event.reveal,undefined);assert.equal(v.event.revealDate,undefined);assert.equal(v.event.lesson,undefined);
 assert.equal(v.event.chart.length,EVENTS[0].chart.filter(p=>p.date<=EVENTS[0].date).length);assert.equal(v.event.chart.at(-1).date,EVENTS[0].date);
 assert.equal(v.players[0].decision,null);assert.equal(v.players[0].quantity,null);
 assert.equal(JSON.stringify(v).includes(r.host),false);
 assert.equal(view(r,player).me.choiceQuantity,57);
 // Poison every unrevealed value: the decision-phase response must remain identical.
 const poisoned=structuredClone(r);poisoned.events[0].reveal=99999999;
 poisoned.events[0].chart.at(-1).close=99999999;
 poisoned.events[0].revealDate='2099-12-31';
 poisoned.events[1].title='FUTURE_SECRET';
 assert.deepEqual(view(poisoned,host,1200),v);
 settle(r,61000);assert.equal(view(r,host).event.chart.length,EVENTS[0].chart.length);
});
test('60-second deadline is exact, cannot settle early and default HOLD scores 60000 ms',()=>{
 const r=room();start(r);
 assert.equal(r.deadline-r.started,60000);
 assert.equal(settle(r,60999),false);assert.equal(settle(r,61000),true);
 const p=r.players[0];assert.equal(p.snapshots[0].decision,'HOLD');
 assert.equal(p.snapshots[0].quantity,0);assert.equal(p.snapshots[0].auto,true);
 assert.equal(p.cash,RULES.cash);assert.equal(p.shares,RULES.shares);assert.equal(p.totalMs,60000);
 assert.equal(settle(r,62000),false);assert.equal(p.snapshots.length,1);
});
test('round P&L equals the change in total portfolio value and reveal lasts the configured minimum',()=>{
 const r=room();start(r);
 act(r,player,{action:'decide',round:0,decision:'BUY',quantity:10},1100);
 settle(r,61000);
 const first=r.players[0].snapshots[0];
 assert.equal(first.portfolio_value_before,RULES.cash+RULES.shares*RULES.reference);
 assert.equal(first.round_pnl,first.portfolio_value_after-first.portfolio_value_before);
 assert.equal(view(r,player).me.roundPnl,first.round_pnl);
 assert.equal(view(r,player).me.delta,first.round_pnl);
 assert.equal(view(r,host,61000).revealDeadline,61000+RULES.revealSeconds*1000);
 assert.throws(()=>act(r,host,{action:'next',round:0,phase:'reveal'},61000+RULES.revealSeconds*1000-1),/chờ xem kết quả/);
 assert.equal(act(r,host,{action:'next',round:0,phase:'reveal'},61000+RULES.revealSeconds*1000),true);
 act(r,player,{action:'decide',round:1,decision:'HOLD',quantity:0},61000+RULES.revealSeconds*1000+100);
 settle(r,121000+RULES.revealSeconds*1000);
 const second=r.players[0].snapshots[1];
 assert.equal(second.portfolio_value_before,first.portfolio_value_after);
 assert.equal(second.round_pnl,second.portfolio_value_after-first.portfolio_value_after);
 assert.equal(second.round_pnl,second.gap_pnl+second.event_pnl);
});
test('last-millisecond orders succeed; at deadline orders are late; unconfirmed drafts do nothing',()=>{
 const r=room();start(r);
 act(r,player,{action:'decide',round:0,decision:'SELL',quantity:13},60999);
 settle(r,61000);assert.equal(r.players[0].snapshots[0].quantity,13);
 const late=room();start(late);assert.throws(()=>act(late,player,{action:'decide',round:0,decision:'BUY',quantity:1},61000));
 assert.equal(late.players[0].snapshots[0].decision,'HOLD');
});
test('host can skip remaining time only after every player has decided',()=>{
 const r=makeRoom('ABC234',host);addPlayer(r,'Duy',player);addPlayer(r,'Team B','b');start(r);
 const skip={action:'skip',round:0,phase:'decision'};
 assert.throws(()=>act(r,host,skip,2000),/tất cả người chơi đã xác nhận/);
 assert.equal(r.phase,'decision');
 act(r,player,{action:'decide',round:0,decision:'BUY',quantity:10},1200);
 act(r,'b',{action:'decide',round:0,decision:'HOLD',quantity:0},1800);
 assert.throws(()=>act(r,player,skip,2000),/Chỉ quản trò/);
 assert.equal(act(r,host,skip,2000),true);
 assert.equal(r.phase,'reveal');
 assert.deepEqual(r.players.map(p=>p.snapshots[0].auto),[false,false]);
 assert.deepEqual(r.players.map(p=>p.snapshots[0].response_ms),[200,800]);
 assert.equal(r.players[0].snapshots[0].quantity,10);
 assert.equal(r.players[1].snapshots[0].quantity,0);
});
test('validation happens on confirmation; reject cannot consume the only order',()=>{
 const r=room();start(r);
 for(const q of [undefined,0,0.5,100000000])assert.throws(()=>act(r,player,{action:'decide',round:0,decision:'BUY',quantity:q},1100));
 assert.equal(Object.keys(r.decisions).length,0);
 act(r,player,{action:'decide',round:0,decision:'BUY',quantity:91},1200);
 assert.equal(r.players[0].cash,RULES.cash);assert.equal(r.players[0].shares,RULES.shares);
 assert.throws(()=>act(r,player,{action:'decide',round:0,decision:'SELL',quantity:1},1300));
 assert.throws(()=>act(r,host,{action:'decide',round:0,decision:'BUY',quantity:1},1300));
 assert.throws(()=>act(r,player,{action:'next'},1300));
 assert.throws(()=>auth(r,'fake'));
});
test('50 seats, unique normalized names, no late join',()=>{
 const r=makeRoom('ABC234',host);for(let i=0;i<50;i++)addPlayer(r,'p'+i,String(i));
 assert.throws(()=>addPlayer(r,'extra','z'));
 const a=room();assert.throws(()=>addPlayer(a,'duy','x'));start(a);assert.throws(()=>addPlayer(a,'Late','x'));
});
test('nine rounds match an independent integer oracle including all between-event gaps',()=>{
 const r=room();let t=1000, cash=BigInt(RULES.cash), shares=BigInt(RULES.shares);start(r,t);
 const choices=[['BUY',100],['SELL',50],['HOLD',0],['BUY',100],['SELL',75],['BUY',75],['SELL',100],['BUY',100],['HOLD',0]];
 for(let i=0;i<9;i++){
  const [decision,quantity]=choices[i], price=BigInt(EVENTS[i].execution);
  act(r,player,{action:'decide',round:i,decision,quantity},t+750);
  if(decision==='BUY'){cash-=BigInt(quantity)*price;shares+=BigInt(quantity);}
  if(decision==='SELL'){cash+=BigInt(quantity)*price;shares-=BigInt(quantity);}
  settle(r,t+60000);
  const snap=r.players[0].snapshots[i];
  assert.equal(BigInt(snap.cash_after),cash);assert.equal(BigInt(snap.shares_after),shares);
  assert.equal(BigInt(snap.portfolio_value_after),cash+shares*BigInt(EVENTS[i].reveal));
  const previous=i?r.players[0].snapshots[i-1].portfolio_value_after:RULES.cash+RULES.shares*RULES.reference;
  assert.equal(snap.portfolio_value_after-previous,snap.gap_pnl+snap.event_pnl);
  assert.equal(snap.quantity,quantity);assert.equal(snap.trade_value,quantity*EVENTS[i].execution);
  t+=61000+RULES.revealSeconds*1000;act(r,host,{action:'next',round:i,phase:'reveal'},t);
 }
 assert.equal(r.phase,'finished');assert.equal(r.players[0].totalMs,6750);
 assert.equal(view(r,host).replays[0].snapshots.length,9);assert.equal(view(r,player).replays,null);
});
test('duplicate or stale host command cannot advance twice',()=>{
 const r=room();start(r);settle(r,61000);
 const cmd={action:'next',round:0,phase:'reveal'};assert.throws(()=>act(r,host,cmd,62000),/chờ xem kết quả/);
 act(r,host,cmd,61000+RULES.revealSeconds*1000);assert.throws(()=>act(r,host,cmd,61001+RULES.revealSeconds*1000));assert.equal(r.round,1);
 assert.throws(()=>act(r,player,{action:'decide',round:0,decision:'BUY',quantity:1},63000));
});
test('ties use response time then shared rank; scaling preserves original allocation',()=>{
 const r=room();addPlayer(r,'B','b');start(r);
 act(r,player,{action:'decide',round:0,decision:'HOLD',quantity:0},1500);
 act(r,'b',{action:'decide',round:0,decision:'HOLD',quantity:0},2000);settle(r,61000);
 assert.equal(view(r,host).players[0].name,'Duy');r.players[1].totalMs=500;
 assert.deepEqual(view(r,host).players.map(p=>p.rank),[1,1]);
 assert.equal(RULES.cash/1000000,RULES.shares/200);
});
test('legacy rooms keep old 20-second, max-size orders and room snapshots stay independent',()=>{
 const r=room();delete r.rules.orderMode;r.rules.seconds=20;r.players[0].cash=1050;r.players[0].shares=4;r.events[0].execution=400;
 start(r);act(r,player,{action:'decide',round:0,decision:'BUY'},1100);settle(r,21000);
 assert.equal(r.players[0].cash,250);assert.equal(r.players[0].shares,6);
 assert.notEqual(EVENTS[0].execution,400);
});
