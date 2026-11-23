import { describe, it, expect, beforeAll } from "vitest";
import {
  getAllBrands,
  getBrandBySlug,
  getBrandsByFamily,
  getBrandFamilyGroups,
  CANONICAL_BRANDS,
  BRAND_FAMILIES_META,
  seedAllBrandsToDatabase,
  hydrateBrandsFromDatabase,
} from "../../src/core/database/repositories/brand.repository.js";
import { getBrandFamilies, resolveBrandInstance, renderBrandDirectoryBody, renderBrandFamilyBody, renderBrandInstanceBody } from "../../src/web/ia/journey-bri.js";

describe("Brand Database Persistence and Rendering", () => {
  beforeAll(async () => {
    // Seed and hydrate from database
    await seedAllBrandsToDatabase();
    await hydrateBrandsFromDatabase();
  });

  it("persists and loads exactly 35 canonical brands", () => {
    const brands = getAllBrands();
    expect(brands).toHaveLength(35);
    expect(CANONICAL_BRANDS).toHaveLength(35);
  });

  it("groups brands into exactly 4 families matching the approved counts", () => {
    const familyGroups = getBrandFamilyGroups();
    expect(familyGroups).toHaveLength(4);
    const ten = familyGroups.find((f) => f.familySlug === "ten");
    const nigezie = familyGroups.find((f) => f.familySlug === "nigezie");
    const candy = familyGroups.find((f) => f.familySlug === "candy-tv");
    const games = familyGroups.find((f) => f.familySlug === "games-360");
    expect(ten?.instances).toHaveLength(11);
    expect(nigezie?.instances).toHaveLength(7);
    expect(candy?.instances).toHaveLength(12);
    expect(games?.instances).toHaveLength(5);
  });

  it("resolves each of the 35 brands by its slug", () => {
    for (const brand of CANONICAL_BRANDS) {
      const found = getBrandBySlug(brand.slug);
      expect(found).toBeDefined();
      expect(found?.code).toBe(brand.code);
      expect(found?.name).toBe(brand.name);
      expect(found?.familySlug).toBe(brand.familySlug);

      const resolved = resolveBrandInstance(brand.slug);
      expect(resolved).toBeDefined();
      expect(resolved?.slug).toBe(brand.slug);
    }
  });

  it("filters brands by family slug", () => {
    expect(getBrandsByFamily("ten")).toHaveLength(11);
    expect(getBrandsByFamily("nigezie")).toHaveLength(7);
    expect(getBrandsByFamily("candy-tv")).toHaveLength(12);
    expect(getBrandsByFamily("games-360")).toHaveLength(5);
  });

  it("renders the brand directory body from database records", () => {
    const html = renderBrandDirectoryBody();
    expect(html).toContain("Brand directory");
    for (const meta of BRAND_FAMILIES_META) {
      expect(html).toContain(meta.familySlug);
    }
    // Spot check instances across all 4 families
    expect(html).toContain("TEN Urban");
    expect(html).toContain("Nigezie Xtreme");
    expect(html).toContain("Candy Ville");
    expect(html).toContain("Games Radio");
  });

  it("renders every family overview and every instance body without errors", () => {
    const families = getBrandFamilies();
    expect(families).toHaveLength(4);

    for (const family of families) {
      const familyHtml = renderBrandFamilyBody(family);
      expect(familyHtml).toContain(family.screen.screenName);
      expect(family.instances.length).toBeGreaterThan(0);

      for (const instance of family.instances) {
        const instanceHtml = renderBrandInstanceBody(instance);
        expect(instanceHtml).toContain(instance.name);
        expect(instanceHtml).toContain(instance.brandId);
        expect(instanceHtml).toContain("Brand identity");
      }
    }
  });
});
