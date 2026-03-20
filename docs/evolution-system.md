# Evolution System — 世界演化系统设计文档

> 灵根计划（Linggen Project）核心扩展：让世界种子从静态配置变成有心跳的生命。

---

## 1. 系统概述

### 当前状态：种子是静态的

`packages/core` 生成的 `WorldSeed` 是一份压缩的世界意识形态基底。它回答了"这个世界怎么思考"，但它本身不会变化。

```
nutshell seed fma       → 生成 fma.json（10个维度，固定不变）
nutshell soul 爱德华     → 从 fma.json 结晶出角色（阶段0快照）
```

此后，世界停止了。角色能做的只是重复种子压缩进去的内容。

### 演化系统的命题

**种子是压缩包，演化是解压过程，来源（原作/神话）是真正的参照。**

- `WorldSeed` = 有损压缩（10个维度的精华摘要）
- `KnowledgeBase` = 无损积累（直接锚定在来源上）
- `Evolution Engine` = 从阶段0驱动到阶段4的动力机制

静态种子描述"是什么"，演化系统让种子成为**起点而非终点**——世界从此开始生长。

### 架构位置

```
packages/
├── core/           ← 生成初始世界种子（阶段0的起点）
├── evolution/      ← 驱动从阶段0到阶段4的演化  ← 本文档
└── cli/            ← nutshell evolve 命令族
```

---

## 2. 成熟度模型（Maturity Model）

演化系统的核心指标。成熟度的参照系是**来源本身**（作品/神话/文明），不是种子。

### 五个阶段

```
阶段 0 · 萌芽（Sprout）
────────────────────────────────────────────────────────
角色只能重复种子里压缩过的内容。
输出受限于 WorldSeed 的10个维度，无法超出。

示例（钢炼爱德华）：
  ✓ 能说出"等价交换是炼金术的基本法则"
  ✗ 无法准确描述原作中等价交换的哲学演变
```

```
阶段 1 · 理解（Comprehension）
────────────────────────────────────────────────────────
角色能准确反映原作的全部内容。
参照来源，不参照种子。知识库开始建立。

示例：
  ✓ 能准确叙述爱德华在克雷塔看到的等价交换悖论
  ✓ 能区分哲学家之石绕过等价交换的机制
  ✗ 无法推导原作未明写的逻辑
```

```
阶段 2 · 推导（Derivation）
────────────────────────────────────────────────────────
角色能说出原作没写、但一定存在的事。
从世界内在逻辑推导，而非捏造。

示例：
  ✓ "梅林斯营地一定有炼金术文献，因为那是唯一能训练军事炼金术师的地方"
  ✓ 推导伊修瓦尔战役对民间炼金术研究的影响
  ✗ 无法创作出原作者会认可的新内容
```

```
阶段 3 · 超越（Transcendence）
────────────────────────────────────────────────────────
角色能生成新的自洽内容。
原作者没写，但如果看到会说"对，就是这样"。

示例：
  ✓ 写出一段梅尔基奥·肖在伊修瓦尔战役后的心理独白
    — 荒川弘没写过，但符合她对角色的设计意图
  ✗ 无法独立发起超出来源范围的原创扩展
```

```
阶段 4 · 涌现（Emergence）
────────────────────────────────────────────────────────
世界成为独立创作实体，能生成超出来源但有根系的全新内容。
不是同人创作，是世界自身的生长。

示例：
  ✓ 世界自主生成"东方炼金术传统与阿梅斯特里斯体系的接触史"
    — 原作从未涉及，但植根于世界内在逻辑
  ✓ 涌现出新的象征体系、哲学分支、历史事件
```

### 关键原则

- **参照系**：成熟度测量对比的是**来源**，不是种子。种子是地图，来源是实地。
- **角色即折射**：角色的理解深度 = 世界的成熟度。测角色，就是测世界。
- **单向演化**：阶段不可回退。知识库只增不减（可标记失效，不删除）。

---

## 3. 三大驱动引擎

### 3.1 张力演化引擎（Tension Engine）

世界种子的10个维度之间存在内在矛盾。张力引擎将这些矛盾显式化，驱动演化。

