/**
 * @nutshell/adapter-openai
 *
 * Exports a SoulBundle as an OpenAI Assistants configuration.
 * Outputs a JSON config you can POST to /v1/assistants,
 * plus knowledge files for file_search.
 */

import * as fs from "fs/promises";
import * as path from "path";
import type { NutshellAdapter, SoulBundle, ExportResult, ExportOptions } from "@nutshell/core";

const slug = (s: string) =>
  s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

export class OpenAIAdapter implements NutshellAdapter {
  name = "openai";
  description = "Export as OpenAI Assistants configuration + knowledge files";
  platforms = ["OpenAI Assistants API v2"];

  async export(bundle: SoulBundle, outputDir: string, _options?: ExportOptions): Promise<ExportResult> {
    const { soul, world_seed, files, meta } = bundle;
    const name = slug(soul.character_name);
    const dir = outputDir.replace("~", process.env.HOME || "~");
    await fs.mkdir(dir, { recursive: true });

    // Build assistant config
    const assistantConfig = {
      name: soul.character_name,
      description: `${soul.world_bond} | World: ${world_seed.tradition_name}`,
      instructions: files.soul_md,
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
      metadata: {
        nutshell_version: meta.version,
        world_seed: world_seed.tradition_name,
        world_bond: soul.world_bond,
        generated_at: meta.generated_at,
      },
    };

    const configPath = path.join(dir, `assistant-${name}.json`);
    await fs.writeFile(
      configPath,
      JSON.stringify(assistantConfig, null, 2),
      "utf-8"
    );

    // Knowledge files for file_search
    const memoryPath = path.join(dir, `${name}-memory.md`);
    const skillPath = path.join(dir, `${name}-skill.md`);
    await fs.writeFile(memoryPath, files.memory_md, "utf-8");
    await fs.writeFile(skillPath, files.skill_md, "utf-8");

    const installScript = `#!/bin/bash
# Create assistant
ASSISTANT_ID=$(curl -s https://api.openai.com/v1/assistants \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d @assistant-${name}.json | jq -r '.id')

echo "Created assistant: $ASSISTANT_ID"

# Upload knowledge files
for f in ${name}-memory.md ${name}-skill.md; do
  curl -s https://api.openai.com/v1/files \\
    -H "Authorization: Bearer $OPENAI_API_KEY" \\
    -F purpose=assistants \\
    -F file=@$f
done
`;
    const scriptPath = path.join(dir, `install-${name}.sh`);
    await fs.writeFile(scriptPath, installScript, "utf-8");
    await fs.chmod(scriptPath, 0o755);

    return {
      files: [
        { path: configPath, description: "OpenAI Assistant configuration JSON" },
        { path: memoryPath, description: "Memory file for file_search" },
        { path: skillPath, description: "Skill file for file_search" },
        { path: scriptPath, description: "Install script" },
      ],
      install_command: `bash ${scriptPath}`,
      notes: [
        `Set OPENAI_API_KEY and run: bash install-${name}.sh`,
        `Or manually POST assistant-${name}.json to /v1/assistants`,
      ].join("\n"),
    };
  }
}

export default new OpenAIAdapter();
