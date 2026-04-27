import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STUDIO_DIR = path.join(ROOT, "packages/studio/public/seeds");
const SKILL_DIR = path.join(ROOT, "skill/seeds");
const EXPECTED_COUNT = 72;

async function readSeedMap(dir) {
  const entries = await fs.readdir(dir);
  const names = entries.filter((entry) => entry.endsWith(".json")).sort();
  const parsed = new Map();

  for (const name of names) {
    const filePath = path.join(dir, name);
    const raw = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(raw);
    if (!json.tradition_name || !json.seed_essence) {
      throw new Error(`${path.relative(ROOT, filePath)} 缺少 tradition_name 或 seed_essence`);
    }
    parsed.set(name, json);
  }

  return parsed;
}

const [studioSeeds, skillSeeds] = await Promise.all([
  readSeedMap(STUDIO_DIR),
  readSeedMap(SKILL_DIR),
]);

const studioNames = [...studioSeeds.keys()];
const skillNames = [...skillSeeds.keys()];
const onlyStudio = studioNames.filter((name) => !skillSeeds.has(name));
const onlySkill = skillNames.filter((name) => !studioSeeds.has(name));

if (studioNames.length !== EXPECTED_COUNT) {
  throw new Error(`Studio seeds 数量异常：期望 ${EXPECTED_COUNT}，实际 ${studioNames.length}`);
}

if (skillNames.length !== EXPECTED_COUNT) {
  throw new Error(`Skill seeds 数量异常：期望 ${EXPECTED_COUNT}，实际 ${skillNames.length}`);
}

if (onlyStudio.length || onlySkill.length) {
  throw new Error(
    [
      onlyStudio.length ? `仅 Studio 存在：${onlyStudio.join(", ")}` : "",
      onlySkill.length ? `仅 Skill 存在：${onlySkill.join(", ")}` : "",
    ].filter(Boolean).join(" | ")
  );
}

console.log(`[check:seeds] OK ${studioNames.length} world seeds synced between studio and skill`);
