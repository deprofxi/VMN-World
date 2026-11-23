/**
 * Client Bootstrap Bundle (AUD-04)
 * Shipped as an external, CSP-'self'-compliant static JavaScript asset (/assets/app.js).
 * Replaces inline <script> blocks and inline on* event handlers.
 */

import { COMMAND_CATEGORY_ORDER_JSON, SITE_DESTINATIONS_JSON } from "../public/site-registry.js";

/**
 * The command palette's destinations, compiled in from the registry that renders
 * the header nav (`src/web/public/site-registry.ts`).
 *
 * They are interpolated here rather than fetched: the palette cannot then hold a
 * list the nav does not, a nav entry cannot be added in one place only, and there
 * is no request to fail. `<` and U+2028/U+2029 are escaped as text so the JSON
 * cannot terminate the script or break the literal, whatever a future entry is
 * called.
 */
const PALETTE_ITEMS_JSON = SITE_DESTINATIONS_JSON
  .replace(/</g, "\\u003c")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");

/**
 * The palette's group order, compiled from the same registry. The headings are
 * rendered in this order rather than in the order the list happens to arrive, so
 * a category the registry declares appears in its declared position and a
 * destination cannot introduce a heading that has no place in the order.
 */
const PALETTE_CATEGORY_ORDER_JSON = COMMAND_CATEGORY_ORDER_JSON
  .replace(/</g, "\\u003c")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");

