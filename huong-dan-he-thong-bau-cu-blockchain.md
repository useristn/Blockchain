# 🗳️ Hướng Dẫn Toàn Diện: Hệ Thống Bầu Cử Ứng Dụng Blockchain

> **Đề tài:** Hệ thống bầu cử phi tập trung (Decentralized Voting System)  
> **Công nghệ cốt lõi:** Solidity · Hardhat · Ethers.js · MetaMask · Bootstrap 5  
> **Cấp độ:** Sinh viên / Đồ án tốt nghiệp

---

## 📋 Mục Lục

1. [Tổng Quan Đề Tài](#1-tổng-quan-đề-tài)
2. [Các Khái Niệm Cốt Lõi](#2-các-khái-niệm-cốt-lõi)
3. [Công Nghệ Sử Dụng](#3-công-nghệ-sử-dụng)
4. [Kiến Trúc Hệ Thống](#4-kiến-trúc-hệ-thống)
5. [Luồng Hoạt Động Chi Tiết (Workflow)](#5-luồng-hoạt-động-chi-tiết-workflow)
6. [Cấu Trúc Thư Mục Dự Án](#6-cấu-trúc-thư-mục-dự-án)
7. [Hướng Dẫn Cài Đặt Môi Trường](#7-hướng-dẫn-cài-đặt-môi-trường)
8. [Hướng Dẫn Triển Khai (Deploy)](#8-hướng-dẫn-triển-khai-deploy)
9. [Hướng Dẫn Sử Dụng Hệ Thống](#9-hướng-dẫn-sử-dụng-hệ-thống)
10. [Giải Thích Logic Smart Contract](#10-giải-thích-logic-smart-contract)
11. [Xử Lý Lỗi Thường Gặp](#11-xử-lý-lỗi-thường-gặp)
12. [Câu Hỏi Bảo Vệ Đồ Án](#12-câu-hỏi-bảo-vệ-đồ-án)

---

## 1. Tổng Quan Đề Tài

### 1.1 Vấn Đề Đặt Ra

Hệ thống bầu cử truyền thống đang tồn tại nhiều rủi ro nghiêm trọng:

- **Gian lận phiếu bầu:** Phiếu có thể bị thêm vào, xóa bỏ hoặc thay đổi kết quả bởi người có thẩm quyền quản lý.
- **Thiếu minh bạch:** Cử tri không thể tự mình xác minh phiếu của họ có được tính đúng hay không.
- **Phụ thuộc vào bên thứ ba:** Toàn bộ niềm tin đặt vào một tổ chức duy nhất điều hành cuộc bầu cử.
- **Rủi ro tập trung hóa:** Nếu hệ thống trung tâm bị tấn công hoặc hỏng hóc, toàn bộ dữ liệu có thể mất.

### 1.2 Giải Pháp Blockchain Mang Lại

Blockchain giải quyết từng vấn đề trên một cách có hệ thống:

| Vấn đề truyền thống | Giải pháp Blockchain |
|---|---|
| Dữ liệu có thể bị chỉnh sửa | Dữ liệu bất biến (Immutable) sau khi ghi |
| Thiếu minh bạch | Mọi giao dịch đều công khai, ai cũng kiểm tra được |
| Phụ thuộc trung gian | Smart Contract tự động thực thi, không cần người điều hành |
| Bỏ phiếu nhiều lần | Địa chỉ ví duy nhất, trạng thái `hasVoted` lưu vĩnh viễn |

### 1.3 Phạm Vi Hệ Thống

Hệ thống này bao gồm các chức năng chính:

- Quản trị viên (Admin) có thể tạo danh sách ứng viên và cấp quyền bầu cử cho cử tri.
- Cử tri được cấp phép kết nối ví MetaMask và thực hiện bỏ phiếu.
- Mỗi ví chỉ được bỏ phiếu đúng một lần, được đảm bảo bởi Smart Contract.
- Kết quả bầu cử được cập nhật theo thời gian thực trên giao diện web.

---

## 2. Các Khái Niệm Cốt Lõi

### 2.1 Blockchain Là Gì?

Blockchain (chuỗi khối) là một cơ sở dữ liệu phân tán, trong đó dữ liệu được lưu trữ theo từng khối (block) và liên kết với nhau thành chuỗi theo thứ tự thời gian. Mỗi block chứa:

- **Dữ liệu giao dịch** (Transaction Data): Thông tin về các sự kiện xảy ra trong block đó.
- **Hash của block hiện tại**: Mã định danh duy nhất, được tính từ toàn bộ nội dung block.
- **Hash của block trước**: Chuỗi liên kết này khiến việc sửa đổi một block sẽ làm vô hiệu toàn bộ chuỗi phía sau.
- **Timestamp**: Dấu thời gian ghi lại thời điểm block được tạo.

Đặc tính quan trọng nhất: khi một block đã được xác nhận bởi mạng lưới và thêm vào chuỗi, nội dung bên trong nó trở nên **bất biến** — không ai có thể chỉnh sửa mà không bị phát hiện.

### 2.2 Smart Contract (Hợp Đồng Thông Minh)

Smart Contract là một chương trình máy tính được lưu trữ và thực thi trực tiếp trên Blockchain. Hãy hình dung nó như một "luật pháp tự động":

- **Tự thực thi (Self-executing):** Khi điều kiện đủ, contract tự chạy mà không cần bên thứ ba.
- **Không thể can thiệp (Tamper-proof):** Sau khi deploy, không ai — kể cả người tạo ra nó — có thể thay đổi code.
- **Minh bạch (Transparent):** Code của contract công khai, mọi người đều đọc được.
- **Xác định (Deterministic):** Cùng một đầu vào luôn cho ra cùng một đầu ra, không bao giờ thay đổi.

Trong hệ thống bầu cử này, Smart Contract đóng vai trò là **ban tổ chức bầu cử tự động** — nó thực thi các quy tắc mà không ai có thể tác động vào.

### 2.3 Địa Chỉ Ví (Wallet Address)

Mỗi người dùng trên mạng Ethereum có một cặp khóa mật mã:

- **Private Key (Khóa riêng):** Chuỗi ký tự bí mật, giống như mật khẩu. Người dùng phải tuyệt đối giữ bí mật. Dùng để ký (sign) các giao dịch.
- **Public Key (Khóa công khai):** Được sinh ra từ Private Key. Dùng để tạo ra Địa chỉ ví.
- **Wallet Address (Địa chỉ ví):** Dạng rút gọn của Public Key, bắt đầu bằng `0x`, ví dụ: `0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B`. Đây là "danh tính" công khai của bạn trên blockchain.

Trong hệ thống bầu cử, địa chỉ ví được dùng làm **mã định danh cử tri** duy nhất và không thể giả mạo.

### 2.4 Giao Dịch (Transaction)

Mỗi khi bạn tương tác với Smart Contract (như bỏ phiếu), hành động đó được đóng gói thành một **giao dịch**. Giao dịch bao gồm:

- Địa chỉ người gửi (Sender)
- Địa chỉ Smart Contract (Recipient)
- Dữ liệu gọi hàm (Function call data)
- **Phí Gas (Gas Fee):** Chi phí tính toán để mạng lưới xử lý giao dịch.
- Chữ ký số (Signature): Bằng chứng rằng chủ ví đã đồng ý thực hiện giao dịch.

### 2.5 Gas và Gas Fee

Gas là đơn vị đo lường công việc tính toán cần thiết để thực thi một lệnh trên Ethereum. Khi bỏ phiếu, cử tri phải trả một lượng nhỏ ETH làm phí Gas cho các thợ đào (miners) hoặc validators xử lý giao dịch.

Trong môi trường Hardhat localhost (mạng thử nghiệm), Gas được trả bằng ETH ảo, hoàn toàn không có giá trị thực tế.

### 2.6 ABI (Application Binary Interface)

ABI là một tệp JSON mô tả toàn bộ "giao diện" của Smart Contract: có những hàm nào, mỗi hàm nhận tham số kiểu gì, trả về kiểu gì. Nó giống như một **cuốn từ điển** để phần mềm bên ngoài (JavaScript) hiểu cách giao tiếp với contract. ABI được sinh ra tự động khi bạn biên dịch (compile) file Solidity.

### 2.7 Event (Sự kiện)

Smart Contract có thể phát ra các tín hiệu thông báo gọi là Event. Khi một giao dịch hoàn tất (ví dụ: có người bỏ phiếu thành công), contract `emit` một Event. Frontend JavaScript có thể lắng nghe các Event này để cập nhật giao diện theo thời gian thực mà không cần F5 trang.

### 2.8 Revert (Hoàn tác giao dịch)

Khi Smart Contract phát hiện vi phạm quy tắc (ví dụ: cử tri chưa được cấp quyền, hoặc đã bỏ phiếu rồi), nó sẽ `revert` — toàn bộ giao dịch bị hủy bỏ, trạng thái blockchain không thay đổi, và người dùng nhận được thông báo lỗi. Đây là cơ chế bảo vệ chính của hệ thống.

---

## 3. Công Nghệ Sử Dụng

### 3.1 Solidity

**Là gì:** Ngôn ngữ lập trình bậc cao được thiết kế riêng để viết Smart Contract trên nền tảng Ethereum.

**Đặc điểm:**
- Cú pháp tương tự C++ và JavaScript, dễ học với người đã biết lập trình.
- Có kiểu dữ liệu tĩnh (statically typed): phải khai báo kiểu biến rõ ràng.
- Hỗ trợ `modifier` — một cơ chế tuyệt vời để tạo các điều kiện kiểm tra tái sử dụng được.
- Có `mapping` (giống dictionary/hashmap) — cực kỳ hữu ích để lưu trạng thái từng cử tri.
- Phiên bản được chỉ định ở đầu file bằng `pragma solidity ^0.8.0;`.

**Vai trò trong dự án:** Viết file `Voting.sol` chứa toàn bộ logic bầu cử.

### 3.2 Hardhat

**Là gì:** Môi trường phát triển (development environment) chuyên nghiệp cho Ethereum.

**Các tính năng chính:**
- **Hardhat Network:** Một mạng blockchain ảo chạy ngay trên máy tính của bạn (localhost). Khởi động bằng lệnh `npx hardhat node`, nó tạo ra sẵn 20 tài khoản ảo, mỗi tài khoản có sẵn 10,000 ETH ảo.
- **Compile:** Biên dịch file `.sol` thành bytecode và ABI.
- **Deploy Scripts:** Cho phép viết script JavaScript để tự động hóa quá trình triển khai contract.
- **Console:** `npx hardhat console` — giao diện dòng lệnh để tương tác trực tiếp với contract.

**Tại sao dùng Hardhat thay vì Ganache:** Hardhat tích hợp sẵn mọi thứ trong một công cụ, hỗ trợ TypeScript, debugging chi tiết hơn, và là tiêu chuẩn hiện đại trong ngành.

### 3.3 Ethers.js

**Là gì:** Thư viện JavaScript giúp frontend web "nói chuyện" với Ethereum blockchain và Smart Contract.

**Các tính năng chính:**
- Kết nối với MetaMask (hay bất kỳ ví nào) thông qua `window.ethereum`.
- Tạo đối tượng `Contract` từ địa chỉ và ABI để gọi các hàm contract.
- Xử lý ký và gửi giao dịch.
- Lắng nghe Event từ contract.
- Đọc dữ liệu từ contract mà không cần giao dịch (hàm `view`).

**Tại sao dùng Ethers.js thay vì Web3.js:** Ethers.js nhẹ hơn, API sạch và trực quan hơn, tài liệu tốt hơn, và đang là lựa chọn phổ biến nhất trong cộng đồng hiện tại.

### 3.4 MetaMask

**Là gì:** Tiện ích mở rộng (extension) cho trình duyệt Chrome/Firefox, hoạt động như một **ví tiền điện tử** và **cổng kết nối** giữa trình duyệt của người dùng và mạng Ethereum.

**Vai trò trong dự án:**
- Lưu trữ Private Key của người dùng một cách an toàn.
- Hiển thị popup yêu cầu xác nhận khi cần ký giao dịch.
- Inject đối tượng `window.ethereum` vào trình duyệt để Ethers.js sử dụng.
- Cho phép chuyển đổi giữa các mạng (mainnet, testnet, localhost).

### 3.5 Bootstrap 5

**Là gì:** Framework CSS phổ biến nhất thế giới, cung cấp sẵn các component giao diện đẹp và responsive.

**Vai trò trong dự án:** Tạo giao diện web chuyên nghiệp nhanh chóng mà không cần tự viết CSS từ đầu. Sử dụng các component như: Card (thẻ ứng viên), Progress Bar (thanh kết quả), Button (nút bấm), Alert (thông báo), Badge (nhãn).

---

## 4. Kiến Trúc Hệ Thống

### 4.1 Sơ Đồ Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                    TẦNG GIAO DIỆN (Frontend)                 │
│          index.html  ·  CSS (Bootstrap 5)  ·  app.js         │
└──────────────────────────┬──────────────────────────────────┘
                           │  Ethers.js (Cầu nối)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    VÍ NGƯỜI DÙNG (MetaMask)                  │
│           Quản lý khóa · Ký giao dịch · Xác nhận             │
└──────────────────────────┬──────────────────────────────────┘
                           │  JSON-RPC Protocol
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              TẦNG BLOCKCHAIN (Hardhat Network)               │
│                   Smart Contract: Voting.sol                  │
│        - Lưu danh sách ứng viên                              │
│        - Lưu trạng thái từng cử tri (hasVoted)               │
│        - Đếm và lưu số phiếu                                 │
│        - Phát Event khi có phiếu mới                         │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Các Thành Phần Giao Tiếp

**Frontend → MetaMask:** Thông qua đối tượng `window.ethereum` được MetaMask tự động inject vào trình duyệt.

**MetaMask → Blockchain:** Sử dụng giao thức JSON-RPC, gửi giao dịch đã ký đến node Hardhat đang chạy ở `http://127.0.0.1:8545`.

**Blockchain → Frontend:** Thông qua Event Listener trong Ethers.js, contract phát ra Event và JavaScript nhận được ngay lập tức.

### 4.3 Phân Cấp Quyền Hạn

```
Admin (Địa chỉ ví deploy contract)
  │
  ├── Có quyền: Thêm ứng viên (addCandidate)
  ├── Có quyền: Cấp phép cử tri (whitelistVoter)
  └── Có quyền: Kết thúc bầu cử (endElection)

Cử tri Đã Được Cấp Phép (Whitelisted Voter)
  │
  ├── Có quyền: Bỏ phiếu (vote)
  └── Có quyền: Xem kết quả (getVotes - hàm public)

Người Dùng Thông Thường (Chưa được cấp phép)
  │
  └── Chỉ có quyền: Xem kết quả (read-only)
```

---

## 5. Luồng Hoạt Động Chi Tiết (Workflow)

### Giai Đoạn 1: Quản Trị Viên Khởi Tạo (Admin Setup)

Đây là bước đầu tiên, thực hiện hoàn toàn ở Terminal, trước khi mở trình duyệt.

**Bước 1.1 — Khởi động mạng blockchain ảo:**
Mở Terminal và chạy lệnh `npx hardhat node`. Hardhat sẽ khởi động một máy chủ blockchain giả lập ngay trên máy tính của bạn, lắng nghe ở địa chỉ `http://127.0.0.1:8545`. Terminal sẽ in ra 20 cặp địa chỉ ví và private key đã tạo sẵn.

> ⚠️ **Quan trọng:** Cửa sổ Terminal này phải được giữ mở trong suốt quá trình phát triển. Đóng lại đồng nghĩa với việc tắt blockchain.

**Bước 1.2 — Deploy Smart Contract:**
Mở một Terminal thứ hai (không đóng cái đầu), chạy lệnh `npx hardhat run scripts/deploy.js --network localhost`. Script deploy sẽ:
- Lấy ví đầu tiên trong danh sách 20 ví (tài khoản [0]) làm tài khoản Admin.
- Biên dịch file `Voting.sol` thành bytecode.
- Tạo một giao dịch đặc biệt (Contract Creation Transaction) gửi bytecode lên blockchain.
- Blockchain cấp phát một địa chỉ mới cho contract vừa được tạo.
- Script in ra `Contract deployed to: 0x...`. Đây là **Contract Address** — bạn cần copy lại.

**Bước 1.3 — Cấp phép cử tri:**
Admin gọi hàm `whitelistVoter()` với địa chỉ ví của từng cử tri muốn cho phép tham gia. Việc này có thể thực hiện qua Hardhat Console hoặc qua một trang Admin riêng.

**Bước 1.4 — Cập nhật file JavaScript:**
Dán **Contract Address** và nội dung **ABI** vào file `app.js` của giao diện web. Sau bước này, frontend mới có thể kết nối được với contract.

---

### Giai Đoạn 2: Cử Tri Kết Nối (User Authentication)

**Bước 2.1 — Cử tri mở trang web:**
Mở file `index.html` trong trình duyệt (đã cài MetaMask extension). Trang web hiển thị nút "Kết nối ví" và danh sách ứng viên (với kết quả ban đầu là 0 phiếu).

**Bước 2.2 — Kết nối MetaMask:**
Cử tri bấm "Kết nối ví". JavaScript gọi `window.ethereum.request({ method: 'eth_requestAccounts' })`. MetaMask hiện popup yêu cầu người dùng chọn tài khoản và cho phép trang web kết nối.

**Bước 2.3 — Xác nhận kết nối:**
Sau khi cử tri đồng ý, JavaScript nhận được địa chỉ ví. Trang web hiển thị thông báo "Xin chào cử tri: 0xAbc...123" và kích hoạt nút bỏ phiếu.

> **Lưu ý kỹ thuật:** MetaMask phải được cấu hình kết nối đến mạng Hardhat localhost (`http://127.0.0.1:8545`, Chain ID: `31337`). Nếu không, mọi giao dịch sẽ thất bại.

---

### Giai Đoạn 3: Thực Thi Bầu Cử (Voting Transaction)

**Bước 3.1 — Cử tri chọn ứng viên:**
Trên giao diện, cử tri chọn radio button hoặc bấm vào thẻ ứng viên (ví dụ: "Bob") rồi bấm nút "Bỏ phiếu".

**Bước 3.2 — JavaScript chuẩn bị giao dịch:**
Ethers.js tạo ra đối tượng `contract` từ địa chỉ và ABI đã có, sau đó gọi `contract.vote(candidateId)`. Đây là một **write transaction** (ghi dữ liệu) nên cần chữ ký.

**Bước 3.3 — MetaMask popup xác nhận:**
MetaMask hiện hộp thoại popup hiển thị:
- Hàm đang được gọi: `vote`
- Ước tính phí Gas
- Yêu cầu người dùng bấm "Confirm" (Xác nhận) hoặc "Reject" (Từ chối)

**Bước 3.4 — Giao dịch được phát đi:**
Sau khi cử tri bấm Confirm, MetaMask ký giao dịch bằng Private Key (không bao giờ để lộ Private Key ra ngoài) và gửi giao dịch đã ký đến node Hardhat.

---

### Giai Đoạn 4: Smart Contract Xử Lý (Core Logic Execution)

Đây là trái tim của hệ thống — toàn bộ diễn ra bên trong blockchain, hoàn toàn tự động.

**Bước 4.1 — Blockchain nhận giao dịch:**
Node Hardhat nhận giao dịch, đưa vào pool chờ xử lý, sau đó đóng gói vào một block mới.

**Bước 4.2 — Hàm `vote()` trong Solidity được kích hoạt:**
EVM (Ethereum Virtual Machine) chạy bytecode tương ứng với hàm `vote()`. Quá trình kiểm tra bảo mật diễn ra theo thứ tự:

- **Kiểm tra 1 — Whitelist:** `require(whitelist[msg.sender] == true, "Ban khong co quyen bau cu")`. Nếu địa chỉ ví của người gửi không có trong danh sách được cấp phép → giao dịch **Revert**.

- **Kiểm tra 2 — Chưa bỏ phiếu:** `require(hasVoted[msg.sender] == false, "Ban da bau roi")`. Nếu cử tri đã bỏ phiếu trước đó → giao dịch **Revert**.

- **Kiểm tra 3 — Ứng viên hợp lệ:** `require(candidateId < candidates.length, "Ung vien khong ton tai")`. Nếu ID ứng viên không tồn tại → giao dịch **Revert**.

**Bước 4.3 — Cập nhật trạng thái:**
Nếu vượt qua tất cả kiểm tra:
- `hasVoted[msg.sender] = true` — Đánh dấu cử tri đã bỏ phiếu.
- `candidates[candidateId].voteCount += 1` — Cộng 1 phiếu vào ứng viên.

**Bước 4.4 — Phát Event:**
`emit Voted(msg.sender, candidateId)` — Phát tín hiệu ra ngoài để frontend biết có phiếu mới.

**Bước 4.5 — Block được ghi vào chuỗi:**
Toàn bộ thay đổi trạng thái được đóng gói vào block, ghi vĩnh viễn vào blockchain. Không thể hoàn tác, không thể sửa đổi.

---

### Giai Đoạn 5: Giao Diện Tự Cập Nhật (Real-time UI Update)

**Bước 5.1 — Event Listener bắt tín hiệu:**
JavaScript đang lắng nghe liên tục: `contract.on("Voted", ...)`. Ngay khi blockchain phát ra Event `Voted`, hàm callback này được kích hoạt.

**Bước 5.2 — Lấy dữ liệu mới:**
JavaScript gọi `contract.getVotes(candidateId)` — đây là hàm `view`, không cần giao dịch, không mất phí Gas, trả về số phiếu hiện tại ngay lập tức.

**Bước 5.3 — Cập nhật DOM:**
JavaScript thay đổi nội dung HTML: cập nhật con số phiếu, tăng độ rộng thanh Progress Bar, hiển thị thông báo "Bỏ phiếu thành công!". Toàn bộ diễn ra mà không cần tải lại trang.

---

## 6. Cấu Trúc Thư Mục Dự Án

```
voting-dapp/
│
├── contracts/
│   └── Voting.sol              ← Smart Contract chính (Solidity)
│
├── scripts/
│   └── deploy.js               ← Script triển khai contract lên blockchain
│
├── frontend/
│   ├── index.html              ← Giao diện chính người dùng thấy
│   ├── css/
│   │   └── style.css           ← CSS tùy chỉnh (thêm vào Bootstrap)
│   └── js/
│       └── app.js              ← Logic kết nối ví, gọi contract
│
├── artifacts/                  ← Tự động sinh bởi Hardhat sau khi compile
│   └── contracts/
│       └── Voting.sol/
│           └── Voting.json     ← Chứa ABI và bytecode (QUAN TRỌNG)
│
├── hardhat.config.js           ← Cấu hình mạng, compiler cho Hardhat
├── package.json                ← Danh sách thư viện Node.js
└── README.md                   ← Hướng dẫn nhanh
```

### Giải Thích Từng File Quan Trọng

**`contracts/Voting.sol`**
File quan trọng nhất. Chứa toàn bộ logic bầu cử: định nghĩa cấu trúc ứng viên, mapping trạng thái cử tri, các hàm vote/whitelist/getResults. Đây là "bộ não" của hệ thống.

**`scripts/deploy.js`**
Script Node.js chạy một lần duy nhất để đưa contract lên blockchain. Sau khi chạy, in ra Contract Address để bạn copy vào `app.js`.

**`frontend/js/app.js`**
File điều phối toàn bộ giao diện: kết nối MetaMask, tạo đối tượng contract với Ethers.js, xử lý sự kiện click nút, lắng nghe Event từ contract, cập nhật DOM.

**`artifacts/contracts/Voting.sol/Voting.json`**
File này do Hardhat tự động tạo khi bạn compile. Nó chứa ABI — bạn cần copy nội dung trường `abi` trong file này vào `app.js`.

**`hardhat.config.js`**
Cấu hình phiên bản Solidity compiler và khai báo mạng `localhost` để Hardhat biết deploy đến đâu.

---

## 7. Hướng Dẫn Cài Đặt Môi Trường

### 7.1 Yêu Cầu Hệ Thống

Trước khi bắt đầu, đảm bảo máy tính có:

- **Node.js** phiên bản 16 trở lên (kiểm tra bằng `node --version`)
- **npm** (đi kèm với Node.js, kiểm tra bằng `npm --version`)
- **Trình duyệt Chrome hoặc Firefox** (để cài MetaMask)
- **Kết nối internet** (để cài đặt thư viện lần đầu)

### 7.2 Cài Đặt Node.js

Truy cập trang chủ **nodejs.org**, tải phiên bản LTS (Long Term Support) phù hợp hệ điều hành. Chạy file cài đặt theo hướng dẫn. Sau khi cài xong, mở Terminal/Command Prompt và kiểm tra `node --version` và `npm --version` để xác nhận cài đặt thành công.

### 7.3 Khởi Tạo Dự Án

Mở Terminal, thực hiện các bước sau theo thứ tự:

**Tạo thư mục dự án:**
```bash
mkdir voting-dapp
cd voting-dapp
```

**Khởi tạo dự án Node.js:**
```bash
npm init -y
```
Lệnh này tạo ra file `package.json` để quản lý các thư viện.

**Cài đặt Hardhat:**
```bash
npm install --save-dev hardhat
```

**Khởi tạo cấu hình Hardhat:**
```bash
npx hardhat init
```
Chương trình sẽ hỏi bạn muốn tạo loại project nào. Chọn **"Create a JavaScript project"**. Nhấn Enter để đồng ý với tất cả các lựa chọn mặc định.

**Cài đặt Ethers.js:**
```bash
npm install ethers
```

**Kiểm tra cài đặt:**
Sau khi hoàn tất, thư mục `voting-dapp` sẽ có các file `hardhat.config.js`, `package.json`, và các thư mục `contracts`, `scripts`, `test`.

### 7.4 Cài Đặt MetaMask

1. Mở Chrome, truy cập **Chrome Web Store**.
2. Tìm kiếm "MetaMask", cài đặt extension chính thức (biểu tượng con cáo).
3. Mở MetaMask, chọn "Create a new wallet".
4. Tạo mật khẩu và **lưu cẩn thận cụm từ khôi phục (Secret Recovery Phrase) 12 từ**. Trong môi trường học tập, bạn chỉ dùng ví ảo nên không cần lo lắng quá, nhưng hãy hình thành thói quen bảo mật tốt.

### 7.5 Thêm Mạng Hardhat Localhost Vào MetaMask

Đây là bước nhiều người hay quên, dẫn đến lỗi kết nối.

Mở MetaMask → Bấm vào tên mạng ở trên cùng (thường hiện "Ethereum Mainnet") → Chọn "Add network" → Chọn "Add a network manually" → Điền thông tin:

- **Network name:** Hardhat Localhost
- **New RPC URL:** `http://127.0.0.1:8545`
- **Chain ID:** `31337`
- **Currency symbol:** ETH

Bấm Save. Từ nay bạn có thể chuyển sang mạng này khi làm việc với dự án.

### 7.6 Import Tài Khoản Ảo Vào MetaMask

Khi chạy `npx hardhat node`, Terminal in ra 20 tài khoản với Private Key kèm theo. Copy Private Key của tài khoản [0] (tài khoản Admin) và một vài tài khoản khác (để giả lập cử tri).

Trong MetaMask: Bấm vào icon tài khoản ở trên cùng → "Import account" → Dán Private Key → Import.

> ⚠️ **Tuyệt đối không bao giờ** import Private Key từ ví thật vào MetaMask đang kết nối với các trang web lạ. Các Private Key của Hardhat là ảo, hoàn toàn an toàn để dùng khi phát triển.

---

## 8. Hướng Dẫn Triển Khai (Deploy)

### 8.1 Viết Smart Contract

Tạo file `contracts/Voting.sol`. File này cần định nghĩa:

- **`struct Candidate`**: Cấu trúc dữ liệu ứng viên (tên, số phiếu).
- **`mapping(address => bool) whitelist`**: Danh sách địa chỉ được phép bầu.
- **`mapping(address => bool) hasVoted`**: Trạng thái đã bỏ phiếu của từng địa chỉ.
- **`Candidate[] candidates`**: Mảng chứa tất cả ứng viên.
- **`address owner`**: Địa chỉ Admin (người deploy contract).
- **`event Voted(...)`**: Khai báo sự kiện để phát khi có phiếu.
- **`modifier onlyOwner()`**: Bảo vệ các hàm chỉ Admin mới được gọi.
- **`function addCandidate(string name)`**: Thêm ứng viên (chỉ Admin).
- **`function whitelistVoter(address voter)`**: Cấp quyền (chỉ Admin).
- **`function vote(uint candidateId)`**: Bỏ phiếu (cử tri đã được cấp phép).
- **`function getVotes(uint candidateId) view returns (uint)`**: Đọc số phiếu (công khai).
- **`function getCandidatesCount() view returns (uint)`**: Đếm số ứng viên.

### 8.2 Biên Dịch Contract

Sau khi viết xong `Voting.sol`, chạy lệnh `npx hardhat compile`. Nếu không có lỗi cú pháp, Hardhat sẽ tạo ra thư mục `artifacts/` chứa file `Voting.json` với ABI và bytecode.

### 8.3 Viết Script Deploy

Tạo file `scripts/deploy.js`. Script này dùng thư viện `ethers` của Hardhat để:

1. Lấy contract factory (`getContractFactory("Voting")`).
2. Deploy contract (`voting.deploy()`).
3. Chờ quá trình deploy hoàn tất (`voting.deployed()`).
4. In ra địa chỉ contract (`voting.address`).
5. Tùy chọn: gọi hàm `addCandidate` để thêm ứng viên ban đầu.

### 8.4 Chạy Deploy

Đảm bảo node Hardhat đang chạy ở Terminal 1, sau đó ở Terminal 2:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

Ghi lại địa chỉ contract được in ra.

### 8.5 Cập Nhật Frontend

Mở file `frontend/js/app.js` và cập nhật:

- Biến `CONTRACT_ADDRESS`: Dán địa chỉ contract vừa copy.
- Biến `CONTRACT_ABI`: Mở file `artifacts/contracts/Voting.sol/Voting.json`, copy nội dung của trường `"abi"` (một mảng JSON lớn), dán vào đây.

---

## 9. Hướng Dẫn Sử Dụng Hệ Thống

### 9.1 Quy Trình Cho Admin

1. Mở Terminal 1, chạy `npx hardhat node`.
2. Mở Terminal 2, chạy script deploy.
3. Copy Contract Address, cập nhật `app.js`.
4. Mở `index.html` hoặc trang Admin, kết nối với ví Admin (tài khoản [0]).
5. Thêm ứng viên nếu chưa làm trong script deploy.
6. Cấp quyền bầu cử cho các địa chỉ ví của cử tri bằng cách gọi `whitelistVoter`.

### 9.2 Quy Trình Cho Cử Tri

1. Đảm bảo MetaMask đang kết nối đến mạng **Hardhat Localhost**.
2. Đảm bảo đang dùng tài khoản đã được Admin cấp phép (whitelisted).
3. Mở trang `index.html`, bấm "Kết nối ví".
4. Xem danh sách ứng viên và số phiếu hiện tại.
5. Chọn ứng viên muốn bỏ phiếu, bấm "Bỏ phiếu".
6. MetaMask popup xuất hiện → Bấm "Confirm".
7. Chờ vài giây, giao diện tự cập nhật kết quả mà không cần F5.

---

## 10. Giải Thích Logic Smart Contract

### 10.1 Tại Sao Dùng `mapping` Thay Vì Mảng Cho Whitelist?

`mapping(address => bool) whitelist` cho phép tra cứu tức thì O(1) — kiểm tra một địa chỉ có trong whitelist không mất đúng một bước, bất kể có bao nhiêu địa chỉ trong danh sách. Nếu dùng mảng, phải lặp qua từng phần tử — với hàng nghìn cử tri, chi phí Gas sẽ tăng tuyến tính, rất không hiệu quả.

### 10.2 Tại Sao `hasVoted` Không Thể Reset?

Trong Solidity, một khi biến `hasVoted[msg.sender] = true` được ghi vào blockchain, nó tồn tại vĩnh viễn. Không có lệnh nào có thể "xóa" lịch sử trên blockchain. Đây chính là cơ chế ngăn bỏ phiếu nhiều lần — không thể hack bằng cách xóa cache hay refresh trang.

### 10.3 Vai Trò Của `modifier onlyOwner`

Thay vì viết `require(msg.sender == owner)` lặp đi lặp lại ở đầu mỗi hàm Admin, Solidity cho phép định nghĩa `modifier onlyOwner` một lần và dùng lại nhiều lần. Đây là pattern lập trình sạch và an toàn, tránh quên kiểm tra quyền hạn ở một hàm nào đó.

### 10.4 Hàm `view` Và Hàm Ghi Dữ Liệu

Trong Solidity, hàm có từ khóa `view` (hoặc `pure`) chỉ đọc dữ liệu, không thay đổi trạng thái blockchain. Gọi hàm `view` **miễn phí Gas** và không cần ký giao dịch — Ethers.js trả về kết quả ngay lập tức. Ngược lại, hàm ghi dữ liệu như `vote()` phải gửi transaction, cần ký và trả Gas.

### 10.5 Tại Sao Dùng `uint` Cho `candidateId`?

`uint` (Unsigned Integer — số nguyên không âm) phù hợp vì ID ứng viên không bao giờ âm. Dùng `uint` thay `int` tốt hơn vì tránh được một lớp lỗi tiềm năng (ID âm).

---

## 11. Xử Lý Lỗi Thường Gặp

### Lỗi: "MetaMask không popup khi bấm Kết nối ví"
**Nguyên nhân:** Extension MetaMask chưa được cài, hoặc đã bị block popup.  
**Giải pháp:** Kiểm tra icon MetaMask trên thanh công cụ trình duyệt. Bấm vào đó để mở MetaMask thủ công, sau đó thử lại.

### Lỗi: "Transaction reverted" khi bỏ phiếu
**Nguyên nhân:** Địa chỉ ví chưa được whitelisted, hoặc đã bỏ phiếu rồi.  
**Giải pháp:** Đảm bảo Admin đã gọi `whitelistVoter` với địa chỉ ví đang dùng. Kiểm tra xem tài khoản có phải là đúng tài khoản được cấp phép không.

### Lỗi: "Nonce too high" trong MetaMask
**Nguyên nhân:** Bạn đã restart Hardhat node (tắt và bật lại `npx hardhat node`) nhưng MetaMask vẫn nhớ nonce cũ.  
**Giải pháp:** Vào MetaMask → Settings → Advanced → Reset Account. Thao tác này chỉ reset lịch sử giao dịch, không mất ví.

### Lỗi: "Contract address không đúng" hoặc hàm gọi không phản hồi
**Nguyên nhân:** Contract Address trong `app.js` khác với contract thực sự đang chạy. Xảy ra khi bạn deploy lại nhưng quên cập nhật `app.js`.  
**Giải pháp:** Deploy lại, copy Contract Address mới, cập nhật `app.js`.

### Lỗi: Kết quả không cập nhật sau khi bỏ phiếu
**Nguyên nhân:** Event Listener không hoạt động, hoặc có lỗi JavaScript ở bước lắng nghe Event.  
**Giải pháp:** Mở DevTools (F12), xem tab Console để tìm lỗi. Thử gọi thủ công hàm `getVotes` để kiểm tra kết nối đến contract có đúng không.

### Lỗi: Chain ID không khớp
**Nguyên nhân:** MetaMask đang kết nối đến mạng sai (ví dụ: Ethereum Mainnet thay vì Hardhat Localhost).  
**Giải pháp:** Chuyển MetaMask sang mạng **Hardhat Localhost** (Chain ID 31337).

---

## 12. Câu Hỏi Bảo Vệ Đồ Án

Dưới đây là các câu hỏi thường gặp khi bảo vệ đề tài này, cùng với định hướng trả lời:

**"Tại sao Blockchain lại chống gian lận tốt hơn cơ sở dữ liệu truyền thống?"**  
→ Blockchain lưu dữ liệu phân tán trên nhiều nút, không có điểm trung tâm để tấn công. Mỗi block được liên kết bằng hash mật mã — sửa một block sẽ làm vô hiệu toàn bộ chuỗi sau đó, và cần đồng thuận của đa số mạng lưới. CSDL truyền thống do một bên quản lý, người có quyền root có thể sửa đổi thoải mái.

**"Nếu Admin muốn gian lận, họ có làm được không?"**  
→ Không — đây là điểm mấu chốt của Smart Contract. Sau khi deploy, code contract không thể thay đổi. Admin chỉ có thể thực hiện những gì contract cho phép (thêm ứng viên, whitelist cử tri). Admin không thể xóa phiếu, thay đổi kết quả, hay bỏ phiếu thay người khác vì mọi giao dịch đều cần chữ ký Private Key của đúng ví đó.

**"Smart Contract có thể bị hack không?"**  
→ Bản thân blockchain rất khó tấn công. Tuy nhiên, lỗ hổng thường đến từ code Solidity viết sai, không phải từ blockchain. Các lỗ hổng phổ biến gồm: Reentrancy Attack, Integer Overflow, Access Control sai. Trong đề tài này, chúng ta dùng Solidity 0.8+ (có built-in overflow protection) và kiểm soát quyền truy cập nghiêm ngặt bằng `modifier`.

**"Gas fee trong hệ thống thực tế ảnh hưởng thế nào đến cử tri?"**  
→ Đây là thách thức thực tế. Trong hệ thống thực, cử tri phải có ETH thật để trả Gas, tạo rào cản. Giải pháp trong thực tế gồm: dùng Layer 2 (như Polygon, Optimism) với Gas rất rẻ, hoặc dùng mô hình "meta-transactions" nơi tổ chức trả Gas thay cử tri.

**"Tại sao dùng Hardhat thay vì Ganache?"**  
→ Hardhat là công cụ hiện đại hơn, tích hợp sẵn compile, deploy, và test trong một nơi. Hardhat có hệ sinh thái plugin phong phú, hỗ trợ TypeScript, và có tính năng debug tốt hơn như console.log trong Solidity. Ganache là công cụ cũ hơn, ít tính năng hơn.

**"Tính ẩn danh và tính minh bạch có mâu thuẫn nhau không?"**  
→ Đây là câu hỏi hay về triết lý thiết kế. Trong hệ thống này, phiếu bầu được gắn với địa chỉ ví — địa chỉ ví là bút danh (pseudonymous), không phải tên thật. Ai cũng thấy "địa chỉ 0xAbc...123 đã bỏ phiếu cho Bob" nhưng không biết địa chỉ đó thuộc về ai, trừ khi người đó tự tiết lộ. Đây là sự cân bằng giữa minh bạch (kết quả có thể verify) và riêng tư (danh tính được ẩn).

---

## 📌 Ghi Chú Quan Trọng

> Hệ thống này chạy trên **mạng blockchain ảo cục bộ (localhost)** — tất cả ETH và giao dịch đều là ảo, không có giá trị thực tế. Đây là môi trường an toàn để học tập và phát triển.

> Khi Terminal chạy `npx hardhat node` bị đóng, toàn bộ dữ liệu blockchain (phiếu bầu, trạng thái contract) sẽ **mất hết**. Bạn cần deploy lại từ đầu mỗi khi restart. Đây là đặc tính của mạng ảo cục bộ.

> Để mở rộng hệ thống lên mạng thật, bạn cần deploy lên testnet công cộng (như Sepolia) hoặc mainnet. Quy trình tương tự nhưng cần ETH thật (hoặc ETH testnet từ faucet) và cần bảo mật Private Key cực kỳ cẩn thận.

---

*Tài liệu này được biên soạn phục vụ mục đích học thuật và đồ án tốt nghiệp. Phiên bản: 1.0*
