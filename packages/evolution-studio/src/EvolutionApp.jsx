import { useState, useEffect, useCallback, useRef } from "react";

// ─── TRADITIONS ───────────────────────────────────────────────────────────────

const TRADITIONS = [
  { id: "greek",        label: "古希腊",      glyph: "☽",  color: "#7eb8d4" },
  { id: "norse",        label: "北欧神话",    glyph: "ᚱ",  color: "#9b8ecf" },
  { id: "zoroastrian",  label: "琐罗亚斯德",  glyph: "🔥", color: "#d4976a" },
  { id: "vedic",        label: "印度吠陀",    glyph: "ॐ",  color: "#d4b96a" },
  { id: "egyptian",     label: "埃及神话",    glyph: "𓂀", color: "#c9a84c" },
  { id: "mesopotamian", label: "美索不达米亚", glyph: "𒀭", color: "#b07a5a" },
  { id: "celtic",       label: "凯尔特",      glyph: "᛫",  color: "#7dba8a" },
  { id: "shinto",       label: "日本神道",    glyph: "⛩", color: "#e8a0a0" },
  { id: "taoist",       label: "道教神话",    glyph: "⊙",  color: "#a8c5d4" },
  { id: "mayan",        label: "玛雅宇宙",    glyph: "❋",  color: "#8ecf9b" },
  { id: "tibetan",      label: "藏传密教",    glyph: "ༀ",  color: "#cf9b8e" },
  { id: "aztec",        label: "阿兹特克",    glyph: "✦",  color: "#d4c06a" },
  { id: "hp",           label: "哈利·波特",   glyph: "⚡",  color: "#7b5ea7" },
  { id: "lotr",         label: "中土大陆",    glyph: "◉",  color: "#8b7355" },
  { id: "got",          label: "冰与火之歌",  glyph: "❄",  color: "#4a6680" },
  { id: "witcher",      label: "巫师世界",    glyph: "⊕",  color: "#2d4a2d" },
  { id: "marvel",       label: "漫威宇宙",    glyph: "⭐",  color: "#c41e3a" },
  { id: "dc",           label: "DC宇宙",      glyph: "◈",  color: "#1a56c4" },
  { id: "akira",        label: "AKIRA",       glyph: "◎",  color: "#cc1100" },
  { id: "naruto",       label: "火影忍者",    glyph: "✦",  color: "#e8855a" },
  { id: "onepiece",     label: "海贼王",      glyph: "⚓",  color: "#3399cc" },
  { id: "aot",          label: "进击的巨人",  glyph: "⟁",  color: "#7a5c3a" },
  { id: "fma",          label: "钢之炼金术师", glyph: "⊗", color: "#cc8833" },
  { id: "eva",          label: "新世纪福音战士", glyph: "◇", color: "#6633aa" },
  { id: "bleach",       label: "死神",        glyph: "☽",  color: "#1a1a2e" },
  { id: "dragonball",   label: "龙珠",        glyph: "★",  color: "#f7941d" },
  { id: "starwars",     label: "星球大战",    glyph: "✦",  color: "#4a4a7a" },
  { id: "dune",         label: "沙丘",        glyph: "◉",  color: "#c8a84b" },
  { id: "matrix",       label: "黑客帝国",    glyph: "◈",  color: "#003300" },
  { id: "foundation",   label: "基地",        glyph: "⊙",  color: "#2a4a6a" },
  { id: "rickmorty",    label: "瑞克与莫蒂",  glyph: "◎",  color: "#97ce4c" },
  { id: "xiyouji",      label: "西游记",      glyph: "☁",  color: "#c87941" },
  { id: "fengshen",     label: "封神演义",    glyph: "⊕",  color: "#8b3a3a" },
  { id: "threebody",    label: "三体",        glyph: "◎",  color: "#1a2a4a" },
  { id: "wuxia",        label: "金庸武侠",    glyph: "⋈",  color: "#2a5a2a" },
  { id: "hongloumeng",  label: "红楼梦",      glyph: "◇",  color: "#c87ba0" },
  { id: "darksouls",    label: "黑暗之魂",    glyph: "◉",  color: "#3a2a1a" },
  { id: "zelda",        label: "塞尔达传说",  glyph: "◈",  color: "#c8a000" },
  { id: "elden",        label: "艾尔登法环",  glyph: "⊗",  color: "#4a3a1a" },
  { id: "genshin",      label: "原神",        glyph: "✦",  color: "#4a9ab4" },
  // 历史
  { id: "warring-states",  label: "春秋战国",    glyph: "⚔",  color: "#8b7355" },
  { id: "qin",             label: "秦帝国",      glyph: "⬛",  color: "#2a2a2a" },
  { id: "three-kingdoms",  label: "三国",        glyph: "◎",  color: "#c44e52" },
  { id: "wei-jin",         label: "魏晋风骨",    glyph: "☁",  color: "#a8b8c8" },
  { id: "tang",            label: "盛唐",        glyph: "✦",  color: "#d4a847" },
  { id: "song",            label: "两宋",        glyph: "◇",  color: "#7eb8d4" },
  { id: "late-ming",       label: "明末",        glyph: "◉",  color: "#8b3a3a" },
  { id: "late-qing",       label: "清末民初",    glyph: "⊗",  color: "#4a4a6a" },
  { id: "athens",          label: "古雅典",      glyph: "⏣",  color: "#6a8eb0" },
  { id: "rome-republic",   label: "罗马共和",    glyph: "⚜",  color: "#8b4513" },
  { id: "byzantine",       label: "拜占庭",      glyph: "◈",  color: "#9b6fb0" },
  { id: "medieval",        label: "中世纪",      glyph: "✝",  color: "#5a5a7a" },
  { id: "renaissance",     label: "文艺复兴",    glyph: "❋",  color: "#c49a6c" },
  { id: "exploration",     label: "大航海",      glyph: "⚓",  color: "#3a7a9a" },
  { id: "french-revolution", label: "法国大革命", glyph: "⚡", color: "#c41e3a" },
  { id: "victorian",       label: "维多利亚",    glyph: "⊙",  color: "#4a3a2a" },
  { id: "abbasid",         label: "阿拔斯",      glyph: "☪",  color: "#2a7a4a" },
  { id: "mongol",          label: "蒙古帝国",    glyph: "⟐",  color: "#7a6a3a" },
  { id: "ottoman",         label: "奥斯曼",      glyph: "☾",  color: "#6a3a3a" },
  { id: "sengoku",         label: "战国日本",    glyph: "⛩",  color: "#b04040" },
  { id: "bakumatsu",       label: "幕末",        glyph: "⊕",  color: "#3a5a7a" },
  { id: "viking",          label: "维京时代",    glyph: "ᚱ",  color: "#5a7a8a" },
  { id: "inca",            label: "印加帝国",    glyph: "☀",  color: "#c8a84b" },
  { id: "sparta",          label: "斯巴达",      glyph: "⊗",  color: "#8b1a1a" },
  { id: "american-frontier", label: "西部拓荒",  glyph: "★",  color: "#b07a4a" },
  { id: "wwi",             label: "一战西线",    glyph: "✦",  color: "#5a5a5a" },
  { id: "weimar",          label: "魏玛共和",    glyph: "◇",  color: "#9a7a5a" },
  { id: "cold-war",        label: "冷战",        glyph: "☢",  color: "#4a6a4a" },
  { id: "counterculture",  label: "六十年代",    glyph: "☮",  color: "#c87ba0" },
  { id: "soviet",          label: "苏联",        glyph: "☭",  color: "#cc1a1a" },
];

