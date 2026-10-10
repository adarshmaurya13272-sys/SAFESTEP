import { haversine, sampleAlongPolyline } from '../geo/geo';

export interface SafetyScoreParams {
  routeGeometry: [number, number][];
  departureTime: Date;
  incidents: Array<{ lat: number; lng: number; severity: string; createdAt: Date }>;
  helpPoints: Array<{ lat: number; lng: number; type: string }>;
  activityPoints: Array<{ lat: number; lng: number }>;
  environmentData: Array<{ lat: number; lng: number; type: 'poor_lighting' | 'road_type'; value?: string }>;
}

export interface SafetyScoreResult {
  score: number;
  confidence: 'low' | 'medium' | 'high';
  factors: any[];
}

export function calculateSafetyScore(params: SafetyScoreParams): SafetyScoreResult {
  if (params.routeGeometry.length === 0) {
    return { score: 100, confidence: 'low', factors: [] };
  }

  const samples = sampleAlongPolyline(params.routeGeometry, 100);
  if (samples.length === 0) {
    return { score: 100, confidence: 'low', factors: [] };
  }

  const isNight = params.departureTime.getHours() >= 20 || params.departureTime.getHours() < 5;
  
  let weights = {
    incident: 35,
    help: 25,
    activity: 20,
    environment: 10,
    time: 10
  };

  if (isNight) {
    weights.incident = 40;
    weights.environment = 15;
    weights.time = 0; // consumed
  }

  const factorsData = {
    hasIncidents: params.incidents.length > 0,
    hasHelp: params.helpPoints.length > 0,
    hasActivity: params.activityPoints.length > 0,
    hasEnv: params.environmentData.length > 0,
  };

  let totalWeight = 0;
  if (factorsData.hasIncidents) totalWeight += weights.incident;
  if (factorsData.hasHelp) totalWeight += weights.help;
  if (factorsData.hasActivity) totalWeight += weights.activity;
  if (factorsData.hasEnv) totalWeight += weights.environment;

  if (totalWeight === 0) {
    return { score: 50, confidence: 'low', factors: [] };
  }

  // Time applies to every route, so its weight always counts.
  // At night the time factor scores 0, which lowers the total score.
  totalWeight += weights.time;
  const timeScore = isNight ? 0 : 100;

  if (totalWeight === 0) {
    return { score: 50, confidence: 'low', factors: [] };
  }

  // Calculate incident score (0-100, 100 is good)
  let incidentScore = 100;
  if (factorsData.hasIncidents) {
    let incidentPenalty = 0;
    for (const sample of samples) {
      for (const inc of params.incidents) {
        const dist = haversine(sample, inc);
        if (dist <= 150) {
          let sevWeight = 1;
          if (inc.severity === 'MEDIUM') sevWeight = 2;
          if (inc.severity === 'HIGH') sevWeight = 3;

          const daysOld = (new Date().getTime() - inc.createdAt.getTime()) / (1000 * 3600 * 24);
          const decay = Math.exp(-daysOld / 90);
          incidentPenalty += sevWeight * decay;
        }
      }
    }
    incidentScore = Math.max(0, 100 - (incidentPenalty / samples.length) * 50);
  } else {
    incidentScore = 100;
  }

  // Calculate help score
  let helpScore = 100;
  if (factorsData.hasHelp) {
    let helpSamples = 0;
    for (const sample of samples) {
      const nearHelp = params.helpPoints.some(hp => haversine(sample, hp) <= 500);
      if (nearHelp) helpSamples++;
    }
    helpScore = (helpSamples / samples.length) * 100;
  }

  // Calculate activity score
  let activityScore = 100;
  if (factorsData.hasActivity) {
    let activeSamples = 0;
    for (const sample of samples) {
      const nearActivity = params.activityPoints.some(ap => haversine(sample, ap) <= 200);
      if (nearActivity) activeSamples++;
    }
    activityScore = (activeSamples / samples.length) * 100;
  }

  // Environment score
  let envScore = 100;
  if (factorsData.hasEnv) {
    let poorLightingSamples = 0;
    for (const sample of samples) {
      const nearPoorLight = params.environmentData.some(env => env.type === 'poor_lighting' && haversine(sample, env) <= 150);
      if (nearPoorLight) poorLightingSamples++;
    }
    envScore = Math.max(0, 100 - (poorLightingSamples / samples.length) * 100);
  }

  let finalScore = 0;
  if (factorsData.hasIncidents) finalScore += incidentScore * (weights.incident / totalWeight);
  if (factorsData.hasHelp) finalScore += helpScore * (weights.help / totalWeight);
  if (factorsData.hasActivity) finalScore += activityScore * (weights.activity / totalWeight);
  if (factorsData.hasEnv) finalScore += envScore * (weights.environment / totalWeight);
  finalScore += timeScore * (weights.time / totalWeight);

  const availableFactorsCount = Object.values(factorsData).filter(Boolean).length;
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (availableFactorsCount >= 4) confidence = 'high';
  else if (availableFactorsCount >= 2) confidence = 'medium';

  return {
    score: Math.round(finalScore),
    confidence,
    factors: [
      { 
        name: 'incident', 
        score: incidentScore,
        weight: (weights.incident / totalWeight) * 100 || 0,
        dataAvailable: factorsData.hasIncidents,
        description: factorsData.hasIncidents ? `${params.incidents.length} reported incident(s) nearby` : "No incident data available"
      },
      { 
        name: 'help', 
        score: helpScore,
        weight: (weights.help / totalWeight) * 100 || 0,
        dataAvailable: factorsData.hasHelp,
        description: factorsData.hasHelp ? `${params.helpPoints.length} help point(s) within 500m of the route` : "No help points nearby"
      },
      { 
        name: 'activity', 
        score: activityScore,
        weight: (weights.activity / totalWeight) * 100 || 0,
        dataAvailable: factorsData.hasActivity,
        description: factorsData.hasActivity ? "Sufficient activity indicators along route" : "Limited data available for activity indicators"
      },
      {
        name: 'environment',
        score: envScore,
        weight: (weights.environment / totalWeight) * 100 || 0,
        dataAvailable: factorsData.hasEnv,
        description: factorsData.hasEnv ? "Environment conditions (e.g. poor lighting) detected" : (isNight ? "Night time increases caution factors" : "No adverse environment conditions detected")
      },
      {
        name: 'time',
        score: timeScore,
        weight: (weights.time / totalWeight) * 100 || 0,
        dataAvailable: true,
        description: isNight ? "Travelling at night increases overall risk" : "Daytime travel"
      },
    ]
  };
}
