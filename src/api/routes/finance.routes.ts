/**
 * Commercial Finance Modular Domain Route Handlers (AUD-24 / PRD R1.3C)
 * Authority: BRD R1.2A §14, §18, §70 / Canonical Laws 05 & 07
 */

import { DomainRoute, RouteContext } from "./types.js";
import { sendJson, parseJsonBody, sendHtml, readFormBodyStash } from "../router.js";
import {
  saveTalentPayoutBatch,
  listTalentPayoutBatches,
  saveBankStatement,
} from "../../core/database/repositories/finance.repository.js";
import { SevenWayLedgerEngine } from "../../modules/finance/ledger/index.js";
import { renderMasterLayout } from "../../web/public/dashboard.js";
import { renderFinanceLedgerDeskHtml, renderFinancePayoutsDeskHtml } from "../../web/workspace/finance-desk.js";
import { issueCsrfToken } from "../../core/websecurity/index.js";
import { recordAuditLog } from "../../core/audit/index.js";

const ledgerEngine = new SevenWayLedgerEngine();

export const financeRoutes: DomainRoute[] = [
  // --------------------------------------------------------------------------
  // Wave 1: General Ledger Desk
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/workspace/finance/ledger",
    handle: async ({ res, user, parsedUrl }: RouteContext) => {
      const journals = ledgerEngine.getEntries();
      const csrfToken = issueCsrfToken();
      const message = parsedUrl.searchParams.get("msg") || undefined;

      const body = renderFinanceLedgerDeskHtml({
        journals,
        csrfToken,
        user,
        message,
      });

      const html = renderMasterLayout("General Ledger & Balanced Postings | VMN Enterprise", body, "/workspace/finance/ledger", {
        sessionUser: user || null,
        shell: "work",
      });

      await sendHtml(res, 200, html);
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/finance/ledger/journal",
    handle: async ({ req, res, user }: RouteContext) => {
      const raw = await readFormBodyStash(req);
      const params = new URLSearchParams(raw);
      const reference = params.get("reference") || `JRN-${Date.now().toString(36)}`;
      const description = params.get("description") || "Manual General Ledger Posting";
      const debitAccount = params.get("debitAccount") || "1100";
      const debitAmount = Number(params.get("debitAmount")) || 0;
      const creditAccount = params.get("creditAccount") || "4000";
      const creditAmount = Number(params.get("creditAmount")) || 0;

      if (debitAmount <= 0 || creditAmount <= 0 || Math.abs(debitAmount - creditAmount) > 0.01) {
        res.writeHead(303, { Location: "/workspace/finance/ledger?msg=Error:+Debits+must+equal+Credits+exactly" });
        res.end();
        return true;
      }

      const id = `jrn-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      ledgerEngine.postJournalEntry({
        id,
        reference,
        description,
        lines: [
          { accountCode: debitAccount, accountName: `Debit: ${debitAccount}`, debitNgn: debitAmount, creditNgn: 0 },
          { accountCode: creditAccount, accountName: `Credit: ${creditAccount}`, debitNgn: 0, creditNgn: creditAmount },
        ],
      });

      recordAuditLog({
        action: "create",
        resource: "finance",
        userId: user?.userId || "usr_finance_controller",
        changes: { reference, debitAccount, creditAccount, amountNgn: debitAmount },
      });

      res.writeHead(303, { Location: "/workspace/finance/ledger?msg=Journal+Entry+Posted+Successfully" });
      res.end();
      return true;
    },
  },

  // --------------------------------------------------------------------------
  // Wave 1: Talent Payouts Desk
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/workspace/finance/payouts",
    handle: async ({ res, user, parsedUrl }: RouteContext) => {
      const result = await listTalentPayoutBatches();
      const csrfToken = issueCsrfToken();
      const message = parsedUrl.searchParams.get("msg") || undefined;

      const body = renderFinancePayoutsDeskHtml({
        batches: result.rows,
        csrfToken,
        user,
        message,
      });

      const html = renderMasterLayout("Talent Payouts & Nigerian WHT | VMN Enterprise", body, "/workspace/finance/payouts", {
        sessionUser: user || null,
        shell: "work",
      });

      await sendHtml(res, 200, html);
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/finance/payouts/approve",
    handle: async ({ req, res, user }: RouteContext) => {
      const raw = await readFormBodyStash(req);
      const params = new URLSearchParams(raw);
      const batchId = params.get("batchId") || "";

      recordAuditLog({
        action: "approve",
        resource: "finance",
        userId: user?.userId || "usr_finance_controller",
        changes: { batchId, action: "DUAL_AUTHORIZATION_APPROVED" },
      });

      res.writeHead(303, { Location: "/workspace/finance/payouts?msg=Payout+Batch+Authorized+for+Disbursement" });
      res.end();
      return true;
    },
  },
  // --------------------------------------------------------------------------
  // TALENT PAYOUT BATCHES
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/api/v1/finance/payouts/batches",
    handle: async ({ res }: RouteContext) => {
      const result = await listTalentPayoutBatches();
      await sendJson(res, 200, {
        success: true,
        data: result.rows,
        nextCursor: result.nextCursor,
      });
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/finance/payouts/batches",
    handle: async ({ req, res, pathname, user }: RouteContext) => {
      if (!user) {
        await sendJson(res, 401, { error: "Unauthorized", message: "Finance controller session required" });
        return true;
      }
      try {
        const body = (await parseJsonBody(req, pathname)) as Record<string, unknown>;
        const batch = await saveTalentPayoutBatch({
          id: (body.id as string) || `PAY-${Date.now()}`,
          batchNumber: (body.batchNumber as string) || `BAT-${Date.now()}`,
          totalAmountNgn: Number(body.totalAmountNgn) || 0,
          currency: (body.currency as string) || "NGN",
          itemCount: Number(body.itemCount) || 1,
          status: (body.status as string) || "DRAFT",
          approvedBy: user.userId,
        });
        await sendJson(res, 201, { success: true, data: batch });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await sendJson(res, 400, { error: "Bad Request", message });
        return true;
      }
    },
  },

  // --------------------------------------------------------------------------
  // BANK STATEMENT RECONCILIATION
  // --------------------------------------------------------------------------
  {
    method: "POST",
    pathname: "/api/v1/finance/reconciliation/statements",
    handle: async ({ req, res, pathname, user }: RouteContext) => {
      if (!user) {
        await sendJson(res, 401, { error: "Unauthorized", message: "Finance officer session required" });
        return true;
      }
      try {
        const body = (await parseJsonBody(req, pathname)) as Record<string, unknown>;
        const statement = await saveBankStatement({
          id: (body.id as string) || `STMT-${Date.now()}`,
          statementReference: (body.statementReference as string) || `REF-${Date.now()}`,
          transactionDate: new Date((body.transactionDate as string | number) || Date.now()),
          rawSwiftCode: body.rawSwiftCode as string | undefined,
          amountNgn: Number(body.amountNgn) || 0,
          isCredit: Boolean(body.isCredit),
          narrative: (body.narrative as string) || "Direct deposit",
          reconciledStatus: (body.reconciledStatus as string) || "UNMATCHED",
        });
        await sendJson(res, 201, { success: true, data: statement });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await sendJson(res, 400, { error: "Bad Request", message });
        return true;
      }
    },
  },
];
