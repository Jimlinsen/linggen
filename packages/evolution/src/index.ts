/**
 * @nutshell/evolution
 * Public API
 */

export { EvolutionEngine } from "./engine.js";
export { WorldStateDB } from "./state.js";
export { TensionAnalyzer } from "./tension.js";
export { SelfResearchEngine } from "./research.js";
export { MaturityScorer } from "./maturity.js";
export { EventGenerator } from "./events.js";
export { PulseScheduler } from "./pulse.js";
export { BifurcationDetector } from "./branch.js";

export type {
  WorldState,
  WorldEvent,
  KnowledgeEntry,
  KnowledgeBase,
  TensionPoint,
  MaturityReport,
  MaturityStage,
  SeedDimension,
  EventType,
  PulseResult,
  CharacterAction,
  EvolutionConfig,
  ResearchGap,
} from "./types.js";
