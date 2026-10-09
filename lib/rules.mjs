// Public rules only. Historical prices and outcomes stay on the server.
export const RULES = Object.freeze({
  cash: 10000000, shares: 2000, reference: 18504,
  symbol: 'NVDA', company: 'NVIDIA CORPORATION', exchange: 'NASDAQ', currency: 'USD',
  periodLabel: '25/09—20/11/2025', roundCount: 9, seconds: 60, revealSeconds: 15, maxPlayers: 50, orderMode: 'quantity',
  priceSource: 'https://finance.yahoo.com/quote/NVDA/history/',
  priceBasis: 'USD; OHLCV đóng cửa lịch sử theo ngày, dữ liệu Yahoo Finance; không nội suy intraday.',
  dataset: 'nvda-yahoo-ohlcv-2025-09-25-to-2025-11-20-v2'
});
