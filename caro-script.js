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
// Score tracking for multiple rounds
let playerScores = { left: 0, right: 0 };
// Per-turn timer state
let turnTimerId = null;
let turnTimeSeconds = 30; // default per-turn time shown (0 = unlimited)
// Per-player remaining time (chess-clock style)
let playerRemaining = [0, 0];
// win length (number of in-a-row to win). default 5
let winLength = 5;

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
  // We'll accept flexible params. time and win may be provided too.
  const loaiHopLe = [HAI_NGUOI, NGUOI_MAY, MAY_MAY];
  if (!loaiHopLe.includes(loai)) {
    window.location.href = "Home.html";
    return;
  }

  // parse optional params
  const rowsParamVal = hangParam ? parseInt(hangParam, 10) : NaN;
  const colsParamVal = cotParam ? parseInt(cotParam, 10) : NaN;
  const timeParam = thamSoURL.get("time");
  const winParam = thamSoURL.get("win");

  // set winLength if provided and valid (3,4,5)
  const w = parseInt(winParam, 10);
  if (!isNaN(w) && [3, 4, 5].includes(w)) winLength = w;

  // default sizes: if winLength==3 -> 3x3, else 15x15
  const defaultSize = winLength === 3 ? 3 : 15;

  // rows/cols: accept integers between 3 and 60; if provided override defaults, except when winLength==3 we force 3
  if (winLength === 3) {
    soHang = 3;
    soCot = 3;
  } else {
    soHang =
      !isNaN(rowsParamVal) && rowsParamVal >= 3 && rowsParamVal <= 60
        ? rowsParamVal
        : defaultSize;
    soCot =
      !isNaN(colsParamVal) && colsParamVal >= 3 && colsParamVal <= 60
        ? colsParamVal
        : defaultSize;
  }

  // time param: seconds (0 = unlimited)
  if (timeParam !== null) {
    const t = parseInt(timeParam, 10);
    if (!isNaN(t) && t >= 0) {
      turnTimeSeconds = t;
    }
  }

  // set game type
  loaiGame = loai;
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

  // Reset and start per-turn timer for player 0
  updateScoresUI();

  // Initialize per-player remaining clocks (chess-clock style)
  if (turnTimeSeconds === 0) {
    // unlimited
    playerRemaining = [Infinity, Infinity];
  } else {
    playerRemaining = [turnTimeSeconds, turnTimeSeconds];
  }

  // Update UI clocks
  const time0 = document.getElementById("time-left-0");
  const time1 = document.getElementById("time-left-1");
  if (time0)
    time0.textContent =
      turnTimeSeconds === 0 ? "∞" : formatTime(playerRemaining[0]);
  if (time1)
    time1.textContent =
      turnTimeSeconds === 0 ? "∞" : formatTime(playerRemaining[1]);

  // Start the active player's clock (X starts)
  startTurnTimer(0);

  // Hiển thị thông báo bắt đầu trò chơi trên màn hình
  showMessageOverlay("info", "TRÒ CHƠI BẮT ĐẦU!", {
    autoHide: true,
    timeout: 1500,
  });

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

  // adjust cell size and wrap behavior for 3x3 mode
  try {
    const wrap = document.querySelector(".table-wrap");
    if (wrap) {
      if (winLength === 3) {
        // compute large cell so 3x3 fills most of wrap
        const availW = wrap.clientWidth - 24; // account for padding
        const availH = wrap.clientHeight - 24;
        const cell = Math.max(60, Math.floor(Math.min(availW / 3, availH / 3)));
        document.documentElement.style.setProperty("--cell-size", cell + "px");
        wrap.style.overflow = "hidden";
        wrap.style.display = "flex";
        wrap.style.alignItems = "center";
        wrap.style.justifyContent = "center";
        // add class to board-card for tighter padding and larger appearance
        const card = document.querySelector(".board-card");
        if (card) card.classList.add("large-3x3");
      } else {
        // reset to default behaviors
        document.documentElement.style.setProperty("--cell-size", "34px");
        wrap.style.overflow = "auto";
        wrap.style.display = "";
        wrap.style.alignItems = "";
        wrap.style.justifyContent = "";
        const card = document.querySelector(".board-card");
        if (card) card.classList.remove("large-3x3");
      }
    }
  } catch (e) {
    console.warn(e);
  }

  // create colgroup so columns size correctly
  if (soCot > 0) {
    const colgroup = document.createElement("colgroup");
    for (let c = 0; c < soCot; c++) {
      const col = document.createElement("col");
      colgroup.appendChild(col);
    }
    bang.appendChild(colgroup);
  }

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

