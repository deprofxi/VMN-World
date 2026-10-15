/**
 * Financial Minor Units (Kobo) & Zero-Residue Integrity Test Suite
 * Authority: report.md §3 "Financial integrity model" (measured kobo-exact arithmetic)
 */

import { describe, it, expect } from "vitest";
import { toKobo, fromKobo, parseDecimalToKobo } from "../../src/core/domain/types.js";
import { SevenWayLedgerEngine, JournalLine } from "../../src/modules/finance/ledger/index.js";
import { Mt940Parser } from "../../src/modules/finance/reconciliation/mt940.js";

describe("T9-10 (F-9-08): Minor Units Representation in Financial Operations", () => {
  describe("Kobo conversion and parsing functions", () => {
    it("converts major units to integer Kobo and back with zero drift", () => {
      expect(toKobo(100.5)).toBe(10050);
      expect(toKobo(0.01)).toBe(1);
      expect(toKobo(0.00)).toBe(0);
      expect(toKobo(1234567.89)).toBe(123456789);

      expect(fromKobo(10050)).toBe(100.5);
      expect(fromKobo(1)).toBe(0.01);
      expect(fromKobo(123456789)).toBe(1234567.89);
    });

    it("parses SWIFT MT940 comma/dot formatted decimal strings into exact integer Kobo", () => {
      expect(parseDecimalToKobo("10000000,00")).toBe(1000000000);
      expect(parseDecimalToKobo("500000,50")).toBe(50000050);
      expect(parseDecimalToKobo("0,05")).toBe(5);
      expect(parseDecimalToKobo("123.45")).toBe(12345);
      expect(parseDecimalToKobo("-250,75")).toBe(-25075);
    });
  });

  describe("SevenWayLedgerEngine Property-Style Precision Verification", () => {
    it("balances 1,000 randomized ledger lines with exact zero residue", () => {
      const engine = new SevenWayLedgerEngine();
      const numLines = 1000;
      const lines: JournalLine[] = [];

      let runningDebitKobo = 0;
      let runningCreditKobo = 0;

      for (let i = 0; i < numLines - 1; i++) {
        // Generate pseudo-random kobo amounts (up to 1,000,000 NGN)
        const koboAmount = Math.floor(Math.random() * 10000000) + 1;
        const nairaAmount = fromKobo(koboAmount);

        if (i % 2 === 0) {
          lines.push({
            accountCode: `1010_CASH_${i}`,
            accountName: "Cash Account",
            debitNgn: nairaAmount,
            creditNgn: 0,
          });
          runningDebitKobo += koboAmount;
        } else {
          lines.push({
            accountCode: `2010_PAYABLE_${i}`,
            accountName: "Payable Account",
            debitNgn: 0,
            creditNgn: nairaAmount,
          });
          runningCreditKobo += koboAmount;
        }
      }

      // Add final balancing line
      if (runningDebitKobo > runningCreditKobo) {
        const diffKobo = runningDebitKobo - runningCreditKobo;
        lines.push({
          accountCode: "9999_BALANCING",
          accountName: "Balancing Entry",
          debitNgn: 0,
          creditNgn: fromKobo(diffKobo),
        });
        runningCreditKobo += diffKobo;
      } else {
        const diffKobo = runningCreditKobo - runningDebitKobo;
        lines.push({
          accountCode: "9999_BALANCING",
          accountName: "Balancing Entry",
          debitNgn: fromKobo(diffKobo),
          creditNgn: 0,
        });
        runningDebitKobo += diffKobo;
      }

      expect(runningDebitKobo).toBe(runningCreditKobo);

      const entry = engine.postJournalEntry({
        id: "JRNL-PROPERTY-TEST-001",
        reference: "REF-1000-LINES",
        description: "1,000 Line Property Test",
        lines,
      });

      expect(entry.isBalanced).toBe(true);
      expect(entry.totalDebitNgn).toBe(entry.totalCreditNgn);
      expect(toKobo(entry.totalDebitNgn) - toKobo(entry.totalCreditNgn)).toBe(0);
    });

    it("prevents floating point drift across accumulated pillar amounts", () => {
      const engine = new SevenWayLedgerEngine();

      // Add 0.1 NGN 100 times - standard floating point addition yields 9.99999999999998
      for (let i = 0; i < 100; i++) {
        engine.recordPillarAmounts({
          invoicedRevenueNgn: 0.1,
          recognizedRevenueNgn: 0.1,
        });
      }

      const snapshot = engine.getSnapshot();
      expect(snapshot.invoicedRevenueNgn).toBe(10.0);
      expect(snapshot.recognizedRevenueNgn).toBe(10.0);
    });
  });

  describe("MT940 Parser Minor Units Totals", () => {
    it("correctly parses large kobo values and exact totals without float distortion", () => {
      const rawMt940 = `:20:STMT-2026-TEST
:25:0123456789
:28C:00001
:60F:C260901NGN10000000,55
:61:2609010901CR1500000,25NTRFREF-TXN-1//REF-TXN-1
:86:Direct Deposit Invoice 101
:61:2609010901DR500000,75NTRFREF-TXN-2//REF-TXN-2
:86:Vendor Payout 202
:61:2609010901CR850000,50NTRFREF-TXN-3//REF-TXN-3
:86:Sponsorship Retainer
:62F:C260901NGN11850000,55`;

      const parsed = Mt940Parser.parse(rawMt940);

      expect(parsed.header.openingBalance).toBe(10000000.55);
      expect(parsed.closingBalance).toBe(11850000.55);
      expect(parsed.totalCreditsNgn).toBe(2350000.75);
      expect(parsed.totalDebitsNgn).toBe(500000.75);
    });
  });
});
