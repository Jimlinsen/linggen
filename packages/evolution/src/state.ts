/**
 * @nutshell/evolution — State
 *
 * SQLite + FTS5 persistence layer for world evolution.
 * Uses better-sqlite3 (synchronous) for simplicity and reliability.
 * WAL mode enabled for concurrent reads.
 */

import Database from "better-sqlite3";
import * as path from "path";
import * as fs from "fs";
import { randomUUID } from "crypto";
import type {
  WorldState,
  WorldEvent,
  KnowledgeEntry,
  TensionPoint,
  MaturityReport,
  MaturityStage,
  EvolutionConfig,
} from "./types.js";

export class WorldStateDB {
  private db: Database.Database;

  constructor(config: Pick<EvolutionConfig, "db_path">) {
    const dbDir = path.dirname(config.db_path);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    this.db = new Database(config.db_path);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.initialize();
  }

  // ─── SCHEMA ───────────────────────────────────────────────────────────────

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS worlds (
        id TEXT PRIMARY KEY,
        tradition_key TEXT NOT NULL,
        seed TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 0,
        stage INTEGER NOT NULL DEFAULT 0,
        pulse_count INTEGER NOT NULL DEFAULT 0,
        parent_world_id TEXT,
        created_at REAL NOT NULL,
        last_pulse_at REAL NOT NULL DEFAULT 0,
        last_researched_at REAL NOT NULL DEFAULT 0,
        last_maturity_check_at REAL NOT NULL DEFAULT 0,
        FOREIGN KEY (parent_world_id) REFERENCES worlds(id)
      );

      CREATE TABLE IF NOT EXISTS world_events (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        timestamp REAL NOT NULL,
        pulse_number INTEGER NOT NULL,
        actor_id TEXT NOT NULL,
        actor_type TEXT NOT NULL,
        event_type TEXT NOT NULL,
        intent TEXT NOT NULL,
        narrative TEXT NOT NULL,
        delta_seed TEXT NOT NULL DEFAULT '{}',
        delta_knowledge TEXT NOT NULL DEFAULT '[]',
        sources TEXT NOT NULL DEFAULT '[]',
        maturity_before INTEGER NOT NULL DEFAULT 0,
        maturity_after INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (world_id) REFERENCES worlds(id)
      );

      CREATE TABLE IF NOT EXISTS knowledge_base (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        dimension TEXT NOT NULL,
        content TEXT NOT NULL,
        source_url TEXT NOT NULL,
        source_type TEXT NOT NULL,
        relevance_score REAL NOT NULL DEFAULT 0.5,
        added_at REAL NOT NULL,
        used_in_events TEXT NOT NULL DEFAULT '[]',
        FOREIGN KEY (world_id) REFERENCES worlds(id)
      );

      CREATE TABLE IF NOT EXISTS tension_points (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        dim_a TEXT NOT NULL,
        dim_b TEXT NOT NULL,
        description TEXT NOT NULL,
        pressure REAL NOT NULL DEFAULT 0.0,
        threshold REAL NOT NULL DEFAULT 0.7,
        created_at REAL NOT NULL,
        last_triggered_at REAL,
        trigger_count INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (world_id) REFERENCES worlds(id)
      );

      CREATE TABLE IF NOT EXISTS maturity_log (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        stage INTEGER NOT NULL,
        overall_score REAL NOT NULL,
        source_coverage REAL NOT NULL DEFAULT 0,
        derivation_quality REAL NOT NULL DEFAULT 0,
        transcendence_score REAL NOT NULL DEFAULT 0,
        emergence_index REAL NOT NULL DEFAULT 0,
        report TEXT NOT NULL,
        tested_at REAL NOT NULL,
        FOREIGN KEY (world_id) REFERENCES worlds(id)
      );

      -- FTS5 for event narrative search
      CREATE VIRTUAL TABLE IF NOT EXISTS events_fts USING fts5(
        narrative,
        intent,
        content=world_events,
        content_rowid=rowid
      );

