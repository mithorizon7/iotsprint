import { z } from "zod";

// Game State Types
export interface GameMetrics {
  visibility_insight: number;
  efficiency_throughput: number;
  sustainability_emissions: number;
  early_warning_prevention: number;
  complexity_risk: number;
}

export interface PerTokenEffects {
  visibility_insight: number;
  efficiency_throughput: number;
  sustainability_emissions: number;
  early_warning_prevention: number;
  complexity_risk: number;
}

export type UnlockCondition = 'complexity_high' | null;

export type IotProcessStage = 'sense' | 'share' | 'process' | 'act';

export interface CardConfig {
  id: string;
  roundsAvailable: number[];
  unlockCondition: UnlockCondition;
  perTokenEffects: PerTokenEffects;
  category: 'visibility' | 'streamlining' | 'sustainability' | 'early_warning' | 'security';
  companyName: string; // Company reference for final summary (e.g., "Airbus", "Bosch")
  feedbackKey: string; // Translation key for round feedback examples (e.g., "feedback.airbus")
  iotProcessStages: IotProcessStage[]; // Which IoT process stages this initiative emphasizes
  copyKeys: {
    title: string;
    shortDescription: string;
    whenToUse: string;
  };
}

export interface CardAllocation {
  cardId: string;
  tokens: number;
}

export type PreMortemChoice = 'security_risk' | 'inefficiency' | 'environmental_fine';

export interface DisasterEvent {
  id: string;
  round: number;
  triggerMetric: keyof GameMetrics;
  threshold: number;
  penalties: Partial<GameMetrics>;
  copyKey: string; // Translation key for disaster message
  mitigatedBy?: string[]; // Card IDs that prevent this disaster (if allocated)
}

export interface RoundHistoryEntry {
  round: number;
  metricsBefore: GameMetrics;
  metricsAfter: GameMetrics;
  allocations: Record<string, number>;
  events?: DisasterEvent[]; // Disasters that occurred this round
}

export interface GameState {
  currentRound: number; // 0 = onboarding, 1-3 = game rounds
  metrics: GameMetrics;
  tokensAvailable: number;
  allocations: Record<string, number>; // cardId -> tokens
  roundHistory: RoundHistoryEntry[];
  disasterEvents: DisasterEvent[]; // All disasters encountered
  preMortemAnswer: PreMortemChoice | null; // Player's risk prediction
  isGameComplete: boolean; // Explicit flag indicating Round 3 has been completed
}

export type ArchetypeId = 
  | 'EFFICIENCY_FIRST'
  | 'SUSTAINABILITY_CHAMPION'
  | 'RESILIENT_OPERATOR'
  | 'OVER_CONNECTED_RISK_TAKER'
  | 'EARLY_WARNING_GUARDIAN'
  | 'VISIBILITY_FOCUSED';

export interface Archetype {
  id: ArchetypeId;
  titleKey: string;
  descriptionKey: string;
  suggestionsKey: string;
}

export interface FeedbackTemplate {
  id: string;
  conditionFn: (metricsDelta: GameMetrics, categories: Set<string>) => boolean;
  messageKey: string;
  priority: number; // higher priority templates shown first
}

// Initial game state
export const INITIAL_METRICS: GameMetrics = {
  visibility_insight: 25,
  efficiency_throughput: 30,
  sustainability_emissions: 30,
  early_warning_prevention: 20,
  complexity_risk: 20,
};

export const TOKENS_PER_ROUND = [10, 5, 5]; // Round 1: 10 tokens, Round 2/3: +5 new tokens + reallocation

// Helper to clamp metrics to 0-100
export function clampMetrics(metrics: GameMetrics): GameMetrics {
  return {
    visibility_insight: Math.max(0, Math.min(100, metrics.visibility_insight)),
    efficiency_throughput: Math.max(0, Math.min(100, metrics.efficiency_throughput)),
    sustainability_emissions: Math.max(0, Math.min(100, metrics.sustainability_emissions)),
    early_warning_prevention: Math.max(0, Math.min(100, metrics.early_warning_prevention)),
    complexity_risk: Math.max(0, Math.min(100, metrics.complexity_risk)),
  };
}

// Calculate delta between two metric states
export function calculateMetricsDelta(before: GameMetrics, after: GameMetrics): GameMetrics {
  return {
    visibility_insight: after.visibility_insight - before.visibility_insight,
    efficiency_throughput: after.efficiency_throughput - before.efficiency_throughput,
    sustainability_emissions: after.sustainability_emissions - before.sustainability_emissions,
    early_warning_prevention: after.early_warning_prevention - before.early_warning_prevention,
    complexity_risk: after.complexity_risk - before.complexity_risk,
  };
}

// Game Configuration Types
export interface GameConfig {
  feedbackThresholds: {
    highVisibilityDelta: number;
    highEfficiencyDelta: number;
    highSustainabilityDelta: number;
    highEarlyWarningDelta: number;
    highComplexityDelta: number;
    criticalComplexityAbsolute: number;
    lowEarlyWarningDelta: number;
    balancedGrowthMinDelta: number;
    balancedGrowthMaxComplexity: number;
  };
  tokenMechanics: {
    diminishingReturnsThreshold: number;
    diminishingReturnsMultiplier: number;
    iotSprawlThreshold: number;
    iotSprawlPenaltyPerToken: number;
  };
  unlockConditions: {
    complexityHighThreshold: number;
  };
  disasters: DisasterConfig[];
}

export interface DisasterConfig {
  id: string;
  round: number;
  triggerMetric: keyof GameMetrics;
  threshold: number;
  penalties: Partial<GameMetrics>;
  copyKey: string;
  mitigatedBy?: string[];
}

// Evaluate unlock conditions based on current game state
export function evaluateUnlockCondition(
  condition: UnlockCondition,
  metrics: GameMetrics,
  allocations: Record<string, number>,
  config?: GameConfig
): boolean {
  if (condition === null) {
    return true; // No unlock condition, always available
  }

  const complexityThreshold = config?.unlockConditions.complexityHighThreshold ?? 40;

  switch (condition) {
    case 'complexity_high':
      return metrics.complexity_risk >= complexityThreshold;
    default:
      return true;
  }
}
