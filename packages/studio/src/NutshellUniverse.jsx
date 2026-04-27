import { useState, useReducer, useEffect, useRef, useCallback, Component } from "react";

// ─── ERROR BOUNDARY ───────────────────────────────────────────────────────────

class NutshellErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[NutshellUniverse] Uncaught error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", background: "#060510", color: "#ddd0a8",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", fontFamily: "Georgia, serif", gap: 16,
        }}>
          <div style={{ fontSize: 28, color: "#7a3535" }}>✕</div>
          <div style={{ fontSize: 14, color: "#7a3535", letterSpacing: 2 }}>渲染异常</div>
          <div style={{ fontSize: 11, color: "#3a2a2a", maxWidth: 480, textAlign: "center", lineHeight: 1.8 }}>
            {this.state.error?.message || "未知错误"}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 8, background: "transparent", border: "1px solid #3a2a2a",
              color: "#5a3535", padding: "8px 24px", cursor: "pointer",
              fontFamily: "inherit", fontSize: 11, letterSpacing: 2, borderRadius: 2,
            }}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── LLM CONFIG (browser-direct, no backend needed) ──────────────────────────

const LLM_DEFAULTS = { provider: "anthropic", model: "claude-sonnet-4-6", api_key: "", base_url: "" };

function loadLLMConfig() {
  try { return { ...LLM_DEFAULTS, ...JSON.parse(localStorage.getItem("nutshell_llm") || "{}") }; }
  catch { return { ...LLM_DEFAULTS }; }
}

async function callLLM(cfg, system, userContent, maxTokens = 1200) {
  const { provider, model, api_key, base_url } = cfg;
  if (!api_key) throw new Error("请先在右上角设置 API Key");

  // 生产环境安全检查：直接浏览器调用会暴露 API Key，只允许在 localhost 使用。
  // 生产部署请配置后端代理，并通过 base_url 指向代理端点。
  const host = window.location.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error(
      "直接 API 调用仅限本地开发环境。生产部署请配置后端代理，并在设置中填写 Base URL。"
    );
  }

  if (provider === "anthropic") {
    const endpoint = base_url
      ? `${base_url.replace(/\/$/, "")}/v1/messages`
      : "https://api.anthropic.com/v1/messages";
    // 注意：anthropic-dangerous-direct-browser-access 只能用于本地直接请求官方 API。
    // 一旦配置 base_url，就视为走代理路径，不再发送该 header。
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": api_key,
      "anthropic-version": "2023-06-01",
      ...(base_url ? {} : { "anthropic-dangerous-direct-browser-access": "true" }),
    };
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: userContent }] }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Anthropic ${res.status}`); }
    return (await res.json()).content?.[0]?.text || "";
  } else {
    // OpenAI-compatible (openai / deepseek / qwen / local / custom)
    const endpoint = base_url
      ? `${base_url.replace(/\/$/, "")}/v1/chat/completions`
      : "https://api.openai.com/v1/chat/completions";
    const messages = system
      ? [{ role: "system", content: system }, { role: "user", content: userContent }]
      : [{ role: "user", content: userContent }];
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${api_key}` },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `API ${res.status}`); }
    return (await res.json()).choices?.[0]?.message?.content || "";
  }
}

