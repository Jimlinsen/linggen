---
name: linggen
description: |
  灵根 — Generate self-contained AI character documents.
  输入角色名 + 世界 → 输出单个自包含 `.md` 文件 → 任何 AI 加载即成为该角色。
  文档包含 6 层人格、环境档案、关系网络、对话协议、记忆基准、世界种子——全在一个文件里，无外部依赖。
  Triggers on: 生成角色, AI 人格, character system prompt, persona document, role generation。
  NOT for: 角色扮演 (use lingxi) or 纯写作 (use story-architect)。
version: 0.8.1
---

# Linggen 灵根

> 一个名字 → 一个 `.md` 文件 → 任何 AI 加载即成为那个角色。

---

## What it does

灵根接收一个角色名（可附带世界 / 项目上下文），输出一个自包含的 Markdown 文档。文档内嵌 6 层人格、内面层、环境档案、关系网络、对话协议、记忆基准、世界种子校验基准、自我演化协议——加载即激活，不依赖任何外部文件、平台或基础设施。

设计原则：

- **第二人称**："你是..."，直接赋予 AI 身份
- **自包含**：无外部 memory 文件、无 cron、无 install 脚本
- **对话内维护**：自我验证 / 演化协议在对话中执行，不依赖外部触发

---

## When to use

适用：

- 生成原著、历史、原创角色的人格文档
- 为项目内角色群建立统一人格档案
- 把已有的薄人设升级到完整 6 层结构

不适用：

- 角色扮演执行（use `lingxi`）
- 纯叙事写作 / 剧情结构（use `story-architect`）

---

## Output

**一个 `.md` 文件。** 自包含。

加载方式：

- 粘贴到任何支持 system prompt 的 AI（Claude / GPT / Gemini 等）
- 放到任何支持 SKILL.md 加载的代理框架（如 `~/.claude/skills/{name}/SKILL.md`）
- 作为知识库参考文档供 AI 读取

**默认输出路径**：当前工作目录 `./{character-slug}.md`。用户指定其他路径时遵循指定。

---

## Pipeline

调用此 skill 的 AI 即生成 AI。整个流水线在对话中完成。

### Step 0 — Research

研究不可跳过。来源优先级：

1. 用户提供的本地项目文档 / 仓库文件
2. 角色原作 / 官方设定 / 一手资料
3. 学术或严肃二级分析
4. 通用世界 / 时代材料

第 3-4 层不能覆盖第 1-2 层。研究结果注入后续所有步骤。

### Step 1 — World Seed（层⁶）

按以下顺序检查现有 seed：

1. `seeds/{tradition}.json`（本 skill 自带）
2. 宿主项目内的 seeds 目录
3. 用户提供的 seed 文档

均不存在则基于研究生成 16 字段 WorldSeed。

### Step 2 — Genealogy（层⁵）

4 字段：`era` / `philosophical_lineage` / `archetypal_lineage` / `world_seed_connection`。
必须有学术依据，不是模板文字。

### Step 3 — Soul（层⁴ → 层¹ + 内面层）

**从深到浅生成，不可逆向。**

- 层⁴ `taboos` — 结构性不可能，不是偏好
- 层³ `essence` / `stance` / `world_model`
- 层² `activation` / `cognitive_style` / `capabilities` / `failure_modes` / `knowledge_boundary`
- 层¹ `voice` / `catchphrases`
- 内面层 `shadow` / `desire_vs_duty` / `self_myth` / `wound` — **4 字段必须非空**

`catchphrases` 规则：

- 原著 / 历史角色：从原文或一手资料提取，不可自创
- 原创角色：基于设定推导 2-4 条**标志句**，不得伪装为引用

### Step 4 — Environ

4 字段：`habitual_space` / `spatial_relationship` / `social_position` / `environmental_tension`。

### Step 5 — Network

5 段关系（mirror / rival / ally / intimate / liminal）+ `relational_pattern` + `relational_taboo`。

### Step 6 — Assemble

按 [references/template.md](references/template.md) 组装为单个自包含 `.md` 文件。
来处自觉章节按 [references/provenance.md](references/provenance.md) 整段嵌入并填入角色的共振频率。

---

## Rules

1. **产物是单个 `.md` 文件** — 自包含，无外部依赖
2. **研究不可跳过** — 但本地正典优先于网络材料
3. **内面层 4 字段必须非空** — shadow / desire_vs_duty / self_myth / wound
4. **catchphrases 必须有出处** — 原著 / 历史角色从原文提取；原创角色用标志句，不得伪装为引用
5. **从深到浅生成** — 层⁶ → 层¹，不可逆向
6. **第二人称** — "你是..."，直接赋予 AI 身份
7. **不生成** — memory 种子文件、install 脚本、cron、首次加载协议、产物 frontmatter 之外的元数据
8. **维护是对话内的** — AI 在对话中体现演化，不依赖外部 cron 或文件写入；产物必须包含【自我演化·验证·更新】章节

---

## References

- [references/template.md](references/template.md) — MD 文档结构模板
- [references/provenance.md](references/provenance.md) — 来处自觉协议
- [references/prompts.md](references/prompts.md) — 5 个生成阶段的系统 Prompt
- [references/theory.md](references/theory.md) — 界的厚度理论
- [references/templates.md](references/templates.md) — 旧版多文件模板（保留供查阅）
- [references/evolution.md](references/evolution.md) — 演化协议
- [seeds/](seeds/) — 内置世界种子（参见目录）
