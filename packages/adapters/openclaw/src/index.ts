/**
 * @nutshell/adapter-openclaw
 *
 * One-click install: generates loose files or a single .tar.gz
 */

import * as fs from "fs/promises";
import * as path from "path";
import type { NutshellAdapter, SoulBundle, ExportResult, ExportOptions } from "@nutshell/core";
import { buildAgentPromptMd, buildSkillOsMd, buildInstallSh, packTarGz } from "@nutshell/core";

const slug = (s: string) =>
  s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fff-]/g, "") || "character";

export class OpenClawAdapter implements NutshellAdapter {
  name = "openclaw";
  description = "One-click install a nutshell character into OpenClaw";
  platforms = ["openclaw >= 2026.2.0"];

  async export(bundle: SoulBundle, outputDir: string, options?: ExportOptions): Promise<ExportResult> {
    const { soul, files, world_seed } = bundle;
    const name = slug(soul.character_name);

    // tar.gz mode: single archive file
    if (options?.format === "tar.gz") {
      const archivePath = path.join(
        outputDir.replace("~", process.env.HOME || "~"),
        `${name}.tar.gz`,
      );
      const result = await packTarGz(bundle, archivePath);
      return {
        files: [{ path: result, description: `${soul.character_name} OpenClaw install package` }],
        archive_path: result,
        install_command: [
          `tar xzf ${name}.tar.gz -C ~/.openclaw/`,
          `cd ~/.openclaw/skills/${name}/scripts && ./install.sh`,
          `openclaw restart`,
        ].join("\n"),
        notes: `${soul.character_name} packaged. Extract and install with the commands above.`,
      };
    }

    // files mode: write directly to OpenClaw directory
    const dir = outputDir.replace("~", process.env.HOME || "~");
    const skillDir = path.join(dir, "skills", name);
    const refDir = path.join(skillDir, "references");
    const scriptDir = path.join(skillDir, "scripts");
    const memDir = path.join(dir, "memory");
    await fs.mkdir(refDir, { recursive: true });
    await fs.mkdir(scriptDir, { recursive: true });
    await fs.mkdir(memDir, { recursive: true });

    const agentMd = files.agent_prompt_md || buildAgentPromptMd(bundle);
    const skillOsMd = files.skill_os_md || buildSkillOsMd(bundle, name);
    const installSh = files.install_sh || buildInstallSh(soul.character_name, name, world_seed.tradition_name);

    const soulPath = path.join(dir, "soul.md");
    const memoryPath = path.join(memDir, `${name}-init.md`);
    const skillPath = path.join(skillDir, "SKILL.md");
    const installPath = path.join(scriptDir, "install.sh");
    const seedPath = path.join(refDir, "world-seed.json");
    const fullSoulPath = path.join(refDir, "soul-full.md");

    await Promise.all([
      fs.writeFile(soulPath, agentMd, "utf-8"),
      fs.writeFile(memoryPath, files.memory_md, "utf-8"),
      fs.writeFile(skillPath, skillOsMd, "utf-8"),
      fs.writeFile(installPath, installSh, { mode: 0o755 }),
      fs.writeFile(seedPath, JSON.stringify(world_seed, null, 2), "utf-8"),
      fs.writeFile(fullSoulPath, files.soul_md, "utf-8"),
      ...(files.environ_md ? [fs.writeFile(path.join(refDir, "environ.md"), files.environ_md, "utf-8")] : []),
      ...(files.network_md ? [fs.writeFile(path.join(refDir, "network.md"), files.network_md, "utf-8")] : []),
    ]);

    return {
      files: [
        { path: soulPath, description: "Agent identity" },
        { path: memoryPath, description: "Initial memory" },
        { path: skillPath, description: "Agent operating system" },
        { path: installPath, description: "Heartbeat cron installer" },
      ],
      install_command: `cd ${scriptDir} && ./install.sh && openclaw restart`,
      notes: `${soul.character_name} installed to OpenClaw.`,
    };
  }
}

export default new OpenClawAdapter();
