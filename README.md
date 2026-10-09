# ĐỪNG ĐỂ TIỀN RƠI · bản 2.0

Game lớp học tiếng Việt: NVIDIA, 9 sự kiện, tối đa 50 người. Có quản trò riêng và chế độ chơi một mình.

## Chạy trên Windows

1. Cài **Node.js 24** nếu máy chưa có: https://nodejs.org/.
2. Giải nén toàn bộ `Dung-De-Tien-Roi-v2.zip` vào một folder mới.
3. Mở folder `Dung-De-Tien-Roi-v2`, nhấp đúp **CHAY-GAME-WINDOWS.bat**.
4. Lần đầu, cửa sổ tự cài thư viện; cần có internet. Khi thấy **Ready**, mở **http://localhost:3000**.
5. Bấm **Chơi thử một mình** → **Bắt đầu 9 vòng**.
6. Đọc sự kiện và chart. Chọn BUY hoặc SELL, nhập số cổ, kiểm tra tiền/cổ sau lệnh rồi bấm **Xác nhận**. HOLD giữ nguyên vị thế.
7. Hết **60 giây**, kết quả mở. Bấm **Mở vòng 02** để tiếp tục. Sau vòng 9 mở bảng tổng kết.

Giữ cửa sổ chạy game mở. Nhấn Ctrl+C để dừng. Nếu đang chạy bản cũ ở cổng 3000, dừng cửa sổ cũ trước khi chạy bản này. Không mở file JSX bằng Live Server.

Có thể chạy bằng Terminal trong folder chứa `package.json`:

```powershell
npm ci
npm run dev
```

## Bản này thay đổi gì?

- **9 vòng × 60 giây**, chưa tính thời gian thảo luận ở màn hình kết quả.
- Mỗi người bắt đầu với **$100,000 tiền mặt + 2,000 cổ phiếu**. Tổng tài sản ban đầu **$129,460**, giữ tỷ lệ phân bổ tiền/cổ của bản cũ.
- BUY/SELL chọn số cổ nguyên. Có nút +/−, mức 25% / 50% / 75% / tối đa, cùng phần xem trước danh mục sau lệnh.
- 9 tình huống cập nhật theo tài liệu `questions+chart game.docx`; chỉnh số liệu có sai khác và tránh tiết lộ biến động sau tin trước khi chốt.
- Mỗi vòng có một cửa sổ chart 4–5 phiên từ cùng chuỗi 41 phiên; chỉ sau thời hạn mới thêm giá phiên reveal. Chạm/di chuột vào điểm giá hoặc mở **Xem bảng giá** để đọc số chính xác.
- Font Noto Sans có tiếng Việt được đóng gói tại chỗ, không cần tải font từ dịch vụ ngoài. Có đồng hồ bám theo khi cuộn, hiệu ứng chọn lệnh và công bố kết quả; hỗ trợ tắt chuyển động theo cài đặt thiết bị.

## Luật giữ nguyên

Mỗi vòng chỉ được xác nhận **một lần**. Chọn nút BUY/SELL chưa gửi lệnh; phải bấm Xác nhận. Hết giờ chưa xác nhận tự động HOLD và tính 60 giây phản hồi. Không vay, bán khống, cổ phiếu lẻ hay phí. Không loại người chơi.

Tiền và cổ phiếu được mang qua 9 vòng, chịu cả biến động giữa các mốc sự kiện. Xếp hạng theo tổng tài sản cuối game; nếu bằng nhau xét tổng thời gian phản hồi, bằng cả hai thì đồng hạng. Không có lạm phát; tài sản cuối vòng trước là tài sản đầu vòng sau.

Giá dùng **Yahoo Finance Close**, thống nhất giữa chart và khớp lệnh. Dataset gồm 41 phiên OHLCV NVDA từ 25/09/2025 đến 20/11/2025. Khớp ở close của ngày quyết định; định giá kết quả ở close của ngày reveal kế tiếp đã khóa trong event data. Đây là quy ước mô phỏng: đọc tin rồi được giao dịch ở giá trước tin, không phải giá bảo đảm có thể mua ngoài đời sau khi biết tin. Các giá và nguồn có trong `DATA-SOURCES.md`. Không sử dụng dữ liệu intraday không kiểm chứng.

