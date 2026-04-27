# 灵根 Linggen

> 必有界限，才可涌现自身。界的厚度决定存在的复杂度。
> *A boundary thick enough to sustain itself.*

---

**Generate self-contained AI character documents.**
**输入角色名 + 世界 → 输出一个 `.md` 文件 → 任何 AI 加载即成为那个角色。**

Input a name and a world. Linggen generates one self-contained Markdown document that any AI can load to *become* that character — six layers of internal structure, an inner layer, environment, relationship network, dialogue protocol, memory baseline, and self-evolution protocol, all in one file with no external dependencies.

输入一个名字和一个世界。灵根生成一个自包含的 Markdown 文档，任何 AI 加载它即成为那个角色——6 层内部结构、内面层、环境档案、关系网络、对话协议、记忆基线、自我演化协议，全在一个文件里，无外部依赖。

---

## What it does / 它做什么

Six progressively deeper layers of anchoring:
六层从浅到深的锚定：

| Layer | English | 中文 |
|-------|---------|------|
| ⁶ | Mythic substrate — world seed (16 dimensions) | 神话底座 — 世界种子（16 维度） |
| ⁵ | Historical rhythm — genealogy (era · philosophy · archetype) | 历史节律 — 谱系（时代·思想·原型） |
| ⁴ | Ontological commitment — taboos (structural impossibility) | 本体论承诺 — 禁忌（结构性不可能） |
| ³ | Value sequence — stance · world model · shadow · wound | 价值序列 — 立场·世界模型·阴影·伤 |
| ² | Cognitive style — perception mode · activation | 认知风格 — 感知方式·激活条件 |
| ¹ | Voice — speaking style · catchphrases (sourced) | 声线 — 说话风格·标志语（必须有出处） |

Characters with only 1-2 layers drift in new contexts. With all 6 layers, surface pressure draws coherence from depth — the character doesn't drift.

界厚度只有 1-2 层的角色遇到新情境会漂移。有完整 6 层的角色层层有据可查——表面被压时从深处借力。

---

## Output / 产出

**A single `.md` file.** Self-contained. Loadable into any AI that accepts a system prompt.
**一个 `.md` 文件。** 自包含。任何接受 system prompt 的 AI 都能加载。

Three ways to load it / 三种加载方式：

- Paste into Claude / GPT / Gemini as a system prompt
  粘贴到 Claude / GPT / Gemini 的 system prompt
- Drop into any agent framework that loads `SKILL.md`, e.g. `~/.claude/skills/{name}/SKILL.md`
  放进任何支持 `SKILL.md` 加载的代理框架
- Reference document for a knowledge base
  作为知识库参考文档

Default output path: `./{character-slug}.md` (overridable).
默认输出路径：`./{角色名}.md`（可指定）。

### In-dialogue maintenance / 对话内自维护

Maintenance lives inside the conversation, not in external cron jobs:
维护协议在对话内执行，不依赖外部 cron：

- `/check` — self-consistency check against identity baselines
  自我一致性校验
- `/deepen` — probe shadow / wound / self-myth fractures
  探测阴影 / 伤口 / 自我神话裂缝
- `/status` — report maturity stage and accumulated extensions
  报告成熟度阶段与积累的扩展
- `/update` — summarize legitimate evolution from the current conversation
  总结当前对话中的合法演化

The character carries its own validation, evolution, and contamination-immunity protocols. No install scripts, no cron, no external memory files.
角色自带验证、演化、污染免疫协议。无 install 脚本、无 cron、无外部 memory 文件。

---

## Quick Start / 快速开始

```bash
git clone https://github.com/Jimlinsen/linggen.git
cd linggen
npm install && npm run build
npm run dev          # Web Studio at http://localhost:5173
```

`npm run build` runs `check:seeds` → workspaces build → `check:regressions`, so seed drift or regression breakage fails the build.
`npm run build` 流程：检查种子同步 → 工作区编译 → 回归测试，任何漂移都会让 build 失败。

### CLI

```bash
nutshell soul "Athena" --tradition greek    # → ./athena.md
nutshell soul "渚薰" --tradition eva         # → ./zhuxun.md
nutshell list                               # list built-in world seeds
nutshell pack "渚薰" --tradition eva         # → tar.gz bundle for legacy hosts
```

