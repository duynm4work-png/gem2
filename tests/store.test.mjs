import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
const dir=mkdtempSync(path.join(tmpdir(),'stock-'));process.env.GAME_DB_PATH=path.join(dir,'test.sqlite');
const {insert,mutate,get,cas}=await import('../lib/store.mjs');
test('concurrent writes preserve 50 updates and reject stale version',async()=>{try{await insert({code:'LOAD22',n:0});const old=await get('LOAD22');await Promise.all(Array.from({length:50},()=>mutate('LOAD22',r=>{r.n++;return true;})));assert.equal((await get('LOAD22')).state.n,50);assert.equal(await cas('LOAD22',old.version,old.state),false);}finally{globalThis.__gameDB?.close();globalThis.__gameDB=null;rmSync(dir,{recursive:true,force:true});}});
