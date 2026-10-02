/**
 * SWIFT MT940 Customer Statement Parser & Payment Gateway Webhook Ingestion
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §14, §70 / VMNL-AZP-VMN-CCPP-001 §18
 *
 * Core Mandate:
 * 1. Parses raw SWIFT MT940 text messages into structured bank transaction records.
 *    Handles tags:
 *    - :20: Transaction Reference Number
 *    - :25: Account Identification (NUBAN / IBAN)
 *    - :28C: Statement Number / Sequence
 *    - :60F: Opening Balance
 *    - :61: Statement Line (Value date, entry date, D/C indicator, amount, transaction type, customer reference)
 *    - :86: Information to Account Owner (Narration / transaction details)
 *    - :62F: Closing Balance
 * 2. Ingests and verifies signatures for Paystack and Flutterwave payment webhooks.
 */

import crypto from "crypto";
import { BankTransactionRecord } from "./index.js";
import { toKobo, fromKobo, parseDecimalToKobo } from "../../../core/domain/types.js";

export interface Mt940StatementHeader {
  transactionReference: string;
  accountNumber: string;
  statementNumber: string;
  currency: string;
  openingBalance: number;
  openingBalanceDate: Date;
}

export interface Mt940StatementLine {
  valueDate: Date;
  entryDate?: Date;
  isCredit: boolean;
  amountNgn: number;
  transactionType: string;
  reference: string;
  supplementaryDetails?: string;
  narration: string;
}

export interface ParsedMt940Statement {
  header: Mt940StatementHeader;
  lines: Mt940StatementLine[];
  closingBalance: number;
  closingBalanceDate: Date;
  totalCreditsNgn: number;
  totalDebitsNgn: number;
}

export class Mt940Parser {
  /**
   * Parses raw SWIFT MT940 bank statement text into a structured statement.
   */
  public static parse(rawText: string): ParsedMt940Statement {
    const lines = rawText.replace(/\r\n/g, "\n").split("\n");

    let transactionReference = "";
    let accountNumber = "";
    let statementNumber = "";
    let currency = "NGN";
    let openingBalance = 0;
    let openingBalanceDate = new Date();
    let closingBalance = 0;
    let closingBalanceDate = new Date();

    const statementLines: Mt940StatementLine[] = [];
    let currentLine: Partial<Mt940StatementLine> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith(":20:")) {
        transactionReference = line.substring(4).trim();
      } else if (line.startsWith(":25:")) {
        accountNumber = line.substring(4).trim();
      } else if (line.startsWith(":28C:") || line.startsWith(":28:")) {
        const secondColon = line.indexOf(":", 1);
        statementNumber = line.substring(secondColon + 1).trim();
      } else if (line.startsWith(":60F:") || line.startsWith(":60M:")) {
        // e.g. :60F:C260901NGN10000000,00
        const content = line.substring(5);
        const isCredit = content.charAt(0) === "C";
        const dateStr = content.substring(1, 7); // YYMMDD
        currency = content.substring(7, 10);
        const kobo = parseDecimalToKobo(content.substring(10));
        openingBalance = fromKobo(kobo) * (isCredit ? 1 : -1);
        openingBalanceDate = this.parseSwiftDate(dateStr);
      } else if (line.startsWith(":61:")) {
        // Commit previous line if exists
        if (currentLine && currentLine.amountNgn !== undefined) {
          statementLines.push({
            valueDate: currentLine.valueDate || new Date(),
            isCredit: currentLine.isCredit ?? true,
            amountNgn: currentLine.amountNgn,
            transactionType: currentLine.transactionType || "NTRF",
            reference: currentLine.reference || `REF-${statementLines.length + 1}`,
            narration: currentLine.narration || "Bank Transfer",
          });
        }

        // Parse :61:
        // Format: YYMMDD[MMDD]D/C[Mark]Amount,Decimal[Type][Reference]
        const content = line.substring(4);
        const valDateStr = content.substring(0, 6);
        const valueDate = this.parseSwiftDate(valDateStr);

        let remainder = content.substring(6);
        // Optional entry date MMDD
        if (/^\d{4}/.test(remainder)) {
          remainder = remainder.substring(4);
        }

        let isCredit = true;
        if (remainder.startsWith("CR") || remainder.startsWith("C")) {
          isCredit = true;
          remainder = remainder.replace(/^CR|^C/, "");
        } else if (remainder.startsWith("DR") || remainder.startsWith("D")) {
          isCredit = false;
          remainder = remainder.replace(/^DR|^D/, "");
        }

        // Optional funds code (1 char letter if uppercase)
        if (/^[A-Z]/.test(remainder) && !remainder.startsWith("N")) {
          remainder = remainder.substring(1);
        }

        // Amount ends at transaction code (4 chars like NTRF, NMSC, etc.)
        const match = remainder.match(/^([0-9]+,[0-9]{2}|[0-9]+(?:\.[0-9]{2})?)([A-Z]{4})(.*)$/);
        let amount = 0;
        let txType = "NTRF";
        let ref = "";

        if (match) {
          amount = fromKobo(parseDecimalToKobo(match[1]));
          txType = match[2];
          const rawRef = match[3].trim();
          ref = rawRef.includes("//") ? rawRef.split("//")[1].trim() : rawRef.replace(/^\/\//, "").trim();
        } else {
          // Fallback parsing
          const numMatch = remainder.match(/^[0-9,.]+/);
          if (numMatch) {
            amount = fromKobo(parseDecimalToKobo(numMatch[0]));
            ref = remainder.substring(numMatch[0].length).trim();
          }
        }

        currentLine = {
          valueDate,
          isCredit,
          amountNgn: amount,
          transactionType: txType,
          reference: ref || `TXN-${Date.now()}-${statementLines.length}`,
          narration: "",
        };
      } else if (line.startsWith(":86:")) {
        const narration = line.substring(4).trim();
        if (currentLine) {
          currentLine.narration = currentLine.narration
            ? `${currentLine.narration} ${narration}`
            : narration;
        }
      } else if (line.startsWith(":62F:") || line.startsWith(":62M:")) {
        if (currentLine && currentLine.amountNgn !== undefined) {
          statementLines.push({
            valueDate: currentLine.valueDate || new Date(),
            isCredit: currentLine.isCredit ?? true,
            amountNgn: currentLine.amountNgn,
            transactionType: currentLine.transactionType || "NTRF",
            reference: currentLine.reference || `REF-${statementLines.length + 1}`,
            narration: currentLine.narration || "Bank Transfer",
          });
          currentLine = null;
        }

        const content = line.substring(5);
        const isCredit = content.charAt(0) === "C";
        const dateStr = content.substring(1, 7);
        const kobo = parseDecimalToKobo(content.substring(10));
        closingBalance = fromKobo(kobo) * (isCredit ? 1 : -1);
        closingBalanceDate = this.parseSwiftDate(dateStr);
      }
    }