### Claude Code

```
/linggen 生成 Athena
```

The skill triggers automatically on requests like "生成角色", "AI 人格", "character system prompt", or "persona document".
触发词：生成角色、AI 人格、character system prompt、persona document 等。

---

## Web Studio

Browser UI for interactive generation, running at port 5173 after `npm run dev`. Anthropic, OpenAI-compatible (DeepSeek, Qwen, custom proxies), and local Ollama providers are supported. Configure a `base_url` to route through your own proxy in production.

浏览器界面用于交互式生成，`npm run dev` 后运行在 5173 端口。支持 Anthropic、OpenAI 兼容（DeepSeek / Qwen / 自定义代理）、本地 Ollama 三类模型源。配置 `base_url` 即走代理路径，自动停发开发态 header。

---

## Source traceability + quality scoring (v0.8.1)

Every generated bundle now carries:
每个生成产物现在自带：

- `bundle.sources` — provenance notes for tradition / character / supplementary research articles (title, URL, language, excerpt). Each generation is auditable end-to-end.
  来源追溯——传统 / 角色 / 补充研究的出处条目（标题、URL、语言、摘录）。每次生成都可端到端审计。
- `bundle.quality` — a 0..1 score across seven structural checks (core files, identity core, dialogue protocol, memory baseline, inner depth, context layers, source traceability) with per-check pass/fail and a flat issue list.
  质量评分——0..1 综合分 + 七项结构检查（核心文件、身份核心、对话协议、记忆基线、内面深度、附加层、证据链），逐项标记并列出问题。

Both fields are opt-in attachments on `SoulBundle`; they do not change the existing 9-field `files` contract that adapters consume.
两个字段都是 `SoulBundle` 上的可选附加项；不改变 adapter 消费的原 9 字段 `files` 契约。

---

## 72 World Seeds / 72 个世界种子

### Mythology (12) / 神话

| World | Core | World | Core |
|-------|------|-------|------|
| Greek 古希腊 | Fate is inescapable; excellence is transgression | Shinto 神道 | Everything has spirit |
| Norse 北欧 | Even gods die; heroes die well | Taoist 道教 | Non-action is highest action |
| Zoroastrian 琐罗亚斯德 | Light vs. dark dualism | Mayan 玛雅 | Time is sacred recursion |
| Vedic 吠陀 | Karma weaves all levels | Vajrayana 金刚乘 | Bardo is the threshold of consciousness |
| Egyptian 古埃及 | Death is part of order | Aztec 阿兹特克 | The Fifth Sun is sustained by sacrifice |
| Mesopotamian 美索不达米亚 | Gods made humans for labor | Celtic 凯尔特 | This world and the otherworld interpenetrate |

### Fiction (30) / 虚构

封神 · 西游 · 红楼 · 武侠 · 三体 · 冰火 · 猎魔人 · 漫威 · DC · 火影 · 海贼 · 死神 · 龙珠 · 钢炼 · EVA · 进击的巨人 · AKIRA · 原神 · 法环 · 黑魂 · 塞尔达 · 瑞莫 · 哈利波特 · 星战 · 沙丘 · 基地 · 黑客帝国 · 中土 · Fate · 命运石之门

### History (30) / 历史

