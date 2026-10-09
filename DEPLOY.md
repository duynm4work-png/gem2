# Đưa game lên GitHub + Vercel


Bộ source đã build thành công; **chưa có deployment trên tài khoản Vercel/GitHub của bạn**. Cần cấu hình các dịch vụ bên dưới trước khi chia sẻ link internet.

### A. Database production: Supabase PostgreSQL

1. Tạo một project tại https://supabase.com/.
2. Mở SQL Editor, chạy toàn bộ `scripts/schema.sql` một lần.
3. Lấy Project URL và **service_role secret key** từ project settings/API keys.
4. Giữ key này chỉ ở server. Không đặt tên với `NEXT_PUBLIC_`, không dán vào source hay commit.

Bảng `game_rooms` chứa state JSONB có version, gồm players, decisions, event data và snapshots. JSONB trong PostgreSQL là dữ liệu database bền vững; đây **không** phải file JSON trên instance. Hai RPC chỉ cho service_role gọi, bảng bật RLS và không cho anon/authenticated đọc. Ghi bằng compare-and-swap theo version nên nhiều request không đè mất lệnh của nhau. State mỗi phòng chứa bản sao của bộ event để thay source giữa buổi không thay kết quả phòng đang chơi.

### B. WebSocket realtime: Ably

1. Tạo app tại https://ably.com/.
2. Tạo API key có quyền publish và subscribe cho namespace `game:*`.
3. Thêm key dưới tên `ABLY_API_KEY` trên server.

Frontend nhận token chỉ có quyền **subscribe đúng phòng**, không có quyền publish. Kênh realtime chỉ phát thông báo thay đổi; client tải state đã lọc từ server. Client không được tự sửa cash/shares hoặc biết giá tương lai. WebSocket dùng hạ tầng Ably; không phụ thuộc native WebSocket beta của Vercel. Nếu realtime gián đoạn, HTTP polling tự phục hồi trạng thái.

### C. Đẩy source

Trong terminal folder dự án:

```bash
git init
git add .
git commit -m "Build NVIDIA classroom investment game"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Thay username/repository bằng repo bạn vừa tạo. `.env.local`, `.data`, `node_modules` và `.next` đã bị loại khỏi Git bằng `.gitignore`.

### D. Vercel

1. Vercel → Add New → Project → Import Git Repository.
2. Framework: **Next.js**. Root directory: thư mục có `package.json`. Node.js: **24.x**.
3. Build command: `npm run build`; install command: `npm ci`.
4. Thêm 3 biến môi trường vào cả Preview và Production:

| Biến | Giá trị |
|---|---|
| `SUPABASE_URL` | URL Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret service role, chỉ server |
| `ABLY_API_KEY` | Ably API key |

5. Deploy; mở URL `https://...vercel.app` trên máy quản trò và điện thoại khác.
6. Tạo phòng, vào bằng hai trình duyệt, kiểm tra hết giờ / reveal / reload. Dòng trạng thái desktop hiển thị WebSocket khi Ably kết nối.
7. Push vào main sẽ kích hoạt lần deploy tiếp theo theo Git integration của Vercel.

Thiếu Supabase trên Vercel thì server báo cấu hình thiếu, **không âm thầm chuyển sang bộ nhớ tạm**. Không sử dụng SQLite production trên Vercel. Không cần price API khi đang chơi: dữ liệu đã khóa trong source và mỗi phòng.

Tài liệu nền tảng: https://vercel.com/docs/frameworks/full-stack/nextjs · https://supabase.com/docs/guides/database · https://ably.com/docs/auth/token

