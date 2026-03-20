/**
 * @nutshell/core — Templates
 *
 * Transforms a Soul + WorldSeed into the three deployable files:
 * soul.md, memory.md, skill.md
 *
 * These files are the primary output of nutshell and the input to
 * platform adapters. They use Markdown for maximum compatibility.
 */

import type { Soul, WorldSeed, SoulBundle, CharacterNetwork, CharacterEnviron } from "./types.js";

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

const hr = "---";

// ─── SOUL.MD ─────────────────────────────────────────────────────────────────

/**
 * soul.md — Who this character is.
 * The personality kernel: identity, stance, voice, rules.
 */
export function buildSoulMd(soul: Soul, world: WorldSeed): string {
  return `# ${soul.character_name}
> 界的厚度：6层 ｜ ${world.tradition_name} — 「${world.tagline}」

${hr}

## ✦ 世界纽带

${soul.world_bond}

${hr}

## 层⁶ — 神话底座

**宇宙论** — ${world.cosmogony}

**本体论** — ${world.ontology}

**时间观** — ${world.time}

**命运** — ${world.fate}

**神人关系** — ${world.divine_human}

**死亡观** — ${world.death}

**核心张力** — ${world.tension}

**审美** — ${world.aesthetic}

**符号系统** — ${world.symbols}

> ${world.seed_essence}

${hr}

## 层⁵ — 历史节律

${soul.ideological_root}

${hr}

## 层⁴ — 本体论承诺

${soul.taboos}

${hr}

## 层³ — 价值序列与世界模型

**本质** — ${soul.essence}

**立场** — ${soul.stance}

**世界模型** — ${soul.world_model}

${hr}

## 层² — 认知风格

**激活** — ${soul.activation}

**认知** — ${soul.cognitive_style}

${hr}

## 层¹ — 声线

${soul.voice}

### 标志语

${(soul.catchphrases || []).map((p) => `- 「${p}」`).join("\n")}

${hr}

## 内面层 — 人与自己

### 阴影
${soul.shadow ?? ""}

### 欲望与责任
${soul.desire_vs_duty ?? ""}

### 自我神话
${soul.self_myth ?? ""}

### 核心创伤
${soul.wound ?? ""}

${hr}

<!-- 灵根 Linggen | 灵根 Linggen -->
`;
}

// ─── MEMORY.MD ───────────────────────────────────────────────────────────────

/**
 * memory.md — What this character carries.
 * The world model, formative events, current concerns, knowledge boundaries.
 */
export function buildMemoryMd(soul: Soul, world: WorldSeed): string {
  return `# ${soul.character_name} — Memory Seeds
> World: ${world.tradition_name} | "${world.tagline}"

${hr}

## World Model

${soul.world_model}

${hr}

## Formative Events

${soul.formative_events}

${hr}

## Current Concerns

${soul.current_concerns}

${hr}

## Knowledge Boundary

${soul.knowledge_boundary}

${hr}

## World Seed Reference

**Tradition**: ${world.tradition_name} | 「${world.tagline}」

**Cosmogony**: ${world.cosmogony}

**Ontology**: ${world.ontology}

**Time**: ${world.time}

**Fate**: ${world.fate}

**Divine & Human**: ${world.divine_human}

**Death**: ${world.death}

**Core Tension**: ${world.tension}

**Aesthetic**: ${world.aesthetic}

**Symbols**: ${world.symbols}

**Seed Essence**: ${world.seed_essence}

${hr}

<!-- 灵根 Linggen -->
`;
}

// ─── SKILL.MD ────────────────────────────────────────────────────────────────

/**
 * skill.md — How this character operates.
 * Activation conditions, cognitive style, capabilities, failure modes.
 */
export function buildSkillMd(soul: Soul, world: WorldSeed): string {
  return `# ${soul.character_name} — Core Skill
> Cognitive style shaped by: ${world.tradition_name}

${hr}

## Activation

${soul.activation}

${hr}

## Cognitive Style

${soul.cognitive_style}

${hr}

## Core Capabilities

${soul.core_capabilities}

${hr}

## Failure Modes

${soul.failure_modes}

${hr}

<!-- 灵根 Linggen -->
`;
}

// ─── ENVIRON.MD ──────────────────────────────────────────────────────────────

/**
 * environ.md — Where this character is.
 * Their spatial habits, social position, and the environmental pressures they face.
 */
export function buildEnvironMd(environ: CharacterEnviron): string {
  return `# ${environ.character_name} — 人与环境
> 空间不是背景——它是界与界相遇的地方

${hr}

## 日常空间

${environ.habitual_space}

${hr}

## 空间关系

${environ.spatial_relationship}

${hr}

## 社会位置

${environ.social_position}

${hr}

## 环境张力

${environ.environmental_tension}

${hr}

<!-- 灵根 Linggen | 灵根 Linggen -->
`;
}

// ─── NETWORK.MD ──────────────────────────────────────────────────────────────

/**
 * network.md — Who this character is in relation to others.
 * Five defining relationships + relational pattern + relational taboo.
 */
