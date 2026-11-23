import "./styles.css";

// VMN Enterprise Frontend Client Core (Vite + Tailwind CSS v4)
export function initClient(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // 1. Universal Table Filtering Engine
  document.addEventListener("input", (e: Event) => {
    const target = e.target as HTMLInputElement | null;
    if (!target || !target.classList.contains("vmn-table-filter-input")) return;

    const query = target.value.trim().toLowerCase();
    const wrapper = target.closest(".vmn-data-table-wrapper");
    if (!wrapper) return;

    const table = wrapper.querySelector<HTMLTableElement>("table.vmn-interactive-table, table");
    if (!table) return;

    const rows = table.querySelectorAll<HTMLTableRowElement>("tbody tr");
    let matchCount = 0;

    rows.forEach((row) => {
      // Don't filter single-row empty states with colspan
      const firstCell = row.cells[0];
      if (firstCell && firstCell.colSpan > 1) return;

      const text = row.textContent?.toLowerCase() || "";
      if (query === "" || text.includes(query)) {
        row.style.display = "";
        matchCount++;
      } else {
        row.style.display = "none";
      }
    });

    const paginationSpan = wrapper.querySelector<HTMLSpanElement>(".vmn-table-pagination span");
    if (paginationSpan && query !== "") {
      paginationSpan.textContent = `Showing ${matchCount} matching record${matchCount === 1 ? "" : "s"}`;
    }
  });

  // 2. Interactive EPG Daypart Switcher
  document.addEventListener("click", (e: MouseEvent) => {
    const target = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>(".vmn-epg-daypart-btn");
    if (!target) return;

    const parent = target.closest(".vmn-epg-filter-group");
    if (parent) {
      parent.querySelectorAll(".vmn-epg-daypart-btn").forEach((btn) => btn.classList.remove("active"));
    }
    target.classList.add("active");

    const daypart = target.getAttribute("data-daypart") || "all";
    const container = document.querySelector(".vmn-epg-timeline-container");
    if (!container) return;

    const blocks = container.querySelectorAll<HTMLElement>(".vmn-epg-program-block");
    blocks.forEach((block) => {
      const blockDaypart = block.getAttribute("data-daypart");
      if (daypart === "all" || blockDaypart === daypart) {
        block.style.display = "";
      } else {
        block.style.display = "none";
      }
    });
  });

  // 3. Simulated Live Video Stream Controls
  const playBtn = document.getElementById("vmn-player-play-btn");
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      const isPlaying = playBtn.getAttribute("data-playing") === "true";
      if (isPlaying) {
        playBtn.setAttribute("data-playing", "false");
        playBtn.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" fill="#38bdf8" stroke="#38bdf8" stroke-width="1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
        playBtn.style.transform = "scale(1)";
      } else {
        playBtn.setAttribute("data-playing", "true");
        playBtn.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" fill="#22c55e" stroke="#22c55e" stroke-width="1"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
        playBtn.style.transform = "scale(1.08)";
      }
    });
  }

  // 4. Quick Notification Toast helper
  (window as unknown as Record<string, unknown>).__vmnShowToast = function (message: string, type: "info" | "success" | "warning" = "info") {
    const toast = document.createElement("div");
    toast.className = `vmn-toast-pill ${type}`;
    toast.textContent = message;
    toast.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:9999;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;background:#0f172a;color:#f8fafc;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);transition:all 0.3s ease;";
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };
}

initClient();
