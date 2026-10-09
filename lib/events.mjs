// Server-only question content and historical prices. Do not import into client components.
import content from './event-content.json' with {type:'json'};
import history from './price-history.json' with {type:'json'};
export {RULES} from './rules.mjs';
const byDate = new Map(history.map((p,i)=>[p.date,{...p,i}]));
export const EVENTS = content.map((event) => {
  const start = byDate.get(event.chartStart);
  const execution = byDate.get(event.date);
  const reveal = byDate.get(event.revealDate);
  if (!start || !execution || !reveal) throw Error('Sự kiện '+event.id+' có ngày không tồn tại trong price-history.json');
  const chart = history.slice(start.i, reveal.i + 1);
  const executionInChart = chart.some(point => point.date === event.date);
  const revealInChart = chart.some(point => point.date === event.revealDate);
  if (!executionInChart || !revealInChart || chart.findIndex(point => point.date === event.date) >= chart.findIndex(point => point.date === event.revealDate))
    throw Error('Vòng '+event.id+' không nối đúng mốc quyết định → reveal.');
  return { ...event, text:event.bullets.join(' '), chart, execution:execution.close, reveal:reveal.close };
});
