/**
 * @nutshell/evolution — MaturityScorer
 *
 * Measures world maturity across 5 stages.
 * Reference point: the SOURCE (original work/myth), not the seed.
 * The seed is a lossy compression; the source is the true benchmark.
 */

import type {
  WorldState,
  MaturityReport,
  MaturityStage,
  SeedDimension,
  EvolutionRecommendation,
  EvolutionConfig,
} from "./types.js";
import { WorldStateDB } from "./state.js";
import { callLLM } from "./llm.js";

const SEED_DIMENSIONS: SeedDimension[] = [
  "cosmogony", "ontology", "time", "fate", "divine_human",
  "death", "tension", "aesthetic", "symbols", "seed_essence",
];

export class MaturityScorer {
  private config: EvolutionConfig;
  private db: WorldStateDB;

  constructor(config: EvolutionConfig, db: WorldStateDB) {
    this.config = config;
    this.db = db;
  }

  async score(world: WorldState, characterSouls: string[] = []): Promise<MaturityReport> {
    const knowledge = this.db.getKnowledge(world.id);
    const events = this.db.getEvents(world.id, 30);
    const knowledgeText = knowledge.slice(0, 20).map(k => k.content).join("\n\n");

    // Run stage tests in order; stop when a stage isn't passed
    const sourceCoverage = await this.testSourceCoverage(world, knowledgeText, characterSouls);
    const derivationQuality = sourceCoverage > 0.6
      ? await this.testDerivation(world, knowledgeText, characterSouls)
      : 0;
    const transcendenceScore = derivationQuality > 0.6
      ? await this.testTranscendence(world, events)
      : 0;
    const emergenceIndex = transcendenceScore > 0.7
      ? await this.testEmergence(world, events)
      : 0;

    // Determine stage
    const stage = this.determineStage(
      sourceCoverage, derivationQuality, transcendenceScore, emergenceIndex
    );

    // Overall score = progress within current stage
    const overallScore = this.computeOverallScore(
      stage, sourceCoverage, derivationQuality, transcendenceScore, emergenceIndex
    );

    // Dim scores (simplified: use knowledge coverage per dimension)
    const dimScores = this.computeDimScores(world, knowledge);
    const weakestDims = SEED_DIMENSIONS
      .filter(d => (dimScores[d]?.source_alignment ?? 0) < 0.4)
      .slice(0, 3);

    const report: MaturityReport = {
      world_id: world.id,
      stage,
      stage_name: this.stageName(stage),
      overall_score: overallScore,
      source_coverage: sourceCoverage,
      derivation_quality: derivationQuality,
      transcendence_score: transcendenceScore,
      emergence_index: emergenceIndex,
      dim_scores: dimScores,
      weakest_dims: weakestDims,
      recommendation: this.recommend(stage, weakestDims, sourceCoverage),
      tested_at: Date.now(),
      tested_characters: characterSouls,
    };

    this.db.saveMaturityReport(report);
    return report;
  }

  // ─── STAGE 0→1: SOURCE COVERAGE ─────────────────────────────────────────────

  private async testSourceCoverage(
    world: WorldState,
    knowledgeText: string,
    chars: string[]
  ): Promise<number> {
    if (!knowledgeText) return 0.1;

    const system = `你是一个世界知识评估专家。评估一个世界的知识库对其来源的覆盖程度。`;
    const user = `世界：${world.seed["tradition_name"] || world.tradition_key}

世界种子（压缩版）：
${Object.entries(world.seed).map(([k, v]) => `${k}: ${String(v).slice(0, 100)}`).join("\n")}

知识库摘要（来自来源的积累知识）：
${knowledgeText.slice(0, 2000)}

评估：这个知识库对该世界的来源（原作/神话）的覆盖程度如何？
- 1.0 = 完全覆盖来源的所有主要内容
- 0.0 = 几乎没有来自来源的知识

只返回一个0到1之间的数字（如 0.73），不要其他内容。`;

    try {
      const response = await callLLM(this.config, system, user);
      const num = parseFloat(response.trim());
      return isNaN(num) ? 0.2 : Math.min(Math.max(num, 0), 1);
    } catch {
      return 0.1;
    }
  }

  // ─── STAGE 1→2: DERIVATION ──────────────────────────────────────────────────

  private async testDerivation(
    world: WorldState,
    knowledgeText: string,
    chars: string[]
  ): Promise<number> {
    const system = `你是一个世界推导能力测试专家。`;
    const tradition = world.seed["tradition_name"] || world.tradition_key;

    // Generate a question that the source never directly answered
    const questionPrompt = `对于世界"${tradition}"，给出一个该来源（原作/神话）从未直接回答、但可以从世界内在逻辑推导出来的问题。只给出问题，不要答案。`;
    let question: string;
    try {
      question = await callLLM(this.config, `你是一个叙事分析师。`, questionPrompt);
    } catch {
      question = `${tradition}世界中，死亡与时间的关系是什么？`;
    }

    // Now test if the world can answer it
    const user = `世界：${tradition}

来源知识：
${knowledgeText.slice(0, 1500)}

世界种子：
${Object.entries(world.seed).slice(0, 5).map(([k, v]) => `${k}: ${String(v).slice(0, 150)}`).join("\n")}

推导测试问题（原作未直接回答）：
${question}

请从世界的内在逻辑推导答案。然后评估：这个推导是否（1）自洽、（2）有根据、（3）真正来自内在逻辑而非猜测？

最后一行只输出一个0-1的评分（如：0.65），代表推导质量。`;

    try {
      const response = await callLLM(this.config, system, user);
      const numMatch = response.match(/\b(0\.\d+|1\.0|0|1)\b/);
      const score = numMatch ? parseFloat(numMatch[1]) : 0.3;
      return Math.min(Math.max(score, 0), 1);
    } catch {
      return 0.2;
    }
  }

