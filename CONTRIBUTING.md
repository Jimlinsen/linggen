# Contributing to nutshell

We welcome contributions in four areas:

## 1. World Seeds

The community seed library is the most valuable asset of this project. A well-researched world seed benefits every character generated from that tradition.

**Quality bar for world seeds:**
- Grounded in actual scholarship, not Wikipedia summaries or popular culture impressions
- Cite sources in a `sources.md` alongside the seed
- Each dimension should be specific to *this* tradition — not generic statements about "mythology in general"
- The `seed_essence` paragraph should be distinctive enough that someone familiar with the tradition says "yes, that's it"

**Traditions especially needed:**
- Yoruba / West African (Ifá tradition)
- Polynesian (especially Māori and Hawaiian)
- Slavic pre-Christian
- Zoroastrian (Avestan)
- Aztec vs. Maya distinction (common conflation)
- Amazonian (multiple traditions)
- Persian Sufi (distinct from Zoroastrian)

See `examples/seeds/` for reference quality.

## 2. Adapters

An adapter transforms a `SoulBundle` into platform-specific output.

**To write an adapter:**

```typescript
import type { NutshellAdapter, SoulBundle, ExportResult } from '@nutshell/core';

export class MyPlatformAdapter implements NutshellAdapter {
  name = 'my-platform';
  description = 'Export to My Platform format';
  platforms = ['My Platform >= 1.0'];

  async export(bundle: SoulBundle, outputDir: string): Promise<ExportResult> {
    // Transform bundle.files.soul_md, memory_md, skill_md
    // Write to outputDir
    // Return paths + install command
  }
}
```

**Platforms we'd like to support:**
- Oobabooga / text-generation-webui
- LM Studio
- Kobold.cpp
- Tavern.ai
- Character.ai (if API available)
- Replika-style formats

## 3. Examples

A complete example includes:
- A `README.md` explaining the genealogy rationale
- The world seed JSON
- The soul JSON
- The three generated files
- A section on "what makes this different from a checklist character"

Examples help calibrate quality expectations and document the genealogy methodology.

## 4. Academic Grounding

If you have expertise in mythology, comparative religion, or folk literature, we'd especially value:
- Corrections to our framework description in `docs/philosophy.md`
- Additional theoretical frameworks worth integrating
- Reviews of world seeds for scholarly accuracy

---

## Development Setup

```bash
cd 灵根
npm install

# Run tests
npm test

# Build all packages
npm run build

# Try the CLI (from root)
node packages/cli/dist/index.js --help
```

## Code Style

- TypeScript, strict mode
- No framework dependencies in `@nutshell/core`
- `@nutshell/studio` can use React + Vite
- All public APIs must have JSDoc
- Errors should include actionable messages

## Commit Convention

```
feat: add SillyTavern adapter
fix: handle malformed JSON in soul generation
docs: add Yoruba world seed
example: add Athena (Ancient Greece)
seed: add Yoruba / Ifá tradition
```

---

*nutshell is a project from [Lingxi World](https://lingxi.world).*
*"必有界限，才可涌现自身。" — Only with boundaries can a self emerge.*
