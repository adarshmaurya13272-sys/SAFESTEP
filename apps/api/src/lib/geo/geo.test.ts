import { describe, it, expect } from 'vitest';
import {
  haversine,
  pointToPolylineDistance,
  sampleAlongPolyline,
  roundCoords,
  isPointNearPolyline,
  decodePoly
} from './geo';

describe('geo', () => {
  it('calculates haversine distance correctly', () => {
    const p1 = { lat: 28.6139, lng: 77.2090 };
    const p2 = { lat: 28.6149, lng: 77.2090 };
    const d = haversine(p1, p2);
    expect(d).toBeCloseTo(111.19, 0); // approx 111m for 0.001 deg lat
  });

  it('calculates pointToPolylineDistance correctly', () => {
    const polyline: [number, number][] = [[0, 0], [0, 10]];
    const point = { lat: 0, lng: 5 };
    const d = pointToPolylineDistance(point, polyline);
    expect(d).toBeCloseTo(0, 5);
  });

  it('samples along polyline correctly', () => {
    const p1 = [28.6139, 77.2090] as [number, number];
    const p2 = [28.6239, 77.2090] as [number, number]; // approx 1111m north
    const samples = sampleAlongPolyline([p1, p2], 100);
    expect(samples.length).toBeGreaterThan(10);
    expect(samples.length).toBeLessThan(15);
  });

  it('rounds coords correctly', () => {
    const rounded = roundCoords(28.61395, 77.20905, 50);
    expect(rounded.lat).toBeCloseTo(28.613, 1);
  });

  it('checks if point is near polyline', () => {
    const polyline: [number, number][] = [[28.6139, 77.2090], [28.6239, 77.2090]];
    const pointNear = { lat: 28.6150, lng: 77.2090 }; // directly on it
    const pointFar = { lat: 28.6150, lng: 77.2500 };
    expect(isPointNearPolyline(pointNear, polyline, 50)).toBe(true);
    expect(isPointNearPolyline(pointFar, polyline, 50)).toBe(false);
  });

  it('decodes polyline', () => {
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    const decoded = decodePoly(encoded);
    expect(decoded.length).toBe(3);
  });
});
