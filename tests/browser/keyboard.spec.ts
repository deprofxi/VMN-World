/**
 * Keyboard path and focus restoration — PR-26 / TSK-45.
 *
 * WCAG 2.2 AA is mostly about keyboard operation (2.1.1 keyboard, 2.4.1 bypass
 * blocks, 2.4.3 focus order, 2.4.7 focus visible, 2.4.11 focus not obscured), and
 * none of those can be measured from an HTML string. These are the checks the
 * register asked for by name ("keyboard-path and focus-restoration tests").
 *
 * The task register currently records manual WCAG §7.5 coverage as NOT_RUN and
 * `HD-09` is open: this suite is automated keyboard coverage, and it does not
 * stand in for that manual review.
 */

import { test, expect } from "@playwright/test";

test.describe("keyboard path", () => {
  test("the skip link is the first tab stop and moves focus into the main region", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    await page.keyboard.press("Tab");
    const firstStop = await page.evaluate(() => document.activeElement?.className ?? "");
    expect(firstStop, "the first tab stop must be the skip link (SC 2.4.1 bypass blocks)").toContain(
      "skip-to-content"
    );

    await page.keyboard.press("Enter");
    // Activating the skip link moves the sequential focus navigation start point
    // into <main>; the next Tab therefore lands inside the main region rather
    // than back at the top of the document.
    await page.keyboard.press("Tab");
    const insideMain = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? Boolean(active.closest("#main-content")) : false;
    });
    expect(insideMain, "focus must continue inside #main-content after the skip link is used").toBe(true);
  });

  test("shows a visible focus indicator on the active navigation link", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    // Focus the active nav link directly, then assert a real outline: SC 2.4.7
    // fails when the indicator is only a colour change or is absent altogether.
    const outline = await page.evaluate(() => {
      const link = document.querySelector('nav.vmn-nav-links a.active') as HTMLElement | null;
      if (!link) return null;
      link.focus();
      const computed = getComputedStyle(link);
      return { width: computed.outlineWidth, style: computed.outlineStyle, color: computed.outlineColor };
    });

    expect(outline, "the active navigation link must exist").not.toBeNull();
    expect(outline!.style, "a focus indicator must not be outline:none").not.toBe("none");
    expect(parseFloat(outline!.width), "the focus indicator must be visible").toBeGreaterThan(0);
  });

  test("opens the command palette from the keyboard, traps focus, and restores it on Escape", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });

    // Establish an opener so restoration has a target that is not <body>.
    const trigger = page.locator('nav.vmn-nav-links a[href="/channels"]');
    await trigger.focus();
    const openerIsFocused = await page.evaluate(
      () => document.activeElement?.getAttribute("href") ?? ""
    );
    expect(openerIsFocused).toBe("/channels");

    await page.keyboard.press("ControlOrMeta+k");
    const palette = page.locator("#vmn-cmd-backdrop");
    await expect(palette).toHaveClass(/open/);
    await expect(palette).toHaveAttribute("role", "dialog");
    await expect(palette).toHaveAttribute("aria-modal", "true");
    await expect(palette).toHaveAttribute("aria-hidden", "false");

    // The modal contains focus: the background is inert and the input owns focus.
    const state = await page.evaluate(() => {
      const backdrop = document.getElementById("vmn-cmd-backdrop")!;
      const main = document.getElementById("main-content") as HTMLElement | null;
      return {
        focusInInput: document.activeElement?.id === "vmn-cmd-input",
        backgroundInert: Boolean(main?.inert),
        backdropInert: backdrop.inert,
      };
    });
    expect(state.focusInInput, "focus must move into the palette").toBe(true);
    expect(state.backgroundInert, "the page behind a modal must be inert").toBe(true);
    expect(state.backdropInert, "an open palette must not be inert").toBe(false);

    // Focus is trapped: tabbing past the last control cycles to the first.
    const focusables = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll(
          '#vmn-cmd-backdrop a[href], #vmn-cmd-backdrop button:not([disabled]), #vmn-cmd-backdrop input:not([disabled]), #vmn-cmd-backdrop [tabindex]:not([tabindex="-1"])'
        )
      ).map((element) => element.id || element.tagName.toLowerCase())
    );
    expect(focusables.length).toBeGreaterThan(1);
    await page.evaluate(() => {
      const all = document.querySelectorAll(
        '#vmn-cmd-backdrop a[href], #vmn-cmd-backdrop button:not([disabled]), #vmn-cmd-backdrop input:not([disabled]), #vmn-cmd-backdrop [tabindex]:not([tabindex="-1"])'
      );
      (all[all.length - 1] as HTMLElement).focus();
    });
    await page.keyboard.press("Tab");
    const stayedInside = await page.evaluate(() =>
      Boolean(document.activeElement?.closest("#vmn-cmd-backdrop"))
    );
    expect(stayedInside, "Tab must not escape the dialog (focus trap)").toBe(true);

    // Escape closes and returns focus to the element that opened it (SC 2.4.3).
    await page.keyboard.press("Escape");
    await expect(palette).not.toHaveClass(/open/);
    await expect(palette).toHaveAttribute("aria-hidden", "true");
    const restored = await page.evaluate(() => ({
      href: document.activeElement?.getAttribute("href") ?? "",
      backgroundInert: Boolean((document.getElementById("main-content") as HTMLElement | null)?.inert),
    }));
    expect(restored.backgroundInert, "closing the modal must restore the page").toBe(false);
    expect(restored.href, "focus must return to the element that opened the palette").toBe("/channels");
  });

  test("keeps the closed command palette out of the tab order", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    // The palette's input and close button exist in the markup at all times; when
    // closed they must not be reachable. Markup alone cannot prove this.
    const tabbed = await page.evaluate(() => {
      const backdrop = document.getElementById("vmn-cmd-backdrop")!;
      return { inert: backdrop.inert, hidden: backdrop.getAttribute("aria-hidden") };
    });
    expect(tabbed.inert, "a closed palette must be inert").toBe(true);
    expect(tabbed.hidden).toBe("true");

    const reachable = await page.evaluate(() => {
      const input = document.getElementById("vmn-cmd-input") as HTMLElement | null;
      if (!input) return false;
      input.focus();
      return document.activeElement === input;
    });
    expect(reachable, "an inert subtree must not accept focus").toBe(false);
  });
});
