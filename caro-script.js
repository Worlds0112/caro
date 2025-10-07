/* ==================== JS: hang-so.js ==================== */

// Các hằng số định nghĩa ký hiệu quân cờ
const X = "X"; // Ký hiệu quân X
const O = "O"; // Ký hiệu quân O

// HTML để hiển thị quân cờ với màu sắc
const XText = '<span class="x">X</span>'; // X màu đỏ
const OText = '<span class="o">O</span>'; // O màu xanh

// Các loại game
const HAI_NGUOI = "2-players"; // 2 người chơi
const NGUOI_MAY = "player-computer"; // Người vs máy
const MAY_MAY = "computer-computer"; // Máy vs máy

// Bảng điểm cho thuật toán AI (máy tính)
// Số quân liên tiếp -> điểm số tương ứng
const BANG_DIEM_MAY = new Map([
  [5, Infinity], // 5 quân = thắng (điểm vô cực)
  [4, 2000], // 4 quân = 2000 điểm
  [3, 500], // 3 quân = 500 điểm
  [2, 300], // 2 quân = 300 điểm
  [1, 100], // 1 quân = 100 điểm
]);

// Bảng điểm phòng thủ (chặn đối thủ)
const BANG_DIEM_PHONG_THU = new Map([
  [4, 999999], // Chặn 4 quân = ưu tiên cao nhất
  [3, 1000], // Chặn 3 quân = 1000 điểm
  [2, 400], // Chặn 2 quân = 400 điểm
  [1, 10], // Chặn 1 quân = 10 điểm
  [0, 0], // Không có gì để chặn = 0 điểm
]);

// Trạng thái game
const THANG = "win"; // Có người thắng
const HOA = "draw"; // Hòa

/* ==================== JS: xu-ly-game-chinh.js ==================== */

// Các biến toàn cục lưu trạng thái game
let maTranGame = []; // Ma trận lưu trạng thái bàn cờ
let soHang = 0; // Số hàng của bàn cờ
let soCot = 0; // Số cột của bàn cờ
let loaiGame = ""; // Loại game đang chơi
let nguoiChoi = X; // Người chơi hiện tại (X hoặc O)
let dangTamDung = false; // Trạng thái tạm dừng

/**
 * Hàm khởi tạo game - được gọi khi trang load hoặc bắt đầu game mới
 */
function khoiTaoGame() {
  // Đọc tham số từ URL (type, rows, columns)
  const thamSoURL = new URLSearchParams(window.location.search);
  const loai = thamSoURL.get("type");
  const hangParam = thamSoURL.get("rows");
  const cotParam = thamSoURL.get("columns");

  // Kiểm tra xem có đủ tham số không
  if (!loai || !hangParam || !cotParam) {
    // Nếu thiếu tham số, quay về trang chủ
    window.location.href = "trang-chu.html";
    return;
  }

  // Danh sách các giá trị hợp lệ
  const loaiHopLe = [HAI_NGUOI, NGUOI_MAY, MAY_MAY];
  const kichThuocHopLe = [10, 20, 30, 40, 50, 60];

  // Kiểm tra tính hợp lệ
  if (
    !loaiHopLe.includes(loai) ||
    !kichThuocHopLe.includes(parseInt(hangParam)) ||
    !kichThuocHopLe.includes(parseInt(cotParam))
  ) {
    // Nếu không hợp lệ, quay về trang chủ
    window.location.href = "trang-chu.html";
    return;
  }

  // Gán giá trị cho các biến toàn cục
  loaiGame = loai;
  soHang = parseInt(hangParam);
  soCot = parseInt(cotParam);
  nguoiChoi = X; // Luôn bắt đầu bằng X
  dangTamDung = false; // Không tạm dừng

  // Khởi tạo ma trận game (mảng 2 chiều)
  maTranGame = [];
  for (let i = 0; i < soHang; i++) {
    maTranGame[i] = []; // Tạo hàng thứ i
    for (let j = 0; j < soCot; j++) {
      maTranGame[i][j] = ""; // Mỗi ô ban đầu là chuỗi rỗng
    }
  }

  // Vẽ bảng game lên màn hình
  veBang();

  // Nếu là chế độ máy vs máy, tự động bắt đầu
  if (loaiGame === MAY_MAY) {
    setTimeout(() => {
      mayVsMay(soHang * soCot); // Tối đa số nước = số ô
    }, 500); // Delay 500ms để người dùng thấy bảng
  }
}

/**
 * Hàm vẽ bảng game lên màn hình
 */
