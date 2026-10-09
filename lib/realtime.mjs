import Ably from 'ably';
export function realtime(){return process.env.ABLY_API_KEY?new Ably.Rest({key:process.env.ABLY_API_KEY,httpRequestTimeout:2000,httpMaxRetryCount:0}):null;}
export async function notify(code){const a=realtime();if(a)try{await a.channels.get('game:'+code).publish('changed',{});}catch{console.warn('Realtime unavailable; clients recover through polling.');}}