  // ─── STAGE 2→3: TRANSCENDENCE (AUTHOR RECOGNITION TEST) ─────────────────────

  private async testTranscendence(world: WorldState, events: any[]): Promise<number> {
    const transcendenceEvents = events.filter(e => e.event_type === "transcendence");
    if (!transcendenceEvents.length) return 0;

    const system = `你是一个叙事质量评估专家，从原作者视角评估衍生内容的质量。`;
    const sample = transcendenceEvents.slice(0, 3);
    const tradition = world.seed["tradition_name"] || world.tradition_key;

    const user = `世界：${tradition}

以下是该世界自主生成的、超越原作的新内容：

${sample.map((e, i) => `内容${i + 1}：\n${e.narrative}`).join("\n\n")}

从原作者视角评估（"原作者认可测试"）：
1. 这些内容是否与原作世界观矛盾？（0=严重矛盾, 1=完全兼容）
2. 这些内容是否真的是原作没有写过的新内容？（0=重复原作, 1=全新）
3. 如果原作者看到，是否会认为这属于这个世界？（0=不认可, 1=完全认可）

最后一行只输出综合评分（三项平均），格式：0.XX`;

    try {
      const response = await callLLM(this.config, system, user);
      const numMatch = response.match(/\b(0\.\d+|1\.0|0|1)\b/);
      const score = numMatch ? parseFloat(numMatch[1]) : 0.4;
      return Math.min(Math.max(score, 0), 1);
    } catch {
      return 0.3;
    }
  }

  // ─── STAGE 3→4: EMERGENCE ───────────────────────────────────────────────────

  private async testEmergence(world: WorldState, events: any[]): Promise<number> {
    const recentEvents = events.slice(0, 10);
    if (recentEvents.length < 5) return 0;

    const system = `你是一个世界活力评估专家。`;
    const tradition = world.seed["tradition_name"] || world.tradition_key;

    const user = `世界：${tradition}（已演化 ${world.pulse_count} 次脉冲，版本 ${world.version}）

最近的世界事件：
${recentEvents.map(e => `[${e.event_type}] ${e.narrative.slice(0, 150)}`).join("\n\n")}

评估这个世界是否显示出"涌现"特征：
- 自主生成新内容（不依赖外部触发）
- 内容之间有内在的逻辑连贯性（不是随机的）
- 超出了原有种子的信息范围（真正的新生成）
- 有独立的创作价值（如果发表，有人会读）

只输出一个0-1的涌现指数（如：0.72），不要其他内容。`;

    try {
      const response = await callLLM(this.config, system, user);
      const num = parseFloat(response.trim());
      return isNaN(num) ? 0.1 : Math.min(Math.max(num, 0), 1);
    } catch {
      return 0;
    }
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  private determineStage(
    coverage: number, derivation: number, transcendence: number, emergence: number
  ): MaturityStage {
    if (emergence > 0.7) return 4;
    if (transcendence > 0.7) return 3;
    if (derivation > 0.6) return 2;
    if (coverage > 0.6) return 1;
    return 0;
  }

  private computeOverallScore(
    stage: MaturityStage,
    coverage: number, derivation: number, transcendence: number, emergence: number
  ): number {
    switch (stage) {
      case 0: return coverage;
      case 1: return (coverage + derivation) / 2;
      case 2: return (derivation + transcendence) / 2;
      case 3: return (transcendence + emergence) / 2;
      case 4: return emergence;
    }
  }

  private computeDimScores(world: WorldState, knowledge: any[]): MaturityReport["dim_scores"] {
    const scores: MaturityReport["dim_scores"] = {};
    for (const dim of SEED_DIMENSIONS) {
      const dimKnowledge = knowledge.filter(k => k.dimension === dim);
      const chars = dimKnowledge.reduce((s: number, k: any) => s + k.content.length, 0);
      const seedChars = (world.seed[dim] || "").length;
      scores[dim] = {
        dimension: dim,
        source_alignment: Math.min(chars / Math.max(seedChars * 4, 1000), 1),
        derivation_depth: 0,
        novel_content_count: 0,
      };
    }
    return scores;
  }

  private stageName(stage: MaturityStage): string {
    const names = ["萌芽 Seedling", "理解 Understanding", "推导 Derivation",
      "超越 Transcendence", "涌现 Emergence"];
    return names[stage];
  }

  private recommend(
    stage: MaturityStage,
    weakDims: SeedDimension[],
    coverage: number
  ): EvolutionRecommendation {
    if (stage === 0 || coverage < 0.4) return "research";
    if (stage === 1) return weakDims.length > 2 ? "research" : "evolve";
    if (stage === 2) return "test";
    if (stage === 3) return "transcend";
    return "expand";
  }
}