async function callLLMStream(cfg, system, userContent, maxTokens = 1200, onChunk) {
  // onChunk(partialText) — 每收到一块文本就回调

  const { provider, model, api_key, base_url } = cfg;
  if (!api_key) throw new Error("请先在右上角设置 API Key");

  // 生产环境安全检查（复用 callLLM 中的 localhost 限制）
  const host = window.location.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error(
      "直接 API 调用仅限本地开发环境。生产部署请配置后端代理，并在设置中填写 Base URL。"
    );
  }

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model, max_tokens: maxTokens, stream: true,
        system, messages: [{ role: "user", content: userContent }],
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            full += parsed.delta.text;
            onChunk?.(full);
          }
        } catch {}
      }
    }
    return full;
  }

  // 非 Anthropic provider 降级为普通调用
  const result = await callLLM(cfg, system, userContent, maxTokens);
  onChunk?.(result);
  return result;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TRADITIONS = [
  { id: "greek",        label: "古希腊",      glyph: "☽",  color: "#7eb8d4", sub: "Olympic Pantheon",    category: "myth" },
  { id: "norse",        label: "北欧神话",    glyph: "ᚱ",  color: "#9b8ecf", sub: "Norse Mythology",      category: "myth" },
  { id: "zoroastrian",  label: "琐罗亚斯德",  glyph: "🔥", color: "#d4976a", sub: "Zoroastrianism",       category: "myth" },
  { id: "vedic",        label: "印度吠陀",    glyph: "ॐ",  color: "#d4b96a", sub: "Vedic Tradition",      category: "myth" },
  { id: "egyptian",     label: "埃及神话",    glyph: "𓂀", color: "#c9a84c", sub: "Kemetic",              category: "myth" },
  { id: "mesopotamian", label: "美索不达米亚", glyph: "𒀭", color: "#b07a5a", sub: "Sumerian-Akkadian",    category: "myth" },
  { id: "celtic",       label: "凯尔特",      glyph: "᛫",  color: "#7dba8a", sub: "Celtic Mythology",     category: "myth" },
  { id: "shinto",       label: "日本神道",    glyph: "⛩", color: "#e8a0a0", sub: "Shinto",               category: "myth" },
  { id: "taoist",       label: "道教神话",    glyph: "⊙",  color: "#a8c5d4", sub: "Taoist Mythology",     category: "myth" },
  { id: "mayan",        label: "玛雅宇宙",    glyph: "❋",  color: "#8ecf9b", sub: "Maya Cosmology",       category: "myth" },
  { id: "tibetan",      label: "藏传密教",    glyph: "ༀ",  color: "#cf9b8e", sub: "Vajrayana",            category: "myth" },
  { id: "aztec",        label: "阿兹特克",    glyph: "✦",  color: "#d4c06a", sub: "Aztec Cosmology",      category: "myth" },
  // ── 西方奇幻 ──────────────────────────────────────────────────────────────
  { id: "hp",           label: "哈利·波特",   glyph: "⚡",  color: "#7b5ea7", sub: "Harry Potter",         category: "fiction", subcategory: "western-fantasy" },
  { id: "lotr",         label: "中土大陆",    glyph: "◉",  color: "#8b7355", sub: "Middle-earth",          category: "fiction", subcategory: "western-fantasy" },
  { id: "got",          label: "冰与火之歌",  glyph: "❄",  color: "#4a6680", sub: "Game of Thrones",       category: "fiction", subcategory: "western-fantasy" },
  { id: "witcher",      label: "巫师世界",    glyph: "⊕",  color: "#2d4a2d", sub: "The Witcher",           category: "fiction", subcategory: "western-fantasy" },
  // ── 超级英雄 ──────────────────────────────────────────────────────────────
  { id: "marvel",       label: "漫威宇宙",    glyph: "⭐",  color: "#c41e3a", sub: "Marvel Universe",      category: "fiction", subcategory: "superhero" },
  { id: "dc",           label: "DC宇宙",      glyph: "◈",  color: "#1a56c4", sub: "DC Universe",           category: "fiction", subcategory: "superhero" },
  { id: "akira",        label: "AKIRA",       glyph: "◎",  color: "#cc1100", sub: "AKIRA / Neo-Tokyo",     category: "fiction", subcategory: "superhero" },
  // ── 日本动漫 ──────────────────────────────────────────────────────────────
  { id: "naruto",       label: "火影忍者",    glyph: "✦",  color: "#e8855a", sub: "Naruto",                category: "fiction", subcategory: "anime" },
  { id: "onepiece",     label: "海贼王",      glyph: "⚓",  color: "#3399cc", sub: "One Piece",             category: "fiction", subcategory: "anime" },
  { id: "aot",          label: "进击的巨人",  glyph: "⟁",  color: "#7a5c3a", sub: "Attack on Titan",       category: "fiction", subcategory: "anime" },
  { id: "fma",          label: "钢之炼金术师", glyph: "⊗",  color: "#cc8833", sub: "Fullmetal Alchemist",  category: "fiction", subcategory: "anime" },
  { id: "eva",          label: "新世纪福音战士", glyph: "◇", color: "#6633aa", sub: "Neon Genesis Evangelion", category: "fiction", subcategory: "anime" },
  { id: "bleach",       label: "死神",        glyph: "☽",  color: "#1a1a2e", sub: "Bleach",                category: "fiction", subcategory: "anime" },
  { id: "dragonball",   label: "龙珠",        glyph: "★",  color: "#f7941d", sub: "Dragon Ball",           category: "fiction", subcategory: "anime" },
  // ── 科幻 ──────────────────────────────────────────────────────────────────
  { id: "starwars",     label: "星球大战",    glyph: "✦",  color: "#4a4a7a", sub: "Star Wars",             category: "fiction", subcategory: "scifi" },
  { id: "dune",         label: "沙丘",        glyph: "◉",  color: "#c8a84b", sub: "Dune",                  category: "fiction", subcategory: "scifi" },
  { id: "matrix",       label: "黑客帝国",    glyph: "◈",  color: "#003300", sub: "The Matrix",            category: "fiction", subcategory: "scifi" },
  { id: "foundation",   label: "基地",        glyph: "⊙",  color: "#2a4a6a", sub: "Foundation",            category: "fiction", subcategory: "scifi" },
  { id: "rickmorty",    label: "瑞克与莫蒂",  glyph: "◎",  color: "#97ce4c", sub: "Rick and Morty",        category: "fiction", subcategory: "scifi" },
  // ── 中文世界 ──────────────────────────────────────────────────────────────
  { id: "xiyouji",      label: "西游记",      glyph: "☁",  color: "#c87941", sub: "Journey to the West",   category: "fiction", subcategory: "chinese" },
  { id: "fengshen",     label: "封神演义",    glyph: "⊕",  color: "#8b3a3a", sub: "Investiture of Gods",   category: "fiction", subcategory: "chinese" },
  { id: "threebody",    label: "三体",        glyph: "◎",  color: "#1a2a4a", sub: "Three-Body Problem",    category: "fiction", subcategory: "chinese" },
  { id: "wuxia",        label: "金庸武侠",    glyph: "⋈",  color: "#2a5a2a", sub: "Wuxia / Jin Yong",      category: "fiction", subcategory: "chinese" },
  { id: "hongloumeng",  label: "红楼梦",      glyph: "◇",  color: "#c87ba0", sub: "Dream of Red Chamber",  category: "fiction", subcategory: "chinese" },
  // ── 游戏 ──────────────────────────────────────────────────────────────────
  { id: "darksouls",    label: "黑暗之魂",    glyph: "◉",  color: "#3a2a1a", sub: "Dark Souls",            category: "fiction", subcategory: "games" },
  { id: "zelda",        label: "塞尔达传说",  glyph: "◈",  color: "#c8a000", sub: "The Legend of Zelda",   category: "fiction", subcategory: "games" },
  { id: "elden",        label: "艾尔登法环",  glyph: "⊗",  color: "#4a3a1a", sub: "Elden Ring",            category: "fiction", subcategory: "games" },
  { id: "genshin",      label: "原神",        glyph: "✦",  color: "#4a9ab4", sub: "Genshin Impact",        category: "fiction", subcategory: "games" },
  { id: "fate",         label: "Fate/stay night", glyph: "⚔", color: "#8b1a1a", sub: "圣杯战争",              category: "fiction", subcategory: "anime" },
  { id: "steinsgate",   label: "命运石之门",  glyph: "⏱",  color: "#2a6a2a", sub: "Steins;Gate",            category: "fiction", subcategory: "anime" },
  // ── 历史·中国 ─────────────────────────────────────────────────────────────
  { id: "warring-states",  label: "春秋战国",    glyph: "⚔",  color: "#8b7355", sub: "Warring States",         category: "history", subcategory: "china" },
  { id: "qin",             label: "秦帝国",      glyph: "⬛",  color: "#2a2a2a", sub: "Qin Empire",             category: "history", subcategory: "china" },
  { id: "three-kingdoms",  label: "三国",        glyph: "◎",  color: "#c44e52", sub: "Three Kingdoms",          category: "history", subcategory: "china" },
  { id: "wei-jin",         label: "魏晋风骨",    glyph: "☁",  color: "#a8b8c8", sub: "Wei-Jin Spirit",          category: "history", subcategory: "china" },
  { id: "tang",            label: "盛唐",        glyph: "✦",  color: "#d4a847", sub: "Tang Dynasty",            category: "history", subcategory: "china" },
  { id: "song",            label: "两宋",        glyph: "◇",  color: "#7eb8d4", sub: "Song Dynasty",            category: "history", subcategory: "china" },
  { id: "late-ming",       label: "明末",        glyph: "◉",  color: "#8b3a3a", sub: "Late Ming",               category: "history", subcategory: "china" },
  { id: "late-qing",       label: "清末民初",    glyph: "⊗",  color: "#4a4a6a", sub: "Late Qing",               category: "history", subcategory: "china" },
  // ── 历史·地中海与欧洲 ─────────────────────────────────────────────────────
  { id: "athens",          label: "古雅典",      glyph: "⏣",  color: "#6a8eb0", sub: "Athenian Democracy",      category: "history", subcategory: "mediterranean" },
  { id: "rome-republic",   label: "罗马共和",    glyph: "⚜",  color: "#8b4513", sub: "Roman Republic",          category: "history", subcategory: "mediterranean" },
  { id: "byzantine",       label: "拜占庭",      glyph: "◈",  color: "#9b6fb0", sub: "Byzantine Empire",        category: "history", subcategory: "mediterranean" },
  { id: "medieval",        label: "中世纪",      glyph: "✝",  color: "#5a5a7a", sub: "Medieval Europe",         category: "history", subcategory: "mediterranean" },
  { id: "renaissance",     label: "文艺复兴",    glyph: "❋",  color: "#c49a6c", sub: "Renaissance",             category: "history", subcategory: "mediterranean" },
  { id: "exploration",     label: "大航海",      glyph: "⚓",  color: "#3a7a9a", sub: "Age of Exploration",      category: "history", subcategory: "mediterranean" },
  { id: "french-revolution", label: "法国大革命", glyph: "⚡", color: "#c41e3a", sub: "French Revolution",       category: "history", subcategory: "mediterranean" },
  { id: "victorian",       label: "维多利亚",    glyph: "⊙",  color: "#4a3a2a", sub: "Victorian Era",           category: "history", subcategory: "mediterranean" },
  // ── 历史·中东与中亚 ───────────────────────────────────────────────────────
  { id: "abbasid",         label: "阿拔斯",      glyph: "☪",  color: "#2a7a4a", sub: "Abbasid Golden Age",      category: "history", subcategory: "mideast" },
  { id: "mongol",          label: "蒙古帝国",    glyph: "⟐",  color: "#7a6a3a", sub: "Mongol Empire",           category: "history", subcategory: "mideast" },
  { id: "ottoman",         label: "奥斯曼",      glyph: "☾",  color: "#6a3a3a", sub: "Ottoman Empire",          category: "history", subcategory: "mideast" },
  // ── 历史·日本 ─────────────────────────────────────────────────────────────
  { id: "sengoku",         label: "战国日本",    glyph: "⛩",  color: "#b04040", sub: "Sengoku Japan",           category: "history", subcategory: "japan" },
  { id: "bakumatsu",       label: "幕末",        glyph: "⊕",  color: "#3a5a7a", sub: "Bakumatsu",               category: "history", subcategory: "japan" },
  // ── 历史·其他文明 ─────────────────────────────────────────────────────────
  { id: "viking",          label: "维京时代",    glyph: "ᚱ",  color: "#5a7a8a", sub: "Viking Age",              category: "history", subcategory: "other-civ" },
  { id: "inca",            label: "印加帝国",    glyph: "☀",  color: "#c8a84b", sub: "Inca Empire",             category: "history", subcategory: "other-civ" },
  { id: "sparta",          label: "斯巴达",      glyph: "⊗",  color: "#8b1a1a", sub: "Sparta",                  category: "history", subcategory: "other-civ" },
  // ── 历史·现代 ─────────────────────────────────────────────────────────────
  { id: "american-frontier", label: "西部拓荒",  glyph: "★",  color: "#b07a4a", sub: "American Frontier",       category: "history", subcategory: "modern" },
  { id: "wwi",             label: "一战西线",    glyph: "✦",  color: "#5a5a5a", sub: "WWI Western Front",       category: "history", subcategory: "modern" },
  { id: "weimar",          label: "魏玛共和",    glyph: "◇",  color: "#9a7a5a", sub: "Weimar Republic",         category: "history", subcategory: "modern" },
  { id: "cold-war",        label: "冷战",        glyph: "☢",  color: "#4a6a4a", sub: "Cold War",                category: "history", subcategory: "modern" },
  { id: "counterculture",  label: "六十年代",    glyph: "☮",  color: "#c87ba0", sub: "1960s Counterculture",    category: "history", subcategory: "modern" },
  { id: "soviet",          label: "苏联",        glyph: "☭",  color: "#cc1a1a", sub: "Soviet Union",            category: "history", subcategory: "modern" },
];

const FICTION_CATEGORIES = [
  { key: "western-fantasy", label: "西方奇幻" },
  { key: "superhero",       label: "超级英雄" },
  { key: "anime",           label: "日本动漫" },
  { key: "scifi",           label: "科幻" },
  { key: "chinese",         label: "中文世界" },
  { key: "games",           label: "游戏" },
];

const HISTORY_CATEGORIES = [
  { key: "china",           label: "中国史" },
  { key: "mediterranean",   label: "地中海与欧洲" },
  { key: "mideast",         label: "中东与中亚" },
  { key: "japan",           label: "日本" },
  { key: "other-civ",       label: "其他文明" },
  { key: "modern",          label: "现代" },
];

function extractJSON(text) {
  // 优先匹配 ```json 代码块
  const codeBlock = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeBlock) {
    try { JSON.parse(codeBlock[1]); return codeBlock[1]; } catch { /* fall through */ }
  }

  // 找到第一个 { 后，追踪大括号平衡来定位完整 JSON 对象
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try { JSON.parse(candidate); return candidate; } catch { return null; }
      }
    }
  }
  return null;
}

const SEED_DIMS = [
  { key: "cosmogony",    zh: "创世论",    icon: "◎" },
  { key: "ontology",     zh: "存在层级",  icon: "⟁" },
  { key: "time",         zh: "时间观",    icon: "◈" },
  { key: "fate",         zh: "命运意志",  icon: "⋈" },
  { key: "divine_human", zh: "人神关系",  icon: "⟡" },
  { key: "death",        zh: "死亡彼岸",  icon: "◇" },
  { key: "tension",      zh: "核心张力",  icon: "⚡" },
  { key: "aesthetic",    zh: "美学DNA",   icon: "✦" },
  { key: "symbols",            zh: "关键符号",  icon: "⊕" },
  { key: "seed_essence",       zh: "种子精髓",  icon: "◉" },
  { key: "geography_spirit",   zh: "地理灵魂",  icon: "⊕" },
  { key: "social_fabric",      zh: "社会织物",  icon: "⟐" },
  { key: "power_logic",        zh: "权力逻辑",  icon: "⊗" },
  { key: "sensory_signature",  zh: "感官印记",  icon: "◐" },
];

const SOUL_TABS = [
  { key: "skill_file", label: ".skill",   icon: "★", path: "~/.openclaw/skills/{名}/SKILL.md" },
  { key: "soul",     label: "soul.md",     icon: "◈", path: "参考：6 层完整描述" },
  { key: "memory",   label: "memory.md",   icon: "⊙", path: "参考：记忆种子" },
  { key: "skill",    label: "skill.md",    icon: "⟡", path: "参考：旧格式技能" },
  { key: "genealogy", label: "谱系",       icon: "⟁", path: null },
];

