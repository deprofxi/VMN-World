/**
 * TSK-49 (CA-30): rendered-HTML markup invariants.
 *
 * HTML parsers keep the first occurrence of a duplicated attribute and discard
 * the rest, so `class="a" class="b"` silently loses `b`. Two such sites shipped
 * through the inline-style migration and no gate caught them: the pulse dot and
 * the card section rendered unstyled while their markup looked correct in review.
 *
 * The rule is checked against rendered bytes, not template source — a `${cond ?
 * `class="x"` : ""}` interpolation makes any static scan of a TS template
 * unreliable, which is exactly how the defect survived visual review.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderMasterLayout,
  renderHomePageHtml,
  renderChannelsPageHtml,
  renderHubPageHtml,
  renderScreensCatalogHtml,
  renderAfcaVerificationHtml,
  renderPoaVerificationHtml,
  renderWorkspaceDirectoryHtml,
} from "../../src/web/index.js";
import { renderBroadcastScreenHtml } from "../../src/web/broadcast/index.js";
import { BROADCAST_SCREEN_INVENTORY } from "../../src/modules/broadcast/screens/index.js";
import {
  ENTERPRISE_WORKSPACES,
  renderWorkspaceDeskHtml,
} from "../../src/web/workspace/surface-bc.js";

const SRC_ROOT = fileURLToPath(new URL("../../src", import.meta.url));

/** Attribute names repeated inside the same start tag of already-rendered HTML. */
export function findDuplicateAttributes(html: string): string[] {
  const found: string[] = [];
  for (const match of html.matchAll(/<[a-zA-Z][^>]*>/g)) {
    const tag = match[0];
    const names = [...tag.matchAll(/(?:^|\s)([a-zA-Z-]+)=/g)].map((m) => m[1].toLowerCase());
    const duplicated = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];
    if (duplicated.length > 0) {
      found.push(`${duplicated.join(", ")} in ${tag.replace(/\s+/g, " ").slice(0, 100)}`);
    }
  }
  return found;
}

describe("TSK-49: no duplicated attribute in emitted HTML (CA-30)", () => {
  it("keeps the two sites the audit found merged into one class each", () => {
    const pulseDot = fs.readFileSync(path.join(SRC_ROOT, "web/broadcast/index.ts"), "utf8");
    const cardSection = fs.readFileSync(path.join(SRC_ROOT, "api/router.ts"), "utf8");
    expect(pulseDot).toContain('class="s-sj5T5qvyn0 vmn-pulse-dot"');
    expect(cardSection).toContain('class="s-NpaiBgA8Dx card"');
  });

  it("rejects a duplicated attribute written on one line of any template", () => {
    // The narrow, source-level form of the defect: `class="a" class="b"` typed
    // into a single tag. Cheap enough to run over the whole tree; the rendered
    // assertions below are what catch the interpolated cases.
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : entry.name.endsWith(".ts") ? [full] : [];
      });
    const signature = /\s([a-zA-Z-]+)="[^"]*"\s+\1="/;
    const offenders: string[] = [];
    for (const file of walk(SRC_ROOT)) {
      const lines = fs.readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (/<[a-zA-Z][^>]*\s[a-zA-Z-]+="/.test(line) && signature.test(line)) {
          offenders.push(`${path.relative(SRC_ROOT, file)}:${i + 1}: ${line.trim().slice(0, 90)}`);
        }
      });
    }
    expect(offenders, `Repeated attribute inside one start tag:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("rejects duplicate attributes across every surface the shell can render", () => {
    const surfaces = new Map<string, string>();
    surfaces.set("/", renderMasterLayout("Home", renderHomePageHtml(), "/"));
    surfaces.set("/channels", renderMasterLayout("Channels", renderChannelsPageHtml(), "/channels"));
    surfaces.set("/hub", renderMasterLayout("Hub", renderHubPageHtml(), "/hub"));
    surfaces.set("/broadcast/screens", renderMasterLayout("Screens", renderScreensCatalogHtml(), "/broadcast/screens"));
    surfaces.set("/verify/afca/TEST", renderMasterLayout("AFCA", renderAfcaVerificationHtml({ valid: false, id: "TEST" }), "/verify/afca/TEST"));
    surfaces.set("/verify/poa/TEST", renderMasterLayout("POA", renderPoaVerificationHtml({ valid: false, id: "TEST" }), "/verify/poa/TEST"));
    surfaces.set("/workspace", renderMasterLayout("Workspace", renderWorkspaceDirectoryHtml(), "/workspace"));

    for (const screen of BROADCAST_SCREEN_INVENTORY) {
      surfaces.set(
        `screen ${screen.screenId}`,
        renderBroadcastScreenHtml(screen, { id: "X-1" }, screen.primaryRole),
      );
    }
    for (const desk of ENTERPRISE_WORKSPACES) {
      surfaces.set(`desk ${desk.key}`, renderMasterLayout(desk.name, renderWorkspaceDeskHtml(desk.key), `/workspace/${desk.key}`));
    }

    const offenders: string[] = [];
    for (const [surface, html] of surfaces) {
      for (const hit of findDuplicateAttributes(html)) offenders.push(`${surface}: ${hit}`);
    }
    // Counted rather than assumed: an empty map would make the loop vacuous.
    expect(surfaces.size).toBeGreaterThanOrEqual(BROADCAST_SCREEN_INVENTORY.length + ENTERPRISE_WORKSPACES.length);
    expect(offenders, `Rendered HTML carries duplicate attributes:\n${offenders.join("\n")}`).toEqual([]);
  });
});
