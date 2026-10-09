// API-handler integration test with a controlled clock. No clock override is
// included in the running game; the real server always uses Date.now().
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const folder = mkdtempSync(path.join(tmpdir(), 'stock-api-v2-'));
process.env.GAME_DB_PATH = path.join(folder, 'test.sqlite');
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.ABLY_API_KEY = '';
delete process.env.VERCEL;
const {POST} = await import('../app/api/game/route.js');
const realNow = Date.now;
let clock = realNow();
Date.now = () => clock;
const call = async body => {
  const response = await POST(new Request('http://localhost:3000/api/game', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
  }));
  return {status:response.status, ...await response.json()};
};
try {
  const host = await call({action:'create'});
  assert.equal(host.status, 200);
  const code = host.state.code;
  const players = await Promise.all(Array.from({length:50}, (_, i) =>
    call({action:'join', code, name:'Người chơi ' + (i + 1)})));
  assert.equal(players.filter(p => p.status === 200).length, 50);
  assert.equal((await call({action:'join', code, name:'Overflow'})).status, 400);
  let state = (await call({action:'start', code, token:host.token, phase:'lobby', round:-1})).state;
  for (let round = 0; round < 9; round++) {
    assert.equal(state.phase, 'decision');
    assert.equal(state.deadline - state.serverNow, 60000);
    const visibleChartLength = state.event.chart.length;
    assert.ok(visibleChartLength >= 9 && visibleChartLength <= 22);
    assert.equal(state.event.chart.at(-1).date, state.event.date);
    assert.ok(state.event.chart.every(p => p.date <= state.event.date));
    clock += 1234;
    const orders = await Promise.all(players.map((p, i) => call({
      action:'decide', code, token:p.token, round,
      decision:['BUY', 'HOLD', 'SELL'][i % 3], quantity:i % 3 === 1 ? 0 : 10 + i
    })));
    assert.equal(orders.filter(p => p.status === 200).length, 50);
    assert.equal((await call({action:'decide', code, token:players[0].token, round,
      decision:'BUY', quantity:1})).status, 400);
    state = (await call({action:'state', code, token:host.token})).state;
    assert.equal(state.locked, 50);
    assert.equal(state.event.reveal, undefined);
    assert.ok(state.players.every(p => p.decision === null && p.quantity === null));
    assert.equal((await call({action:'next', code, token:players[0].token, round, phase:'decision'})).status, 400);
    clock = state.deadline - 1;
    assert.equal((await call({action:'state', code, token:host.token})).state.phase, 'decision');
    clock++;
    state = (await call({action:'state', code, token:host.token})).state;
    assert.equal(state.phase, 'reveal');
    assert.ok(state.event.chart.length >= visibleChartLength);
    assert.equal(state.event.chart.at(-1).date, state.event.revealDate);
    assert.equal(state.event.chart.at(-1).close, state.event.reveal);
    assert.equal(state.revealDeadline-state.serverNow, 15000);
    assert.equal((await call({action:'next', code, token:host.token, round, phase:'reveal'})).status, 400);
    clock = state.revealDeadline;
    state = (await call({action:'state', code, token:host.token})).state;
    const reconnect = (await call({action:'state', code, token:players[0].token})).state;
    assert.equal(reconnect.me.snapshots.length, round + 1);
    assert.equal(reconnect.me.shares, 2000 + (round + 1) * 10);
    assert.equal(reconnect.me.snapshots.at(-1).quantity, 10);
    state = (await call({action:'next', code, token:host.token, round, phase:'reveal'})).state;
  }
  assert.equal(state.phase, 'finished');
  assert.equal(state.replays.length, 50);
  assert.ok(state.replays.every(p => p.snapshots.length === 9));
  console.log(JSON.stringify({status:'PASS', players:50, rounds:9, acceptedOrders:450,
    clock:'controlled, 60 seconds per round', capacityGuard:true, reconnect:true,
    hiddenOutcome:true, immutableOrders:true, hostAuthorization:true}));
} finally {
  Date.now = realNow;
  globalThis.__gameDB?.close();
  globalThis.__gameDB = null;
  rmSync(folder, {recursive:true, force:true});
}