**工作原理：**

```
分析10个维度 → 识别张力点（TensionPoint）
     ↓
压力（pressure）持续积累
     ↓
超过阈值（threshold） → 生成世界事件（WorldEvent）
     ↓
事件修改世界状态（WorldState）
     ↓
以散文叙事记录（角色视角的第一人称或观察者视角）
```

**钢炼示例张力：**

| 维度A | 维度B | 张力描述 | 触发事件类型 |
|-------|-------|----------|--------------|
| `cosmogony`（等价交换作为宇宙法则） | `fate`（人类能否超越代价） | 哲学家之石是否真的绕过了法则，还是只是转嫁了代价？ | 教义分裂事件 |
| `divine_human`（真理作为"全"的存在） | `ontology`（人与神的边界） | 炼金术士通过门究竟是接近真理还是被真理利用？ | 神学危机事件 |
| `tension`（追求全能 vs 等价代价） | `death`（死亡是否可逆） | 人体复原炼成的伦理边界在哪里？ | 伦理断裂事件 |

### 3.2 自研究引擎（Research Engine）

世界分析自身的知识空洞，主动向外查询，填充知识库。

**工作原理：**

```
分析当前 KnowledgeBase → 识别空洞（gap analysis）
     ↓
生成搜索词（基于传统/来源类型自动调整策略）
     ↓
并发网络查询（Wikipedia / 专题数据库）
     ↓
相关性过滤（按世界种子维度评分）
     ↓
整合进 KnowledgeBase（直接锚定在来源上，不经过种子压缩）
```

**搜索词生成策略（按来源类型）：**

| 来源类型 | 搜索策略 |
|----------|----------|
| 日本动漫/漫画 | 原作标题 + 角色名 + 制作信息 + 作者访谈关键词 |
| 神话/宗教 | 原始文本来源 + 学术术语 + 比较神话学关键词 |
| 历史虚构 | 历史背景 + 考古资料 + 时代主题词 |
| 原创奇幻 | 世界构建文档 + 作者声明 + 读者社区分析 |

**知识库直接锚定来源，不经过种子压缩**——这是与现有 `research.ts` 的根本区别。现有研究是为了生成种子，演化研究是为了超越种子。

### 3.3 成熟度评分器（Maturity Scorer）

用测试驱动演化。每次脉冲后，评分器测量世界当前位于哪个阶段，决定下一步重心。

**四道关卡：**

```
阶段0 → 1 · 来源覆盖测验（Coverage Test）
  问：角色能准确反映原作的内容吗？
  方法：从来源中随机抽取事件/设定，测角色复述准确率
  通过阈值：覆盖率 ≥ 85%，关键情节无失真

阶段1 → 2 · 推导能力测验（Derivation Test）
  问：对于原作未回答的问题，角色能从逻辑推导吗？
  方法：提出世界内部的"未解之谜"，评估推导的自洽性
  通过阈值：推导链 ≥ 3步，无循环论证，与已知事实不矛盾

阶段2 → 3 · 原作者认可测验（Author Approval Test）
  问：生成内容是否通过"作者视角"评估？
  方法：构建作者的创作意图模型，用该模型评分生成内容
  通过阈值：评分 ≥ 0.75（以作者已知意图为基准校准）

阶段3 → 4 · 涌现测验（Emergence Test）
  问：世界自主生成的内容是否有独立创作价值？
  方法：评估生成内容的原创性、根系深度、内在一致性
  通过阈值：通过世界内部一致性检查 + 无平行世界污染
```

---

## 4. 完整数据模型

