import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const coreModule = await import(pathToFileURL(path.join(ROOT, "packages/core/dist/index.js")).href);

const { generate, DEFAULT_CONFIG } = coreModule;

const scenarios = [
  { character: "Athena", tradition: "greek" },
  { character: "哪吒", tradition: "fengshen" },
  { character: "Sherlock Holmes", tradition: "victorian" },
];

const config = {
  ...DEFAULT_CONFIG,
  provider: "mock",
  model: "mock",
  api_key: "mock",
};

for (const scenario of scenarios) {
  const bundle = await generate(config, {
    character: scenario.character,
    world: { tradition: scenario.tradition },
    skipResearch: true,
  });

  // Original 9-field SoulBundle.files contract
  assert.ok(bundle.files.soul_md && bundle.files.soul_md.length > 50, `${scenario.character}: soul_md`);
  assert.ok(bundle.files.memory_md && bundle.files.memory_md.length > 50, `${scenario.character}: memory_md`);
  assert.ok(bundle.files.skill_md && bundle.files.skill_md.length > 50, `${scenario.character}: skill_md`);

  // Identity sanity
  assert.ok(bundle.soul && bundle.soul.character_name, `${scenario.character}: character_name`);
  assert.ok(bundle.world_seed && bundle.world_seed.tradition_name, `${scenario.character}: tradition_name`);

  // Opt-in v0.8.1 additions
  assert.ok(bundle.sources, `${scenario.character}: sources object`);
  assert.ok(Array.isArray(bundle.sources.character), `${scenario.character}: sources.character array`);
  assert.ok(Array.isArray(bundle.sources.supplementary), `${scenario.character}: sources.supplementary array`);

  assert.ok(bundle.quality, `${scenario.character}: quality object`);
  assert.ok(typeof bundle.quality.score === "number", `${scenario.character}: quality.score number`);
  assert.ok(bundle.quality.score >= 0 && bundle.quality.score <= 1, `${scenario.character}: quality.score in [0,1]`);
  assert.ok(Array.isArray(bundle.quality.checks), `${scenario.character}: quality.checks array`);
}

console.log(`[check:regressions] OK ${scenarios.length} representative bundles`);
