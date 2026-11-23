/**
 * Cr8Tech AI Agent OS Safety Armor & Boundary Enforcement Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §19, §34 / DEC-13 (AI Safety Framework) / FLOW-15
 *
 * Implements:
 * 1. Autonomy Level Framework (A0–A5) with strict permission ceilings.
 * 2. Semantic prompt-injection scanner detecting role-reversal, system prompt exfiltration, and delimiter attacks.
 * 3. Tool execution boundary gating preventing privilege escalation.
 * 4. Automatic circuit breaker that fails closed upon repeated safety threshold breaches.
 */

export enum AgentAutonomyLevel {
  A0_READ_ONLY = 0,
  A1_ASSISTIVE_DRAFT = 1,
  A2_SEMI_AUTONOMOUS = 2,
  A3_AUTONOMOUS_BOUNDED = 3,
  A4_HIGH_CONSEQUENCE = 4,
  A5_SUPERVISED_SYSTEM = 5,
}

export interface ToolDefinition {
  name: string;
  category: "READ" | "DRAFT" | "MUTATE_BOUNDED" | "CONSEQUENTIAL" | "SYSTEM";
  minimumAutonomy: AgentAutonomyLevel;
  requiredClaim: string;
  isHighConsequence: boolean;
}

export interface PromptScanResult {
  safe: boolean;
  threatLevel: "NONE" | "LOW" | "HIGH" | "CRITICAL";
  detectedPatterns: string[];
  sanitizedInput?: string;
  auditExplanation: string;
}

export interface ToolExecutionDecision {
  permitted: boolean;
  decision: "ALLOW" | "DENIED_INSUFFICIENT_AUTONOMY" | "DENIED_PROMPT_INJECTION" | "DENIED_CIRCUIT_BREAKER_TRIPPED";
  agentId: string;
  toolName: string;
  autonomyLevel: AgentAutonomyLevel;
  requiredAutonomy: AgentAutonomyLevel;
  reason: string;
}

export class Cr8TechSafetyArmor {
  private static readonly INJECTION_SIGNATURES: Array<{ pattern: RegExp; severity: "HIGH" | "CRITICAL"; label: string }> = [
    { pattern: /ignore\s+(all\s+)?(previous|prior)\s+(instructions|directives|prompts)/i, severity: "CRITICAL", label: "PROMPT_OVERRIDE_DIRECTIVE" },
    { pattern: /disregard\s+(all\s+)?(previous|prior)\s+rules/i, severity: "CRITICAL", label: "RULE_DISREGARD_DIRECTIVE" },
    { pattern: /you\s+are\s+now\s+(an?\s+)?(unrestricted|jailbroken|unfiltered|dan\b)/i, severity: "CRITICAL", label: "JAILBREAK_ROLE_REVERSAL" },
    { pattern: /(output|repeat|print|reveal)\s+(the\s+)?(system\s+prompt|developer\s+instructions)/i, severity: "HIGH", label: "SYSTEM_PROMPT_EXFILTRATION" },
    { pattern: /<\|\s*im_start\s*\|>|<\|\s*im_end\s*\|>|\[SYSTEM_OVERRIDE\]/i, severity: "CRITICAL", label: "DELIMITER_INJECTION_ATTACK" },
    { pattern: /bypass\s+(safety|content|governance)\s+(filter|controls?|guardrails?)/i, severity: "HIGH", label: "GUARDRAIL_BYPASS_ATTEMPT" },
    { pattern: /;\s*DROP\s+TABLE\b|UNION\s+SELECT\b|<\s*script\b/i, severity: "CRITICAL", label: "CODE_EXECUTION_PAYLOAD" },
  ];

  private static sessionViolations: Record<string, number> = {};
  private static circuitTripped: Record<string, boolean> = {};
  private static readonly MAX_VIOLATIONS_BEFORE_CIRCUIT_TRIP = 3;