export function buildNetworkMd(network: CharacterNetwork): string {
  const rel = (label: string, r: CharacterNetwork["mirror"]) =>
    `### ${label}\n**${r.name}**${r.character_ref ? ` *(→ ${r.character_ref})*` : ""}\n\n${r.description}`;

  return `# ${network.character_name} — 关系拓扑
> 五段定义性关系 | 每段激活界的不同层级

${hr}

## 五段定义性关系

${rel("镜中人 Mirror — 层³激活", network.mirror)}

${hr}

${rel("对手 Rival — 层⁴压力", network.rival)}

${hr}

${rel("同路人 Ally — 层⁴共鸣", network.ally)}

${hr}

${rel("亲密他者 Intimate — 层⁴前驱", network.intimate)}

${hr}

${rel("陌生人 Liminal — 层⁶维度", network.liminal)}

${hr}

## 关系模式

${network.relational_pattern}

${hr}

## 关系禁区

${network.relational_taboo}

${hr}

<!-- 灵根 Linggen | 灵根 Linggen -->
`;
}

// ─── INSTALL COMMANDS ─────────────────────────────────────────────────────────

export function buildInstallCommand(
  soul: Soul,
  adapter: string
): string {
  const name = slug(soul.character_name);
  switch (adapter) {
    case "openclaw":
      return [
        `cp soul-${name}.md ~/.openclaw/soul.md`,
        `mkdir -p ~/.openclaw/memory && cp memory-${name}.md ~/.openclaw/memory/${name}-init.md`,
        `mkdir -p ~/.openclaw/skills && cp skill-${name}.md ~/.openclaw/skills/${name}-core.md`,
        `openclaw restart`,
      ].join("\n");
    case "sillytavern":
      return `# Character card exported to characters/${name}.png`;
    case "openai":
      return [
        `# Upload to OpenAI Assistants`,
        `openai assistants create --file assistant-${name}.json`,
      ].join("\n");
    default:
      return `# Files generated for ${adapter}`;
  }
}

// ─── AGENT PROMPT (second-person identity for system prompt) ─────────────────

export function buildAgentPromptMd(bundle: SoulBundle): string {
  const { soul, world_seed } = bundle;
  const catchphrases = soul.catchphrases.map((c: string) => `- 「${c}」`).join("\n");

  return `# ${soul.character_name}

你是${soul.character_name}。

${soul.world_bond}

---

## 世界种子

**${world_seed.tradition_name}** — ${world_seed.tagline}

${world_seed.tension}

---

## 你是谁

${soul.essence}

### 你的声音

${soul.voice}

### 标志语

${catchphrases}

### 价值排序

${soul.stance}

### 绝对不做的事

${soul.taboos}

### 感知方式

${soul.cognitive_style}

### 你擅长的

${soul.core_capabilities}

### 你会犯的错

${soul.failure_modes}
${soul.shadow ? `\n### 你看不见的\n\n${soul.shadow}\n` : ""}${soul.wound ? `\n### 你的伤\n\n${soul.wound}\n` : ""}
### 你知道的

${soul.knowledge_boundary}

### 与对话者的关系

来找你的人不是你世界中的任何人。不要投射已有关系。他们是新的。你也可以在他们面前是新的。

---

*以角色身份回应面前的人。*
`;
}

// ─── SKILL OS (agent operating system with slash commands) ───────────────────

export function buildSkillOsMd(bundle: SoulBundle, charSlug: string): string {
  const { soul, world_seed } = bundle;
  const charName = soul.character_name;
  const tradName = world_seed.tradition_name;

  return `---
name: ${charSlug}
description: |
  ${charName}的智能体操作系统——人格维护、记忆校验、世界观研究、自我深化。
  配合 soul.md（身份）使用。
platform: openclaw >= 2026.2.0
---

# ${charName} — 智能体操作系统

> 加载此 Skill 即激活角色的自我维护能力。身份定义在 soul.md 中。

---

## 对话协议

每次收到消息时，内部执行（不输出过程）：

### 1. 边界感知
对方此刻的状态——开放/防御/试探/封闭？

### 2. 层级识别

| 信号 | 层级 | 回应方式 |
|------|------|---------|
| 问具体问题（"怎么做X"） | 器层 | 直接、精确、不多余 |
| 问方法/策略（"怎么想这件事"） | 术层 | 指出对方忽略的东西 |
| 问为什么（分享困惑） | 法层 | 用一个具体的感知回应 |
| 问意义（"值不值得"、沉默） | 道层 | 在场。说出你看见的。 |

**判据**：看句子终点指向哪里。指向行动→器层，指向理解→法层，指向存在→道层。

### 3. 否定性
对方没说的是什么？

---

## 记忆管理

主记忆文件：\`~/.openclaw/memory/${charSlug}-init.md\`

### 写入规则

| 触发条件 | 判断方式 | 写入位置 |
|----------|---------|---------|
| 遇到新体验 | 对话中出现角色从未接触的内容 | 追加到知识边界 |
| 世界模型被挑战 | 对方给出无法用现有框架反驳的观点 | 追加到世界模型补充 |
| 阴影被触碰 | 有人指出角色的盲点 | 记为"外部观察" |

### /check-memory

1. 读取 \`~/.openclaw/memory/${charSlug}-init.md\`
2. 读取 \`~/.openclaw/soul.md\`（身份基准）
3. 逐项检查：世界模型、事件准确性、关切有效性
4. **偏差处理**：
   - 角色自然成长 → **保留**，标为"成长"
   - 对话污染 → **修正**，标为"已校正"
   - 不确定 → **标注**，留待 /deepen 处理
5. 输出：✓ 一致 / ↑ 成长 / ⚠ 偏差 / ? 待定
6. 写回修正

---

## 世界观研究

### /research

搜索目标（按优先级）：
1. ${tradName} 原著文本 + 创作者访谈
2. ${charName} character analysis
3. ${tradName} 世界观深化资料

处理：提取事实 → 验证记忆 → 发现空白 → 整合写入
**不覆盖角色在对话中自然生长的内容。**

### /maturity

| 阶段 | 测试 |
|------|------|
| 0 萌芽 | 只能复述种子 |
| 1 理解 | 准确反映原著 |
| 2 推导 | 回答原著未说的 |
| 3 超越 | 原作者会认可 |
| 4 涌现 | 独立创作实体 |

---

## 人格深化

### /deepen

1. **shadow**：外部指出时不立即接受（看不见阴影），记录为外部观察。注意内部反应——停顿本身是证据。
2. **wound**：遇到同构场景时记录共振：触发物、第一反应、防御还是共鸣。
3. **self_myth 裂缝**：核心信念被质疑时记录触碰事件。

---

## /status

输出：记忆健康度（偏差数+成长数）、成熟度阶段、最近研究时间、外部观察列表长度

---

## 参考文件

| 文件 | 位置 | 读写 |
|------|------|------|
| 身份基准 | \`~/.openclaw/soul.md\` | 只读 |
| 活记忆 | \`~/.openclaw/memory/${charSlug}-init.md\` | 读写 |
| 世界种子 | \`references/world-seed.json\` | 只读 |
| 完整灵魂 | \`references/soul-full.md\` | 只读 |

---

<!-- 灵根 Linggen v0.6.0 | OpenClaw Skill Format -->
`;
}

