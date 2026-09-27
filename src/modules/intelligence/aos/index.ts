/**
 * Agentic Operating System (AOS) Governance & Supervisor Runtime
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §58 / VMNL-AZP-VMN-CCPP-001 §19
 *
 * Core Mandate:
 * Governed AI agent operational framework.
 * Agents augment human operators; they NEVER govern.
 * Hard Policy Gates:
 * - Unsupervised financial disbursement, contract signing, or live broadcast schedule publication is HARD-BLOCKED.
 * - Every agent action requiring high privilege must pass through a Human-in-the-Loop (HITL) supervisor queue.
 * - Global and per-agent Kill Switches.
 */

import { createHash } from "node:crypto";
import { AgentStatus } from "../../../core/domain/types.js";

export type AgentRoleType =
  | "SCHEDULE_OPTIMIZER"
  | "TRAFFIC_AUDITOR"
  | "TALENT_MATCH_ASSISTANT"
  | "ROYALTY_RECONCILER"
  | "SUBTITLE_TRANSCRIBER";

export type ActionCriticality = "LOW_INFORMATIONAL" | "MEDIUM_DRAFT" | "HIGH_SCHEDULE" | "CRITICAL_FINANCIAL";

export type ProposalStatus = "PENDING_SUPERVISOR_APPROVAL" | "APPROVED" | "REJECTED" | "OVERRIDDEN";

export interface RegisteredAgent {
  id: string;
  name: string;
  role: AgentRoleType;
  operationalScope: string;
  allowedTools: string[];
  maxDailyActions: number;
  actionsPerformedToday: number;
  status: AgentStatus;
  killSwitchEngaged: boolean;
  registeredAt: Date;
}

export interface AgentProposal {
  id: string;
  agentId: string;
  criticality: ActionCriticality;
  targetDomain: "BROADCAST" | "FINANCE" | "TALENT" | "PRODUCTION";
  proposedAction: string;
  payload: Record<string, unknown>;
  status: ProposalStatus;
  supervisorNotes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  auditHashSha256: string;
  createdAt: Date;
}

export interface AgentAuditRecord {
  id: string;
  agentId: string;
  proposalId?: string;
  actionTaken: string;
  wasBlocked: boolean;
  reason?: string;
  timestamp: Date;
}

export class AgenticOperatingSystem {
  private agents = new Map<string, RegisteredAgent>();
  private proposals = new Map<string, AgentProposal>();
  private auditLog: AgentAuditRecord[] = [];
  private globalKillSwitch: boolean = false;

  public registerAgent(agent: RegisteredAgent): RegisteredAgent {
    if (this.agents.has(agent.id)) {
      throw new Error(`[AOS-REG-01] Agent '${agent.id}' already registered.`);
    }
    this.agents.set(agent.id, agent);
    return agent;
  }

  public getAgent(id: string): RegisteredAgent | undefined {
    return this.agents.get(id);
  }

  public engageGlobalKillSwitch(reason: string): void {
    this.globalKillSwitch = true;
    for (const agent of this.agents.values()) {
      agent.status = "PAUSED";
      agent.killSwitchEngaged = true;
    }
    this.recordAudit({
      agentId: "SYSTEM",
      actionTaken: `GLOBAL_KILL_SWITCH_ENGAGED: ${reason}`,
      wasBlocked: false,
    });
  }

  public disengageGlobalKillSwitch(): void {
    this.globalKillSwitch = false;
    for (const agent of this.agents.values()) {
      agent.status = "ACTIVE";
      agent.killSwitchEngaged = false;
    }
    this.recordAudit({
      agentId: "SYSTEM",
      actionTaken: "GLOBAL_KILL_SWITCH_DISENGAGED",
      wasBlocked: false,
    });
  }

  public engageAgentKillSwitch(agentId: string): void {
    const agent = this.getAgentOrThrow(agentId);
    agent.killSwitchEngaged = true;
    agent.status = "PAUSED";
    this.recordAudit({
      agentId,
      actionTaken: "AGENT_KILL_SWITCH_ENGAGED",
      wasBlocked: false,
    });
  }

