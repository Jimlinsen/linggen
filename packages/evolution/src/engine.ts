/**
 * @nutshell/evolution — EvolutionEngine
 *
 * Main entry point. Orchestrates all subsystems.
 * Use this class to create and evolve worlds.
 */

import * as path from "path";
import * as os from "os";
import { randomUUID } from "crypto";
import type {
  WorldState,
  WorldEvent,
  PulseResult,
  MaturityReport,
  CharacterAction,
  EvolutionConfig,
  RawSearchResult,
} from "./types.js";
import { WorldStateDB } from "./state.js";
import { PulseScheduler } from "./pulse.js";
import { MaturityScorer } from "./maturity.js";
import { EventGenerator } from "./events.js";
import { DEFAULT_EVOLUTION_CONFIG } from "./types.js";

// ─── DEFAULT SEARCH FUNCTION ──────────────────────────────────────────────────
// Simple DuckDuckGo-style search via scraping (no API key required).
// Replace with a proper search API for production.

async function defaultSearch(query: string): Promise<RawSearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; nutshell-evolution/1.0)" },
    });
    if (!res.ok) return [];
    const html = await res.text();
    // Extract result snippets from DDG HTML
    const results: RawSearchResult[] = [];
    const matches = html.matchAll(
      /<a class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([^<]+)<\/a>/g
    );
    for (const match of matches) {
      results.push({
        query,
        url: match[1],
        title: match[2].trim(),
        snippet: match[3].trim(),
      });
      if (results.length >= 5) break;
    }
    return results;
  } catch {
    return [];
  }
}

// ─── ENGINE ───────────────────────────────────────────────────────────────────

export class EvolutionEngine {
  private config: EvolutionConfig;
  private db: WorldStateDB;
  private pulse: PulseScheduler;
  private maturityScorer: MaturityScorer;
  private eventGenerator: EventGenerator;

  constructor(config?: Partial<EvolutionConfig>) {
    const dbPath = path.join(os.homedir(), ".nutshell", "evolution.db");
    this.config = {
      db_path: dbPath,
      llm: {
        provider: process.env.ANTHROPIC_API_KEY ? "anthropic" : "openai",
        model: process.env.ANTHROPIC_API_KEY
          ? "claude-sonnet-4-20250514"
          : (process.env.OPENAI_MODEL || "gpt-4o-mini"),
        api_key: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
      },
      pulse_interval_ms: 60_000,
      max_parallel_events: 3,
      tension_threshold: 0.7,
      language: "zh",
      ...config,
    };

    this.db = new WorldStateDB(this.config);
    this.pulse = new PulseScheduler(this.config, this.db, this.config.searchFn ?? defaultSearch);
    this.maturityScorer = new MaturityScorer(this.config, this.db);
    this.eventGenerator = new EventGenerator(this.config);
  }

  // ─── WORLD LIFECYCLE ────────────────────────────────────────────────────────

  /** Create a new world from a seed JSON object */
  createWorld(tradition_key: string, seed: Record<string, string>): WorldState {
    return this.db.createWorld(tradition_key, seed);
  }

  /** Load existing world by ID */
  getWorld(world_id: string): WorldState {
    return this.db.getWorld(world_id);
  }

  /** List all worlds */
  listWorlds(): WorldState[] {
    return this.db.listWorlds();
  }

  // ─── EVOLUTION ──────────────────────────────────────────────────────────────

  /** Run a single evolution pulse */
  async evolve(world_id: string): Promise<PulseResult> {
    return this.pulse.runPulse(world_id);
  }

  /** Watch mode: continuous evolution */
  async watch(
    world_id: string,
    opts: {
      maxPulses?: number;
      onPulse?: (result: PulseResult) => void;
    } = {}
  ): Promise<void> {
    return this.pulse.watch(world_id, opts);
  }

  // ─── CHARACTER PARTICIPATION ─────────────────────────────────────────────────

  /** A character performs an action that modifies the world */
  async characterAct(
    world_id: string,
    action: CharacterAction
  ): Promise<WorldEvent> {
    const world = this.db.getWorld(world_id);
    const event = await this.eventGenerator.fromCharacterAction(action, world);
    this.db.appendEvent(event);

    if (Object.keys(event.delta_seed).length > 0) {
      this.db.updateWorld(world_id, {
        seed: { ...world.seed, ...event.delta_seed },
        version: world.version + 1,
      });
    }

    return event;
  }

  // ─── MATURITY ────────────────────────────────────────────────────────────────

  /** Get current maturity report (uses cached if recent) */
  async getMaturity(world_id: string, forceRefresh = false): Promise<MaturityReport> {
    if (!forceRefresh) {
      const cached = this.db.getLatestMaturity(world_id);
      if (cached && Date.now() - cached.tested_at < 5 * 60 * 1000) return cached;
    }
    const world = this.db.getWorld(world_id);
    return this.maturityScorer.score(world);
  }

  // ─── HISTORY & SEARCH ────────────────────────────────────────────────────────

  /** Get evolution history */
  getHistory(world_id: string, limit = 50): WorldEvent[] {
    return this.db.getEvents(world_id, limit);
  }

  /** Full-text search across world events */
  searchHistory(world_id: string, query: string): WorldEvent[] {
    return this.db.searchEvents(world_id, query);
  }

  /** Full-text search across knowledge base */
  searchKnowledge(world_id: string, query: string): any[] {
    return this.db.searchKnowledge(world_id, query);
  }

  // ─── BRANCHING ───────────────────────────────────────────────────────────────

  /** Manually create a branch world */
  branch(world_id: string): WorldState {
    return this.db.branchWorld(world_id);
  }

  /** Delete a world and all associated data */
  deleteWorld(world_id: string): void {
    this.db.deleteWorld(world_id);
  }

  /** Reset pulse count and clear evolution history */
  resetWorld(world_id: string): void {
    this.db.resetPulseCount(world_id);
  }

  // ─── CLEANUP ─────────────────────────────────────────────────────────────────

  close(): void {
    this.db.close();
  }
}