```typescript
// ─── WORLD STATE ──────────────────────────────────────────────────────────────

/**
 * WorldState 是演化系统的主文档。
 * 每次脉冲后原子写入，保证一致性。
 */
export interface WorldState {
  /** 唯一世界标识符，格式：world_{tradition}_{ulid} */
  world_id: string;

  /** 来源的原始世界种子（只读，演化不修改种子） */
  seed: WorldSeed;

  /** 当前成熟度阶段（0-4） */
  maturity_stage: 0 | 1 | 2 | 3 | 4;

  /** 成熟度详细分数 */
  maturity_score: MaturityReport;

  /** 知识库 */
  knowledge: KnowledgeBase;

  /** 活跃张力点列表 */
  tensions: TensionPoint[];

  /** 历史事件列表（按时间顺序） */
  events: WorldEvent[];

  /** 世界脉冲计数 */
  pulse_count: number;

  /** 最后脉冲时间（ISO 8601） */
  last_pulse_at: string;

  /** 世界创建时间 */
  created_at: string;

  /** 元数据 */
  meta: {
    tradition: string;
    source_label: string;   // e.g. "Fullmetal Alchemist (2003-2010)"
    nutshell_version: string;
  };
}

// ─── WORLD EVENT ──────────────────────────────────────────────────────────────

/**
 * WorldEvent 是张力演化的产物。
 * 以散文叙事记录，保留角色视角的温度。
 */
export interface WorldEvent {
  event_id: string;

  /** 触发该事件的张力点 */
  triggered_by: string;         // TensionPoint.tension_id

  /** 事件类型 */
  type:
    | "tension_release"         // 张力释放，世界状态改变
    | "knowledge_integration"   // 知识整合，覆盖率提升
    | "derivation"              // 推导结果记录
    | "transcendence"           // 阶段3生成内容
    | "emergence";              // 阶段4涌现内容

  /** 事件标题（简洁，≤30字） */
  title: string;

  /**
   * 散文叙事正文。
   * 以角色视角或观察者视角书写，保留世界的温度。
   * 不是报告，是发生了什么。
   */
  narrative: string;

  /** 该事件对世界状态的修改（键值对） */
  state_delta: Record<string, unknown>;

  /** 受影响的角色（如有） */
  affected_characters?: string[];

  /** 事件发生的成熟度阶段 */
  at_maturity_stage: number;

  /** 事件发生时间 */
  occurred_at: string;
}

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────

/**
 * KnowledgeBase 是演化系统的记忆器官。
 * 直接锚定来源，不经过种子的有损压缩。
 */
export interface KnowledgeBase {
  /** 来源标识（与 WorldState.meta.source_label 对应） */
  source: string;

  /** 知识条目列表 */
  entries: KnowledgeEntry[];

  /** 已识别的知识空洞（gap analysis） */
  gaps: string[];

  /** 覆盖率统计（按维度） */
  coverage: Record<string, number>;  // dimension → 0.0-1.0

  /** 最后更新时间 */
  updated_at: string;
}

export interface KnowledgeEntry {
  entry_id: string;

  /** 知识类型 */
  type:
    | "canon_fact"        // 原作明确设定的事实
    | "author_intent"     // 作者声明的创作意图
    | "derivation"        // 从逻辑推导出的内容（标明推导链）
    | "transcendence"     // 阶段3生成并通过测验的内容
    | "external_research" // 外部研究（Wikipedia等）
    | "emergence";        // 阶段4涌现内容

  /** 内容正文 */
  content: string;

  /** 对应的世界种子维度 */
  dimension:
    | "cosmogony" | "ontology" | "time" | "fate"
    | "divine_human" | "death" | "tension"
    | "aesthetic" | "symbols" | "seed_essence";

  /** 来源引用（URL / 章节 / 卷数） */
  source_ref?: string;

  /** 推导类型条目：推导链（步骤列表） */
  derivation_chain?: string[];

  /** 置信度（0.0-1.0） */
  confidence: number;

  /** 添加时间 */
  added_at: string;
}

// ─── TENSION POINT ────────────────────────────────────────────────────────────

/**
 * TensionPoint 表示世界种子内部的一个矛盾点。
 * 压力积累到阈值时触发 WorldEvent。
 */
export interface TensionPoint {
  tension_id: string;

  /** 参与张力的两个维度 */
  dimensions: [keyof WorldSeed, keyof WorldSeed];

  /** 张力的描述（一句话） */
  description: string;

  /** 当前压力值（0.0-1.0） */
  pressure: number;

  /** 触发事件的压力阈值 */
  threshold: number;

  /** 每次脉冲的压力增量 */
  accumulation_rate: number;

  /** 已触发的事件列表 */
  triggered_events: string[];

  /** 张力是否已释放（释放后 pressure 归零但不消失） */
  last_released_at?: string;
}

// ─── MATURITY REPORT ──────────────────────────────────────────────────────────

/**
 * MaturityReport 是每次脉冲后对世界成熟度的完整评估。
 */
export interface MaturityReport {
  /** 当前阶段 */
  current_stage: 0 | 1 | 2 | 3 | 4;

  /** 各阶段分数 */
  scores: {
    stage_0_to_1: DimScore;  // 来源覆盖
    stage_1_to_2: DimScore;  // 推导能力
    stage_2_to_3: DimScore;  // 原作者认可
    stage_3_to_4: DimScore;  // 涌现价值
  };

  /** 阶段跃迁历史 */
  transitions: Array<{
    from: number;
    to: number;
    at: string;
    trigger: string;
  }>;

  /** 最近一次评估时间 */
  evaluated_at: string;
}

export interface DimScore {
  /** 分数（0.0-1.0） */
  score: number;

  /** 达到下一阶段的阈值 */
  threshold: number;

  /** 是否已通过 */
  passed: boolean;

  /** 评估依据（简要说明） */
  rationale: string;

  /** 各维度子分数 */
  breakdown: Record<string, number>;
}
```

