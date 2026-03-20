/**
 * @nutshell/core — Packager
 *
 * Assembles a SoulBundle into a .tar.gz archive
 * ready for one-click OpenClaw installation.
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import * as tar from "tar";
import type { SoulBundle } from "./types.js";
import { buildAgentPromptMd, buildSkillOsMd, buildInstallSh, buildReadmeMd } from "./templates.js";

const slugify = (s: string) =>
  s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fff-]/g, "") || "character";

/**
 * Pack a SoulBundle into a .tar.gz file for OpenClaw one-click install.
 *
 * @param bundle Complete character bundle
 * @param outputPath Path for the output .tar.gz (e.g. ~/Desktop/渚薰.tar.gz)
 * @returns Absolute path to the created archive
 */
export async function packTarGz(
  bundle: SoulBundle,
  outputPath: string,
): Promise<string> {
  const { soul, world_seed, files } = bundle;
  const name = slugify(soul.character_name);
  const absOutput = path.resolve(outputPath.replace("~", os.homedir()));

  // Create staging directory
  const staging = await fs.mkdtemp(path.join(os.tmpdir(), "nutshell-pack-"));
  const skillDir = path.join(staging, "skills", name);
  const refDir = path.join(skillDir, "references");
  const scriptDir = path.join(skillDir, "scripts");
  const memDir = path.join(staging, "memory");

  await fs.mkdir(refDir, { recursive: true });
  await fs.mkdir(scriptDir, { recursive: true });
  await fs.mkdir(memDir, { recursive: true });

  // Use pre-built content from bundle.files if available, otherwise generate
  const agentMd = files.agent_prompt_md || buildAgentPromptMd(bundle);
  const skillOsMd = files.skill_os_md || buildSkillOsMd(bundle, name);
  const installSh = files.install_sh || buildInstallSh(soul.character_name, name, world_seed.tradition_name);
  const readmeMd = files.readme_md || buildReadmeMd(bundle, name);

  // Write all files
  await Promise.all([
    // Root
    fs.writeFile(path.join(staging, "soul.md"), agentMd, "utf-8"),
    fs.writeFile(path.join(staging, "README.md"), readmeMd, "utf-8"),

    // Memory
    fs.writeFile(path.join(memDir, `${name}-init.md`), files.memory_md, "utf-8"),

    // Skill
    fs.writeFile(path.join(skillDir, "SKILL.md"), skillOsMd, "utf-8"),
    fs.writeFile(path.join(scriptDir, "install.sh"), installSh, { mode: 0o755 }),

    // References
    fs.writeFile(path.join(refDir, "world-seed.json"), JSON.stringify(world_seed, null, 2), "utf-8"),
    fs.writeFile(path.join(refDir, "soul-full.md"), files.soul_md, "utf-8"),
    ...(files.environ_md ? [fs.writeFile(path.join(refDir, "environ.md"), files.environ_md, "utf-8")] : []),
    ...(files.network_md ? [fs.writeFile(path.join(refDir, "network.md"), files.network_md, "utf-8")] : []),
  ]);

  // Create tar.gz
  await fs.mkdir(path.dirname(absOutput), { recursive: true });

  await tar.create(
    {
      gzip: true,
      file: absOutput,
      cwd: staging,
      portable: true,
    },
    ["."],
  );

  // Cleanup staging
  await fs.rm(staging, { recursive: true, force: true });

  return absOutput;
}
