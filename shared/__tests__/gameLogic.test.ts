import { describe, it, expect } from 'vitest';
import {
  clampMetrics,
  applyAllocationEffects,
  applySynergyBonuses,
  applyDisasterPenalties,
  calculateRoundEffects,
  getConfigForDifficulty,
  getTokensPerRound,
  getDisasterPenaltyScale,
  DIFFICULTY_PRESETS,
  SynergyConfig,
  TokenMechanics,
} from '../gameLogic';
import { GameMetrics, CardConfig, DisasterConfig } from '../schema';

const createMockMetrics = (overrides: Partial<GameMetrics> = {}): GameMetrics => ({
  visibility_insight: 25,
  efficiency_throughput: 30,
  sustainability_emissions: 30,
  early_warning_prevention: 20,
  complexity_risk: 20,
  ...overrides,
});

const createMockCard = (id: string, effects: Partial<GameMetrics>): CardConfig => ({
  id,
  roundsAvailable: [1, 2, 3],
  unlockCondition: null,
  perTokenEffects: {
    visibility_insight: effects.visibility_insight ?? 0,
    efficiency_throughput: effects.efficiency_throughput ?? 0,
    sustainability_emissions: effects.sustainability_emissions ?? 0,
    early_warning_prevention: effects.early_warning_prevention ?? 0,
    complexity_risk: effects.complexity_risk ?? 0,
  },
  category: 'visibility',
  companyName: 'Test Company',
  feedbackKey: 'feedback.test',
  iotProcessStages: ['sense'],
  copyKeys: {
    title: 'cards.test.title',
    shortDescription: 'cards.test.description',
    whenToUse: 'cards.test.whenToUse',
  },
});

const defaultTokenMechanics: TokenMechanics = {
  diminishingReturnsThreshold: 3,
  diminishingReturnsMultiplier: 0.5,
  iotSprawlThreshold: 12,
  iotSprawlPenaltyPerToken: 2,
};

describe('clampMetrics', () => {
  it('should not change metrics within valid range', () => {
    const metrics = createMockMetrics();
    const result = clampMetrics(metrics);
    expect(result).toEqual(metrics);
  });

  it('should clamp metrics above 100 to 100', () => {
    const metrics = createMockMetrics({
      visibility_insight: 150,
      efficiency_throughput: 120,
    });
    const result = clampMetrics(metrics);
    expect(result.visibility_insight).toBe(100);
    expect(result.efficiency_throughput).toBe(100);
  });

  it('should clamp metrics below 0 to 0', () => {
    const metrics = createMockMetrics({
      visibility_insight: -10,
      sustainability_emissions: -5,
    });
    const result = clampMetrics(metrics);
    expect(result.visibility_insight).toBe(0);
    expect(result.sustainability_emissions).toBe(0);
  });

  it('should handle edge cases at exactly 0 and 100', () => {
    const metrics = createMockMetrics({
      visibility_insight: 0,
      efficiency_throughput: 100,
    });
    const result = clampMetrics(metrics);
    expect(result.visibility_insight).toBe(0);
    expect(result.efficiency_throughput).toBe(100);
  });
});