Quản trò mở từng vòng sau thời gian thảo luận. Có thể kết thúc sớm khi tất cả người chơi đã xác nhận. Tổng thời gian ra quyết định là **9 phút**; thời gian buổi chơi sẽ dài hơn khi tính hướng dẫn và thảo luận.

## Chơi cùng lớp trong một Wi-Fi

1. Laptop chạy game, bấm **Tạo phòng · Quản trò**.
2. Trên laptop mở `ipconfig`, tìm IPv4 Wi-Fi, ví dụ `192.168.1.20`.
3. Các bạn mở `http://192.168.1.20:3000`, điền tên và mã phòng.
4. Khi đủ người, quản trò bấm **Bắt đầu 9 vòng**. Quản trò không chiếm một chỗ chơi.

Nếu Windows hỏi, cho Node truy cập mạng riêng. Quản trò cũng mở bằng địa chỉ IP để link sao chép dùng được trên điện thoại. `localhost` chỉ trỏ tới thiết bị đang mở. Một số Wi-Fi trường học chặn kết nối giữa các  thiết bị; có thể dùng điểm phát Wi-Fi riêng.

Tên trong phòng không được trùng. Không vào thêm sau khi bắt đầu. **Tải lại cùng tab** khôi phục đúng người chơi; đóng tab, xóa phiên hoặc bấm rời sẽ mất mã truy cập của tab. Khi thử host và player trên một máy, dùng cửa sổ riêng/ẩn danh; tránh nhân bản tab đang ở trong phòng.

Bản local lưu phòng bằng SQLite tại `.data/game.sqlite`. Không cần Ably hoặc Supabase để thử trên máy/Wi-Fi. Khi không cấu hình Ably, game đồng bộ HTTP mỗi 1,5 giây. Deadline do server kiểm tra; nếu tất cả offline, lần truy cập lại đầu tiên sẽ chốt theo deadline đã lưu.

## Sửa câu hỏi sau này

- Mở **lib/event-content.json**. Mỗi phần tử là một vòng: `title` là tiêu đề, `bullets` là các ý thông tin, `metrics` là các số nổi bật, `question` là câu gợi ý, `lesson` là giải thích sau khi mở kết quả.
- Mở **lib/price-history.json** để chỉnh dataset: đây là một chuỗi phẳng gồm 41 phiên NVDA. `close` là **cent**, ví dụ `18762` = $187.62. Các cửa sổ chart của 9 vòng được định nghĩa bằng `chartStart` trong **lib/event-content.json**, còn `date`/`revealDate` là hai mốc quyết định → kết quả.
- `date` / `revealDate` trong event phải khớp hai ngày cuối trong chart. Giữ ngày tăng dần, không trùng và giữ đủ 9 vòng.
- Quy tắc thời gian, vốn, số cổ nằm trong **lib/rules.mjs**.
- Sau khi sửa, chạy `npm test`; khởi động lại server và **tạo phòng mới**. Phòng đã tạo giữ bản sao dữ liệu/luật ban đầu để không đổi giữa ván.
- Nếu đã deploy thì cần cập nhật source và deploy lại. Bản này chưa có trang quản trị sửa câu hỏi trong trình duyệt.

## Kiểm tra và triển khai

```bash
npm test
npm run test:room
npm run build
npm start
```

`test:room` mô phỏng 50 người, 9 vòng, 450 lệnh bằng API handler với đồng hồ kiểm thử; không phải thử trên 50 thiết bị thật. Các kiểm chứng cụ thể có trong **VERIFICATION.md**.

Phần deploy được để riêng tại **DEPLOY.md** để làm sau. Chưa đưa bản này lên tài khoản Vercel/GitHub của bạn. Production Vercel cần Supabase; Ably cung cấp realtime và có HTTP dự phòng. Không đưa secret key vào source.

## Cấu trúc chính

- `components/Game.jsx`: màn hình vào phòng, sự kiện, kết quả và tổng kết.
- `components/OrderPanel.jsx`: nhập số cổ và xác nhận lệnh.
- `components/MarketChart.jsx`: chart lịch sử và kết quả đã được server lọc.
- `lib/engine.mjs`: khớp lệnh, deadline, danh mục, quyền và xếp hạng.
- `lib/event-content.json`, `lib/price-history.json`: câu hỏi và dữ liệu giá, chỉ server đọc.
- `lib/store.mjs`: SQLite local / Supabase production với kiểm soát ghi đồng thời.
- `public/fonts/`: Noto Sans và giấy phép SIL OFL.
