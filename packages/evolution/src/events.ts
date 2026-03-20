/**
 * @nutshell/evolution — EventGenerator
 *
 * Generates world events from:
 * - Tension points (world's internal contradictions)
 * - New knowledge entries (research integration)
 * - Character actions (characters modifying the world)
 * - Transcendence triggers (world generating beyond its source)
 */

import { randomUUID } from "crypto";
import type {
  WorldState,
  WorldEvent,
  TensionPoint,
  KnowledgeEntry,
  CharacterAction,
  SeedDimension,
  EvolutionConfig,
} from "./types.js";
import { callLLM } from "./llm.js";

export class EventGenerator {
  private config: EvolutionConfig;

  constructor(config: EvolutionConfig) {
    this.config = config;
  }

  // ─── FROM TENSION ────────────────────────────────────────────────────────────

  async fromTension(tension: TensionPoint, world: WorldState, recentEvents?: WorldEvent[]): Promise<WorldEvent> {
    const lang = this.config.language === "zh" ? "用中文回答。" : "Respond in English.";
    const [dimA, dimB] = tension.between;
    const system = `你是一个世界事件生成器。你从神话与虚构世界的内在张力中生成具体的世界事件。事件要有叙事性、有哲学深度，且必须逻辑上源自给定的维度张力。`;

    const historyBlock = recentEvents && recentEvents.length > 0
      ? `\n【世界近期事件史（按时间倒序）】\n${recentEvents.slice(0, 5).map(e => `· [${e.event_type}] ${(e.narrative || "").slice(0, 100)}`).join("\n")}\n请确保新生成的事件与以上历史有叙事连续性或因果关联。\n`
      : "";

    const user = `世界：${world.seed["tradition_name"] || world.tradition_key}
当前张力：${tension.description}
涉及维度：${dimA} × ${dimB}

维度${dimA}当前内容：
${world.seed[dimA] || "(未定义)"}

维度${dimB}当前内容：
${world.seed[dimB] || "(未定义)"}
${historyBlock}
${lang}

生成一个由此张力引发的世界事件。返回JSON：
{
  "narrative": "事件的叙事描述（200-400字，用该世界的语言风格）",
  "intent": "为什么这个张力会产生这个事件（1-2句）",
  "delta_seed": {
    "dimension_name": "修改后的内容（只写变化的部分，可以是null表示不修改）"
  }
}

delta_seed只包含需要修改的维度，最多修改2个维度。只返回JSON。`;

    const response = await callLLM(this.config, system, user);
    const parsed = this.parseEventJSON(response);
    const now = Date.now();

    return {
      id: randomUUID(),
      world_id: world.id,
      timestamp: now,
      pulse_number: world.pulse_count,
      actor_id: "tension_engine",
      actor_type: "system",
      event_type: "tension_resolution",
      intent: parsed.intent || tension.description,
      narrative: parsed.narrative || `张力 ${dimA}×${dimB} 产生了涌动。`,
      delta_seed: parsed.delta_seed || {},
      delta_knowledge: [],
      sources: [],
      maturity_before: world.stage,
      maturity_after: world.stage,
    };
  }

  // ─── FROM CHARACTER ACTION ───────────────────────────────────────────────────

  async fromCharacterAction(action: CharacterAction, world: WorldState): Promise<WorldEvent> {
    const lang = this.config.language === "zh" ? "用中文回答。" : "Respond in English.";
    const system = `你是一个世界事件处理器。角色的行动会改变世界的状态。你负责将角色行动转化为对世界种子的具体影响。`;
    const user = `世界：${world.seed["tradition_name"] || world.tradition_key}
角色：${action.character_name}
行动：${action.action}
${action.context ? `背景：${action.context}` : ""}

世界当前状态摘要：
- 核心张力：${world.seed["tension"] || "(未定义)"}
- 神人关系：${world.seed["divine_human"] || "(未定义)"}
- 命运观：${world.seed["fate"] || "(未定义)"}

${lang}

这个角色行动如何影响世界？返回JSON：
{
  "narrative": "从世界视角描述这个事件的影响（150-300字）",
  "intent": "这个行动对世界意味着什么（1句）",
  "delta_seed": {
    "dimension_name": "更新后的内容"
  }
}

delta_seed最多修改1-2个维度。只返回JSON。`;

    const response = await callLLM(this.config, system, user);
    const parsed = this.parseEventJSON(response);
    const now = Date.now();

    return {
      id: randomUUID(),
      world_id: world.id,
      timestamp: now,
      pulse_number: world.pulse_count,
      actor_id: action.character_name,
      actor_type: "character",
      event_type: "character_action",
      intent: parsed.intent || action.action,
      narrative: parsed.narrative || `${action.character_name}的行动改变了世界。`,
      delta_seed: parsed.delta_seed || {},
      delta_knowledge: [],
      sources: [],
      maturity_before: world.stage,
      maturity_after: world.stage,
    };
  }

  // ─── TRANSCENDENCE ───────────────────────────────────────────────────────────

  async generateTranscendence(world: WorldState): Promise<WorldEvent> {
    const lang = this.config.language === "zh" ? "用中文回答。" : "Respond in English.";
    const system = `你是一个世界叙事生成器。你的任务是生成超越来源的新内容——原作者没有写过，但完全符合世界内在逻辑的内容。`;
    const user = `世界：${world.seed["tradition_name"] || world.tradition_key}
成熟阶段：${world.stage}（正在趋向超越/涌现）

世界种子精华：
${world.seed["seed_essence"] || "(未定义)"}

核心张力：
${world.seed["tension"] || "(未定义)"}

${lang}

生成一个原作从未直接描述的新内容——可以是：
- 世界中某个隐含但未被探讨的哲学命题
- 原作时间线之外的历史事件
- 原作未涉及的世界角落的情形
- 某个角色私下里的内心独白或未公开的行动

要求：符合世界逻辑，但是全新的内容。

返回JSON：
{
  "narrative": "新生成的内容（300-600字，用该世界的语言风格）",
  "intent": "这个内容超越了来源的哪个边界（1-2句）",
  "delta_seed": {}
}

只返回JSON。`;

    const response = await callLLM(this.config, system, user);
    const parsed = this.parseEventJSON(response);
    const now = Date.now();

    return {
      id: randomUUID(),
      world_id: world.id,
      timestamp: now,
      pulse_number: world.pulse_count,
      actor_id: "transcendence_engine",
      actor_type: "system",
      event_type: "transcendence",
      intent: parsed.intent || "世界超越了来源的边界。",
      narrative: parsed.narrative || "世界产生了新的内容。",
      delta_seed: {},
      delta_knowledge: [],
      sources: [],
      maturity_before: world.stage,
      maturity_after: world.stage,
    };
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  private parseEventJSON(raw: string): {
    narrative?: string; intent?: string; delta_seed?: Record<string, string>;
  } {
    try {
      const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) return {};
      return JSON.parse(match[0]);
    } catch {
      return {};
    }
  }
}