describe('applyAllocationEffects', () => {
  it('should apply basic token effects correctly', () => {
    const metrics = createMockMetrics();
    const cards = [
      createMockCard('card1', { visibility_insight: 5, complexity_risk: 2 }),
    ];
    const allocations = { card1: 2 };

    const result = applyAllocationEffects(metrics, allocations, cards, defaultTokenMechanics);
    
    expect(result.visibility_insight).toBe(35); // 25 + (5 * 2)
    expect(result.complexity_risk).toBe(24); // 20 + (2 * 2)
  });

  it('should apply diminishing returns after threshold', () => {
    const metrics = createMockMetrics();
    const cards = [
      createMockCard('card1', { visibility_insight: 10 }),
    ];
    const allocations = { card1: 3 };
    const tokenMechanics: TokenMechanics = {
      diminishingReturnsThreshold: 2,
      diminishingReturnsMultiplier: 0.5,
      iotSprawlThreshold: 12,
      iotSprawlPenaltyPerToken: 2,
    };

    const result = applyAllocationEffects(metrics, allocations, cards, tokenMechanics);
    
    // Token 0: full effect (10), Token 1: full effect (10), Token 2: diminished (5)
    expect(result.visibility_insight).toBe(50); // 25 + 10 + 10 + 5
  });

  it('should apply IoT sprawl penalty when exceeding threshold', () => {
    const metrics = createMockMetrics();
    const cards = [
      createMockCard('card1', { visibility_insight: 1 }),
      createMockCard('card2', { visibility_insight: 1 }),
      createMockCard('card3', { visibility_insight: 1 }),
      createMockCard('card4', { visibility_insight: 1 }),
      createMockCard('card5', { visibility_insight: 1 }),
    ];
    const allocations = {
      card1: 3,
      card2: 3,
      card3: 3,
      card4: 3,
      card5: 3, // Total 15 tokens
    };
    const tokenMechanics: TokenMechanics = {
      diminishingReturnsThreshold: 10,
      diminishingReturnsMultiplier: 0.5,
      iotSprawlThreshold: 12,
      iotSprawlPenaltyPerToken: 2,
    };

    const result = applyAllocationEffects(metrics, allocations, cards, tokenMechanics);
    
    // 15 tokens - 12 threshold = 3 excess * 2 penalty = 6 complexity added
    expect(result.complexity_risk).toBe(26); // 20 + 6
  });

  it('should not apply sprawl penalty at or below threshold', () => {
    const metrics = createMockMetrics();
    const cards = [createMockCard('card1', {})];
    const allocations = { card1: 3 };
    const tokenMechanics: TokenMechanics = {
      diminishingReturnsThreshold: 10,
      diminishingReturnsMultiplier: 0.5,
      iotSprawlThreshold: 12,
      iotSprawlPenaltyPerToken: 2,
    };

    const result = applyAllocationEffects(metrics, allocations, cards, tokenMechanics);
    expect(result.complexity_risk).toBe(20); // Unchanged
  });

  it('should handle zero allocations', () => {
    const metrics = createMockMetrics();
    const cards = [createMockCard('card1', { visibility_insight: 10 })];
    const allocations = { card1: 0 };

    const result = applyAllocationEffects(metrics, allocations, cards, defaultTokenMechanics);
    expect(result).toEqual(metrics);
  });

  it('should handle empty allocations', () => {
    const metrics = createMockMetrics();
    const cards = [createMockCard('card1', { visibility_insight: 10 })];
    const allocations = {};

    const result = applyAllocationEffects(metrics, allocations, cards, defaultTokenMechanics);
    expect(result).toEqual(metrics);
  });

  it('should handle multiple cards with different effects', () => {
    const metrics = createMockMetrics();
    const cards = [
      createMockCard('card1', { visibility_insight: 5, complexity_risk: 1 }),
      createMockCard('card2', { efficiency_throughput: 3, sustainability_emissions: 2 }),
    ];
    const allocations = { card1: 1, card2: 2 };

    const result = applyAllocationEffects(metrics, allocations, cards, defaultTokenMechanics);
    
    expect(result.visibility_insight).toBe(30); // 25 + 5
    expect(result.complexity_risk).toBe(21); // 20 + 1
    expect(result.efficiency_throughput).toBe(36); // 30 + 6
    expect(result.sustainability_emissions).toBe(34); // 30 + 4
  });
});