function veBang() {
  const bang = document.getElementById("table_game");
  bang.innerHTML = ""; // Xóa nội dung cũ

  // Tạo từng hàng
  for (let i = 0; i < soHang; i++) {
    const hang = bang.insertRow(); // Thêm hàng mới

    // Tạo từng cột trong hàng
    for (let j = 0; j < soCot; j++) {
      const o = hang.insertCell(); // Thêm ô mới
      o.className = "td_game"; // Gán class CSS

      // Tạo div bên trong ô, có thể click được
      // ID có dạng "i-j" để biết vị trí ô
      o.innerHTML = `<div id="${i}-${j}" class="fixed" onclick="xuLyClick(this.id)"></div>`;
    }
  }
}

/**
 * Hàm xử lý khi người dùng click vào một ô
 * @param {string} id - ID của ô được click (dạng "i-j")
 */
function xuLyClick(id) {
  // Nếu đang tạm dừng thì không làm gì
  if (dangTamDung) return;

  // Xử lý nước đi
  const ketQua = xuLyNuocDi(id);

  // Kiểm tra kết quả
  if (ketQua === THANG) {
    // Có người thắng
    setTimeout(() => {
      alert("Người chơi: " + nguoiChoi + " đã thắng!");
      khoiTaoGame(); // Bắt đầu game mới
    }, 100);
  } else if (ketQua === HOA) {
    // Hòa
    setTimeout(() => {
      alert("Hòa!");
      khoiTaoGame(); // Bắt đầu game mới
    }, 100);
  }
}

/**
 * Hàm xử lý logic nước đi
 * @param {string} id - ID của ô được click
 * @returns {string|undefined} - Trả về THANG, HOA hoặc undefined
 */
function xuLyNuocDi(id) {
  // Tách ID để lấy tọa độ hàng, cột
  const [h, c] = id.split("-").map(Number);

  // Kiểm tra ô đã được đánh chưa
  if (maTranGame[h][c] !== "") return; // Ô đã có quân, không làm gì

  if (loaiGame === HAI_NGUOI) {
    // Chế độ 2 người chơi
    if (nguoiChoi === X) {
      maTranGame[h][c] = X; // Đặt quân X vào ma trận
      document.getElementById(id).innerHTML = XText; // Hiển thị X trên màn hình
    } else {
      maTranGame[h][c] = O; // Đặt quân O vào ma trận
      document.getElementById(id).innerHTML = OText; // Hiển thị O trên màn hình
    }

    // Kiểm tra thắng
    if (kiemTraThang([h, c])) return THANG;

    // Kiểm tra hòa
    if (kiemTraHoa()) return HOA;

    // Đổi lượt chơi
    nguoiChoi = nguoiChoi === X ? O : X;
  } else if (loaiGame === NGUOI_MAY) {
    // Chế độ người vs máy
    if (nguoiChoi === X) {
      // Lượt người chơi
      maTranGame[h][c] = X;
      document.getElementById(id).innerHTML = XText;

      // Kiểm tra người thắng
      if (kiemTraThang([h, c])) return THANG;
      if (kiemTraHoa()) return HOA;

      nguoiChoi = O; // Chuyển lượt cho máy

      // Máy đánh sau 200ms
      setTimeout(() => {
        const nuocDiMay = layNuocDiMay();
        if (nuocDiMay) {
          const [hMay, cMay] = nuocDiMay;
          maTranGame[hMay][cMay] = O;
          document.getElementById(`${hMay}-${cMay}`).innerHTML = OText;

          // Kiểm tra máy thắng
          if (kiemTraThang([hMay, cMay])) {
            setTimeout(() => {
              alert("Người chơi: " + O + " đã thắng!");
              khoiTaoGame();
            }, 100);
            return;
          }

          if (kiemTraHoa()) {
            setTimeout(() => {
              alert("Hòa!");
              khoiTaoGame();
            }, 100);
            return;
          }

          nguoiChoi = X; // Chuyển lượt lại cho người
        }
      }, 200);
    }
  }
}
/**
 * Hàm kiểm tra hòa - khi không còn ô trống nào
 * @returns {boolean} - true nếu hòa, false nếu chưa
 */
function kiemTraHoa() {
  // Duyệt qua tất cả các ô
  for (let i = 0; i < soHang; i++) {
    for (let j = 0; j < soCot; j++) {
      if (maTranGame[i][j] === "") {
        return false; // Còn ô trống, chưa hòa
      }
    }
  }
  return true; // Không còn ô trống, hòa
}

