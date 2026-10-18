/**
 * Commercial Enquiry Domain Route Handlers (AUD-24 / AUD-03 / AUD-11)
 */

import { DomainRoute, RouteContext } from "./types.js";
import { ListEnquiriesQuerySchema } from "../schemas/index.js";
import { listEnquiries, retryDownstreamRouting } from "../../modules/hub/enquiry/index.js";
import { sendJson } from "../router.js";
import { accessContextFor, canPerform } from "../../core/rbac/index.js";

function sendProblem(res: RouteContext["res"], status: number, title: string, detail: string, type: string, extensions: Record<string, unknown> = {}): void {
  res.writeHead(status, { "Content-Type": "application/problem+json; charset=utf-8" });
  res.end(JSON.stringify({ type: `https://vmnl.ng/problems/${type}`, title, status, detail, ...extensions }));
}

export const enquiryRoutes: DomainRoute[] = [
  {
    method: "GET",
    pathname: "/api/v1/enquiries",
    handle: ({ req, res, parsedUrl, user }: RouteContext) => {
      if (!user) {
        sendProblem(res, 401, "Unauthorized", "Authentication is required.", "unauthorized");
        return true;
      }
      // PR-09: the enquiry listing is tenant-bearing, so it is decided with the
      // request's own attribute context rather than a bare role lookup.
      if (!canPerform(user, "read", "enquiry", accessContextFor(user, req.headers))) {
        sendProblem(res, 403, "Forbidden", "Enquiry read permission is required.", "forbidden");
        return true;
      }
      const parsed = ListEnquiriesQuerySchema.safeParse({
        vertical: parsedUrl.searchParams.get("vertical") || undefined,
      });
      if (!parsed.success) {
        sendProblem(res, 422, "Unprocessable Content", "One or more query fields are invalid.", "validation-error", { errors: parsed.error.issues });
        return true;
      }
      const enquiries = listEnquiries(parsed.data.vertical);
      sendJson(res, 200, { enquiries, count: enquiries.length });
      return true;
    },
  },
  {
    method: "POST",
    pathname: /^\/api\/v1\/enquiries\/[^/]+\/retry-routing$/,
    handle: async ({ req, res, pathname, user }: RouteContext) => {
      if (!user) {
        sendProblem(res, 401, "Unauthorized", "Authentication is required.", "unauthorized");
        return true;
      }
      if (!canPerform(user, "update", "enquiry", accessContextFor(user, req.headers))) {
        sendProblem(res, 403, "Forbidden", "Enquiry routing permission is required.", "forbidden");
        return true;
      }
      const reference = pathname.replace("/api/v1/enquiries/", "").replace("/retry-routing", "").trim();
      try {
        const updated = await retryDownstreamRouting(reference);
        sendJson(res, 200, { status: "SUCCESS", enquiry: updated });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Bad Request";
        sendProblem(res, 400, "Bad Request", message, "bad-request");
      }
      return true;
    },
  },
];
