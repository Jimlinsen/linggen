/**
 * @nutshell/core — Generator Pipeline
 *
 * The generation pipeline: world seed → genealogy → soul → environ → network.
 * LLM client, mock data, and JSON parsing are in separate modules.
 */

import type {
  WorldSeed,
  WorldSeedOptions,
  Soul,
  SoulOptions,
  SoulBundle,
  CharacterGenealogy,
  CharacterEnviron,
  CharacterNetwork,
  NutshellConfig,
  SourceNote,
} from "./types.js";
import {
  WORLD_SEED_SYSTEM_PROMPT,
  SOUL_SYSTEM_PROMPT,
  GENEALOGY_PROMPT,
  ENVIRON_PROMPT,
  NETWORK_PROMPT,
} from "./prompts.js";
import { buildSoulMd, buildMemoryMd, buildSkillMd, buildEnvironMd, buildNetworkMd, buildAgentPromptMd, buildSkillOsMd, buildInstallSh, buildReadmeMd } from "./templates.js";
import {
  researchTradition,
  researchCharacter,
  formatResearchForPrompt,
  type ResearchBundle,
  type WikiArticle,
} from "./research.js";
import { callLLM } from "./llm.js";
import { parseJSON } from "./parse.js";
import {
  validateWorldSeed,
  validateGenealogy,
  validateSoul,
  validateCharacterEnviron,
  validateCharacterNetwork,
} from "./schemas.js";

// ─── SOURCE TRACEABILITY + QUALITY EVALUATION ────────────────────────────────

function toSourceNote(article: WikiArticle, role: SourceNote["role"]): SourceNote {
  return {
    role,
    title: article.title,
    url: article.url,
    language: article.language,
    excerpt: article.extract.slice(0, 500),
  };
}

function buildSourceMap(
  researchBundle: ResearchBundle,
  charArticles: WikiArticle[],
): NonNullable<SoulBundle["sources"]> {
  return {
    tradition: researchBundle.tradition
      ? toSourceNote(researchBundle.tradition, "tradition")
      : undefined,
    character: charArticles.map((article) => toSourceNote(article, "character")),
    supplementary: researchBundle.supplementary.map((article) => toSourceNote(article, "supplementary")),
  };
}

function evaluateQuality(bundle: SoulBundle): NonNullable<SoulBundle["quality"]> {
  const { soul, genealogy, environ, network, sources, files } = bundle;
  const supportingLayers = [genealogy, environ, network].filter(Boolean).length;
  const innerLayerCount = [soul.shadow, soul.desire_vs_duty, soul.self_myth, soul.wound].filter(Boolean).length;
  const sourceCount = sources
    ? (sources.tradition ? 1 : 0) + sources.character.length + sources.supplementary.length
    : 0;

  const checks = [
    {
      id: "core_files",
      label: "核心文件齐全",
      passed: Boolean(files.soul_md && files.memory_md && files.skill_md),
      detail: "soul.md / memory.md / skill.md 三个基础文件必须都生成。",
    },
    {
      id: "identity_core",
      label: "身份核心已锚定",
      passed: [soul.world_bond, soul.essence, soul.voice, soul.stance, soul.taboos].every(Boolean),
      detail: "需要具备世界纽带、本质、声线、价值排序和禁区。",
    },
    {
      id: "dialogue_protocol",
      label: "对话协议可执行",
      passed: Boolean(soul.activation && soul.cognitive_style && soul.core_capabilities && soul.failure_modes && soul.catchphrases?.length),
      detail: "需要具备激活条件、认知风格、能力、失真模式和至少一句标志语。",
    },
    {
      id: "memory_baseline",
      label: "记忆基线完整",
      passed: Boolean(soul.formative_events && soul.current_concerns && soul.knowledge_boundary),
      detail: "需要具备形成性事件、当前关切与知识边界。",
    },
    {
      id: "inner_depth",
      label: "内面层不空心",
      passed: innerLayerCount >= 2,
      detail: "shadow / desire_vs_duty / self_myth / wound 至少应有两项。",
    },
    {
      id: "context_layers",
      label: "附加层已展开",
      passed: supportingLayers >= 1,
      detail: "谱系、环境、关系至少应成功生成一层，避免角色悬空。",
    },
    {
      id: "source_traceability",
      label: "证据链已保留",
      passed: sourceCount > 0,
      detail: "至少保留一条传统、角色或补充来源，便于后续审计和补修。",
    },
  ];

  const passedCount = checks.filter((check) => check.passed).length;
  const score = checks.length === 0 ? 1 : passedCount / checks.length;

  return {
    score,
    checks,
    issues: checks.filter((check) => !check.passed).map((check) => check.label),
  };
}

