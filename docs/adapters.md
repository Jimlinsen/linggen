# Writing a Nutshell Adapter

An adapter transforms a `SoulBundle` into platform-specific output files.

---

## The Interface

```typescript
import type { NutshellAdapter, SoulBundle, ExportResult } from "@nutshell/core";

export class MyPlatformAdapter implements NutshellAdapter {
  name = "my-platform";
  description = "Export to My Platform's character format";
  platforms = ["My Platform >= 2.0"];

  async export(bundle: SoulBundle, outputDir: string): Promise<ExportResult> {
    const { soul, world_seed, files, meta } = bundle;
    // ...
    return {
      files: [
        { path: "/path/to/output.json", description: "Character configuration" },
      ],
      install_command: "my-platform import character.json",
      notes: "Optional additional instructions for the user",
    };
  }
}

export default new MyPlatformAdapter();
```

---

## SoulBundle Structure

```typescript
interface SoulBundle {
  world_seed: WorldSeed;      // The world's ideological substrate
  genealogy?: CharacterGenealogy; // Optional genealogy trace
  soul: Soul;                 // The character's identity kernel
  files: {
    soul_md: string;          // soul.md content (ready to write)
    memory_md: string;        // memory.md content
    skill_md: string;         // skill.md content
  };
  meta: {
    generated_at: string;     // ISO timestamp
    model: string;            // Model used for generation
    version: string;          // Nutshell version
  };
}
```

---

## What to Map to What

Different platforms have different mental models. Here's guidance:

### Platforms with System Prompt

(SillyTavern, most local LLM interfaces)

```
soul.md → system prompt (primary)
skill.md → post_history_instructions or jailbreak slot
memory.md → world info / lorebook (injected at context start)
```

### Platforms with Structured Character Cards

(SillyTavern V2, Character.AI-style)

```
soul.character_name → name
soul.essence + soul.ideological_root → description
soul.voice + soul.stance → personality
world_seed.seed_essence → scenario
soul.catchphrases[0] → first_mes
soul.catchphrases[1:3] → mes_example
files.soul_md → system_prompt
files.skill_md → post_history_instructions
```

### Platforms with Knowledge Base / RAG

(OpenAI Assistants, Cohere, etc.)

```
files.soul_md → system instructions
files.memory_md → knowledge base file (for retrieval)
files.skill_md → system instructions (append)
world_seed → knowledge base file (for world context retrieval)
```

### Minimal / Direct Platforms

(Simple API wrappers, custom systems)

```
files.soul_md → single system prompt
(memory and skill can be appended)
```

---

## Guidelines

**Preserve world seed metadata**: Always include `world_seed.tradition_name` and `soul.world_bond` somewhere in the output. These ground the character in their world.

**Don't flatten the three files**: The soul/memory/skill distinction is meaningful. soul.md is identity (stable); memory.md is state (can evolve); skill.md is behavior (can be tuned). If your platform has only one field, concatenate in order: soul → memory → skill.

**Provide install instructions**: The `install_command` or `notes` field should tell the user exactly what to do next. Don't assume they know.

**Handle paths correctly**: Use `outputDir.replace("~", process.env.HOME || "~")` to handle home directory expansion.

---

## Example: Minimal Adapter

```typescript
import * as fs from "fs/promises";
import * as path from "path";
import type { NutshellAdapter, SoulBundle, ExportResult } from "@nutshell/core";

export class MinimalAdapter implements NutshellAdapter {
  name = "minimal";
  description = "Export as a single combined system prompt file";
  platforms = ["Any platform accepting a system prompt"];

  async export(bundle: SoulBundle, outputDir: string): Promise<ExportResult> {
    const { soul, world_seed, files } = bundle;
    const slug = soul.character_name.toLowerCase().replace(/\s+/g, "-");
    const dir = outputDir.replace("~", process.env.HOME || "~");
    await fs.mkdir(dir, { recursive: true });

    // Combine all three files into a single system prompt
    const combined = [
      `# ${soul.character_name}`,
      `> World: ${world_seed.tradition_name} | ${world_seed.tagline}`,
      "",
      files.soul_md,
      "---",
      files.memory_md,
      "---",
      files.skill_md,
    ].join("\n\n");

    const outPath = path.join(dir, `${slug}-system-prompt.md`);
    await fs.writeFile(outPath, combined, "utf-8");

    return {
      files: [{ path: outPath, description: "Combined system prompt" }],
      notes: `Copy the contents of ${slug}-system-prompt.md into your platform's system prompt field.`,
    };
  }
}

export default new MinimalAdapter();
```

---

## Registering Your Adapter

1. Create `packages/adapters/{your-platform}/`
2. Add `package.json` with `name: "@nutshell/adapter-{your-platform}"`
3. Implement and export your adapter
4. Add it to the CLI in `packages/cli/src/index.ts`
5. Document in `docs/adapters.md`
6. Submit PR

---

## Existing Adapters as Reference

| Adapter | File | Notes |
|---------|------|-------|
| OpenClaw | `packages/adapters/openclaw/src/index.ts` | Three-file directory structure |
| SillyTavern | `packages/adapters/sillytavern/src/index.ts` | Character card V2 spec + lorebook |
| OpenAI | `packages/adapters/openai/src/index.ts` | Assistants API + install script |