    if (currentLine && currentLine.amountNgn !== undefined) {
      statementLines.push({
        valueDate: currentLine.valueDate || new Date(),
        isCredit: currentLine.isCredit ?? true,
        amountNgn: currentLine.amountNgn,
        transactionType: currentLine.transactionType || "NTRF",
        reference: currentLine.reference || `REF-${statementLines.length + 1}`,
        narration: currentLine.narration || "Bank Transfer",
      });
    }

    const totalCreditsKobo = statementLines
      .filter((l) => l.isCredit)
      .reduce((sum, l) => sum + toKobo(l.amountNgn), 0);

    const totalDebitsKobo = statementLines
      .filter((l) => !l.isCredit)
      .reduce((sum, l) => sum + toKobo(l.amountNgn), 0);

    const totalCreditsNgn = fromKobo(totalCreditsKobo);
    const totalDebitsNgn = fromKobo(totalDebitsKobo);

    return {
      header: {
        transactionReference,
        accountNumber,
        statementNumber,
        currency,
        openingBalance,
        openingBalanceDate,
      },
      lines: statementLines,
      closingBalance,
      closingBalanceDate,
      totalCreditsNgn,
      totalDebitsNgn,
    };
  }

  /**
   * Converts parsed MT940 statement lines to canonical BankTransactionRecord items.
   */
  public static toBankTransactionRecords(statement: ParsedMt940Statement): BankTransactionRecord[] {
    return statement.lines.map((line, idx) => ({
      id: `MT940-${statement.header.statementNumber || "STMT"}-${idx + 1}`,
      source: "NIBSS_NIP",
      transactionReference: line.reference,
      bankNarration: line.narration || `SWIFT MT940 ${line.transactionType}`,
      amountNgn: line.amountNgn,
      valueDate: line.valueDate,
    }));
  }

  private static parseSwiftDate(yymmdd: string): Date {
    if (yymmdd.length !== 6) return new Date();
    const year = 2000 + parseInt(yymmdd.substring(0, 2), 10);
    const month = parseInt(yymmdd.substring(2, 4), 10) - 1;
    const day = parseInt(yymmdd.substring(4, 6), 10);
    return new Date(Date.UTC(year, month, day));
  }
}

export class PaymentGatewayWebhookValidator {
  /**
   * Verifies Paystack HMAC-SHA512 webhook signature using constant-time comparison.
   */
  public static verifyPaystackSignature(rawBody: string, signatureHeader: string, secretKey: string): boolean {
    if (!signatureHeader || !secretKey) return false;
    const hash = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");
    const hashBuf = Buffer.from(hash, "utf8");
    const sigBuf = Buffer.from(signatureHeader, "utf8");
    if (hashBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, sigBuf);
  }

  /**
   * Verifies Flutterwave secret hash webhook header using constant-time comparison.
   */
  public static verifyFlutterwaveSignature(secretHashHeader: string, configuredSecretHash: string): boolean {
    if (!secretHashHeader || !configuredSecretHash) return false;
    const headerBuf = Buffer.from(secretHashHeader, "utf8");
    const configuredBuf = Buffer.from(configuredSecretHash, "utf8");
    if (headerBuf.length !== configuredBuf.length) return false;
    return crypto.timingSafeEqual(headerBuf, configuredBuf);
  }
}