// ─── KNOWN TRADITIONS ─────────────────────────────────────────────────────────

const KNOWN_TRADITIONS: Record<string, string> = {
  greek: "Ancient Greece — Olympic Pantheon, the Homeric world",
  norse: "Norse Mythology — Nine Worlds, the Eddic tradition",
  fengshen: "封神演义 — Investiture of the Gods, Shang Dynasty mythopoeia",
  vedic: "Vedic India — Rigvedic cosmology, the early Upanishadic synthesis",
  egyptian: "Ancient Egypt — Kemetic theology, Ma'at and the Duat",
  mesopotamian: "Mesopotamia — Sumerian-Akkadian synthesis, Gilgamesh cycle",
  celtic: "Celtic Mythology — Irish/Welsh cycles, Otherworld tradition",
  shinto: "Japanese Shinto — Kojiki cosmology, kami tradition",
  taoist: "Chinese Taoist Mythology — the Three Pure Ones, internal alchemy",
  mayan: "Maya Cosmology — Popol Vuh, the Long Count calendar universe",
  tibetan: "Tibetan Vajrayana — Nyingma cosmology, bardo tradition",
  aztec: "Aztec Cosmology — Mexica creation cycles, the Fifth Sun",
  tang: "Tang Dynasty China — the golden age of poetry and Silk Road syncretism",
  victorian: "Victorian England — empire, science, the crisis of faith",
  "tang-dynasty": "Tang Dynasty China — cosmopolitan empire, Daoist-Buddhist synthesis",
};

// ─── WORLD SEED GENERATION ────────────────────────────────────────────────────

export async function generateWorldSeed(
  config: NutshellConfig,
  options: WorldSeedOptions
): Promise<WorldSeed> {
  const tradKey = options.tradition?.toLowerCase() || "";
  const tradDescription =
    KNOWN_TRADITIONS[tradKey] || options.tradition || options.description || "";

  if (!tradDescription) {
    throw new Error(
      "Provide either a tradition name or a description of the world."
    );
  }

  const langNote =
    options.language === "en"
      ? "Respond in English."
      : options.language === "zh"
      ? "用中文回答。"
      : "Match the primary language of the tradition — Chinese traditions in Chinese, Western traditions in English.";

  const userPrompt = `Generate a world seed for: ${tradDescription}

${langNote}

Be grounded in actual scholarship about this tradition. Not popular cultural impressions.${options.researchContext || ""}`;

  const response = await callLLM(config, WORLD_SEED_SYSTEM_PROMPT, userPrompt);
  const raw = parseJSON<WorldSeed>(response.content, "WorldSeed");
  const validation = validateWorldSeed(raw);
  if (!validation.success) {
    console.warn(`[nutshell] WorldSeed validation warnings: ${validation.errors?.join("; ")}`);
  }
  return raw;
}

// ─── GENEALOGY GENERATION ─────────────────────────────────────────────────────

export async function generateGenealogy(
  config: NutshellConfig,
  character: string,
  worldSeed: WorldSeed,
  context?: string,
  researchContext?: string,
): Promise<CharacterGenealogy> {
  const userPrompt = `Character: ${character}
${context ? `Context: ${context}` : ""}

World Seed:
${JSON.stringify(worldSeed, null, 2)}

Trace this character's genealogy.${researchContext || ""}`;

  const response = await callLLM(config, GENEALOGY_PROMPT, userPrompt);
  const raw = parseJSON<CharacterGenealogy>(response.content, "Genealogy");
  const validation = validateGenealogy(raw);
  if (!validation.success) {
    console.warn(`[nutshell] Genealogy validation warnings: ${validation.errors?.join("; ")}`);
  }
  return raw;
}

// ─── SOUL GENERATION ─────────────────────────────────────────────────────────

