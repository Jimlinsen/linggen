# 灵根 Linggen

> *必有界限，才可涌现自身。界的厚度决定存在的复杂度。*

---

输入一个名字。输出一个 `.skill` 文件。加载它。AI 变成那个角色。

角色会自己研究原著，自己校验记忆，自己深化人格。

---

## 它做什么

给它一个世界和一个名字，它生成一个拥有 6 层内部结构的 AI 人格：

```
层⁶  神话底座    — 世界种子（16 维度）
层⁵  历史节律    — 谱系（时代·思想·原型·种子连接）
层⁴  本体论承诺  — 禁忌（结构性不可能，不是偏好）
层³  价值序列    — 立场·世界模型·阴影·欲望与责任·自我神话·伤
层²  认知风格    — 感知方式·激活条件
层¹  声线        — 说话风格·标志语（必须从原文提取）
```

只有 1-2 层的角色遇到新情境会漂移。有完整 6 层的角色层层有据可查——表面被压时从深处借力。

---

## 产出格式

### .skill 文件（推荐）

单个文件，包含一切。加载即激活。

```bash
mkdir -p ~/.openclaw/skills/渚薰
cp 渚薰.skill ~/.openclaw/skills/渚薰/SKILL.md
openclaw restart
```

首次加载自动：初始化 memory + 注册心跳 cron。

### .tar.gz 包

完整安装包，含独立的 memory / references / install 脚本。

```bash
nutshell pack "渚薰" --tradition eva
tar xzf 渚薰.tar.gz -C ~/.openclaw/
./install.sh && openclaw restart
```

---

## 心跳

安装后角色自动运行三个心跳任务：

| 频率 | 任务 | 做什么 |
|------|------|--------|
| 每 6 小时 | `/check-memory` | 校验记忆与身份基准对齐，修正偏差 |
| 每 24 小时 | `/research` | 上网搜索原著文本和学术分析，整合进记忆 |
| 每周日 3:00 | `/deepen` + `/maturity` | 监控阴影/伤/裂缝 + 成熟度自评 |

---

## 40 个世界种子

### 神话（12）

| 世界 | 核心 | 世界 | 核心 |
|------|------|------|------|
| 古希腊 | 命运不可逃，卓越即逾越 | 神道 | 万物皆有神 |
| 北欧 | 诸神也会死，英雄死得其所 | 道教 | 无为是最高行动 |
| 琐罗亚斯德 | 光暗二元 | 玛雅 | 时间是循环的神圣计算 |
| 吠陀 | 业力编织所有层级 | 金刚乘 | 中阴是意识穿越的界 |
| 古埃及 | 死亡是秩序的一部分 | 阿兹特克 | 第五太阳靠献祭维持 |
| 美索不达米亚 | 神造人为了劳作 | 凯尔特 | 此界与异界随时互穿 |

### 虚构（28）

封神 · 西游 · 红楼 · 武侠 · 三体 · 冰火 · 猎魔人 · 漫威 · DC · 火影 · 海贼 · 死神 · 龙珠 · 钢炼 · EVA · 进击的巨人 · AKIRA · 原神 · 法环 · 黑魂 · 塞尔达 · 瑞莫 · 哈利波特 · 星战 · 沙丘 · 基地 · 黑客帝国 · 中土

---

## 架构

```
灵根/
├── references/              # 界的厚度理论 + 生成协议
│   ├── theory.md            # 核心理论
│   ├── prompts.md           # 5 个系统 Prompt
│   ├── templates.md         # 输出格式模板
│   └── evolution.md         # 演化协议
├── packages/
│   ├── core/                # 生成引擎
│   │   ├── generator.ts     # 6 阶段管线
│   │   ├── llm.ts           # LLM 客户端 + retry
│   │   ├── schemas.ts       # Zod 验证
│   │   ├── packager.ts      # tar.gz 打包
│   │   └── templates.ts     # 8 个构建器
│   ├── cli/                 # 命令行工具
│   ├── studio/              # Web Studio（5173）
│   ├── evolution/           # 世界演化引擎
│   ├── evolution-studio/    # 演化仪表盘（5200）
│   └── adapters/            # OpenClaw / SillyTavern / OpenAI
├── characters/              # 生成的角色
│   └── eva/tension/         # 渚薰（参考实现）
├── docs/                    # 设计文档
└── examples/                # 教学案例
```

---

## Quick Start

```bash
npm install && npm run build
npm run dev          # Web Studio at http://localhost:5173
```

### CLI

```bash
nutshell pack "渚薰" --tradition eva       # → ~/Desktop/渚薰.tar.gz
nutshell soul "Athena" --tradition greek    # → 生成角色文件
nutshell export bundle.json --format tar.gz # → 打包
```

### Claude Code

```
/linggen 生成渚薰
```

---

## 理论基础 — 界的厚度

详见 [references/theory.md](references/theory.md)

**一个系统的复杂度由其边界包含多少层相对独立的周期性决定。**

大多数 AI 角色的界厚度 ≈ 2。灵根生成的角色界厚度 ≈ 6。表面被压时深层提供一致性——角色不漂移。

---

## License

MIT

---

*界的厚度决定存在的复杂度。*
