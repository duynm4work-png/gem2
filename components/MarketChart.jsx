'use client';
import {useMemo,useState} from 'react';
import {CandlestickChart,LockKeyhole,Volume2} from 'lucide-react';
const money=cents=>'$'+(cents/100).toFixed(2);
const date=value=>{const d=String(value).slice(0,10);return d.slice(8,10)+'/'+d.slice(5,7)};
const year=value=>String(value).slice(0,4);
const pointKey=p=>p.timestamp||p.date;
const scale=(v,min,max,top,bottom)=>bottom-(v-min)/(max-min)*(bottom-top);
export default function MarketChart({event,revealed}){
 const [hover,setHover]=useState(null); const all=event.chart||[];
 const points=useMemo(()=>all.filter(p=>p && Number.isFinite(p.close)&&Number.isFinite(p.high)&&Number.isFinite(p.low)&&Number.isFinite(p.open)),[all]);
 if(!points.length)return null;
 const W=1240,H=500,left=82,right=34,top=24,priceBottom=315,volumeTop=350,volumeBottom=445;
 const rawMin=Math.min(...points.map(p=>p.low)), rawMax=Math.max(...points.map(p=>p.high));
 const span=Math.max(40,rawMax-rawMin), min=Math.max(0,rawMin-span*.08), max=rawMax+span*.08;
 const step=(W-left-right)/Math.max(1,points.length-1), candleWidth=Math.max(5,Math.min(16,step*.55));
 const xy=points.map((p,i)=>({x:left+i*step,openY:scale(p.open,min,max,top,priceBottom),closeY:scale(p.close,min,max,top,priceBottom),highY:scale(p.high,min,max,top,priceBottom),lowY:scale(p.low,min,max,top,priceBottom)}));
 const maxVol=Math.max(...points.map(p=>p.volume||0),1);
 const decisionIndex=points.findIndex(p=>p.date===event.date), revealIndex=points.findIndex(p=>p.date===event.revealDate);
 const visibleEnd=revealed?revealIndex:decisionIndex;
 const visible=xy.slice(0,visibleEnd+1); const visiblePoints=points.slice(0,visibleEnd+1);
 const current=visiblePoints[Math.min(hover ?? visiblePoints.length-1, Math.max(0,visiblePoints.length-1))];
 const first=visiblePoints[0]?.close||event.execution; const last=visiblePoints.at(-1)?.close||event.execution;
 const change=(last/first-1)*100;
 const yTicks=[0,1,2,3,4].map(i=>({y:top+(priceBottom-top)*i/4,value:max-(max-min)*i/4}));
 const labelEvery=Math.max(1,Math.ceil(points.length/8));
 const labels=points.map((_,i)=>i===0||i===points.length-1||i%labelEvery===0||i===decisionIndex||i===revealIndex);
 const closePath=visible.map(p=>p.x+','+p.closeY).join(' ');
 return <section className="market-chart" aria-label={'Biểu đồ nến giá '+(event.symbol||'NVDA')}>
   <div className="chart-heading"><div><span className="eyebrow"><CandlestickChart size={15}/> DIỄN BIẾN THỊ TRƯỜNG</span><h2>{event.symbol||'NVDA'} <span>· Daily Candles + Volume</span></h2></div><span className={'trend-chip '+(change>=0?'green':'red')}>{change>=0?'+':''}{change.toFixed(2)}% trong khung</span></div>
   <div className="chart-readout"><span>{date(pointKey(current))}/{year(pointKey(current))}</span><strong>{money(current.close)}</strong><small>{current.date===event.date?'Mốc quyết định':current.date===event.revealDate?'Phiên kết quả':'Diễn biến lịch sử'}</small></div>
   <div className="candle-chart-shell"><svg viewBox={'0 0 '+W+' '+H} role="group" aria-label={'Biểu đồ candlestick '+(event.symbol||'NVDA')+', USD'}>
     {yTicks.map((tick,i)=><g key={'yt'+i}><line x1={left} x2={W-right} y1={tick.y} y2={tick.y} stroke="var(--line)" strokeDasharray="3 6"/><text x={left-12} y={tick.y+5} textAnchor="end" className="axis-label">{money(tick.value)}</text></g>)}
     <line x1={left} x2={W-right} y1={priceBottom} y2={priceBottom} stroke="var(--line)"/>
     <text x={left} y={volumeTop-18} className="volume-label">VOLUME</text>
     {visible.map((p,i)=>{const d=visiblePoints[i]; const up=d.close>=d.open; const color=up?'var(--green)':'var(--red)'; const bodyY=Math.min(p.openY,p.closeY), bodyH=Math.max(2,Math.abs(p.closeY-p.openY)); const volH=(d.volume||0)/maxVol*(volumeBottom-volumeTop); const isDecision=i===decisionIndex; const isReveal=i===revealIndex; return <g key={pointKey(d)} onPointerEnter={()=>setHover(i)} onPointerLeave={()=>setHover(null)} onFocus={()=>setHover(i)} tabIndex={0} role="button" aria-label={`${date(pointKey(d))}: Open ${money(d.open)}, High ${money(d.high)}, Low ${money(d.low)}, Close ${money(d.close)}`}>
       {isDecision&&<line x1={p.x} x2={p.x} y1={top} y2={volumeBottom} stroke="var(--gold)" strokeDasharray="5 7" opacity=".8"/>}
       <line x1={p.x} x2={p.x} y1={p.highY} y2={p.lowY} stroke={color} strokeWidth="2"/>
       <rect x={p.x-candleWidth/2} y={bodyY} width={candleWidth} height={bodyH} rx="1" fill={color} opacity=".96"/>
       <rect x={p.x-candleWidth/2} y={volumeBottom-volH} width={candleWidth} height={volH} rx="1" fill={color} opacity=".24"/>
       {isDecision&&!revealed&&<circle className="chart-halo" cx={p.x} cy={p.closeY} r="10" fill="none" stroke="var(--gold)"/>}
       {isReveal&&revealed&&<rect x={p.x-candleWidth/2-3} y={bodyY-3} width={candleWidth+6} height={bodyH+6} rx="2" fill="none" stroke="var(--gold)" strokeWidth="1.5"/>}
       {(labels[i]||isDecision||isReveal)&&<text x={p.x} y={priceBottom+24} textAnchor="middle" className="axis-label">{date(pointKey(d))}</text>}
     </g>})}
     {visible.length>1&&<polyline points={closePath} fill="none" stroke="var(--accent-light)" strokeWidth="1.4" opacity=".7" pointerEvents="none"/>}
     <line x1={left} x2={W-right} y1={volumeBottom} y2={volumeBottom} stroke="var(--line)"/>
   </svg></div>
   <div className="chart-legend"><span><i className="legend-candle-up"/> Nến tăng</span><span><i className="legend-candle-down"/> Nến giảm</span><span><i className="legend-decision"/> Điểm quyết định</span>{revealed&&<span><i className="legend-result"/> Phiên kết quả</span>}</div>
   <p className="chart-caption">{revealed?'Đã mở nến kết quả. Giá tính tài sản là giá đóng cửa lịch sử của phiên này.':<><LockKeyhole size={13}/> Đang hiển thị {visiblePoints.length} phiên lịch sử đến {date(event.date)}. Phần giá sau quyết định vẫn bị khóa.</>}</p>
   <details className="chart-data"><summary>Xem OHLCV · dữ liệu lịch sử</summary><div className="table-wrap"><table><thead><tr><th>Ngày</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Volume</th><th>Mốc</th></tr></thead><tbody>{points.slice(0,visibleEnd+1).map((p)=><tr key={pointKey(p)}><td>{date(pointKey(p))}/{year(pointKey(p))}</td><td>{money(p.open)}</td><td>{money(p.high)}</td><td>{money(p.low)}</td><td>{money(p.close)}</td><td>{new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(p.volume||0)}</td><td>{p.date===event.date?'Quyết định':p.date===event.revealDate?'Kết quả':'Lịch sử'}</td></tr>)}</tbody></table></div></details>
 </section>;
}
