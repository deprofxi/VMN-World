/**
 * VMN Intelligence Operations & AOS Enterprise Database Repository
 * Authority: Canonical Law 13, CCPP §18, PRD §77
 *
 * Provides transactional persistence for AI agents, consequential proposals,
 * and the global AI emergency kill switch.
 */

import {
  normalizeRepositoryListOptions,
  paginateMemoryRows,
  RepositoryListOptions,
  RepositoryListPage,
} from "./pagination.js";

export interface AgentEntity {
  id: string;
  agentIdentifier: string;
  name: string;
  purpose: string;
  operationalScope: string;
  humanOwnerId: string;
  allowedTools: string[];
  status: "ACTIVE" | "PAUSED" | "TERMINATED";
  killSwitchEngaged: boolean;
  createdAt: Date;
  updatedAt: Date;
  source?: "DB" | "MEMORY";
}

export interface ProposalEntity {
  id: string;
  agentId: string;
  actionType: string;
  rationale: string;
  payloadJson: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedByUserId?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  source?: "DB" | "MEMORY";
}

const store = {
  memoryAgents: new Map<string, AgentEntity>(),
  memoryProposals: new Map<string, ProposalEntity>(),
  durableKillSwitch: false,
};

export async function saveAgent(agent: Omit<AgentEntity, "createdAt" | "updatedAt" | "source">): Promise<AgentEntity> {
  const entity: AgentEntity = {
    ...agent,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: "MEMORY",
  };

  store.memoryAgents.set(entity.id, entity);
  return entity;
}

export async function listAgents(
  options?: RepositoryListOptions
): Promise<RepositoryListPage<AgentEntity>> {
  const norm = normalizeRepositoryListOptions(options);
  const rows = Array.from(store.memoryAgents.values());
  return paginateMemoryRows(rows, (r) => r.id, norm);
}

export async function saveProposal(proposal: ProposalEntity): Promise<ProposalEntity> {
  const entity: ProposalEntity = { ...proposal, source: "MEMORY" };
  store.memoryProposals.set(entity.id, entity);
  return entity;
}

export async function listProposals(
  status?: "PENDING" | "APPROVED" | "REJECTED"
): Promise<ProposalEntity[]> {
  const items = Array.from(store.memoryProposals.values());
  if (status) return items.filter((p) => p.status === status);
  return items;
}

export async function setGlobalKillSwitch(active: boolean): Promise<boolean> {
  store.durableKillSwitch = active;
  return store.durableKillSwitch;
}

export async function getGlobalKillSwitch(): Promise<boolean> {
  return store.durableKillSwitch;
}
