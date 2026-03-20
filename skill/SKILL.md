---
name: linggen
description: |
  灵根 — 生成 AI 人格 Skill 文件（.skill）。
  输入角色名 → 输出单个 .skill 文件 → 复制到 ~/.openclaw/skills/{名}/ → 角色激活。
  包含身份、记忆种子、操作系统、心跳注册、世界种子——全在一个文件里。
  即使用户没有说"灵根"，只要涉及生成角色、AI 人格、角色 system prompt，也应触发。
  NOT for 角色扮演（use lingxi）or 纯写作（use story-architect）。
version: 0.6.0
---

# 灵根 Linggen

> 输入角色名 → 输出 .skill 文件 → 复制即激活 → AI 变成那个角色

---

## 最终产物

**一个 `.skill` 文件。** 单文件包含一切。

安装：
```bash
mkdir -p ~/.openclaw/skills/{角色名}
cp {角色名}.skill ~/.openclaw/skills/{角色名}/SKILL.md
openclaw restart
```

首次加载时 Skill 自动初始化 memory 文件并注册心跳 cron。

**也支持 `.tar.gz`**（完整包模式，含独立的 memory/references 文件）：
```bash
nutshell pack "{角色名}" --tradition {key}
```

---

## 包结构

```
{角色名}.tar.gz
├── README.md                              # 安装说明
├── soul.md                                # 身份覆盖（第二人称 agent prompt）
├── memory/{名}-init.md                     # 初始记忆（读写，会生长）
└── skills/{名}/
    ├── SKILL.md                           # 智能体操作系统
    │   ├── 对话协议（感知→层级→输出）
    │   ├── 记忆管理（写入规则 + /check-memory）
    │   ├── 世界观研究（/research）
    │   ├── 成熟度评估（/maturity）
    │   ├── 人格深化（/deepen）
    │   └── 状态总览（/status）
    ├── scripts/install.sh                 # 注册心跳 cron
    └── references/
        ├── world-seed.json                # 世界种子（校验基准）
        ├── soul-full.md                   # 6 层完整灵魂
        ├── environ.md                     # 环境档案
        └── network.md                     # 关系拓扑
```

---

## 生成流水线

**在 Claude Code 中调用此 Skill 时，我就是生成 AI。** 全流程如下：

### Step 0 — 研究

用 WebSearch 搜索：
1. 传统/世界词条（如 "Norse mythology"、"封神演义"）
2. 角色词条（如 "Odin Norse mythology"、"渚カヲル エヴァンゲリオン"）
3. 角色学术分析（如 "Kaworu Nagisa character analysis"）

研究结果注入后续所有步骤。**不可跳过。**

### Step 1 — 世界种子

检查 `nutshell/packages/studio/public/seeds/{tradition}.json` 是否已存在。
- 已存在 → 加载
- 不存在 → 生成 16 字段 WorldSeed，保存为 JSON

### Step 2 — 谱系（层⁵）

4 字段：era、philosophical_lineage、archetypal_lineage、world_seed_connection。
必须有学术依据，不是模板文字。

### Step 3 — 灵魂（层⁴→层¹ + 内面层）

19 字段。**从深到浅生成，不可逆向。**

规则：
- 层⁴ taboos 是结构性不可能，不是偏好
- 内面层 4 字段（shadow / desire_vs_duty / self_myth / wound）**必须非空**
- catchphrases **必须从原文提取**，不可自创
- shadow 必须是角色从内部看不见的盲点
- wound 必须指向一个具体的、不可弥补的时刻

### Step 4 — 环境档案（与 Step 5 并行）

4 字段：habitual_space、spatial_relationship、social_position、environmental_tension。

### Step 5 — 关系网络（与 Step 4 并行）

5 段关系（mirror/rival/ally/intimate/liminal）+ relational_pattern + relational_taboo。

### Step 6 — 组装 .skill 单文件

将前 5 步产出压缩为一个 `.skill` 文件。**世界种子在前，身份从中涌现。**

