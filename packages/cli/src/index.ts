#!/usr/bin/env node
/**
 * @nutshell/cli — Command Line Interface
 *
 * nutshell seed [tradition]     Generate a world seed
 * nutshell soul <character>     Crystallize a character soul
 * nutshell worlds               List all evolved worlds (alias: evolve list)
 * nutshell export <bundle>      Export to a platform adapter
 * nutshell config               Configure API keys and defaults
 * nutshell list                 List available traditions
 *
 * nutshell evolve start         Create / evolve a world
 * nutshell evolve watch         Continuous evolution
 * nutshell evolve pulse         Single pulse
 * nutshell evolve maturity      Show maturity report
 * nutshell evolve history       Show event history
 * nutshell evolve act           Character action
 * nutshell evolve branch        Create parallel branch
 * nutshell evolve search        Search events / knowledge
 * nutshell evolve list          List all worlds
 */

import { program } from "commander";
import ora from "ora";
import chalk from "chalk";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { fileURLToPath } from "url";
import {
  generate,
  generateWorldSeed,
  packTarGz,
  DEFAULT_CONFIG,
  type NutshellConfig,
  type WorldSeed,
  type SoulBundle,
} from "@nutshell/core";
import OpenClawAdapter from "@nutshell/adapter-openclaw";
import SillyTavernAdapter from "@nutshell/adapter-sillytavern";
import OpenAIAdapter from "@nutshell/adapter-openai";

// ─── PATHS ────────────────────────────────────────────────────────────────────

const CLI_DIR = path.dirname(fileURLToPath(import.meta.url));
// packages/cli/dist → packages/studio/public/seeds
const BUILTIN_SEEDS_DIR = path.join(CLI_DIR, "../../studio/public/seeds");

const NUTSHELL_DIR  = path.join(os.homedir(), ".nutshell");
const CONFIG_PATH   = path.join(NUTSHELL_DIR, "config.json");
const SEEDS_DIR     = path.join(NUTSHELL_DIR, "seeds");

// ─── CONFIG ───────────────────────────────────────────────────────────────────

async function loadConfig(): Promise<NutshellConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    // Config file doesn't exist yet or is unreadable — fall back to env vars.
    // This is expected on first run; not an error.
    return {
      ...DEFAULT_CONFIG,
      api_key: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
    };
  }
}

/** Assert that an API key is present when a command requires LLM access. */
function requireApiKey(config: NutshellConfig): void {
  if (!config.api_key) {
    console.error(chalk.red("No API key configured."));
    console.error(chalk.dim("Set ANTHROPIC_API_KEY or run: nutshell config --key <key>"));
    process.exit(1);
  }
}

async function saveConfig(updates: Partial<NutshellConfig>): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  const current = await loadConfig();
  await fs.writeFile(CONFIG_PATH, JSON.stringify({ ...current, ...updates }, null, 2));
}

/** Build EvolutionConfig from nutshell config */
function makeEvoConfig(config: NutshellConfig, overrides: Record<string, any> = {}): any {
  return {
    llm: {
      provider:  config.provider  ?? "anthropic",
      model:     config.model     ?? "claude-sonnet-4-20250514",
      api_key:   config.api_key,
      base_url:  (config as any).base_url,
    },
    language: config.language === "auto" ? "zh" : (config.language ?? "zh"),
    ...overrides,
  };
}

// ─── SEED HELPERS ─────────────────────────────────────────────────────────────

/** Normalize a raw seed object: convert arrays to strings */
function normalizeSeed(raw: any): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw ?? {})) {
    if (Array.isArray(v))       out[k] = v.join("、");
    else if (typeof v === "string") out[k] = v;
    else if (v != null)         out[k] = String(v);
  }
  return out;
}

/** Find a seed by tradition key: user cache → built-in library → generate */
async function findOrGenerateSeed(
  tradition: string,
  config: NutshellConfig,
  spinner: ReturnType<typeof ora>
): Promise<{ seed: Record<string, string>; raw: any; source: string }> {
  // 1. User-saved seed
  const userPath = path.join(SEEDS_DIR, `${tradition}.json`);
  try {
    const raw = JSON.parse(await fs.readFile(userPath, "utf-8"));
    spinner.text = `Loaded seed from cache: ${tradition}`;
    return { seed: normalizeSeed(raw), raw, source: userPath };
  } catch {
    // File not found or unreadable — fall through to built-in library.
  }

  // 2. Built-in seed library (from @nutshell/studio)
  const builtinPath = path.join(BUILTIN_SEEDS_DIR, `${tradition}.json`);
  try {
    const raw = JSON.parse(await fs.readFile(builtinPath, "utf-8"));
    spinner.text = `Loaded built-in seed: ${tradition}`;
    return { seed: normalizeSeed(raw), raw, source: "built-in" };
  } catch {
    // Not found in built-in library either — fall through to LLM generation.
  }

  // 3. Generate via LLM
  spinner.text = `Generating world seed for "${tradition}"…`;
  const raw = await generateWorldSeed(config, { tradition });
  await fs.mkdir(SEEDS_DIR, { recursive: true });
  await fs.writeFile(userPath, JSON.stringify(raw, null, 2), "utf-8");
  return { seed: normalizeSeed(raw), raw, source: "generated" };
}