/**
 * Hàm đếm số quân liên tiếp theo hướng ngang (trái-phải)
 * @param {number} x - Tọa độ hàng
 * @param {number} y - Tọa độ cột
 * @param {string} nguoiKiemTra - Loại quân cần kiểm tra (X hoặc O)
 * @returns {number} - Số quân liên tiếp (bao gồm ô hiện tại)
 */
function demNgang(x, y, nguoiKiemTra) {
  let dem = 1; // Đếm ô hiện tại

  // Đếm về phía trái (tối đa 4 ô)
  for (let i = 1; i <= 4; i++) {
    if (y - i >= 0 && maTranGame[x][y - i] === nguoiKiemTra) {
      dem++; // Tìm thấy quân cùng loại
    } else {
      break; // Gặp quân khác hoặc ra ngoài biên, dừng
    }
  }

  // Đếm về phía phải (tối đa 4 ô)
  for (let i = 1; i <= 4; i++) {
    if (y + i < soCot && maTranGame[x][y + i] === nguoiKiemTra) {
      dem++;
    } else {
      break;
    }
  }

  return dem;
}

/**
 * Hàm đếm số quân liên tiếp theo hướng dọc (trên-dưới)
 * @param {number} x - Tọa độ hàng
 * @param {number} y - Tọa độ cột
 * @param {string} nguoiKiemTra - Loại quân cần kiểm tra
 * @returns {number} - Số quân liên tiếp
 */
function demDoc(x, y, nguoiKiemTra) {
  let dem = 1;

  // Đếm về phía trên
  for (let i = 1; i <= 4; i++) {
    if (x - i >= 0 && maTranGame[x - i][y] === nguoiKiemTra) {
      dem++;
    } else {
      break;
    }
  }

  // Đếm về phía dưới
  for (let i = 1; i <= 4; i++) {
    if (x + i < soHang && maTranGame[x + i][y] === nguoiKiemTra) {
      dem++;
    } else {
      break;
    }
  }

  return dem;
}

/**
 * Hàm đếm số quân liên tiếp theo đường chéo chính (\)
 * @param {number} x - Tọa độ hàng
 * @param {number} y - Tọa độ cột
 * @param {string} nguoiKiemTra - Loại quân cần kiểm tra
 * @returns {number} - Số quân liên tiếp
 */
function demCheoChinh(x, y, nguoiKiemTra) {
  let dem = 1;

  // Đếm về phía trên-trái
  for (let i = 1; i <= 4; i++) {
    if (x - i >= 0 && y - i >= 0 && maTranGame[x - i][y - i] === nguoiKiemTra) {
      dem++;
    } else {
      break;
    }
  }

  // Đếm về phía dưới-phải
  for (let i = 1; i <= 4; i++) {
    if (
      x + i < soHang &&
      y + i < soCot &&
      maTranGame[x + i][y + i] === nguoiKiemTra
    ) {
      dem++;
    } else {
      break;
    }
  }

  return dem;
}

/**
 * Hàm đếm số quân liên tiếp theo đường chéo phụ (/)
 * @param {number} x - Tọa độ hàng
 * @param {number} y - Tọa độ cột
 * @param {string} nguoiKiemTra - Loại quân cần kiểm tra
 * @returns {number} - Số quân liên tiếp
 */
function demCheoPhu(x, y, nguoiKiemTra) {
  let dem = 1;

  // Đếm về phía trên-phải
  for (let i = 1; i <= 4; i++) {
    if (
      x - i >= 0 &&
      y + i < soCot &&
      maTranGame[x - i][y + i] === nguoiKiemTra
    ) {
      dem++;
    } else {
      break;
    }
  }

  // Đếm về phía dưới-trái
  for (let i = 1; i <= 4; i++) {
    if (
      x + i < soHang &&
      y - i >= 0 &&
      maTranGame[x + i][y - i] === nguoiKiemTra
    ) {
      dem++;
    } else {
      break;
    }
  }

  return dem;
}

/**
 * Hàm kiểm tra thắng - có 5 quân liên tiếp không
 * @param {Array} viTri - Vị trí vừa đánh [hàng, cột]
 * @returns {boolean} - true nếu thắng, false nếu chưa
 */
