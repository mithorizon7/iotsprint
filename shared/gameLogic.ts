import { GameMetrics, CardConfig, GameConfig, DisasterConfig, DisasterEvent } from './schema';

export interface SynergyConfig {
  id: string;
  cards: string[];
  nameKey: string;
  descriptionKey: string;
  bonusEffect: keyof GameMetrics;
  bonusAmount: number;
}

export interface SynergiesData {
  synergies: SynergyConfig[];
  cardSynergies: Record<string, string[]>;
}

export interface ActiveSynergy {
  id: string;
  nameKey: string;
  bonusEffect: keyof GameMetrics;
  bonusAmount: number;
  participatingCards: string[];
  scaledBonus: number;
}

export interface TokenMechanics {
  diminishingReturnsThreshold: number;
  diminishingReturnsMultiplier: number;
  iotSprawlThreshold: number;
  iotSprawlPenaltyPerToken: number;
}

export interface AllocationResult {
  metrics: GameMetrics;
  activeSynergies: ActiveSynergy[];
}

export function clampMetrics(metrics: GameMetrics): GameMetrics {
  return {
    visibility_insight: Math.max(0, Math.min(100, metrics.visibility_insight)),
    efficiency_throughput: Math.max(0, Math.min(100, metrics.efficiency_throughput)),
    sustainability_emissions: Math.max(0, Math.min(100, metrics.sustainability_emissions)),
    early_warning_prevention: Math.max(0, Math.min(100, metrics.early_warning_prevention)),
    complexity_risk: Math.max(0, Math.min(100, metrics.complexity_risk)),
  };
}

export function applyAllocationEffects(
  baseMetrics: GameMetrics,
  allocations: Record<string, number>,
  cards: CardConfig[],
  tokenMechanics: TokenMechanics,
): GameMetrics {
  const updated = { ...baseMetrics };
  const totalTokensUsed = Object.values(allocations).reduce((sum, t) => sum + t, 0);

  Object.entries(allocations).forEach(([cardId, tokens]) => {
    if (tokens === 0) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    for (let i = 0; i < tokens; i++) {
      const multiplier =
        i >= tokenMechanics.diminishingReturnsThreshold
          ? tokenMechanics.diminishingReturnsMultiplier
          : 1;

      updated.visibility_insight += card.perTokenEffects.visibility_insight * multiplier;
      updated.efficiency_throughput += card.perTokenEffects.efficiency_throughput * multiplier;
      updated.sustainability_emissions +=
        card.perTokenEffects.sustainability_emissions * multiplier;
      updated.early_warning_prevention +=
        card.perTokenEffects.early_warning_prevention * multiplier;
      updated.complexity_risk += card.perTokenEffects.complexity_risk * multiplier;
    }
  });

  if (totalTokensUsed > tokenMechanics.iotSprawlThreshold) {
    updated.complexity_risk +=
      (totalTokensUsed - tokenMechanics.iotSprawlThreshold) *
      tokenMechanics.iotSprawlPenaltyPerToken;
  }

  return updated;
}

export function applySynergyBonuses(
  baseMetrics: GameMetrics,
  allocations: Record<string, number>,
  synergies: SynergyConfig[],
): { metrics: GameMetrics; activeSynergies: ActiveSynergy[] } {
  const updated = { ...baseMetrics };
  const activeSynergies: ActiveSynergy[] = [];

  synergies.forEach((synergy) => {
    const participatingCards = synergy.cards.filter((cardId) => (allocations[cardId] || 0) >= 1);

    if (participatingCards.length === synergy.cards.length) {
      const minTokens = Math.min(...synergy.cards.map((cardId) => allocations[cardId] || 0));

      const scaledBonus = synergy.bonusAmount * minTokens;

      updated[synergy.bonusEffect] += scaledBonus;

      activeSynergies.push({
        id: synergy.id,
        nameKey: synergy.nameKey,
        bonusEffect: synergy.bonusEffect,
        bonusAmount: synergy.bonusAmount,
        participatingCards,
        scaledBonus,
      });
    }
  });

  return { metrics: updated, activeSynergies };
}

export function applyDisasterPenalties(
  baseMetrics: GameMetrics,
  currentRound: number,
  allocations: Record<string, number>,
  disasters: DisasterConfig[],
  penaltyScale: number = 1,
): { metrics: GameMetrics; triggeredDisasters: DisasterEvent[] } {
  let metrics = { ...baseMetrics };
  const triggeredDisasters: DisasterEvent[] = [];

  disasters.forEach((disasterConfig) => {
    if (disasterConfig.round !== currentRound) return;

    const metricValue = metrics[disasterConfig.triggerMetric];
    if (metricValue >= disasterConfig.threshold) {
      const isMitigated = disasterConfig.mitigatedBy?.some(
        (cardId) => (allocations[cardId] || 0) > 0,
      );

      if (!isMitigated) {
        const penalizedMetrics = { ...metrics };
        Object.entries(disasterConfig.penalties).forEach(([metric, penalty]) => {
          if (penalty !== undefined) {
            penalizedMetrics[metric as keyof GameMetrics] += penalty * penaltyScale;
          }
        });
        metrics = penalizedMetrics;

        triggeredDisasters.push({
          id: disasterConfig.id,
          round: currentRound,
          triggerMetric: disasterConfig.triggerMetric,
          threshold: disasterConfig.threshold,
          penalties: disasterConfig.penalties,
          copyKey: disasterConfig.copyKey,
          mitigatedBy: disasterConfig.mitigatedBy,
        });
      }
    }
  });

  return { metrics, triggeredDisasters };
}

