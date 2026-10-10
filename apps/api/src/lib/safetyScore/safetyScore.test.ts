import { describe, it, expect } from 'vitest';
import { calculateSafetyScore } from './safetyScore';

describe('safetyScore', () => {
  const routeGeometry: [number, number][] = [[0, 0], [0, 0.01]]; // approx 1km
  const defaultTime = new Date('2023-01-01T12:00:00Z'); // noon
  
  it('perfect route gives high score', () => {
    const result = calculateSafetyScore({
      routeGeometry,
      departureTime: defaultTime,
      incidents: [],
      helpPoints: [{ lat: 0, lng: 0.005, type: 'police' }],
      activityPoints: [],
      environmentData: []
    });
    // One help point mid-route covers most (not all) samples within 500m
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('dangerous route gives low score', () => {
    const result = calculateSafetyScore({
      routeGeometry,
      departureTime: defaultTime,
      incidents: [
        { lat: 0, lng: 0.002, severity: 'HIGH', createdAt: new Date() },
        { lat: 0, lng: 0.004, severity: 'HIGH', createdAt: new Date() },
        { lat: 0, lng: 0.006, severity: 'HIGH', createdAt: new Date() },
      ],
      helpPoints: [],
      activityPoints: [],
      environmentData: []
    });
    expect(result.score).toBeLessThan(50);
  });

  it('no data gives score with low confidence', () => {
    const result = calculateSafetyScore({
      routeGeometry,
      departureTime: defaultTime,
      incidents: [], helpPoints: [], activityPoints: [], environmentData: []
    });
    expect(result.confidence).toBe('low');
    expect(result.score).toBe(50);
  });

  it('all factors present gives high confidence', () => {
    const result = calculateSafetyScore({
      routeGeometry,
      departureTime: defaultTime,
      incidents: [{ lat: 0, lng: 0.002, severity: 'LOW', createdAt: new Date() }],
      helpPoints: [{ lat: 0, lng: 0.005, type: 'police' }],
      activityPoints: [{ lat: 0, lng: 0.008 }],
      environmentData: [{ lat: 0, lng: 0.001, type: 'poor_lighting' }]
    });
    expect(result.confidence).toBe('high');
  });

  it('night time increases incident weight', () => {
    const nightTime = new Date('2023-01-01T22:00:00Z'); // 10 PM
    const resultNight = calculateSafetyScore({
      routeGeometry,
      departureTime: nightTime,
      incidents: [{ lat: 0, lng: 0.005, severity: 'HIGH', createdAt: new Date() }],
      helpPoints: [], activityPoints: [], environmentData: []
    });
    // With only incidents, incident weight is 100%. So the score is just the incident score.
    // We need another factor to see the relative weight change.
    const resultDay = calculateSafetyScore({
      routeGeometry,
      departureTime: defaultTime,
      incidents: [{ lat: 0, lng: 0.005, severity: 'HIGH', createdAt: new Date() }],
      helpPoints: [{ lat: 10, lng: 10, type: 'police' }], // far away, helpScore=0
      activityPoints: [], environmentData: []
    });
    
    const resultNight2 = calculateSafetyScore({
      routeGeometry,
      departureTime: nightTime,
      incidents: [{ lat: 0, lng: 0.005, severity: 'HIGH', createdAt: new Date() }],
      helpPoints: [{ lat: 10, lng: 10, type: 'police' }], 
      activityPoints: [], environmentData: []
    });
    
    expect(resultNight2.score).toBeLessThan(resultDay.score);
  });

  it('day time normal weights', () => {
    const result = calculateSafetyScore({
      routeGeometry,
      departureTime: defaultTime,
      incidents: [{ lat: 0, lng: 0.005, severity: 'HIGH', createdAt: new Date() }],
      helpPoints: [{ lat: 10, lng: 10, type: 'police' }], 
      activityPoints: [], environmentData: []
    });
    expect(result.score).toBeGreaterThan(0);
  });

  it('old incidents have less impact', () => {
    const recent = calculateSafetyScore({
      routeGeometry, departureTime: defaultTime,
      incidents: [{ lat: 0, lng: 0.005, severity: 'HIGH', createdAt: new Date() }],
      helpPoints: [], activityPoints: [], environmentData: []
    });
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 180); // 180 days old
    const old = calculateSafetyScore({
      routeGeometry, departureTime: defaultTime,
      incidents: [{ lat: 0, lng: 0.005, severity: 'HIGH', createdAt: oldDate }],
      helpPoints: [], activityPoints: [], environmentData: []
    });
    expect(old.score).toBeGreaterThan(recent.score);
  });

  it('severe incidents lower score more', () => {
    const severe = calculateSafetyScore({
      routeGeometry, departureTime: defaultTime,
      incidents: [{ lat: 0, lng: 0.005, severity: 'HIGH', createdAt: new Date() }],
      helpPoints: [], activityPoints: [], environmentData: []
    });
    const light = calculateSafetyScore({
      routeGeometry, departureTime: defaultTime,
      incidents: [{ lat: 0, lng: 0.005, severity: 'LOW', createdAt: new Date() }],
      helpPoints: [], activityPoints: [], environmentData: []
    });
    expect(severe.score).toBeLessThan(light.score);
  });

  it('more help points improve score', () => {
    const fewHelp = calculateSafetyScore({
      routeGeometry, departureTime: defaultTime,
      incidents: [], helpPoints: [{ lat: 0, lng: 0.001, type: 'police' }], activityPoints: [], environmentData: []
    });
    const manyHelp = calculateSafetyScore({
      routeGeometry, departureTime: defaultTime,
      incidents: [], helpPoints: [
        { lat: 0, lng: 0.001, type: 'police' },
        { lat: 0, lng: 0.005, type: 'police' },
        { lat: 0, lng: 0.009, type: 'police' }
      ], activityPoints: [], environmentData: []
    });
    expect(manyHelp.score).toBeGreaterThan(fewHelp.score);
  });

  it('missing activity data re-normalizes', () => {
    const result = calculateSafetyScore({
      routeGeometry, departureTime: defaultTime,
      incidents: [{ lat: 0, lng: 0.005, severity: 'LOW', createdAt: new Date() }],
      helpPoints: [{ lat: 0, lng: 0.005, type: 'police' }],
      activityPoints: [], environmentData: []
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.confidence).toBe('medium');
  });

  it('single route point', () => {
    const result = calculateSafetyScore({
      routeGeometry: [[0, 0]], departureTime: defaultTime,
      incidents: [], helpPoints: [], activityPoints: [], environmentData: []
    });
    // Degenerate route with no data behaves like the no-data rule
    expect(result.score).toBe(50);
    expect(result.confidence).toBe('low');
  });

  it('empty route handles gracefully', () => {
    const result = calculateSafetyScore({
      routeGeometry: [], departureTime: defaultTime,
      incidents: [], helpPoints: [], activityPoints: [], environmentData: []
    });
    expect(result.score).toBe(100);
    expect(result.confidence).toBe('low');
  });

  it('route with all help but all incidents -> balanced score', () => {
    const result = calculateSafetyScore({
      routeGeometry, departureTime: defaultTime,
      incidents: [
        { lat: 0, lng: 0.005, severity: 'HIGH', createdAt: new Date() },
        { lat: 0, lng: 0.006, severity: 'HIGH', createdAt: new Date() }
      ],
      helpPoints: [
        { lat: 0, lng: 0.005, type: 'police' },
        { lat: 0, lng: 0.006, type: 'hospital' }
      ],
      activityPoints: [], environmentData: []
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
    expect(result.confidence).toBe('medium');
  });

  it('different confidence levels', () => {
    const r1 = calculateSafetyScore({
      routeGeometry, departureTime: defaultTime,
      incidents: [{ lat: 0, lng: 0.005, severity: 'LOW', createdAt: new Date() }],
      helpPoints: [], activityPoints: [], environmentData: []
    });
    expect(r1.confidence).toBe('low');

    const r2 = calculateSafetyScore({
      routeGeometry, departureTime: defaultTime,
      incidents: [{ lat: 0, lng: 0.005, severity: 'LOW', createdAt: new Date() }],
      helpPoints: [{ lat: 0, lng: 0.005, type: 'police' }],
      activityPoints: [], environmentData: []
    });
    expect(r2.confidence).toBe('medium');

    const r4 = calculateSafetyScore({
      routeGeometry, departureTime: defaultTime,
      incidents: [{ lat: 0, lng: 0.005, severity: 'LOW', createdAt: new Date() }],
      helpPoints: [{ lat: 0, lng: 0.005, type: 'police' }],
      activityPoints: [{ lat: 0, lng: 0.005 }],
      environmentData: [{ lat: 0, lng: 0.005, type: 'poor_lighting' }]
    });
    expect(r4.confidence).toBe('high');
  });
});
