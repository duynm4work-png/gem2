# Bản NVDA — Kết quả kiểm chứng

## Kiểm tra cuối lượt sửa

| Kiểm tra | Kết quả |
|---|---|
| `node --test tests/*.test.mjs` | **PASS — 16/16** |
| `node scripts/test-room.mjs` | **PASS — 50 người × 9 vòng × 450 lệnh** |
| Execution → reveal đúng dữ liệu | PASS |
| 9 reveal cân bằng | PASS — 4 tăng / 5 giảm |
| Nối tài sản qua vòng | PASS |
| Round P&L | PASS — snapshot `after - before` |
| Future chart data trước reveal | PASS — server filter |
| Candlestick OHLCV | PASS bằng dataset history thật |
| NVIDIA branding | PASS — không còn NFLX/Netflix trong runtime code |
| Inflation/CPI | PASS — không còn trong rules/runtime |
| `npm run build` | **CHƯA XÁC NHẬN** — môi trường test không tải được native SWC từ npm registry |

## Round P&L

Mỗi snapshot lưu `portfolio_value_before`, `portfolio_value_after` và `round_pnl = portfolio_value_after - portfolio_value_before`.

Frontend reveal panel và audio outcome đều đọc `s.me.roundPnl`. Đây là thay đổi để tránh UI cũ đọc biến `delta` rồi hiện `$0.00`.

## Chart

Chart chính của mỗi vòng dùng nến OHLC, close line và volume; trước reveal chỉ render các nến đến ngày quyết định. Khi mở reveal, server mới trả thêm phần còn lại đến ngày reveal. Không tạo intraday giả.
