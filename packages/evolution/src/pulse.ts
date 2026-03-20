/**
 * @nutshell/evolution — PulseScheduler
 *
 * Drives world evolution through regular heartbeat pulses.
 * Each pulse: analyze tensions + research gaps + check maturity → execute → write.
 */

import type {
  WorldState,
  WorldEvent,
  PulseResult,
  PulseTask,
  EvolutionConfig,
  MaturityReport,
  MaturityStage,
} from "./types.js";
import { WorldStateDB } from "./state.js";
import { TensionAnalyzer } from "./tension.js";
import { SelfResearchEngine } from "./research.js";
import { EventGenerator } from "./events.js";
import { MaturityScorer } from "./maturity.js";
import { BifurcationDetector } from "./branch.js";

export class PulseScheduler {
  private config: EvolutionConfig;
  private db: WorldStateDB;
  private tensionAnalyzer: TensionAnalyzer;
  private researchEngine: SelfResearchEngine;
  private eventGenerator: EventGenerator;
  private maturityScorer: MaturityScorer;
  private bifurcationDetector: BifurcationDetector;

  constructor(
    config: EvolutionConfig,
    db: WorldStateDB,
    searchFn: (query: string) => Promise<any[]>
  ) {
    this.config = config;
    this.db = db;
    this.tensionAnalyzer = new TensionAnalyzer(config);
    this.researchEngine = new SelfResearchEngine(config, db, searchFn);
    this.eventGenerator = new EventGenerator(config);
    this.maturityScorer = new MaturityScorer(config, db);
    this.bifurcationDetector = new BifurcationDetector(db);
  }

  async runPulse(world_id: string): Promise<PulseResult> {
    const start = Date.now();
    const world = this.db.getWorld(world_id);

    // ── 1. Parallel assessment ────────────────────────────────────────────────
    const [tensions, gaps, maturity] = await Promise.all([
      this.tensionAnalyzer.analyze(world),
      Promise.resolve(this.researchEngine.detectGaps(world)),
      this.maturityScorer.score(world),
    ]);

    // Persist / update tension points
    const accumulated = this.tensionAnalyzer.accumulatePressure(tensions);
    accumulated.forEach(t => this.db.upsertTension(t));

    // ── 2. Plan tasks based on maturity stage ────────────────────────────────
    const tasks = this.plan(world, maturity, accumulated, gaps);

    // ── 3. Execute serially to avoid delta_seed overwrite ────────────────────
    const maxParallel = this.config.max_parallel_events;
    const topTasks = tasks.slice(0, maxParallel);
    const events: WorldEvent[] = [];
    for (const task of topTasks) {
      try {
        // Re-fetch latest world state before each task so delta_seed is
        // based on the most recent seed (not the snapshot from pulse start).
        const currentWorld = this.db.getWorld(world_id);
        const event = await this.executeTask(task, currentWorld);
        if (event) {
          events.push(event);

          // ── 4. Apply event immediately after it completes ─────────────────
          this.db.appendEvent(event);
          if (Object.keys(event.delta_seed).length > 0) {
            const latest = this.db.getWorld(world_id);
            const updatedSeed = { ...latest.seed, ...event.delta_seed };
            this.db.updateWorld(world_id, {
              seed: updatedSeed,
              version: latest.version + 1,
            });
          }
        }
      } catch {
        // Individual task failure should not abort the whole pulse
      }
    }

    // ── 5. Update pulse metadata ─────────────────────────────────────────────
    const now = Date.now();
    this.db.updateWorld(world_id, {
      pulse_count: world.pulse_count + 1,
      last_pulse_at: now,
      stage: maturity.stage,
      last_maturity_check_at: now,
    });

    // ── 6. Check for bifurcation ─────────────────────────────────────────────
    if (!this.config.skip_bifurcation) {
      await this.bifurcationDetector.check(world_id);
    }

    return {
      world_id,
      pulse_number: world.pulse_count + 1,
      events,
      maturity,
      duration_ms: Date.now() - start,
    };
  }

  /**
   * Plan which tasks to run this pulse, weighted by maturity stage.
   */
  private plan(
    world: WorldState,
    maturity: MaturityReport,
    tensions: any[],
    gaps: any[]
  ): PulseTask[] {
    const tasks: PulseTask[] = [];
    const stage = maturity.stage;
    const triggerable = tensions.filter(t => t.pressure >= t.threshold);

    // Stage-based task weight allocation
    const weights = this.stageWeights(stage);

    // Research tasks
    if (Math.random() < weights.research && gaps.length > 0) {
      tasks.push({
        type: "research_gap",
        priority: 0.8,
        context: { gaps: gaps.slice(0, 2) },
      });
    }

    // Tension evolution tasks
    if (Math.random() < weights.evolve && triggerable.length > 0) {
      tasks.push({
        type: "tension_evolve",
        priority: 0.9,
        context: { tension: triggerable[0] },
      });
    }

    // Transcendence tasks (stage 2+)
    if (stage >= 2 && Math.random() < weights.transcend) {
      tasks.push({
        type: "transcendence_generate",
        priority: 0.7,
        context: {},
      });
    }

    // Emergence tasks (stage 3+)
    if (stage >= 3 && Math.random() < weights.emerge) {
      tasks.push({
        type: "emergence_generate",
        priority: 0.6,
        context: {},
      });
    }

    return tasks.sort((a, b) => b.priority - a.priority);
  }

  private stageWeights(stage: MaturityStage): Record<string, number> {
    const weights: Record<MaturityStage, Record<string, number>> = {
      0: { research: 0.9, evolve: 0.2, transcend: 0,   emerge: 0 },
      1: { research: 0.5, evolve: 0.6, transcend: 0.1, emerge: 0 },
      2: { research: 0.3, evolve: 0.5, transcend: 0.5, emerge: 0.1 },
      3: { research: 0.2, evolve: 0.3, transcend: 0.4, emerge: 0.5 },
      4: { research: 0.1, evolve: 0.2, transcend: 0.3, emerge: 0.7 },
    };
    return weights[stage];
  }

  private async executeTask(task: PulseTask, world: WorldState): Promise<WorldEvent | null> {
    switch (task.type) {
      case "tension_evolve": {
        const tension = task.context["tension"] as any;
        if (!tension) return null;
        const recentEvents = this.db.getEvents(world.id, 5);
        const event = await this.eventGenerator.fromTension(tension, world, recentEvents);
        this.db.markTensionTriggered(tension.id);
        return event;
      }
      case "research_gap": {
        return await this.researchEngine.researchCycle(world);
      }
      case "transcendence_generate": {
        return await this.eventGenerator.generateTranscendence(world);
      }
      case "emergence_generate": {
        // Emergence: chain a transcendence from prior transcendence events
        return await this.eventGenerator.generateTranscendence(world);
      }
      default:
        return null;
    }
  }

  /**
   * Watch mode: run pulses continuously.
   */
  async watch(
    world_id: string,
    opts: { onPulse?: (result: PulseResult) => void; maxPulses?: number } = {}
  ): Promise<void> {
    let pulseCount = 0;
    const maxPulses = opts.maxPulses ?? Infinity;

    while (pulseCount < maxPulses) {
      const result = await this.runPulse(world_id);
      opts.onPulse?.(result);
      pulseCount++;
      if (pulseCount < maxPulses) {
        await new Promise(r => setTimeout(r, this.config.pulse_interval_ms));
      }
    }
  }
}