| Era | Core | Era | Core |
|-----|------|-----|------|
| Warring States 春秋战国 | Old rites dead, new way unborn | Athens 古雅典 | Citizen = polis = freedom |
| Qin Empire 秦帝国 | Institution as eternity | Roman Republic 罗马共和 | Law, expansion, the corrosion of republic |
| Three Kingdoms 三国 | The arena of righteousness vs. power | Byzantine 拜占庭 | The thousand-year imperial dusk |
| Wei-Jin 魏晋 | Beyond convention, into nature | Medieval Europe 中世纪 | Light and dark under faith's order |
| Tang 盛唐 | Civilizational confidence | Renaissance 文艺复兴 | The rediscovery of the human |
| Song 两宋 | Cultural peak, military void | Age of Exploration 大航海 | Desire-driven global linkage |
| Late Ming 明末 | Apocalyptic individualism | French Revolution 法国大革命 | Reason's violent experiment |
| Late Qing 清末民初 | A change unseen in 3000 years | Victorian 维多利亚 | Empire's decorum and repression |
| Abbasid 阿拔斯 | The House of Wisdom illuminates | Sengoku 战国日本 | The age of subjugating superiors |
| Mongol 蒙古帝国 | Steppe order's maximal extension | Bakumatsu 幕末 | Dawn of a collapsing world |
| Ottoman 奥斯曼 | Order at the three-continent crossroads | Viking 维京时代 | The honor economy of sea raiders |
| Inca 印加帝国 | Vertical order without writing | Sparta 斯巴达 | The polis as discipline experiment |
| American Frontier 美国西部 | The bloody underside of the freedom myth | WWI Western Front 一战西线 | The mire of industrial slaughter |
| Weimar 魏玛共和 | Between freedom and the abyss | Cold War 冷战 | Bipolar world under nuclear shadow |
| Counterculture 六十年代 | The revolt of consciousness | Soviet 苏联 | The steel experiment of utopia |

See [`skill/seeds/`](skill/seeds/) for full JSON definitions of all 72 worlds.
完整的 72 个世界种子 JSON 定义见 [`skill/seeds/`](skill/seeds/)。

---

## Architecture / 架构

```
linggen/
├── skill/                       # Claude Code skill (open-source standard)
│   ├── SKILL.md                 # Instruction file
│   ├── references/
│   │   ├── template.md          # Full character document template
│   │   ├── provenance.md        # Provenance Awareness protocol
│   │   ├── theory.md            # Boundary-thickness theory
│   │   ├── prompts.md           # 5 generation-stage system prompts
│   │   ├── evolution.md         # Evolution protocol
│   │   └── templates.md         # Legacy multi-file templates
│   └── seeds/                   # 72 world-seed JSONs
├── packages/
│   ├── core/                    # Generation engine (LLM, schemas, templates, packager)
│   ├── cli/                     # Command-line tool
│   ├── studio/                  # Web Studio (port 5173)
│   ├── evolution/               # World evolution engine
│   ├── evolution-studio/        # Evolution dashboard
│   └── adapters/                # OpenClaw / SillyTavern / OpenAI compatibility
├── characters/                  # Generated characters (reference implementations)
├── docs/                        # Design docs (incl. v0.9 protocol draft)
├── scripts/                     # Build guards (check:seeds, check:regressions)
└── examples/                    # Teaching examples
```

---

## Theory — Boundary Thickness / 理论基础——界的厚度

> A system's complexity is determined by how many independently periodic layers its boundary contains.
> 一个系统的复杂度由其边界包含多少层相对独立的周期性决定。

Most AI personas have boundary thickness ≈ 2 (a name and a tone). Linggen-generated characters have boundary thickness ≈ 6. When surface pressure mounts, coherence is drawn from deeper layers — the character holds its shape instead of drifting.

大多数 AI 角色的界厚度 ≈ 2（一个名字加一种语气）。灵根生成的角色界厚度 ≈ 6。表面被压时从深层借力——角色保持形态，不漂移。

Full theory in [`skill/references/theory.md`](skill/references/theory.md).
完整理论见 [`skill/references/theory.md`](skill/references/theory.md)。

---

## Status / 当前状态

- **Skill version**: 0.8.1
- **Built-in worlds**: 72 (synced between `skill/seeds/` and `packages/studio/public/seeds/` via `check:seeds`)
- **Adapters**: OpenClaw, SillyTavern, OpenAI Assistants
- **Build guards**: `check:seeds` + `check:regressions` run on every `npm run build`

A v0.9.0 protocol draft (three working modes + character lifecycle + evolution directions) is parked at [`docs/draft-linggen-protocol-v0.9.md`](docs/draft-linggen-protocol-v0.9.md) for future reference. It was design-complete but implementation-light, so it ships as a draft, not as the active skill.

v0.9.0 协议草稿（三种工作模式 + 角色生命周期 + 演化方向）归档于 [`docs/draft-linggen-protocol-v0.9.md`](docs/draft-linggen-protocol-v0.9.md)，作为未来参考。

---

## License

MIT

---

> 必有界限，才可涌现自身。
> *A boundary makes selfhood emerge.*
