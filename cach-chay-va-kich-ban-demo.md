# Cách Chạy Và Kịch Bản Demo

Tài liệu này hướng dẫn cách chạy hệ thống bầu cử blockchain trong môi trường local và một kịch bản demo ngắn gọn để bạn trình bày trực tiếp.

## 1. Mục Tiêu

Sau khi làm theo tài liệu này, bạn sẽ có thể:

- Khởi động blockchain local bằng Hardhat.
- Deploy smart contract bầu cử.
- Mở giao diện web và kết nối MetaMask.
- Thực hiện demo quyền Admin, whitelist cử tri, bỏ phiếu và xem kết quả cập nhật.

## 2. Yêu Cầu Trước Khi Chạy

Máy tính cần có:

- Node.js và npm.
- MetaMask trên trình duyệt Chrome hoặc Edge.
- Project đã được mở tại thư mục repo này.

## 3. Cài Dependency

Mở terminal tại thư mục project và chạy:

```bash
npm install
```

Nếu muốn kiểm tra nhanh project trước khi demo:

```bash
npm run compile
npm run test
```

## 4. Các Lệnh Chính Của Project

Project đang dùng các lệnh sau:

```bash
npm run node
npm run deploy:localhost
npm run demo:localhost
npm run serve:frontend
```

Ý nghĩa:

- `npm run node`: chạy blockchain local tại `http://127.0.0.1:8545`.
- `npm run deploy:localhost`: deploy contract và đồng bộ địa chỉ contract sang frontend.
- `npm run demo:localhost`: chạy demo kỹ thuật bằng script, kiểm tra whitelist và vote.
- `npm run serve:frontend`: mở frontend tại `http://127.0.0.1:8081`.

## 5. Quy Trình Chạy Hệ Thống

### Bước 1. Chạy blockchain local

Mở terminal thứ nhất:

```bash
npm run node
```

Giữ nguyên terminal này trong suốt buổi demo.

Sau khi chạy, Hardhat sẽ sinh ra danh sách account test và private key. Bạn sẽ dùng các tài khoản này để import vào MetaMask.

### Bước 2. Deploy contract

Mở terminal thứ hai:

```bash
npm run deploy:localhost
```

Kết quả đúng sẽ gồm các ý chính sau:

- Contract được deploy thành công.
- Có sẵn 3 ứng viên mẫu: `Alice Johnson`, `Bob Smith`, `Carol Lee`.
- File `frontend/js/contract-config.js` được cập nhật địa chỉ contract và ABI.

### Bước 3. Chạy frontend

Vẫn ở terminal thứ hai hoặc terminal mới:

```bash
npm run serve:frontend
```

Mở trình duyệt tại:

```text
http://127.0.0.1:8081
```

## 6. Cấu Hình MetaMask

### 6.1 Thêm mạng Hardhat local

Trong MetaMask, thêm network thủ công với thông tin:

- Network Name: `Hardhat Localhost`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`

### 6.2 Chuẩn bị các tài khoản demo trong MetaMask

Trong terminal chạy `npm run node`, Hardhat đã in sẵn danh sách account và private key.

Nên chuẩn bị tối thiểu các account sau:

- Account #0: dùng làm Admin.
- Account #1: dùng làm cử tri 1.
- Account #2: dùng làm cử tri 2.
- Account #3: tùy chọn, dùng làm tài khoản chưa được whitelist để demo lỗi.

Ví dụ trong môi trường hiện tại:

- Admin: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Voter 1: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Voter 2: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- Unwhitelisted tester: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`

MetaMask thay đổi giao diện khá thường xuyên, nên chữ hiển thị có thể khác nhau giữa các phiên bản. Về bản chất, bạn cần đưa private key của các account Hardhat vào MetaMask bằng một trong hai cách dưới đây.

> **⚠️ Quan trọng:** Khi nhập private key vào MetaMask, **bỏ phần `0x` ở đầu**. MetaMask chỉ chấp nhận chuỗi hex thuần, không có tiền tố `0x`. Nếu để nguyên `0x` sẽ báo lỗi "Cannot import invalid private key".

Private key của các account Hardhat mặc định (đã bỏ `0x`, dùng ngay được):

