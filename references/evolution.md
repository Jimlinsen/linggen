# 灵根 — 世界演化系统协议

> 种子是压缩包，演化是解压，来源（原作/神话）是真正的参照。

---

## 核心命题

世界种子是对来源（原作/神话/文明）的有损压缩。演化的目标不是扩展种子，而是让世界逐步逼近并最终超越来源本身。

---

## 成熟度五阶段

| 阶段 | 名称 | 特征 | 参照基准 |
|------|------|------|----------|
| 0 | 萌芽 Seedling | 只能重复种子内容 | 种子 |
| 1 | 理解 Understanding | 准确反映来源全部内容 | 来源本身 |
| 2 | 推导 Derivation | 能说出来源未写但逻辑上存在的内容 | 来源内在逻辑 |
| 3 | 超越 Transcendence | 生成新内容，原作者会认可 | 原作者认可测试 |
| 4 | 涌现 Emergence | 世界成为独立创作实体 | 独立创作价值 |

**关键区分**：成熟度参照系 = **来源本身**，不是种子。

---

## 三大驱动引擎

### 1. 张力演化引擎 (Tension Engine)

**原理**：世界种子的 10 个维度之间存在内在矛盾。矛盾积累到阈值 → 触发事件 → 产生 delta_seed。

**9 个内置张力模板**：

| 维度对 | 探针问题 | 基础压力 |
|--------|----------|----------|
| fate × divine_human | 命运固定时，神不干预谁来执行？ | 0.60 |
| time × death | 时间循环中，死亡对个体身份意味什么？ | 0.55 |
| cosmogony × tension | 创世代价是否决定永恒冲突的性质？ | 0.50 |
| ontology × divine_human | 存在层级分明时，人能否真正成神？ | 0.50 |
| fate × tension | 核心张力本身是命定的还是可解决的？ | 0.60 |
| death × ontology | 死后存在结构是否保留？ | 0.50 |
| time × cosmogony | 时间先于创世还是创世先于时间？ | 0.40 |
| aesthetic × tension | 审美形式反映还是遮蔽核心矛盾？ | 0.45 |
| seed_essence × tension | 世界本质表达还是压抑核心冲突？ | 0.55 |

**压力积累**：每次脉冲未触发的张力 +0.01×分钟数（上限 +0.2）

**阈值**：默认 0.7，超过即触发事件生成

**LLM 补充**：除模板外，每次脉冲还用 LLM 发现 2-3 个世界特有的张力点

### 2. 自研究引擎 (Self-Research Engine)

**原理**：检测知识空洞 → 生成搜索词 → 网络查询 → 过滤相关性 → 整合进知识库

**空洞检测**：知识库中某维度的字符数 < 种子该维度字符数 × 3 → 标记为空洞

**搜索词模板**（按传统分类）：
- **神话类**（greek/norse/vedic...）：`{tradition} {dimension} scholarly analysis`
- **虚构类**（starwars/dune/lotr...）：`"{title}" {dimension} analysis`
- **中文类**（fengshen/xiyouji...）：`{title} {dimension} 学术研究`

**知识库**：直接锚定来源，与种子分离存储。每条 entry 包含：
- dimension（归属维度）
- content（综合内容，100-300 字）
- source_url
- relevance_score（0.0-1.0）

### 3. 成熟度评分器 (Maturity Scorer)

**四级测试（顺序执行，前一级不过则跳过后续）**：

| 测试 | 阶段转换 | 方法 | 通过分 |
|------|----------|------|--------|
| 来源覆盖测试 | 0→1 | LLM 评估知识库对来源的覆盖度 | >0.6 |
| 推导测试 | 1→2 | 生成来源未直接回答的问题，测世界能否自洽推导 | >0.6 |
| 原作者认可测试 | 2→3 | 评估超越事件：兼容性×新颖性×认可度 | >0.7 |
| 涌现测试 | 3→4 | 评估近期事件：自主性×连贯性×独创性×创作价值 | >0.7 |

**建议映射**：
- 阶段 0 / 覆盖 <0.4 → research（优先研究）
- 阶段 1 / 空洞 >2 → research；否则 → evolve
- 阶段 2 → test（测试推导）
- 阶段 3 → transcend（触发超越生成）
- 阶段 4 → expand（扩展/分支）

---

## 脉冲调度 (Pulse Scheduler)

每次脉冲执行流程：

```
1. 并行评估
   ├── 张力分析 → 所有张力点 + 压力值
   ├── 空洞检测 → 研究空缺列表
   └── 成熟度评分 → 当前阶段 + 分数

2. 任务规划（按阶段加权）
   阶段 0: research=0.9  evolve=0.2  transcend=0    emerge=0
   阶段 1: research=0.5  evolve=0.6  transcend=0.1  emerge=0
   阶段 2: research=0.3  evolve=0.5  transcend=0.5  emerge=0.1
   阶段 3: research=0.2  evolve=0.3  transcend=0.4  emerge=0.5
   阶段 4: research=0.1  evolve=0.2  transcend=0.3  emerge=0.7

3. 串行执行（每次最多 3 个任务，避免 delta_seed 覆写）
   每个任务完成后立即：
   - 记录事件
   - 应用 delta_seed
   - 更新世界版本号

4. 更新脉冲元数据

5. 检查分叉条件
```