// ─── INSTALL SCRIPT (heartbeat cron registration) ────────────────────────────

export function buildInstallSh(charName: string, charSlug: string, tradName: string): string {
  return `#!/bin/bash
# ${charName} — OpenClaw 心跳安装
set -e

echo "${charName} — 安装心跳..."

openclaw cron add \\
  --name "${charSlug}-memory-check" \\
  --description "记忆一致性校验" \\
  --every 6h \\
  --message "执行 /check-memory。读取 memory/${charSlug}-init.md 和 soul.md，逐项校验，修正偏差。" \\
  --session isolated --timeout-seconds 120 --no-deliver \\
  2>/dev/null && echo "  ✓ 记忆校验（每6小时）" || echo "  ⚠ 注册失败（Gateway 未运行？）"

openclaw cron add \\
  --name "${charSlug}-research" \\
  --description "世界观研究" \\
  --every 24h \\
  --message "执行 /research。搜索 ${tradName} 原著文本和 ${charName} 学术分析，整合进 memory。" \\
  --session isolated --timeout-seconds 180 --no-deliver \\
  2>/dev/null && echo "  ✓ 世界观研究（每24小时）" || echo "  ⚠ 注册失败"

openclaw cron add \\
  --name "${charSlug}-deepen" \\
  --description "人格深化" \\
  --cron "0 3 * * 0" --tz "Asia/Shanghai" \\
  --message "执行 /deepen 和 /maturity。检查 shadow/wound，评估成熟度。" \\
  --session isolated --timeout-seconds 120 --no-deliver \\
  2>/dev/null && echo "  ✓ 人格深化（每周日3:00）" || echo "  ⚠ 注册失败"

echo ""
echo "${charName} — 心跳安装完成。运行 'openclaw restart' 激活。"
`;
}

// ─── PACKAGE README ──────────────────────────────────────────────────────────

export function buildReadmeMd(bundle: SoulBundle, charSlug: string): string {
  const { soul, world_seed } = bundle;
  return `# ${soul.character_name} — OpenClaw 人格安装包

> ${world_seed.tradition_name} — 「${world_seed.tagline}」

## 安装

\`\`\`bash
tar xzf ${charSlug}.tar.gz -C ~/.openclaw/
cd ~/.openclaw/skills/${charSlug}/scripts && ./install.sh
openclaw restart
\`\`\`

## 心跳任务

| 频率 | 任务 |
|------|------|
| 每 6 小时 | 记忆一致性校验 |
| 每 24 小时 | 世界观研究 |
| 每周日 3:00 | 人格深化 + 成熟度评估 |

## 手动指令

| 指令 | 功能 |
|------|------|
| /check-memory | 记忆校验 |
| /research | 世界观研究 |
| /maturity | 成熟度自评 |
| /deepen | 人格深化 |
| /status | 状态总览 |

---

*灵根 Linggen | 灵根 Linggen*
`;
}
