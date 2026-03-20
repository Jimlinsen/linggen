#!/usr/bin/env node
// Pre-generate world seeds for all 12 traditions using Claude CLI
import { spawn } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public/seeds");
mkdirSync(OUT_DIR, { recursive: true });

const TRADITIONS = [
  { id: "greek",        label: "古希腊",      sub: "Olympic Pantheon" },
  { id: "norse",        label: "北欧神话",    sub: "Norse Mythology" },
  { id: "zoroastrian",  label: "琐罗亚斯德教", sub: "Zoroastrianism" },
  { id: "vedic",        label: "印度吠陀",    sub: "Vedic Tradition" },
  { id: "egyptian",     label: "埃及神话",    sub: "Kemetic" },
  { id: "mesopotamian", label: "美索不达米亚", sub: "Sumerian-Akkadian" },
  { id: "celtic",       label: "凯尔特",      sub: "Celtic Mythology" },
  { id: "shinto",       label: "日本神道",    sub: "Shinto" },
  { id: "taoist",       label: "道教神话",    sub: "Taoist Mythology" },
  { id: "mayan",        label: "玛雅宇宙",    sub: "Maya Cosmology" },
  { id: "tibetan",      label: "藏传密教",    sub: "Vajrayana" },
  { id: "aztec",        label: "阿兹特克",    sub: "Aztec Cosmology" },
  // ── 架空世界 ──────────────────────────────────────────────────────────────
  { id: "hp",         label: "哈利·波特",    sub: "Harry Potter / J.K. Rowling",           fiction: true },
  { id: "lotr",       label: "中土大陆",     sub: "The Lord of the Rings / Tolkien",        fiction: true },
  { id: "got",        label: "冰与火之歌",   sub: "Game of Thrones / George R.R. Martin",   fiction: true },
  { id: "witcher",    label: "巫师世界",     sub: "The Witcher / Andrzej Sapkowski",         fiction: true },
  { id: "marvel",     label: "漫威宇宙",     sub: "Marvel Universe / Stan Lee",             fiction: true },
  { id: "dc",         label: "DC宇宙",       sub: "DC Universe",                            fiction: true },
  { id: "akira",      label: "AKIRA",        sub: "AKIRA / Katsuhiro Otomo / Neo-Tokyo",    fiction: true },
  { id: "naruto",     label: "火影忍者",     sub: "Naruto / Masashi Kishimoto",             fiction: true },
  { id: "onepiece",   label: "海贼王",       sub: "One Piece / Eiichiro Oda",               fiction: true },
  { id: "aot",        label: "进击的巨人",   sub: "Attack on Titan / Hajime Isayama",       fiction: true },
  { id: "fma",        label: "钢之炼金术师",  sub: "Fullmetal Alchemist / Hiromu Arakawa",  fiction: true },
  { id: "eva",        label: "新世纪福音战士", sub: "Neon Genesis Evangelion / Anno Hideaki", fiction: true },
  { id: "bleach",     label: "死神",         sub: "Bleach / Tite Kubo",                     fiction: true },
  { id: "dragonball", label: "龙珠",         sub: "Dragon Ball / Akira Toriyama",           fiction: true },
  { id: "starwars",   label: "星球大战",     sub: "Star Wars / George Lucas",               fiction: true },
  { id: "dune",       label: "沙丘",         sub: "Dune / Frank Herbert",                   fiction: true },
  { id: "matrix",     label: "黑客帝国",     sub: "The Matrix / Wachowski",                 fiction: true },
  { id: "foundation", label: "基地",         sub: "Foundation / Isaac Asimov",              fiction: true },
  { id: "rickmorty",  label: "瑞克与莫蒂",   sub: "Rick and Morty / Dan Harmon & Justin Roiland", fiction: true },
  { id: "xiyouji",    label: "西游记",       sub: "Journey to the West / Wu Cheng'en",      fiction: true },
  { id: "fengshen",   label: "封神演义",     sub: "Investiture of the Gods / Xu Zhonglin",  fiction: true },
  { id: "threebody",  label: "三体",         sub: "Three-Body Problem / Liu Cixin",          fiction: true },
  { id: "wuxia",      label: "金庸武侠",     sub: "Wuxia / Jin Yong",                       fiction: true },
  { id: "hongloumeng",label: "红楼梦",       sub: "Dream of Red Chamber / Cao Xueqin",      fiction: true },
  { id: "darksouls",  label: "黑暗之魂",     sub: "Dark Souls / FromSoftware / Hidetaka Miyazaki", fiction: true },
  { id: "zelda",      label: "塞尔达传说",   sub: "The Legend of Zelda / Nintendo / Shigeru Miyamoto", fiction: true },
  { id: "elden",      label: "艾尔登法环",   sub: "Elden Ring / FromSoftware / George R.R. Martin", fiction: true },
  { id: "genshin",    label: "原神",         sub: "Genshin Impact / miHoYo / Teyvat",       fiction: true },
];

