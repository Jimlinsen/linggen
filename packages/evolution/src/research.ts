/**
 * @nutshell/evolution — SelfResearchEngine
 *
 * The world analyzes its own knowledge gaps, generates search queries,
 * fetches from the web, and integrates results into its knowledge base.
 * Knowledge anchors directly to the source (not through the seed).
 */

import { randomUUID } from "crypto";
import type {
  WorldState,
  KnowledgeEntry,
  ResearchGap,
  RawSearchResult,
  SeedDimension,
  EvolutionConfig,
  WorldEvent,
} from "./types.js";
import { WorldStateDB } from "./state.js";
import { callLLM } from "./llm.js";

// ─── SEARCH QUERY TEMPLATES ───────────────────────────────────────────────────

const QUERY_TEMPLATES: Record<string, Record<string, string[]>> = {
  myth: {
    cosmogony: [
      "{tradition} creation myth scholarly analysis",
      "{tradition} cosmogony primary sources",
    ],
    death: [
      "{tradition} afterlife beliefs ancient scholarship",
      "{tradition} death ritual underworld",
    ],
    divine_human: [
      "{tradition} gods humans relationship ancient texts",
      "{tradition} divine intervention mythology",
    ],
    aesthetic: [
      "{tradition} art symbolism visual culture",
      "{tradition} sacred aesthetics ancient",
    ],
    tension: [
      "{tradition} core philosophical conflict mythology",
      "{tradition} good evil cosmic opposition",
    ],
  },
  fiction: {
    cosmogony: [
      '"{title}" world building lore analysis',
      '"{title}" universe creation explained',
    ],
    tension: [
      '"{title}" themes philosophical analysis',
      '"{author}" {title} worldview interview',
    ],
    aesthetic: [
      '"{title}" visual design aesthetic analysis',
      '"{title}" world atmosphere tone',
    ],
    death: [
      '"{title}" death afterlife lore',
      '"{title}" mortality theme analysis',
    ],
    divine_human: [
      '"{title}" power hierarchy system explained',
      '"{title}" authority structure lore',
    ],
  },
  chinese: {
    cosmogony: [
      "{title} 宇宙观 学术研究",
      "{title} 世界起源 文化分析",
    ],
    tension: [
      "{title} 核心主题 文学分析",
      "{author} {title} 创作思想",
    ],
    aesthetic: [
      "{title} 审美风格 艺术特征",
      "{title} 意象 符号 研究",
    ],
  },
};

// Classify a world's tradition type
function classifyTradition(tradition_key: string): "myth" | "fiction" | "chinese" {
  const myths = ["greek", "norse", "zoroastrian", "vedic", "egyptian",
    "mesopotamian", "celtic", "shinto", "taoist", "mayan", "tibetan", "aztec"];
  const chinese = ["xiyouji", "fengshen", "hongloumeng", "wuxia", "threebody"];
  if (myths.includes(tradition_key)) return "myth";
  if (chinese.includes(tradition_key)) return "chinese";
  return "fiction";
}

// ─── SELF RESEARCH ENGINE ─────────────────────────────────────────────────────

export class SelfResearchEngine {
  private config: EvolutionConfig;
  private db: WorldStateDB;
  private searchFn: (query: string) => Promise<RawSearchResult[]>;

  constructor(
    config: EvolutionConfig,
    db: WorldStateDB,
    searchFn: (query: string) => Promise<RawSearchResult[]>
  ) {
    this.config = config;
    this.db = db;
    this.searchFn = searchFn;
  }

  // ─── GAP DETECTION ──────────────────────────────────────────────────────────

  detectGaps(world: WorldState): ResearchGap[] {
    const dims: SeedDimension[] = [
      "cosmogony", "ontology", "time", "fate", "divine_human",
      "death", "tension", "aesthetic", "symbols", "seed_essence",
    ];

    const existing = this.db.getKnowledge(world.id);
    const dimCounts: Record<string, number> = {};
    existing.forEach(e => {
      dimCounts[e.dimension] = (dimCounts[e.dimension] || 0) + e.content.length;
    });

    const gaps: ResearchGap[] = [];

    for (const dim of dims) {
      const seedContent = world.seed[dim] || "";
      const knowledgeChars = dimCounts[dim] || 0;
      const seedChars = seedContent.length;

      // Gap detected if knowledge is less than 3x the seed content
      // (seed is compressed; knowledge should be much richer)
      if (knowledgeChars < seedChars * 3 || knowledgeChars < 500) {
        const priority = seedChars > 0
          ? 1 - (knowledgeChars / Math.max(seedChars * 5, 2000))
          : 0.8;

        gaps.push({
          dimension: dim,
          reason: knowledgeChars === 0
            ? `No knowledge for dimension "${dim}" yet`
            : `Knowledge (${knowledgeChars} chars) is thin relative to seed (${seedChars} chars)`,
          priority: Math.min(priority, 1.0),
          suggested_queries: [],
        });
      }
    }

    return gaps.sort((a, b) => b.priority - a.priority);
  }

  // ─── QUERY GENERATION ───────────────────────────────────────────────────────

  generateQueries(gap: ResearchGap, world: WorldState): string[] {
    const type = classifyTradition(world.tradition_key);
    const templates = QUERY_TEMPLATES[type]?.[gap.dimension] || QUERY_TEMPLATES.fiction[gap.dimension] || [];

    // Fill template variables
    const vars: Record<string, string> = {
      tradition: world.tradition_key,
      title: world.seed["tradition_name"] || world.tradition_key,
      author: this.guessAuthor(world.tradition_key),
    };

    return templates.map(t =>
      t.replace(/\{(\w+)\}/g, (_, k) => vars[k] || world.tradition_key)
    );
  }