// ─── ADAPTERS ────────────────────────────────────────────────────────────────

const ADAPTERS: Record<string, any> = {
  openclaw:    OpenClawAdapter,
  sillytavern: SillyTavernAdapter,
  openai:      OpenAIAdapter,
};

// ─── DISPLAY ─────────────────────────────────────────────────────────────────

function printWorldSeed(seed: WorldSeed): void {
  console.log();
  console.log(chalk.yellow("━".repeat(60)));
  console.log(chalk.bold.yellow(`  🌍 ${seed.tradition_name}`));
  console.log(chalk.dim(`  「${seed.tagline}」`));
  console.log(chalk.yellow("━".repeat(60)));
  console.log();
  const dims: [string, string | undefined][] = [
    ["◎ Cosmogony",   seed.cosmogony],
    ["⚡ Core Tension", seed.tension],
    ["✦ Aesthetic",   seed.aesthetic],
    ["◉ Essence",     seed.seed_essence],
  ];
  for (const [label, content] of dims) {
    console.log(chalk.cyan(label));
    console.log(chalk.gray((content || "").slice(0, 180) + ((content?.length || 0) > 180 ? "…" : "")));
    console.log();
  }
}

function printMaturityReport(report: any): void {
  const stageColor = [chalk.red, chalk.yellow, chalk.cyan, chalk.green, chalk.magenta][report.stage] || chalk.white;
  const bar = (n: number) => {
    const filled = Math.round(n * 20);
    return chalk.green("█".repeat(filled)) + chalk.gray("░".repeat(20 - filled)) + ` ${(n * 100).toFixed(0)}%`;
  };
  console.log();
  console.log(chalk.yellow("━".repeat(58)));
  console.log(`  ${chalk.bold("Stage")}   ${stageColor(report.stage_name)}`);
  console.log(`  ${chalk.bold("Overall")} ${bar(report.overall_score)}`);
  console.log(chalk.dim("  ─".repeat(28)));
  console.log(`  ${chalk.dim("Coverage")}     ${bar(report.source_coverage)}`);
  console.log(`  ${chalk.dim("Derivation")}   ${bar(report.derivation_quality)}`);
  console.log(`  ${chalk.dim("Transcendence")} ${bar(report.transcendence_score)}`);
  console.log(`  ${chalk.dim("Emergence")}    ${bar(report.emergence_index)}`);
  if (report.weakest_dims?.length) {
    console.log(chalk.dim("  ─".repeat(28)));
    console.log(`  ${chalk.dim("Weak dims")}   ${chalk.red(report.weakest_dims.join(", "))}`);
  }
  console.log(`  ${chalk.dim("Next")}        ${chalk.green(report.recommendation)}`);
  console.log(chalk.yellow("━".repeat(58)));
  console.log();
}

function printWorldsList(worlds: any[]): void {
  if (!worlds.length) {
    console.log(chalk.dim("\n  No worlds yet."));
    console.log(chalk.dim("  nutshell evolve start --tradition fma\n"));
    return;
  }
  const stageNames = ["萌芽", "理解", "推导", "超越", "涌现"];
  const stageColors = [chalk.gray, chalk.yellow, chalk.cyan, chalk.green, chalk.magenta];
  console.log();
  console.log(chalk.yellow("━".repeat(70)));
  console.log(
    chalk.bold("  ID".padEnd(30)) +
    chalk.bold("Tradition".padEnd(18)) +
    chalk.bold("Stage".padEnd(12)) +
    chalk.bold("Pulses")
  );
  console.log(chalk.dim("  " + "─".repeat(66)));
  for (const w of worlds) {
    const stage = w.stage as 0|1|2|3|4;
    const stageFn = stageColors[stage] ?? chalk.white;
    const lastPulse = w.last_pulse_at
      ? new Date(w.last_pulse_at).toLocaleDateString()
      : chalk.dim("never");
    console.log(
      `  ${chalk.cyan(w.id.padEnd(28))}` +
      `${w.tradition_key.padEnd(18)}` +
      `${stageFn((stageNames[stage] ?? "?").padEnd(12))}` +
      `${w.pulse_count}  ${chalk.dim(lastPulse)}`
    );
  }
  console.log(chalk.yellow("━".repeat(70)));
  console.log();
}

function printExportResult(result: any): void {
  console.log();
  for (const file of result.files) {
    console.log(chalk.cyan("  →"), chalk.white(file.path));
    console.log(chalk.dim(`    ${file.description}`));
  }
  if (result.install_command) {
    console.log();
    console.log(chalk.dim("Run:"), chalk.yellow(result.install_command));
  }
  if (result.notes) {
    console.log();
    console.log(chalk.dim(result.notes));
  }
  console.log();
}

// ─── SHARED EVOLVE ENGINE FACTORY ────────────────────────────────────────────

