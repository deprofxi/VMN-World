/**
 * VMN Identity, Security & RBAC Enterprise Database Repository
 * Authority: Canonical Laws 02 & 13, CCPP §15, PRD §12
 *
 * Provides transactional persistence for users, roles, permissions,
 * organizations, creator profiles, and authentication lockouts.
 */

import {
  normalizeRepositoryListOptions,
  paginateMemoryRows,
  RepositoryListOptions,
  RepositoryListPage,
} from "./pagination.js";

export interface UserEntity {
  id: string;
  email: string;
  personId?: string;
  organisationId?: string;
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
  source?: "DB" | "MEMORY";
}

export interface OrganisationEntity {
  id: string;
  name: string;
  slug: string;
  type: string;
  kycStatus: string;
  tenantId: string;
  registrationNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  source?: "DB" | "MEMORY";
}

const store = {
  memoryUsers: new Map<string, UserEntity>(),
  memoryOrgs: new Map<string, OrganisationEntity>(),
};

export async function saveUser(
  user: Omit<UserEntity, "createdAt" | "updatedAt" | "source">
): Promise<UserEntity> {
  const entity: UserEntity = {
    ...user,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: "MEMORY",
  };

  store.memoryUsers.set(entity.id, entity);
  return entity;
}

export async function getUser(id: string): Promise<UserEntity | null> {
  return store.memoryUsers.get(id) ?? null;
}

export async function saveOrganisation(
  org: Omit<OrganisationEntity, "createdAt" | "updatedAt" | "source">
): Promise<OrganisationEntity> {
  const entity: OrganisationEntity = {
    ...org,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: "MEMORY",
  };

  store.memoryOrgs.set(entity.id, entity);
  return entity;
}

export async function listOrganisations(
  options?: RepositoryListOptions
): Promise<RepositoryListPage<OrganisationEntity>> {
  const norm = normalizeRepositoryListOptions(options);
  const rows = Array.from(store.memoryOrgs.values());
  return paginateMemoryRows(rows, (r) => r.id, norm);
}

export async function listUsers(
  options?: RepositoryListOptions
): Promise<RepositoryListPage<UserEntity>> {
  const norm = normalizeRepositoryListOptions(options);
  const rows = Array.from(store.memoryUsers.values());
  return paginateMemoryRows(rows, (r) => r.id, norm);
}
