import { spawn } from "child_process";

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
      else reject(new Error(err.trim() || `claude exited with code ${code}`));
    });
  });
}

const WORLD_PROMPT = `你是世界种子生成器，精通神话学（坎贝尔、埃利亚德）、比较宗教学（缪勒、奥托）、民俗文学（普罗普）。

"世界种子"是世界的意识形态基底——让这个世界成为它自己的规定性，不是世界设定，是感知框架。

输出严格JSON（只输出JSON，无其他内容，所有字段中文，每字段80-150字）：
{
  "tradition_name": "传统名称",
  "tagline": "一句诗意的世界精髓（15字内）",
  "cosmogony": "创世论",
  "ontology": "存在层级",
  "time": "时间观",
  "fate": "命运与意志",
  "divine_human": "人神关系",
  "death": "死亡与彼岸",
  "tension": "核心张力",
  "aesthetic": "美学DNA",
  "symbols": "关键符号（5个）",
  "seed_essence": "种子精髓（200字）"
}`;

const SOUL_PROMPT_PREFIX = `你是灵犀涵化炉，精通神话学、唯识学、角色溯源。

核心原则：角色是世界种子通过特定存在的涌现。角色的每一个特质都必须能追溯到世界种子的某个维度。

输出严格JSON（只输出JSON，所有字段中文）：
{
  "character_name": "角色名",
  "world_bond": "这个角色与世界种子的关系（30字内）",
  "essence": "本质定义（100字）",
  "ideological_root": "意识形态根系（120字）",
  "voice": "声音与说话方式（80字）",
  "catchphrases": ["标志性台词1","台词2","台词3","台词4","台词5"],
  "stance": "核心立场（100字）",
  "taboos": "绝对禁止（80字）",
  "world_model": "世界模型（100字）",
  "formative_events": "塑造事件（100字）",
  "current_concerns": "当前关切（80字）",
  "knowledge_boundary": "知识边界（60字）",
  "activation": "激活条件（80字）",
  "cognitive_style": "认知风格（80字）",
  "core_capabilities": "核心能力（100字）",
  "failure_modes": "失败模式（60字）"
}`;

function wrapResponse(text) {
  return JSON.stringify({
    id: "claude_cli_" + Math.random().toString(36).slice(2),
    type: "message",
    role: "assistant",
    content: [{ type: "text", text }],
    model: "claude-code-local",
    stop_reason: "end_turn",
    usage: { input_tokens: 0, output_tokens: 0 },
  });
}

export function mockApiMiddleware() {
  return {
    name: "claude-cli-api",
    configureServer(server) {
      server.middlewares.use("/api/anthropic/v1/messages", (req, res) => {
        if (req.method !== "POST") { res.statusCode = 405; res.end(); return; }

        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
          try {
            const parsed = JSON.parse(body);
            const isWorldSeed = parsed.system?.includes("世界种子");
            const userMsg = parsed.messages?.[0]?.content || "";

            let prompt;
            if (isWorldSeed) {
              const query = userMsg.replace("生成世界种子：", "").trim();
              prompt = `${WORLD_PROMPT}\n\n生成世界种子：${query}`;
            } else {
              prompt = `${SOUL_PROMPT_PREFIX}\n\n${userMsg}`;
            }

            console.log(`\n[claude-cli] ${isWorldSeed ? "world" : "soul"}: ${userMsg.slice(0, 60)}...`);
            const text = await callClaude(prompt);
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(wrapResponse(text));
          } catch (e) {
            console.error("[claude-cli] error:", e.message);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: { message: e.message } }));
          }
        });
      });
    },
  };
}
