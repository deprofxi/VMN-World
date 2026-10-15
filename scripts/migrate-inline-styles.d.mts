export interface MigrationStats {
  migrated: number;
}

export interface RunOptions {
  roots?: string[];
  stylesOut?: string;
  dryRun?: boolean;
}

export interface RunResult {
  changed: number;
  migrated: number;
  classes: number;
  remaining: number;
}

export interface DuplicateAttribute {
  tag: string;
  name: string;
  count: number;
}

export function classNameFor(decl: string, classByDecl?: Map<string, string>): string;
export function duplicateAttributes(html: string): DuplicateAttribute[];
export function migrateSource(
  source: string,
  classByDecl?: Map<string, string>,
  stats?: MigrationStats
): string;
export function run(options?: RunOptions): RunResult;