describe('applySynergyBonuses', () => {
  const synergies: SynergyConfig[] = [
    {
      id: 'synergy1',
      cards: ['card1', 'card2'],
      nameKey: 'synergies.test1.name',
      descriptionKey: 'synergies.test1.description',
      bonusEffect: 'visibility_insight',
      bonusAmount: 5,
    },
    {
      id: 'synergy2',
      cards: ['card2', 'card3', 'card4'],
      nameKey: 'synergies.test2.name',
      descriptionKey: 'synergies.test2.description',
      bonusEffect: 'efficiency_throughput',
      bonusAmount: 3,
    },
  ];

  it('should activate synergy when all cards have allocations', () => {
    const metrics = createMockMetrics();
    const allocations = { card1: 2, card2: 1 };

    const result = applySynergyBonuses(metrics, allocations, synergies);
    
    // Synergy1 triggers: min(2,1) = 1 * 5 = 5 bonus
    expect(result.metrics.visibility_insight).toBe(30); // 25 + 5
    expect(result.activeSynergies).toHaveLength(1);
    expect(result.activeSynergies[0].id).toBe('synergy1');
    expect(result.activeSynergies[0].scaledBonus).toBe(5);
  });

  it('should scale synergy bonus by minimum token count', () => {
    const metrics = createMockMetrics();
    const allocations = { card1: 3, card2: 2 };

    const result = applySynergyBonuses(metrics, allocations, synergies);
    
    // Synergy1 triggers: min(3,2) = 2 * 5 = 10 bonus
    expect(result.metrics.visibility_insight).toBe(35); // 25 + 10
    expect(result.activeSynergies[0].scaledBonus).toBe(10);
  });

  it('should not activate synergy when not all cards are allocated', () => {
    const metrics = createMockMetrics();
    const allocations = { card1: 2 }; // Missing card2

    const result = applySynergyBonuses(metrics, allocations, synergies);
    
    expect(result.metrics).toEqual(metrics);
    expect(result.activeSynergies).toHaveLength(0);
  });

  it('should not activate synergy when a card has zero tokens', () => {
    const metrics = createMockMetrics();
    const allocations = { card1: 2, card2: 0 };

    const result = applySynergyBonuses(metrics, allocations, synergies);
    
    expect(result.metrics).toEqual(metrics);
    expect(result.activeSynergies).toHaveLength(0);
  });

  it('should activate multiple synergies when conditions are met', () => {
    const metrics = createMockMetrics();
    const allocations = { card1: 1, card2: 1, card3: 1, card4: 1 };

    const result = applySynergyBonuses(metrics, allocations, synergies);
    
    // Both synergies trigger
    expect(result.metrics.visibility_insight).toBe(30); // 25 + (1 * 5)
    expect(result.metrics.efficiency_throughput).toBe(33); // 30 + (1 * 3)
    expect(result.activeSynergies).toHaveLength(2);
  });

  it('should handle negative synergy bonuses (complexity reduction)', () => {
    const metrics = createMockMetrics();
    const synergiesWithNegative: SynergyConfig[] = [
      {
        id: 'security-synergy',
        cards: ['security', 'digitalTwin'],
        nameKey: 'synergies.security.name',
        descriptionKey: 'synergies.security.description',
        bonusEffect: 'complexity_risk',
        bonusAmount: -3,
      },
    ];
    const allocations = { security: 2, digitalTwin: 2 };

    const result = applySynergyBonuses(metrics, allocations, synergiesWithNegative);
    
    // min(2,2) * -3 = -6 to complexity
    expect(result.metrics.complexity_risk).toBe(14); // 20 - 6
    expect(result.activeSynergies[0].scaledBonus).toBe(-6);
  });
});