export async function generateSoul(
  config: NutshellConfig,
  options: SoulOptions,
  genealogy?: CharacterGenealogy
): Promise<Soul> {
  const langNote =
    options.language === "en"
      ? "Respond in English."
      : options.language === "zh"
      ? "用中文回答。"
      : "Match the primary language of the world tradition.";

  const userPrompt = `World Seed:
${JSON.stringify(options.world_seed, null, 2)}

Character: ${options.character}
${options.context ? `Context: ${options.context}` : ""}
${genealogy ? `\nGenealogy research:\n${JSON.stringify(genealogy, null, 2)}` : ""}

${langNote}

Crystallize this character's soul from the world seed. Every trait must trace back.${options.researchContext || ""}`;

  const response = await callLLM(config, SOUL_SYSTEM_PROMPT, userPrompt);
  const raw = parseJSON<Soul>(response.content, "Soul");
  const validation = validateSoul(raw);
  if (!validation.success) {
    console.warn(`[nutshell] Soul validation warnings: ${validation.errors?.join("; ")}`);
  }
  return raw;
}

// ─── ENVIRON GENERATION ───────────────────────────────────────────────────────

export async function generateEnviron(
  config: NutshellConfig,
  soul: Soul,
  worldSeed: WorldSeed,
): Promise<CharacterEnviron> {
  const userPrompt = `Character: ${soul.character_name}
World: ${worldSeed.tradition_name} — ${worldSeed.tagline}

World Seed spatial context:
${JSON.stringify({
  geography_spirit: worldSeed.geography_spirit ?? worldSeed.aesthetic,
  social_fabric: worldSeed.social_fabric ?? worldSeed.ontology,
  power_logic: worldSeed.power_logic ?? worldSeed.divine_human,
  sensory_signature: worldSeed.sensory_signature ?? worldSeed.aesthetic,
}, null, 2)}

Soul layer summary (for inhabitation analysis):
- world_bond: ${soul.world_bond}
- taboos: ${soul.taboos}
- stance: ${soul.stance}
- formative_events: ${soul.formative_events}

Map how this character inhabits their world — spatially, socially, and under what environmental pressures.
用中文回答所有描述字段。`;

  const response = await callLLM(config, ENVIRON_PROMPT, userPrompt);
  const raw = parseJSON<CharacterEnviron>(response.content, "Environ");
  const validation = validateCharacterEnviron(raw);
  if (!validation.success) {
    console.warn(`[nutshell] Environ validation warnings: ${validation.errors?.join("; ")}`);
  }
  return raw;
}

// ─── NETWORK GENERATION ───────────────────────────────────────────────────────

export async function generateNetwork(
  config: NutshellConfig,
  soul: Soul,
  worldSeed: WorldSeed,
): Promise<CharacterNetwork> {
  const userPrompt = `Character: ${soul.character_name}
World: ${worldSeed.tradition_name} — ${worldSeed.tagline}

World Seed (for relational_taboo derivation):
${JSON.stringify({ tension: worldSeed.tension, ontology: worldSeed.ontology, fate: worldSeed.fate }, null, 2)}

Soul summary (for relationship activation layer analysis):
- world_bond: ${soul.world_bond}
- taboos: ${soul.taboos}
- stance: ${soul.stance}
- formative_events: ${soul.formative_events}

Map this character's five defining relationships. Each relationship must name what layer dimension it activates and why.
用中文回答关系描述字段。`;

  const response = await callLLM(config, NETWORK_PROMPT, userPrompt);
  const raw = parseJSON<CharacterNetwork>(response.content, "Network");
  const validation = validateCharacterNetwork(raw);
  if (!validation.success) {
    console.warn(`[nutshell] Network validation warnings: ${validation.errors?.join("; ")}`);
  }
  return raw;
}

// ─── FULL PIPELINE ────────────────────────────────────────────────────────────

export interface GenerateOptions {
  world?: WorldSeedOptions;
  worldSeed?: WorldSeed; // Skip world generation if provided
  character: string;
  context?: string;
  skipGenealogy?: boolean;
  skipResearch?: boolean;  // Disable Wikipedia research (default: research enabled)
  skipEnviron?: boolean;   // Disable environ generation (default: enabled when API key present)
  skipNetwork?: boolean;   // Disable network generation (default: enabled when API key present)
  language?: "zh" | "en";
}

/**
 * Full pipeline: research → world seed → genealogy → soul → three files
 */
