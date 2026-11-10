# Backend học coop EPU

Worker này giữ phòng học tối đa hai người và đồng bộ lượt nói/góp ý theo thời gian thực bằng Cloudflare Durable Objects. Nội dung phòng tự hết hạn sau 2 giờ. Đây là backend phục vụ GitHub Pages; không cần cài thư viện trong trang web.

## Triển khai

1. Cài Node.js trên máy và mở terminal tại thư mục `coop-worker`.
2. Chạy `npm install`.
3. Chạy `npx wrangler login` và đăng nhập tài khoản Cloudflare của bạn.
4. Chạy `npm run deploy`. Lệnh đầu tiên tạo Durable Object SQLite theo migration `v1`.
5. Sao chép địa chỉ `https://…workers.dev` mà Cloudflare trả về.
6. Mở trang EPU → **Học coop 2 người**, dán địa chỉ Worker vào ô cấu hình và lưu. Cả hai người dùng cùng một địa chỉ Worker.

Nếu trang được chuyển sang domain khác, cập nhật `ALLOWED_ORIGIN` trong `wrangler.jsonc`, rồi chạy lại `npm run deploy`. Giá trị mặc định là `https://taylor447.github.io`.

## Hành vi và dữ liệu

- Mỗi phòng có mã ngẫu nhiên 7 ký tự và tối đa hai chỗ.
- Hai người luân phiên nói và góp ý theo câu hỏi của Part 1, cue card Part 2 hoặc Part 3.
- Worker chỉ giữ transcript và góp ý trong bộ nhớ Durable Object, xóa phòng sau 2 giờ; không lưu band giả hoặc kết quả vào hồ sơ EPU.
- Người có mã phòng có thể xem transcript/góp ý trong phiên. Không nhập thông tin riêng tư vào phần trả lời.
- Ứng dụng không gửi âm thanh qua coop. Mỗi người có thể nói vào micro của mình; phần coop chỉ đồng bộ câu trả lời dạng chữ và góp ý.

Worker có endpoint kiểm tra nhanh `/health`. Khi Worker chưa được triển khai hoặc địa chỉ chưa được cấu hình trong ứng dụng, trang sẽ báo trạng thái và không giả vờ đã kết nối.