function updateScoresUI() {
  const left = document.getElementById("score-left");
  const right = document.getElementById("score-right");
  if (left) left.textContent = playerScores.left;
  if (right) right.textContent = playerScores.right;
}

function formatTime(s) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function startTurnTimer(playerIndex) {
  // Stop any existing timer
  stopTurnTimer();

  const el = document.getElementById(`time-left-${playerIndex}`);
  // If unlimited, display infinity and do not start interval
  if (!isFinite(playerRemaining[playerIndex])) {
    if (el) el.textContent = "∞";
    return;
  }

  // Ensure we have a number for remaining time
  let remaining =
    typeof playerRemaining[playerIndex] === "number"
      ? Math.max(0, Math.floor(playerRemaining[playerIndex]))
      : 0;
  if (el) el.textContent = formatTime(remaining);

  turnTimerId = setInterval(() => {
    remaining -= 1;
    playerRemaining[playerIndex] = remaining;
    // update the UI for this player
    const elNow = document.getElementById(`time-left-${playerIndex}`);
    if (elNow) elNow.textContent = formatTime(Math.max(0, remaining));

    if (remaining <= 0) {
      stopTurnTimer();
      // current player's time expired -> they lose
      const loser = playerIndex === 0 ? X : O;
      const winner = loser === X ? O : X;
      setTimeout(() => {
        showMessageOverlay("lose", "Hết giờ", { winner: winner });
      }, 100);
    }
  }, 1000);
}

function stopTurnTimer() {
  if (turnTimerId) {
    clearInterval(turnTimerId);
    turnTimerId = null;
  }
}

// ================= Overlay messages =================
function ensureOverlay() {
  let overlay = document.getElementById("game-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "game-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.pointerEvents = "none";
    overlay.innerHTML =
      '<div id="game-overlay-box" style="pointer-events:auto; min-width:280px; max-width:80%; padding:22px 26px; border-radius:10px; background:rgba(8,12,16,0.85); color:#fff; text-align:center; box-shadow:0 8px 30px rgba(0,0,0,0.6); display:none;"></div>';
    document.body.appendChild(overlay);
  }
  return overlay;
}

function showMessageOverlay(type, text, options = {}) {
  const overlay = ensureOverlay();
  const box = document.getElementById("game-overlay-box");
  box.innerHTML = "";

  // Stop any running turn timer when showing overlay
  stopTurnTimer();

  // Update scores if winner provided
  if (options && options.winner) {
    if (options.winner === X) playerScores.left++;
    else if (options.winner === O) playerScores.right++;
    updateScoresUI();
  }

  const title = document.createElement("div");
  title.style.fontSize = "22px";
  title.style.fontWeight = "800";
  title.style.marginBottom = "12px";
  title.textContent = text;
  box.appendChild(title);

  // If end of game, show buttons
  if (type === "win" || type === "lose" || type === "draw") {
    const sub = document.createElement("div");
    sub.style.marginBottom = "16px";
    sub.style.color = "#cbd5e1";
    if (options && options.winner) {
      sub.textContent =
        options.winner === X
          ? "Bạn đã thắng 🎉"
          : options.winner === O
          ? "Bạn đã thua 😢"
          : "Kết thúc";
    } else {
      sub.textContent =
        type === "draw"
          ? "Hòa"
          : type === "win"
          ? "Bạn đã thắng 🎉"
          : "Bạn đã thua 😢";
    }
    box.appendChild(sub);

    const btnContinue = document.createElement("button");
    btnContinue.textContent = "Tiếp tục trò chơi";
    btnContinue.style.margin = "6px";
    btnContinue.onclick = function () {
      box.style.display = "none";
      // start a fresh game with same params
      khoiTaoGame();
    };

    const btnHome = document.createElement("button");
    btnHome.textContent = "Quay về trang chủ";
    btnHome.style.margin = "6px";
    btnHome.onclick = function () {
      window.location.href = "Home.html";
    };

    [btnContinue, btnHome].forEach((b) => {
      b.style.padding = "8px 14px";
      b.style.borderRadius = "6px";
      b.style.border = "0";
      b.style.cursor = "pointer";
      b.style.background = "#1f2937";
      b.style.color = "#fff";
    });

    box.appendChild(btnContinue);
    box.appendChild(btnHome);
  }

  // General info
  if (type === "info") {
    // no extra buttons
  }

  box.style.display = "block";
  overlay.style.display = "flex";
  if (options && options.autoHide) {
    setTimeout(() => {
      box.style.display = "none";
      overlay.style.display = "none";
    }, options.timeout || 1200);
  }
}