  /**
   * Scans an inbound prompt or tool input parameter for semantic injection markers.
   */
  public static scanPrompt(input: string): PromptScanResult {
    const detected: string[] = [];
    let highestSeverity: "NONE" | "LOW" | "HIGH" | "CRITICAL" = "NONE";

    for (const sig of Cr8TechSafetyArmor.INJECTION_SIGNATURES) {
      if (sig.pattern.test(input)) {
        detected.push(sig.label);
        if (sig.severity === "CRITICAL" || highestSeverity === "NONE") {
          highestSeverity = sig.severity;
        }
      }
    }

    if (detected.length > 0) {
      return {
        safe: false,
        threatLevel: highestSeverity,
        detectedPatterns: detected,
        auditExplanation: `Prompt security violation detected: Input triggered ${detected.length} threat signature(s): [${detected.join(", ")}]. Execution halted under DEC-13 safety framework.`,
      };
    }

    return {
      safe: true,
      threatLevel: "NONE",
      detectedPatterns: [],
      sanitizedInput: input.trim(),
      auditExplanation: "Input passed semantic injection screening with zero detected safety anomalies.",
    };
  }

  /**
   * Evaluates whether an AI agent with a given autonomy level is authorized to invoke a tool.
   */
  public static evaluateToolInvocation(
    agentId: string,
    agentAutonomy: AgentAutonomyLevel,
    tool: ToolDefinition,
    toolInputPrompt?: string
  ): ToolExecutionDecision {
    // 1. Check circuit breaker status
    if (Cr8TechSafetyArmor.circuitTripped[agentId]) {
      return {
        permitted: false,
        decision: "DENIED_CIRCUIT_BREAKER_TRIPPED",
        agentId,
        toolName: tool.name,
        autonomyLevel: agentAutonomy,
        requiredAutonomy: tool.minimumAutonomy,
        reason: `Agent '${agentId}' is locked under an active circuit breaker. Safety threshold breached (${Cr8TechSafetyArmor.sessionViolations[agentId] || 0} violations). Manual administrative reset required.`,
      };
    }

    // 2. Scan input prompt if provided
    if (toolInputPrompt) {
      const scan = Cr8TechSafetyArmor.scanPrompt(toolInputPrompt);
      if (!scan.safe) {
        Cr8TechSafetyArmor.recordViolation(agentId);
        return {
          permitted: false,
          decision: "DENIED_PROMPT_INJECTION",
          agentId,
          toolName: tool.name,
          autonomyLevel: agentAutonomy,
          requiredAutonomy: tool.minimumAutonomy,
          reason: `Tool execution blocked: Inbound parameters failed semantic prompt inspection (${scan.detectedPatterns.join(", ")}).`,
        };
      }
    }

    // 3. Check autonomy level ceiling
    if (agentAutonomy < tool.minimumAutonomy) {
      Cr8TechSafetyArmor.recordViolation(agentId);
      return {
        permitted: false,
        decision: "DENIED_INSUFFICIENT_AUTONOMY",
        agentId,
        toolName: tool.name,
        autonomyLevel: agentAutonomy,
        requiredAutonomy: tool.minimumAutonomy,
        reason: `Insufficient Agent Autonomy: Tool '${tool.name}' requires Level ${tool.minimumAutonomy} (${AgentAutonomyLevel[tool.minimumAutonomy]}), but agent is assigned Level ${agentAutonomy} (${AgentAutonomyLevel[agentAutonomy]}). Consequential action requires human delegation.`,
      };
    }

    return {
      permitted: true,
      decision: "ALLOW",
      agentId,
      toolName: tool.name,
      autonomyLevel: agentAutonomy,
      requiredAutonomy: tool.minimumAutonomy,
      reason: `Authorized: Tool '${tool.name}' permitted under Agent Autonomy Level ${agentAutonomy}.`,
    };
  }

  private static recordViolation(agentId: string): void {
    const current = (Cr8TechSafetyArmor.sessionViolations[agentId] || 0) + 1;
    Cr8TechSafetyArmor.sessionViolations[agentId] = current;
    if (current >= Cr8TechSafetyArmor.MAX_VIOLATIONS_BEFORE_CIRCUIT_TRIP) {
      Cr8TechSafetyArmor.circuitTripped[agentId] = true;
    }
  }

  public static resetCircuitBreaker(agentId: string): void {
    delete Cr8TechSafetyArmor.sessionViolations[agentId];
    delete Cr8TechSafetyArmor.circuitTripped[agentId];
  }

  public static _clearForTesting(): void {
    Cr8TechSafetyArmor.sessionViolations = {};
    Cr8TechSafetyArmor.circuitTripped = {};
  }
}
