/**
 * @nutshell/evolution — TensionAnalyzer
 *
 * Analyzes contradictions between the 10 seed dimensions.
 * Returns sorted tension points with pressure scores.
 */

import { randomUUID } from "crypto";
import type {
  WorldState,
  TensionPoint,
  SeedDimension,
  EvolutionConfig,
} from "./types.js";
import { callLLM } from "./llm.js";

// ─── BUILT-IN TENSION TEMPLATES ───────────────────────────────────────────────
// Rule-based templates for common dimension pairs — no LLM needed for these.

interface TensionTemplate {
  between: [SeedDimension, SeedDimension];
  probe: string;  // Question that reveals this tension
  base_pressure: number;
}

const TENSION_TEMPLATES: TensionTemplate[] = [
  {
    between: ["fate", "divine_human"],
    probe: "If fate is fixed, who enforces it when gods do not intervene?",
    base_pressure: 0.6,
  },
  {
    between: ["time", "death"],
    probe: "If time is cyclical, what does death mean for individual identity?",
    base_pressure: 0.55,
  },
  {
    between: ["cosmogony", "tension"],
    probe: "Does the cost of creation determine the nature of the eternal conflict?",
    base_pressure: 0.5,
  },
  {
    between: ["ontology", "divine_human"],
    probe: "If beings occupy distinct strata, can humans genuinely become divine — or only approximate?",
    base_pressure: 0.5,
  },
  {
    between: ["aesthetic", "tension"],
    probe: "Does the world's aesthetic form reflect or conceal its core contradiction?",
    base_pressure: 0.45,
  },
  {
    between: ["fate", "tension"],
    probe: "Is the core tension itself fated — an eternal replay — or can it be resolved?",
    base_pressure: 0.6,
  },
  {
    between: ["death", "ontology"],
    probe: "How does the structure of existence change after death? Are the strata preserved?",
    base_pressure: 0.5,
  },
  {
    between: ["time", "cosmogony"],
    probe: "Did time begin with creation, or did creation happen inside time?",
    base_pressure: 0.4,
  },
  {
    between: ["seed_essence", "tension"],
    probe: "Does the world's essential character express or suppress its core conflict?",
    base_pressure: 0.55,
  },
];

// ─── ANALYZER ─────────────────────────────────────────────────────────────────

export class TensionAnalyzer {
  private config: EvolutionConfig;

  constructor(config: EvolutionConfig) {
    this.config = config;
  }

  /**
   * Analyze the current world seed and return all tension points, sorted by pressure.
   * Combines rule-based templates with LLM-driven analysis.
   */
  async analyze(world: WorldState): Promise<TensionPoint[]> {
    const seed = world.seed;
    const now = Date.now();

    // 1. Generate base tensions from templates
    const baseTensions = await Promise.all(
      TENSION_TEMPLATES.map(t => this.instantiateTension(t, world, now))
    );

    // 2. LLM-driven: find additional world-specific tensions
    const extraTensions = await this.findWorldSpecificTensions(world, now);

    // 3. Merge, deduplicate by dimension pair, sort by pressure
    const all = [...baseTensions, ...extraTensions];
    const seen = new Set<string>();
    const unique = all.filter(t => {
      const key = [t.between[0], t.between[1]].sort().join(":");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort((a, b) => b.pressure - a.pressure);
  }

  /**
   * Instantiate a template into a concrete TensionPoint by scoring pressure
   * based on how strongly the actual seed content expresses each side.
   */
  private async instantiateTension(
    template: TensionTemplate,
    world: WorldState,
    now: number
  ): Promise<TensionPoint> {
    const [dimA, dimB] = template.between;
    const contentA = world.seed[dimA] || "";
    const contentB = world.seed[dimB] || "";

    // Simple heuristic: longer, denser content = stronger expression = more potential tension
    const densityA = Math.min(contentA.length / 500, 1.0);
    const densityB = Math.min(contentB.length / 500, 1.0);
    const pressure = template.base_pressure * (densityA + densityB) / 2;

    return {
      id: `tension_${world.id}_${dimA}_${dimB}`,
      world_id: world.id,
      between: template.between,
      description: template.probe,
      pressure: Math.min(pressure * 1.2, 0.99),
      threshold: this.config.tension_threshold,
      created_at: now,
      trigger_count: 0,
    };
  }

  /**
   * Use LLM to find world-specific tensions beyond the templates.
   */
  private async findWorldSpecificTensions(
    world: WorldState,
    now: number
  ): Promise<TensionPoint[]> {
    const seedSummary = Object.entries(world.seed)
      .map(([k, v]) => `${k}: ${String(v).slice(0, 200)}`)
      .join("\n");

    const system = `You are a world analyst specializing in finding ideological tensions within mythological and fictional worlds.`;
    const user = `Analyze this world seed and identify 2-3 additional tension points not already covered by these standard pairs:
fate/divine_human, time/death, cosmogony/tension, ontology/divine_human, aesthetic/tension.

World seed:
${seedSummary}

Return JSON array:
[{
  "dim_a": "dimension_name",
  "dim_b": "dimension_name",
  "description": "specific tension in this world (1-2 sentences)",
  "pressure": 0.0-1.0
}]

Only return the JSON array, no other text.`;

    try {
      const response = await callLLM(this.config, system, user);
      const raw = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return [];

      const items = JSON.parse(match[0]) as Array<{
        dim_a: string; dim_b: string; description: string; pressure: number;
      }>;

      return items.map(item => ({
        id: `tension_${world.id}_${item.dim_a}_${item.dim_b}_${randomUUID().slice(0, 6)}`,
        world_id: world.id,
        between: [item.dim_a as SeedDimension, item.dim_b as SeedDimension],
        description: item.description,
        pressure: Math.min(Math.max(item.pressure, 0), 0.99),
        threshold: this.config.tension_threshold,
        created_at: now,
        trigger_count: 0,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Accumulate pressure on existing tension points over time.
   * Called every pulse for tensions that haven't triggered recently.
   */
  accumulatePressure(tensions: TensionPoint[]): TensionPoint[] {
    return tensions.map(t => {
      const timeSinceTriggered = t.last_triggered_at
        ? (Date.now() - t.last_triggered_at) / 1000 / 60  // minutes
        : 60;
      const accumulation = Math.min(timeSinceTriggered * 0.01, 0.2);
      return { ...t, pressure: Math.min(t.pressure + accumulation, 0.99) };
    });
  }

  /**
   * Return tensions that have exceeded their threshold.
   */
  getTriggerable(tensions: TensionPoint[]): TensionPoint[] {
    return tensions.filter(t => t.pressure >= t.threshold);
  }
}