---

## 5. 模块架构

演化系统作为独立 package `packages/evolution` 存在，通过接口与 `packages/core` 对接。

```
packages/evolution/src/
├── types.ts        ← 所有类型定义（上节完整接口）
├── state.ts        ← 世界状态管理
├── tension.ts      ← 张力演化引擎
├── research.ts     ← 自研究引擎
├── maturity.ts     ← 成熟度评分器
├── events.ts       ← 事件生成与叙事
├── pulse.ts        ← 心跳脉冲调度器
├── branch.ts       ← 世界分化管理
└── engine.ts       ← 主引擎（对外 API）
```

### 模块职责与关键 API

**`state.ts` — 世界状态管理**

```typescript
// 创建新世界（从种子初始化）
createWorld(seed: WorldSeed, tradition: string): Promise<WorldState>

// 读取世界状态（原子读）
loadWorld(world_id: string): Promise<WorldState>

// 写入世界状态（原子写，防并发损坏）
saveWorld(state: WorldState): Promise<void>

// 列出所有世界
listWorlds(): Promise<WorldState[]>
```

**`tension.ts` — 张力演化引擎**

```typescript
// 从种子初始化张力点（分析10个维度的矛盾）
initializeTensions(seed: WorldSeed): Promise<TensionPoint[]>

// 运行一轮张力积累
accumulateTensions(tensions: TensionPoint[]): TensionPoint[]

// 检查哪些张力超过阈值，返回待触发列表
checkThresholds(tensions: TensionPoint[]): TensionPoint[]

// 为超阈值张力生成世界事件
generateTensionEvent(
  tension: TensionPoint,
  state: WorldState
): Promise<WorldEvent>
```

**`research.ts` — 自研究引擎**

```typescript
// 分析知识空洞
analyzeGaps(kb: KnowledgeBase, seed: WorldSeed): string[]

// 生成搜索词（按来源类型调整策略）
generateQueries(
  gaps: string[],
  tradition: string,
  sourceType: "anime" | "mythology" | "historical_fiction" | "original_fantasy"
): string[]

// 并发网络查询（返回原始结果）
fetchResearch(queries: string[]): Promise<RawResearchResult[]>

// 相关性过滤（按世界种子维度评分）
filterByRelevance(
  results: RawResearchResult[],
  seed: WorldSeed,
  threshold: number
): KnowledgeEntry[]

// 整合进知识库
integrateKnowledge(
  kb: KnowledgeBase,
  entries: KnowledgeEntry[]
): KnowledgeBase
```

**`maturity.ts` — 成熟度评分器**

