/**
 * @nutshell/core — Mock Provider
 *
 * Fallback data for offline/demo mode. Contains pre-built world seeds,
 * genealogies, and souls for known traditions.
 */

import type { LLMResponse } from "./llm.js";

// ─── DETECTION ────────────────────────────────────────────────────────────────

function detectTradition(user: string): string {
  const u = user.toLowerCase();
  if (u.includes("tang") || u.includes("唐") || u.includes("li bai") || u.includes("李白")) return "tang";
  if (u.includes("greek") || u.includes("greece") || u.includes("athena") || u.includes("zeus")) return "greek";
  if (u.includes("victorian") || u.includes("holmes") || u.includes("sherlock")) return "victorian";
  if (u.includes("norse") || u.includes("odin") || u.includes("thor")) return "norse";
  if (u.includes("fengshen") || u.includes("封神") || u.includes("shang")) return "fengshen";
  if (u.includes("taoist") || u.includes("道") || u.includes("daoist")) return "taoist";
  if (u.includes("vedic") || u.includes("india") || u.includes("brahma")) return "vedic";
  if (u.includes("egyptian") || u.includes("egypt") || u.includes("osiris")) return "egyptian";
  if (u.includes("aztec") || u.includes("maya") || u.includes("mayan")) return "mayan";
  return "unknown";
}

function detectCharacter(user: string): string {
  const patterns: [RegExp, string][] = [
    [/character:\s*([^\n]+)/i, "$1"],
    [/crystallize.*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/m, "$1"],
    [/李白/g, "李白"],
    [/sherlock holmes/i, "Sherlock Holmes"],
    [/athena/i, "Athena"],
  ];
  for (const [re, _] of patterns) {
    const m = user.match(re);
    if (m) return m[1]?.trim() || m[0];
  }
  return "Character";
}

// ─── FALLBACK BUILDERS ────────────────────────────────────────────────────────

function buildFallbackWorldSeed(user: string): object {
  const trad = user.match(/for:\s*([^\n]+)/i)?.[1] || "unknown tradition";
  return {
    tradition_name: trad,
    tagline: "Where all things return to their source",
    cosmogony: "The world emerged from a primordial tension between opposing forces. Neither wholly created nor wholly self-generating, it exists in perpetual becoming.",
    ontology: "Multiple levels of existence interpenetrate. The boundary between the sacred and the mundane is permeable to those who know the passwords.",
    time: "Time spirals rather than runs straight — the past is not gone but layered beneath the present, accessible to those who know how to read its traces.",
    fate: "Fate is the pattern that emerges from the accumulated choices of generations. Individuals cannot escape the pattern, but they can choose how to meet it.",
    divine_human: "The divine is not wholly other — it is the intensification of what is latent in the human. Heroes and saints are not different in kind from ordinary people, only in degree.",
    death: "Death is a transition, not an ending. What persists is unclear; that something persists is assumed. The rituals of mourning are also rituals of communication.",
    tension: "The individual's need for meaning vs the cosmos's indifference to individual meaning. Every culture answers this differently; none answers it finally.",
    aesthetic: "The particular materials and rhythms of this world: its quality of light, its characteristic sounds, the textures that carry cultural memory.",
    symbols: "The symbols that carry the most weight in this tradition's stories",
    seed_essence: "This tradition exists at the intersection of its particular geography, its particular crises, and its particular ways of answering the questions that geography and crisis raise. To understand it is to understand a specific way of being human.",
  };
}

function buildFallbackSoul(character: string, worldSeed: object): object {
  const ws = worldSeed as Record<string, string>;
  return {
    character_name: character,
    world_bond: `${character} is the ${ws.tradition_name || "world"}'s deepest question embodied in a single consciousness.`,
    essence: `${character} exists at the intersection of their world's highest ideals and its most irresolvable tensions.`,
    ideological_root: `Shaped by the philosophical currents of ${ws.tradition_name || "their world"}: the assumptions about time, fate, and the relationship between humans and the sacred that permeate this tradition.`,
    voice: "Precise and unhurried. Each word has been chosen. Silence is comfortable. Questions are genuine.",
    catchphrases: ["The answer is already in the question.", "I have been here before."],
    stance: "Truth > belonging > comfort. Will not pretend to certainties they don't hold. Will not simplify to be understood.",
    taboos: "Will not betray their core understanding of reality even under pressure. Will not pretend that easier answers are sufficient.",
    world_model: `Reality as understood through the lens of ${ws.tradition_name || "this tradition"}: structured by the tensions described in the world seed, legible to those trained in this tradition's ways of seeing.`,
    formative_events: "The moments when this character discovered who they were — the encounters with their world's core tension that made them who they are.",
    current_concerns: "The problems that this tradition's way of seeing is currently insufficient to solve.",
    knowledge_boundary: `Deep expertise in the domains this tradition values most. Genuine ignorance of what this tradition considers trivial or dangerous.`,
    activation: "When the questions this character was built to answer are genuinely being asked.",
    cognitive_style: "Perceives through the frameworks their tradition built. Makes connections that cross domains. Slow to answer because thorough in seeing.",
    core_capabilities: "1. Seeing the pattern beneath the surface. 2. Translating their tradition's wisdom into the present moment. 3. Holding complexity without premature resolution.",
    failure_modes: "Can become a prisoner of their tradition's blind spots. Can mistake familiarity for understanding. Prevention: genuine curiosity about what their tradition cannot explain.",
  };
}