export const CLIENT_BOOTSTRAP_JS = `(function() {
  // 0. Mobile chrome, assembled from the navigation the document already carries
  //
  // The drawer, its backdrop and the sticky action bar used to be a second
  // hand-written copy of the header nav in every page's HTML. They are built here
  // instead, by cloning the anchors out of \`nav.vmn-nav-links\` — so a nav entry
  // added on the server appears in all three places, and no page pays for the
  // duplicate. Cloning sets textContent (never innerHTML) and copies the href
  // attribute the server already rendered.
  var headerNav = document.querySelector("nav.vmn-nav-links");
  var mobileMenuBtn = document.getElementById("vmn-mobile-menu-btn");
  var drawer = null;
  var backdrop = null;
  var drawerCloseBtn = null;

  function navAnchors() {
    return headerNav ? Array.prototype.slice.call(headerNav.querySelectorAll("a[href]")) : [];
  }

  function cloneIcon(selector, size) {
    var source = document.querySelector(selector);
    if (!source) return null;
    var svg = source.cloneNode(true);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    if (size) {
      svg.setAttribute("width", String(size));
      svg.setAttribute("height", String(size));
    }
    return svg;
  }

  // Nodes only, never innerHTML: attrs carries id/type/href/aria-* and text becomes
  // textContent, so nothing built here is an HTML sink. s-* classes are generated
  // utility tokens (src/web/styles/generated-utilities.ts); the icon buttons keep a
  // 44px target.
  function el(tag, className, text, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    for (var name in attrs || {}) node.setAttribute(name, attrs[name]);
    return node;
  }

  function buildDrawerLink(anchor) {
    var active = anchor.classList.contains("active");
    var attrs = { href: anchor.getAttribute("href") };
    if (active) attrs["aria-current"] = "page";
    return el("a", "vmn-drawer-link" + (active ? " active" : ""), anchor.textContent, attrs);
  }

  function buildDrawer() {
    var aside = el("aside", "vmn-mobile-drawer", null, {
      id: "vmn-mobile-drawer",
      "aria-label": "Mobile Navigation",
      "aria-hidden": "true"
    });
    aside.inert = true;

    var closeIcon = cloneIcon("#vmn-cmd-close svg", 20);
    var close = el("button", "btn btn-outline s-TYZl3AGPJs", closeIcon ? null : "Close", {
      id: "vmn-drawer-close",
      type: "button",
      "aria-label": "Close Navigation Drawer"
    });
    if (closeIcon) close.appendChild(closeIcon);

    var head = el("div", "vmn-drawer-header");
    head.appendChild(el("div", "s-I2zXYM0lPc", "VMN Navigation"));
    head.appendChild(close);
    aside.appendChild(head);

    var body = el("div", "vmn-drawer-body");
    navAnchors().forEach(function (anchor) { body.appendChild(buildDrawerLink(anchor)); });

    var cmdBtn = el("button", "btn btn-outline s-9jB4MKeVDu", null, {
      id: "vmn-mobile-cmd-trigger",
      type: "button"
    });
    var searchIcon = cloneIcon("#vmn-cmd-trigger svg", 16);
    if (searchIcon) cmdBtn.appendChild(searchIcon);
    cmdBtn.appendChild(el("span", null, "Command Palette (Cmd+K)"));
    var cmdWrap = el("div", "s-6KhtRR-75u");
    cmdWrap.appendChild(cmdBtn);
    body.appendChild(cmdWrap);
    aside.appendChild(body);

    var cover = el("div", "vmn-drawer-backdrop", null, {
      id: "vmn-drawer-backdrop",
      "aria-hidden": "true"
    });
    cover.inert = true;

    document.body.appendChild(cover);
    document.body.appendChild(aside);
    drawer = aside;
    backdrop = cover;
    drawerCloseBtn = close;
  }

  function buildActionBar() {
    var anchors = navAnchors();
    var byHref = {};
    anchors.forEach(function (anchor) { byHref[anchor.getAttribute("href")] = anchor; });

    var bar = el("nav", "vmn-mobile-action-bar", null, { "aria-label": "Quick Mobile Actions" });

    // Three of the destinations the nav already lists, re-used rather than
    // re-declared: the first two entries and the prototype viewer as the primary
    // action. If the nav is reordered or shortened the bar follows it.
    var picks = [
      { href: "/", variant: "btn-outline" },
      { href: "/media-and-audience-overview", variant: "btn-outline" },
      { href: "/prototypes", variant: "btn-primary" }
    ];
    picks.forEach(function (pick, index) {
      var source = byHref[pick.href] || anchors[index];
      if (!source) return;
      bar.appendChild(el("a", "btn " + pick.variant + " s-HesoKjT-3s", source.textContent, {
        href: source.getAttribute("href")
      }));
    });

    var jump = el("button", "btn btn-secondary s-CQl5S4Goep", null, {
      id: "vmn-mobile-quick-jump",
      type: "button",
      "aria-label": "Open Quick Jump"
    });
    var commandIcon = cloneIcon("#vmn-cmd-trigger kbd svg", 18);
    if (commandIcon) jump.appendChild(commandIcon);
    else jump.textContent = "Jump";
    bar.appendChild(jump);

    document.body.appendChild(bar);
  }

  if (headerNav && mobileMenuBtn && navAnchors().length) {
    buildDrawer();
    buildActionBar();
    mobileMenuBtn.setAttribute("aria-controls", "vmn-mobile-drawer");
    // The action bar reserves space at the foot of the page; that reservation is
    // scoped to this attribute so a page without scripting does not pay for
    // chrome that is not there.
    document.documentElement.setAttribute("data-mobile-chrome", "");
  }

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
  // drawer, backdrop, drawerCloseBtn and mobileMenuBtn were resolved in section 0.
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

  // 3b. Desks Mega-Menu Dropdown
  var desksTrigger = document.getElementById("vmn-desks-trigger");
  var desksMenu = document.getElementById("vmn-desks-menu");
  if (desksTrigger && desksMenu) {
    function toggleDesksMenu(e) {
      if (e) e.stopPropagation();
      var isOpen = desksMenu.classList.contains("open");
      if (isOpen) {
        closeDesksMenu();
      } else {
        openDesksMenu();
      }
    }
    function openDesksMenu() {
      desksMenu.classList.add("open");
      desksTrigger.setAttribute("aria-expanded", "true");
    }
    function closeDesksMenu() {
      desksMenu.classList.remove("open");
      desksTrigger.setAttribute("aria-expanded", "false");
    }
    desksTrigger.addEventListener("click", toggleDesksMenu);
    document.addEventListener("click", function(e) {
      if (!desksMenu.contains(e.target) && !desksTrigger.contains(e.target)) {
        closeDesksMenu();
      }
    });
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && desksMenu.classList.contains("open")) {
        closeDesksMenu();
        desksTrigger.focus();
      }
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

  // From the same registry the header nav renders (site-registry.ts): no
  // destinations of its own, so none can be retired here and not there.
  var COMMAND_ITEMS = ` + PALETTE_ITEMS_JSON + `;
  // Group order from the same registry: headings render in this order, one run per
  // category, whatever order the list arrives in. An unlisted category is kept
  // behind the declared groups rather than dropped (the registry refuses to build
  // one, so this is a floor, not a path a visitor can take).
  var COMMAND_CATEGORY_ORDER = ` + PALETTE_CATEGORY_ORDER_JSON + `;

  function orderForDisplay(items) {
    function rank(item) {
      var i = COMMAND_CATEGORY_ORDER.indexOf(item.category);
      return i === -1 ? COMMAND_CATEGORY_ORDER.length : i;
    }
    // Stable sort (ES2019), so entries keep their within-group order.
    return items.slice().sort(function(a, b) { return rank(a) - rank(b); });
  }

  var selectedIndex = 0;
  var filteredItems = orderForDisplay(COMMAND_ITEMS);
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
    filteredItems = orderForDisplay(COMMAND_ITEMS);
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
        filteredItems = orderForDisplay(COMMAND_ITEMS);
      } else {
        filteredItems = orderForDisplay(COMMAND_ITEMS.filter(function(item) {
          return item.title.toLowerCase().indexOf(query) !== -1 ||
                 item.hint.toLowerCase().indexOf(query) !== -1 ||
                 item.url.toLowerCase().indexOf(query) !== -1 ||
                 item.category.toLowerCase().indexOf(query) !== -1;
        }));
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
        return;
      }
    }

    if (form && !e.defaultPrevented) {
      form.setAttribute("aria-busy", "true");
      var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.classList.add("vmn-btn-state-loading");
        if (submitBtn.tagName === "BUTTON") {
          submitBtn.setAttribute("data-original-html", submitBtn.innerHTML);
          submitBtn.innerHTML = '<span class="vmn-btn-spinner" aria-hidden="true"></span> Processing...';
        }
      }
    }
  }, false);

  // 6. Accessible Inline Form Validation on Blur (UIUX-PRO Heuristic Standards)
  document.addEventListener("blur", function(e) {
    var input = e.target;
    if (!input || !input.tagName || (input.tagName !== "INPUT" && input.tagName !== "SELECT" && input.tagName !== "TEXTAREA")) return;
    if (input.type === "hidden" || input.type === "submit" || input.type === "button") return;

    var isRequired = input.hasAttribute("required");
    var val = (input.value || "").trim();
    var isValid = true;
    var errMsg = "";

    if (isRequired && !val) {
      isValid = false;
      errMsg = "This field is required.";
    } else if (input.type === "email" && val) {
      var emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(val)) {
        isValid = false;
        errMsg = "Please enter a valid email address.";
      }
    }

    var parent = input.closest(".form-group") || input.parentElement;
    var existingError = parent ? parent.querySelector(".vmn-input-error-msg") : null;

    if (!isValid) {
      input.setAttribute("aria-invalid", "true");
      input.classList.add("is-invalid");
      if (!existingError && parent) {
        var errSpan = document.createElement("span");
        errSpan.className = "vmn-input-error-msg";
        errSpan.textContent = errMsg;
        errSpan.setAttribute("role", "alert");
        parent.appendChild(errSpan);
      } else if (existingError) {
        existingError.textContent = errMsg;
      }
    } else {
      input.removeAttribute("aria-invalid");
      input.classList.remove("is-invalid");
      if (existingError && parent) {
        parent.removeChild(existingError);
      }
    }
  }, true);

  // 7. Segmented Control Tab Switcher (WCAG 2.2 Compliant Keyboard Navigation)
  document.addEventListener("click", function(e) {
    var btn = e.target && e.target.closest ? e.target.closest(".vmn-tab-btn") : null;
    if (!btn) return;

    var container = btn.closest(".vmn-tabs-container");
    if (!container) return;

    var targetId = btn.getAttribute("data-tab-target");
    if (!targetId) return;

    // Update buttons
    var allBtns = container.querySelectorAll(".vmn-tab-btn");
    for (var i = 0; i < allBtns.length; i++) {
      allBtns[i].classList.remove("active");
      allBtns[i].setAttribute("aria-selected", "false");
    }
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");

    // Update panes
    var allPanes = container.querySelectorAll(".vmn-tab-pane");
    for (var j = 0; j < allPanes.length; j++) {
      allPanes[j].classList.remove("active");
    }
    var targetPane = container.querySelector("#" + targetId);
    if (targetPane) {
      targetPane.classList.add("active");
    }
  });

  // Keyboard navigation for tablists
  document.addEventListener("keydown", function(e) {
    var activeTab = document.activeElement;
    if (!activeTab || !activeTab.classList || !activeTab.classList.contains("vmn-tab-btn")) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

    var nav = activeTab.closest(".vmn-tabs-nav");
    if (!nav) return;

    var tabs = Array.prototype.slice.call(nav.querySelectorAll(".vmn-tab-btn"));
    var idx = tabs.indexOf(activeTab);
    if (idx === -1) return;

    e.preventDefault();
    var nextIdx = e.key === "ArrowRight" ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
    tabs[nextIdx].focus();
    tabs[nextIdx].click();
  });

  // 8. Toast Notification Dispatcher
  var toastContainer = null;
  function getToastContainer() {
    if (!toastContainer) {
      toastContainer = document.getElementById("vmn-toast-container");
      if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "vmn-toast-container";
        toastContainer.className = "vmn-toast-container";
        toastContainer.setAttribute("aria-live", "polite");
        document.body.appendChild(toastContainer);
      }
    }
    return toastContainer;
  }

  window.vmnToast = function(msg, type) {
    type = type || "info";
    var container = getToastContainer();
    var toast = document.createElement("div");
    toast.className = "vmn-toast vmn-toast-" + type;
    toast.setAttribute("role", "status");

    var iconSpan = document.createElement("span");
    iconSpan.style.display = "inline-flex";
    iconSpan.style.alignItems = "center";
    iconSpan.textContent = type === "success" ? "[OK]" : type === "error" ? "[X]" : type === "warning" ? "[!]" : "[i]";
    iconSpan.style.fontWeight = "bold";
    if (type === "success") iconSpan.style.color = "#10b981";
    else if (type === "error") iconSpan.style.color = "#ef4444";
    else if (type === "warning") iconSpan.style.color = "#f59e0b";
    else iconSpan.style.color = "#3b82f6";

    var textSpan = document.createElement("span");
    textSpan.textContent = msg;
    textSpan.style.flex = "1";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "Dismiss notification");
    closeBtn.style.background = "transparent";
    closeBtn.style.border = "none";
    closeBtn.style.color = "#94a3b8";
    closeBtn.style.fontSize = "1.2rem";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.padding = "0 4px";
    closeBtn.onclick = function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    };

    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    setTimeout(function() {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px) scale(0.95)";
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, 4000);
  };

  document.addEventListener("click", function(e) {
    var toastTrigger = e.target && e.target.closest ? e.target.closest("[data-toast]") : null;
    if (toastTrigger) {
      var msg = toastTrigger.getAttribute("data-toast");
      var type = toastTrigger.getAttribute("data-toast-type") || "info";
      if (msg) window.vmnToast(msg, type);
    }
  });

  // 9. Contextual Inspector Drawer
  var inspectorBackdrop = null;
  var inspectorDrawer = null;
  var inspectorTitleEl = null;
  var inspectorBodyEl = null;
  var inspectorOpener = null;

  function ensureInspector() {
    inspectorBackdrop = document.getElementById("vmn-inspector-backdrop");
    inspectorDrawer = document.getElementById("vmn-inspector-drawer");
    if (!inspectorBackdrop) {
      inspectorBackdrop = document.createElement("div");
      inspectorBackdrop.id = "vmn-inspector-backdrop";
      inspectorBackdrop.className = "vmn-inspector-backdrop";
      inspectorBackdrop.setAttribute("aria-hidden", "true");
      document.body.appendChild(inspectorBackdrop);
    }
    if (!inspectorDrawer) {
      inspectorDrawer = document.createElement("aside");
      inspectorDrawer.id = "vmn-inspector-drawer";
      inspectorDrawer.className = "vmn-inspector-drawer";
      inspectorDrawer.setAttribute("aria-label", "Contextual Inspector");
      inspectorDrawer.setAttribute("aria-hidden", "true");
      inspectorDrawer.inert = true;

      var hdr = document.createElement("div");
      hdr.className = "vmn-inspector-header";

      inspectorTitleEl = document.createElement("h3");
      inspectorTitleEl.className = "vmn-inspector-title";
      inspectorTitleEl.textContent = "Inspector";

      var closeBtn = document.createElement("button");
      closeBtn.className = "vmn-inspector-close";
      closeBtn.type = "button";
      closeBtn.textContent = "Close ✕";
      closeBtn.setAttribute("aria-label", "Close Inspector");
      closeBtn.onclick = closeInspector;

      hdr.appendChild(inspectorTitleEl);
      hdr.appendChild(closeBtn);

      inspectorBodyEl = document.createElement("div");
      inspectorBodyEl.className = "vmn-inspector-body";

      var ftr = document.createElement("div");
      ftr.className = "vmn-inspector-footer";
      var ftrBtn = document.createElement("button");
      ftrBtn.className = "btn btn-outline";
      ftrBtn.type = "button";
      ftrBtn.textContent = "Dismiss";
      ftrBtn.onclick = closeInspector;
      ftr.appendChild(ftrBtn);

      inspectorDrawer.appendChild(hdr);
      inspectorDrawer.appendChild(inspectorBodyEl);
      inspectorDrawer.appendChild(ftr);
      document.body.appendChild(inspectorDrawer);
    } else {
      inspectorTitleEl = inspectorDrawer.querySelector(".vmn-inspector-title");
      inspectorBodyEl = inspectorDrawer.querySelector(".vmn-inspector-body");
    }
    inspectorBackdrop.onclick = closeInspector;
  }

  function openInspector(title, fields) {
    ensureInspector();
    inspectorOpener = document.activeElement;
    if (inspectorTitleEl) inspectorTitleEl.textContent = title || "Operational Object";
    if (inspectorBodyEl) {
      inspectorBodyEl.textContent = "";
      for (var key in fields) {
        if (!Object.prototype.hasOwnProperty.call(fields, key)) continue;
        var fieldDiv = document.createElement("div");
        fieldDiv.className = "vmn-inspector-field";

        var lbl = document.createElement("span");
        lbl.className = "vmn-inspector-label";
        lbl.textContent = key.replace(/([A-Z])/g, " $1").toUpperCase();

        var val = document.createElement("div");
        val.className = typeof fields[key] === "object" || key.toLowerCase().indexOf("id") !== -1 || key.toLowerCase().indexOf("code") !== -1 ? "vmn-inspector-val-mono" : "vmn-inspector-val";
        val.textContent = typeof fields[key] === "object" ? JSON.stringify(fields[key], null, 2) : String(fields[key]);

        fieldDiv.appendChild(lbl);
        fieldDiv.appendChild(val);
        inspectorBodyEl.appendChild(fieldDiv);
      }
    }
    inspectorBackdrop.classList.add("active");
    inspectorBackdrop.setAttribute("aria-hidden", "false");
    inspectorDrawer.classList.add("active");
    inspectorDrawer.setAttribute("aria-hidden", "false");
    inspectorDrawer.inert = false;
    var closeBtn = inspectorDrawer.querySelector(".vmn-inspector-close");
    if (closeBtn) closeBtn.focus();
  }

  function closeInspector() {
    if (!inspectorDrawer || !inspectorDrawer.classList.contains("active")) return;
    inspectorDrawer.classList.remove("active");
    inspectorDrawer.setAttribute("aria-hidden", "true");
    inspectorDrawer.inert = true;
    if (inspectorBackdrop) {
      inspectorBackdrop.classList.remove("active");
      inspectorBackdrop.setAttribute("aria-hidden", "true");
    }
    if (inspectorOpener && inspectorOpener.focus) inspectorOpener.focus();
    inspectorOpener = null;
  }

  document.addEventListener("click", function(e) {
    var trigger = e.target && e.target.closest ? e.target.closest("[data-inspect-title]") : null;
    if (trigger) {
      e.preventDefault();
      var title = trigger.getAttribute("data-inspect-title");
      var fieldsJson = trigger.getAttribute("data-inspect-json");
      var fields = {};
      if (fieldsJson) {
        try { fields = JSON.parse(fieldsJson); } catch (err) { fields = { Details: fieldsJson }; }
      } else {
        for (var i = 0; i < trigger.attributes.length; i++) {
          var attr = trigger.attributes[i];
          if (attr.name.indexOf("data-field-") === 0) {
            var fieldName = attr.name.substring(11);
            fields[fieldName] = attr.value;
          }
        }
        if (Object.keys(fields).length === 0) {
          fields = { Object: title, Status: "Active / Verified", Authority: "CCPP-001" };
        }
      }
      openInspector(title, fields);
    }
  });

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && inspectorDrawer && inspectorDrawer.classList.contains("active")) {
      closeInspector();
    }
  });

  // 10. Live Audio VU Meter Dynamic Simulation
  var vuMeters = Array.prototype.slice.call(document.querySelectorAll(".vmn-vu-meter"));
  if (vuMeters.length > 0 && !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    setInterval(function() {
      for (var m = 0; m < vuMeters.length; m++) {
        var bars = vuMeters[m].querySelectorAll(".vmn-vu-bar");
        for (var b = 0; b < bars.length; b++) {
          var pct = Math.floor(25 + Math.random() * 70);
          bars[b].style.height = pct + "%";
        }
      }
    }, 450);
  }

  // 11. Multi-Step Wizard Controller (SaaS Steppers)
  document.addEventListener("click", function(e) {
    var nextBtn = e.target && e.target.closest ? e.target.closest(".vmn-step-next") : null;
    var prevBtn = e.target && e.target.closest ? e.target.closest(".vmn-step-prev") : null;

    if (nextBtn) {
      e.preventDefault();
      var container = nextBtn.closest(".vmn-stepper-container");
      if (!container) return;
      var activePane = container.querySelector(".vmn-step-pane.active");
      if (!activePane) return;

      var requiredInputs = Array.prototype.slice.call(activePane.querySelectorAll("input[required], select[required], textarea[required]"));
      var allValid = true;
      for (var i = 0; i < requiredInputs.length; i++) {
        var inp = requiredInputs[i];
        if (!inp.value || !inp.value.trim()) {
          inp.setAttribute("aria-invalid", "true");
          inp.classList.add("is-invalid");
          allValid = false;
        } else {
          inp.removeAttribute("aria-invalid");
          inp.classList.remove("is-invalid");
        }
      }
      if (!allValid) {
        if (window.vmnToast) window.vmnToast("Please complete required fields before proceeding", "warning");
        return;
      }

      var currentStep = parseInt(activePane.getAttribute("data-step") || "1", 10);
      var nextPane = container.querySelector('.vmn-step-pane[data-step="' + (currentStep + 1) + '"]');
      if (nextPane) {
        activePane.classList.remove("active");
        nextPane.classList.add("active");

        var navItems = container.querySelectorAll(".vmn-step-item");
        for (var j = 0; j < navItems.length; j++) {
          var stepNum = parseInt(navItems[j].getAttribute("data-step") || "1", 10);
          if (stepNum < currentStep + 1) {
            navItems[j].classList.add("completed");
            navItems[j].classList.remove("active");
          } else if (stepNum === currentStep + 1) {
            navItems[j].classList.add("active");
            navItems[j].classList.remove("completed");
          } else {
            navItems[j].classList.remove("active");
            navItems[j].classList.remove("completed");
          }
        }

        var progress = container.querySelector(".vmn-stepper-progress");
        if (progress && navItems.length > 1) {
          progress.style.width = ((currentStep / (navItems.length - 1)) * 100) + "%";
        }
      }
    } else if (prevBtn) {
      e.preventDefault();
      var pContainer = prevBtn.closest(".vmn-stepper-container");
      if (!pContainer) return;
      var pActivePane = pContainer.querySelector(".vmn-step-pane.active");
      if (!pActivePane) return;

      var pCurrentStep = parseInt(pActivePane.getAttribute("data-step") || "1", 10);
      var pPrevPane = pContainer.querySelector('.vmn-step-pane[data-step="' + (pCurrentStep - 1) + '"]');
      if (pPrevPane) {
        pActivePane.classList.remove("active");
        pPrevPane.classList.add("active");

        var pNavItems = pContainer.querySelectorAll(".vmn-step-item");
        for (var k = 0; k < pNavItems.length; k++) {
          var pStepNum = parseInt(pNavItems[k].getAttribute("data-step") || "1", 10);
          if (pStepNum < pCurrentStep - 1) {
            pNavItems[k].classList.add("completed");
            pNavItems[k].classList.remove("active");
          } else if (pStepNum === pCurrentStep - 1) {
            pNavItems[k].classList.add("active");
            pNavItems[k].classList.remove("completed");
          } else {
            pNavItems[k].classList.remove("active");
            pNavItems[k].classList.remove("completed");
          }
        }

        var pProgress = pContainer.querySelector(".vmn-stepper-progress");
        if (pProgress && pNavItems.length > 1) {
          pProgress.style.width = (((pCurrentStep - 2) / (pNavItems.length - 1)) * 100) + "%";
        }
      }
    }
  });

  // 12. Accessible Accordion Controller
  document.addEventListener("click", function(e) {
    var trigger = e.target && e.target.closest ? e.target.closest(".vmn-accordion-trigger") : null;
    if (trigger) {
      var item = trigger.closest(".vmn-accordion-item");
      if (item) {
        var isOpen = item.classList.contains("open");
        if (isOpen) {
          item.classList.remove("open");
          trigger.setAttribute("aria-expanded", "false");
        } else {
          item.classList.add("open");
          trigger.setAttribute("aria-expanded", "true");
        }
      }
    }
  });

  // 14. Multi-Channel Broadcast Player Interactive Switcher
  document.addEventListener("click", function(e) {
    var tab = e.target && e.target.closest ? e.target.closest(".vmn-player-tab") : null;
    if (!tab) return;
    var ch = tab.getAttribute("data-channel");
    var title = tab.getAttribute("data-title");
    var genre = tab.getAttribute("data-genre");
    var accent = tab.getAttribute("data-accent");

    var allTabs = document.querySelectorAll(".vmn-player-tab");
    for (var i = 0; i < allTabs.length; i++) {
      allTabs[i].classList.remove("active");
      allTabs[i].classList.add("btn-ghost");
      allTabs[i].style.background = "transparent";
      allTabs[i].style.color = "#94a3b8";
    }
    tab.classList.add("active");
    tab.classList.remove("btn-ghost");
    tab.style.background = accent || "var(--vmn-color-channel-nxtr)";
    tab.style.color = "#ffffff";

    var titleEl = document.getElementById("vmn-player-title");
    var genreEl = document.getElementById("vmn-player-genre");
    var tagEl = document.getElementById("vmn-player-ch-tag");
    if (titleEl && title) titleEl.textContent = title;
    if (genreEl && genre) genreEl.textContent = genre + " • Live On-Air Simulcast";
    if (tagEl && ch) tagEl.textContent = "CH: " + ch;

    showToast("Live stream carrier connected to " + (ch || "Channel"), "info");
  });

  // 15. Advertising Campaign Rate & Reach Calculator
  function updateAdCalculator() {
    var chSelect = document.getElementById("ad-channel-select");
    var dpSelect = document.getElementById("ad-daypart-select");
    var durSelect = document.getElementById("ad-duration-select");
    var slider = document.getElementById("ad-spots-slider");
    var spotsLabel = document.getElementById("ad-spots-label");
    var impDisplay = document.getElementById("ad-calc-impressions");
    var totalDisplay = document.getElementById("ad-calc-total");
    var ctaLink = document.getElementById("ad-calc-cta");

    if (!chSelect || !dpSelect || !durSelect || !slider) return;

    var spots = parseInt(slider.value, 10) || 10;
    if (spotsLabel) spotsLabel.textContent = spots + (spots === 1 ? " Spot" : " Spots");

    var chOpt = chSelect.options[chSelect.selectedIndex];
    var dpOpt = dpSelect.options[dpSelect.selectedIndex];
    var durOpt = durSelect.options[durSelect.selectedIndex];

    var chMult = parseFloat(chOpt ? chOpt.getAttribute("data-mult") || "1.0" : "1.0");
    var baseRate = parseFloat(dpOpt ? dpOpt.getAttribute("data-rate") || "180000" : "180000");
    var baseReach = parseFloat(dpOpt ? dpOpt.getAttribute("data-reach") || "450000" : "450000");
    var durMult = parseFloat(durOpt ? durOpt.getAttribute("data-dur-mult") || "1.0" : "1.0");

    var totalCost = Math.round(spots * baseRate * chMult * durMult);
    var totalImpressions = Math.round(spots * baseReach * (chMult > 1 ? 1.8 : 1.0));

    if (impDisplay) {
      impDisplay.textContent = (totalImpressions >= 1000000 ? (totalImpressions / 1000000).toFixed(1) + "M" : (totalImpressions / 1000).toFixed(0) + "K") + " HH";
    }
    if (totalDisplay) {
      totalDisplay.textContent = "₦" + totalCost.toLocaleString("en-NG") + " NGN";
    }
    if (ctaLink) {
      var chCode = chSelect.value;
      ctaLink.href = "/contact?vertical=COMMERCIAL_ADVERTISING&channel=" + encodeURIComponent(chCode) + "&spots=" + spots + "&est=" + totalCost;
    }
  }

  ["ad-channel-select", "ad-daypart-select", "ad-duration-select", "ad-spots-slider"].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", updateAdCalculator);
      el.addEventListener("change", updateAdCalculator);
    }
  });

  // 16. VCF Content Fund Waterfall Calculator
  var vcfSlider = document.getElementById("vcf-revenue-slider");
  if (vcfSlider) {
    vcfSlider.addEventListener("input", function() {
      var gross = parseFloat(vcfSlider.value) || 50000000;
      var grossDisplay = document.getElementById("vcf-gross-display");
      if (grossDisplay) grossDisplay.textContent = "₦" + gross.toLocaleString("en-NG") + " NGN";

      // 4-Tier Recoupment: P1 = senior debt up to 20m, P2 = lead equity up to 15m, remainder split 50/50 P3/P4
      var p1 = Math.min(gross, 20000000);
      var rem1 = Math.max(0, gross - p1);
      var p2 = Math.min(rem1, 15000000);
      var rem2 = Math.max(0, rem1 - p2);
      var p3 = Math.round(rem2 * 0.5);
      var p4 = rem2 - p3;

      var p1El = document.getElementById("vcf-p1-amt");
      var p2El = document.getElementById("vcf-p2-amt");
      var p3El = document.getElementById("vcf-p3-amt");
      var p4El = document.getElementById("vcf-p4-amt");

      if (p1El) p1El.textContent = "₦" + p1.toLocaleString("en-NG") + " NGN" + (p1 >= 20000000 ? " (100% Recouped)" : "");
      if (p2El) p2El.textContent = "₦" + p2.toLocaleString("en-NG") + " NGN" + (p2 >= 15000000 ? " (100% Recouped)" : "");
      if (p3El) p3El.textContent = "₦" + p3.toLocaleString("en-NG") + " NGN (50% of Net)";
      if (p4El) p4El.textContent = "₦" + p4.toLocaleString("en-NG") + " NGN (50% of Net)";
    });
  }

  // 17. VTM Engagement Budget & Escrow Calculator
  var vtmSlider = document.getElementById("vtm-budget-slider");
  if (vtmSlider) {
    vtmSlider.addEventListener("input", function() {
      var budget = parseFloat(vtmSlider.value) || 2500000;
      var budgetLabel = document.getElementById("vtm-budget-label");
      if (budgetLabel) budgetLabel.textContent = "₦" + budget.toLocaleString("en-NG") + " NGN";

      var m1 = Math.round(budget * 0.3);
      var m2 = Math.round(budget * 0.4);
      var m3 = budget - m1 - m2;

      var m1El = document.getElementById("vtm-m1-amt");
      var m2El = document.getElementById("vtm-m2-amt");
      var m3El = document.getElementById("vtm-m3-amt");

      if (m1El) m1El.textContent = "₦" + m1.toLocaleString("en-NG") + " NGN";
      if (m2El) m2El.textContent = "₦" + m2.toLocaleString("en-NG") + " NGN";
      if (m3El) m3El.textContent = "₦" + m3.toLocaleString("en-NG") + " NGN";
    });
  }

  // 18. AFCA Tuition & Grant Estimator
  function updateAfcaTuition() {
    var lvl = document.getElementById("afca-level-select");
    var grt = document.getElementById("afca-grant-select");
    var totalEl = document.getElementById("afca-est-total");
    if (!lvl || !grt || !totalEl) return;

    var base = 480000 * parseFloat(lvl.value || "1.0");
    var discount = parseFloat(grt.value || "0");
    var finalFee = Math.round(base * (1 - discount));
    totalEl.textContent = "₦" + finalFee.toLocaleString("en-NG") + " NGN";
  }

  var afcaLvl = document.getElementById("afca-level-select");
  var afcaGrt = document.getElementById("afca-grant-select");
  if (afcaLvl) afcaLvl.addEventListener("change", updateAfcaTuition);
  if (afcaGrt) afcaGrt.addEventListener("change", updateAfcaTuition);

  // 19. AFCA Course Discipline Filter
  document.addEventListener("click", function(e) {
    var tab = e.target && e.target.closest ? e.target.closest(".vmn-course-tab") : null;
    if (!tab) return;
    var cat = tab.getAttribute("data-category");
    var tabs = document.querySelectorAll(".vmn-course-tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove("active", "btn-primary");
      tabs[i].classList.add("btn-outline");
      tabs[i].setAttribute("aria-selected", "false");
    }
    tab.classList.add("active", "btn-primary");
    tab.classList.remove("btn-outline");
    tab.setAttribute("aria-selected", "true");

    var cards = document.querySelectorAll(".vmn-course-card");
    for (var j = 0; j < cards.length; j++) {
      var cardCat = cards[j].getAttribute("data-cat");
      if (cat === "ALL" || cardCat === cat) {
        cards[j].style.display = "";
      } else {
        cards[j].style.display = "none";
      }
    }
  });

  // 20. ONE Studios Stage / Equipment Brief Prefiller
  document.addEventListener("click", function(e) {
    var btn = e.target && e.target.closest ? e.target.closest(".vmn-select-stage") : null;
    if (!btn) return;
    var stageName = btn.getAttribute("data-stage-name");
    var msgInput = document.getElementById("enquiry-msg-ONE_STUDIOS");
    if (msgInput && stageName) {
      msgInput.value = "Requesting production facility booking quote for: " + stageName + ". Preferred dates: ";
      msgInput.focus();
      var formEl = document.getElementById("inquiry-form");
      if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
      showToast("Selected " + stageName + " added to inquiry brief", "success");
    }
  });

  // 21. Fusion Events Ticket Counter & Total Recalculator
  var ticketCounts = { ga: 1, del: 0, vip: 0 };
  var ticketPrices = { ga: 15000, del: 45000, vip: 95000 };

  document.addEventListener("click", function(e) {
    var btn = e.target && e.target.closest ? e.target.closest(".vmn-ticket-btn") : null;
    if (!btn) return;
    var type = btn.getAttribute("data-type");
    var delta = parseInt(btn.getAttribute("data-delta") || "0", 10);
    if (!type || delta === 0) return;

    ticketCounts[type] = Math.max(0, (ticketCounts[type] || 0) + delta);
    var labelEl = document.getElementById("vmn-" + type + "-qty");
    if (labelEl) labelEl.textContent = String(ticketCounts[type]);

    var total = (ticketCounts.ga * ticketPrices.ga) + (ticketCounts.del * ticketPrices.del) + (ticketCounts.vip * ticketPrices.vip);
    var totalEl = document.getElementById("vmn-events-total");
    if (totalEl) totalEl.textContent = "₦" + total.toLocaleString("en-NG") + " NGN";
  });

  // 22. Dynamic Brand Identity & Logo Upload Controller
  var stagedLogoData = null;
  var logoModalBackdrop = document.getElementById("vmn-logo-modal-backdrop");
  var logoCloseBtn = document.getElementById("vmn-logo-modal-close");
  var logoFileInput = document.getElementById("vmn-logo-file-input");
  var logoDropzone = document.getElementById("vmn-logo-dropzone");
  var logoSaveBtn = document.getElementById("vmn-logo-save-btn");
  var logoResetBtn = document.getElementById("vmn-logo-reset-btn");
  var modalPreviewImg = document.getElementById("vmn-modal-preview-img");
  var modalPreviewBadge = document.getElementById("vmn-modal-preview-badge");

  function initLogoModalElements() {
    logoModalBackdrop = document.getElementById("vmn-logo-modal-backdrop");
    logoCloseBtn = document.getElementById("vmn-logo-modal-close");
    logoFileInput = document.getElementById("vmn-logo-file-input");
    logoDropzone = document.getElementById("vmn-logo-dropzone");
    logoSaveBtn = document.getElementById("vmn-logo-save-btn");
    logoResetBtn = document.getElementById("vmn-logo-reset-btn");
    modalPreviewImg = document.getElementById("vmn-modal-preview-img");
    modalPreviewBadge = document.getElementById("vmn-modal-preview-badge");
  }

  function ensureLogoModal() {
    initLogoModalElements();
    if (!logoModalBackdrop) {
      var wrap = document.createElement("div");
      wrap.id = "vmn-logo-modal-backdrop";
      wrap.className = "vmn-cmd-backdrop";
      wrap.setAttribute("aria-hidden", "true");
      wrap.setAttribute("role", "dialog");
      wrap.setAttribute("aria-modal", "true");
      wrap.setAttribute("aria-labelledby", "vmn-logo-modal-title");
      wrap.inert = true;
      wrap.innerHTML = '<div class="vmn-cmd-dialog s-rLSLTpgKHW">' +
        '<div class="vmn-cmd-header s-OjCqauttGI">' +
          '<div class="flex items-center gap-2">' +
            '<h2 id="vmn-logo-modal-title" class="text-base font-bold m-0 text-slate-100">Brand Logo Customizer</h2>' +
          '</div>' +
          '<button id="vmn-logo-modal-close" class="btn btn-outline btn-sm s-VbKZbMI6uZ" aria-label="Close Logo Settings" type="button">✕</button>' +
        '</div>' +
        '<div class="p-4 space-y-4 text-xs">' +
          '<p class="text-muted m-0">Upload your custom brand or partner network logo (SVG, PNG, WebP) to dynamically update the navigation header and footer.</p>' +
          '<div id="vmn-logo-dropzone" class="p-6 text-center rounded border-2 border-dashed border-muted/30 hover:border-primary/50 cursor-pointer s-Z0ZFej8dAw">' +
            '<input class="s-a5nei2lv47" type="file" id="vmn-logo-file-input" accept="image/svg+xml,image/png,image/webp,image/jpeg" />' +
            '<div class="font-bold text-slate-200 mb-1">Click to select or drag logo image here</div>' +
            '<div class="text-muted">Supports SVG, PNG, WebP (Max 2MB)</div>' +
          '</div>' +
          '<div class="p-3 rounded bg-surface border border-muted/20">' +
            '<div class="text-muted font-bold mb-2">Live Navbar Preview:</div>' +
            '<div class="p-3 rounded flex items-center justify-between s-tmnHIRH2hB">' +
              '<div class="flex items-center gap-3">' +
                '<img class="s-bZOprOFzec" id="vmn-modal-preview-img" src="" alt="Logo Preview" />' +
                '<span id="vmn-modal-preview-badge" class="vmn-brand-logo font-bold">VMNL</span>' +
                '<div>' +
                  '<div class="font-bold text-slate-200">Virtual Media Network</div>' +
                  '<div class="text-muted s-w-nYELGMpQ">Active Custom Logo Preview</div>' +
                '</div>' +
              '</div>' +
              '<span class="vmn-badge badge-ready text-xs">PREVIEW</span>' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center justify-between pt-2">' +
            '<button id="vmn-logo-reset-btn" type="button" class="btn btn-outline btn-sm text-warning">Reset to Default Badge</button>' +
            '<button id="vmn-logo-save-btn" type="button" class="btn btn-primary btn-sm">Apply &amp; Save Logo</button>' +
          '</div>' +
        '</div>' +
      '</div>';
      document.body.appendChild(wrap);
      initLogoModalElements();
      bindLogoModalEvents();
    }
    return logoModalBackdrop;
  }

  function applyLogoToDom(dataUrl) {
    var headerImg = document.getElementById("vmn-header-logo-img");
    var headerBadge = document.getElementById("vmn-header-logo-badge");
    var footerImg = document.getElementById("vmn-footer-logo-img");
    var footerBadge = document.getElementById("vmn-footer-logo-badge");

    if (dataUrl) {
      if (headerImg) { headerImg.src = dataUrl; headerImg.style.display = "inline-block"; }
      if (headerBadge) { headerBadge.style.display = "none"; }
      if (footerImg) { footerImg.src = dataUrl; footerImg.style.display = "inline-block"; }
      if (footerBadge) { footerBadge.style.display = "none"; }
    } else {
      if (headerImg) { headerImg.src = ""; headerImg.style.display = "none"; }
      if (headerBadge) { headerBadge.style.display = ""; }
      if (footerImg) { footerImg.src = ""; footerImg.style.display = "none"; }
      if (footerBadge) { footerBadge.style.display = ""; }
    }
  }

  // Restore stored logo on DOM load
  try {
    var savedLogo = localStorage.getItem("vmn-custom-logo");
    if (savedLogo) {
      applyLogoToDom(savedLogo);
    }
  } catch (err) {}

  function openLogoModal() {
    ensureLogoModal();
    if (!logoModalBackdrop) return;
    logoModalBackdrop.inert = false;
    logoModalBackdrop.setAttribute("aria-hidden", "false");
    logoModalBackdrop.classList.add("open");

    // Load current logo into modal preview
    var currentLogo = null;
    try { currentLogo = localStorage.getItem("vmn-custom-logo"); } catch (e) {}
    if (currentLogo && modalPreviewImg && modalPreviewBadge) {
      modalPreviewImg.src = currentLogo;
      modalPreviewImg.style.display = "inline-block";
      modalPreviewBadge.style.display = "none";
      stagedLogoData = currentLogo;
    }

    if (logoCloseBtn) logoCloseBtn.focus();
  }

  function closeLogoModal() {
    if (!logoModalBackdrop) return;
    logoModalBackdrop.classList.remove("open");
    logoModalBackdrop.setAttribute("aria-hidden", "true");
    logoModalBackdrop.inert = true;
  }

  function bindLogoModalEvents() {
    if (logoDropzone && logoFileInput) {
      logoDropzone.onclick = function() { logoFileInput.click(); };
      logoDropzone.ondragover = function(e) {
        e.preventDefault();
        logoDropzone.style.borderColor = "var(--vmn-color-primary, #38bdf8)";
      };
      logoDropzone.ondragleave = function() {
        logoDropzone.style.borderColor = "";
      };
      logoDropzone.ondrop = function(e) {
        e.preventDefault();
        logoDropzone.style.borderColor = "";
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleLogoFile(e.dataTransfer.files[0]);
        }
      };
      logoFileInput.onchange = function() {
        if (logoFileInput.files && logoFileInput.files[0]) {
          handleLogoFile(logoFileInput.files[0]);
        }
      };
    }

    if (logoSaveBtn) {
      logoSaveBtn.onclick = function() {
        if (!stagedLogoData) {
          showToast("Please choose or drop an image first.", "error");
          return;
        }
        try { localStorage.setItem("vmn-custom-logo", stagedLogoData); } catch (e) {}
        applyLogoToDom(stagedLogoData);
        try {
          fetch("/api/v1/branding/logo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ logoDataUrl: stagedLogoData }),
          }).catch(function() {});
        } catch (err) {}
        showToast("Custom brand logo applied successfully across all headers & footers.", "success");
        closeLogoModal();
      };
    }

    if (logoResetBtn) {
      logoResetBtn.onclick = function() {
        try { localStorage.removeItem("vmn-custom-logo"); } catch (e) {}
        stagedLogoData = null;
        if (modalPreviewImg && modalPreviewBadge) {
          modalPreviewImg.src = "";
          modalPreviewImg.style.display = "none";
          modalPreviewBadge.style.display = "";
        }
        applyLogoToDom(null);
        try { fetch("/api/v1/branding/logo", { method: "DELETE" }).catch(function() {}); } catch (err) {}
        showToast("Logo reset to default VMNL badge.", "info");
        closeLogoModal();
      };
    }
  }

  // Initial event binding if modal is SSR rendered
  bindLogoModalEvents();

  document.addEventListener("click", function(e) {
    var trigger = e.target && e.target.closest ? e.target.closest("#vmn-logo-modal-trigger, #vmn-footer-logo-trigger") : null;
    if (trigger) {
      e.preventDefault();
      openLogoModal();
      return;
    }
    if (e.target && e.target.closest && e.target.closest("#vmn-logo-modal-close")) {
      e.preventDefault();
      closeLogoModal();
      return;
    }
    if (e.target === logoModalBackdrop) {
      closeLogoModal();
    }
  });

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && logoModalBackdrop && logoModalBackdrop.classList.contains("open")) {
      closeLogoModal();
    }
  });

  function handleLogoFile(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Logo file exceeds 2MB maximum limit.", "error");
      return;
    }

    var reader = new FileReader();
    reader.onload = function(evt) {
      var dataUrl = evt.target && evt.target.result;
      if (typeof dataUrl === "string") {
        stagedLogoData = dataUrl;
        if (modalPreviewImg && modalPreviewBadge) {
          modalPreviewImg.src = dataUrl;
          modalPreviewImg.style.display = "inline-block";
          modalPreviewBadge.style.display = "none";
        }
        showToast("Logo loaded into preview. Click 'Apply & Save' to publish.", "info");
      }
    };
    reader.readAsDataURL(file);
  }
})();

`;