  private guessAuthor(tradition_key: string): string {
    const authors: Record<string, string> = {
      fma: "Hiromu Arakawa", naruto: "Masashi Kishimoto",
      onepiece: "Eiichiro Oda", bleach: "Tite Kubo",
      dragonball: "Akira Toriyama", eva: "Hideaki Anno",
      starwars: "George Lucas", dune: "Frank Herbert",
      matrix: "Wachowskis", foundation: "Isaac Asimov",
      lotr: "Tolkien", hp: "J.K. Rowling",
      threebody: "刘慈欣", hongloumeng: "曹雪芹",
      fengshen: "许仲琳", xiyouji: "吴承恩",
    };
    return authors[tradition_key] || "";
  }

  // ─── RESEARCH CYCLE ─────────────────────────────────────────────────────────

  async researchCycle(world: WorldState): Promise<WorldEvent | null> {
    // 1. Detect gaps
    const gaps = this.detectGaps(world);
    if (!gaps.length) return null;

    // 2. Take top 2 gaps
    const topGaps = gaps.slice(0, 2);
    const allQueries = topGaps.flatMap(g => this.generateQueries(g, world));

    // 3. Search (parallel, max 4)
    const queryBatch = allQueries.slice(0, 4);
    const rawResults = await Promise.allSettled(
      queryBatch.map(q => this.searchFn(q))
    );

    const results: RawSearchResult[] = rawResults
      .filter((r): r is PromiseFulfilledResult<RawSearchResult[]> => r.status === "fulfilled")
      .flatMap(r => r.value);

    if (!results.length) return null;

    // 4. Filter for relevance
    const relevant = await this.filterByRelevance(results, world);
    if (!relevant.length) return null;

    // 5. Integrate into knowledge base
    const entries = await this.integrate(relevant, world, topGaps);
    entries.forEach(e => this.db.addKnowledge(e));

    // 6. Return as a world event
    const now = Date.now();
    const event: WorldEvent = {
      id: randomUUID(),
      world_id: world.id,
      timestamp: now,
      pulse_number: world.pulse_count,
      actor_id: "research_engine",
      actor_type: "research",
      event_type: "knowledge_enrichment",
      intent: `填补知识空洞：${topGaps.map(g => g.dimension).join(", ")}`,
      narrative: `世界向来源汲取知识。${entries.length} 条新知识被整合进知识库，涵盖维度：${topGaps.map(g => g.dimension).join("、")}。`,
      delta_seed: {},
      delta_knowledge: entries.map(e => e.id),
      sources: [],
      maturity_before: world.stage,
      maturity_after: world.stage,
    };

    return event;
  }

  // ─── RELEVANCE FILTER ───────────────────────────────────────────────────────

  private async filterByRelevance(
    results: RawSearchResult[],
    world: WorldState
  ): Promise<RawSearchResult[]> {
    if (!results.length) return [];

    const system = `You are a relevance filter for a world knowledge base.`;
    const user = `World: "${world.seed["tradition_name"] || world.tradition_key}"

Filter these search results for relevance. Keep only results that directly concern this world's mythology, lore, themes, or source material.

Results:
${results.map((r, i) => `${i}: ${r.title} — ${r.snippet}`).join("\n")}

Return JSON array of indices to KEEP (e.g. [0, 2, 4]). Only return the JSON array.`;

    try {
      const response = await callLLM(this.config, system, user);
      const match = response.match(/\[[\d,\s]*\]/);
      if (!match) return results.slice(0, 3);
      const indices = JSON.parse(match[0]) as number[];
      return indices.filter(i => i >= 0 && i < results.length).map(i => results[i]);
    } catch {
      return results.slice(0, 3);
    }
  }

  // ─── KNOWLEDGE INTEGRATION ──────────────────────────────────────────────────

  private async integrate(
    results: RawSearchResult[],
    world: WorldState,
    gaps: ResearchGap[]
  ): Promise<KnowledgeEntry[]> {
    const system = `You are a knowledge curator for a world mythology/fiction knowledge base.`;
    const targetDims = gaps.map(g => g.dimension).join(", ");
    const user = `World: "${world.seed["tradition_name"] || world.tradition_key}"
Target dimensions: ${targetDims}

Extract and synthesize knowledge from these sources. For each relevant piece:
- Identify which dimension it belongs to
- Write a clear, accurate summary (100-300 words)
- Note the source URL

Sources:
${results.map(r => `URL: ${r.url}\nTitle: ${r.title}\nContent: ${r.snippet}`).join("\n---\n")}

Return JSON array:
[{
  "dimension": "dimension_name",
  "content": "synthesized knowledge summary",
  "source_url": "url",
  "relevance_score": 0.0-1.0
}]

Only return the JSON array.`;

    try {
      const response = await callLLM(this.config, system, user);
      const raw = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return [];

      const items = JSON.parse(match[0]) as Array<{
        dimension: string; content: string; source_url: string; relevance_score: number;
      }>;

      const now = Date.now();
      return items.map(item => ({
        id: randomUUID(),
        world_id: world.id,
        dimension: item.dimension as SeedDimension,
        content: item.content,
        source_url: item.source_url,
        source_type: "analysis" as const,
        relevance_score: Math.min(Math.max(item.relevance_score, 0), 1),
        added_at: now,
        used_in_events: [],
      }));
    } catch {
      return [];
    }
  }
}
