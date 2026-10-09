import {randomInt} from 'node:crypto';
import {makeRoom,addPlayer,token,act,view,settle,auth} from '../../../lib/engine.mjs';
import {insert,mutate} from '../../../lib/store.mjs';
import {notify} from '../../../lib/realtime.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req){try{
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin&&new URL(origin).host!==req.headers.get('host'))return Response.json({error:'Origin không hợp lệ'},{status:403});
 const raw=await req.text();if(raw.length>4096)return Response.json({error:'Yêu cầu quá dài'},{status:413});const b=JSON.parse(raw);
 let r,t=b.token;
 if(b.action==='create'){
  t=token();for(let i=0;i<10;i++){const code=Array.from({length:6},()=> 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[randomInt(32)]).join('');r=makeRoom(code,t,!!b.solo);if(b.solo)addPlayer(r,b.name||'Bạn',t);if(await insert(r))break;r=null;}if(!r)throw Error('Chưa tạo được phòng, thử lại.');
 }else{
  const code=String(b.code||'').toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))throw Error('Mã phòng gồm 6 ký tự.');
  if(b.action==='join'){t=token();r=await mutate(code,x=>{addPlayer(x,b.name,t);return true;});}
  else {if(typeof t!=='string'||t.length!==64)throw Error('Phiên không hợp lệ.');
   // Commit deadline settlement even when the submitted decision is too late.
   r=await mutate(code,x=>{auth(x,t);return settle(x,Date.now());});
   r=await mutate(code,x=>act(x,t,b,Date.now()));}
 }
 if(b.action!=='state')await notify(r.code);
 return Response.json({token:['create','join'].includes(b.action)?t:undefined,state:view(r,t),realtime:!!process.env.ABLY_API_KEY},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e.message);return Response.json({error:e.message||'Không thực hiện được thao tác.'},{status:400,headers:{'Cache-Control':'no-store'}});}}