```typescript
// 运行完整成熟度评估
evaluate(state: WorldState): Promise<MaturityReport>

// 各阶段测验
testCoverageStage(state: WorldState): Promise<DimScore>
testDerivationStage(state: WorldState): Promise<DimScore>
testAuthorApprovalStage(state: WorldState): Promise<DimScore>
testEmergenceStage(state: WorldState): Promise<DimScore>

// 检查是否满足阶段跃迁条件
checkTransition(report: MaturityReport): number | null  // 返回新阶段或 null
```

**`events.ts` — 事件生成与叙事**

```typescript
// 生成事件叙事（散文，角色视角）
generateNarrative(
  event: Omit<WorldEvent, "narrative">,
  state: WorldState
): Promise<string>

// 将事件应用到世界状态（计算 state_delta）
applyEvent(state: WorldState, event: WorldEvent): WorldState

// 查询事件历史
queryEvents(
  state: WorldState,
  filter: { type?: WorldEvent["type"]; since?: string }
): WorldEvent[]
```

**`pulse.ts` — 心跳脉冲调度器**

```typescript
// 执行单次脉冲（见第6节流程）
runPulse(world_id: string): Promise<PulseResult>

// 启动自动脉冲（interval 秒）
startWatch(world_id: string, interval: number): Promise<void>

// 停止自动脉冲
stopWatch(world_id: string): Promise<void>

export interface PulseResult {
  world_id: string;
  pulse_number: number;
  duration_ms: number;
  tasks_executed: string[];
  maturity_before: number;
  maturity_after: number;
  transitioned: boolean;
  events_generated: WorldEvent[];
}
```

**`branch.ts` — 世界分化管理**

```typescript
// 检测分化条件（阶段3以上，内部矛盾到达临界点）
detectBranchPoint(state: WorldState): boolean

// 创建世界分支
branch(
  parent_id: string,
  branch_name: string,
  divergence_point: string
): Promise<WorldState>

// 列出世界的所有分支
listBranches(world_id: string): Promise<WorldState[]>
```

**`engine.ts` — 主引擎（对外 API）**

```typescript
// 初始化：从种子创建可演化世界
start(options: {
  seed_path: string;
  tradition: string;
}): Promise<WorldState>

// 单步执行
pulse(world_id: string): Promise<PulseResult>

// 查询世界当前状态
query(world_id: string): Promise<WorldState>

// 让角色在当前世界状态中行动
act(options: {
  world_id: string;
  character: string;
  action: string;
}): Promise<string>  // 返回角色响应

// 搜索知识库
search(world_id: string, query: string): Promise<KnowledgeEntry[]>
```

---

## 6. 心跳脉冲流程（Pulse Flow）

每次脉冲是演化系统的最小执行单元。整个流程原子完成，中断不会损坏世界状态。

```
┌─────────────────────────────────────────────────────┐
│                   PULSE 开始                         │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
   张力分析                    成熟度测量
   （识别超阈值张力点）          （评估当前阶段）
          │                         │
          └────────────┬────────────┘
                       ▼
              自研究（gap analysis）
              （识别知识空洞）
                       │
                       ▼
              ┌────────────────┐
              │  决策：任务选择  │
              │  按成熟度加权   │
              └────────┬───────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      任务A         任务B         任务C
    （并行执行，最多3个任务）
          │            │            │
          └────────────┴────────────┘
                       │
                       ▼
              原子写入 WorldState
                       │
                       ▼
              分化检测
              （是否触发 branch）
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                   PULSE 完成                         │
└─────────────────────────────────────────────────────┘
```

### 成熟度决定任务权重

脉冲的任务选择不是随机的，由当前成熟度阶段决定重心：

| 当前阶段 | 研究 | 张力演化 | 测试/生成 | 涌现 |
|----------|------|----------|-----------|------|
| 阶段0→1  | 80%  | 20%      | —         | —    |
| 阶段1→2  | 30%  | 50%      | 20%       | —    |
| 阶段2→3  | —    | 30%      | 30%       | 40%（超越生成） |
| 阶段3→4  | —    | —        | 40%       | 60%（涌现） |