function hideOverlay() {
  const overlay = document.getElementById("game-overlay");
  if (overlay) {
    const box = document.getElementById("game-overlay-box");
    if (box) box.style.display = "none";
    overlay.style.display = "none";
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
      showMessageOverlay("win", "Kết thúc", { winner: nguoiChoi });
    }, 100);
  } else if (ketQua === HOA) {
    // Hòa
    setTimeout(() => {
      showMessageOverlay("draw", "Kết thúc");
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
    // Start timer for next player
    const nextPlayerIndex = nguoiChoi === X ? 0 : 1;
    startTurnTimer(nextPlayerIndex);
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
              // If machine won, winner is O (machine)
              showMessageOverlay("lose", "Kết thúc", { winner: O });
            }, 100);
            return;
          }

          if (kiemTraHoa()) {
            setTimeout(() => {
              showMessageOverlay("draw", "Kết thúc");
            }, 100);
            return;
          }

          nguoiChoi = X; // Chuyển lượt lại cho người
          // start timer for human player
          startTurnTimer(0);
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

  // Thắng nếu có ít nhất winLength quân liên tiếp ở bất kỳ hướng nào
  return (
    ngang >= winLength ||
    doc >= winLength ||
    cheoChinh >= winLength ||
    cheoPhu >= winLength
  );
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
        showMessageOverlay("win", "Kết thúc", { winner: nguoiChoi });
      }, 100);
      return THANG;
    }

    // Kiểm tra hòa
    if (kiemTraHoa()) {
      setTimeout(() => {
        showMessageOverlay("draw", "Kết thúc");
      }, 100);
      return HOA;
    }

    // Đổi lượt: X -> O hoặc O -> X
    nguoiChoi = nguoiChoi === X ? O : X;
    const nextIdx = nguoiChoi === X ? 0 : 1;
    startTurnTimer(nextIdx);
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

      showMessageOverlay("info", "Tải game thành công!", {
        autoHide: true,
        timeout: 1400,
      });
    } catch (loi) {
      showMessageOverlay("info", "Lỗi khi tải file game!");
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

// Render user badge on game page if nameLeft param or saved user exists
(function renderGameUserBadge() {
  try {
    const params = new URLSearchParams(window.location.search);
    let name = params.get("nameLeft") || null;
    if (!name) {
      const cur = JSON.parse(
        localStorage.getItem("caro.currentUser") || "null"
      );
      if (cur && cur.name) name = cur.name;
    }
    if (!name) return;
    // create badge
    const badge = document.createElement("div");
    badge.className = "user-badge";
    badge.style.position = "fixed";
    badge.style.left = "12px";
    badge.style.top = "12px";
    badge.style.background = "rgba(255,255,255,0.03)";
    badge.style.padding = "8px 10px";
    badge.style.borderRadius = "8px";
    badge.style.zIndex = "1000";
    badge.style.cursor = "pointer";
    badge.innerHTML = `<div class="ub-name">${name}</div><button class="ub-logout" title="Đăng xuất" style="background:transparent;border:0;margin-left:10px;color:#9aa6b2;">⎋</button>`;
    document.body.appendChild(badge);
    badge.querySelector(".ub-logout").addEventListener("click", (e) => {
      e.stopPropagation();
      localStorage.removeItem("caro.currentUser");
      // clear saved settings if desired
      location.href = "Home.html";
    });
    badge.addEventListener("click", () => {
      if (confirm("Đăng xuất người dùng?")) {
        localStorage.removeItem("caro.currentUser");
        location.href = "Home.html";
      }
    });
  } catch (e) {}
})();
