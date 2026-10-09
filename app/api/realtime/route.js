import {get} from '../../../lib/store.mjs';
import {auth} from '../../../lib/engine.mjs';
import {realtime} from '../../../lib/realtime.mjs';
export const runtime='nodejs';
export async function POST(req){try{const {code,token}=await req.json();if(!/^[A-Z2-9]{6}$/.test(code))throw Error('Invalid room');const row=await get(code);if(!row)throw Error('Room missing');auth(row.state,token);const a=realtime();if(!a)return Response.json({error:'Polling mode'},{status:503});const signed=await a.auth.createTokenRequest({capability:JSON.stringify({['game:'+code]:['subscribe']}),ttl:3600000});return Response.json(signed,{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Unauthorized'},{status:403});}}