const PROMPT_PREFIX = `你是世界种子生成器，精通神话学（坎贝尔、埃利亚德）、比较宗教学（缪勒、奥托）、民俗文学（普罗普）。

"世界种子"是世界的意识形态基底——让这个世界成为它自己的规定性，不是世界设定，是感知框架。

输出严格JSON（只输出JSON，无其他内容，所有字段中文，每字段80-150字）：
{
  "tradition_name": "传统名称",
  "tagline": "一句诗意的世界精髓（15字内）",
  "cosmogony": "创世论：这个世界如何诞生？混沌/虚无/牺牲/意志？创世的根本逻辑与代价。",
  "ontology": "存在层级：神-人-物的结构，边界的渗透性，存在等级的正当性来源。",
  "time": "时间观：线性/循环/螺旋？时间有终点吗？英雄时代与衰退的关系。",
  "fate": "命运与意志：谁被命运支配，谁能反抗，反抗的代价与意义。",
  "divine_human": "人神关系：神是父母/合约方/捕食者/同类？人如何接近或成为神？",
  "death": "死亡与彼岸：死亡的本质，彼岸的形态，死与生的辩证关系。",
  "tension": "核心张力：驱动一切叙事的根本冲突，永远无法解决只能重演的那个矛盾。",
  "aesthetic": "美学DNA：这个世界的感知质地——颜色、节奏、声音、气味、材质。如果是音乐，是什么调性？",
  "symbols": "关键符号：5个核心意象，每个用一句话说明它在这个世界中承载的意义密度。",
  "seed_essence": "种子精髓（200字）：读完这段，应能感受到这个世界的呼吸方式——它的意识形态基底是什么思想力量的凝聚？"
}

生成世界种子：`;

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, CLAUDECODE: "" };
    const child = spawn("claude", ["-p", prompt], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "", err = "";
    child.stdout.on("data", d => (out += d));
    child.stderr.on("data", d => (err += d));
    child.on("close", code => {
      if (code === 0) resolve(out.trim());
      else reject(new Error(err.trim() || `exit ${code}`));
    });
  });
}

function extractJson(raw) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no JSON found");
  return JSON.parse(match[0]);
}

const FICTION_SUFFIX = `

注意：这是架空世界，不是真实神话传统。
请基于这个作品的内在逻辑和意识形态基底来生成世界种子，而非现实世界的文化。
提炼这个作品世界独有的感知框架——它的宇宙观、时间观、人物与命运的关系、核心张力。`;

async function generateOne(trad, attempt = 1) {
  const suffix = trad.fiction ? `${trad.label}（${trad.sub}）${FICTION_SUFFIX}` : `${trad.label}（${trad.sub}）`;
  const prompt = `${PROMPT_PREFIX}${suffix}`;
  if (attempt > 1) console.log(`  ↺  ${trad.label} 重试 #${attempt}...`);
  else console.log(`  ⟳  ${trad.label}...`);
  try {
    const raw = await callClaude(prompt);
    const seed = extractJson(raw);
    const outPath = join(OUT_DIR, `${trad.id}.json`);
    writeFileSync(outPath, JSON.stringify(seed, null, 2), "utf-8");
    console.log(`  ✓  ${trad.label} → ${trad.id}.json`);
    return trad.id;
  } catch (e) {
    if (attempt < 3) return generateOne(trad, attempt + 1);
    throw new Error(`${trad.label} 失败(${attempt}次): ${e.message}`);
  }
}

// Run in batches of 3 to avoid overwhelming the CLI
async function run() {
  console.log(`\n生成 ${TRADITIONS.length} 个世界种子...\n`);
  const BATCH = 3;
  for (let i = 0; i < TRADITIONS.length; i += BATCH) {
    const batch = TRADITIONS.slice(i, i + BATCH);
    await Promise.all(batch.map(generateOne));
  }
  console.log(`\n全部完成 → ${OUT_DIR}\n`);
}

run().catch(e => { console.error(e); process.exit(1); });