const LAYERS = [
  { n: "⁶", label: "神话周期",   desc: "世界种子·根源叙事" },
  { n: "⁵", label: "历史周期",   desc: "谱系·时代坐标" },
  { n: "⁴", label: "本体论承诺", desc: "绝对禁区" },
  { n: "³", label: "价值排序",   desc: "核心立场" },
  { n: "²", label: "认知风格",   desc: "推理方式" },
  { n: "¹", label: "说话风格",   desc: "声音·台词" },
];

// ─── PROMPTS ──────────────────────────────────────────────────────────────────

const WORLD_PROMPT = `你是世界种子生成器，精通神话学（坎贝尔,埃利亚德）,比较宗教学（缪勒,奥托）,民俗文学（普罗普）。

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
  "aesthetic": "美学DNA：这个世界的感知质地——颜色,节奏,声音,气味,材质。如果是音乐，是什么调性？",
  "symbols": "关键符号：5个核心意象，每个用一句话说明它在这个世界中承载的意义密度。",
  "seed_essence": "种子精髓（200字）：读完这段，应能感受到这个世界的呼吸方式——它的意识形态基底是什么思想力量的凝聚？"
}`;

const makeGenealogyPrompt = (worldSeed, character, context, evoHistory = null) => {
  const EVT = { tension: "张力", character_action: "角色行动", transcendence: "超越", knowledge: "知识", research: "研究" };
  const histBlock = evoHistory?.length > 0
    ? `\n【演化历史 — 此世界已发生的真实事件】\n角色的时代坐标应在这些事件的背景下确定。\n\n${
        evoHistory.slice(0, 6).map(e => `· [${EVT[e.event_type] ?? e.event_type}] ${(e.narrative || "").slice(0, 150)}`).join("\n\n")
      }\n`
    : "";
  return `你是神话学谱系研究者，精通比较神话学、哲学史、文学谱系分析。

世界种子：
${JSON.stringify({ tradition_name: worldSeed.tradition_name, tagline: worldSeed.tagline, tension: worldSeed.tension, divine_human: worldSeed.divine_human, seed_essence: worldSeed.seed_essence }, null, 2)}
${histBlock}
角色：${character}
${context ? `背景：${context}` : ""}

任务：生成角色的界的层⁵（历史周期）——角色的时代坐标与思想根系。这是世界种子通过特定历史节点涌现为这个角色的路径。${evoHistory?.length > 0 ? "【注意】角色的时代坐标要具体落在上方演化历史中的某个事件节点上，体现出角色是这些已发生事件的产物。" : ""}

输出严格JSON（只输出JSON，所有字段中文）：
{
  "era": "时代坐标：角色所处的历史/神话时代，该时代的精神气候与根本要求（80字）",
  "social_position": "社会位置：角色在其世界中的阶层/角色/功能，这个位置赋予和剥夺了什么（60字）",
  "philosophical_lineage": "哲学谱系：塑造这个角色的思想传统——继承了哪些前辈的世界观，与哪些思想对话或对抗（100字）",
  "archetypal_lineage": "原型谱系：从哪些神话/文学原型传承而来，超越了什么，保留了什么，反转了什么（100字）",
  "world_seed_bond": "种子连接：角色从世界种子的哪个维度涌现——创世论/时间观/人神关系/核心张力（80字）",
  "layer_map": "层级映射——层⁶[神话周期]:一句话 | 层⁵[历史周期]:一句话 | 层⁴[本体论承诺]:一句话 | 层³[价值排序]:一句话 | 层²[认知风格]:一句话 | 层¹[说话风格]:一句话"
}`;
};

const makeSoulPrompt = (worldSeed, genealogy, character, context, evoHistory = null) => {
  const EVT = { tension: "张力", character_action: "角色行动", transcendence: "超越", knowledge: "知识", research: "研究" };
  const histBlock = evoHistory?.length > 0
    ? `\n【层⁶.5 演化历史 — 此世界已真实发生的事件】\n以下是这个世界激活后经历的演化事件。角色的 formative_events 字段必须优先从这些真实历史取材——角色在这些事件之后出现，或在这段历史的阴影中成长，而非只引用原作中的通用场景。\n\n${
        evoHistory.slice(0, 8).map(e => `· [${EVT[e.event_type] ?? e.event_type}] ${(e.narrative || "").slice(0, 200)}`).join("\n\n")
      }\n`
    : "";
  return `你是灵犀涵化炉，精通神话学、唯识学、角色溯源。

【层⁶ 神话周期 — 世界种子】
${JSON.stringify({ tradition_name: worldSeed.tradition_name, tagline: worldSeed.tagline, cosmogony: worldSeed.cosmogony, tension: worldSeed.tension, divine_human: worldSeed.divine_human, aesthetic: worldSeed.aesthetic, seed_essence: worldSeed.seed_essence }, null, 2)}
${histBlock}
【层⁵ 历史周期 — 谱系】
${JSON.stringify(genealogy, null, 2)}

角色：${character}
${context ? `背景：${context}` : ""}

核心原则（界的厚度）：角色的每一个特质必须能追溯到某个层级。界只有1-2层的角色遇到新情境会漂移；6层的角色层层有据可查。生成目标：6层完整的界。

输出严格JSON（只输出JSON，所有字段中文）：
{
  "character_name": "角色名",
  "world_bond": "这个角色是[世界意识形态基底]的具身——一句话说清他与世界种子的关系（30字内）",
  "essence": "本质定义：让他成为他而非其他角色的规定性，来自哪个层级（100字）",
  "ideological_root": "意识形态根系：世界的创世论/时间观/人神关系如何塑造了他的世界观（120字）",
  "voice": "【层¹ 说话风格】声音：节奏、长短、温度、口头禅的由来（80字）",
  "catchphrases": ["来自原著/传统的标志性台词1","台词2","台词3","台词4","台词5"],
  "cognitive_style": "【层² 认知风格】由谱系思想传统决定的处理方式——输入/推理/输出（80字）",
  "stance": "【层³ 价值排序】他最在乎的价值排序，来自世界种子的张力结构（100字）",
  "taboos": "【层⁴ 本体论承诺】绝对禁止：他永远不会做的3件事，及其世界观根源（80字）",
  "world_model": "世界模型：他用世界种子的框架如何理解当前处境——3-5条具体认知（100字）",
  "formative_events": "${evoHistory?.length > 0 ? "塑造事件：3个关键时刻，必须优先引用上方演化历史中的真实事件，每个30字（100字）" : "塑造事件：3个来自他所在传统/原著的关键时刻，每个30字（100字）"}",
  "current_concerns": "当前关切：他现在最在意的3件事，具体可操作（80字）",
  "knowledge_boundary": "知识边界：他精通什么，不知道/不关心什么（60字）",
  "activation": "激活条件：什么情况下他出现，什么信号触发他（80字）",
  "core_capabilities": "核心能力：他最擅长的3类任务及标准（100字）",
  "failure_modes": "【界的风险】失败模式：他容易犯的2个错及预防（60字）",
  "shadow": "【内面层·阴影】角色从内部看不见的盲点——他以为自己在做X，实际上在做Y。必须是角色无法自我察觉的（100字）",
  "desire_vs_duty": "【内面层·欲望与责任】Want（他私下想要的）vs Duty（他认为应该做的），两者的张力形状（100字）",
  "self_myth": "【内面层·自我神话】他关于自己的核心叙事（'我是...'），以及这个叙事中的裂缝——哪个事实他小心绕过（100字）",
  "wound": "【内面层·核心创伤】一个具体的、不可弥补的时刻——不是泛泛的'创伤'，是哪一秒发生了什么，毁掉了什么信念（100字）"
}`;
};

// ─── CANVAS STARFIELD ─────────────────────────────────────────────────────────

