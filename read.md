<!-- ==================== FILE: README.md ==================== -->

# Game Cờ Caro (Gomoku) - Phiên Bản Tiếng Việt

Một trò chơi cờ caro trên web với nhiều chế độ chơi khác nhau và giao diện tiếng Việt.

## Tính Năng

### Ba Chế độ Chơi:

- **2 Người Chơi**: Người vs Người
- **Người vs Máy**: Người chơi đấu với AI thông minh
- **Máy vs Máy**: Xem hai AI đấu với nhau

### Kích Thước Bàn Cờ Tùy Chỉnh:

- **Số Hàng**: 10, 20, 30, 40, 50, 60
- **Số Cột**: 10, 20, 30, 40, 50, 60

### Các Chức Năng Điều Khiển:

- **Game Mới**: Bắt đầu ván chơi mới
- **Lưu Game**: Xuất trạng thái game ra file XML
- **Tải Game**: Nhập game đã lưu từ file XML
- **Tạm Dừng/Tiếp Tục**: Dừng và tiếp tục game
- **Khởi Động Lại**: Tải lại trang web

## Cách Chơi

1. Mở file `trang-chu.html` trong trình duyệt web
2. Chọn loại game và kích thước bàn cờ mong muốn
3. Bấm "Bắt Đầu Chơi!" để vào game
4. Người chơi lần lượt đặt quân X và O
5. Người đầu tiên tạo được 5 quân liên tiếp (ngang, dọc, hoặc chéo) sẽ thắng

## Thuật Toán AI

### Chiến Lược Tấn Công:

AI ưu tiên tạo ra các đường thắng bằng cách:

- Tìm vị trí có thể tạo 5 quân liên tiếp
- Ưu tiên các vị trí tạo 4, 3, 2 quân liên tiếp

### Chiến Lược Phòng Thủ:

AI cũng chú ý chặn đối thủ:

- Chặn đối thủ tạo 4 quân liên tiếp (ưu tiên cao nhất)
- Chặn các đường 3, 2 quân của đối thủ

### Bảng Điểm:

```javascript
// Điểm tấn công (cho máy)
5 quân: Vô cực (thắng ngay)
4 quân: 2000 điểm
3 quân: 500 điểm
2 quân: 300 điểm
1 quân: 100 điểm

// Điểm phòng thủ (chặn đối thủ)
Chặn 4 quân: 999999 điểm
Chặn 3 quân: 1000 điểm
Chặn 2 quân: 400 điểm
Chặn 1 quân: 10 điểm
```

// Cấu Trúc File
_/
├── trang-chu.html - Trang chọn cài đặt game
├── game-caro.html - Trang chơi game chính
└── README.md - File hướng dẫn này
_/
// Chi Tiết Kỹ Thuật
Công Nghệ Sử Dụng:
HTML5: Cấu trúc trang web
CSS3: Thiết kế giao diện với gradient và hiệu ứng
JavaScript ES6: Logic game và AI
XML: Format lưu/tải game
Các Hàm Chính:
Khởi Tạo và Hiển Thị:
khoiTaoGame(): Khởi tạo game mới
veBang(): Vẽ bàn cờ lên màn hình
Xử Lý Game:
xuLyClick(): Xử lý khi người dùng click
xuLyNuocDi(): Logic xử lý nước đi
kiemTraThang(): Kiểm tra điều kiện thắng
kiemTraHoa(): Kiểm tra điều kiện hòa
Thuật Toán AI:
layNuocDiMay(): Tìm nước đi tốt nhất cho máy
demNgang(), demDoc(), demCheoChinh(), demCheoPhu(): Đếm quân liên tiếp theo các hướng
Lưu/Tải Game:
luuGame(): Xuất game ra file XML
taiGame(): Nhập game từ file XML
Chế Độ Máy vs Máy:
mayVsMay(): Xử lý chế độ tự động
delay(): Tạo độ trễ giữa các nước đi
Tương Thích Trình Duyệt:
Hoạt động trên tất cả trình duyệt hiện đại hỗ trợ ES6:

Chrome 51+
Firefox 54+
Safari 10+
Edge 14+
Hướng Dẫn Cài Đặt
Tải về tất cả file
Mở trang-chu.html bằng trình duyệt web
Bắt đầu chơi!
Lưu ý: Không cần cài đặt server, chạy trực tiếp trên trình duyệt.

Tính Năng Nâng Cao
Lưu/Tải Game:
Game được lưu dưới format XML
Bao gồm toàn bộ trạng thái: kích thước bàn cờ, loại game, lượt chơi, vị trí các quân
Có thể tiếp tục game đã lưu bất cứ lúc nào
AI Thông Minh:
Sử dụng thuật toán đánh giá vị trí dựa trên điểm số
Cân bằng giữa tấn công và phòng thủ
Chọn ngẫu nhiên khi có nhiều nước đi cùng điểm
Giao Diện Thân Thiện:
Thiết kế responsive, hoạt động tốt trên mobile
Hiệu ứng hover và animation mượt mà
Màu sắc phân biệt rõ ràng cho X (đỏ) và O (xanh)
Chúc bạn chơi game vui vẻ! //