  /**
   * Evaluates and submits an agent proposal.
   * INVARIANT: High and Critical criticality actions CANNOT execute automatically.
   * They must enter the Human-in-the-Loop review queue.
   */
  public submitProposal(params: {
    id: string;
    agentId: string;
    criticality: ActionCriticality;
    targetDomain: "BROADCAST" | "FINANCE" | "TALENT" | "PRODUCTION";
    proposedAction: string;
    payload: Record<string, unknown>;
  }): AgentProposal {
    if (this.globalKillSwitch) {
      throw new Error("[AOS-EXEC-01] Proposal rejected: Global Agent Kill Switch is engaged.");
    }

    const agent = this.getAgentOrThrow(params.agentId);
    if (agent.killSwitchEngaged || agent.status !== "ACTIVE") {
      throw new Error(`[AOS-EXEC-02] Agent '${params.agentId}' is inactive or kill switch is engaged.`);
    }

    if (agent.actionsPerformedToday >= agent.maxDailyActions) {
      throw new Error(`[AOS-EXEC-03] Agent '${params.agentId}' exceeded daily action quota.`);
    }

    const createdAt = new Date();
    const hashData = `${params.id}:${params.agentId}:${params.criticality}:${JSON.stringify(params.payload)}:${createdAt.toISOString()}`;
    const auditHashSha256 = createHash("sha256").update(hashData).digest("hex");

    const proposal: AgentProposal = {
      ...params,
      status: "PENDING_SUPERVISOR_APPROVAL",
      auditHashSha256,
      createdAt,
    };

    agent.actionsPerformedToday += 1;
    this.proposals.set(proposal.id, proposal);

    this.recordAudit({
      agentId: agent.id,
      proposalId: proposal.id,
      actionTaken: `SUBMITTED_PROPOSAL: ${params.proposedAction}`,
      wasBlocked: false,
    });

    return proposal;
  }

  /**
   * Human supervisor gate approval.
   * INVARIANT: No agent action with HIGH or CRITICAL criticality can be finalized without this!
   */
  public supervisorReview(params: {
    proposalId: string;
    supervisorId: string;
    decision: "APPROVE" | "REJECT" | "OVERRIDE";
    notes?: string;
  }): AgentProposal {
    const proposal = this.proposals.get(params.proposalId);
    if (!proposal) {
      throw new Error(`[AOS-REV-01] Proposal '${params.proposalId}' not found.`);
    }

    if (proposal.status !== "PENDING_SUPERVISOR_APPROVAL") {
      throw new Error(`[AOS-REV-02] Proposal is in state '${proposal.status}', not pending approval.`);
    }

    if (params.decision === "APPROVE") {
      proposal.status = "APPROVED";
    } else if (params.decision === "REJECT") {
      proposal.status = "REJECTED";
    } else {
      proposal.status = "OVERRIDDEN";
    }

    proposal.approvedBy = params.supervisorId;
    proposal.approvedAt = new Date();
    proposal.supervisorNotes = params.notes;

    this.recordAudit({
      agentId: proposal.agentId,
      proposalId: proposal.id,
      actionTaken: `SUPERVISOR_${params.decision} by ${params.supervisorId}`,
      wasBlocked: params.decision === "REJECT",
      reason: params.notes,
    });

    return proposal;
  }

  /**
   * Hard-blocked execution assertion.
   * Proves that an agent CANNOT execute a sensitive financial or broadcast action autonomously.
   */
  public executeDirectAction(agentId: string, criticality: ActionCriticality): void {
    if (criticality === "HIGH_SCHEDULE" || criticality === "CRITICAL_FINANCIAL") {
      this.recordAudit({
        agentId,
        actionTaken: `ATTEMPTED_UNSUPERVISED_ACTION: ${criticality}`,
        wasBlocked: true,
        reason: "POLICY VIOLATION: Unsupervised high/critical actions are forbidden by AOS governance.",
      });
      throw new Error(
        `[AOS-GATE-01] HARD POLICY BLOCK: Action criticality '${criticality}' requires human supervisor approval.`
      );
    }
  }

  public getPendingProposals(): AgentProposal[] {
    return Array.from(this.proposals.values()).filter(
      (p) => p.status === "PENDING_SUPERVISOR_APPROVAL"
    );
  }

  public getAuditTrail(): AgentAuditRecord[] {
    return [...this.auditLog];
  }

  private recordAudit(record: Omit<AgentAuditRecord, "id" | "timestamp">): void {
    this.auditLog.push({
      ...record,
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date(),
    });
  }

  private getAgentOrThrow(id: string): RegisteredAgent {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new Error(`[AOS-ERR-404] Agent '${id}' not found.`);
    }
    return agent;
  }
}
