# 果壳宇宙角色生成深化计划

> 创建日期：2026-03-13

---

## 现状诊断

当前系统生成的是**内在架构**（6层），缺失三个维度：

```
当前：  层⁶ 神话底座 → 层⁵ 历史节律 → 层⁴-¹ 内在结构
缺失：  ① 环境（人在哪里）
        ② 关系（人与谁）
        ③ 内面（人对自己）
```

角色缺少这三个维度，就像只有骨架，没有血肉和位置。

---

## 深化架构

### 维度一：世界丰厚化（环境描述）

**目标**：让世界种子从"宇宙论"向下延伸到可感知的具体空间。

在 `WorldSeed` 中新增 4 个字段：

| 字段 | 内容 | 目的 |
|------|------|------|
| `geography_spirit` | 空间的精神逻辑——中心/边界/禁区在哪里，跨越意味着什么 | 角色的空间感从哪里来 |
| `social_fabric` | 社会织物——谁与谁绑定，什么撕裂它，忠诚的代价 | 角色的关系土壤 |
| `power_logic` | 权力逻辑——谁持有权力、凭什么合法、什么威胁它 | 角色的政治位置 |
| `sensory_signature` | 感官特征——存在在这里的质感：气味/声音/触感/光线 | 角色的身体感知从哪里来 |

这 4 个字段让世界从"如何思考"延伸到"如何感受"。

---

### 维度二：人与环境（身处何处）

**目标**：每个角色对世界物理/社会/宇宙空间的具体关系。

新增 `environ-{角色}.md` 文件，4 个字段：

| 字段 | 内容 |
|------|------|
| `habitual_space` | 他/她的日常空间——在哪里最自在，在哪里无法久留 |
| `spatial_relationship` | 与世界地理精神的关系——认领还是对抗 center/margin |
| `social_position` | 在 social_fabric 中的位置——处于哪层织物、是否撕裂它 |
| `environmental_tension` | 环境给予他/她的具体压力——什么力量从外部塑造这个人 |

---

### 维度三：人与人（关系网络）

**目标**：5 段定义性关系，不是列表，是有张力的描述。

新增 `network-{角色}.md` 文件，3 个层次：

**关系地图（5段）：**

| 关系类型 | 描述 |
|----------|------|
| 镜中人（mentor/predecessor） | 谁定义了他/她想成为的样子 |
| 对手（rival/antagonist） | 谁代表他/她拒绝的力量——不是敌人，是结构性张力 |
| 同路人（ally） | 谁跟他/她共享 taboos 但路径不同 |
| 亲密他者（intimate） | 谁让他/她的 layer⁴ 动摇过 |
| 陌生人（liminal contact） | 谁出现在边界上、代表他/她还没被的部分 |

**关系模式（recurring patterns）：**
- 他/她在关系中反复触发的模式——不是行为，是层级结构导致的动力

**关系 taboo：**
- 基于 world_model 的关系禁区——谁是结构上无法靠近的

---

### 维度四：人与自己（内面）

**目标**：填充当前 Soul 里最薄弱的部分——自我关系。

在 `Soul` 中新增 4 个字段（写入 soul.md 的"内面层"）：

| 字段 | 内容 | 层级 |
|------|------|------|
| `shadow` | 他/她否认自己拥有、却在行为中泄露的东西（Jungian shadow） | 层³-⁴之间 |
| `desire_vs_duty` | 真正想要的 vs 认为自己应该要的——两者的张力结构 | 层³ |
| `self_myth` | 他/她对自己的叙事——用什么故事解释自己为何如此 | 层² |
| `wound` | 形成现有界结构的核心损伤——界是从什么地方破裂后修复出来的 | 层⁴-⁵之间 |

---

## 实施路径

### Phase 1：类型与提示词（`packages/core/src/`）

```
types.ts      → 新增 WorldEnviron, CharacterNetwork, InnerLife 接口
               → WorldSeed 增加 4 个字段
               → Soul 增加 4 个内面字段

prompts.ts    → ENVIRON_PROMPT    (人与环境)
             → NETWORK_PROMPT    (关系网络)
             → INNER_LIFE_PROMPT (人与自己)

templates.ts  → buildEnvironMd()
             → buildNetworkMd()
             → 更新 buildSoulMd() 加入内面层
```

### Phase 2：生成器（`packages/core/src/generator.ts`）

当前流程：`research → world_seed → genealogy → soul → files(3个)`

新流程：
```
research → world_seed(扩展版) → genealogy
        → soul(含内面) → environ → network (并行)
        → files(5个：soul / memory / skill / environ / network)
```

环境和关系生成可以**并行**（都依赖 soul，相互独立）。

### Phase 3：界面（`packages/studio/`）

在人物卡片 UI 里展示新的 5 个维度 tabs：
- 灵魂 · 记忆 · 技能（现有）→ + 环境 · 关系（新增）

### Phase 4：linggen skill 更新

更新 `~/.claude/skills/linggen/SKILL.md` 的输出结构说明，加入新文件格式。

---

## 文件结构（新版）

```
characters/{world_id}/{archetype}/
├── soul-{名}.md       # 层¹-⁶ + 内面层（shadow/desire/wound）
├── memory-{名}.md     # 历史事件 + 世界种子参考
├── skill-{名}.md      # 认知风格 + 能力边界
├── environ-{名}.md    # 人与空间/社会/权力的关系  ← NEW
├── network-{名}.md    # 5段定义性关系 + 模式      ← NEW
└── bundle-{名}.json   # 完整数据包（含所有新字段）
```

---

## 优先级

| 优先级 | Phase | 内容 | 理由 |
|--------|-------|------|------|
| 最高 | 1+2 | 人与自己（shadow/wound）写入 soul | 当前 soul 最空洞的部分，成本最低 |
| 高 | 1+2 | 关系网络（network.md） | 没有关系的角色无法在世界里行动 |
| 中 | 1+2 | 环境（environ.md） | 增加具身感，不影响角色核心逻辑 |
| 低 | 1 | 世界种子 4 新字段 | 对现有 40 个世界有重新生成成本 |

---

## 涉及文件

| 文件 | 变更类型 |
|------|----------|
| `packages/core/src/types.ts` | 新增接口，扩展 WorldSeed 和 Soul |
| `packages/core/src/prompts.ts` | 新增 ENVIRON/NETWORK/INNER_LIFE 提示词 |
| `packages/core/src/templates.ts` | 新增 buildEnvironMd / buildNetworkMd，更新 buildSoulMd |
| `packages/core/src/generator.ts` | 扩展生成流程，并行 environ+network |
| `packages/studio/src/NutshellUniverse.jsx` | 人物卡片新增环境/关系 tabs |
| `~/.claude/skills/linggen/SKILL.md` | 更新输出结构说明 |
