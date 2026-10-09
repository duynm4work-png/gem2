# Migration note — Đừng để tiền rơi v2 → NVIDIA NVDA

## Mục tiêu đã chốt

- Mã: NVIDIA (NVDA), NASDAQ.
- Dataset: **41 phiên OHLCV liên tiếp, 25/09/2025 → 20/11/2025**.
- 9 vòng, BUY / HOLD / SELL + quantity; **không phải trắc nghiệm**.
- Mỗi vòng có một chart candlestick dài; các chart lấy từ cùng một chuỗi lịch sử và chồng lấn để tạo cảm giác liên tục.
- 9 mốc execution → reveal có **4 tăng / 5 giảm**.
- Không lạm phát, không reset: tài sản cuối vòng trước = cơ sở đầu vòng sau.
- Sau mỗi vòng hiển thị `round_pnl`; leaderboard xếp theo tổng tài sản.

## File đã sửa

### `lib/rules.mjs`
Cấu hình NVDA, giá tham chiếu $185.04, 9 vòng, 60 giây, nguồn Yahoo Finance và không có CPI/inflation.

### `lib/price-history.json`
41 phiên OHLCV NVDA, đơn vị cent cho giá và integer cho volume.

### `lib/event-content.json`
9 tình huống thực tế, mỗi event có `chartStart`, `date`, `revealDate`, câu hỏi dạng BUY/HOLD/SELL + quantity, lesson, metrics và nguồn.

### `lib/events.mjs`
Cắt chart từ chuỗi 41 phiên chung. Kiểm tra execution/reveal tồn tại và đúng thứ tự.

### `lib/engine.mjs`
P&L được xác định rõ từ snapshot: `portfolio_value_after - portfolio_value_before`; `gap_pnl` + `event_pnl` phải bằng cùng con số.

### `components/MarketChart.jsx`
Biểu đồ chuyển sang **candlestick + close line + volume**, khung rộng hơn, có OHLCV readout, marker quyết định/reveal và không leak giá tương lai. Readout trước reveal chỉ dùng điểm đang được phép hiển thị.

### `components/Game.jsx`
- P&L sau mỗi vòng lấy trực tiếp `s.me.roundPnl`.
- Branding chuyển sang NVIDIA.
- Logo dùng official NVIDIA horizontal logo asset từ nvidia.com.
- Bỏ inflation và text Netflix.

### `components/GameAudio.jsx`
Outcome audio dùng `roundPnl` thay cho biến delta cũ.

### Tests
Cập nhật test chart nối liền, P&L, 50 người/9 vòng và dataset NVDA.

## Kiểm thử lượt sửa cuối

- `node --test tests/*.test.mjs`: **16/16 PASS**.
- `node scripts/test-room.mjs`: **PASS — 50 người × 9 vòng × 450 lệnh**.
- `npm run build`: chưa hoàn tất trong môi trường này vì Next.js cố tải native SWC từ npm registry nhưng mạng test không truy cập được registry.

## Logo

Dùng official NVIDIA logo asset, không tự vẽ lại logo. NVIDIA brand guidelines yêu cầu dùng artwork chính thức và không recreate/customize logo.

## Git / Vercel

```bash
git status
git add .
git commit -m "Switch stock game from Netflix to NVIDIA NVDA"
git push
```

Sau deploy, **tạo room mới** vì room cũ có thể đã snapshot dataset/rules cũ trong SQLite/Supabase.
