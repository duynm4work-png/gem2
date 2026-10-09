import { randomBytes, createHash } from 'node:crypto';
import { EVENTS, RULES } from './events.mjs';
export const hash = t => createHash('sha256').update(String(t)).digest('hex');
export const token = () => randomBytes(32).toString('hex');

export function makeRoom(code, hostToken, solo = false) {
  return { code, host: hash(hostToken), solo, created: Date.now(), phase: 'lobby', round: -1,
    deadline: null, started: null, revealedAt: null, players: [], decisions: {}, events: structuredClone(EVENTS), rules: { ...RULES } };
}
export function addPlayer(r, name, t) {
  if (r.phase !== 'lobby') throw Error('Ván đã bắt đầu. Hãy chờ phòng mới.');
  if (r.players.length >= r.rules.maxPlayers) throw Error('Phòng đã đủ ' + r.rules.maxPlayers + ' người.');
  name = String(name || '').trim().normalize('NFC');
  if (!name || name.length > 24) throw Error('Tên cần từ 1–24 ký tự.');
  if (r.players.some(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw Error('Tên đã được sử dụng trong phòng.');
  const p = { id: randomBytes(8).toString('hex'), secret: hash(t), name, cash: r.rules.cash,
    shares: r.rules.shares, totalMs: 0, snapshots: [] };
  r.players.push(p); return p;
}
export function auth(r, t) {
  const h = hash(t), player = r.players.find(p => p.secret === h), host = r.host === h;
  if (!host && !player) throw Error('Phiên không hợp lệ. Hãy vào lại phòng.');
  return { host, player };
}
export function trade(cash, shares, decision, price, quantity) {
  if (!Number.isSafeInteger(cash) || cash < 0 || !Number.isSafeInteger(shares) || shares < 0 ||
      !Number.isSafeInteger(price) || price <= 0) throw Error('Danh mục không hợp lệ.');
  if (decision === 'HOLD') {
    if (quantity !== undefined && quantity !== 0) throw Error('HOLD không có số lượng giao dịch.');
    return { cash, shares };
  }
  if (!['BUY', 'SELL'].includes(decision)) throw Error('Lệnh không hợp lệ.');
  if (!Number.isSafeInteger(quantity) || quantity <= 0) throw Error('Số cổ phiếu phải là số nguyên lớn hơn 0.');
  if (decision === 'BUY' && quantity > Math.floor(cash / price)) throw Error('Không đủ tiền mặt để mua số cổ phiếu này.');
  if (decision === 'SELL' && quantity > shares) throw Error('Số cổ phiếu bán vượt quá số đang giữ.');
  const value = quantity * price;
  const result = decision === 'BUY' ? { cash: cash - value, shares: shares + quantity } :
    { cash: cash + value, shares: shares - quantity };
  if (!Number.isSafeInteger(value) || !Number.isSafeInteger(result.cash) || !Number.isSafeInteger(result.shares))
    throw Error('Giá trị giao dịch vượt giới hạn.');
  return result;
}
// Existing rooms keep their original rules even when source code is updated.
function orderQuantity(r, p, d, price) {
  if (d.decision === 'HOLD') return 0;
  if (r.rules.orderMode === 'quantity') return d.quantity;
  return d.decision === 'BUY' ? Math.floor(p.cash / price) : p.shares;
}
export function settle(r, now, allowEarly = false) {
  if (r.phase !== 'decision' || (!allowEarly && now < r.deadline)) return false;
  if (allowEarly && (!r.players.length || r.players.some(p => !r.decisions[p.id]))) return false;
  const e = r.events[r.round];
  for (const p of r.players) {
    const d = r.decisions[p.id] || { decision: 'HOLD', quantity: 0, ms: r.rules.seconds * 1000, auto: true };
    const before = { cash: p.cash, shares: p.shares }, quantity = orderQuantity(r, p, d, e.execution);
    const after = quantity === 0 && r.rules.orderMode !== 'quantity' ? before :
      trade(p.cash, p.shares, d.decision, e.execution, quantity);
    const portfolioValueBefore = r.round
      ? p.snapshots.at(-1).portfolio_value_after
      : r.rules.cash + r.rules.shares * r.rules.reference;
    const portfolioValueAfter = after.cash + after.shares * e.reveal;
    p.cash = after.cash; p.shares = after.shares; p.totalMs += d.ms;
    p.snapshots.push({ round_id: e.id, date: e.date, decision: d.decision, quantity,
      trade_value: quantity * e.execution, auto: !!d.auto, response_ms: d.ms,
      cash_before: before.cash, shares_before: before.shares, execution_price: e.execution,
      cash_after: after.cash, shares_after: after.shares, reveal_price: e.reveal,
      portfolio_value_before: portfolioValueBefore, portfolio_value_after: portfolioValueAfter,
      round_pnl: portfolioValueAfter - portfolioValueBefore,
      event_pnl: after.shares * (e.reveal - e.execution),
      gap_pnl: r.round ? before.shares * (e.execution - r.events[r.round - 1].reveal) : 0 });
  }

r.phase = 'reveal';
r.revealedAt = allowEarly
  ? now - (r.rules.revealSeconds ?? 0) * 1000
  : now;
return true;
}
export function act(r, t, input, now = Date.now()) {
  const who = auth(r, t); const changed = settle(r, now);
  if (input.action === 'state') return changed;
  if (input.action === 'decide') {
    if (!who.player) throw Error('Quản trò không gửi lệnh của người chơi.');
    if (r.phase !== 'decision' || input.round !== r.round) throw Error('Vòng đã khóa hoặc đã chuyển vòng.');
    if (!['BUY', 'HOLD', 'SELL'].includes(input.decision)) throw Error('Lệnh không hợp lệ.');
    if (r.decisions[who.player.id]) throw Error('Lệnh đã xác nhận và không thể đổi.');
    const quantity = orderQuantity(r, who.player, input, r.events[r.round].execution);
    if (input.decision === 'HOLD' && input.quantity !== undefined && input.quantity !== 0)
      throw Error('HOLD không có số lượng giao dịch.');
    if (quantity !== 0 || r.rules.orderMode === 'quantity')
      trade(who.player.cash, who.player.shares, input.decision, r.events[r.round].execution, quantity);
    r.decisions[who.player.id] = { decision: input.decision, quantity, ms: Math.max(0, now - r.started) };
    return true;
  }
  if (!who.host) throw Error('Chỉ quản trò được điều khiển vòng.');
  if (input.action === 'skip') {
    if (input.round !== r.round || input.phase !== r.phase) throw Error('Màn hình đã thay đổi. Hãy thử lại.');
    if (r.phase !== 'decision') throw Error('Chỉ có thể bỏ qua thời gian trong vòng quyết định.');
    if (!settle(r, now, true)) throw Error('Chỉ có thể bỏ qua khi tất cả người chơi đã xác nhận lệnh.');
    return true;
  }
  if (input.action === 'start' || input.action === 'next') {
    if (input.round !== r.round || input.phase !== r.phase) throw Error('Màn hình đã thay đổi. Hãy thử lại.');
    if (input.action === 'start' && r.phase !== 'lobby') throw Error('Ván đã bắt đầu.');
    if (input.action === 'next' && r.phase !== 'reveal') throw Error('Chờ kết quả vòng hiện tại.');
    if (input.action === 'next' && now < (r.revealedAt ?? now) + (r.rules.revealSeconds ?? 0) * 1000)
      throw Error('Hãy chờ xem kết quả vòng này trước khi tiếp tục.');
    if (!r.players.length) throw Error('Cần ít nhất một người chơi.');
    if (r.round === r.events.length - 1) { r.phase = 'finished'; return true; }
    r.round++; r.phase = 'decision'; r.started = now; r.deadline = now + r.rules.seconds * 1000; r.decisions = {};
    return true;
  }
  throw Error('Thao tác không hợp lệ.');
}
export function view(r, t, now = Date.now()) {
  const { host, player } = auth(r, t), e = r.events[Math.max(0, r.round)];
  const revealed = ['reveal', 'finished'].includes(r.phase), price = revealed ? e.reveal : e.execution;
  const ranked = r.players.map(p => ({ id: p.id, name: p.name, cash: p.cash, shares: p.shares,
    wealth: p.cash + p.shares * price, totalMs: p.totalMs, locked: !!r.decisions[p.id],
    decision: revealed ? r.decisions[p.id]?.decision || 'HOLD' : null,
    quantity: revealed ? p.snapshots.at(-1)?.quantity ?? 0 : null,
    roundPnl: revealed ? (p.snapshots.at(-1)?.round_pnl ?? 0) : 0,
    delta: revealed ? (p.snapshots.at(-1)?.round_pnl ??
      (p.snapshots.at(-1)?.gap_pnl || 0) + (p.snapshots.at(-1)?.event_pnl || 0)) : 0
  })).sort((a, b) => b.wealth - a.wealth || a.totalMs - b.totalMs || a.name.localeCompare(b.name));
  ranked.forEach((p, i) => p.rank = i && p.wealth === ranked[i-1].wealth && p.totalMs === ranked[i-1].totalMs ? ranked[i-1].rank : i+1);
  return { code: r.code, solo: r.solo, host, phase: r.phase, round: r.round, serverNow: now,
    deadline: r.deadline, revealDeadline: revealed && r.revealedAt != null
      ? r.revealedAt + (r.rules.revealSeconds ?? 0) * 1000 : null,
    rules: r.rules, count: r.players.length, locked: Object.keys(r.decisions).length, players: ranked,
    me: player ? { ...ranked.find(p => p.id === player.id), choice: r.decisions[player.id]?.decision,
      choiceQuantity: r.decisions[player.id]?.quantity, roundPnl: player.snapshots.at(-1)?.round_pnl ?? 0,
      portfolioValueBefore: player.snapshots.at(-1)?.portfolio_value_before ?? (r.rules.cash + r.rules.shares * r.rules.reference),
      portfolioValueAfter: player.snapshots.at(-1)?.portfolio_value_after ?? (r.rules.cash + r.rules.shares * r.rules.reference),
      snapshots: player.snapshots } : null,
    event: r.phase === 'lobby' ? null : { id: e.id, date: e.date, title: e.title, eyebrow: e.eyebrow,
      text: e.text, bullets: e.bullets, question: e.question, metrics: e.metrics, execution: e.execution, sources: e.sources,
      // No future prices, date labels, chart bounds or sources before the reveal.
      chart: (e.chart || []).filter(p => p.date <= (revealed ? e.revealDate : e.date)).map(p => ({ date: p.date, open:p.open, high:p.high, low:p.low, close:p.close, volume:p.volume })),
      ...(revealed ? { reveal: e.reveal, revealDate: e.revealDate, lesson: e.lesson,
        priceSource: e.priceSource, eventSource: e.eventSource } : {}) },
    history: r.events.slice(0, r.round + (revealed ? 1 : 0)).map(x => ({ id: x.id, date: x.date,
      revealDate: x.revealDate, reveal: x.reveal, execution: x.execution, title: x.title })),
    replays: r.phase === 'finished' && host ? r.players.map(p => ({ id: p.id, name: p.name, snapshots: p.snapshots })) : null };
}
