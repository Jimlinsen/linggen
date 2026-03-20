/**
 * @nutshell/core — Public API
 */
export type {
  WorldSeed, Soul, SoulBundle, CharacterGenealogy, CharacterEnviron, CharacterNetwork, CharacterRelation,
  NutshellConfig, NutshellAdapter, ExportResult, ExportOptions,
  WorldSeedOptions, SoulOptions,
} from "./types.js";

export { DEFAULT_CONFIG } from "./types.js";
export { generate, generateWorldSeed, generateSoul, generateGenealogy, generateEnviron, generateNetwork } from "./generator.js";
export { ENVIRON_PROMPT, NETWORK_PROMPT, SOUL_SYSTEM_PROMPT, WORLD_SEED_SYSTEM_PROMPT, GENEALOGY_PROMPT } from "./prompts.js";
export { researchTradition, researchCharacter, formatResearchForPrompt } from "./research.js";
export type { WikiArticle, ResearchBundle } from "./research.js";
export { buildSoulMd, buildMemoryMd, buildSkillMd, buildEnvironMd, buildNetworkMd, buildInstallCommand, buildAgentPromptMd, buildSkillOsMd, buildInstallSh, buildReadmeMd } from "./templates.js";
export { packTarGz } from "./packager.js";
export {
  WorldSeedSchema, GenealogySchema, SoulSchema, CharacterEnvironSchema, CharacterNetworkSchema, SoulBundleSchema,
  validateWorldSeed, validateGenealogy, validateSoul, validateCharacterEnviron, validateCharacterNetwork, validateSoulBundle,
} from "./schemas.js";
export type {
  ValidatedWorldSeed, ValidatedGenealogy, ValidatedSoul, ValidatedCharacterEnviron, ValidatedCharacterNetwork, ValidatedSoulBundle,
} from "./schemas.js";