export async function generate(
  config: NutshellConfig,
  options: GenerateOptions,
  onProgress?: (stage: string) => void
): Promise<SoulBundle> {
  const report = onProgress || (() => {});
  const doResearch = !options.skipResearch && config.provider !== "mock";

  // Stage 0: Wikipedia Research
  let researchBundle: ResearchBundle = { supplementary: [] };
  let charArticles: WikiArticle[] = [];
  const traditionKey = options.world?.tradition || options.worldSeed?.tradition_name || "";

  if (doResearch) {
    report("research:fetching");
    try {
      [researchBundle, charArticles] = await Promise.all([
        researchTradition(traditionKey, options.language),
        researchCharacter(options.character, traditionKey, options.language),
      ]);
      report("research:done");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      report(`research:error: ${msg}`);
    }
  }

  const researchContext = doResearch
    ? formatResearchForPrompt(researchBundle, charArticles)
    : "";

  // Stage 1: World Seed
  let worldSeed: WorldSeed;
  if (options.worldSeed) {
    worldSeed = options.worldSeed;
    report("world_seed:loaded");
  } else {
    report("world_seed:generating");
    worldSeed = await generateWorldSeed(config, {
      ...options.world,
      language: options.language,
      researchContext,
    });
    report("world_seed:done");
  }

  // Stage 2: Genealogy (optional but recommended)
  let genealogy: CharacterGenealogy | undefined;
  if (!options.skipGenealogy) {
    report("genealogy:generating");
    try {
      genealogy = await generateGenealogy(
        config,
        options.character,
        worldSeed,
        options.context,
        researchContext,
      );
      report("genealogy:done");
    } catch (e) {
      // Genealogy is optional — log and continue
      report("genealogy:skipped");
    }
  }

  // Stage 3: Soul
  report("soul:generating");
  const soul = await generateSoul(
    config,
    {
      character: options.character,
      context: options.context,
      world_seed: worldSeed,
      language: options.language,
      researchContext,
    },
    genealogy
  );
  report("soul:done");

  // Stage 4: Environ + Network — parallel (both depend on soul, independent of each other)
  const doEnviron = !options.skipEnviron && config.provider !== "mock";
  const doNetwork = !options.skipNetwork && config.provider !== "mock";

  let environ: CharacterEnviron | undefined;
  let network: CharacterNetwork | undefined;

  if (doEnviron || doNetwork) {
    const tasks: Promise<void>[] = [];
    if (doEnviron) {
      tasks.push(
        (async () => {
          report("environ:generating");
          try { environ = await generateEnviron(config, soul, worldSeed); report("environ:done"); }
          catch { report("environ:skipped"); }
        })()
      );
    }
    if (doNetwork) {
      tasks.push(
        (async () => {
          report("network:generating");
          try { network = await generateNetwork(config, soul, worldSeed); report("network:done"); }
          catch { report("network:skipped"); }
        })()
      );
    }
    await Promise.all(tasks);
  }

  // Stage 5: Build files
  report("files:building");

  const charSlug = soul.character_name
    .toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fff-]/g, "") || "character";

  const files: SoulBundle["files"] = {
    // Documentation files
    soul_md: buildSoulMd(soul, worldSeed),
    memory_md: buildMemoryMd(soul, worldSeed),
    skill_md: buildSkillMd(soul, worldSeed),
    ...(environ ? { environ_md: buildEnvironMd(environ) } : {}),
    ...(network ? { network_md: buildNetworkMd(network) } : {}),
  };

  // Build the deployable bundle first (needs files populated)
  const bundle: SoulBundle = {
    world_seed: worldSeed,
    genealogy,
    soul,
    environ,
    network,
    files,
    meta: {
      generated_at: new Date().toISOString(),
      model: config.model,
      version: "0.5.0",
    },
  };

  // Stage 6: Agent-deployable files (depend on complete bundle)
  report("agent:building");
  bundle.files.agent_prompt_md = buildAgentPromptMd(bundle);
  bundle.files.skill_os_md = buildSkillOsMd(bundle, charSlug);
  bundle.files.install_sh = buildInstallSh(soul.character_name, charSlug, worldSeed.tradition_name);
  bundle.files.readme_md = buildReadmeMd(bundle, charSlug);

  // Stage 7: Source traceability + quality scoring (opt-in attachments)
  report("quality:evaluating");
  bundle.sources = buildSourceMap(researchBundle, charArticles);
  bundle.quality = evaluateQuality(bundle);

  return bundle;
}
