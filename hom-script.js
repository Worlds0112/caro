/* ==================== JS: xu-ly-trang-chu.js ==================== */

/**
 * Hàm xử lý khi người dùng bấm nút "Bắt Đầu Chơi"
 * Kiểm tra các lựa chọn và chuyển hướng đến trang game
 */
function batDauGame() {
  // Lấy giá trị từ các dropdown
  const loaiGame = document.getElementById("type").value;
  const soHang = document.getElementById("rows").value;
  const soCot = document.getElementById("columns").value;

  // Kiểm tra xem người dùng đã chọn đầy đủ chưa
  if (!loaiGame || !soHang || !soCot) {
    alert("Vui lòng chọn đầy đủ các tùy chọn!");
    return; // Dừng hàm nếu chưa chọn đủ
  }

  // Danh sách các giá trị hợp lệ
  const loaiGameHopLe = ["2-players", "player-computer", "computer-computer"];
  const kichThuocHopLe = ["10", "20", "30", "40", "50", "60"];

  // Kiểm tra tính hợp lệ của các lựa chọn
  if (
    !loaiGameHopLe.includes(loaiGame) ||
    !kichThuocHopLe.includes(soHang) ||
    !kichThuocHopLe.includes(soCot)
  ) {
    alert("Lựa chọn không hợp lệ!");
    return;
  }

  // Chuyển hướng đến trang game với các tham số URL
  window.location.href = `game-caro.html?type=${loaiGame}&rows=${soHang}&columns=${soCot}`;
}
