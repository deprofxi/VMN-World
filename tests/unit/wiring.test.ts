/**
 * Import-Graph & Domain Module Wiring Integrity Test Suite
 * Authority: tasks-9.md T9-05 / report-9.md F-9-05
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("T9-05 (F-9-05): Domain Module Wiring & Reachability", () => {
  const rootDir = process.cwd();
  const modulesDir = path.join(rootDir, "src", "modules");
  const apiDir = path.join(rootDir, "src", "api");
  const descopedConfigPath = path.join(rootDir, "docs", "architecture", "descoped-modules.json");

  // Read descoped modules register
  const descopedConfig = JSON.parse(fs.readFileSync(descopedConfigPath, "utf-8"));
  const descopedList: string[] = descopedConfig.descopedModules || [];

  function getModuleDirectories(dir: string, base = ""): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let results: string[] = [];

    const hasSourceFiles = entries.some(
      (e) => e.isFile() && (e.name.endsWith(".ts") || e.name.endsWith(".js"))
    );

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subPath = base ? `${base}/${entry.name}` : entry.name;
        const subDir = path.join(dir, entry.name);
        const subEntries = fs.readdirSync(subDir, { withFileTypes: true });
        const hasSubDirs = subEntries.some((s) => s.isDirectory());

        if (hasSubDirs) {
          results = results.concat(getModuleDirectories(subDir, subPath));
        } else {
          results.push(subPath);
        }
      }
    }

    if (results.length === 0 && hasSourceFiles && base) {
      results.push(base);
    }

    return results;
  }

  function getApiSourceFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(getApiSourceFiles(fullPath));
      } else if (entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
    return files;
  }

  it("ensures docs/architecture/descoped-modules.json exists and is valid", () => {
    expect(fs.existsSync(descopedConfigPath)).toBe(true);
    expect(Array.isArray(descopedList)).toBe(true);
  });

  it("verifies all 13 F-9-05 domain modules are wired and imported by src/api/**", () => {
    const requiredF905Modules = [
      "vcf",
      "onestudios",
      "tend",
      "community",
      "traffic",
      "playout",
      "sponsorship",
      "carriage",
      "billing",
      "export",
      "programmes",
      "scheduling",
      "rights",
    ];

    const apiFiles = getApiSourceFiles(apiDir);
    const aggregatedApiContent = apiFiles.map((f) => fs.readFileSync(f, "utf-8")).join("\n");

    for (const mod of requiredF905Modules) {
      const isImported =
        aggregatedApiContent.includes(`/modules/broadcast/${mod}`) ||
        aggregatedApiContent.includes(`/modules/hub/${mod}`) ||
        aggregatedApiContent.includes(`/modules/${mod}`);

      const isDescoped = descopedList.includes(mod);

      expect(
        isImported || isDescoped,
        `Module '${mod}' must be either wired into src/api/** or listed in descoped-modules.json`
      ).toBe(true);

      expect(isImported, `Module '${mod}' should be actively wired in API layer`).toBe(true);
    }
  });

  it("verifies every discovered module under src/modules/** is reachable or formally descoped", () => {
    const allModules = getModuleDirectories(modulesDir);
    const apiFiles = getApiSourceFiles(apiDir);
    const aggregatedApiContent = apiFiles.map((f) => fs.readFileSync(f, "utf-8")).join("\n");

    // Also check index aggregator files in modules
    const broadcastIndex = fs.existsSync(path.join(modulesDir, "broadcast", "index.ts"))
      ? fs.readFileSync(path.join(modulesDir, "broadcast", "index.ts"), "utf-8")
      : "";
    const hubIndex = fs.existsSync(path.join(modulesDir, "hub", "index.ts"))
      ? fs.readFileSync(path.join(modulesDir, "hub", "index.ts"), "utf-8")
      : "";
    const financeIndex = fs.existsSync(path.join(modulesDir, "finance", "index.ts"))
      ? fs.readFileSync(path.join(modulesDir, "finance", "index.ts"), "utf-8")
      : "";
    const intelIndex = fs.existsSync(path.join(modulesDir, "intelligence", "index.ts"))
      ? fs.readFileSync(path.join(modulesDir, "intelligence", "index.ts"), "utf-8")
      : "";

    const allAggregation = `${aggregatedApiContent}\n${broadcastIndex}\n${hubIndex}\n${financeIndex}\n${intelIndex}`;

    for (const modPath of allModules) {
      const leafName = path.basename(modPath);
      const isReachable =
        allAggregation.includes(`/${modPath}`) ||
        allAggregation.includes(`/${leafName}`) ||
        allAggregation.includes(`/${leafName}.js`) ||
        allAggregation.includes(`/${leafName}/index.js`);

      const isDescoped = descopedList.includes(modPath) || descopedList.includes(leafName);

      expect(
        isReachable || isDescoped,
        `Discovered module '${modPath}' is neither reachable from src/api/** (directly or via aggregators) nor recorded in descoped-modules.json`
      ).toBe(true);
    }
  });
});
