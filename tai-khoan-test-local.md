# Tài Khoản Test Local

⚠️ **Cảnh báo bảo mật:** Các khóa bí mật (Private Key) này chỉ dùng cho môi trường Hardhat local. Tuyệt đối KHÔNG sử dụng trên mạng thật.

- Mạng: localhost
- Chain ID: 31337
- RPC URL: http://127.0.0.1:8545
- Thời gian tạo: 2026-04-02T13:48:45.675Z

## Danh sách tài khoản

| Vai trò | Index | Địa chỉ ví | Khóa bí mật (Private Key) | Derivation Path |
| --- | --- | --- | --- | --- |
| Owner / Quản trị | 0 | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 | m/44'/60'/0'/0/0 |
| Nguyễn Minh Khôi | 1 | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d | m/44'/60'/0'/0/1 |
| Nguyễn Thanh Nhật | 2 | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC | 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a | m/44'/60'/0'/0/2 |
| Trần Doãn Hòa | 3 | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 | 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6 | m/44'/60'/0'/0/3 |
| Cử tri 4 | 4 | 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 | 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a | m/44'/60'/0'/0/4 |
| Cử tri 5 | 5 | 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc | 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba | m/44'/60'/0'/0/5 |

## Hướng dẫn sử dụng

1. Mở MetaMask → thêm mạng thủ công:
   - **Network name:** Hardhat Localhost
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency symbol:** ETH

2. Import tài khoản: MetaMask → Import Account → dán **Khóa bí mật** từ bảng trên

3. Vai trò các tài khoản:
   - **Owner / Quản trị (Index 0):** Thêm ứng cử viên, cấp quyền cử tri, bắt đầu/kết thúc bầu cử
   - **Nguyễn Minh Khôi (Index 1):** Cử tri — bỏ phiếu sau khi được whitelist
   - **Nguyễn Thanh Nhật (Index 2):** Cử tri — bỏ phiếu sau khi được whitelist
   - **Trần Doãn Hòa (Index 3):** Cử tri — bỏ phiếu sau khi được whitelist