describe('applyDisasterPenalties', () => {
  const disasters: DisasterConfig[] = [
    {
      id: 'disaster1',
      round: 3,
      triggerMetric: 'complexity_risk',
      threshold: 80,
      penalties: {
        efficiency_throughput: -20,
        complexity_risk: 5,
      },
      copyKey: 'disasters.test1',
      mitigatedBy: ['securityHardening'],
    },
  ];

  it('should trigger disaster when threshold is met', () => {
    const metrics = createMockMetrics({ complexity_risk: 85 });

    const result = applyDisasterPenalties(metrics, 3, {}, disasters);
    
    expect(result.metrics.efficiency_throughput).toBe(10); // 30 - 20
    expect(result.metrics.complexity_risk).toBe(90); // 85 + 5
    expect(result.triggeredDisasters).toHaveLength(1);
    expect(result.triggeredDisasters[0].id).toBe('disaster1');
  });

  it('should not trigger disaster below threshold', () => {
    const metrics = createMockMetrics({ complexity_risk: 75 });

    const result = applyDisasterPenalties(metrics, 3, {}, disasters);
    
    expect(result.metrics).toEqual(metrics);
    expect(result.triggeredDisasters).toHaveLength(0);
  });

  it('should not trigger disaster on wrong round', () => {
    const metrics = createMockMetrics({ complexity_risk: 85 });

    const result = applyDisasterPenalties(metrics, 2, {}, disasters); // Round 2, not 3
    
    expect(result.metrics).toEqual(metrics);
    expect(result.triggeredDisasters).toHaveLength(0);
  });

  it('should mitigate disaster when mitigating card is allocated', () => {
    const metrics = createMockMetrics({ complexity_risk: 85 });
    const allocations = { securityHardening: 1 };

    const result = applyDisasterPenalties(metrics, 3, allocations, disasters);
    
    expect(result.metrics).toEqual(metrics); // No penalty applied
    expect(result.triggeredDisasters).toHaveLength(0);
  });

  it('should scale penalties by penaltyScale', () => {
    const metrics = createMockMetrics({ complexity_risk: 85 });

    const result = applyDisasterPenalties(metrics, 3, {}, disasters, 0.5);
    
    expect(result.metrics.efficiency_throughput).toBe(20); // 30 - (20 * 0.5)
    expect(result.metrics.complexity_risk).toBe(87.5); // 85 + (5 * 0.5)
  });

  it('should trigger at exactly the threshold', () => {
    const metrics = createMockMetrics({ complexity_risk: 80 }); // Exactly at threshold

    const result = applyDisasterPenalties(metrics, 3, {}, disasters);
    
    expect(result.triggeredDisasters).toHaveLength(1);
  });
});

describe('DIFFICULTY_PRESETS', () => {
  it('should have correct easy mode settings', () => {
    const easy = DIFFICULTY_PRESETS.easy;
    expect(easy.tokensPerRound).toEqual([12, 7, 7]);
    expect(easy.disasterPenaltyScale).toBe(0.75);
    expect(easy.tokenMechanics.diminishingReturnsThreshold).toBe(4);
    expect(easy.tokenMechanics.iotSprawlThreshold).toBe(14);
  });

  it('should have correct normal mode settings', () => {
    const normal = DIFFICULTY_PRESETS.normal;
    expect(normal.tokensPerRound).toEqual([10, 5, 5]);
    expect(normal.disasterPenaltyScale).toBe(1);
    expect(normal.tokenMechanics.diminishingReturnsThreshold).toBe(3);
    expect(normal.tokenMechanics.iotSprawlThreshold).toBe(12);
  });

  it('should have correct hard mode settings', () => {
    const hard = DIFFICULTY_PRESETS.hard;
    expect(hard.tokensPerRound).toEqual([8, 4, 4]);
    expect(hard.disasterPenaltyScale).toBe(1.25);
    expect(hard.tokenMechanics.diminishingReturnsThreshold).toBe(2);
    expect(hard.tokenMechanics.iotSprawlThreshold).toBe(10);
    expect(hard.additionalDisasters).toBeDefined();
    expect(hard.additionalDisasters!.length).toBeGreaterThan(0);
  });
});

describe('getTokensPerRound', () => {
  it('should return correct tokens for each difficulty', () => {
    expect(getTokensPerRound('easy')).toEqual([12, 7, 7]);
    expect(getTokensPerRound('normal')).toEqual([10, 5, 5]);
    expect(getTokensPerRound('hard')).toEqual([8, 4, 4]);
  });
});

describe('getDisasterPenaltyScale', () => {
  it('should return correct scale for each difficulty', () => {
    expect(getDisasterPenaltyScale('easy')).toBe(0.75);
    expect(getDisasterPenaltyScale('normal')).toBe(1);
    expect(getDisasterPenaltyScale('hard')).toBe(1.25);
  });
});

