/**
 * Branding & Dynamic Channels Domain Routes (Modular Router AUD-24)
 * Authority: PRD R1.3C, Design System Standards
 */

import { DomainRoute, RouteContext } from "./types.js";
import { getBrandConfig, updateBrandLogo, resetBrandLogo } from "../../core/branding/logo-service.js";
import { getPublicChannels, registerChannel, resetChannels, PublicChannelInfo } from "../../web/public/channels.js";
import { parseJsonBody, sendJson } from "../router.js";

export const brandingDomainRoutes: DomainRoute[] = [
  {
    method: "GET",
    pathname: "/api/v1/branding/config",
    handle: async ({ res }: RouteContext) => {
      await sendJson(res, 200, {
        success: true,
        ...getBrandConfig(),
        channelsCount: getPublicChannels().length,
      });
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/branding/logo",
    handle: async ({ req, res }: RouteContext) => {
      try {
        const body = (await parseJsonBody(req, "/api/v1/branding/logo")) as {
          logoDataUrl?: string;
          brandName?: string;
          brandShort?: string;
          tagline?: string;
        };
        const result = updateBrandLogo({
          logoDataUrl: body?.logoDataUrl || "",
          brandName: body?.brandName,
          brandShort: body?.brandShort,
          tagline: body?.tagline,
        });
        await sendJson(res, 200, result);
      } catch (err: unknown) {
        await sendJson(res, 400, { success: false, error: err instanceof Error ? err.message : "Failed to update brand logo." });
      }
      return true;
    },
  },
  {
    method: "DELETE",
    pathname: "/api/v1/branding/logo",
    handle: async ({ res }: RouteContext) => {
      const config = resetBrandLogo();
      await sendJson(res, 200, { success: true, message: "Logo reset to default.", config });
      return true;
    },
  },
  {
    method: "GET",
    pathname: "/api/v1/branding/channels",
    handle: async ({ res }: RouteContext) => {
      await sendJson(res, 200, { success: true, channels: getPublicChannels() });
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/branding/channels",
    handle: async ({ req, res }: RouteContext) => {
      try {
        const channel = (await parseJsonBody(req, "/api/v1/branding/channels")) as unknown as PublicChannelInfo;
        if (!channel || !channel.code || !channel.name) {
          await sendJson(res, 400, { success: false, error: "Channel code and name required." });
          return true;
        }
        registerChannel(channel);
        await sendJson(res, 201, {
          success: true,
          message: `Channel ${channel.code} registered.`,
          channel,
          channels: getPublicChannels(),
        });
      } catch (err: unknown) {
        await sendJson(res, 400, { success: false, error: err instanceof Error ? err.message : "Failed to register channel." });
      }
      return true;
    },
  },
  {
    method: "DELETE",
    pathname: "/api/v1/branding/channels",
    handle: async ({ res }: RouteContext) => {
      resetChannels();
      await sendJson(res, 200, { success: true, message: "Reset to default channels.", channels: getPublicChannels() });
      return true;
    },
  },
];