export function calculateRoundEffects(
  metricsBefore: GameMetrics,
  allocations: Record<string, number>,
  cards: CardConfig[],
  config: GameConfig,
  synergies: SynergyConfig[],
  currentRound: number,
  penaltyScale: number = 1,
): {
  metricsAfter: GameMetrics;
  activeSynergies: ActiveSynergy[];
  triggeredDisasters: DisasterEvent[];
} {
  let metrics = applyAllocationEffects(metricsBefore, allocations, cards, config.tokenMechanics);

  const synergyResult = applySynergyBonuses(metrics, allocations, synergies);
  metrics = synergyResult.metrics;

  metrics = clampMetrics(metrics);

  const disasterResult = applyDisasterPenalties(
    metrics,
    currentRound,
    allocations,
    config.disasters,
    penaltyScale,
  );
  metrics = disasterResult.metrics;

  metrics = clampMetrics(metrics);

  return {
    metricsAfter: metrics,
    activeSynergies: synergyResult.activeSynergies,
    triggeredDisasters: disasterResult.triggeredDisasters,
  };
}

export type DifficultyMode = 'easy' | 'normal' | 'hard';

export interface DifficultyConfig {
  id: DifficultyMode;
  nameKey: string;
  descriptionKey: string;
  tokensPerRound: number[];
  tokenMechanics: TokenMechanics;
  disasterPenaltyScale: number;
  additionalDisasters?: DisasterConfig[];
}

export const DIFFICULTY_PRESETS: Record<DifficultyMode, DifficultyConfig> = {
  easy: {
    id: 'easy',
    nameKey: 'difficulty.easy.name',
    descriptionKey: 'difficulty.easy.description',
    tokensPerRound: [12, 7, 7],
    tokenMechanics: {
      diminishingReturnsThreshold: 4,
      diminishingReturnsMultiplier: 0.6,
      iotSprawlThreshold: 14,
      iotSprawlPenaltyPerToken: 1,
    },
    disasterPenaltyScale: 0.75,
  },
  normal: {
    id: 'normal',
    nameKey: 'difficulty.normal.name',
    descriptionKey: 'difficulty.normal.description',
    tokensPerRound: [10, 5, 5],
    tokenMechanics: {
      diminishingReturnsThreshold: 3,
      diminishingReturnsMultiplier: 0.5,
      iotSprawlThreshold: 12,
      iotSprawlPenaltyPerToken: 2,
    },
    disasterPenaltyScale: 1,
  },
  hard: {
    id: 'hard',
    nameKey: 'difficulty.hard.name',
    descriptionKey: 'difficulty.hard.description',
    tokensPerRound: [8, 4, 4],
    tokenMechanics: {
      diminishingReturnsThreshold: 2,
      diminishingReturnsMultiplier: 0.4,
      iotSprawlThreshold: 10,
      iotSprawlPenaltyPerToken: 3,
    },
    disasterPenaltyScale: 1.25,
    additionalDisasters: [
      {
        id: 'supply_chain_disruption',
        round: 2,
        triggerMetric: 'visibility_insight',
        threshold: 35,
        penalties: {
          efficiency_throughput: -10,
          early_warning_prevention: -5,
        },
        copyKey: 'disasters.supplyChainDisruption',
        mitigatedBy: ['warehouseFlow', 'digitalTwin'],
      },
      {
        id: 'energy_crisis',
        round: 2,
        triggerMetric: 'sustainability_emissions',
        threshold: 35,
        penalties: {
          sustainability_emissions: -15,
          efficiency_throughput: -5,
        },
        copyKey: 'disasters.energyCrisis',
        mitigatedBy: ['energyMonitoring', 'smartBuilding'],
      },
    ],
  },
};

export function getConfigForDifficulty(
  baseConfig: GameConfig,
  difficulty: DifficultyMode,
): GameConfig {
  const preset = DIFFICULTY_PRESETS[difficulty];

  let disasters = [...baseConfig.disasters];
  if (preset.additionalDisasters) {
    disasters = [...disasters, ...preset.additionalDisasters];
  }

  return {
    ...baseConfig,
    tokenMechanics: preset.tokenMechanics,
    disasters,
  };
}

export function getTokensPerRound(difficulty: DifficultyMode): number[] {
  return DIFFICULTY_PRESETS[difficulty].tokensPerRound;
}

export function getDisasterPenaltyScale(difficulty: DifficultyMode): number {
  return DIFFICULTY_PRESETS[difficulty].disasterPenaltyScale;
}