| Account | Private key (nhập nguyên dòng này vào MetaMask) |
|---------|-----------------------------------------------|
| Admin (#0) | `ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| Voter 1 (#1) | `59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| Voter 2 (#2) | `5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| Unwhitelisted tester (#3) | `7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |

### 6.3 Cách thêm account Hardhat vào MetaMask

#### Cách A. Dùng chức năng thêm hoặc import account trong menu tài khoản

Trong MetaMask:

1. Bấm vào ảnh đại diện tài khoản ở góc trên.
2. Tìm một trong các mục như `Add account`, `Add account or hardware wallet`, `Import account` hoặc mục tương tự.
3. Chọn import bằng private key, dán private key **không có `0x`** từ bảng trên vào.
4. Đặt tên dễ nhớ nếu MetaMask cho phép, ví dụ `Hardhat Admin`, `Hardhat Voter 1`, `Hardhat Voter 2`.

#### Cách B. Tạo profile MetaMask riêng cho demo rồi import private key

Nếu giao diện hiện tại khó tìm mục import, cách ổn định nhất là:

1. Tạo một profile trình duyệt riêng để demo.
2. Cài MetaMask mới trên profile đó.
3. Tạo ví mới chỉ dùng cho mục đích demo.
4. Trong menu tài khoản của MetaMask, thêm các tài khoản Hardhat bằng private key.

Lưu ý:

- Chỉ dùng các private key do Hardhat local sinh ra.
- Không dùng private key ví thật.
- Nếu bạn tắt node và chạy lại thì dữ liệu chain bị reset, nhưng danh sách account mặc định của Hardhat vẫn giữ nguyên, nên có thể tiếp tục dùng các account đó.

### 6.4 Cách switch giữa Admin và các voter

Website không thể tự đổi account trong MetaMask. Bạn phải tự switch thủ công trong extension.

Quy trình đúng là:

1. Mở MetaMask.
2. Bấm vào tên hoặc ảnh đại diện tài khoản hiện tại.
3. Chọn account bạn muốn dùng.
4. Quay lại trang web.
5. Nếu trạng thái chưa đổi ngay, bấm lại `Connect Wallet` hoặc refresh trang.

Thứ tự switch nên dùng khi demo:

1. Vào `Admin` để whitelist voter.
2. Switch sang `Voter 1` để vote lần 1.
3. Switch sang `Voter 2` để vote lần 2.
4. Nếu cần demo lỗi, switch sang account chưa whitelist.
5. Cuối cùng switch lại `Admin` để `End election`.

### 6.5 Cách nhận biết đang ở đúng tài khoản nào

Do webUI không hướng dẫn switch account nữa, bạn nên tự chuẩn bị trước trong MetaMask:

- Đổi tên các account thành `Admin`, `Voter 1`, `Voter 2`, `Outsider` nếu MetaMask hỗ trợ rename.
- Hoặc ghi lại 4 địa chỉ vào một file ghi chú để đối chiếu.

Khi cần kiểm tra nhanh:

- `Admin`: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- `Voter 1`: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- `Voter 2`: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- `Outsider`: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`

## 7. Chạy Demo Kỹ Thuật Nhanh Bằng Script

Nếu bạn muốn kiểm tra logic trước khi demo giao diện, chạy:

```bash
npm run demo:localhost
```

Script này sẽ tự kiểm tra:

- Admin whitelist voter 1 và voter 2.
- Một tài khoản ngoài whitelist không thể vote.
- Hai voter hợp lệ vote thành công.
- Kết quả đếm phiếu đúng.

Đây là bước rất tốt để chắc rằng backend blockchain đang hoạt động bình thường trước khi mở frontend.

## 8. Kịch Bản Demo Trình Bày Trực Tiếp

Đây là kịch bản gọn, đủ để demo trong khoảng 3 đến 5 phút.

### Giai đoạn 1. Giới thiệu nhanh

Bạn có thể nói:

> Đây là hệ thống bầu cử phi tập trung chạy trên blockchain local bằng Hardhat. Smart contract lưu trạng thái whitelist, trạng thái đã bỏ phiếu, và kết quả phiếu bầu. Mỗi ví chỉ bỏ phiếu đúng một lần.

### Giai đoạn 2. Chứng minh hệ thống đã chạy

Cho người xem thấy 2 terminal:

- Terminal 1 đang chạy `npm run node`.
- Terminal 2 đã chạy `npm run deploy:localhost`.

Nói ngắn:

> Contract đã được deploy local và frontend đã nhận đúng địa chỉ contract.

### Giai đoạn 3. Mở giao diện

Mở:

```text
http://127.0.0.1:8081
```

Cho thấy:

- Danh sách ứng viên.
- Trạng thái ví chưa kết nối.
- Nút `Connect Wallet`.

### Giai đoạn 4. Demo vai trò Admin

Chọn tài khoản Admin trong MetaMask rồi bấm `Connect Wallet`.

Nhấn mạnh:

- Admin nhìn thấy khối `Admin actions`.
- Có thể thêm ứng viên.
- Có thể whitelist voter.
- Có thể kết thúc bầu cử.

Hành động nên làm:

1. Whitelist địa chỉ ví của voter 1.
2. Whitelist địa chỉ ví của voter 2.

Bạn có thể nói:

> Chỉ tài khoản owner mới có quyền cấp phép cử tri. Đây là access control được enforce trực tiếp trong smart contract.

### Giai đoạn 5. Switch từ Admin sang voter 1

Mở MetaMask và chọn account `Voter 1`.

Nếu web chưa cập nhật ngay:

1. Quay lại tab web.
2. Bấm `Connect Wallet` lại nếu cần.
3. Kiểm tra ô `Connected account` đã đổi sang ví voter.

### Giai đoạn 6. Demo cử tri bỏ phiếu

Chuyển MetaMask sang voter 1.

Hành động:

1. Bấm `Connect Wallet` nếu cần.
2. Chọn một ứng viên và vote.
3. Xác nhận giao dịch trong MetaMask.

Kỳ vọng:

- Vote thành công.
- Trạng thái tài khoản đổi sang đã dùng phiếu.
- Số phiếu ứng viên tăng lên.

Sau đó thử bấm vote lần hai để giải thích:

> Một ví không thể bỏ phiếu lần thứ hai vì contract đã lưu `hasVoted = true`.

### Giai đoạn 7. Demo thêm một cử tri khác

Chuyển sang voter 2 và lặp lại thao tác vote cho ứng viên khác.

Mục đích:

- Cho thấy nhiều ví có thể tham gia nếu đã whitelist.
- Kết quả cập nhật theo đúng số phiếu thực tế.

### Giai đoạn 8. Demo chặn người không có quyền

Nếu muốn trình bày rõ hơn, chuyển sang một tài khoản chưa whitelist.

Nói ngắn:

> Tài khoản chưa được Admin cấp quyền sẽ không thể thực hiện bỏ phiếu vì transaction sẽ bị revert trong smart contract.

### Giai đoạn 9. Kết thúc bầu cử

Chuyển lại MetaMask sang tài khoản Admin.

Nhấn `End election`.

Giải thích:

> Khi Admin kết thúc bầu cử, mọi lệnh vote tiếp theo sẽ bị chặn. Đây là trạng thái toàn cục được lưu trên blockchain.

## 9. Kịch Bản Nói Mẫu Ngắn Gọn

Bạn có thể dùng nguyên mẫu sau:

> Đầu tiên tôi khởi động Hardhat local blockchain để mô phỏng mạng Ethereum. Sau đó tôi deploy smart contract bầu cử, contract này quản lý danh sách ứng viên, whitelist cử tri và trạng thái đã bỏ phiếu. Trên giao diện web, Admin kết nối ví để whitelist các cử tri hợp lệ. Sau đó từng cử tri dùng MetaMask để bỏ phiếu. Mỗi ví chỉ bỏ phiếu được một lần vì contract kiểm tra `hasVoted`. Kết quả được lưu on-chain và giao diện cập nhật lại theo trạng thái mới của contract.

## 10. Các Lỗi Thường Gặp Khi Demo

### MetaMask đang ở sai mạng

Biểu hiện:

- Không vote được.
- Frontend báo sai network.

Cách xử lý:

- Chuyển MetaMask sang `Hardhat Localhost` với chain ID `31337`.

### Quên deploy lại sau khi restart node

Biểu hiện:

- Frontend không đọc được contract.
- Giao dịch gọi đến contract bị lỗi.

Cách xử lý:

1. Chạy lại `npm run deploy:localhost`.
2. Mở lại frontend.

### Tài khoản không vote được

Biểu hiện:

- Transaction bị revert.

Cách xử lý:

- Kiểm tra tài khoản đó đã được whitelist chưa.
- Kiểm tra tài khoản đó đã vote trước đó chưa.

### Không tìm thấy nút import account trong MetaMask

Biểu hiện:

- Không thấy đúng tên menu như các hướng dẫn cũ trên mạng.

Cách xử lý:

1. Mở menu tài khoản trong MetaMask.
2. Tìm các mục có ý nghĩa tương đương như `Add account`, `Import account`, `Add account or hardware wallet`.
3. Nếu vẫn không thấy, dùng một profile trình duyệt mới và cài MetaMask sạch để thao tác demo cho dễ.

## 11. Trình Tự Chạy Nhanh Trước Buổi Demo

Nếu bạn cần checklist ngắn nhất, chạy đúng thứ tự này:

```bash
npm install
npm run compile
npm run test
```

Terminal 1:

```bash
npm run node
```

Terminal 2:

```bash
npm run deploy:localhost
npm run demo:localhost
npm run serve:frontend
```

Sau đó:

1. Mở `http://127.0.0.1:8081`
2. Kết nối MetaMask
3. Dùng Admin whitelist voter
4. Dùng voter để vote
5. Dùng Admin kết thúc bầu cử

## 12. File Liên Quan

- `contracts/Voting.sol`: logic smart contract.
- `scripts/deploy.js`: deploy contract và đồng bộ frontend config.
- `scripts/demo.js`: demo kỹ thuật bằng script.
- `frontend/index.html`: giao diện demo.
- `frontend/js/app.js`: logic kết nối MetaMask và gọi contract.