async function openEngine(config: NutshellConfig, overrides: Record<string, any> = {}): Promise<any> {
  const { EvolutionEngine } = await import("@nutshell/evolution");
  return new EvolutionEngine(makeEvoConfig(config, overrides));
}

// ─── COMMANDS ────────────────────────────────────────────────────────────────

program
  .name("nutshell")
  .description(chalk.yellow("🐚 nutshell") + " — Making virtual beings real")
  .version("0.2.0");

// ── seed ──────────────────────────────────────────────────────────────────────

program
  .command("seed [tradition]")
  .description("Generate a world seed for a tradition")
  .option("-d, --description <text>", "Free-form world description")
  .option("-o, --output <path>", "Save seed to file")
  .option("-l, --language <lang>", "Output language: zh | en", "auto")
  .action(async (tradition, opts) => {
    const config = await loadConfig();
    requireApiKey(config);
    const spinner = ora("Generating world seed…").start();
    try {
      const seed = await generateWorldSeed(config, {
        tradition,
        description: opts.description,
        language: opts.language === "auto" ? undefined : opts.language,
      });
      spinner.succeed(chalk.green("World seed generated"));
      printWorldSeed(seed);
      const outPath = opts.output ?? path.join(
        SEEDS_DIR,
        `${(tradition || "custom").toLowerCase().replace(/\s+/g, "-")}.json`
      );
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, JSON.stringify(seed, null, 2), "utf-8");
      console.log(chalk.dim(`Saved: ${outPath}`));
      console.log(chalk.dim(`Next: nutshell soul "<character>" --seed ${outPath}`));
    } catch (e: any) {
      spinner.fail(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── soul ──────────────────────────────────────────────────────────────────────

program
  .command("soul <character>")
  .description("Crystallize a character soul from a world seed")
  .option("-s, --seed <path>", "Path to world seed JSON")
  .option("-t, --tradition <name>", "Tradition key or description (auto-finds seed)")
  .option("-c, --context <text>", "Additional character context")
  .option("-o, --output <path>", "Output directory", "./")
  .option("-l, --language <lang>", "Output language: zh | en", "auto")
  .option("--skip-genealogy", "Skip genealogy research step")
  .option("--no-research", "Skip Wikipedia research (faster)")
  .option("--no-evolve", "Skip registering world in evolution engine")
  .action(async (character, opts) => {
    const config = await loadConfig();
    requireApiKey(config);

    let worldSeed: WorldSeed | undefined;
    if (opts.seed) {
      try {
        worldSeed = normalizeSeed(JSON.parse(await fs.readFile(opts.seed, "utf-8"))) as any;
      } catch (e: any) {
        console.error(chalk.red(`Failed to read seed file "${opts.seed}": ${e.message}`));
        process.exit(1);
      }
    }

    console.log();
    console.log(chalk.bold.yellow(`🐚 Crystallizing: ${character}`));
    if (worldSeed)      console.log(chalk.dim(`   World: ${(worldSeed as any).tradition_name ?? opts.seed}`));
    if (opts.tradition) console.log(chalk.dim(`   Tradition: ${opts.tradition}`));
    console.log();

    const STAGE_LABELS: Record<string, string> = {
      "research:fetching":     "Fetching Wikipedia sources…",
      "research:done":         "Sources fetched",
      "research:skipped":      "Research skipped",
      "world_seed:generating": "Generating world seed…",
      "world_seed:done":       "World seed complete",
      "world_seed:loaded":     "World seed loaded",
      "genealogy:generating":  "Researching genealogy…",
      "genealogy:done":        "Genealogy traced",
      "genealogy:skipped":     "Genealogy skipped",
      "soul:generating":       "Crystallizing soul…",
      "soul:done":             "Soul crystallized",
      "files:building":        "Building output files…",
    };

    let spinner = ora();
    const onProgress = (stage: string) => {
      if (stage.endsWith(":generating") || stage.endsWith(":building") || stage.endsWith(":fetching")) {
        spinner = ora(STAGE_LABELS[stage] ?? stage).start();
      } else if (stage.endsWith(":done") || stage.endsWith(":loaded")) {
        spinner.succeed(chalk.green(STAGE_LABELS[stage] ?? stage));
      } else if (stage.endsWith(":skipped")) {
        spinner.warn(chalk.dim(STAGE_LABELS[stage] ?? stage));
      }
    };

    try {
      const bundle = await generate(config, {
        world:          opts.tradition ? { tradition: opts.tradition } : undefined,
        worldSeed,
        character,
        context:        opts.context,
        skipGenealogy:  opts.skipGenealogy,
        skipResearch:   opts.research === false,
        language:       opts.language === "auto" ? undefined : opts.language,
      }, onProgress);

      const s = bundle.soul;
      const w = bundle.world_seed;
      const trunc = (str: string | undefined, n: number) =>
        str ? (str.length > n ? str.slice(0, n) + "…" : str) : "—";

      console.log();
      console.log(chalk.yellow("─".repeat(58)));
      console.log(chalk.bold.yellow(`  ✦ ${s.character_name}`));
      console.log(chalk.dim(`  ${trunc(s.world_bond, 72)}`));
      console.log(chalk.yellow("─".repeat(58)));
      console.log();
      console.log(chalk.bold.cyan("  界的厚度诊断"));
      console.log(chalk.dim("  ┄".repeat(28)));
      console.log(`  ${chalk.cyan("层⁶ 神话底座")}  ${chalk.white(trunc(w.tradition_name + " — " + w.tagline, 44))}`);
      console.log(`  ${chalk.cyan("层⁵ 历史节律")}  ${chalk.white(trunc(s.ideological_root, 44))}`);
      const tabooCount = (s.taboos?.match(/\d+\./g) ?? []).length || 3;
      console.log(`  ${chalk.cyan("层⁴ 本体承诺")}  ${chalk.white(`${tabooCount} 条禁区已锚定`)}`);
      console.log(`  ${chalk.cyan("层³ 价值序列")}  ${chalk.white(trunc(s.stance, 44))}`);
      console.log(`  ${chalk.cyan("层² 认知风格")}  ${chalk.white(trunc(s.cognitive_style, 44))}`);
      console.log(`  ${chalk.cyan("层¹ 声线")}      ${chalk.white(trunc(s.voice, 44))}`);
      console.log(chalk.dim("  ┄".repeat(28)));
      console.log();

      // Write output files
      const outDir = opts.output;
      await fs.mkdir(outDir, { recursive: true });
      const slug = character
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\u4e00-\u9fff-]/g, "") || "character";

      await fs.writeFile(path.join(outDir, `soul-${slug}.md`),     bundle.files.soul_md,   "utf-8");
      await fs.writeFile(path.join(outDir, `memory-${slug}.md`),   bundle.files.memory_md, "utf-8");
      await fs.writeFile(path.join(outDir, `skill-${slug}.md`),    bundle.files.skill_md,  "utf-8");
      if (bundle.files.environ_md) {
        await fs.writeFile(path.join(outDir, `environ-${slug}.md`), bundle.files.environ_md, "utf-8");
      }
      if (bundle.files.network_md) {
        await fs.writeFile(path.join(outDir, `network-${slug}.md`), bundle.files.network_md, "utf-8");
      }
      await fs.writeFile(path.join(outDir, `bundle-${slug}.json`), JSON.stringify(bundle, null, 2), "utf-8");

      console.log(chalk.green("✓ Files written:"));
      ["soul", "memory", "skill"].forEach(f =>
        console.log(chalk.dim(`  ${f}-${slug}.md`))
      );
      if (bundle.files.environ_md) {
        console.log(chalk.dim(`  environ-${slug}.md`));
      }
      if (bundle.files.network_md) {
        console.log(chalk.dim(`  network-${slug}.md`));
      }
      console.log(chalk.dim(`  bundle-${slug}.json`));

      // Auto-register world in evolution engine
      if (opts.evolve !== false) {
        const engine = await openEngine(config);
        try {
          const tradition = (w as any).tradition_key ?? w.tradition_name ?? opts.tradition ?? "unknown";
          const existing = engine.listWorlds().find((ww: any) => ww.tradition_key === tradition);
          if (!existing) {
            const world = engine.createWorld(tradition, normalizeSeed(w));
            console.log(chalk.dim(`  World registered in evolution: ${world.id}`));
          } else {
            console.log(chalk.dim(`  World already tracked: ${existing.id}`));
          }
        } catch {
          // Non-fatal — evolution registration is optional; main soul files are already written.
        } finally {
          engine.close();
        }
      }

      console.log();
      console.log(chalk.dim(`Next: nutshell export bundle-${slug}.json --adapter openclaw`));
    } catch (e: any) {
      spinner.fail(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── export ────────────────────────────────────────────────────────────────────

program
  .command("export <bundle>")
  .description("Export a character bundle to a platform adapter")
  .option("-a, --adapter <name>", "Adapter: openclaw | sillytavern | openai", "openclaw")
  .option("-f, --format <type>", "Output format: files | tar.gz", "files")
  .option("-o, --output <path>", "Output directory")
  .action(async (bundleName, opts) => {
    const adapter = ADAPTERS[opts.adapter];
    if (!adapter) {
      console.error(chalk.red(`Unknown adapter: ${opts.adapter}`));
      console.error(chalk.dim(`Available: ${Object.keys(ADAPTERS).join(", ")}`));
      process.exit(1);
    }
    const config = await loadConfig();

    let bundlePath = bundleName;
    if (!bundlePath.endsWith(".json")) bundlePath = `bundle-${bundleName}.json`;

    let bundle: SoulBundle;
    try {
      bundle = JSON.parse(await fs.readFile(bundlePath, "utf-8"));
    } catch (e: any) {
      console.error(chalk.red(`Bundle not found or invalid JSON: ${bundlePath}`));
      console.error(chalk.dim(e.message));
      console.error(chalk.dim("Run 'nutshell soul <character>' first."));
      process.exit(1);
    }

    const outputDir = opts.output ?? config.output_dir ?? "./";
    const spinner = ora(`Exporting to ${opts.adapter}…`).start();
    try {
      const result = await adapter.export(bundle, outputDir, { format: opts.format });
      spinner.succeed(chalk.green(`Exported to ${opts.adapter}`));
      printExportResult(result);
    } catch (e: any) {
      spinner.fail(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── pack ──────────────────────────────────────────────────────────────────────

program
  .command("pack <character>")
  .description("Generate a character and pack as .tar.gz for one-click OpenClaw install")
  .option("-t, --tradition <key>", "Tradition (e.g. greek, eva, fengshen)")
  .option("-s, --seed <path>", "Use existing world seed JSON")
  .option("-c, --context <text>", "Character context/description")
  .option("-l, --language <lang>", "Language: zh | en", "zh")
  .option("-o, --output <dir>", "Output directory", os.homedir() + "/Desktop")
  .action(async (character, opts) => {
    const config = await loadConfig();
    requireApiKey(config);

    const spinner = ora(`Generating ${character}…`).start();
    try {
      // Load or generate world seed
      let worldSeed: WorldSeed | undefined;
      if (opts.seed) {
        try {
          worldSeed = normalizeSeed(JSON.parse(await fs.readFile(path.resolve(opts.seed), "utf-8"))) as any;
        } catch (e: any) {
          spinner.fail(chalk.red(`Invalid seed JSON: ${opts.seed}: ${e.message}`));
          process.exit(1);
        }
      }

      // Full pipeline
      const bundle = await generate(config, {
        character,
        worldSeed,
        world: opts.seed ? undefined : { tradition: opts.tradition },
        context: opts.context,
        language: opts.language,
      }, (stage: string) => {
        spinner.text = chalk.dim(stage);
      });

      spinner.text = "Packing tar.gz…";
      const slug = character.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fff-]/g, "") || "character";
      const outputPath = path.join(opts.output, `${slug}.tar.gz`);
      const archivePath = await packTarGz(bundle, outputPath);

      spinner.succeed(chalk.green(`${character} packed!`));
      console.log();
      console.log(chalk.dim("  File:"), chalk.white(archivePath));
      console.log();
      console.log(chalk.dim("  Install:"));
      console.log(chalk.cyan(`    tar xzf ${slug}.tar.gz -C ~/.openclaw/`));
      console.log(chalk.cyan(`    cd ~/.openclaw/skills/${slug}/scripts && ./install.sh`));
      console.log(chalk.cyan(`    openclaw restart`));
    } catch (e: any) {
      spinner.fail(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── config ────────────────────────────────────────────────────────────────────

program
  .command("config")
  .description("Configure nutshell settings")
  .option("-k, --key <api_key>", "Set API key")
  .option("-p, --provider <name>", "Provider: anthropic | openai | ollama")
  .option("-m, --model <model>", "Model name")
  .option("-a, --adapter <name>", "Default adapter")
  .option("-l, --language <lang>", "Default language: zh | en | auto")
  .option("--show", "Show current config")
  .action(async (opts) => {
    if (opts.show) {
      const config = await loadConfig();
      console.log(JSON.stringify({
        ...config,
        api_key: config.api_key ? "***" + config.api_key.slice(-4) : "(not set)",
      }, null, 2));
      return;
    }
    const updates: Partial<NutshellConfig> = {};
    if (opts.key)      updates.api_key        = opts.key;
    if (opts.provider) updates.provider        = opts.provider;
    if (opts.model)    updates.model           = opts.model;
    if (opts.adapter)  updates.default_adapter = opts.adapter;
    if (opts.language) updates.language        = opts.language;
    if (Object.keys(updates).length === 0) { program.help(); return; }
    await saveConfig(updates);
    console.log(chalk.green("✓ Saved to"), chalk.dim(CONFIG_PATH));
  });

// ── studio ────────────────────────────────────────────────────────────────────

program
  .command("studio")
  .description("Open the Nutshell Universe web studio")
  .option("-p, --port <port>", "Port", "3000")
  .action(async (opts) => {
    console.log(chalk.yellow(`\n🐚 Nutshell Universe → http://localhost:${opts.port}\n`));
    try {
      const { startStudio } = await import("@nutshell/studio" as any);
      await startStudio({ port: parseInt(opts.port) });
    } catch {
      console.log(chalk.dim("Studio not installed. Run: npm install @nutshell/studio"));
    }
  });

// ── list ──────────────────────────────────────────────────────────────────────

program
  .command("list")
  .description("List all 40 available tradition keys")
  .action(() => {
    const groups: Array<[string, Array<[string, string, string]>]> = [
      ["Mythology", [
        ["greek",        "Ancient Greece",   "Olympic Pantheon · Homer · tragedy"],
        ["norse",        "Norse",            "Nine Worlds · Eddas · Ragnarök"],
        ["fengshen",     "封神演义",            "Shang Dynasty · Investiture of Gods"],
        ["vedic",        "Vedic India",      "Rigveda · dharma · karma"],
        ["egyptian",     "Ancient Egypt",    "Kemetic theology · Ma'at · Duat"],
        ["mesopotamian", "Mesopotamia",      "Sumerian-Akkadian · Gilgamesh"],
        ["celtic",       "Celtic",           "Irish/Welsh cycles · Otherworld"],
        ["shinto",       "Shinto",           "Kojiki · kami · musubi"],
        ["taoist",       "道教",              "Three Pure Ones · internal alchemy"],
        ["mayan",        "Maya",             "Popol Vuh · Long Count · Xibalba"],
        ["tibetan",      "Vajrayana",        "Nyingma · bardo · tantric cosmology"],
        ["aztec",        "Aztec",            "Fifth Sun · sacrifice · tonalpohualli"],
        ["zoroastrian",  "Zoroastrian",      "Ahura Mazda · Asha/Druj · Chinvat Bridge"],
      ]],
      ["East Asian Literature", [
        ["xiyouji",      "西游记",             "Journey to the West · Sun Wukong"],
        ["hongloumeng",  "红楼梦",             "Dream of the Red Chamber"],
        ["wuxia",        "武侠",              "Jianghu · neigong · swordsmen"],
        ["threebody",    "三体",              "Dark Forest · civilizations · sophons"],
      ]],
      ["Western Fiction", [
        ["hp",           "Harry Potter",     "Hogwarts · magic · chosen one"],
        ["lotr",         "Lord of the Rings","Middle-earth · One Ring · Fellowship"],
        ["got",          "Game of Thrones",  "Westeros · power · winter"],
        ["witcher",      "The Witcher",       "Continent · monsters · neutrality"],
        ["dune",         "Dune",             "Arrakis · Spice · Bene Gesserit"],
        ["matrix",       "The Matrix",        "Simulation · red pill · machines"],
        ["foundation",   "Foundation",        "Psychohistory · Hari Seldon · Empire"],
        ["rickmorty",    "Rick and Morty",    "Infinite universes · nihilism · portal"],
        ["starwars",     "Star Wars",         "Force · Jedi/Sith · galaxy"],
      ]],
      ["Anime", [
        ["naruto",       "Naruto",           "Shinobi · chakra · will of fire"],
        ["onepiece",     "One Piece",        "Piracy · Devil Fruits · freedom"],
        ["aot",          "Attack on Titan",  "Titans · memory · freedom"],
        ["fma",          "Fullmetal Alchemist","Equivalent exchange · alchemy"],
        ["eva",          "Neon Genesis Evangelion","Angels · AT field · instrumentality"],
        ["bleach",       "Bleach",           "Soul Society · Zanpakuto · hollows"],
        ["dragonball",   "Dragon Ball",      "Ki · Saiyans · eternal tournament"],
        ["akira",        "AKIRA",            "Neo-Tokyo · psychic power · collapse"],
      ]],
      ["Games", [
        ["darksouls",    "Dark Souls",       "Undead curse · hollowing · bonfires"],
        ["elden",        "Elden Ring",       "Erdtree · Demigods · Elden Ring"],
        ["zelda",        "Zelda",            "Hyrule · Triforce · time cycles"],
        ["genshin",      "Genshin Impact",   "Vision · Gnosis · Teyvat"],
      ]],
      ["Comics / Universes", [
        ["marvel",       "Marvel",           "Superheroes · mutants · Infinity Stones"],
        ["dc",           "DC",               "Multiverse · Justice League · legacy"],
      ]],
    ];
    console.log();
    for (const [group, rows] of groups) {
      console.log(chalk.bold.yellow(`  ${group}`));
      for (const [id, name, desc] of rows) {
        console.log(`  ${chalk.cyan(id.padEnd(16))}${chalk.white(name.padEnd(24))}${chalk.dim(desc)}`);
      }
      console.log();
    }
    console.log(chalk.dim("  Usage examples:"));
    console.log(chalk.dim("    nutshell soul \"爱德华\" --tradition fma"));
    console.log(chalk.dim("    nutshell evolve start --tradition fma"));
    console.log(chalk.dim("    nutshell seed --description \"Zoroastrian × Norse fusion\""));
    console.log();
  });

// ── worlds (top-level alias for evolve list) ──────────────────────────────────

program
  .command("worlds")
  .description("List all evolved worlds (alias for evolve list)")
  .action(async () => {
    const config = await loadConfig();
    const engine = await openEngine(config);
    try {
      const worlds = engine.listWorlds();
      printWorldsList(worlds);
    } catch (e: any) {
      console.error(chalk.red(`Failed to list worlds: ${e.message}`));
      process.exit(1);
    } finally {
      engine.close();
    }
  });

// ─── EVOLVE ───────────────────────────────────────────────────────────────────

const evolve = program.command("evolve").description("World evolution engine");

// ── evolve start ──────────────────────────────────────────────────────────────

evolve
  .command("start")
  .description("Create and/or evolve a world")
  .option("--tradition <key>", "Tradition key (e.g. fma, greek) — auto-finds built-in seed")
  .option("--seed <path>", "Path to world seed JSON file")
  .option("--pulses <n>", "Number of evolution pulses (0 = create only)", "1")
  .action(async (opts) => {
    if (!opts.tradition && !opts.seed) {
      console.error(chalk.red("Provide --tradition <key> or --seed <path>"));
      console.error(chalk.dim("Example: nutshell evolve start --tradition fma"));
      process.exit(1);
    }

    const config = await loadConfig();
    requireApiKey(config);
    const spinner = ora("Loading seed…").start();

    let seed: Record<string, string>;
    let tradition: string;

    try {
      if (opts.seed) {
        let raw: any;
        try {
          raw = JSON.parse(await fs.readFile(path.resolve(opts.seed), "utf-8"));
        } catch (e: any) {
          spinner.fail(chalk.red(`Invalid JSON in ${opts.seed}: ${e.message}`));
          process.exit(1);
        }
        seed = normalizeSeed(raw);
        tradition = opts.tradition ?? (raw as any).tradition_key ?? path.basename(opts.seed, ".json");
        spinner.text = `Loaded seed: ${opts.seed}`;
      } else {
        const found = await findOrGenerateSeed(opts.tradition, config, spinner);
        seed = found.seed;
        tradition = opts.tradition;
      }
    } catch (err: any) {
      spinner.fail(chalk.red(String(err?.message ?? err)));
      process.exit(1);
    }

    const engine = await openEngine(config);
    try {
      // Reuse existing world for this tradition if already tracked
      const existing = engine.listWorlds().find((w: any) => w.tradition_key === tradition);
      let world = existing;
      if (existing) {
        spinner.succeed(`Using existing world: ${existing.id} (${existing.pulse_count} pulses)`);
      } else {
        world = engine.createWorld(tradition, seed);
        spinner.succeed(`World created: ${chalk.cyan(world.id)}`);
      }

      const pulses = parseInt(opts.pulses, 10);
      for (let i = 0; i < pulses; i++) {
        const s = ora(`Pulse ${i + 1}/${pulses}…`).start();
        const result = await engine.evolve(world.id);
        s.succeed(
          `Pulse ${result.pulse_number} — ` +
          chalk.cyan(result.maturity.stage_name) +
          ` (${(result.maturity.overall_score * 100).toFixed(0)}%) — ` +
          `${result.events.length} events — ${result.duration_ms}ms`
        );
        for (const e of result.events) {
          console.log(chalk.dim(`  [${e.event_type}] `) + e.narrative.slice(0, 100) + "…");
        }
      }
    } catch (err: any) {
      spinner.fail(chalk.red(String(err?.message ?? err)));
      process.exit(1);
    } finally {
      engine.close();
    }
  });

// ── evolve watch ──────────────────────────────────────────────────────────────

evolve
  .command("watch")
  .description("Continuously evolve a world")
  .requiredOption("--world <id>", "World ID")
  .option("--interval <ms>", "Pulse interval in ms", "60000")
  .option("--max-pulses <n>", "Maximum pulses (0 = infinite)", "0")
  .action(async (opts) => {
    const config = await loadConfig();
    requireApiKey(config);
    const engine = await openEngine(config, { pulse_interval_ms: parseInt(opts.interval, 10) });
    const maxPulses = parseInt(opts.maxPulses, 10) || Infinity;
    console.log(chalk.cyan(`\nWatching ${opts.world} · interval ${opts.interval}ms · Ctrl+C to stop\n`));
    try {
      await engine.watch(opts.world, {
        maxPulses: isFinite(maxPulses) ? maxPulses : undefined,
        onPulse: (result: any) => {
          const pct = (result.maturity.overall_score * 100).toFixed(0);
          console.log(
            chalk.green(`✓ Pulse ${result.pulse_number}`) +
            ` — ${chalk.cyan(result.maturity.stage_name)} ${pct}%` +
            ` — ${result.events.length} events — ${result.duration_ms}ms`
          );
        },
      });
    } catch (err: any) {
      console.error(chalk.red(`Watch failed: ${String(err?.message ?? err)}`));
      process.exit(1);
    } finally {
      engine.close();
    }
  });

// ── evolve pulse ──────────────────────────────────────────────────────────────

evolve
  .command("pulse")
  .description("Run a single evolution pulse")
  .requiredOption("--world <id>", "World ID")
  .action(async (opts) => {
    const config = await loadConfig();
    requireApiKey(config);
    const spinner = ora("Running pulse…").start();
    const engine = await openEngine(config);
    try {
      const result = await engine.evolve(opts.world);
      spinner.succeed(`Pulse ${result.pulse_number} complete (${result.duration_ms}ms)`);
      printMaturityReport(result.maturity);
      for (const e of result.events) {
        console.log(chalk.cyan(`  [${e.event_type}]`) + " " + e.narrative.slice(0, 140) + "…");
      }
    } catch (err: any) {
      spinner.fail(chalk.red(String(err?.message ?? err)));
      process.exit(1);
    } finally {
      engine.close();
    }
  });

// ── evolve maturity ───────────────────────────────────────────────────────────

evolve
  .command("maturity")
  .description("Show world maturity report")
  .requiredOption("--world <id>", "World ID")
  .option("--refresh", "Force re-score (bypass cache)")
  .action(async (opts) => {
    const config = await loadConfig();
    const engine = await openEngine(config);
    try {
      const report = await engine.getMaturity(opts.world, !!opts.refresh);
      console.log(chalk.bold(`\nMaturity — ${opts.world}`));
      printMaturityReport(report);
    } catch (err: any) {
      console.error(chalk.red(`Failed to get maturity report: ${String(err?.message ?? err)}`));
      process.exit(1);
    } finally {
      engine.close();
    }
  });

// ── evolve history ────────────────────────────────────────────────────────────

evolve
  .command("history")
  .description("Show world event history")
  .requiredOption("--world <id>", "World ID")
  .option("--limit <n>", "Number of events", "20")
  .action(async (opts) => {
    const config = await loadConfig();
    const engine = await openEngine(config);
    try {
      const events = engine.getHistory(opts.world, parseInt(opts.limit, 10));
      console.log(chalk.bold(`\nHistory: ${opts.world} (${events.length} events)`));
      for (const e of events) {
        const ts = new Date(e.timestamp).toLocaleString();
        console.log(chalk.dim(`\n[${ts}] `) + chalk.cyan(`[${e.event_type}]`) + chalk.dim(` by ${e.actor_id}`));
        console.log(e.narrative.slice(0, 240) + (e.narrative.length > 240 ? "…" : ""));
      }
      console.log();
    } catch (err: any) {
      console.error(chalk.red(`Failed to get history: ${String(err?.message ?? err)}`));
      process.exit(1);
    } finally {
      engine.close();
    }
  });

// ── evolve act ────────────────────────────────────────────────────────────────

evolve
  .command("act")
  .description("A character performs an action in the world")
  .requiredOption("--world <id>", "World ID")
  .requiredOption("--character <name>", "Character name")
  .requiredOption("--action <text>", "Action description")
  .option("--context <text>", "Additional context")
  .action(async (opts) => {
    const config = await loadConfig();
    requireApiKey(config);
    const spinner = ora(`${opts.character} acts…`).start();
    const engine = await openEngine(config);
    try {
      const event = await engine.characterAct(opts.world, {
        character_name: opts.character,
        action:         opts.action,
        context:        opts.context,
      });
      spinner.succeed("Event generated");
      console.log(chalk.cyan(`[${event.event_type}]`), event.narrative);
    } catch (err: any) {
      spinner.fail(chalk.red(String(err?.message ?? err)));
      process.exit(1);
    } finally {
      engine.close();
    }
  });

// ── evolve branch ─────────────────────────────────────────────────────────────

evolve
  .command("branch")
  .description("Create a parallel branch world")
  .requiredOption("--world <id>", "World ID")
  .action(async (opts) => {
    const config = await loadConfig();
    const engine = await openEngine(config);
    try {
      const branch = engine.branch(opts.world);
      console.log(chalk.green(`Branch created: ${branch.id}`));
      console.log(chalk.dim(`  Parent: ${opts.world}`));
    } catch (err: any) {
      console.error(chalk.red(`Failed to create branch: ${String(err?.message ?? err)}`));
      process.exit(1);
    } finally {
      engine.close();
    }
  });

// ── evolve search ─────────────────────────────────────────────────────────────

evolve
  .command("search")
  .description("Full-text search across world events and knowledge")
  .requiredOption("--world <id>", "World ID")
  .requiredOption("--query <text>", "Search query")
  .option("--knowledge", "Also search knowledge base")
  .action(async (opts) => {
    const config = await loadConfig();
    const engine = await openEngine(config);
    try {
      const events = engine.searchHistory(opts.world, opts.query);
      console.log(chalk.bold(`\nEvents matching "${opts.query}" (${events.length}):`));
      for (const e of events) {
        console.log(chalk.cyan(`\n[${e.event_type}]`) + " " + e.narrative.slice(0, 200) + "…");
      }
      if (opts.knowledge) {
        const kb = engine.searchKnowledge(opts.world, opts.query);
        console.log(chalk.bold(`\nKnowledge matching "${opts.query}" (${kb.length}):`));
        for (const k of kb) {
          console.log(chalk.dim(`\n[${k.source_type ?? "web"}] ${k.source_url ?? ""}`));
          console.log(k.content?.slice(0, 200) + "…");
        }
      }
      console.log();
    } catch (err: any) {
      console.error(chalk.red(`Search failed: ${String(err?.message ?? err)}`));
      process.exit(1);
    } finally {
      engine.close();
    }
  });

// ── evolve list ───────────────────────────────────────────────────────────────

evolve
  .command("list")
  .description("List all worlds")
  .action(async () => {
    const config = await loadConfig();
    const engine = await openEngine(config);
    try {
      printWorldsList(engine.listWorlds());
    } catch (err: any) {
      console.error(chalk.red(`Failed to list worlds: ${String(err?.message ?? err)}`));
      process.exit(1);
    } finally {
      engine.close();
    }
  });

program.parse();