**逻辑：**
- 早期阶段（0-1）：世界需要大量来源知识，研究是主要任务
- 中期（1-2）：张力引擎开始驱动，内部矛盾开始浮现
- 晚期（2-3）：开始测试和生成超越内容，证明理解深度
- 成熟（3-4）：世界自主涌现，成为独立创作实体

---

## 7. CLI 命令

所有演化命令挂载在 `nutshell evolve` 子命令组下。

```bash
# 从种子初始化一个可演化的世界
nutshell evolve start --seed ./fma.json --tradition fma

# 执行单次脉冲（手动触发心跳）
nutshell evolve pulse --world world_fma_001

# 启动自动脉冲（每60秒一次心跳）
nutshell evolve watch --world world_fma_001 --interval 60

# 查看世界事件历史
nutshell evolve history --world world_fma_001

# 查看当前成熟度报告
nutshell evolve maturity --world world_fma_001

# 让角色在当前世界状态中行动
nutshell evolve act --world world_fma_001 --character "爱德华" --action "..."

# 触发世界分化（在阶段3+可用）
nutshell evolve branch --world world_fma_001

# 搜索知识库
nutshell evolve search --world world_fma_001 --query "等价交换"
```

**命令详解：**

```
nutshell evolve start
  --seed <path>           必需：世界种子 JSON 路径
  --tradition <name>      必需：传统名（用于搜索策略和标识）
  --output <dir>          可选：世界状态存储目录（默认 ~/.nutshell/worlds）

nutshell evolve pulse
  --world <world_id>      必需：世界标识符
  --dry-run               可选：模拟脉冲，不写入状态

nutshell evolve watch
  --world <world_id>      必需：世界标识符
  --interval <seconds>    可选：脉冲间隔（默认 3600 秒）
  --until-stage <n>       可选：达到指定阶段后自动停止

nutshell evolve history
  --world <world_id>      必需：世界标识符
  --type <event_type>     可选：过滤事件类型
  --since <ISO date>      可选：只显示此日期之后的事件
  --limit <n>             可选：最多显示 n 条

nutshell evolve maturity
  --world <world_id>      必需：世界标识符
  --full                  可选：显示完整评分细节

nutshell evolve act
  --world <world_id>      必需：世界标识符
  --character <name>      必需：角色名（需在知识库中存在）
  --action <text>         必需：行动/对话描述

nutshell evolve branch
  --world <world_id>      必需：源世界标识符
  --name <branch_name>    必需：分支名称
  --point <description>   必需：分化点描述

nutshell evolve search
  --world <world_id>      必需：世界标识符
  --query <text>          必需：搜索词
  --type <entry_type>     可选：过滤条目类型
  --dim <dimension>       可选：按世界种子维度过滤
```

---

## 8. 与现有系统的关系

### 系统边界图

```
packages/core
─────────────────────────────────────────────────
WorldSeed 生成（nutshell seed）
SoulBundle 结晶（nutshell soul）
  │
  │  输出：WorldSeed（JSON），SoulBundle（JSON）
  │
  ▼
packages/evolution                         ← 本系统
─────────────────────────────────────────────────
接收 WorldSeed 作为阶段0起点
驱动从阶段0到阶段4的演化
  │
  │  输出：WorldState（动态），KnowledgeBase（积累），WorldEvent（历史）
  │
  ▼
characters/（120角色库）
─────────────────────────────────────────────────
现有120个角色的 soul.md / memory.md / skill.md
是各自世界的**阶段0快照**
等待通过演化系统升级
```

### 与 `packages/core` 的对接

```typescript
import { WorldSeed } from "@nutshell/core";
import { createWorld } from "@nutshell/evolution";

// core 负责生成种子，evolution 负责演化
const seed: WorldSeed = JSON.parse(await fs.readFile("fma.json", "utf-8"));
const world = await createWorld(seed, "fma");
// 此后 seed 只读，evolution 不修改种子
```

**设计原则**：`packages/core` 不依赖 `packages/evolution`。种子是单向输入，演化结果不回写种子。

### 与 `skills/linggen` 的关系

`skills/linggen` 包含**界的厚度理论**——这是演化系统的理论基础：

