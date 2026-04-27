/**
 * @nutshell/core — Zod Schemas
 *
 * Runtime validation layer for all core types.
 * Mirrors types.ts exactly — do not modify types.ts.
 */

import { z } from "zod";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}

function makeValidator<T>(schema: z.ZodType<T>) {
  return (data: unknown): { success: boolean; data?: T; errors?: string[] } => {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, errors: formatErrors(result.error) };
  };
}

// ─── WORLD SEED ───────────────────────────────────────────────────────────────

export const WorldSeedSchema = z.object({
  tradition_name: z.string().min(1),
  tagline: z.string().min(1),
  cosmogony: z.string().min(1),
  ontology: z.string().min(1),
  time: z.string().min(1),
  fate: z.string().min(1),
  divine_human: z.string().min(1),
  death: z.string().min(1),
  tension: z.string().min(1),
  aesthetic: z.string().min(1),
  symbols: z.string().min(1),
  seed_essence: z.string().min(1),
  geography_spirit: z.string().min(1).optional(),
  social_fabric: z.string().min(1).optional(),
  power_logic: z.string().min(1).optional(),
  sensory_signature: z.string().min(1).optional(),
});

export type ValidatedWorldSeed = z.infer<typeof WorldSeedSchema>;
export const validateWorldSeed = makeValidator(WorldSeedSchema);

// ─── GENEALOGY ────────────────────────────────────────────────────────────────

export const GenealogySchema = z.object({
  era: z.string().min(1),
  philosophical_lineage: z.string().min(1),
  archetypal_lineage: z.string().min(1),
  world_seed_connection: z.string().min(1),
});

export type ValidatedGenealogy = z.infer<typeof GenealogySchema>;
export const validateGenealogy = makeValidator(GenealogySchema);

// ─── SOUL ─────────────────────────────────────────────────────────────────────

export const SoulSchema = z.object({
  character_name: z.string().min(1),
  world_bond: z.string().min(1),
  essence: z.string().min(1),
  ideological_root: z.string().min(1),
  voice: z.string().min(1),
  catchphrases: z.array(z.string().min(1)),
  stance: z.string().min(1),
  taboos: z.string().min(1),
  world_model: z.string().min(1),
  formative_events: z.string().min(1),
  current_concerns: z.string().min(1),
  knowledge_boundary: z.string().min(1),
  activation: z.string().min(1),
  cognitive_style: z.string().min(1),
  core_capabilities: z.string().min(1),
  failure_modes: z.string().min(1),
  shadow: z.string().min(1).optional(),
  desire_vs_duty: z.string().min(1).optional(),
  self_myth: z.string().min(1).optional(),
  wound: z.string().min(1).optional(),
});

export type ValidatedSoul = z.infer<typeof SoulSchema>;
export const validateSoul = makeValidator(SoulSchema);

// ─── CHARACTER ENVIRON ────────────────────────────────────────────────────────

export const CharacterEnvironSchema = z.object({
  character_name: z.string().min(1),
  habitual_space: z.string().min(1),
  spatial_relationship: z.string().min(1),
  social_position: z.string().min(1),
  environmental_tension: z.string().min(1),
});

export type ValidatedCharacterEnviron = z.infer<typeof CharacterEnvironSchema>;
export const validateCharacterEnviron = makeValidator(CharacterEnvironSchema);

// ─── CHARACTER NETWORK ────────────────────────────────────────────────────────

const CharacterRelationSchema = z.object({
  name: z.string().min(1),
  character_ref: z.string().min(1).optional(),
  description: z.string().min(1),
});

export const CharacterNetworkSchema = z.object({
  character_name: z.string().min(1),
  mirror: CharacterRelationSchema,
  rival: CharacterRelationSchema,
  ally: CharacterRelationSchema,
  intimate: CharacterRelationSchema,
  liminal: CharacterRelationSchema,
  relational_pattern: z.string().min(1),
  relational_taboo: z.string().min(1),
});

export type ValidatedCharacterNetwork = z.infer<typeof CharacterNetworkSchema>;
export const validateCharacterNetwork = makeValidator(CharacterNetworkSchema);

// ─── SOURCES + QUALITY ───────────────────────────────────────────────────────

export const SourceNoteSchema = z.object({
  role: z.enum(["tradition", "character", "supplementary"]),
  title: z.string().min(1),
  url: z.string().min(1),
  language: z.enum(["en", "zh"]),
  excerpt: z.string().min(1),
});

export const BundleQualityCheckSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  passed: z.boolean(),
  detail: z.string().min(1),
});

export const BundleQualityReportSchema = z.object({
  score: z.number().min(0).max(1),
  checks: z.array(BundleQualityCheckSchema),
  issues: z.array(z.string().min(1)),
});

// ─── SOUL BUNDLE ──────────────────────────────────────────────────────────────

export const SoulBundleSchema = z.object({
  world_seed: WorldSeedSchema,
  genealogy: GenealogySchema.optional(),
  soul: SoulSchema,
  environ: CharacterEnvironSchema.optional(),
  network: CharacterNetworkSchema.optional(),
  files: z.object({
    soul_md: z.string().min(1),
    memory_md: z.string().min(1),
    skill_md: z.string().min(1),
    environ_md: z.string().min(1).optional(),
    network_md: z.string().min(1).optional(),
  }),
  sources: z
    .object({
      tradition: SourceNoteSchema.optional(),
      character: z.array(SourceNoteSchema),
      supplementary: z.array(SourceNoteSchema),
    })
    .optional(),
  quality: BundleQualityReportSchema.optional(),
  meta: z.object({
    generated_at: z.string().min(1),
    model: z.string().min(1),
    version: z.string().min(1),
  }),
});

export type ValidatedSoulBundle = z.infer<typeof SoulBundleSchema>;
export const validateSoulBundle = makeValidator(SoulBundleSchema);
