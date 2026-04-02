# Hệ Thống Bầu Cử Đại Biểu Quốc Hội Khóa XVI — Blockchain DApp

Hệ thống bầu cử phi tập trung trên nền tảng Blockchain, mô phỏng quy trình bầu cử Đại biểu Quốc hội Việt Nam Khóa XVI.

> **Thành viên nhóm:** Nguyễn Minh Khôi · Nguyễn Thanh Nhật · Trần Doãn Hòa

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Smart Contract | Solidity ^0.8.24 |
| Blockchain local | Hardhat 2.24.1 |
| Frontend | HTML / CSS / Vanilla JS |
| Thư viện Blockchain | Ethers.js 6.13.5 (UMD) |
| Giao diện | Bootstrap 5.3.3 (CSS) + Bootstrap Icons |
| Ví điện tử | MetaMask |

## Cấu trúc thư mục

```
contracts/Voting.sol          # Smart contract bầu cử
scripts/deploy.js             # Script triển khai + tạo 5 ứng cử viên + sinh tài khoản test
scripts/demo.js               # Script demo: whitelist cử tri, bắt đầu bầu cử
test/Voting.js                # 11 test cases kiểm thử hợp đồng
frontend/
  index.html                  # Trang chính (giao diện tiếng Việt, giao diện trắng)
  css/style.css               # Stylesheet (white theme, màu đỏ #d4382c)
  js/app.js                   # Logic frontend + hồ sơ ứng cử viên
  js/contract-config.js       # Tự sinh khi deploy (địa chỉ contract + ABI)
tai-khoan-test-local.md       # Tự sinh khi deploy (tài khoản test + private key)
huong-dan-he-thong-bau-cu-blockchain.md  # Tài liệu hướng dẫn chi tiết
```

## Ứng cử viên mặc định

1. Nguyễn Thế Huy
2. Võ Huy Khánh
3. Trương Thanh Nga
4. Dương Long Thành
5. Dương Văn Hạnh

Mỗi ứng cử viên có hồ sơ cá nhân đầy đủ (thông tin cá nhân, trình độ học vấn, công tác) hiển thị khi nhấn **"Xem hồ sơ"** trên giao diện.

## Cài đặt nhanh

```bash
npm install
npm run compile
npm run test
```

## Triển khai local (3 terminal)

**Terminal 1** — Khởi động blockchain local:

```bash
npm run node
```

**Terminal 2** — Triển khai hợp đồng:

```bash
npm run deploy:localhost
```

**Terminal 3** — Mở giao diện web:

```bash
npm run serve:frontend
```

Truy cập `http://127.0.0.1:8081` sau khi server khởi động.

## Script demo (tùy chọn)

```bash
npm run demo:localhost
```

Script sẽ tự động whitelist 2 cử tri (Account #1 và #2) và bắt đầu cuộc bầu cử, sẵn sàng để test bỏ phiếu.

## Tài khoản test

Sau khi chạy `npm run deploy:localhost`, file `tai-khoan-test-local.md` được tự động sinh ra chứa danh sách tài khoản local:

| Vai trò | Account | Ghi chú |
|---|---|---|
| Owner / Admin | #0 | Quản trị: thêm ứng viên, cấp quyền cử tri, bắt đầu/kết thúc bầu cử |
| Nguyễn Minh Khôi | #1 | Cử tri |
| Nguyễn Thanh Nhật | #2 | Cử tri |
| Trần Doãn Hòa | #3 | Cử tri |

Import private key từ `tai-khoan-test-local.md` vào MetaMask để sử dụng.

## Tính năng chính

- **Bỏ phiếu on-chain:** Mỗi cử tri chỉ bỏ phiếu 1 lần, đảm bảo bởi smart contract
- **Whitelist cử tri:** Chỉ địa chỉ được owner cấp quyền mới bỏ phiếu được
- **Khóa thông số:** Sau khi bắt đầu bầu cử, không thể thêm ứng viên hoặc cử tri mới
- **Nhiều vòng bầu cử:** Owner có thể kết thúc và bắt đầu vòng mới
- **Audit trail on-chain:** Mọi hành động được ghi lại trên blockchain (thêm ứng viên, whitelist, bỏ phiếu, bắt đầu/kết thúc)
- **Hồ sơ ứng cử viên:** Bảng thông tin cá nhân chi tiết theo mẫu Hội đồng bầu cử Quốc gia
- **Giao diện tiếng Việt:** Toàn bộ UI/UX bằng tiếng Việt, white theme

## Hướng dẫn test thủ công

1. Khởi động blockchain: `npm run node`
2. Deploy hợp đồng: `npm run deploy:localhost`
3. Mở frontend: `npm run serve:frontend` → truy cập `http://127.0.0.1:8081`
4. (Tùy chọn) Chạy `npm run demo:localhost` để whitelist cử tri và bắt đầu bầu cử
5. Cấu hình MetaMask: mạng Hardhat Localhost (RPC `http://127.0.0.1:8545`, Chain ID `31337`)
6. Import tài khoản từ `tai-khoan-test-local.md` vào MetaMask
7. Kết nối ví trên giao diện web → thực hiện bỏ phiếu
8. Xác nhận cùng ví không thể bỏ phiếu lần 2
9. Dùng tài khoản Owner (#0) để quản trị (cấp quyền, bắt đầu/kết thúc bầu cử)

## Kiểm thử tự động

```bash
npm run test
```

11 test cases bao gồm:
- Thêm ứng cử viên trước khi bầu cử bắt đầu
- Chặn hành động admin từ tài khoản không phải owner
- Snapshot cử tri và kiểm tra 1 phiếu / cử tri
- Khóa thông số sau khi bầu cử bắt đầu
- Hỗ trợ nhiều vòng bầu cử
- Từ chối cử tri không có trong whitelist
- Chặn bỏ phiếu trước khi bắt đầu và sau khi kết thúc
- Audit trail và tổng hợp kết quả
- Theo dõi trạng thái hasVoted theo vòng bầu cử
- Trả về danh sách ứng cử viên cho frontend
- hasVoted trả về false cho tất cả địa chỉ trước vòng đầu tiên