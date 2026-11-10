# Bật học coop cho EPU — không cần dùng cửa sổ lệnh

## Thiết lập một lần

Việc này do người quản lý trang làm một lần. Bạn cần tài khoản Cloudflare và GitHub. Không cần cài Node.js hay chạy lệnh.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2FTaylor447%2Fepu-ielts-speaking%2Ftree%2Fmain%2Fcoop-worker)

1. Bấm **Deploy to Cloudflare** ở trên rồi đăng nhập Cloudflare và GitHub nếu được yêu cầu.
2. Giữ các thiết lập có sẵn; đặt tên Worker nếu Cloudflare hỏi rồi chọn triển khai.
3. Cloudflare sẽ tạo Worker và bộ nhớ phòng học cần thiết. Chờ đến khi thấy triển khai hoàn tất.
4. Sao chép địa chỉ Worker có dạng `ten-worker.ten-tai-khoan.workers.dev`.
5. Mở trang EPU bằng HTTPS → **Học coop 2 người** → dán địa chỉ đó → bấm **Kiểm tra và lưu**.
6. Gửi cùng địa chỉ Worker cho người học khác; họ dán vào ô đó trên thiết bị của mình. Sau đó một người tạo phòng, gửi mã 7 ký tự, người kia nhập mã để tham gia.
7. Trong phòng, hai người có thể chat, ghi âm câu trả lời để gửi cho bạn học nghe, hoặc gọi thoại. Khi gọi, người nhận cần bấm **Nhận cuộc gọi** và cho phép micro.

Cloudflare có thể tạo một bản sao thư mục Worker trong GitHub của bạn để quản lý việc triển khai. Thao tác này không sửa mã trang EPU gốc. Nút triển khai yêu cầu repo công khai và mã nguồn Worker nằm riêng trong `coop-worker`.

## Nếu chưa kết nối được

- Địa chỉ có thể dán kèm hoặc không kèm `https://`; EPU sẽ tự thêm nếu thiếu. Địa chỉ cần kết thúc bằng `.workers.dev`.
- Mở trực tiếp `địa-chỉ-worker/health`. Kết quả đúng có `"ok":true` và `"service":"epu-speaking-coop"`.
- Nếu Cloudflare vẫn đang triển khai, chờ hoàn tất rồi thử **Kiểm tra và lưu** lại.
- Cả hai người phải nhập đúng cùng một địa chỉ Worker. Địa chỉ được lưu riêng trên từng thiết bị.
- Chat và nội dung câu trả lời được lưu tạm trong phòng tối đa 2 giờ; bản ghi câu trả lời được Worker chuyển tới người còn lại đang kết nối nhưng không lưu vào lịch sử phòng. Mỗi bản ghi tối đa 550 KB.
- Âm thanh cuộc gọi truyền trực tiếp giữa hai trình duyệt bằng WebRTC; Worker chỉ chuyển tín hiệu kết nối. Cần HTTPS và quyền micro. Hiện chỉ cấu hình STUN, chưa có TURN, nên một số mạng trường học/công ty hoặc NAT nghiêm ngặt có thể không kết nối được.

## Ghi chú cho người phát triển

Worker dùng Cloudflare Durable Objects với SQLite. Có thể triển khai thủ công từ thư mục này bằng `npm install`, đăng nhập Wrangler bằng `npx wrangler login`, rồi chạy `npm run deploy`. Chỉ cần cách này nếu bạn muốn quản lý Worker bằng dòng lệnh.
