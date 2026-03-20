/**
 * @nutshell/evolution — Types
 *
 * All types for the world evolution system.
 * Extends @nutshell/core's WorldSeed and Soul types.
 */

// ─── SEED DIMENSIONS ──────────────────────────────────────────────────────────

export type SeedDimension =
  | "cosmogony"
  | "ontology"
  | "time"
  | "fate"
  | "divine_human"
  | "death"
  | "tension"
  | "aesthetic"
  | "symbols"
  | "seed_essence";

// ─── MATURITY ─────────────────────────────────────────────────────────────────

export type MaturityStage = 0 | 1 | 2 | 3 | 4;

export const MATURITY_STAGE_NAMES: Record<MaturityStage, string> = {
  0: "萌芽 Seedling",
  1: "理解 Understanding",
  2: "推导 Derivation",
  3: "超越 Transcendence",
  4: "涌现 Emergence",
};

export interface DimScore {
  dimension: SeedDimension;
  /** Alignment with the actual source (work/myth/civilization), not the seed */
  source_alignment: number;      // 0.0~1.0
  /** How well the character can derive content the source never stated */
  derivation_depth: number;      // 0.0~1.0
  /** Count of novel, source-consistent content generated beyond the source */
  novel_content_count: number;
}

export interface MaturityReport {
  world_id: string;
  stage: MaturityStage;
  stage_name: string;
  /** Progress within the current stage (0.0~1.0) */
  overall_score: number;

  // Stage-specific scores
  source_coverage: number;       // Stage 0→1: how much of the source is reflected
  derivation_quality: number;    // Stage 1→2: ability to infer unstated content
  transcendence_score: number;   // Stage 2→3: generated content passes author-recognition test
  emergence_index: number;       // Stage 3→4: world generates independently creative content

  dim_scores: Partial<Record<SeedDimension, DimScore>>;
  weakest_dims: SeedDimension[];
  recommendation: EvolutionRecommendation;

  tested_at: number;
  tested_characters: string[];
}

export type EvolutionRecommendation =
  | "research"       // Focus self-research to fill knowledge gaps
  | "evolve"         // Run tension-driven evolution
  | "test"           // Run character derivation tests
  | "expand"         // World is mature enough to branch/expand
  | "transcend";     // Trigger transcendence event generation

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────

export type SourceType = "wiki" | "academic" | "interview" | "analysis" | "official";

export interface KnowledgeEntry {
  id: string;
  world_id: string;
  dimension: SeedDimension | "general";
  content: string;
  source_url: string;
  source_type: SourceType;
  /** Relevance to this specific world (0.0~1.0) */
  relevance_score: number;
  added_at: number;
  /** Event IDs that referenced this entry */
  used_in_events: string[];
}

export interface DimCoverage {
  dimension: SeedDimension;
  entry_count: number;
  total_chars: number;
  /** Estimated coverage of source material (0.0~1.0) */
  coverage_score: number;
}

export interface KnowledgeBase {
  world_id: string;
  entries: KnowledgeEntry[];
  total_tokens: number;
  coverage: DimCoverage[];
  last_researched_at: number;
}

// ─── RESEARCH ─────────────────────────────────────────────────────────────────

export interface ResearchGap {
  dimension: SeedDimension | "general";
  reason: string;
  /** Priority (higher = more urgent) */
  priority: number;
  suggested_queries: string[];
}

export interface RawSearchResult {
  query: string;
  url: string;
  title: string;
  snippet: string;
  full_content?: string;
}

// ─── TENSION ──────────────────────────────────────────────────────────────────

export interface TensionPoint {
  id: string;
  world_id: string;
  between: [SeedDimension, SeedDimension];
  description: string;
  /** Current pressure (0.0~1.0) */
  pressure: number;
  /** Threshold to trigger an event */
  threshold: number;
  created_at: number;
  last_triggered_at?: number;
  trigger_count: number;
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────

export type EventType =
  | "tension_resolution"    // A tension point produced an event
  | "knowledge_enrichment"  // New source knowledge integrated into world
  | "character_action"      // A character acted and changed the world
  | "maturity_leap"         // World advanced to a new maturity stage
  | "bifurcation"           // World branched into a parallel timeline
  | "transcendence"         // World generated content beyond its source
  | "emergence";            // World produced autonomously creative new content

export type ActorType = "system" | "character" | "research" | "human";

export interface WorldEvent {
  id: string;
  world_id: string;
  timestamp: number;
  pulse_number: number;
  actor_id: string;
  actor_type: ActorType;
  event_type: EventType;
  /** Why this event happened */
  intent: string;
  /** Narrative description of the event (character perspective, in world language) */
  narrative: string;
  /** Changes to the world seed dimensions */
  delta_seed: Record<string, string>;
  /** Knowledge entries added by this event */
  delta_knowledge: string[];      // KnowledgeEntry IDs
  /** Knowledge entries that informed this event */
  sources: string[];              // KnowledgeEntry IDs
  maturity_before: MaturityStage;
  maturity_after: MaturityStage;
}

export interface CharacterAction {
  character_name: string;
  action: string;
  context?: string;
}

// ─── WORLD STATE ──────────────────────────────────────────────────────────────

export interface WorldState {
  id: string;
  tradition_key: string;
  /** Current seed (evolves over time; start = initial compressed seed) */
  seed: Record<string, string>;
  version: number;
  stage: MaturityStage;
  pulse_count: number;
  parent_world_id?: string;
  created_at: number;
  last_pulse_at: number;
  last_researched_at: number;
  last_maturity_check_at: number;
}

// ─── PULSE ────────────────────────────────────────────────────────────────────

export type PulseTaskType =
  | "tension_evolve"
  | "research_gap"
  | "maturity_test"
  | "transcendence_generate"
  | "emergence_generate";

export interface PulseTask {
  type: PulseTaskType;
  priority: number;
  context: Record<string, unknown>;
}

export interface PulseResult {
  world_id: string;
  pulse_number: number;
  events: WorldEvent[];
  maturity: MaturityReport;
  duration_ms: number;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

export interface EvolutionConfig {
  /** Path to SQLite database */
  db_path: string;
  /** LLM config (reuse from @nutshell/core) */
  llm: {
    provider: string;
    model: string;
    api_key?: string;
    base_url?: string;
  };
  /** Pulse interval in ms (default: 60000) */
  pulse_interval_ms: number;
  /** Max parallel events per pulse (default: 3) */
  max_parallel_events: number;
  /** Tension threshold to trigger event (default: 0.7) */
  tension_threshold: number;
  /** Language for narratives (default: "zh") */
  language: "zh" | "en";
  /** Optional custom search function (overrides default DuckDuckGo search) */
  searchFn?: (query: string) => Promise<RawSearchResult[]>;
  /** Disable automatic world bifurcation on tension overflow */
  skip_bifurcation?: boolean;
}

export const DEFAULT_EVOLUTION_CONFIG: Partial<EvolutionConfig> = {
  pulse_interval_ms: 60_000,
  max_parallel_events: 3,
  tension_threshold: 0.7,
  language: "zh",
};