// ─── SETTINGS PANEL ───────────────────────────────────────────────────────────

function SettingsPanel({ evoConfig, evoConfigSaving, evoConfigMsg, saveConfig }) {
  const MODELS = {
    anthropic: ["claude-opus-4-6", "claude-sonnet-4-6", "claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"],
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    deepseek: ["deepseek-chat", "deepseek-reasoner"],
    groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    custom: [],
  };
  const INPUT = {
    background: "#060510", border: "1px solid #1a1628", color: "#bba870",
    padding: "6px 10px", fontSize: 11, borderRadius: 2, fontFamily: "inherit",
    width: "100%", boxSizing: "border-box", outline: "none",
  };
  const [draftProvider, setDraftProvider] = useState(evoConfig.provider ?? "anthropic");
  const draft = useRef({ ...evoConfig });
  useEffect(() => { draft.current = { ...evoConfig }; }, [evoConfig]);

  const presets = MODELS[draftProvider] ?? [];
  return (
    <div style={{ background: "#0a0818", border: "1px solid #1e1a30", borderRadius: 4, padding: "20px 22px", marginBottom: 24, textAlign: "left" }}>
      <div style={{ fontSize: 9, letterSpacing: 3, color: "#7a6a8a", textTransform: "uppercase", marginBottom: 18 }}>
        API 配置
        <span style={{ marginLeft: 12, color: evoConfig.has_key ? "#4a7a4a" : "#7a4a3a" }}>
          {evoConfig.has_key ? "● Key 已配置" : "○ 未配置 — Mock 模式"}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 9, color: "#6a5a7a", letterSpacing: 2, marginBottom: 5 }}>PROVIDER</div>
          <select defaultValue={evoConfig.provider} onChange={e => { draft.current.provider = e.target.value; setDraftProvider(e.target.value); }} style={{ ...INPUT }}>
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
            <option value="deepseek">DeepSeek</option>
            <option value="groq">Groq</option>
            <option value="custom">Custom (OpenAI-compatible)</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#6a5a7a", letterSpacing: 2, marginBottom: 5 }}>MODEL</div>
          {presets.length > 0 ? (
            <select defaultValue={evoConfig.model} onChange={e => { draft.current.model = e.target.value; }} style={{ ...INPUT }}>
              {presets.map(m => <option key={m} value={m}>{m}</option>)}
              <option value="__custom__">— 手动输入 —</option>
            </select>
          ) : (
            <input defaultValue={evoConfig.model} onChange={e => { draft.current.model = e.target.value; }} style={INPUT} placeholder="模型名称" />
          )}
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: "#6a5a7a", letterSpacing: 2, marginBottom: 5 }}>API KEY</div>
        <input
          type="password"
          defaultValue={evoConfig.api_key?.startsWith("••••") ? "" : evoConfig.api_key}
          onChange={e => { draft.current.api_key = e.target.value; }}
          placeholder={evoConfig.api_key || "sk-ant-...  /  sk-...  /  Bearer ..."}
          style={INPUT}
          autoComplete="off"
        />
      </div>
      {draftProvider === "custom" && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: "#6a5a7a", letterSpacing: 2, marginBottom: 5 }}>BASE URL</div>
          <input defaultValue={evoConfig.base_url ?? ""} onChange={e => { draft.current.base_url = e.target.value; }} style={INPUT} placeholder="https://api.example.com/v1" />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => saveConfig(draft.current)}
          disabled={evoConfigSaving}
          style={{
            background: "#1a1430", border: "1px solid #3a2a5a", color: "#8a7aaa",
            padding: "6px 20px", fontSize: 10, letterSpacing: 2, cursor: "pointer",
            borderRadius: 2, fontFamily: "inherit", opacity: evoConfigSaving ? 0.5 : 1,
          }}
        >
          {evoConfigSaving ? "保存中…" : "保存"}
        </button>
        {evoConfigMsg && (
          <span style={{ fontSize: 9, color: evoConfigMsg.includes("失败") ? "#7a4a3a" : "#4a7a4a", letterSpacing: 1 }}>
            {evoConfigMsg}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function EvolutionApp() {
  const [evoWorlds, setEvoWorlds] = useState([]);
  const [evoLoading, setEvoLoading] = useState(false);
  const [evoSelected, setEvoSelected] = useState(null);
  const [evoHistory, setEvoHistory] = useState([]);
  const [evoMaturity, setEvoMaturity] = useState({});
  const [evoGenerating, setEvoGenerating] = useState(null);
  const [evoGenResult, setEvoGenResult] = useState(null);
  const [evoPicker, setEvoPicker] = useState(false);
  const [evoSyncTarget, setEvoSyncTarget] = useState(null);
  const [evoSyncCharName, setEvoSyncCharName] = useState("");
  const [evoSyncMemory, setEvoSyncMemory] = useState("");
  const [evoSyncing, setEvoSyncing] = useState(false);
  const [evoSyncResult, setEvoSyncResult] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [evoConfig, setEvoConfig] = useState({ provider: "anthropic", model: "claude-sonnet-4-20250514", api_key: "", language: "zh", has_key: false });
  const [evoConfigSaving, setEvoConfigSaving] = useState(false);
  const [evoConfigMsg, setEvoConfigMsg] = useState(null);

  const EVT = { tension: "张力", character_action: "角色行动", transcendence: "超越", knowledge: "知识", research: "研究" };

  const evoApi = useCallback(async (path, opts = {}) => {
    const res = await fetch(`/api/evolution${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", ...opts.headers },
    });
    if (!res.ok) { const t = await res.text(); throw new Error(t); }
    return res.json();
  }, []);

  const fetchWorlds = useCallback(async () => {
    setEvoLoading(true);
    try {
      const all = await evoApi("/worlds");
      setEvoWorlds(all.filter(w => !w.parent_world_id));
    } finally { setEvoLoading(false); }
  }, [evoApi]);

  const createEvoWorld = useCallback(async (tradition) => {
    const world = await evoApi("/worlds", { method: "POST", body: JSON.stringify({ tradition }) });
    setEvoWorlds(prev => prev.find(w => w.id === world.id) ? prev.map(w => w.id === world.id ? world : w) : [...prev, world]);
    setEvoPicker(false);
    return world;
  }, [evoApi]);

  const refreshWorldDetail = useCallback(async (worldId) => {
    const [events, mat] = await Promise.all([
      evoApi(`/worlds/${worldId}/history?limit=30`),
      evoApi(`/worlds/${worldId}/maturity`).catch(() => null),
    ]);
    setEvoHistory(events);
    if (mat) setEvoMaturity(prev => ({ ...prev, [worldId]: mat }));
  }, [evoApi]);

  const generateEvents = useCallback(async (worldId) => {
    setEvoGenerating(worldId);
    setEvoGenResult(null);
    try {
      const result = await evoApi(`/worlds/${worldId}/pulse`, { method: "POST" });
      setEvoGenResult({ worldId, events: result.events ?? [] });
      await fetchWorlds();
      await refreshWorldDetail(worldId);
    } catch(e) {
      setEvoGenResult({ worldId, error: e.message });
    } finally {
      setEvoGenerating(null);
    }
  }, [evoApi, fetchWorlds, refreshWorldDetail]);

  const selectEvoWorld = useCallback(async (worldId) => {
    if (evoSelected === worldId) { setEvoSelected(null); setEvoHistory([]); return; }
    setEvoSelected(worldId);
    await refreshWorldDetail(worldId);
  }, [evoSelected, refreshWorldDetail]);

  const syncMemory = useCallback(async (worldId) => {
    const name = evoSyncCharName.trim();
    if (!name) return;
    setEvoSyncing(true);
    setEvoSyncResult(null);
    try {
      const world = evoWorlds.find(w => w.id === worldId);
      const events = await evoApi(`/worlds/${worldId}/history?limit=20`).catch(() => []);
      const eventsList = events.slice(0, 12)
        .map(e => `[${EVT[e.event_type] ?? e.event_type}] ${(e.narrative || "").slice(0, 200)}`)
        .join("\n\n");
      if (!eventsList) throw new Error("该世界尚无演化事件，请先生成事件");

      const existingPart = evoSyncMemory.trim()
        ? `\n【角色现有记忆文件】\n${evoSyncMemory.trim().slice(0, 2000)}`
        : "\n（角色尚无记忆文件，请生成初始记忆条目）";

      const prompt = `你是灵犀记忆同步器。根据世界近期发生的真实事件，为角色生成新的记忆条目。

【世界】${world?.seed?.tradition_name ?? world?.tradition_key ?? worldId}
【世界核心张力】${world?.seed?.tension ?? ""}

【世界近期事件】
${eventsList}
${existingPart}

【角色名】${name}

生成规则：
1. 角色以第一人称视角"亲历"或"间接感知"这些世界事件，写出角色对这些事件的主观记忆
2. 每个重要事件 1-2 条记忆，每条 40-80 字
3. 保持角色的声音和价值观，与现有记忆风格一致
4. 不重复现有记忆已有内容
5. 只输出新增条目，格式为 Markdown，以 "---" 分隔每条记忆`;

      const res = await fetch("/api/llm/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: evoConfig.model ?? "claude-sonnet-4-20250514",
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const content = data.content?.[0]?.text || "";
      setEvoSyncResult({ worldId, content });
    } catch(e) {
      setEvoSyncResult({ worldId, error: e.message });
    } finally {
      setEvoSyncing(false);
    }
  }, [evoWorlds, evoApi, evoSyncCharName, evoSyncMemory, evoConfig]);

  const fetchConfig = useCallback(async () => {
    try { const cfg = await evoApi("/config"); setEvoConfig(cfg); } catch {}
  }, [evoApi]);

  const saveConfig = useCallback(async (draft) => {
    setEvoConfigSaving(true);
    setEvoConfigMsg(null);
    try {
      await evoApi("/config", { method: "POST", body: JSON.stringify(draft) });
      setEvoConfigMsg("已保存");
      await fetchConfig();
    } catch(e) {
      setEvoConfigMsg("保存失败：" + e.message);
    } finally {
      setEvoConfigSaving(false);
    }
  }, [evoApi, fetchConfig]);

  const removeWorld = useCallback(async (worldId) => {
    await evoApi(`/worlds/${worldId}`, { method: "DELETE" });
    setEvoWorlds(prev => prev.filter(w => w.id !== worldId));
    if (evoSelected === worldId) { setEvoSelected(null); setEvoHistory([]); }
  }, [evoApi, evoSelected]);

  const resetWorld = useCallback(async (worldId) => {
    const updated = await evoApi(`/worlds/${worldId}/reset`, { method: "POST" });
    setEvoWorlds(prev => prev.map(w => w.id === worldId ? updated : w));
    if (evoSelected === worldId) {
      setEvoHistory([]);
      setEvoMaturity(prev => { const n = {...prev}; delete n[worldId]; return n; });
    }
  }, [evoApi, evoSelected]);

  useEffect(() => { fetchWorlds(); fetchConfig(); }, [fetchWorlds, fetchConfig]);

  return (
    <div style={{
      minHeight: "100vh", background: "#060510", color: "#ddd0a8",
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0; }
        .trad-btn:hover { opacity: 1 !important; transform: translateY(-1px) !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #2a2518; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 22, letterSpacing: 6, fontWeight: 300, color: "#c9a84c", margin: "0 0 8px" }}>
          世界演化
        </h1>
        <div style={{ fontSize: 11, color: "#7a6a8a", letterSpacing: 4 }}>
          World Evolution Engine
        </div>

        {/* Settings toggle */}
        <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => { setShowSettings(v => !v); setEvoPicker(false); }}
            style={{
              background: showSettings ? "#14111e" : "none",
              border: `1px solid ${showSettings ? "#3a2a5a" : "#1a1628"}`,
              color: showSettings ? "#8a7aaa" : "#6a5a7a",
              padding: "5px 20px", fontSize: 9, letterSpacing: 2,
              cursor: "pointer", borderRadius: 2, fontFamily: "inherit",
            }}
          >
            ⚙ API 设置
          </button>
        </div>

        {showSettings && (
          <div style={{ marginTop: 16 }}>
            <SettingsPanel
              evoConfig={evoConfig}
              evoConfigSaving={evoConfigSaving}
              evoConfigMsg={evoConfigMsg}
              saveConfig={saveConfig}
            />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="fade-up" style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#7a7060", textTransform: "uppercase" }}>
            活跃世界 · {evoWorlds.length} 个
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={fetchWorlds} style={{
              background: "none", border: "1px solid #1a1628", color: "#7a6a8a",
              padding: "5px 14px", fontSize: 9, letterSpacing: 2, cursor: "pointer",
              borderRadius: 2, fontFamily: "inherit",
            }}>↻ 刷新</button>
            <button onClick={() => setEvoPicker(v => !v)} style={{
              background: "#c9a84c18", border: "1px solid #c9a84c55", color: "#c9a84c",
              padding: "5px 18px", fontSize: 9, letterSpacing: 2, cursor: "pointer",
              borderRadius: 2, fontFamily: "inherit",
            }}>+ 添加世界</button>
          </div>
        </div>

        {/* Tradition picker */}
        {evoPicker && (
          <div style={{ background: "#0c0a18", border: "1px solid #1a1628", borderRadius: 4, padding: "18px 20px", marginBottom: 24 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#7a7060", marginBottom: 14, textTransform: "uppercase" }}>
              选择传统 → 自动加载内置世界种子
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TRADITIONS.map(t => (
                <button key={t.id} onClick={() => createEvoWorld(t.id)} className="trad-btn" style={{
                  background: "none", border: "1px solid #1a1628", color: "#4a4040",
                  padding: "5px 12px", fontSize: 10, cursor: "pointer", borderRadius: 2,
                  fontFamily: "inherit", transition: "all 0.2s",
                }}>
                  {t.glyph} {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {evoLoading && (
          <div style={{ textAlign: "center", color: "#6a6560", fontSize: 10, padding: 32, letterSpacing: 3 }}>
            读取世界数据…
          </div>
        )}
        {!evoLoading && evoWorlds.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#5a5068", fontSize: 11, letterSpacing: 3 }}>
            尚无世界 · 点击「添加世界」开始
          </div>
        )}

        {/* World cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {evoWorlds.map(w => {
            const trad       = TRADITIONS.find(t => t.id === w.tradition_key);
            const cardColor  = trad?.color ?? "#c9a84c";
            const isGen      = evoGenerating === w.id;
            const isSelected = evoSelected === w.id;
            const isSyncing  = evoSyncTarget === w.id;
            const genRes     = evoGenResult?.worldId === w.id ? evoGenResult : null;
            const lastDate   = w.last_pulse_at ? new Date(w.last_pulse_at).toLocaleDateString("zh-CN") : null;

            return (
              <div key={w.id} style={{
                background: "#080614",
                border: `1px solid ${isSelected || isSyncing ? cardColor + "44" : "#14111e"}`,
                borderRadius: 6, overflow: "hidden", transition: "border-color 0.3s",
              }}>

                {/* Card header */}
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{trad?.glyph ?? "◎"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: cardColor, letterSpacing: 1 }}>
                        {trad?.label ?? w.tradition_key}
                      </div>
                      <div style={{ fontSize: 8, color: "#6a6878", marginTop: 2 }}>
                        {w.pulse_count > 0
                          ? `已生成 ${w.pulse_count} 批事件${lastDate ? ` · ${lastDate}` : ""}`
                          : "尚无事件"}
                      </div>
                    </div>
                  </div>

                  {/* Gen result */}
                  {genRes && !genRes.error && genRes.events.length > 0 && (
                    <div style={{
                      background: "#080e08", border: "1px solid #162416",
                      borderRadius: 3, padding: "10px 12px", marginBottom: 12,
                    }}>
                      <div style={{ fontSize: 9, color: "#3a6a3a", letterSpacing: 1, marginBottom: 8 }}>
                        生成了 {genRes.events.length} 个新事件
                      </div>
                      {genRes.events.slice(0, 3).map((e, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "flex-start" }}>
                          <span style={{
                            fontSize: 7, color: cardColor, background: cardColor + "22",
                            padding: "1px 5px", borderRadius: 2, flexShrink: 0, marginTop: 1, whiteSpace: "nowrap",
                          }}>
                            {EVT[e.event_type] ?? e.event_type}
                          </span>
                          <span style={{ fontSize: 9, color: "#8a886a", lineHeight: 1.6 }}>
                            {(e.narrative ?? "").slice(0, 110)}{(e.narrative ?? "").length > 110 ? "…" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {genRes?.error && (
                    <div style={{
                      background: "#0e0808", border: "1px solid #2e1a1a",
                      borderRadius: 3, padding: "8px 12px", marginBottom: 12,
                      fontSize: 9, color: "#7a4a3a",
                    }}>
                      {genRes.error}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => generateEvents(w.id)}
                      disabled={!!evoGenerating}
                      style={{
                        flex: 2,
                        background: isGen ? cardColor + "22" : cardColor + "14",
                        border: `1px solid ${cardColor}44`, color: cardColor,
                        padding: "7px 0", fontSize: 10, letterSpacing: 2,
                        cursor: evoGenerating ? "not-allowed" : "pointer",
                        borderRadius: 2, fontFamily: "inherit",
                        opacity: evoGenerating && !isGen ? 0.25 : 1,
                        transition: "all 0.3s",
                      }}
                    >
                      {isGen ? "生成中…" : "◎ 生成事件"}
                    </button>
                    <button
                      onClick={() => selectEvoWorld(w.id)}
                      style={{
                        flex: 1,
                        background: isSelected ? "#14111e" : "none",
                        border: "1px solid #1a1628",
                        color: isSelected ? "#8a7a9a" : "#6a5a7a",
                        padding: "7px 0", fontSize: 9, letterSpacing: 2,
                        cursor: "pointer", borderRadius: 2, fontFamily: "inherit",
                      }}
                    >
                      {isSelected ? "▲ 收起" : "▼ 事件"}
                    </button>
                    <button
                      onClick={() => {
                        if (evoSyncTarget === w.id) { setEvoSyncTarget(null); setEvoSyncResult(null); }
                        else { setEvoSyncTarget(w.id); setEvoSyncResult(null); }
                      }}
                      style={{
                        flex: 1,
                        background: isSyncing ? cardColor + "22" : "none",
                        border: `1px solid ${isSyncing ? cardColor + "66" : "#1a1628"}`,
                        color: isSyncing ? cardColor : "#6a5a7a",
                        padding: "7px 0", fontSize: 9, letterSpacing: 1,
                        cursor: "pointer", borderRadius: 2, fontFamily: "inherit",
                        transition: "all 0.2s",
                      }}
                    >
                      ⇄ 同步记忆
                    </button>
                    <button
                      onClick={() => { if (window.confirm("归零演化次数并清除所有事件历史？")) resetWorld(w.id); }}
                      style={{
                        flex: 1,
                        background: "none", border: "1px solid #2a1e1e",
                        color: "#6a4040", padding: "7px 0", fontSize: 9,
                        letterSpacing: 1, cursor: "pointer", borderRadius: 2, fontFamily: "inherit",
                      }}
                    >
                      ↺ 归零
                    </button>
                    <button
                      onClick={() => { if (window.confirm("移除此世界种子？此操作不可撤销。")) removeWorld(w.id); }}
                      style={{
                        flex: 1,
                        background: "none", border: "1px solid #2e1a1a",
                        color: "#7a3a3a", padding: "7px 0", fontSize: 9,
                        letterSpacing: 1, cursor: "pointer", borderRadius: 2, fontFamily: "inherit",
                      }}
                    >
                      ✕ 移除
                    </button>
                  </div>
                </div>

                {/* Event history */}
                {isSelected && (
                  <div style={{ borderTop: "1px solid #14111e", padding: "14px 20px 18px", maxHeight: 340, overflowY: "auto" }}>
                    {evoHistory.length === 0 ? (
                      <div style={{ fontSize: 9, color: "#5a5068", textAlign: "center", padding: "12px 0", letterSpacing: 2 }}>
                        尚无事件 · 点击「生成事件」让世界开始
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {evoHistory.map(e => (
                          <div key={e.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <span style={{
                              fontSize: 7, color: cardColor, background: cardColor + "18",
                              padding: "2px 6px", borderRadius: 2, flexShrink: 0, marginTop: 2,
                              letterSpacing: 0.5, whiteSpace: "nowrap",
                            }}>
                              {EVT[e.event_type] ?? e.event_type}
                            </span>
                            <div style={{ fontSize: 10, color: "#8a8878", lineHeight: 1.75 }}>
                              {(e.narrative ?? "").slice(0, 220)}
                              {(e.narrative ?? "").length > 220 ? "…" : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Memory sync panel */}
                {isSyncing && (
                  <div style={{ borderTop: "1px solid #14111e", padding: "18px 20px 20px" }}>
                    <div style={{ fontSize: 9, letterSpacing: 3, color: "#7a7060", marginBottom: 14, textTransform: "uppercase" }}>
                      同步世界事件到角色记忆
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: "#3a3020", letterSpacing: 1, marginBottom: 5 }}>角色名称</div>
                      <input
                        value={evoSyncCharName}
                        onChange={e => setEvoSyncCharName(e.target.value)}
                        placeholder="输入角色名，如：哪吒、爱德华·艾尔利克…"
                        style={{
                          width: "100%", boxSizing: "border-box",
                          background: "#060510", border: "1px solid #1a1628",
                          color: "#ddd0a8", padding: "9px 12px",
                          fontSize: 12, fontFamily: "inherit", borderRadius: 2, outline: "none",
                        }}
                        onFocus={e => e.target.style.borderColor = cardColor + "66"}
                        onBlur={e => e.target.style.borderColor = "#1a1628"}
                      />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 9, color: "#3a3020", letterSpacing: 1, marginBottom: 5 }}>
                        现有 memory.md（可选）
                      </div>
                      <textarea
                        value={evoSyncMemory}
                        onChange={e => setEvoSyncMemory(e.target.value)}
                        placeholder="粘贴角色现有的 memory.md 内容，或留空生成初始记忆…"
                        rows={4}
                        style={{
                          width: "100%", boxSizing: "border-box",
                          background: "#060510", border: "1px solid #1a1628",
                          color: "#ddd0a8", padding: "9px 12px",
                          fontSize: 11, fontFamily: "inherit", borderRadius: 2,
                          outline: "none", resize: "vertical",
                        }}
                        onFocus={e => e.target.style.borderColor = cardColor + "66"}
                        onBlur={e => e.target.style.borderColor = "#1a1628"}
                      />
                    </div>
                    <button
                      onClick={() => syncMemory(w.id)}
                      disabled={evoSyncing || !evoSyncCharName.trim()}
                      style={{
                        background: evoSyncCharName.trim() ? cardColor + "22" : "none",
                        border: `1px solid ${evoSyncCharName.trim() ? cardColor + "55" : "#1a1628"}`,
                        color: evoSyncCharName.trim() ? cardColor : "#2e2640",
                        padding: "8px 24px", fontSize: 10, letterSpacing: 2,
                        cursor: evoSyncing || !evoSyncCharName.trim() ? "not-allowed" : "pointer",
                        borderRadius: 2, fontFamily: "inherit", transition: "all 0.3s",
                      }}
                    >
                      {evoSyncing ? "生成中…" : "生成同步内容"}
                    </button>
                    {evoSyncResult?.worldId === w.id && evoSyncResult.content && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 9, color: cardColor, letterSpacing: 2 }}>新增记忆条目</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(evoSyncResult.content)}
                            style={{
                              background: "none", border: `1px solid ${cardColor}44`, color: cardColor,
                              padding: "3px 12px", fontSize: 8, letterSpacing: 1,
                              cursor: "pointer", borderRadius: 2, fontFamily: "inherit",
                            }}
                          >复制</button>
                        </div>
                        <div style={{
                          background: "#060510", border: "1px solid #1a1628",
                          borderRadius: 3, padding: "12px 14px",
                          fontSize: 11, color: "#8a7a58", lineHeight: 1.8,
                          maxHeight: 280, overflowY: "auto",
                          whiteSpace: "pre-wrap", fontFamily: "inherit",
                        }}>
                          {evoSyncResult.content}
                        </div>
                      </div>
                    )}
                    {evoSyncResult?.worldId === w.id && evoSyncResult.error && (
                      <div style={{ marginTop: 10, fontSize: 9, color: "#7a4a3a" }}>
                        {evoSyncResult.error}
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