describe('getConfigForDifficulty', () => {
  const baseConfig = {
    feedbackThresholds: {
      highVisibilityDelta: 8,
      highEfficiencyDelta: 8,
      highSustainabilityDelta: 8,
      highEarlyWarningDelta: 8,
      highComplexityDelta: 10,
      criticalComplexityAbsolute: 60,
      lowEarlyWarningDelta: 5,
      balancedGrowthMinDelta: 3,
      balancedGrowthMaxComplexity: 8,
    },
    tokenMechanics: {
      diminishingReturnsThreshold: 3,
      diminishingReturnsMultiplier: 0.5,
      iotSprawlThreshold: 12,
      iotSprawlPenaltyPerToken: 2,
    },
    unlockConditions: {
      complexityHighThreshold: 40,
    },
    disasters: [
      {
        id: 'ransomware_attack',
        round: 3,
        triggerMetric: 'complexity_risk' as keyof GameMetrics,
        threshold: 80,
        penalties: { efficiency_throughput: -20 },
        copyKey: 'disasters.ransomwareAttack',
        mitigatedBy: [],
      },
    ],
  };

  it('should apply easy difficulty token mechanics', () => {
    const config = getConfigForDifficulty(baseConfig, 'easy');
    expect(config.tokenMechanics.diminishingReturnsThreshold).toBe(4);
    expect(config.tokenMechanics.iotSprawlThreshold).toBe(14);
  });

  it('should apply hard difficulty token mechanics and add disasters', () => {
    const config = getConfigForDifficulty(baseConfig, 'hard');
    expect(config.tokenMechanics.diminishingReturnsThreshold).toBe(2);
    expect(config.tokenMechanics.iotSprawlThreshold).toBe(10);
    expect(config.disasters.length).toBeGreaterThan(baseConfig.disasters.length);
  });

  it('should preserve other config properties', () => {
    const config = getConfigForDifficulty(baseConfig, 'normal');
    expect(config.feedbackThresholds).toEqual(baseConfig.feedbackThresholds);
    expect(config.unlockConditions).toEqual(baseConfig.unlockConditions);
  });
});

describe('calculateRoundEffects (integration)', () => {
  const cards = [
    createMockCard('digitalTwin', { visibility_insight: 8, complexity_risk: 3 }),
    createMockCard('predictiveMaintenance', { early_warning_prevention: 6, complexity_risk: 2 }),
    createMockCard('gridSensors', { visibility_insight: 4, early_warning_prevention: 5, complexity_risk: 2 }),
  ];

  const synergies: SynergyConfig[] = [
    {
      id: 'visibility-maintenance',
      cards: ['digitalTwin', 'predictiveMaintenance', 'gridSensors'],
      nameKey: 'synergies.visibilityMaintenance.name',
      descriptionKey: 'synergies.visibilityMaintenance.description',
      bonusEffect: 'early_warning_prevention',
      bonusAmount: 2,
    },
  ];

  const config = {
    feedbackThresholds: {
      highVisibilityDelta: 8,
      highEfficiencyDelta: 8,
      highSustainabilityDelta: 8,
      highEarlyWarningDelta: 8,
      highComplexityDelta: 10,
      criticalComplexityAbsolute: 60,
      lowEarlyWarningDelta: 5,
      balancedGrowthMinDelta: 3,
      balancedGrowthMaxComplexity: 8,
    },
    tokenMechanics: defaultTokenMechanics,
    unlockConditions: { complexityHighThreshold: 40 },
    disasters: [] as DisasterConfig[],
  };

  it('should combine allocation effects and synergy bonuses', () => {
    const metrics = createMockMetrics();
    const allocations = { digitalTwin: 1, predictiveMaintenance: 1, gridSensors: 1 };

    const result = calculateRoundEffects(
      metrics,
      allocations,
      cards,
      config,
      synergies,
      1
    );

    // Base effects: visibility +12, early_warning +11, complexity +7
    // Synergy: min(1,1,1) * 2 = +2 early_warning
    expect(result.metricsAfter.visibility_insight).toBe(37); // 25 + 8 + 4
    expect(result.metricsAfter.early_warning_prevention).toBe(33); // 20 + 6 + 5 + 2
    expect(result.metricsAfter.complexity_risk).toBe(27); // 20 + 3 + 2 + 2
    expect(result.activeSynergies).toHaveLength(1);
  });

  it('should clamp metrics after applying all effects', () => {
    const metrics = createMockMetrics({ visibility_insight: 95 });
    const allocations = { digitalTwin: 3 }; // +24 visibility (with diminishing)

    const result = calculateRoundEffects(
      metrics,
      allocations,
      cards,
      config,
      synergies,
      1
    );

    expect(result.metricsAfter.visibility_insight).toBe(100); // Clamped
  });
});
