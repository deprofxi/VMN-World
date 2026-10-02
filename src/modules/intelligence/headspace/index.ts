/**
 * HeadspaceNG Knowledge Base & Media Intelligence Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §26, §54 / VMNL-AZP-VMN-CCPP-001 §15
 *
 * Core Mandate:
 * Central enterprise IP repository, legal precedents, Nigerian media consumption market intelligence,
 * and semantic search with strict role-based document access controls.
 */

export type DocumentCategory =
  | "IP_BIBLE"
  | "SCRIPT_TREATMENT"
  | "LEGAL_TEMPLATE"
  | "RATE_BENCHMARK"
  | "MARKET_INTELLIGENCE"
  | "REGULATORY_CODE";

export type ConfidentialityLevel = "PUBLIC" | "INTERNAL" | "RESTRICTED_LEGAL" | "EXECUTIVE_ONLY";

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  confidentiality: ConfidentialityLevel;
  content: string;
  tags: string[];
  embeddingVector?: number[]; // Normalized vector for semantic search
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  document: KnowledgeDocument;
  score: number; // Relevance score 0.0 - 1.0
  matchedSnippet: string;
}

export class HeadspaceKnowledgeEngine {
  private documents = new Map<string, KnowledgeDocument>();

  constructor() {
    this.seedDefaultKnowledgeBase();
  }

  private seedDefaultKnowledgeBase(): void {
    const defaultDocs: KnowledgeDocument[] = [
      {
        id: "DOC-NBC-CODE-01",
        title: "Nigeria Broadcasting Code (7th Edition) Compliance Summary",
        category: "REGULATORY_CODE",
        confidentiality: "INTERNAL",
        content:
          "The National Broadcasting Commission (NBC) 7th Edition rules mandate 60% local content quota on Nigerian linear television channels. Watershed period for mature content is strictly 22:00 to 05:00. Commercial advertising must not exceed 14 minutes per hour of broadcast.",
        tags: ["NBC", "Regulation", "Local Content", "Watershed", "Advertising Quota"],
        authorId: "LEGAL-TEAM-01",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "DOC-RATE-2026",
        title: "VMN Production & Creative Guild Rate Card Benchmark 2026",
        category: "RATE_BENCHMARK",
        confidentiality: "INTERNAL",
        content:
          "Standard Nollywood crew rate benchmarks for 2026: Director of Photography verified tier: 100,000 NGN/day; Lead Editor: 60,000 NGN/day; Sound Recordist with equipment: 50,000 NGN/day; Production Manager: 70,000 NGN/day.",
        tags: ["Rate Card", "Talent", "Crew", "Salaries", "Nollywood"],
        authorId: "PRODUCTION-HUB-01",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "DOC-IP-NIGEZIE-BIBLE",
        title: "Nigezie Xtreme Channel Master Brand & Programming Bible",
        category: "IP_BIBLE",
        confidentiality: "EXECUTIVE_ONLY",
        content:
          "Nigezie Xtreme (NXTR) broadcasts on StarTimes Channel 428 DTT and 312 DTH. Core pillars: 24/7 urban youth music, street culture, afrobeat charts, concert live specials. Target audience: 16-30 urban trendsetters across Nigeria and West Africa.",
        tags: ["Nigezie", "NXTR", "Brand Bible", "Youth", "Afrobeat"],
        authorId: "EXEC-OFFICE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const doc of defaultDocs) {
      this.documents.set(doc.id, doc);
    }
  }

  public registerDocument(doc: KnowledgeDocument): KnowledgeDocument {
    if (this.documents.has(doc.id)) {
      throw new Error(`[HSP-DOC-01] Document '${doc.id}' already exists.`);
    }
    this.documents.set(doc.id, doc);
    return doc;
  }

  /**
   * Read accessor for the research-desk catalogue projection (SCR-18 tail).
   * Returns canonical knowledge documents only; confidentiality is still
   * enforced per document at access time (getDocument/search).
   */
  public listDocuments(): KnowledgeDocument[] {
    return Array.from(this.documents.values());
  }

  public getDocument(id: string, userConfidentialityLevel: ConfidentialityLevel): KnowledgeDocument {
    const doc = this.documents.get(id);
    if (!doc) {
      throw new Error(`[HSP-ERR-404] Document '${id}' not found.`);
    }

    if (!this.canAccessConfidentiality(userConfidentialityLevel, doc.confidentiality)) {
      throw new Error(
        `[HSP-AUTH-01] Access denied: User level '${userConfidentialityLevel}' cannot access '${doc.confidentiality}' documents.`
      );
    }
    return doc;
  }

  /**
   * Semantic and keyword search with strict confidentiality filtering.
   */
  public search(
    query: string,
    userLevel: ConfidentialityLevel,
    filterCategory?: DocumentCategory
  ): SearchResult[] {
    const lowerQuery = query.toLowerCase();
    const queryTerms = lowerQuery.split(/\s+/).filter(Boolean);
    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      // 1. Confidentiality check
      if (!this.canAccessConfidentiality(userLevel, doc.confidentiality)) {
        continue;
      }

      // 2. Category filter
      if (filterCategory && doc.category !== filterCategory) {
        continue;
      }

      // 3. Keyword / semantic score simulation
      const docText = `${doc.title} ${doc.content} ${doc.tags.join(" ")}`.toLowerCase();
      let matchCount = 0;
      for (const term of queryTerms) {
        if (docText.includes(term)) {
          matchCount += 1;
        }
      }

      if (matchCount > 0) {
        const score = Math.min(1.0, matchCount / queryTerms.length);
        const snippetIndex = docText.indexOf(queryTerms[0]);
        const snippetStart = Math.max(0, snippetIndex - 30);
        const snippetEnd = Math.min(doc.content.length, snippetIndex + 120);
        const matchedSnippet = "..." + doc.content.substring(snippetStart, snippetEnd) + "...";

        results.push({
          document: doc,
          score,
          matchedSnippet,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private canAccessConfidentiality(
    userLevel: ConfidentialityLevel,
    documentLevel: ConfidentialityLevel
  ): boolean {
    const rank: Record<ConfidentialityLevel, number> = {
      PUBLIC: 0,
      INTERNAL: 1,
      RESTRICTED_LEGAL: 2,
      EXECUTIVE_ONLY: 3,
    };
    return rank[userLevel] >= rank[documentLevel];
  }
}