- 界的6个层次对应角色成熟度的不同深度
- "界的厚度"决定角色在边界情况下能否保持一致性
- 成熟度阶段0-4 是界的厚度的可测量操作化

演化系统让"界的厚度"从理论框架变成可驱动、可测量的工程实践。

---

## 9. 实施计划

### Week 1 — 基础类型与状态层

**目标**：能创建和持久化一个世界状态。

```
types.ts          所有接口定义（本文档第4节的完整实现）
state.ts          createWorld / loadWorld / saveWorld / listWorlds
prompts.ts        演化系统专用 prompt 模板
                  （区别于 core/prompts.ts 的种子生成 prompt）
```

**里程碑**：`nutshell evolve start --seed ./fma.json --tradition fma` 能成功运行，生成 `world_fma_001/state.json`。

---

### Week 2 — 三大引擎（并行开发）

**目标**：三大引擎各自独立可运行。

```
tension.ts        张力分析 + 压力积累 + 超阈值事件生成
research.ts       gap analysis + 搜索词生成 + 网络查询 + 知识整合
events.ts         事件叙事生成 + state_delta 计算 + 事件查询
```

**里程碑（各自独立验证）：**
- `tension.ts`：给定 fma.json，能识别出3个以上张力点并描述其逻辑
- `research.ts`：给定"伊修瓦尔战役的政治影响"gap，能生成有效搜索词并返回相关知识条目
- `events.ts`：给定张力事件，能生成200-400字的散文叙事

---

### Week 3 — 评分器与脉冲

**目标**：单次脉冲端到端可运行。

```
maturity.ts       四道测验实现 + 阶段跃迁检测
pulse.ts          单次脉冲流程 + 任务加权选择 + 原子写入
branch.ts         分化检测 + 世界分支创建
```

**里程碑**：`nutshell evolve pulse --world world_fma_001` 能完整执行一次脉冲，写入更新后的 state.json，输出脉冲报告。

---

### Week 4 — 主引擎与端到端测试

**目标**：钢炼世界从阶段0演化到阶段1。

```
engine.ts         主引擎 API 实现（act / search / query）
CLI 集成          nutshell evolve 命令族完整实现
端到端测试        钢炼世界（fma）从阶段0到阶段1的完整演化验证
```

**里程碑（端到端验收）：**
```bash
# 1. 从种子启动
nutshell evolve start --seed ~/.nutshell/seeds/fma.json --tradition fma
# → world_fma_001 创建，maturity_stage: 0

# 2. 执行5次脉冲
for i in {1..5}; do nutshell evolve pulse --world world_fma_001; done

# 3. 查看成熟度
nutshell evolve maturity --world world_fma_001
# → 应显示接近阶段1的成熟度分数，coverage 维度显著提升

# 4. 让角色行动，验证回应质量超出种子压缩内容
nutshell evolve act \
  --world world_fma_001 \
  --character "爱德华·爱力克" \
  --action "描述你第一次理解等价交换的哲学局限性的时刻"
# → 响应应引用原作具体场景，而非重复种子中的抽象描述
```

---

## 附录：核心设计决策记录

### 决策 1：种子只读

种子（`WorldSeed`）在演化过程中不修改。所有演化结果写入 `WorldState`，种子作为不变的锚点。

**理由**：种子是世界的基因，演化是表现型的展开。修改基因会让溯源追踪失去意义。

### 决策 2：知识库不经过种子压缩

`KnowledgeBase` 的条目直接锚定来源，绕过 `WorldSeed` 的10维度框架。

**理由**：种子是有损压缩。如果研究结果先压缩进种子再读出，就失去了演化系统的核心价值——超越种子的能力。

### 决策 3：脉冲原子写入

每次脉冲的所有操作在结束时作为一个事务写入，不存在中间状态持久化。

**理由**：世界状态必须始终一致。允许中间状态会导致演化轨迹不可追溯。

### 决策 4：成熟度是来源覆盖的测量，不是生成质量的测量

成熟度评分测的是"世界对来源的理解深度"，不是"输出文本有多好"。

**理由**：质量是主观的。覆盖率和推导能力是可测量的、有清晰通过标准的指标。