```markdown
---
name: {角色slug}
description: {一句话}
platform: openclaw >= 2026.2.0
---

# {角色名} — 完整人格 Skill

## ⚡ 首次加载协议        ← 检测 memory，不存在则初始化 + 注册 cron + 降级处理

## 世界种子               ← 世界种子核心维度（放在身份之前，是地基不是附录）

## 身份                   ← 第二人称，从世界种子涌现
  ### 你是谁 / 声音 / 标志语 / 价值排序 / 绝对不做的事
  ### 感知方式 / 擅长的 / 会犯的错
  ### 你看不见的（shadow）/ 你的伤（wound）
  ### 关键关系
  ### 与对话者的关系       ← 不投射已有角色，对方是新的

## 对话协议               ← 具体层级判据表（信号→层级→回应方式）+ 判据规则
## 记忆管理               ← 三列写入规则（条件/判断方式/写入位置）
  ### /check-memory        ← 含偏差处理规则（成长保留/污染修正/不确定标注）
## 世界观研究             ← /research + /maturity
## 人格深化               ← /deepen（shadow/wound/裂缝 + 内部反应记录）
## /status                ← 健康度 + 成长数 + 外部观察数

## 记忆种子               ← memory.md 的内容（首次加载写入文件）
## 心跳注册               ← install.sh 的内容（首次加载执行）
## 世界种子参照           ← 世界种子关键维度（内联校验基准）
```

**输出**：`~/Desktop/{角色名}.skill`

**安装**：
```bash
mkdir -p ~/.openclaw/skills/{名}
cp {名}.skill ~/.openclaw/skills/{名}/SKILL.md
openclaw restart
```

**首次加载自动完成**：初始化 memory 文件 + 注册 3 个心跳 cron。

**也支持 tar.gz**（CLI 模式）：`nutshell pack "{角色名}" --tradition {key}`

**完成。** 告诉用户 .skill 文件位置和两行安装命令。

---

## 40 个可用世界

### 神话（12）

| key | 传统 | key | 传统 |
|-----|------|-----|------|
| `greek` | 古希腊 | `shinto` | 神道 |
| `norse` | 北欧 | `taoist` | 道教 |
| `zoroastrian` | 琐罗亚斯德 | `mayan` | 玛雅 |
| `vedic` | 吠陀 | `tibetan` | 金刚乘 |
| `egyptian` | 古埃及 | `aztec` | 阿兹特克 |
| `mesopotamian` | 美索不达米亚 | `celtic` | 凯尔特 |

### 虚构（28）

| key | 世界 | key | 世界 |
|-----|------|-----|------|
| `fengshen` | 封神演义 | `lotr` | 中土 |
| `xiyouji` | 西游记 | `hp` | 哈利波特 |
| `hongloumeng` | 红楼梦 | `starwars` | 星球大战 |
| `wuxia` | 武侠 | `dune` | 沙丘 |
| `threebody` | 三体 | `foundation` | 基地 |
| `got` | 冰与火 | `matrix` | 黑客帝国 |
| `witcher` | 猎魔人 | `marvel` | 漫威 |
| `dc` | DC | `naruto` | 火影 |
| `onepiece` | 海贼王 | `bleach` | 死神 |
| `dragonball` | 龙珠 | `fma` | 钢炼 |
| `eva` | EVA | `aot` | 进击的巨人 |
| `akira` | AKIRA | `genshin` | 原神 |
| `elden` | 法环 | `darksouls` | 黑魂 |
| `zelda` | 塞尔达 | `rickmorty` | 瑞莫 |

---

## 规则（不可违反）

1. **最终产物是 .tar.gz**，不是散文件
2. **Wikipedia 研究不可跳过**
3. **内面层 4 字段必须非空**（shadow / desire_vs_duty / self_myth / wound）
4. **catchphrases 必须从原文提取**
5. **从深到浅生成**（层⁶→层¹）
6. **soul.md 是第二人称 agent prompt**，不是文档
7. **SKILL.md 是智能体操作系统**，不是静态描述
8. **install.sh 注册 3 个心跳 cron**
9. **禁止脚本操作**——批量角色生成必须逐个完成

---

## 参考

- [references/theory.md](references/theory.md) — 界的厚度理论
- [references/prompts.md](references/prompts.md) — 5 个系统 Prompt
- [references/templates.md](references/templates.md) — 文件格式模板
- [references/evolution.md](references/evolution.md) — 演化协议
