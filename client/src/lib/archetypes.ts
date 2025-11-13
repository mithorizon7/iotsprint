import { GameMetrics, ArchetypeId } from '@shared/schema';

export function classifyArchetype(metrics: GameMetrics): ArchetypeId {
  const {
    visibility_insight,
    efficiency_throughput,
    sustainability_emissions,
    early_warning_prevention,
    complexity_risk,
  } = metrics;

  // Calculate relative strengths
  const scores = {
    visibility: visibility_insight,
    efficiency: efficiency_throughput,
    sustainability: sustainability_emissions,
    earlyWarning: early_warning_prevention,
    resilience: Math.max(0, early_warning_prevention - complexity_risk * 0.5),
  };

  // Find dominant metric
  const maxScore = Math.max(
    scores.visibility,
    scores.efficiency,
    scores.sustainability,
    scores.earlyWarning
  );

  // Check for over-connected risk-taker
  if (complexity_risk > 55 && early_warning_prevention < 40) {
    return 'OVER_CONNECTED_RISK_TAKER';
  }

  // Check for balanced approach
  const allScoresHigh = Object.values(scores).filter(s => s >= 45).length >= 3;
  const variance = calculateVariance([
    scores.visibility,
    scores.efficiency,
    scores.sustainability,
    scores.earlyWarning,
  ]);

  if (allScoresHigh && variance < 200) {
    return 'BALANCED_ARCHITECT';
  }

  // Determine primary focus
  if (scores.sustainability === maxScore && scores.sustainability >= 50) {
    return 'SUSTAINABILITY_CHAMPION';
  }

  if (scores.efficiency === maxScore && scores.efficiency >= 50) {
    return 'EFFICIENCY_FIRST';
  }

  if (scores.earlyWarning === maxScore && scores.earlyWarning >= 45) {
    return 'EARLY_WARNING_GUARDIAN';
  }

  if (scores.visibility === maxScore && scores.visibility >= 50) {
    return 'VISIBILITY_FOCUSED';
  }

  // Default to balanced
  return 'BALANCED_ARCHITECT';
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
}
