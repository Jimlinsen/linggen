/**
 * @nutshell/evolution — BifurcationDetector
 *
 * Detects when a world's internal tensions cannot be resolved within
 * a single timeline, and creates a parallel branch world.
 */

import { randomUUID } from "crypto";
import type { WorldEvent } from "./types.js";
import { WorldStateDB } from "./state.js";

export class BifurcationDetector {
  private db: WorldStateDB;
  private readonly PRESSURE_OVERFLOW = 0.95;
  private readonly INSTABILITY_WINDOW = 5; // events

  constructor(db: WorldStateDB) {
    this.db = db;
  }

  async check(world_id: string): Promise<boolean> {
    const world = this.db.getWorld(world_id);
    const tensions = this.db.getTensions(world_id);
    const recentEvents = this.db.getEvents(world_id, this.INSTABILITY_WINDOW);

    // Condition 1: Multiple tensions at max pressure
    const overloaded = tensions.filter(t => t.pressure >= this.PRESSURE_OVERFLOW);
    if (overloaded.length >= 2) {
      await this.bifurcate(world_id, `张力过载：${overloaded.map(t => t.between.join("×")).join(", ")}`);
      return true;
    }

    // Condition 2: Same dimensions flip-flopping in recent events
    const flippedDims = this.detectInstability(recentEvents);
    if (flippedDims.length >= 2) {
      await this.bifurcate(world_id, `维度不稳定：${flippedDims.join(", ")}`);
      return true;
    }

    return false;
  }

  private detectInstability(events: WorldEvent[]): string[] {
    const dimChanges: Record<string, number> = {};
    for (const event of events) {
      for (const dim of Object.keys(event.delta_seed)) {
        dimChanges[dim] = (dimChanges[dim] || 0) + 1;
      }
    }
    // Dimensions changed more than 2 times in the window are unstable
    return Object.entries(dimChanges)
      .filter(([, count]) => count >= 2)
      .map(([dim]) => dim);
  }

  private async bifurcate(world_id: string, reason: string): Promise<void> {
    const branchedWorld = this.db.branchWorld(world_id);

    // Record bifurcation event in both worlds
    const event: WorldEvent = {
      id: randomUUID(),
      world_id,
      timestamp: Date.now(),
      pulse_number: this.db.getWorld(world_id).pulse_count,
      actor_id: "bifurcation_detector",
      actor_type: "system",
      event_type: "bifurcation",
      intent: reason,
      narrative: `世界的内在张力无法在单一时间线内调和。平行分支世界 ${branchedWorld.id} 已从此刻分化产生。两个世界将从这一节点独立演化。`,
      delta_seed: {},
      delta_knowledge: [],
      sources: [],
      maturity_before: this.db.getWorld(world_id).stage,
      maturity_after: this.db.getWorld(world_id).stage,
    };

    // Parent world: record that a branch was spawned from it
    this.db.appendEvent(event);

    // Branch world: record its origin — history starts here
    const branchEvent: WorldEvent = {
      id: randomUUID(),
      world_id: branchedWorld.id,
      timestamp: event.timestamp,
      pulse_number: 0,
      actor_id: "bifurcation_detector",
      actor_type: "system",
      event_type: "transcendence",
      intent: `从父世界 ${world_id} 继承诞生`,
      narrative: `此世界于分叉点从 ${world_id} 继承而来。原因：${reason}。两条时间线自此刻起独立演化，互不干涉。`,
      delta_seed: {},
      delta_knowledge: [],
      sources: [],
      maturity_before: branchedWorld.stage,
      maturity_after: branchedWorld.stage,
    };
    this.db.appendEvent(branchEvent);

    console.log(`[Evolution] World bifurcated: ${world_id} → ${branchedWorld.id} (${reason})`);
  }
}
