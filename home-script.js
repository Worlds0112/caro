// Clean home script: no nickname, no badge.
// Handles panel toggles, saving mode settings, and starting the game.

window.addEventListener("DOMContentLoaded", () => {
  // Toggle settings panels
  document.querySelectorAll(".settings-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      const panel = document.getElementById(target);
      if (!panel) return;
      panel.style.display = panel.style.display === "block" ? "none" : "block";
    });
  });

  // Start buttons: persist settings and navigate immediately
  document.querySelectorAll(".start-now").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-mode");
      const panel = btn.closest(".settings-panel");
      if (!panel) return;

      const time = panel.querySelector(".opt-time").value;
      const winlen = parseInt(panel.querySelector(".opt-winlen").value, 10);
      const rows = winlen === 3 ? 3 : 15;
      const cols = winlen === 3 ? 3 : 15;

      // store settings in localStorage for quick reuse
      const key = `caro.settings.${mode}`;
      const settings = {
        time: parseInt(time, 10),
        winlen: winlen,
        rows: parseInt(rows, 10),
        cols: parseInt(cols, 10),
      };
      try {
        localStorage.setItem(key, JSON.stringify(settings));
      } catch (e) {}

      // Navigate to game page with params
      const params = new URLSearchParams();
      params.set("type", mode);
      params.set("rows", rows);
      params.set("columns", cols);
      params.set("time", time);
      params.set("win", winlen);

      window.location.href = `game-caro.html?${params.toString()}`;
    });
  });

  // Prefill panels from localStorage if available
  ["2-players", "player-computer"].forEach((mode) => {
    const key = `caro.settings.${mode}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved) {
        const selector = mode === "2-players" ? "#settings-2p" : "#settings-ai";
        const panel = document.querySelector(selector);
        if (panel) {
          if (saved.time != null)
            panel.querySelector(".opt-time").value = String(saved.time);
          if (saved.winlen != null)
            panel.querySelector(".opt-winlen").value = String(saved.winlen);
        }
      }
    } catch (e) {
      // ignore
    }
  });
});