function kiemTraThang(viTri) {
  const [x, y] = viTri;
  const nguoiHienTai = maTranGame[x][y]; // Lấy loại quân tại vị trí này

  // Kiểm tra 4 hướng: ngang, dọc, chéo chính, chéo phụ
  const ngang = demNgang(x, y, nguoiHienTai);
  const doc = demDoc(x, y, nguoiHienTai);
  const cheoChinh = demCheoChinh(x, y, nguoiHienTai);
  const cheoPhu = demCheoPhu(x, y, nguoiHienTai);

  // Thắng nếu có ít nhất 5 quân liên tiếp ở bất kỳ hướng nào
  return ngang >= 5 || doc >= 5 || cheoChinh >= 5 || cheoPhu >= 5;
}

/**
 * Hàm AI - tìm nước đi tốt nhất cho máy
 * Sử dụng thuật toán đánh giá điểm số dựa trên tấn công và phòng thủ
 * @returns {Array|null} - Vị trí tốt nhất [hàng, cột] hoặc null
 */
function layNuocDiMay() {
  let diemToiDa = -Infinity; // Điểm số cao nhất tìm được
  let danhSachDiem = []; // Danh sách tất cả vị trí và điểm
  let cacViTriTot = []; // Các vị trí có điểm cao nhất

  // Duyệt qua tất cả ô trống
  for (let i = 0; i < soHang; i++) {
    for (let j = 0; j < soCot; j++) {
      if (maTranGame[i][j] === "") {
        // Ô trống

        // Tính điểm tấn công - giả sử đặt quân O tại đây
        const tanCong = Math.max(
          demNgang(i, j, O),
          demDoc(i, j, O),
          demCheoChinh(i, j, O),
          demCheoPhu(i, j, O)
        );

        // Tính điểm phòng thủ - giả sử chặn quân X tại đây
        const phongThu =
          Math.max(
            demNgang(i, j, X),
            demDoc(i, j, X),
            demCheoChinh(i, j, X),
            demCheoPhu(i, j, X)
          ) - 1; // Trừ 1 vì chưa thực sự đặt quân

        // Đảm bảo điểm phòng thủ không âm
        const diemPhongThu = phongThu < 0 ? 0 : phongThu;

        // Tính tổng điểm = điểm tấn công + điểm phòng thủ
        const tongDiem =
          BANG_DIEM_MAY.get(tanCong) + BANG_DIEM_PHONG_THU.get(diemPhongThu);

        // Cập nhật điểm cao nhất và danh sách
        if (tongDiem >= diemToiDa) {
          if (tongDiem > diemToiDa) {
            diemToiDa = tongDiem;
            danhSachDiem = []; // Reset danh sách
          }
          danhSachDiem.push({ diem: tongDiem, viTri: [i, j] });
        }
      }
    }
  }

  // Lọc ra các vị trí có điểm cao nhất
  cacViTriTot = danhSachDiem
    .filter((item) => item.diem === diemToiDa)
    .map((item) => item.viTri);

  // Chọn ngẫu nhiên một vị trí trong số các vị trí tốt nhất
  if (cacViTriTot.length > 0) {
    return cacViTriTot[Math.floor(Math.random() * cacViTriTot.length)];
  }

  return null; // Không tìm được nước đi (không thể xảy ra)
}

/**
 * Hàm xử lý chế độ máy vs máy
 * Hai AI sẽ tự động chơi với nhau
 * @param {number} soNuocToiDa - Số nước tối đa có thể đánh
 */
async function mayVsMay(soNuocToiDa) {
  let soNuocDaDanh = 0;
  nguoiChoi = X; // Máy A đi trước (X)

  // Vòng lặp game
  while (soNuocDaDanh < soNuocToiDa) {
    // Nếu đang tạm dừng, chờ
    if (dangTamDung) {
      await delay(100);
      continue;
    }

    // Delay để tạo hiệu ứng "suy nghĩ"
    await delay(100);

    // Máy tìm nước đi
    const nuocDiMay = layNuocDiMay();
    if (!nuocDiMay) break; // Không tìm được nước đi

    const [h, c] = nuocDiMay;

    // Thực hiện nước đi
    maTranGame[h][c] = nguoiChoi;
    document.getElementById(`${h}-${c}`).innerHTML =
      nguoiChoi === X ? XText : OText;

    // Kiểm tra thắng
    if (kiemTraThang([h, c])) {
      setTimeout(() => {
        alert("Người chơi: " + nguoiChoi + " đã thắng!");
        khoiTaoGame();
      }, 100);
      return THANG;
    }

    // Kiểm tra hòa
    if (kiemTraHoa()) {
      setTimeout(() => {
        alert("Hòa!");
        khoiTaoGame();
      }, 100);
      return HOA;
    }

    // Đổi lượt: X -> O hoặc O -> X
    nguoiChoi = nguoiChoi === X ? O : X;
    soNuocDaDanh++;
  }
}

