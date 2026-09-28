import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { Mt940Parser, PaymentGatewayWebhookValidator } from "../../src/modules/finance/reconciliation/mt940.js";
import { BankReconciliationEngine } from "../../src/modules/finance/reconciliation/index.js";

describe("SWIFT MT940 Parser & Webhook Signature Verification (B-16)", () => {
  const sampleMt940 = `
:20:VMNL-2026-STMT-001
:25:0123456789
:28C:00042/001
:60F:C260901NGN50000000,00
:61:2609280928CR15000000,00NTRFNONREF//INV-2026-0042
:86:PAYMENT FOR AIRTIME ADVERTISING CAMPAIGN MTN NIGERIA
:61:2609280928CR5000000,00NTRFNONREF//INV-2026-0043
:86:PAYMENT FOR AFCA SPONSORSHIP GUINNESS
:62F:C260928NGN70000000,00
`;

  it("should parse raw SWIFT MT940 text into structured statement header and lines", () => {
    const parsed = Mt940Parser.parse(sampleMt940);

    expect(parsed.header.transactionReference).toBe("VMNL-2026-STMT-001");
    expect(parsed.header.accountNumber).toBe("0123456789");
    expect(parsed.header.statementNumber).toBe("00042/001");
    expect(parsed.header.currency).toBe("NGN");
    expect(parsed.header.openingBalance).toBe(50000000);
    expect(parsed.closingBalance).toBe(70000000);

    expect(parsed.lines.length).toBe(2);
    expect(parsed.lines[0].amountNgn).toBe(15000000);
    expect(parsed.lines[0].isCredit).toBe(true);
    expect(parsed.lines[0].reference).toBe("INV-2026-0042");
    expect(parsed.lines[0].narration).toContain("MTN NIGERIA");

    expect(parsed.lines[1].amountNgn).toBe(5000000);
    expect(parsed.lines[1].reference).toBe("INV-2026-0043");
  });

  it("should convert MT940 statement lines to BankTransactionRecords and reconcile against invoices", () => {
    const parsed = Mt940Parser.parse(sampleMt940);
    const records = Mt940Parser.toBankTransactionRecords(parsed);
    expect(records.length).toBe(2);

    const reconEngine = new BankReconciliationEngine();
    reconEngine.ingestBankTransactions(records);

    const invoices = [
      { invoiceNumber: "INV-2026-0042", expectedAmountNgn: 15000000, clientName: "MTN Nigeria", isPaid: false },
      { invoiceNumber: "INV-2026-0043", expectedAmountNgn: 5000000, clientName: "Guinness Nigeria", isPaid: false },
    ];

    const results = reconEngine.reconcileAgainstInvoices(invoices);
    expect(results.length).toBe(2);
    expect(results[0].status).toBe("EXACT_MATCH_RECONCILED");
    expect(results[0].matchedInvoiceNumber).toBe("INV-2026-0042");
    expect(results[1].status).toBe("EXACT_MATCH_RECONCILED");
    expect(invoices[0].isPaid).toBe(true);
    expect(invoices[1].isPaid).toBe(true);
  });

  it("should verify Paystack HMAC-SHA512 webhook signature", () => {
    const rawBody = JSON.stringify({ event: "charge.success", data: { id: 101, amount: 500000 } });
    const secret = "test-paystack-secret-key-prod";

    // Generate valid signature
    const validSignature = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");

    expect(PaymentGatewayWebhookValidator.verifyPaystackSignature(rawBody, validSignature, secret)).toBe(true);
    expect(PaymentGatewayWebhookValidator.verifyPaystackSignature(rawBody, "invalid-sig", secret)).toBe(false);
  });

  it("should verify Flutterwave secret-hash webhook header", () => {
    const secretHash = "flw_webhook_secret_hash_12345";
    expect(PaymentGatewayWebhookValidator.verifyFlutterwaveSignature(secretHash, secretHash)).toBe(true);
    expect(PaymentGatewayWebhookValidator.verifyFlutterwaveSignature("wrong_hash", secretHash)).toBe(false);
  });
});
