/**
 * Client Bootstrap Bundle (AUD-04)
 * Shipped as an external, CSP-'self'-compliant static JavaScript asset (/assets/app.js).
 * Replaces inline <script> blocks and inline on* event handlers.
 */

export const CLIENT_BOOTSTRAP_JS = `(function() {
  // 1. Theme Switcher Engine
  var themeBtn = document.getElementById("vmn-theme-toggle");
  var savedTheme = localStorage.getItem("vmn-theme");
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var initialTheme = savedTheme || (prefersDark ? "dark" : "light");

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try { localStorage.setItem("vmn-theme", theme); } catch (e) {}
  }

  if (initialTheme === "dark") {
    applyTheme("dark");
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function() {
      var isDark = document.documentElement.getAttribute("data-theme") === "dark";
      applyTheme(isDark ? "light" : "dark");
    });
  }

  // 2. Mobile Drawer Navigation
  var mobileMenuBtn = document.getElementById("vmn-mobile-menu-btn");
  var drawer = document.getElementById("vmn-mobile-drawer");
  var backdrop = document.getElementById("vmn-drawer-backdrop");
  var drawerCloseBtn = document.getElementById("vmn-drawer-close");
  var drawerOpener = null;
  var drawerBackground = null;

  function getDrawerFocusable() {
    return drawer ? Array.prototype.slice.call(drawer.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')) : [];
  }

  function openDrawer() {
    if (drawer && backdrop) {
      drawerOpener = document.activeElement;
      drawerBackground = Array.from(document.body.children)
        .filter(function (element) { return element !== drawer && element !== backdrop && element.tagName !== 'SCRIPT'; })
        .map(function (element) { return { element: element, wasInert: element.inert }; });
      drawerBackground.forEach(function (state) { state.element.inert = true; });
      drawer.inert = false;
      drawer.setAttribute("aria-hidden", "false");
      drawer.setAttribute("role", "dialog");
      drawer.setAttribute("aria-modal", "true");
      backdrop.inert = false;
      backdrop.setAttribute("aria-hidden", "false");
      drawer.classList.add("open");
      backdrop.classList.add("open");
      if (mobileMenuBtn) mobileMenuBtn.setAttribute("aria-expanded", "true");
      if (drawerCloseBtn) drawerCloseBtn.focus();
    }
  }
  function closeDrawer() {
    if (drawer && backdrop && drawer.classList.contains("open")) {
      drawer.classList.remove("open");
      backdrop.classList.remove("open");
      drawer.removeAttribute("role");
      drawer.removeAttribute("aria-modal");
      drawer.setAttribute("aria-hidden", "true");
      drawer.inert = true;
      backdrop.setAttribute("aria-hidden", "true");
      backdrop.inert = true;
      if (mobileMenuBtn) {
        mobileMenuBtn.setAttribute("aria-expanded", "false");
      }
      (drawerBackground || []).forEach(function (state) { state.element.inert = state.wasInert; });
      if (drawerOpener && drawerOpener.focus) drawerOpener.focus();
      drawerOpener = null;
      drawerBackground = null;
    }
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  // 3. Interactive Persona Switcher
  var personaSwitcher = document.getElementById("vmn-persona-switcher");
  if (personaSwitcher) {
    personaSwitcher.addEventListener("change", function(e) {
      var role = e.target.value;
      try { localStorage.setItem("vmn-persona", role); } catch (e) {}
      if (role === "visitor") window.location.href = "/";
      else if (role === "applicant") window.location.href = "/prototypes?screen=application";
      else if (role === "talent") window.location.href = "/prototypes?screen=terms";
      else if (role === "client") window.location.href = "/prototypes?screen=client";
      else if (role === "operator") window.location.href = "/prototypes?screen=work";
    });
  }

  // 4. Universal Command Palette (Cmd+K)
  var cmdBackdrop = document.getElementById("vmn-cmd-backdrop");
  var cmdInput = document.getElementById("vmn-cmd-input");
  var cmdResults = document.getElementById("vmn-cmd-results");
  var cmdCloseBtn = document.getElementById("vmn-cmd-close");
  var cmdTrigger = document.getElementById("vmn-cmd-trigger");
  var mobileCmdTrigger = document.getElementById("vmn-mobile-cmd-trigger");
  var mobileQuickJump = document.getElementById("vmn-mobile-quick-jump");

  var COMMAND_ITEMS = [
    { category: "Primary Surfaces", title: "Public Overview", url: "/", hint: "Enterprise Proposition" },
    { category: "Primary Surfaces", title: "Linear Television Channels", url: "/channels", hint: "Nigezie, Orisun, Isi Mbido" },
    { category: "Primary Surfaces", title: "Creative Economy Hub", url: "/hub", hint: "Talent, Production, Academy" },
    { category: "Primary Surfaces", title: "Operator Workstations", url: "/workspace", hint: "Broadcast & Hub Operations" },
    { category: "Primary Surfaces", title: "Broadcast Consoles Catalog", url: "/broadcast/screens", hint: "Operational Screens Catalog" },
    { category: "Primary Surfaces", title: "Broadcast Executive Dashboard", url: "/broadcast/dashboard", hint: "MCR Operations" },
    { category: "Primary Surfaces", title: "Azeebo+ Gateway", url: "/azeebo/gateway", hint: "Streaming Federation" },
    { category: "Primary Surfaces", title: "UI/UX Prototypes Viewer", url: "/prototypes", hint: "8 R1.1 Screens & Scenarios" },
    { category: "Primary Surfaces", title: "Design System Styleguide", url: "/styleguide", hint: "Canonical R1.1 Tokens" },
    { category: "Primary Surfaces", title: "API Documentation", url: "/docs", hint: "OpenAPI Specification" },

    { category: "R1.1 Critical Prototypes", title: "UX-PUB-001: Public Home", url: "/prototypes?screen=home", hint: "First-Release Screen 1" },
    { category: "R1.1 Critical Prototypes", title: "UX-PUB-004: Channel Hub & Program Guide", url: "/prototypes?screen=channel", hint: "First-Release Screen 2" },
    { category: "R1.1 Critical Prototypes", title: "UX-HUB-001: Multi-workspace Hub Workstation", url: "/prototypes?screen=work", hint: "First-Release Screen 3" },
    { category: "R1.1 Critical Prototypes", title: "UX-PRJ-002: Counterparty Sponsor Portal", url: "/prototypes?screen=client", hint: "First-Release Screen 4" },
    { category: "R1.1 Critical Prototypes", title: "UX-APP-002: AFCA Academy Application", url: "/prototypes?screen=application", hint: "First-Release Screen 5" },
    { category: "R1.1 Critical Prototypes", title: "UX-VTM-008: Talent Engagement Agreement", url: "/prototypes?screen=terms", hint: "First-Release Screen 6" },
    { category: "R1.1 Critical Prototypes", title: "UX-BR-012: Broadcast Master Schedule Review", url: "/prototypes?screen=schedule", hint: "First-Release Screen 7" },
    { category: "R1.1 Critical Prototypes", title: "UX-BR-030: Proof-of-Air Delivery Reconciliation", url: "/prototypes?screen=proof", hint: "First-Release Screen 8" },

    { category: "Simulated Operational Scenarios", title: "Scenario: Normal Operating State", url: "/prototypes?scenario=normal", hint: "All systems green" },
    { category: "Simulated Operational Scenarios", title: "Scenario: Stale Data Notice (Degraded)", url: "/prototypes?scenario=stale", hint: "Simulate feed latency" },
    { category: "Simulated Operational Scenarios", title: "Scenario: Transmission Rights Blocker", url: "/prototypes?scenario=blocked", hint: "Simulate audit hold" },
    { category: "Simulated Operational Scenarios", title: "Scenario: Network Idempotent Recovery", url: "/prototypes?scenario=recovery", hint: "Simulate retry success" }
  ];

  var selectedIndex = 0;
  var filteredItems = COMMAND_ITEMS.slice();
  var commandPaletteOpener = null;
  var commandPaletteBackground = null;

  function renderCommandResults() {
    if (!cmdResults) return;
    // AUD-02: Use DOM API instead of innerHTML to eliminate XSS sink
    while (cmdResults.firstChild) { cmdResults.removeChild(cmdResults.firstChild); }
    if (filteredItems.length === 0) {
      var empty = document.createElement('div');
      empty.style.cssText = 'padding: 24px; text-align: center; color: var(--vmn-color-text-muted);';
      empty.textContent = 'No matching destinations found.';
      cmdResults.appendChild(empty);
      return;
    }

    var currentCategory = "";
    filteredItems.forEach(function(item, idx) {
      if (item.category !== currentCategory) {
        currentCategory = item.category;
        var catDiv = document.createElement('div');
        catDiv.className = 'vmn-cmd-category';
        catDiv.textContent = currentCategory;
        cmdResults.appendChild(catDiv);
      }
      var isSelected = idx === selectedIndex;
      var a = document.createElement('a');
      a.href = item.url;  // safe: all URLs are compile-time constants from COMMAND_ITEMS
      a.className = 'vmn-cmd-item' + (isSelected ? ' selected' : '');
      a.dataset.index = String(idx);

      var inner = document.createElement('div');

      var titleDiv = document.createElement('div');
      titleDiv.style.fontWeight = '600';
      titleDiv.textContent = item.title;  // textContent — no XSS
      inner.appendChild(titleDiv);

      var hintDiv = document.createElement('div');
      hintDiv.style.cssText = 'font-size: 0.75rem; color: var(--vmn-color-text-muted);';
      hintDiv.textContent = item.hint;   // textContent — no XSS
      inner.appendChild(hintDiv);

      a.appendChild(inner);

      var urlSpan = document.createElement('span');
      urlSpan.style.cssText = 'font-size: 0.75rem; font-family: var(--vmn-font-mono); color: var(--vmn-color-text-muted);';
      urlSpan.textContent = item.url;    // textContent — no XSS
      a.appendChild(urlSpan);

      cmdResults.appendChild(a);
    });
  }

  function openCommandPalette() {
    if (!cmdBackdrop) return;
    var opener = drawer && drawer.classList.contains("open") && drawerOpener
      ? drawerOpener
      : document.activeElement;
    closeDrawer();
    commandPaletteOpener = opener;
    commandPaletteBackground = Array.from(document.body.children)
      .filter(function (element) { return element !== cmdBackdrop && element.tagName !== 'SCRIPT'; })
      .map(function (element) { return { element: element, wasInert: element.inert }; });
    commandPaletteBackground.forEach(function (state) { state.element.inert = true; });
    cmdBackdrop.inert = false;
    cmdBackdrop.setAttribute('aria-hidden', 'false');
    cmdBackdrop.classList.add("open");
    cmdBackdrop.setAttribute('role', 'dialog');
    cmdBackdrop.setAttribute('aria-modal', 'true');
    cmdBackdrop.setAttribute('aria-label', 'Command Palette');
    selectedIndex = 0;
    filteredItems = COMMAND_ITEMS.slice();
    if (cmdInput) {
      cmdInput.value = "";
      cmdInput.focus();
    }
    renderCommandResults();
  }

  function closeCommandPalette() {
    if (!cmdBackdrop) return;
    cmdBackdrop.removeAttribute('role');
    cmdBackdrop.removeAttribute('aria-modal');
    cmdBackdrop.removeAttribute('aria-label');
    cmdBackdrop.setAttribute('aria-hidden', 'true');
    cmdBackdrop.inert = true;
    cmdBackdrop.classList.remove("open");
    (commandPaletteBackground || []).forEach(function (state) { state.element.inert = state.wasInert; });
    if (commandPaletteOpener && commandPaletteOpener.focus) commandPaletteOpener.focus();
    commandPaletteOpener = null;
    commandPaletteBackground = null;
  }

  if (cmdTrigger) cmdTrigger.addEventListener("click", openCommandPalette);
  if (mobileCmdTrigger) mobileCmdTrigger.addEventListener("click", openCommandPalette);
  if (mobileQuickJump) mobileQuickJump.addEventListener("click", openCommandPalette);
  if (cmdCloseBtn) cmdCloseBtn.addEventListener("click", closeCommandPalette);

  if (cmdBackdrop) {
    cmdBackdrop.addEventListener("keydown", function (event) {
      if (event.key !== 'Tab') return;
      var focusable = Array.from(cmdBackdrop.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) { event.preventDefault(); return; }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    cmdBackdrop.addEventListener("click", function(e) {
      if (e.target === cmdBackdrop) closeCommandPalette();
    });
  }

  if (cmdInput) {
    cmdInput.addEventListener("input", function(e) {
      var query = e.target.value.toLowerCase().trim();
      if (!query) {
        filteredItems = COMMAND_ITEMS.slice();
      } else {
        filteredItems = COMMAND_ITEMS.filter(function(item) {
          return item.title.toLowerCase().indexOf(query) !== -1 ||
                 item.hint.toLowerCase().indexOf(query) !== -1 ||
                 item.url.toLowerCase().indexOf(query) !== -1 ||
                 item.category.toLowerCase().indexOf(query) !== -1;
        });
      }
      selectedIndex = 0;
      renderCommandResults();
    });

    cmdInput.addEventListener("keydown", function(e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (filteredItems.length > 0) {
          selectedIndex = (selectedIndex + 1) % filteredItems.length;
          renderCommandResults();
          ensureVisible();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (filteredItems.length > 0) {
          selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
          renderCommandResults();
          ensureVisible();
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          window.location.href = filteredItems[selectedIndex].url;
        }
      }
    });
  }

  function ensureVisible() {
    var selectedEl = cmdResults && cmdResults.querySelector(".vmn-cmd-item.selected");
    if (selectedEl && selectedEl.scrollIntoView) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }

  // Keyboard Shortcuts: Cmd+K / Ctrl+K and Escape
  window.addEventListener("keydown", function(e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (drawer && drawer.classList.contains("open")) {
        closeDrawer();
        openCommandPalette();
      } else if (cmdBackdrop && cmdBackdrop.classList.contains("open")) {
        closeCommandPalette();
      } else {
        openCommandPalette();
      }
    } else if (e.key === "Escape") {
      closeCommandPalette();
      closeDrawer();
    } else if (drawer && drawer.classList.contains("open") && e.key === "Tab") {
      var focusable = getDrawerFocusable();
      if (focusable.length === 0) { e.preventDefault(); if (drawerCloseBtn) drawerCloseBtn.focus(); return; }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        if (last) last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        if (first) first.focus();
      }
    }
  });

  // 5. Declarative Confirm & Action Delegation (AUD-04)
  document.addEventListener("click", function(e) {
    var target = e.target;
    var confirmEl = target && target.closest ? target.closest("[data-confirm]") : null;
    if (confirmEl && confirmEl.tagName !== "FORM") {
      var msg = confirmEl.getAttribute("data-confirm") || "Are you sure you want to proceed?";
      if (!confirm(msg)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, true);

  document.addEventListener("submit", function(e) {
    var target = e.target;
    var form = (target && target.tagName === "FORM") ? target : (target && target.closest ? target.closest("form") : null);
    if (form && form.hasAttribute("data-confirm")) {
      var msg = form.getAttribute("data-confirm") || "Are you sure you want to proceed?";
      if (!confirm(msg)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, true);
})();
`;
