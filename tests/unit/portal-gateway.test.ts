import { describe, it, expect } from "vitest";
import { renderPortalGatewayHtml, ENTERPRISE_PORTALS } from "../../src/web/portal/portal-gateway.js";
import { renderMasterLayout } from "../../src/web/public/dashboard.js";

describe("Enterprise Portals Gateway (/portal)", () => {
  it("renders all 5 enterprise counterparty portals", () => {
    expect(ENTERPRISE_PORTALS).toHaveLength(5);
    const portalIds = ENTERPRISE_PORTALS.map((p) => p.id);
    expect(portalIds).toContain("client");
    expect(portalIds).toContain("vtm");
    expect(portalIds).toContain("partner");
    expect(portalIds).toContain("creator");
    expect(portalIds).toContain("vendor");
  });

  it("renders the portal gateway HTML with valid markup and accessibility tokens", () => {
    const html = renderPortalGatewayHtml();
    expect(html).toContain("Enterprise Counterparty Portals");
    expect(html).toContain("Client Commercial Portal");
    expect(html).toContain("Virtual Talent Management (VTM)");
    expect(html).toContain("Partner Ecosystem Portal");
    expect(html).toContain("Creator &amp; Rights Settlement Portal");
    expect(html).toContain("Vendor Procurement Portal");
    expect(html).toContain("/portal/client/organisations/default-org/projects");
    expect(html).toContain("/portal/vtm/marketplace");
    expect(html).toContain("/portal/partner");
    expect(html).toContain("/portal/creator");
    expect(html).toContain("/portal/vendor");
  });

  it("integrates seamlessly into the master layout", () => {
    const layout = renderMasterLayout("Enterprise Portals | VMNL", renderPortalGatewayHtml(), "/portal");
    expect(layout).toContain("Enterprise Portals");
    expect(layout).toContain("/portal");
    expect(layout).toContain("skip-to-content");
  });
});
