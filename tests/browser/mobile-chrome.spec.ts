/**
 * Mobile chrome is derived, not duplicated — PR-26 / DEBT-011 burn-down.
 *
 * The drawer, its backdrop and the sticky action bar used to ship as a second
 * hand-written copy of the nine header links in every page's HTML. They are now
 * built by `/assets/app.js` from `nav.vmn-nav-links`, which leaves three things
 * to prove and none of them provable from a string:
 *
 *   1. the built drawer carries the *same* links, in the same order (a clone that
 *      silently drops an entry is the failure the single-source rule exists to
 *      prevent);
 *   2. the drawer still behaves as a modal — focus moves in, the page behind it is
 *      inert, Escape returns focus to the trigger;
 *   3. without scripting the collapsed nav comes back as a visible list and the
 *      hamburger is not shipped as a control that cannot open anything.
 *
 * (3) is the reason this file runs a real browser with JavaScript disabled rather
 * than asserting on the `<noscript>` bytes: whether the fallback stylesheet wins
 * the cascade is a question only the cascade can answer.
 */

import { test, expect, type Page } from "@playwright/test";

const MOBILE = { width: 390, height: 844 };

interface NavLink {
  href: string | null;
  label: string;
}

function readLinks(page: Page, selector: string): Promise<NavLink[]> {
  return page.$$eval(selector, (elements) =>
    elements.map((element) => ({
      href: element.getAttribute("href"),
      label: (element.textContent ?? "").trim(),
    }))
  );
}

test.describe("mobile chrome rendered from the header nav", () => {
  test("the drawer carries exactly the header nav's links, in its order", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/", { waitUntil: "load" });

    const nav = await readLinks(page, "nav.vmn-nav-links a[href]");
    const drawer = await readLinks(page, "#vmn-mobile-drawer a.vmn-drawer-link");

    expect(nav.length, "the header nav must still be the source of the list").toBeGreaterThanOrEqual(9);
    expect(drawer, "the drawer must be the same list, not a shorter one").toEqual(nav);
    // The active entry carries its state into the drawer, so the copy is not
    // merely a list of links with the current page lost.
    expect(drawer.find((link) => link.href === "/")).toEqual({ href: "/", label: "Overview" });
    expect(
      await page.getAttribute('#vmn-mobile-drawer a[href="/"]', "aria-current")
    ).toBe("page");
  });

  test("the sticky action bar reuses nav destinations, and its quick jump opens the palette", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/", { waitUntil: "load" });

    const bar = await readLinks(page, ".vmn-mobile-action-bar a");
    expect(bar.map((link) => link.href)).toEqual(["/", "/media-and-audience-overview", "/prototypes"]);
    // Labels come from the nav, so they cannot drift from it.
    const nav = await readLinks(page, "nav.vmn-nav-links a[href]");
    for (const link of bar) {
      expect(link.label).toBe(nav.find((entry) => entry.href === link.href)?.label);
    }

    // The bar is fixed over the foot of the page, so the page reserves space for
    // it — but only once the bar exists.
    const reserved = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.getElementById("main-content")!).paddingBottom)
    );
    expect(reserved, "the fixed bar must not cover the end of the page").toBeGreaterThanOrEqual(88);

    await page.click("#vmn-mobile-quick-jump");
    await expect(page.locator("#vmn-cmd-backdrop")).toHaveClass(/open/);
    await page.keyboard.press("Escape");
    await expect(page.locator("#vmn-cmd-backdrop")).not.toHaveClass(/open/);
  });

  test("the built drawer is still a modal: focus enters, the page is inert, Escape restores focus", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/", { waitUntil: "load" });

    const trigger = page.locator("#vmn-mobile-menu-btn");
    await trigger.click();

    await expect(trigger).toHaveAttribute("aria-controls", "vmn-mobile-drawer");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const open = await page.evaluate(() => {
      const drawer = document.getElementById("vmn-mobile-drawer");
      const main = document.getElementById("main-content");
      return {
        drawerHidden: drawer?.getAttribute("aria-hidden"),
        drawerRole: drawer?.getAttribute("role"),
        drawerInert: Boolean((drawer as HTMLElement | null)?.inert),
        mainInert: Boolean((main as HTMLElement | null)?.inert),
        focusId: document.activeElement?.id ?? "",
      };
    });
    expect(open.drawerHidden, "an open drawer must not be aria-hidden").toBe("false");
    expect(open.drawerRole, "an open drawer must be a dialog").toBe("dialog");
    expect(open.drawerInert, "an open drawer must not be inert").toBe(false);
    expect(open.mainInert, "the page behind the drawer must be inert").toBe(true);
    expect(open.focusId, "focus must move into the drawer").toBe("vmn-drawer-close");

    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    const closed = await page.evaluate(() => ({
      mainInert: Boolean((document.getElementById("main-content") as HTMLElement | null)?.inert),
      focusId: document.activeElement?.id ?? "",
    }));
    expect(closed.mainInert, "closing the drawer must restore the page").toBe(false);
    expect(closed.focusId, "focus must return to the trigger").toBe("vmn-mobile-menu-btn");
  });
});

test.describe("the no-JS fallback", () => {
  test("shows the nav as a list and ships no trigger that cannot open anything", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: MOBILE });
    const page = await context.newPage();
    try {
      await page.goto("/", { waitUntil: "load" });

      const fallback = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("nav.vmn-nav-links a[href]"));
        const trigger = document.getElementById("vmn-mobile-menu-btn");
        return {
          navDisplay: getComputedStyle(document.querySelector("nav.vmn-nav-links")!).display,
          visibleLinks: links.filter((link) => link.getBoundingClientRect().width > 0).length,
          totalLinks: links.length,
          triggerDisplay: trigger ? getComputedStyle(trigger).display : null,
          drawer: Boolean(document.getElementById("vmn-mobile-drawer")),
          actionBar: Boolean(document.querySelector(".vmn-mobile-action-bar")),
          topLink: Math.round(links[0]?.getBoundingClientRect().top ?? -1),
          headerBottom: Math.round(document.querySelector("header.vmn-navbar")!.getBoundingClientRect().bottom),
          footPadding: parseFloat(
            getComputedStyle(document.getElementById("main-content")!).paddingBottom
          ),
        };
      });

      expect(fallback.navDisplay, "the stylesheet collapse must be overridden").toBe("flex");
      expect(fallback.visibleLinks, "every destination must be reachable without scripting").toBe(fallback.totalLinks);
      expect(fallback.totalLinks).toBeGreaterThanOrEqual(9);
      // The nav is laid out inside the header, not overflowing off-screen.
      expect(fallback.topLink).toBeGreaterThan(0);
      expect(fallback.topLink).toBeLessThan(fallback.headerBottom);
      expect(fallback.triggerDisplay, "a hamburger with nothing to open must not render").toBe("none");
      expect(
        fallback.footPadding,
        "no dead space is reserved for an action bar that does not exist"
      ).toBeLessThan(88);
      expect(fallback.drawer, "no drawer element exists without scripting").toBe(false);
      expect(fallback.actionBar, "no action bar exists without scripting").toBe(false);
    } finally {
      await context.close();
    }
  });
});