/**
 * Hàm delay - tạm dừng thực thi trong một khoảng thời gian
 * @param {number} ms - Số millisecond cần delay
 * @returns {Promise} - Promise để sử dụng với await
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Hàm lưu game ra file XML
 * Tạo file XML chứa toàn bộ trạng thái game và tải xuống
 */
function luuGame() {
  // Tạo nội dung XML
  let noiDungXML = '<?xml version="1.0" encoding="UTF-8"?>\n';
  noiDungXML += "<game>\n";
  noiDungXML += `  <soHang>${soHang}</soHang>\n`;
  noiDungXML += `  <soCot>${soCot}</soCot>\n`;
  noiDungXML += `  <loaiGame>${loaiGame}</loaiGame>\n`;
  noiDungXML += `  <nguoiChoi>${nguoiChoi}</nguoiChoi>\n`;
  noiDungXML += "  <maTran>\n";

  // Lưu từng hàng của ma trận
  for (let i = 0; i < soHang; i++) {
    noiDungXML += `    <hang>${maTranGame[i].join(",")}</hang>\n`;
  }

  noiDungXML += "  </maTran>\n";
  noiDungXML += "</game>";

  // Tạo file và tải xuống
  const blob = new Blob([noiDungXML], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "caro_luu_game.xml"; // Tên file
  document.body.appendChild(a);
  a.click(); // Kích hoạt tải xuống
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // Giải phóng bộ nhớ
}
/**
 * Hàm tải game từ file XML
 * Đọc file XML và khôi phục trạng thái game
 */
function taiGame() {
  const fileInput = document.getElementById("loadFile");
  const file = fileInput.files[0]; // Lấy file được chọn

  if (!file) return; // Không có file nào được chọn

  // Đọc file
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      // Parse XML
      const noiDungXML = e.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(noiDungXML, "text/xml");

      // Đọc các thông tin từ XML
      const hangDaTai = parseInt(
        xmlDoc.getElementsByTagName("soHang")[0].textContent
      );
      const cotDaTai = parseInt(
        xmlDoc.getElementsByTagName("soCot")[0].textContent
      );
      const loaiGameDaTai =
        xmlDoc.getElementsByTagName("loaiGame")[0].textContent;
      const nguoiChoiDaTai =
        xmlDoc.getElementsByTagName("nguoiChoi")[0].textContent;

      // Cập nhật biến toàn cục
      soHang = hangDaTai;
      soCot = cotDaTai;
      loaiGame = loaiGameDaTai;
      nguoiChoi = nguoiChoiDaTai;

      // Khôi phục ma trận
      maTranGame = [];
      const cacHangXML = xmlDoc.getElementsByTagName("hang");

      for (let i = 0; i < cacHangXML.length; i++) {
        // Tách chuỗi thành mảng (ví dụ: "X,O," -> ["X", "O", ""])
        const duLieuHang = cacHangXML[i].textContent.split(",");
        maTranGame[i] = duLieuHang;
      }

      // Vẽ lại bảng
      veBang();

      // Hiển thị lại các quân cờ
      for (let i = 0; i < soHang; i++) {
        for (let j = 0; j < soCot; j++) {
          const giaTriO = maTranGame[i][j];
          if (giaTriO === X) {
            document.getElementById(`${i}-${j}`).innerHTML = XText;
          } else if (giaTriO === O) {
            document.getElementById(`${i}-${j}`).innerHTML = OText;
          }
          // Ô trống ("") không cần làm gì
        }
      }

      alert("Tải game thành công!");
    } catch (loi) {
      alert("Lỗi khi tải file game!");
      console.error("Chi tiết lỗi:", loi);
    }
  };

  // Đọc file dưới dạng text
  reader.readAsText(file);
}

/**
 * Hàm tạm dừng/tiếp tục game
 * Chuyển đổi trạng thái tạm dừng và cập nhật text nút
 */
function tamDung() {
  dangTamDung = !dangTamDung; // Đảo trạng thái
  const nutTamDung = document.getElementById("pauseBtn");

  // Cập nhật text nút
  nutTamDung.textContent = dangTamDung ? "Tiếp Tục" : "Tạm Dừng";
}

/**
 * Hàm được gọi khi trang web load xong
 * Tự động khởi tạo game
 */
window.onload = function () {
  khoiTaoGame();
};
