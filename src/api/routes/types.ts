/**
 * Domain Route Handler Interfaces (AUD-24 / Modular Router Architecture)
 */

import { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { SessionUser } from "../../core/auth/index.js";

export interface RouteContext {
  req: IncomingMessage;
  res: ServerResponse;
  pathname: string;
  method: string;
  parsedUrl: URL;
  user: SessionUser | null;
}

export type DomainRouteHandler = (ctx: RouteContext) => Promise<boolean | void> | boolean | void;

export interface DomainRoute {
  method: string;
  pathname: string | RegExp;
  handle: DomainRouteHandler;
}