      -- FTS5 for knowledge base search
      CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
        content,
        content=knowledge_base,
        content_rowid=rowid
      );

      -- Triggers to keep FTS5 in sync
      CREATE TRIGGER IF NOT EXISTS events_fts_insert
        AFTER INSERT ON world_events BEGIN
          INSERT INTO events_fts(rowid, narrative, intent)
          VALUES (new.rowid, new.narrative, new.intent);
        END;

      CREATE TRIGGER IF NOT EXISTS knowledge_fts_insert
        AFTER INSERT ON knowledge_base BEGIN
          INSERT INTO knowledge_fts(rowid, content)
          VALUES (new.rowid, new.content);
        END;
    `);
  }

  // ─── WORLD CRUD ───────────────────────────────────────────────────────────

  createWorld(tradition_key: string, seed: Record<string, string>, parent_id?: string): WorldState {
    const now = Date.now();
    const world: WorldState = {
      id: `world_${tradition_key}_${randomUUID().slice(0, 8)}`,
      tradition_key,
      seed,
      version: 0,
      stage: 0,
      pulse_count: 0,
      parent_world_id: parent_id,
      created_at: now,
      last_pulse_at: 0,
      last_researched_at: 0,
      last_maturity_check_at: 0,
    };
    this.db.prepare(`
      INSERT INTO worlds (id, tradition_key, seed, version, stage, pulse_count,
        parent_world_id, created_at, last_pulse_at, last_researched_at, last_maturity_check_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      world.id, world.tradition_key, JSON.stringify(world.seed),
      world.version, world.stage, world.pulse_count,
      world.parent_world_id ?? null,
      world.created_at, world.last_pulse_at,
      world.last_researched_at, world.last_maturity_check_at
    );
    return world;
  }

  getWorld(id: string): WorldState {
    const row = this.db.prepare("SELECT * FROM worlds WHERE id = ?").get(id) as any;
    if (!row) throw new Error(`World not found: ${id}`);
    return { ...row, seed: JSON.parse(row.seed) };
  }

  listWorlds(): WorldState[] {
    return (this.db.prepare("SELECT * FROM worlds ORDER BY created_at DESC").all() as any[])
      .map(r => ({ ...r, seed: JSON.parse(r.seed) }));
  }

  updateWorld(id: string, updates: Partial<WorldState>): void {
    const allowed = ["seed", "version", "stage", "pulse_count",
      "last_pulse_at", "last_researched_at", "last_maturity_check_at"];
    const fields = Object.keys(updates).filter(k => allowed.includes(k));
    if (!fields.length) return;
    const sets = fields.map(f => `${f} = ?`).join(", ");
    const vals = fields.map(f => {
      const v = (updates as any)[f];
      return f === "seed" ? JSON.stringify(v) : v;
    });
    this.db.prepare(`UPDATE worlds SET ${sets} WHERE id = ?`).run(...vals, id);
  }

  // ─── EVENTS ───────────────────────────────────────────────────────────────

  appendEvent(event: WorldEvent): void {
    this.db.prepare(`
      INSERT INTO world_events (id, world_id, timestamp, pulse_number, actor_id, actor_type,
        event_type, intent, narrative, delta_seed, delta_knowledge, sources,
        maturity_before, maturity_after)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.id, event.world_id, event.timestamp, event.pulse_number,
      event.actor_id, event.actor_type, event.event_type,
      event.intent, event.narrative,
      JSON.stringify(event.delta_seed),
      JSON.stringify(event.delta_knowledge),
      JSON.stringify(event.sources),
      event.maturity_before, event.maturity_after
    );
  }

  getEvents(world_id: string, limit = 50): WorldEvent[] {
    return (this.db.prepare(`
      SELECT * FROM world_events WHERE world_id = ? ORDER BY timestamp DESC LIMIT ?
    `).all(world_id, limit) as any[]).map(this.parseEvent);
  }

  searchEvents(world_id: string, query: string, limit = 20): WorldEvent[] {
    return (this.db.prepare(`
      SELECT we.* FROM world_events we
      JOIN events_fts fts ON we.rowid = fts.rowid
      WHERE we.world_id = ? AND events_fts MATCH ?
      ORDER BY rank LIMIT ?
    `).all(world_id, query, limit) as any[]).map(this.parseEvent);
  }

  private parseEvent(row: any): WorldEvent {
    return {
      ...row,
      delta_seed: JSON.parse(row.delta_seed),
      delta_knowledge: JSON.parse(row.delta_knowledge),
      sources: JSON.parse(row.sources),
    };
  }

  // ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────

  addKnowledge(entry: KnowledgeEntry): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO knowledge_base
        (id, world_id, dimension, content, source_url, source_type,
         relevance_score, added_at, used_in_events)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id, entry.world_id, entry.dimension, entry.content,
      entry.source_url, entry.source_type, entry.relevance_score,
      entry.added_at, JSON.stringify(entry.used_in_events)
    );
  }

  getKnowledge(world_id: string, dimension?: string): KnowledgeEntry[] {
    const sql = dimension
      ? "SELECT * FROM knowledge_base WHERE world_id = ? AND dimension = ? ORDER BY relevance_score DESC"
      : "SELECT * FROM knowledge_base WHERE world_id = ? ORDER BY relevance_score DESC";
    const args = dimension ? [world_id, dimension] : [world_id];
    return (this.db.prepare(sql).all(...args) as any[]).map(r => ({
      ...r, used_in_events: JSON.parse(r.used_in_events)
    }));
  }

  searchKnowledge(world_id: string, query: string, limit = 10): KnowledgeEntry[] {
    return (this.db.prepare(`
      SELECT kb.* FROM knowledge_base kb
      JOIN knowledge_fts fts ON kb.rowid = fts.rowid
      WHERE kb.world_id = ? AND knowledge_fts MATCH ?
      ORDER BY rank LIMIT ?
    `).all(world_id, query, limit) as any[]).map(r => ({
      ...r, used_in_events: JSON.parse(r.used_in_events)
    }));
  }

  // ─── TENSION POINTS ───────────────────────────────────────────────────────

  upsertTension(t: TensionPoint): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO tension_points
        (id, world_id, dim_a, dim_b, description, pressure, threshold,
         created_at, last_triggered_at, trigger_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      t.id, t.world_id, t.between[0], t.between[1],
      t.description, t.pressure, t.threshold,
      t.created_at, t.last_triggered_at ?? null, t.trigger_count
    );
  }

  getTensions(world_id: string): TensionPoint[] {
    return (this.db.prepare(
      "SELECT * FROM tension_points WHERE world_id = ? ORDER BY pressure DESC"
    ).all(world_id) as any[]).map(r => ({
      ...r,
      between: [r.dim_a, r.dim_b] as [string, string]
    }));
  }

  markTensionTriggered(tension_id: string): void {
    this.db.prepare(`
      UPDATE tension_points
      SET last_triggered_at = ?, trigger_count = trigger_count + 1, pressure = pressure * 0.4
      WHERE id = ?
    `).run(Date.now(), tension_id);
  }

  // ─── MATURITY LOG ─────────────────────────────────────────────────────────

  saveMaturityReport(report: MaturityReport): void {
    this.db.prepare(`
      INSERT INTO maturity_log (id, world_id, stage, overall_score,
        source_coverage, derivation_quality, transcendence_score, emergence_index,
        report, tested_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(), report.world_id, report.stage, report.overall_score,
      report.source_coverage, report.derivation_quality,
      report.transcendence_score, report.emergence_index,
      JSON.stringify(report), report.tested_at
    );
  }

  getLatestMaturity(world_id: string): MaturityReport | null {
    const row = this.db.prepare(
      "SELECT report FROM maturity_log WHERE world_id = ? ORDER BY tested_at DESC LIMIT 1"
    ).get(world_id) as any;
    return row ? JSON.parse(row.report) : null;
  }

  // ─── BRANCH ───────────────────────────────────────────────────────────────

  branchWorld(parent_id: string): WorldState {
    const parent = this.getWorld(parent_id);
    return this.createWorld(parent.tradition_key, { ...parent.seed }, parent_id);
  }

  // ─── WORLD MANAGEMENT ─────────────────────────────────────────────────────

  deleteWorld(world_id: string): void {
    this.db.prepare("DELETE FROM world_events WHERE world_id = ?").run(world_id);
    this.db.prepare("DELETE FROM tension_points WHERE world_id = ?").run(world_id);
    this.db.prepare("DELETE FROM knowledge_base WHERE world_id = ?").run(world_id);
    this.db.prepare("DELETE FROM maturity_log WHERE world_id = ?").run(world_id);
    this.db.prepare("DELETE FROM worlds WHERE id = ?").run(world_id);
  }

  resetPulseCount(world_id: string): void {
    this.db.prepare(
      "UPDATE worlds SET pulse_count = 0, last_pulse_at = 0, stage = 0 WHERE id = ?"
    ).run(world_id);
    this.db.prepare("DELETE FROM world_events WHERE world_id = ?").run(world_id);
    this.db.prepare("DELETE FROM tension_points WHERE world_id = ?").run(world_id);
    this.db.prepare("DELETE FROM maturity_log WHERE world_id = ?").run(world_id);
  }

  // ─── CLEANUP ──────────────────────────────────────────────────────────────

  close(): void {
    this.db.close();
  }
}