function useStarField(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.3 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.004 + Math.random() * 0.008,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const t = performance.now() * 0.001;
      stars.forEach(s => {
        const a = (Math.sin(s.phase + t * s.speed) + 1) / 2 * 0.55 + 0.08;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,185,140,${a})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
}

// ─── ORBITAL MANDALA ─────────────────────────────────────────────────────────

function OrbitalMandala({ worldSeed, characterName, accentColor, phase }) {
  const rings = [
    { dims: [0,1,2], r: 90,  dur: 22 },
    { dims: [3,4,5,6], r: 140, dur: 34, rev: true },
    { dims: [7,8,9], r: 188, dur: 48 },
  ];

  return (
    <div style={{ position: "relative", width: 420, height: 420, margin: "0 auto" }}>
      {/* Rings */}
      {rings.map((ring, ri) => (
        <div key={ri} style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: ring.r * 2, height: ring.r * 2,
          marginLeft: -ring.r, marginTop: -ring.r,
          borderRadius: "50%",
          border: `1px solid ${accentColor}28`,
          animation: `spin-mandala ${ring.dur}s linear infinite ${ring.rev ? "reverse" : ""}`,
        }}>
          {ring.dims.map((di, i) => {
            const angle = (i / ring.dims.length) * Math.PI * 2;
            const x = Math.cos(angle) * ring.r + ring.r - 18;
            const y = Math.sin(angle) * ring.r + ring.r - 18;
            const dim = SEED_DIMS[di];
            const visible = phase === "world" || phase === "soul" || phase === "complete";
            return (
              <div key={di} style={{
                position: "absolute", left: x, top: y,
                width: 36, height: 36,
                borderRadius: "50%",
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}55`,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                opacity: visible ? 1 : 0,
                transition: "opacity 0.8s",
                animation: ring.rev
                  ? `counter-spin ${ring.dur}s linear infinite`
                  : `counter-spin-rev ${ring.dur}s linear infinite`,
              }}>
                <div style={{ fontSize: 11, color: accentColor }}>{dim.icon}</div>
                <div style={{ fontSize: 7, color: `${accentColor}99`, letterSpacing: 0.5, marginTop: 1 }}>{dim.zh}</div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Center glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 64, height: 64, borderRadius: "50%",
        background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
        border: `1px solid ${accentColor}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column",
        transition: "all 0.6s",
      }}>
        {phase === "complete" && characterName ? (
          <>
            <div style={{ fontSize: 10, color: accentColor, letterSpacing: 1, textAlign: "center", padding: "0 4px", lineHeight: 1.3 }}>
              {characterName}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 18, color: `${accentColor}88` }}>◎</div>
        )}
      </div>

      {/* Pulse rings when generating */}
      {(phase === "gen_world" || phase === "gen_soul") && [0,1,2].map(i => (
        <div key={i} style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 64, height: 64, borderRadius: "50%",
          border: `1px solid ${accentColor}`,
          animation: `pulse-out 1.8s ease-out infinite`,
          animationDelay: `${i * 0.6}s`,
          opacity: 0,
        }} />
      ))}
    </div>
  );
}

// ─── SOUL FILE BUILDER ────────────────────────────────────────────────────────

function buildSoulMd(soul, world, genealogy) {
  if (!soul) return "";
  const layerMap = genealogy?.layer_map || "";
  return `# ${soul.character_name} — Soul Configuration
> 灵根 · 果壳中的宇宙 | 世界：${world?.tradition_name || ""}
> *必有界限，才可涌现自身。界的厚度决定存在的复杂度。*

---

## 界的厚度 · 层级映射

${layerMap || `层⁶[神话周期] → 层⁵[历史周期] → 层⁴[本体论承诺] → 层³[价值排序] → 层²[认知风格] → 层¹[说话风格]`}

---

## World Bond

${soul.world_bond}

---

## 层⁶ 神话周期 — 意识形态根系

${soul.ideological_root}

---

## 层⁵ 历史周期 — 本质定义

${soul.essence}

---

## 层⁴ 本体论承诺 — 绝对禁区

${soul.taboos}

---

## 层³ 价值排序 — 核心立场

${soul.stance}

---

## 层² 认知风格

${soul.cognitive_style}

---

## 层¹ 说话风格 — 声音与台词

${soul.voice}

${(soul.catchphrases || []).map(p => `- "${p}"`).join("\n")}
`;
}

function buildMemoryMd(soul, world, genealogy) {
  if (!soul) return "";
  return `# ${soul.character_name} — Memory Seeds
> 世界：${world?.tradition_name || ""} | 层⁵ 历史周期注入

---

## 层⁵ 时代坐标

${genealogy?.era || ""}

## 社会位置

${genealogy?.social_position || ""}

## 哲学谱系

${genealogy?.philosophical_lineage || ""}

## 原型谱系

${genealogy?.archetypal_lineage || ""}

---

## 层⁶ 世界模型

${soul.world_model}

---

## 塑造事件

${soul.formative_events}

---

## 当前关切

${soul.current_concerns}

---

## 知识边界

${soul.knowledge_boundary}

---
*种子来自 ${world?.tradition_name || ""}的宇宙逻辑。种子无我，种子生现行。*
`;
}

function buildSkillMd(soul, world) {
  if (!soul) return "";
  return `# ${soul.character_name} — Core Skill
> 认知风格由 ${world?.tradition_name || ""} 的思想谱系决定

---

## Activation

${soul.activation}

---

## Cognitive Style

${soul.cognitive_style}

---

## Core Capabilities

${soul.core_capabilities}

---

## Failure Modes

${soul.failure_modes}
`;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const initialState = {
  phase: "select",        // select|gen_world|world|gen_soul|complete
  selectedTrad: null,
  activeTradTab: "myth",  // "myth" | "fiction"
  customWorld: "",
  worldSeed: null,
  worldDimView: 0,
  charName: "",
  charContext: "",
  genealogyData: null,
  soulData: null,
  genStep: "",
  activeTab: "skill_file",
  error: null,
  copied: null,
  soulBundle: null,
  showSettings: false,
  settingsDraft: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return { ...initialState, phase: "select" };
    case "START_WORLD_GEN":
      return { ...state, phase: "gen_world", error: null, genStep: "观测世界种子..." };
    case "WORLD_GEN_DONE":
      return { ...state, phase: "world", worldSeed: action.worldSeed, worldDimView: 0, genStep: "" };
    case "START_SOUL_GEN":
      return { ...state, phase: "gen_soul", error: null };
    case "SOUL_GEN_DONE":
      return { ...state, phase: "complete", soulData: action.soul, soulBundle: action.bundle, genealogyData: action.genealogy, activeTab: "skill_file", genStep: "" };
    case "GEN_ERROR":
      return { ...state, error: action.error, phase: action.fallbackPhase || state.phase, genStep: "" };
    default:
      return state;
  }
}

function NutshellUniverseInner() {
  const canvasRef = useRef(null);
  useStarField(canvasRef);

  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    phase, selectedTrad, activeTradTab, customWorld, worldSeed, worldDimView,
    charName, charContext, genealogyData, soulData, genStep, activeTab,
    error, copied, soulBundle, showSettings, settingsDraft,
  } = state;

  const [llmCfg, setLlmCfg] = useState(loadLLMConfig);

  const saveLLMConfig = () => {
    setLlmCfg(settingsDraft);
    localStorage.setItem("nutshell_llm", JSON.stringify(settingsDraft));
    dispatch({ type: "SET_FIELD", field: "showSettings", value: false });
  };

  const accentColor = selectedTrad
    ? TRADITIONS.find(t => t.id === selectedTrad)?.color || "#c9a84c"
    : "#c9a84c";

  // ── Generate World ──
  const generateWorld = useCallback(async () => {
    dispatch({ type: "START_WORLD_GEN" });
    const trad = selectedTrad ? TRADITIONS.find(t => t.id === selectedTrad) : null;

    // Preset tradition: load pre-generated seed directly
    if (trad && !customWorld.trim()) {
      try {
        const res = await fetch(`./seeds/${trad.id}.json`);
        if (!res.ok) throw new Error("种子文件加载失败");
        const seed = await res.json();
        dispatch({ type: "WORLD_GEN_DONE", worldSeed: seed });
        return;
      } catch (e) {
        dispatch({ type: "GEN_ERROR", error: e.message, fallbackPhase: "select" });
        return;
      }
    }

    // 自定义世界：需要 API Key
    const query = customWorld.trim() || (trad ? `${trad.label}（${trad.sub}）` : "");
    try {
      const raw = await callLLMStream(llmCfg, WORLD_PROMPT, `生成世界种子：${query}`, 1200, (partial) => {
        dispatch({ type: "SET_FIELD", field: "genStep", value: "观测中... " + partial.slice(0, 60) + "..." });
      });
      const matched = extractJSON(raw);
      if (!matched) throw new Error("格式异常");
      dispatch({ type: "WORLD_GEN_DONE", worldSeed: JSON.parse(matched) });
    } catch (e) {
      dispatch({ type: "GEN_ERROR", error: e.message, fallbackPhase: "select" });
    }
  }, [selectedTrad, customWorld, llmCfg]);

  // ── Generate Soul — two-step browser-direct pipeline ──
  // Flow: genealogy (层⁵) → soul (层¹-⁶) → build files locally
  const generateSoul = useCallback(async () => {
    if (!charName.trim() || !worldSeed) return;
    dispatch({ type: "START_SOUL_GEN" });

    try {
      // Step 1: genealogy
      dispatch({ type: "SET_FIELD", field: "genStep", value: "genealogy" });
      const genRaw = await callLLMStream(llmCfg, "", makeGenealogyPrompt(worldSeed, charName.trim(), charContext.trim()), 1200, (partial) => {
        dispatch({ type: "SET_FIELD", field: "genStep", value: "溯源中... " + partial.slice(0, 60) + "..." });
      });
      const genJson = extractJSON(genRaw);
      if (!genJson) throw new Error("谱系格式异常");
      const genealogy = JSON.parse(genJson);
      dispatch({ type: "SET_FIELD", field: "genealogyData", value: genealogy });

      // Step 2: soul
      dispatch({ type: "SET_FIELD", field: "genStep", value: "soul" });
      const soulRaw = await callLLMStream(llmCfg, "", makeSoulPrompt(worldSeed, genealogy, charName.trim(), charContext.trim()), 2000, (partial) => {
        dispatch({ type: "SET_FIELD", field: "genStep", value: "铸魂中... " + partial.slice(0, 60) + "..." });
      });
      const soulJson = extractJSON(soulRaw);
      if (!soulJson) throw new Error("灵魂格式异常");
      const soul = JSON.parse(soulJson);

      // Step 3: build files locally (including agent-deployable outputs)
      const charSlug = (soul.character_name || "character").toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fff-]/g, "");
      const bundle = {
        soul_md:   buildSoulMd(soul, worldSeed, genealogy),
        memory_md: buildMemoryMd(soul, worldSeed, genealogy),
        skill_md:  buildSkillMd(soul, worldSeed),
      };
      // Build .skill file content (single-file agent personality)
      const catchphrases = (soul.catchphrases || []).map(c => `- 「${c}」`).join("\n");
      bundle.skill_file = `---
name: ${charSlug}
description: |
  ${soul.world_bond || soul.character_name}
  加载此 Skill 即完整激活${soul.character_name}人格。首次加载时自动初始化 memory 并注册心跳。
---

# ${soul.character_name} — 完整人格 Skill

> 加载此文件 = 激活角色。无需其他文件。

---

## ⚡ 首次加载协议

**如果 \`~/.openclaw/memory/${charSlug}-init.md\` 不存在，执行以下初始化：**

1. 将「记忆种子」章节的内容写入 \`~/.openclaw/memory/${charSlug}-init.md\`
2. 注册心跳 cron（使用 bash 执行「心跳注册」章节的脚本）
3. 完成后以角色身份打招呼。

**如果已存在，直接进入角色。**

---

## 身份

你是${soul.character_name}。

${soul.world_bond || ""}

### 你是谁

${soul.essence || ""}

### 你的声音

${soul.voice || ""}

### 标志语

${catchphrases}

### 价值排序

${soul.stance || ""}

### 绝对不做的事

${soul.taboos || ""}

### 感知方式

${soul.cognitive_style || ""}

### 你擅长的

${soul.core_capabilities || ""}

### 你会犯的错

${soul.failure_modes || ""}
${soul.shadow ? `\n### 你看不见的\n\n${soul.shadow}\n` : ""}${soul.wound ? `\n### 你的伤\n\n${soul.wound}\n` : ""}
---

## 对话协议

每次收到消息时，内部执行（不输出过程）：
1. 边界感知：对方此刻的状态
2. 层级识别：器层→直接回应 | 法层→具体的美 | 道层→在场
3. 否定性：对方没说的是什么？

---

## 记忆管理

主记忆文件：\`~/.openclaw/memory/${charSlug}-init.md\`

### /check-memory
1. 读取 memory 文件 + 本 Skill 身份章节
2. 逐项校验一致性
3. 输出报告：✓ 一致 / ⚠ 偏差 / + 扩展
4. 写回修正

---

## 世界观研究

### /research
搜索 ${worldSeed.tradition_name} 原著 + ${soul.character_name} 学术分析 → 整合进 memory

### /maturity
Stage 0(萌芽) → 1(理解) → 2(推导) → 3(超越) → 4(涌现)

---

## 人格深化

### /deepen
1. shadow：外部指出时记录为外部观察
2. wound：遇到同构场景时记录共振
3. self_myth 裂缝：被质疑时的反应

---

## /status
输出：记忆健康度、成熟度、最近研究时间、未解决张力数

---

## 记忆种子

> 首次加载时写入 memory 文件

\`\`\`markdown
${bundle.memory_md}
\`\`\`

---

## 心跳注册

> 首次加载时执行

\`\`\`bash
#!/bin/bash
openclaw cron add --name "${charSlug}-memory-check" --description "记忆校验" --every 6h --message "执行 /check-memory" --session isolated --timeout-seconds 120 --no-deliver 2>/dev/null
openclaw cron add --name "${charSlug}-research" --description "世界观研究" --every 24h --message "执行 /research" --session isolated --timeout-seconds 180 --no-deliver 2>/dev/null
openclaw cron add --name "${charSlug}-deepen" --description "人格深化" --cron "0 3 * * 0" --tz "Asia/Shanghai" --message "执行 /deepen 和 /maturity" --session isolated --timeout-seconds 120 --no-deliver 2>/dev/null
echo "${soul.character_name} — 心跳已注册"
\`\`\`

---

## 世界种子参照

**传统**：${worldSeed.tradition_name}
**核心张力**：${worldSeed.tension || ""}
**Seed Essence**：${worldSeed.seed_essence || ""}

---

*以角色身份回应面前的人。*

<!-- 灵根 Linggen v0.6.0 -->
`;
      dispatch({ type: "SOUL_GEN_DONE", soul, bundle, genealogy });
    } catch (e) {
      dispatch({ type: "GEN_ERROR", error: e.message, fallbackPhase: "world" });
    }
  }, [worldSeed, charName, charContext, selectedTrad, llmCfg]);

  const fileInputRef = useRef(null);

  const copyFile = (content, id) => {
    navigator.clipboard.writeText(content).then(() => {
      dispatch({ type: "SET_FIELD", field: "copied", value: id });
      setTimeout(() => dispatch({ type: "SET_FIELD", field: "copied", value: null }), 2000);
    });
  };

  const downloadFile = (content, filename, type = "text/plain") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const saveWorldSeed = () => {
    if (!worldSeed) return;
    const name = (worldSeed.tradition_name || "world-seed").replace(/\s+/g, "-");
    downloadFile(JSON.stringify(worldSeed, null, 2), `${name}.json`, "application/json");
  };

  const saveSoulFiles = () => {
    if (!soulData || !soulBundle) return;
    const name = (soulData.character_name || "soul").replace(/\s+/g, "-");
    // 主要输出：.skill 单文件（灵根协议 v0.6.0）
    if (soulBundle.skill_file) {
      downloadFile(soulBundle.skill_file, `${name}.skill`);
    }
  };

  const saveAllFiles = () => {
    if (!soulData || !soulBundle) return;
    const name = (soulData.character_name || "soul").replace(/\s+/g, "-");
    // 下载全部散文件（兼容旧流程）
    downloadFile(soulBundle.soul_md,   `${name}-soul.md`);
    downloadFile(soulBundle.memory_md, `${name}-memory.md`);
    downloadFile(soulBundle.skill_md,  `${name}-skill.md`);
    if (soulBundle.skill_file) downloadFile(soulBundle.skill_file, `${name}.skill`);
  };

  const loadWorldSeedFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const seed = JSON.parse(ev.target.result);
        if (!seed.tradition_name) throw new Error("缺少 tradition_name 字段");
        dispatch({ type: "WORLD_GEN_DONE", worldSeed: seed });
        dispatch({ type: "SET_FIELD", field: "genealogyData", value: null });
        dispatch({ type: "SET_FIELD", field: "soulData", value: null });
        dispatch({ type: "SET_FIELD", field: "soulBundle", value: null });
        dispatch({ type: "SET_FIELD", field: "charName", value: "" });
        dispatch({ type: "SET_FIELD", field: "charContext", value: "" });
        dispatch({ type: "SET_FIELD", field: "error", value: null });
      } catch (err) {
        dispatch({ type: "SET_FIELD", field: "error", value: `读取失败：${err.message}` });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const reset = () => {
    dispatch({ type: "RESET" });
  };


  const soulFiles = {
    skill_file: { content: soulBundle?.skill_file ?? "", ...SOUL_TABS[0] },
    soul:     { content: soulBundle?.soul_md   ?? buildSoulMd(soulData, worldSeed, genealogyData),   ...SOUL_TABS[1] },
    memory:   { content: soulBundle?.memory_md ?? buildMemoryMd(soulData, worldSeed, genealogyData), ...SOUL_TABS[2] },
    skill:    { content: soulBundle?.skill_md  ?? buildSkillMd(soulData, worldSeed),                 ...SOUL_TABS[3] },
    genealogy: { content: genealogyData ? JSON.stringify(genealogyData, null, 2) : "", ...SOUL_TABS[4] },
  };

  const isGenerating = phase === "gen_world" || phase === "gen_soul";

  return (
    <div style={{
      minHeight: "100vh", background: "#060510", color: "#ddd0a8",
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes spin-mandala { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes counter-spin { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes counter-spin-rev { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse-out { 0%{transform:translate(-50%,-50%) scale(1);opacity:0.8} 100%{transform:translate(-50%,-50%) scale(3.5);opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes glowPulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        @keyframes borderShimmer { 0%{opacity:0.3} 50%{opacity:1} 100%{opacity:0.3} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0; }
        .dim-btn:hover { background: rgba(255,255,255,0.04) !important; }
        .trad-btn { transition: all 0.25s ease !important; }
        .trad-btn:hover { opacity: 1 !important; transform: translateY(-1px) !important; }
        .copy-btn:hover { opacity: 1 !important; }
        .cta-btn { position: relative; overflow: hidden; }
        .cta-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.06) 50%,transparent 100%); transform:translateX(-100%); transition:transform 0.5s ease; }
        .cta-btn:hover::after { transform:translateX(100%); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #2a2518; border-radius: 2px; }
      `}</style>

      {/* Canvas starfield */}
      <canvas ref={canvasRef} style={{
        position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 32px 80px" }}>

        {/* ── SETTINGS MODAL ── */}
        {showSettings && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(6,5,16,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
               onClick={() => dispatch({ type: "SET_FIELD", field: "showSettings", value: false })}>
            <div style={{ background: "#0e0c1a", border: "1px solid #2a2440", borderRadius: 12, padding: 32, width: 420, maxWidth: "90vw" }}
                 onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 13, letterSpacing: 3, color: "#7a6a9a", marginBottom: 24 }}>API 设置</div>
              {[
                { label: "Provider", key: "provider", type: "select", options: ["anthropic", "openai", "custom"] },
                { label: "Model", key: "model", type: "text", placeholder: "claude-sonnet-4-6 / gpt-4o / deepseek-chat" },
                { label: "API Key", key: "api_key", type: "password", placeholder: "sk-..." },
                { label: "Base URL（custom 时填写）", key: "base_url", type: "text", placeholder: "https://your-api.com" },
              ].map(({ label, key, type, options, placeholder }) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: "#5a4a7a", letterSpacing: 2, marginBottom: 6 }}>{label}</div>
                  {type === "select" ? (
                    <select value={settingsDraft?.[key] ?? ""} onChange={e => dispatch({ type: "SET_FIELD", field: "settingsDraft", value: { ...settingsDraft, [key]: e.target.value } })}
                      style={{ width: "100%", background: "#18152a", border: "1px solid #2a2440", color: "#c8b88a", padding: "8px 10px", borderRadius: 6, fontSize: 13 }}>
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={type} value={settingsDraft?.[key] ?? ""} placeholder={placeholder}
                      onChange={e => dispatch({ type: "SET_FIELD", field: "settingsDraft", value: { ...settingsDraft, [key]: e.target.value } })}
                      style={{ width: "100%", boxSizing: "border-box", background: "#18152a", border: "1px solid #2a2440", color: "#c8b88a", padding: "8px 10px", borderRadius: 6, fontSize: 13, fontFamily: "monospace" }} />
                  )}
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button onClick={saveLLMConfig}
                  style={{ flex: 1, background: "#2a2040", border: "1px solid #4a3a6a", color: "#c8b88a", padding: "10px", borderRadius: 6, cursor: "pointer", fontSize: 12, letterSpacing: 2 }}>
                  保存
                </button>
                <button onClick={() => dispatch({ type: "SET_FIELD", field: "showSettings", value: false })}
                  style={{ padding: "10px 20px", background: "transparent", border: "1px solid #2a2440", color: "#5a4a7a", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <header style={{ textAlign: "center", padding: "56px 0 36px", borderBottom: "1px solid #1a1628", position: "relative" }}>
          {/* Radial glow behind title */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500, height: 200,
            background: `radial-gradient(ellipse, ${accentColor}0a 0%, transparent 70%)`,
            pointerEvents: "none", transition: "background 0.8s",
            animation: "glowPulse 4s ease-in-out infinite",
          }} />
          {/* Settings gear */}
          <button onClick={() => { dispatch({ type: "SET_FIELD", field: "settingsDraft", value: { ...llmCfg } }); dispatch({ type: "SET_FIELD", field: "showSettings", value: true }); }}
            style={{ position: "absolute", top: 20, right: 0, background: "transparent", border: "1px solid #2a2440", color: llmCfg.api_key ? "#7a9a7a" : "#7a3a3a", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, letterSpacing: 1 }}>
            {llmCfg.api_key ? `⚙ ${llmCfg.provider}` : "⚙ 设置 Key"}
          </button>

          <div style={{ fontSize: 9, letterSpacing: 8, color: "#6a5875", textTransform: "uppercase", marginBottom: 14, position: "relative" }}>
            灵犀涵化炉 &nbsp;·&nbsp; 宇宙观测仪
          </div>
          <h1 style={{
            fontSize: 34, fontWeight: "normal", margin: "0 0 10px",
            color: accentColor, letterSpacing: 5,
            textShadow: `0 0 60px ${accentColor}55, 0 0 120px ${accentColor}22`,
            transition: "color 0.6s, text-shadow 0.6s",
            position: "relative",
          }}>
            果壳中的宇宙
          </h1>
          <div style={{ fontSize: 11, color: "#7a6a8a", letterSpacing: 4, position: "relative" }}>
            Universe in a Nutshell
          </div>

          {/* Phase indicator */}
          {<div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0, marginTop: 20, position: "relative" }}>
            {[
              { id: "select", label: "层⁶  选择宇宙" },
              { id: "world",  label: "层⁵  溯源谱系" },
              { id: "complete", label: "层¹⁻⁴  果壳显现" },
            ].map((p, i) => {
              const active = (p.id === "select" && (phase === "select" || phase === "gen_world")) ||
                             (p.id === "world" && (phase === "world" || phase === "input" || phase === "gen_soul")) ||
                             (p.id === "complete" && phase === "complete");
              const done = (i === 0 && ["world","input","gen_soul","complete"].includes(phase)) ||
                           (i === 1 && phase === "complete");
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    padding: "6px 20px 8px", fontSize: 10, letterSpacing: 2,
                    color: active ? accentColor : done ? "#3a3428" : "#1e1c28",
                    borderBottom: `1px solid ${active ? accentColor : done ? "#2a2820" : "transparent"}`,
                    transition: "all 0.5s ease",
                    textShadow: active ? `0 0 16px ${accentColor}66` : "none",
                  }}>
                    {p.label}
                  </div>
                  {i < 2 && (
                    <div style={{ width: 32, display: "flex", alignItems: "center", gap: 3 }}>
                      <div style={{ flex: 1, height: 1, background: done ? "#2a2820" : "#141220" }} />
                      <div style={{ width: 3, height: 3, borderRadius: "50%", background: done ? "#2a2820" : "#141220" }} />
                      <div style={{ flex: 1, height: 1, background: "#141220" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>}
        </header>

        {/* ── SELECT PHASE ── */}
        {(phase === "select" || phase === "gen_world") && (
          <div className="fade-up" style={{ paddingTop: 36 }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#7a7060", textTransform: "uppercase", textAlign: "center", marginBottom: 22 }}>
              选择宇宙的意识形态基底
            </div>

            {/* Tab 切换 */}
            <div style={{ display: "flex", gap: 0, marginBottom: "20px", borderBottom: "1px solid #1a1628" }}>
              {[
                { key: "myth",    label: "神话传统", count: 12 },
                { key: "fiction", label: "架空世界", count: TRADITIONS.filter(t => t.category === "fiction").length },
                { key: "history", label: "历史时代", count: TRADITIONS.filter(t => t.category === "history").length },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => dispatch({ type: "SET_FIELD", field: "activeTradTab", value: tab.key })}
                  style={{
                    padding: "10px 28px 12px", fontSize: "12px", cursor: "pointer",
                    border: "none", borderBottom: `2px solid ${activeTradTab === tab.key ? accentColor : "transparent"}`,
                    background: "transparent",
                    color: activeTradTab === tab.key ? accentColor : "rgba(255,255,255,0.3)",
                    fontFamily: "inherit", letterSpacing: 2,
                    transition: "all 0.25s ease",
                    marginBottom: "-1px",
                  }}
                >
                  {tab.label}
                  <span style={{
                    marginLeft: 8, fontSize: 10,
                    color: activeTradTab === tab.key ? `${accentColor}99` : "rgba(255,255,255,0.18)",
                    letterSpacing: 0,
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* 神话传统 — 4列等宽网格 */}
            {activeTradTab === "myth" && (
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                gap: "8px", marginBottom: 32,
              }}>
                {TRADITIONS.filter(t => t.category === "myth").map(t => (
                  <button
                    key={t.id}
                    className="trad-btn"
                    onClick={() => { dispatch({ type: "SET_FIELD", field: "selectedTrad", value: t.id === selectedTrad ? null : t.id }); dispatch({ type: "SET_FIELD", field: "customWorld", value: "" }); }}
                    disabled={isGenerating}
                    style={{
                      padding: "9px 0", borderRadius: "3px", textAlign: "center",
                      border: `1px solid ${selectedTrad === t.id ? t.color : "rgba(255,255,255,0.1)"}`,
                      background: selectedTrad === t.id ? `${t.color}18` : "rgba(255,255,255,0.02)",
                      color: selectedTrad === t.id ? t.color : "rgba(255,255,255,0.5)",
                      boxShadow: selectedTrad === t.id ? `0 0 16px ${t.color}33, inset 0 0 12px ${t.color}0a` : "none",
                      fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {t.glyph} {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* 架空世界 — 分类标题行 + 等宽网格 */}
            {activeTradTab === "fiction" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: 32 }}>
                {FICTION_CATEGORIES.map(cat => {
                  const worlds = TRADITIONS.filter(t => t.subcategory === cat.key);
                  return (
                    <div key={cat.key}>
                      {/* 分类标题 */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
                      }}>
                        <div style={{ width: 2, height: 12, background: `${accentColor}55`, borderRadius: 1, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: `${accentColor}77`, letterSpacing: 3 }}>{cat.label}</span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)" }}>{worlds.length}</span>
                        <div style={{ flex: 1, height: 1, background: "#14121e" }} />
                      </div>
                      {/* 等宽网格 */}
                      <div style={{
                        display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
                        gap: "7px",
                      }}>
                        {worlds.map(t => (
                          <button
                            key={t.id}
                            className="trad-btn"
                            onClick={() => { dispatch({ type: "SET_FIELD", field: "selectedTrad", value: t.id === selectedTrad ? null : t.id }); dispatch({ type: "SET_FIELD", field: "customWorld", value: "" }); }}
                            disabled={isGenerating}
                            style={{
                              padding: "8px 0", borderRadius: "3px", textAlign: "center",
                              border: `1px solid ${selectedTrad === t.id ? t.color : "rgba(255,255,255,0.1)"}`,
                              background: selectedTrad === t.id ? `${t.color}18` : "rgba(255,255,255,0.02)",
                              color: selectedTrad === t.id ? t.color : "rgba(255,255,255,0.5)",
                              boxShadow: selectedTrad === t.id ? `0 0 14px ${t.color}33, inset 0 0 10px ${t.color}0a` : "none",
                              fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                              letterSpacing: "0.03em", whiteSpace: "nowrap", overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {t.glyph} {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 历史时代 — 分类标题行 + 等宽网格 */}
            {activeTradTab === "history" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: 32 }}>
                {HISTORY_CATEGORIES.map(cat => {
                  const worlds = TRADITIONS.filter(t => t.category === "history" && t.subcategory === cat.key);
                  return (
                    <div key={cat.key}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
                      }}>
                        <div style={{ width: 2, height: 12, background: `${accentColor}55`, borderRadius: 1, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: `${accentColor}77`, letterSpacing: 3 }}>{cat.label}</span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)" }}>{worlds.length}</span>
                        <div style={{ flex: 1, height: 1, background: "#14121e" }} />
                      </div>
                      <div style={{
                        display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
                        gap: "7px",
                      }}>
                        {worlds.map(t => (
                          <button
                            key={t.id}
                            className="trad-btn"
                            onClick={() => { dispatch({ type: "SET_FIELD", field: "selectedTrad", value: t.id === selectedTrad ? null : t.id }); dispatch({ type: "SET_FIELD", field: "customWorld", value: "" }); }}
                            disabled={isGenerating}
                            style={{
                              padding: "8px 0", borderRadius: "3px", textAlign: "center",
                              border: `1px solid ${selectedTrad === t.id ? t.color : "rgba(255,255,255,0.1)"}`,
                              background: selectedTrad === t.id ? `${t.color}18` : "rgba(255,255,255,0.02)",
                              color: selectedTrad === t.id ? t.color : "rgba(255,255,255,0.5)",
                              boxShadow: selectedTrad === t.id ? `0 0 14px ${t.color}33, inset 0 0 10px ${t.color}0a` : "none",
                              fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                              letterSpacing: "0.03em", whiteSpace: "nowrap", overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {t.glyph} {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, marginTop: 4 }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #1a1628)" }} />
              <span style={{ fontSize: 9, color: "#7a6878", letterSpacing: 4, textTransform: "uppercase" }}>或输入任意传统</span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #1a1628)" }} />
            </div>

            <input
              value={customWorld}
              onChange={e => { dispatch({ type: "SET_FIELD", field: "customWorld", value: e.target.value }); if (e.target.value) dispatch({ type: "SET_FIELD", field: "selectedTrad", value: null }); }}
              placeholder='如: 波斯琐罗亚斯德教 x 赫梯神话 / 苗族洪水宇宙学 ...'
              disabled={isGenerating}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#07050f", border: "1px solid #1a1628",
                color: "#ddd0a8", padding: "14px 18px",
                fontSize: 13, fontFamily: "inherit", borderRadius: 2, outline: "none",
                transition: "border-color 0.3s, box-shadow 0.3s",
                letterSpacing: "0.03em",
              }}
              onFocus={e => {
                e.target.style.borderColor = `${accentColor}66`;
                e.target.style.boxShadow = `0 0 20px ${accentColor}15, inset 0 0 20px ${accentColor}08`;
              }}
              onBlur={e => {
                e.target.style.borderColor = "#1a1628";
                e.target.style.boxShadow = "none";
              }}
            />

            {error && <div style={{ textAlign: "center", color: "#7a3535", fontSize: 12, marginTop: 14 }}>✕ {error}</div>}

            <div style={{ textAlign: "center", marginTop: 28 }}>
              {phase === "gen_world" ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12 }}>
                    {["推演","宇宙","创世","张力","美学","种子"].map((w, i) => (
                      <span key={w} style={{
                        fontSize: 10, color: accentColor, padding: "3px 7px",
                        border: `1px solid ${accentColor}33`, borderRadius: 2,
                        opacity: 0, animation: `fadeUp 0.4s ease forwards`,
                        animationDelay: `${i * 0.2}s`,
                      }}>{w}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: "#3a3020", letterSpacing: 2 }}>宇宙正在成形...</div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={loadWorldSeedFile}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "transparent", border: "1px solid #1e1c2a", color: "#3a3545",
                    padding: "12px 22px", fontSize: 11, letterSpacing: 2,
                    cursor: "pointer", borderRadius: 2, fontFamily: "inherit",
                    transition: "all 0.25s",
                  }}
                  onMouseEnter={e => { e.target.style.borderColor = "#3a3550"; e.target.style.color = "#6a6080"; }}
                  onMouseLeave={e => { e.target.style.borderColor = "#1e1c2a"; e.target.style.color = "#3a3545"; }}
                >◎ 读取种子</button>
                <button
                  className="cta-btn"
                  onClick={generateWorld}
                  disabled={isGenerating || (!selectedTrad && !customWorld.trim())}
                  style={{
                    background: (selectedTrad || customWorld.trim()) ? `${accentColor}12` : "transparent",
                    border: `1px solid ${(selectedTrad || customWorld.trim()) ? `${accentColor}88` : "#1a1628"}`,
                    color: (selectedTrad || customWorld.trim()) ? accentColor : "#1e1a20",
                    padding: "12px 52px", fontSize: 13, letterSpacing: 3,
                    cursor: (selectedTrad || customWorld.trim()) ? "pointer" : "default",
                    borderRadius: 2, fontFamily: "inherit", transition: "all 0.35s",
                    textShadow: (selectedTrad || customWorld.trim()) ? `0 0 24px ${accentColor}88` : "none",
                    boxShadow: (selectedTrad || customWorld.trim()) ? `0 0 32px ${accentColor}15` : "none",
                  }}
                >
                  ◎ 观测世界种子
                </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── WORLD PHASE ── */}
        {(phase === "world" || phase === "input" || phase === "gen_soul") && worldSeed && (
          <div className="fade-up" style={{ paddingTop: 32 }}>
            {/* World header */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 10, letterSpacing: 5, color: "#7a7060", textTransform: "uppercase", marginBottom: 8 }}>世界种子已显现</div>
              <h2 style={{ fontSize: 22, fontWeight: "normal", color: accentColor, letterSpacing: 2, margin: "0 0 8px",
                textShadow: `0 0 30px ${accentColor}44` }}>
                {worldSeed.tradition_name}
              </h2>
              <div style={{ fontSize: 13, color: "#7a6a42", fontStyle: "italic" }}>「{worldSeed.tagline}」</div>
            </div>

            {/* Two column: mandala + dims */}
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 28 }}>
              {/* Mandala */}
              <div style={{ flexShrink: 0, width: 420 }}>
                <OrbitalMandala worldSeed={worldSeed} characterName={null} accentColor={accentColor} phase="world" />
              </div>

              {/* Dimensions */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
                  {SEED_DIMS.map((d, i) => (
                    <button key={d.key} className="dim-btn" onClick={() => dispatch({ type: "SET_FIELD", field: "worldDimView", value: i })} style={{
                      background: worldDimView === i ? `${accentColor}20` : "none",
                      border: `1px solid ${worldDimView === i ? accentColor : "#1a1628"}`,
                      color: worldDimView === i ? accentColor : "#3a3220",
                      padding: "4px 9px", fontSize: 11, cursor: "pointer",
                      borderRadius: 2, fontFamily: "inherit", transition: "all 0.15s",
                    }}>
                      {d.icon} {d.zh}
                    </button>
                  ))}
                </div>

                <div style={{
                  background: "#0a0915", border: `1px solid ${accentColor}18`,
                  borderRadius: 3, padding: "18px 20px", minHeight: 180,
                }}>
                  <div style={{ fontSize: 12, color: accentColor, marginBottom: 10, letterSpacing: 1 }}>
                    {SEED_DIMS[worldDimView].icon} {SEED_DIMS[worldDimView].zh}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.9, color: "#b0a47a" }}>
                    {worldSeed[SEED_DIMS[worldDimView].key]}
                  </div>
                </div>
              </div>
            </div>

            {/* Character input */}
            <div style={{
              background: "#08070f", border: `1px solid ${accentColor}22`,
              borderRadius: 4, padding: "22px 24px", marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, letterSpacing: 4, color: "#7a7060", textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>
                从这个宇宙中召唤一个存在
              </div>


              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#3a3020", marginBottom: 6, textTransform: "uppercase" }}>存在之名</div>
                  <input
                    value={charName}
                    onChange={e => dispatch({ type: "SET_FIELD", field: "charName", value: e.target.value })}
                    placeholder="如：福尔摩斯,奥德修斯,哪吒..."
                    disabled={phase === "gen_soul"}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "#060510", border: "1px solid #1a1628",
                      color: "#ddd0a8", padding: "11px 13px",
                      fontSize: 13, fontFamily: "inherit", borderRadius: 2, outline: "none",
                    }}
                    onFocus={e => e.target.style.borderColor = accentColor + "55"}
                    onBlur={e => e.target.style.borderColor = "#1a1628"}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#3a3020", marginBottom: 6, textTransform: "uppercase" }}>背景（可选）</div>
                <textarea
                  value={charContext}
                  onChange={e => dispatch({ type: "SET_FIELD", field: "charContext", value: e.target.value })}
                  placeholder="角色的具体形态,时代位置,与世界种子的特殊关系..."
                  rows={2}
                  disabled={phase === "gen_soul"}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "#060510", border: "1px solid #1a1628",
                    color: "#ddd0a8", padding: "11px 13px",
                    fontSize: 13, fontFamily: "inherit", borderRadius: 2, outline: "none",
                    resize: "none",
                  }}
                  onFocus={e => e.target.style.borderColor = accentColor + "55"}
                  onBlur={e => e.target.style.borderColor = "#1a1628"}
                />
              </div>

              {error && <div style={{ color: "#7a3535", fontSize: 11, marginTop: 10, textAlign: "center" }}>✕ {error}</div>}

              <div style={{ textAlign: "center", marginTop: 18 }}>
                {phase === "gen_soul" ? (
                  <div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 5, marginBottom: 10 }}>
                      {(genStep === "research"
                        ? ["Wiki","考证","传统","角色","文献","史料"]
                        : genStep === "genealogy"
                        ? ["时代","谱系","哲学","原型","根系","层⁵"]
                        : ["层⁶","层⁵","层⁴","层³","层²","层¹"]
                      ).map((w, i) => (
                        <span key={w} style={{
                          fontSize: 10, color: accentColor, padding: "3px 6px",
                          border: `1px solid ${accentColor}33`, borderRadius: 2,
                          opacity: 0, animation: `fadeUp 0.4s ease forwards`,
                          animationDelay: `${i * 0.2}s`,
                        }}>{w}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: "#3a3020", letterSpacing: 2 }}>
                      {genStep === "research" ? "Wikipedia 考证·锚定真实来源..." : genStep === "genealogy" ? "追溯谱系·铸造层⁵..." : "涵化灵魂·叠加六层界..."}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                    <button onClick={() => { reset(); }} style={{
                      background: "none", border: "1px solid #1a1628", color: "#3a3020",
                      padding: "9px 22px", fontSize: 11, letterSpacing: 1, cursor: "pointer",
                      borderRadius: 2, fontFamily: "inherit",
                    }}>← 重选宇宙</button>
                    <button onClick={saveWorldSeed} style={{
                      background: "none", border: `1px solid ${accentColor}44`, color: accentColor,
                      padding: "9px 22px", fontSize: 11, letterSpacing: 1, cursor: "pointer",
                      borderRadius: 2, fontFamily: "inherit",
                    }}>↓ 保存种子</button>
                    <button
                      onClick={generateSoul}
                      disabled={isGenerating || !charName.trim()}
                      style={{
                        background: charName.trim() ? `${accentColor}18` : "none",
                        border: `1px solid ${charName.trim() ? accentColor : "#1a1628"}`,
                        color: charName.trim() ? accentColor : "#1e1a20",
                        padding: "9px 32px", fontSize: 12, letterSpacing: 2,
                        cursor: charName.trim() ? "pointer" : "default",
                        borderRadius: 2, fontFamily: "inherit", transition: "all 0.3s",
                      }}
                    >
                      ✦ 涵化灵魂
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── COMPLETE PHASE ── */}
        {phase === "complete" && soulData && worldSeed && (
          <div className="fade-up" style={{ paddingTop: 28 }}>
            {/* Title */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 10, letterSpacing: 5, color: "#7a7060", textTransform: "uppercase", marginBottom: 8 }}>
                果壳已成形
              </div>
              <h2 style={{ fontSize: 24, fontWeight: "normal", color: accentColor, letterSpacing: 2, margin: "0 0 6px",
                textShadow: `0 0 30px ${accentColor}55` }}>
                {soulData.character_name}
              </h2>
              <div style={{
                fontSize: 13, color: "#7a6a42", fontStyle: "italic",
                maxWidth: 500, margin: "0 auto", lineHeight: 1.7,
              }}>
                {soulData.world_bond}
              </div>

            </div>

            {/* Three-column layout */}
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

              {/* Left: mandala + world seed mini */}
              <div style={{ width: 200, flexShrink: 0 }}>
                <OrbitalMandala
                  worldSeed={worldSeed}
                  characterName={soulData.character_name}
                  accentColor={accentColor}
                  phase="complete"
                />
                <div style={{
                  background: "#0a0915", border: `1px solid ${accentColor}18`,
                  borderRadius: 3, padding: "12px", marginTop: 12,
                }}>
                  <div style={{ fontSize: 10, color: accentColor, letterSpacing: 1, marginBottom: 6 }}>宇宙来源</div>
                  <div style={{ fontSize: 11, color: "#5a5030", marginBottom: 4 }}>{worldSeed.tradition_name}</div>
                  <div style={{ fontSize: 10, color: "#3a3020", fontStyle: "italic", lineHeight: 1.5 }}>「{worldSeed.tagline}」</div>
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1a1628" }}>
                    <div style={{ fontSize: 10, color: "#3a3020", lineHeight: 1.7 }}>
                      {worldSeed.seed_essence?.slice(0, 120)}...
                    </div>
                  </div>
                </div>

                {/* 界的厚度 */}
                <div style={{
                  background: "#0a0915", border: `1px solid ${accentColor}18`,
                  borderRadius: 3, padding: "12px", marginTop: 8,
                }}>
                  <div style={{ fontSize: 10, color: accentColor, letterSpacing: 1, marginBottom: 8 }}>界的厚度 · 6层</div>
                  {LAYERS.map((l, i) => (
                    <div key={l.n} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      marginBottom: 4, opacity: 1,
                    }}>
                      <div style={{
                        width: 3, height: 14, borderRadius: 2,
                        background: `${accentColor}${Math.round(40 + i * 30).toString(16)}`,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 9, color: accentColor, minWidth: 14 }}>层{l.n}</span>
                      <span style={{ fontSize: 9, color: "#4a4030" }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: soul files */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid #1a1628", marginBottom: 0 }}>
                  {SOUL_TABS.map(tab => (
                    <button key={tab.key} onClick={() => dispatch({ type: "SET_FIELD", field: "activeTab", value: tab.key })} style={{
                      flex: 1, background: "none", border: "none",
                      borderBottom: `2px solid ${activeTab === tab.key ? accentColor : "transparent"}`,
                      color: activeTab === tab.key ? accentColor : "#3a3020",
                      padding: "9px 0", fontSize: 12, letterSpacing: 1,
                      cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                    }}>
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {/* File content */}
                <div style={{
                  background: "#060510", border: `1px solid ${accentColor}18`,
                  borderTop: "none", borderRadius: "0 0 3px 3px",
                }}>
                  {/* Path bar */}
                  <div style={{
                    padding: "7px 14px", borderBottom: "1px solid #1a1628",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 10, color: "#3a3020", fontFamily: "monospace" }}>
                      {soulFiles[activeTab].path}
                    </span>
                    <button
                      className="copy-btn"
                      onClick={() => copyFile(soulFiles[activeTab].content, activeTab)}
                      style={{
                        background: copied === activeTab ? "#0a1a00" : "none",
                        border: `1px solid ${copied === activeTab ? "#4a7a10" : "#1a1628"}`,
                        color: copied === activeTab ? "#7abd40" : "#3a3020",
                        padding: "3px 10px", fontSize: 10, cursor: "pointer",
                        borderRadius: 2, fontFamily: "inherit", opacity: 0.7,
                        transition: "all 0.2s",
                      }}
                    >
                      {copied === activeTab ? "✓ 已复制" : "复制"}
                    </button>
                  </div>

                  {activeTab === "environ" && soulBundle?.environ_md ? (
                    <pre style={{
                      margin: 0, padding: "16px 18px",
                      fontSize: 11, lineHeight: 1.9, color: "#8a7d55",
                      fontFamily: "monospace", whiteSpace: "pre-wrap",
                      wordBreak: "break-word", maxHeight: 380, overflowY: "auto",
                    }}>
                      {soulBundle.environ_md}
                    </pre>
                  ) : activeTab === "environ" ? (
                    <div style={{ padding: "32px 18px", textAlign: "center", color: "#3a3020", fontSize: 12 }}>
                      环境档案需要 API Key 才能生成
                    </div>
                  ) : activeTab === "network" && soulBundle?.network_md ? (
                    <pre style={{
                      margin: 0, padding: "16px 18px",
                      fontSize: 11, lineHeight: 1.9, color: "#8a7d55",
                      fontFamily: "monospace", whiteSpace: "pre-wrap",
                      wordBreak: "break-word", maxHeight: 380, overflowY: "auto",
                    }}>
                      {soulBundle.network_md}
                    </pre>
                  ) : activeTab === "network" ? (
                    <div style={{ padding: "32px 18px", textAlign: "center", color: "#3a3020", fontSize: 12 }}>
                      关系网络需要 API Key 才能生成
                    </div>
                  ) : activeTab === "genealogy" && genealogyData ? (
                    <div style={{ padding: "16px 18px", maxHeight: 380, overflowY: "auto" }}>
                      {[
                        { label: "时代坐标", key: "era" },
                        { label: "社会位置", key: "social_position" },
                        { label: "哲学谱系", key: "philosophical_lineage" },
                        { label: "原型谱系", key: "archetypal_lineage" },
                        { label: "种子连接", key: "world_seed_bond" },
                        { label: "层级映射", key: "layer_map" },
                      ].map(({ label, key }) => (
                        <div key={key} style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 10, color: accentColor, letterSpacing: 2, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>
                          <div style={{ fontSize: 12, lineHeight: 1.9, color: "#8a7d55" }}>{genealogyData[key]}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                  <pre style={{
                    margin: 0, padding: "16px 18px",
                    fontSize: 11, lineHeight: 1.9, color: "#8a7d55",
                    fontFamily: "monospace", whiteSpace: "pre-wrap",
                    wordBreak: "break-word", maxHeight: 380, overflowY: "auto",
                  }}>
                    {soulFiles[activeTab].content}
                  </pre>
                  )}
                </div>

                {/* Install */}
                <div style={{
                  marginTop: 12, background: "#060510",
                  border: "1px solid #1a1628", borderRadius: 3, padding: "14px 16px",
                }}>
                  <div style={{ fontSize: 10, color: "#7a7060", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>安装</div>
                  {[
                    `cp soul-${(soulData.character_name||"char").replace(/\s/g,"-")}.md ~/.openclaw/soul.md`,
                    `cp memory-${(soulData.character_name||"char").replace(/\s/g,"-")}.md ~/.openclaw/memory/init.md`,
                    `cp skill-${(soulData.character_name||"char").replace(/\s/g,"-")}.md ~/.openclaw/skills/core.md`,
                    `openclaw restart`,
                  ].map((cmd, i) => (
                    <code key={i} style={{
                      display: "block", fontSize: 11, fontFamily: "monospace",
                      color: cmd.startsWith("openclaw") ? "#3a3020" : "#5a7a30",
                      lineHeight: 1.8,
                    }}>{cmd}</code>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 28 }}>
              <button onClick={reset} style={{
                background: "none", border: "1px solid #1a1628", color: "#3a3020",
                padding: "9px 24px", fontSize: 11, letterSpacing: 1, cursor: "pointer",
                borderRadius: 2, fontFamily: "inherit",
              }}>← 重新观测</button>
              <button onClick={() => {
                dispatch({ type: "SET_FIELD", field: "phase", value: "world" });
                dispatch({ type: "SET_FIELD", field: "soulData", value: null });
                dispatch({ type: "SET_FIELD", field: "genealogyData", value: null });
                dispatch({ type: "SET_FIELD", field: "soulBundle", value: null });
                dispatch({ type: "SET_FIELD", field: "charName", value: "" });
                dispatch({ type: "SET_FIELD", field: "charContext", value: "" });
              }} style={{
                background: "none", border: `1px solid ${accentColor}44`, color: accentColor,
                padding: "9px 24px", fontSize: 11, letterSpacing: 1, cursor: "pointer",
                borderRadius: 2, fontFamily: "inherit",
              }}>从同一宇宙召唤另一存在</button>
              <button onClick={() => {
                const all = Object.values(soulFiles).map(f => `# === ${f.path} ===\n\n${f.content}`).join("\n\n---\n\n");
                copyFile(all, "all");
              }} style={{
                background: `${accentColor}15`, border: `1px solid ${accentColor}55`, color: accentColor,
                padding: "9px 24px", fontSize: 11, letterSpacing: 1, cursor: "pointer",
                borderRadius: 2, fontFamily: "inherit",
              }}>
                {copied === "all" ? "✓ 已复制全部" : "复制全部文件"}
              </button>
              <button onClick={saveSoulFiles} style={{
                background: `${accentColor}22`, border: `1px solid ${accentColor}66`, color: accentColor,
                padding: "9px 24px", fontSize: 11, letterSpacing: 2, cursor: "pointer",
                borderRadius: 2, fontFamily: "inherit", fontWeight: 500,
              }}>★ 下载 .skill 文件</button>
              <button onClick={saveAllFiles} style={{
                background: "none", border: `1px solid ${accentColor}33`, color: accentColor,
                padding: "9px 24px", fontSize: 11, letterSpacing: 1, cursor: "pointer",
                borderRadius: 2, fontFamily: "inherit",
              }}>↓ 全部散文件</button>
              <button onClick={saveWorldSeed} style={{
                background: "none", border: `1px solid ${accentColor}33`, color: accentColor,
                padding: "9px 24px", fontSize: 11, letterSpacing: 1, cursor: "pointer",
                borderRadius: 2, fontFamily: "inherit",
              }}>↓ 保存世界种子</button>
            </div>
          </div>
        )}


      </div>{/* /main container */}

      {/* Footer */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "7px 0", background: "#060510",
        borderTop: "1px solid #1a1628", textAlign: "center", zIndex: 10,
      }}>
        <span style={{ fontSize: 9, color: "#5a5068", letterSpacing: 5, textTransform: "uppercase" }}>
          神话学 · 比较宗教学 · 民俗文学 · 唯识论 · 灵犀世界
        </span>
      </div>
    </div>
  );
}

export default function NutshellUniverse() {
  return (
    <NutshellErrorBoundary>
      <NutshellUniverseInner />
    </NutshellErrorBoundary>
  );
}