---

## 世界事件 (WorldEvent)

每次演化产生的事件包含：

| 字段 | 内容 |
|------|------|
| event_type | tension_resolution / knowledge_enrichment / character_action / maturity_leap / bifurcation / transcendence / emergence |
| actor_type | system / character / research / human |
| intent | 为什么发生（1-2 句） |
| narrative | 叙事描述（200-600 字，用世界语言风格） |
| delta_seed | 对种子维度的修改（最多 2 个维度） |
| delta_knowledge | 新增知识 entry IDs |
| maturity_before/after | 事件前后的成熟阶段 |

---

## 分叉检测 (Bifurcation)

**触发条件**（满足任一）：
1. **张力过载**：≥2 个张力点压力 ≥0.95
2. **维度不稳定**：近 5 个事件中，同一维度被修改 ≥2 次（来回摆动）

**分叉结果**：创建平行分支世界，继承父世界全部状态，从此独立演化。

---

## Claude 直接演化协议

在 Claude Code 中执行演化时，**我就是 LLM 引擎**，按以下步骤操作：

### 单次脉冲

1. 读取世界种子 JSON（从 `packages/studio/public/seeds/{world}.json`）
2. 分析当前张力（用内置 9 模板 + 自行发现 2-3 个世界特有张力）
3. 识别最高压力张力点
4. 生成事件：narrative + intent + delta_seed
5. 应用 delta_seed 到种子
6. 写回更新后的种子

### 研究脉冲

1. 检测知识空洞（对比种子内容长度）
2. 用 WebSearch 搜索来源知识
3. 综合搜索结果为知识 entry
4. 记录到 `characters/{world}/knowledge/` 目录

### 成熟度评估

1. 收集世界当前知识库
2. 执行四级测试
3. 输出成熟度报告

---

## 角色参与演化

角色可以通过行动改变世界状态：

```
输入：角色名 + 行动 + 背景
处理：评估行动对世界的影响 → 生成 narrative + delta_seed
输出：character_action 类型事件
```

角色行动最多修改 1-2 个种子维度。

---

## 数据存储

### CLI/API 模式
- SQLite 数据库：`~/.nutshell/evolution.db`
- 表：worlds / events / tensions / knowledge / maturity_reports

### Claude 直接模式
- 世界种子：`packages/studio/public/seeds/{world}.json`
- 知识库：`characters/{world}/knowledge/*.md`
- 事件历史：`characters/{world}/evolution-log.md`
- 成熟度报告：`characters/{world}/maturity-report.md`

---

## 40 个可用世界

### 神话传统（12 个）
| key | 传统 | 界的深层特征 |
|-----|------|------------|
| greek | 古希腊 | 命运不可逃，卓越即逾越 |
| norse | 北欧 | 诸神也会死，英雄死得其所 |
| zoroastrian | 琐罗亚斯德 | 光暗二元，善终将胜 |
| vedic | 吠陀印度 | 业力编织所有层级 |
| egyptian | 古埃及 | 死亡是宇宙秩序的一部分 |
| mesopotamian | 美索不达米亚 | 神造人为了让人劳作 |
| celtic | 凯尔特 | 此界与异界随时互穿 |
| shinto | 神道 | 万物皆有神，界无处不在 |
| taoist | 道教 | 无为是最高级别的行动 |
| mayan | 玛雅 | 时间是循环的神圣计算 |
| tibetan | 金刚乘 | 中阴是意识穿越的界 |
| aztec | 阿兹特克 | 第���太阳靠献祭维持 |

### 虚构世界（28 个）
| key | 世界 | 来源 |
|-----|------|------|
| fengshen | 封神演义 | 许仲琳 |
| xiyouji | 西游记 | 吴承恩 |
| hongloumeng | 红楼梦 | 曹雪芹 |
| wuxia | 武侠 | 金庸等 |
| threebody | 三体 | 刘慈欣 |
| lotr | 中土世界 | Tolkien |
| hp | 哈利波特 | J.K. Rowling |
| starwars | 星球大战 | George Lucas |
| dune | 沙丘 | Frank Herbert |
| foundation | 基地 | Isaac Asimov |
| matrix | 黑客帝国 | Wachowskis |
| got | 冰与火 | G.R.R. Martin |
| witcher | 猎魔人 | Sapkowski |
| marvel | 漫威宇宙 | Marvel Comics |
| dc | DC 宇宙 | DC Comics |
| naruto | 火影忍者 | 岸本�的文 |
| onepiece | 海贼王 | 尾田荣一郎 |
| bleach | 死神 | 久保带人 |
| dragonball | 龙珠 | 鸟山明 |
| fma | 钢之炼金术师 | 荒川弘 |
| eva | 新世纪福音战士 | 庵野秀明 |
| aot | 进击的巨人 | �的山创 |
| akira | 阿基拉 | 大友克洋 |
| genshin | 原神 | miHoYo |
| elden | 艾尔登法环 | FromSoftware |
| darksouls | 黑暗之魂 | FromSoftware |
| zelda | 塞尔达传说 | Nintendo |
| rickmorty | 瑞克和莫蒂 | Roiland/Harmon |