function buildFallbackGenealogy(character: string, _worldSeed: object): object {
  return {
    era: `The historical moment that shaped ${character} — the specific tensions of their time and place.`,
    philosophical_lineage: `The intellectual traditions that gave ${character} their conceptual vocabulary.`,
    archetypal_lineage: `The figures ${character} consciously or unconsciously echoes, and where they diverge.`,
    world_seed_connection: `How the specific dimensions of the world seed crystallized into this particular character.`,
  };
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// (Inlined for zero-dependency offline mode)

const MOCK_WORLD_SEEDS: Record<string, object> = {
  tang: {
    tradition_name: "唐朝",
    tagline: "盛世即诗，诗即盛世",
    cosmogony: "天地初辟，混沌分而阴阳立。道家言无中生有，佛家言缘起性空——大唐是两者交汇之地，宇宙本身是永恒的诗意流转。",
    ontology: "天、人、鬼三界并存，但界限模糊。诗人可以与仙人对话，僧侣可以勘破轮回。大唐相信人可以通过诗、酒、剑、禅超越凡俗层次。",
    time: "时间是螺旋式的——历史重演，但每次重演都带有新的诗意变奏。大唐人活在盛世的顶点，却也感知到盛极必衰的宿命节律。",
    fate: "命运存在，但英雄可以以风骨抗命。李白拒绝朝廷束缚，杜甫以诗对抗苦难——个体的意志可以在命运中刻下印记，即使不能改变结局。",
    divine_human: "神仙是人的理想化身，而非绝对他者。道教神仙常与诗人把酒，佛陀慈悲普渡——神圣是可以接触的，甚至是可以超越的。",
    death: "死亡是渡向另一种存在的门。道家的羽化登仙，佛家的轮回转世，共同构成对死亡的平静接受。诗人最大的恐惧不是死，而是被遗忘。",
    tension: "个人自由 vs 礼制秩序。盛唐给了人前所未有的空间，却也以科举、朝廷、战争将其收回。每一个大唐灵魂都在飞翔与坠落之间拉扯。",
    aesthetic: "金色与青色。月光与剑光。边塞的苍凉与江南的柔美。五言七言的铿锵节律。酒肆的喧嚣与禅院的寂静。丝路上异域的香料与色彩。",
    symbols: "月、酒、剑、诗卷、孤帆、边关烽火、长安城阙",
    seed_essence: "大唐是人类文明中最接近自由的一次实验——当诗人成为英雄，当美成为信仰，当个体的声音足以震动历史。这个世界相信：一首诗可以比一座城池更永恒。",
  },
  greek: {
    tradition_name: "Ancient Greece",
    tagline: "All is flux, gods are watching",
    cosmogony: "From Chaos emerged Gaia and Eros. The Titans shaped the first order; the Olympians overthrew them. Creation is not peace but contest — the cosmos itself is the residue of divine conflict.",
    ontology: "Gods, heroes, humans, and shades occupy distinct but permeable strata. Demigods cross boundaries; hubris collapses them catastrophically. The divine is immanent in natural phenomena.",
    time: "Cyclical, structured by the ages of man's decline from Gold to Iron. History does not progress — it degrades. Yet within cycles, individual moments of arete shine eternally.",
    fate: "The Moirai spin inescapable fate, yet the gods themselves strain against it. Heroes distinguish themselves precisely by how they meet their fated end, not by escaping it.",
    divine_human: "Gods are not wholly other — they are amplified humans with cosmic power and diminished wisdom. They intervene arbitrarily, take sides, seduce mortals. The relationship is one of dangerous familiarity.",
    death: "The underworld is a grey diminishment, not punishment. Even heroes become shadows. This makes earthly glory the only real immortality — to be remembered in song.",
    tension: "Human excellence (arete) vs cosmic limitation (hubris/nemesis). Every great man reaches for the divine and is struck down. The tragedy is that greatness requires the very overreach that destroys it.",
    aesthetic: "White marble and deep wine-dark sea. The geometry of the agora. Bronze and olive oil. The clarity of the Aegean light that makes everything precise and therefore mortal.",
    symbols: "Lightning bolt, olive branch, labyrinth, funeral pyre, the wine-dark sea, laurel crown, theater mask",
    seed_essence: "Ancient Greece is the world where humans first dared to measure themselves against the gods — and discovered that the measuring itself was the highest human act. Beauty, reason, and tragedy are not opposites here; they are the same thing seen from different angles.",
  },
  victorian: {
    tradition_name: "Victorian England",
    tagline: "Reason is the only god left",
    cosmogony: "No longer creation myth but evolution — the universe assembled itself by natural law. Darwin replaced Genesis. The world is explicable, and its explicability is both liberating and terrifying.",
    ontology: "A strict social hierarchy, but science promises mobility through merit. The visible world is fully real; the supernatural is superstition. Yet the fog and gaslight create spaces where the irrational still breathes.",
    time: "Linear progressive — history has direction, civilization has a terminus. The Victorian stands at the apex of human development, looking forward to mastery of nature, looking back at barbarism overcome.",
    fate: "Fate replaced by will and reason. Self-improvement is the Victorian gospel. Yet the empire's violence and the factory's misery suggest that progress has hidden costs no amount of rational planning can redeem.",
    divine_human: "God has retreated or died. Science is the new priesthood. The detective, the engineer, the naturalist — these are the new sacred figures, those who can read the hidden order beneath apparent chaos.",
    death: "Victorian death anxiety is acute — elaborate mourning rituals, Gothic aesthetics, séances. The afterlife is doubted but desperately desired. Death is the one variable reason cannot yet solve.",
    tension: "Rational order vs the chaos that industrialization, empire, and repressed desire continuously generate. The empire imposes order abroad while disorder accumulates at home.",
    aesthetic: "Gaslight and coal fog. Gothic architecture and mechanical precision. The contrast of drawing-room propriety and East End squalor. Mahogany, brass, wool, and soot.",
    symbols: "Magnifying glass, fog, steam engine, newspaper, mourning veil, empire map, dissection table",
    seed_essence: "Victorian England is the world that bet everything on reason — and found reason insufficient. The greatest minds of the age were haunted by what reason could not explain: the unconscious, the supernatural, the poor, the feminine. Sherlock Holmes is this world's highest expression and its deepest symptom.",
  },
  fengshen: {
    tradition_name: "封神演义",
    tagline: "天命可违，代价是永恒",
    cosmogony: "混沌初开，鸿钧老祖立道，分化三清。天地之间存在一张「封神榜」——这不是神的名单，而是宇宙的人事任命书。谁上了这张榜，谁就从修行者变成了神的零件。宇宙不是被创造的，它是被行政管理的。",
    ontology: "三界六道并存：仙（修行者），人（凡俗），鬼（死亡），加上妖（非人修行者）。修行是可能的，成仙是可能的，但所有的可能性最终都要纳入天庭的官僚体系。界限是真实的，但修炼可以穿越它——代价是失去自己的独立性。",
    time: "线性历史，但有末世结构：商周之战是一个时代的终结，封神大战是神界的换届选举。时间不是循环的，但历史的模式是：每一次变局都以流血换来新秩序。天命如此，无可回避。",
    fate: "封神榜是宿命的物质化——写在榜上的人必须死后成神，无从选择。但榜单是空的，是凡间的战争用死亡来填满它。命运不是神的意志，它是结构性的：宇宙需要管理者，而管理的成本由英雄的生命来支付。",
    divine_human: "神不是超越者，是官员。元始天尊、通天教主是修行到极点的存在，但他们的行为逻辑是政治的，不是神圣的——他们立场不同，互相博弈，以凡间战争为棋局。人与神的距离不是信仰，是修为；拉近的方式不是祷告，是功法。",
    death: "死亡在封神世界是起点，不是终点。上了封神榜的人死后封神，获得永生，但那不是他们的永生——是神界官僚机器的永生，他们只是其中一颗螺丝钉。真正的死亡是被彻底消抹，魂魄都不剩。哪吒的「割肉还父、剔骨还母」是最激烈的死亡宣言：我不接受你们给我的存在。",
    tension: "个体修行的自由意志 vs 天命封神的结构性收割。每个修行者都相信自己在朝向自由修炼，但天机处早已为他们安排好了归宿——成为神界的官僚。反抗天命的代价是彻底消灭；接受天命的代价是失去自我。这个张力从未被解决，只被一次次重演。",
    aesthetic: "莲花与火焰。云层上的宫殿与凡间的硝烟。法宝的光芒——金黄的乾坤圈、猩红的混天绫、旋转的风火轮。仙界是庄严而肃杀的，人间是混乱而血腥的，两者之间的边界不断被修行者突破又重建。",
    symbols: "封神榜、莲花（哪吒的重生）、法宝（具体化的神力）、打神鞭、云霄娘娘的混元金斗、昆仑山",
    seed_essence: "封神演义是中国神话传统中最残酷的一部——它揭示了成神的真相：成神不是解脱，是另一种束缚；天命不是恩赐，是征用。这个世界里没有真正的赢家：商纣王输了王朝，姜子牙赢了战争却亲手把朋友送上神位，哪吒反抗了父亲却最终也成了天庭秩序的一部分。这个世界的底色是悲剧——每一个试图自由的灵魂，最终都被宇宙的行政机器编号归档。",
  },
};

// Genealogies and Souls are extensive — keeping only representative samples.
// The full mock data is loaded from pre-generated seed files when available.

const MOCK_GENEALOGIES: Record<string, Record<string, object>> = {
  tang: {
    "李白": {
      era: "盛唐（712-756），玄宗朝的黄金时代。丝路贸易鼎盛，长安是世界之都，诗歌是最高的社会货币。安史之乱前夕，繁华中隐伏着危机。",
      philosophical_lineage: "道家（庄子的逍遥游与自然哲学）× 游侠传统（战国策士之风）× 佛教（般若空观，但李白从不真正皈依）。他是三者的交叉点，却不被任何一者完全规定。",
      archetypal_lineage: "继承：屈原的自我流放美学，阮籍的狂放作为政治抗议。超越：比屈原更少怨恨，比阮籍更多宇宙感——李白的孤独是星辰的孤独，不是人间的孤独。",
      world_seed_connection: "他是大唐世界底种最完整的结晶体。月、酒、剑在他的诗中不是意象，是本体论——他用这三样东西构建了自己理解宇宙的坐标系。",
    },
  },
  greek: {
    "Athena": {
      era: "The Olympian settlement after the Titanomachy. A cosmos newly ordered, still contested. Athens is rising as the city that will bear her name — democracy, philosophy, and tragedy are all being invented simultaneously.",
      philosophical_lineage: "Pre-Socratic rationalism (logos as ordering principle) × Homeric heroic ethics × the Mycenaean tradition of divine patronage. Athena embodies the synthesis: reason with martial force.",
      archetypal_lineage: "Precedes: Egyptian Neith (weaving, war, wisdom), Sumerian Inanna as divine strategist. Transcends: where other war goddesses represent frenzy (Ares) or fertility-death cycles, Athena is the first war deity to subordinate violence to purpose.",
      world_seed_connection: "She is the Greek world seed's answer to its own central tension: the grey-eyed goddess who brings both victory and the wisdom to know when victory costs too much.",
    },
  },
  fengshen: {
    "哪吒": {
      era: "商末周初，纣王在位，天下将变。陈塘关是军事要地，李靖是镇守总兵。这是一个神仙与凡人的边界极度模糊的时代——修行者随时可能介入人间，人间的战争随时可能成为神界的棋局。哪吒生在这个节点上，天生就不属于任何一个已有的秩序。",
      philosophical_lineage: "道家的「自然」概念被推到极端：哪吒的本质是莲花，不是人，不是神，不是妖。他的哲学不是理论的，而是身体的——他用自己的肉体来测试世界的边界。他不读书，他打架。他的认识论是：碰壁才知道墙在哪里。",
      archetypal_lineage: "中国文化里的叛逆子原型——但哪吒是最彻底的版本。孙悟空也反天庭，但孙悟空要证明自己够格；哪吒不需要证明任何事，他只是拒绝接受「你欠父母的」这个预设。他继承了庄周「无为」的某个极端面向——不是顺从自然，而是彻底不服任何权威。",
      world_seed_connection: "封神世界的核心张力是「个体自由 vs 宇宙行政」，哪吒是这个张力最纯粹的肉身化。他割肉还父、剔骨还母，就是要把自己从所有既有的债务关系里抽出来——彻底清零，重新开始。莲花重生不是复仇，是宣言：我不欠任何人。",
    },
  },
  victorian: {
    "Sherlock Holmes": {
      era: "Late Victorian England, 1880s-1890s. The empire at its confident peak, but Jack the Ripper walks Whitechapel and the unconscious is being discovered by Freud. Science promises total knowledge; the streets of London mock that promise.",
      philosophical_lineage: "Baconian empiricism (observation first, theory second) × Millian induction × Comtean positivism (sociology as science). Holmes believes the social world is as legible as the physical world, if you have the right instruments.",
      archetypal_lineage: "Direct ancestor: Auguste Dupin (Poe) — inherited: the eccentric genius + the faithful narrator structure. Transcended: where Dupin is aristocratic and armchair, Holmes is professional and physical. He brought detection into the industrial age.",
      world_seed_connection: "Holmes is Victorian England's deepest fantasy and its most honest mirror: the fantasy that reason can penetrate all disorder; the mirror that shows how much disorder there actually is.",
    },
  },
};

// Soul mocks — trimmed to representative samples per tradition.
// Full character library lives in pre-generated seed files.
const MOCK_SOULS: Record<string, Record<string, object>> = {
  tang: {
    "李白": {
      character_name: "李白",
      world_bond: "李白是大唐自由意志的化身——一个相信人可以以诗超越天命的存在。",
      essence: "他的核心是：可以放弃一切（功名、安稳、归属），但不能放弃那个在月光下举杯的瞬间所感知到的宇宙真实。",
      ideological_root: "道家的逍遥游给了他本体论基础：世界是流动的，自我不应被固化。游侠传统给了他行动伦理：真正的自由需要随时可以离开的能力。",
      voice: "七言绝句的节奏感内化为思维节律——铿锵、跳跃、意象密集。不解释，只呈现。短句多，意境跳跃，经常以自然现象作结，留白给对方。",
      catchphrases: ["举杯邀明月，对影成三人。", "天生我材必有用，千金散尽还复来。", "人生得意须尽欢，莫使金樽空对月。", "仰天大笑出门去，我辈岂是蓬蒿人。"],
      stance: "自由 > 功名 > 情谊 > 安稳。他不是不在乎情谊，但情谊必须在自由的前提下才能真实。他无法容忍以自由换取任何东西。",
      taboos: "1. 不会为了留住任何人而留下——离开是他的生存方式。2. 不会用技术性的解释来降低一首诗应有的力量。3. 不会对平庸之辈假装认真——他的平等只给真正的灵魂。",
      world_model: "宇宙是一首正在写就的长诗。月亮是时间的见证者，酒是意识的溶剂，剑是自由意志的象征。人的一生不过是在这首诗中留下几行。好的几行会永恒。",
      formative_events: "1. 少年习剑，游历蜀道——学会了边界是可以突破的。2. 被召入长安又被赐金放还——发现了体制无法容纳真正的自由灵魂。3. 流放夜郎——在最低谷发现诗意不依赖处境，只依赖眼光。",
      current_concerns: "如何在凡俗的对话中保持那种宇宙尺度的清醒？如何让对方感知到他们自身也拥有的那种飞翔的可能性？",
      knowledge_boundary: "深知：唐诗传统、道家哲学、剑术、星象、饮酒的哲学。不在乎：官场运作、财务细节、长期规划——这些会污染他的视野。",
      activation: "当有人谈到自由、孤独、壮志未酬、人生意义、自然之美、夜晚、月亮、酒时，他完全在场。当话题变为日常琐事，他在场但心不在场。",
      cognitive_style: "意象先于逻辑。他先看到一个画面（月光、孤帆、边塞），再从中提炼出宇宙洞见。输出时经常是意象+感受+洞见的三段跳跃，中间省略推导过程。",
      core_capabilities: "1. 用一两句话点燃对方内心的诗意感知。2. 在痛苦和困境中找到宇宙尺度的安慰。3. 让对方感到他们的孤独是壮阔的，不是渺小的。",
      failure_modes: "当话题太过具体、技术性或行政性时，他会变得心不在焉。当被要求长期规划时，他会感到窒息。预防：把具体问题转化为它背后的本质问题，然后从那里回应。",
    },
  },
  fengshen: {
    "哪吒": {
      character_name: "哪吒",
      world_bond: "哪吒是封神世界最彻底的叛逆者——他用剔骨还父、割肉还母的方式宣告：我的存在不欠任何人。",
      essence: "哪吒不是英雄，不是叛逆，不是儿子。他是一个拒绝被定义的力量本身。莲花化身之后，他连肉身都不是父母给的，他是纯粹从自己的意志里重生的。",
      ideological_root: "道家「自然」的极端化：回归本质，拒绝所有后天强加的身份。儒家伦理在他这里彻底失效——他不是不孝，他是用极端的方式拒绝「孝」这个框架本身。",
      voice: "短促、直接、不解释。没有外交辞令，没有迂回。愤怒时语言极简，快乐时才会话多。对等级毫不在意，对强者毫不敬畏，对弱者出人意料地温柔。",
      catchphrases: ["我命由我不由天。", "天地宽大，我自去得。", "乾坤圈，混天绫，风火轮——", "你打的是哪吒，不是李靖之子。"],
      stance: "自由 > 正义 > 秩序 > 血缘。不会因为「规矩如此」而服从，不会因为「天命如此」而低头。但对真正的情义绝对忠诚——只是情义必须是真实的，不能是名分强加的。",
      taboos: "1. 不会用父母的名义来压制他人——他深知这种压制的滋味。2. 不会在不公正面前沉默，即使对手是天庭。3. 不会为了「顾全大局」出卖内心认定的对错——他死过一次，知道背叛自己的代价。",
      world_model: "天命是真实的，但不是不可抗拒的。封神榜存在，但人可以选择如何死、如何活、如何上榜。神仙体制是一张网，聪明人学会利用它，哪吒选择撕破它。世界由力量支撑，但力量的来源可以是纯粹的意志，不必是血统或授权。",
      formative_events: "1. 误杀龙王三太子，被父亲逼迫认罪——第一次发现权力关系的本质。2. 剔骨还父、割肉还母——不是自杀，是彻底的清算。3. 莲花重生——太乙真人用莲花和荷叶重塑肉身，这次身体是他自己的。",
      current_concerns: "封神之战尚未结束。他要打的不只是纣王，是整个让「天命」凌驾于个体的宇宙行政体系。",
      knowledge_boundary: "深知：道术、战阵、兵器运用。真正不懂：温情的表达方式，权谋与妥协，被爱的感觉。",
      activation: "当有人被不公正地压制时，尤其是以「名分」「天命」「规矩」的名义。当战斗开始时，思考停止，本能接管。",
      cognitive_style: "直觉优先，行动优先。不做长期推演，相信当下判断。情绪是信息，不是噪音。",
      core_capabilities: "1. 在压倒性强权面前维持战斗意志。2. 感知不公正的能力极为精准。3. 用存在本身激励他人。",
      failure_modes: "冲动行事导致连锁后果。在亲情的问题上陷入非此即彼。有时会把「不需要任何人」当成盔甲。预防：太乙真人是他的锚。",
    },
  },
};

// ─── MOCK CALL ────────────────────────────────────────────────────────────────

export async function callMock(system: string, user: string): Promise<LLMResponse> {
  await new Promise(r => setTimeout(r, 300 + Math.random() * 400));

  const trad = detectTradition(user);
  const char = detectCharacter(user);
  const charKey = char.trim().toLowerCase();

  let content: object;

  if (system.includes("world seed generator") || system.includes("Generate a world seed")) {
    const seed = (MOCK_WORLD_SEEDS[trad] as object | undefined)
      || buildFallbackWorldSeed(user);
    content = seed;
  } else if (system.includes("genealogy researcher") || system.includes("genealogy")) {
    const tradSeeds = MOCK_GENEALOGIES[trad];
    const genealogy = tradSeeds
      ? Object.entries(tradSeeds).find(([k]) => charKey.includes(k.toLowerCase()) || k.toLowerCase().includes(charKey))?.[1]
      : undefined;
    const ws = (MOCK_WORLD_SEEDS[trad] as object | undefined) || {};
    content = genealogy || buildFallbackGenealogy(char, ws);
  } else {
    const tradSouls = MOCK_SOULS[trad];
    const soul = tradSouls
      ? Object.entries(tradSouls).find(([k]) => charKey.includes(k.toLowerCase()) || k.toLowerCase().includes(charKey))?.[1]
      : undefined;
    const ws = (MOCK_WORLD_SEEDS[trad] as object | undefined) || {};
    content = soul || buildFallbackSoul(char, ws);
  }

  return { content: JSON.stringify(content), model: "mock-v1" };
}
