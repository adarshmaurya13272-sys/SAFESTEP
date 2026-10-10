export function haversine(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3; // metres
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function pointToSegmentDistance(
  point: { lat: number; lng: number },
  v: { lat: number; lng: number },
  w: { lat: number; lng: number }
): number {
  const l2 =
    Math.pow(w.lat - v.lat, 2) + Math.pow(w.lng - v.lng, 2);
  if (l2 == 0) return haversine(point, v);
  let t =
    ((point.lat - v.lat) * (w.lat - v.lat) +
      (point.lng - v.lng) * (w.lng - v.lng)) /
    l2;
  t = Math.max(0, Math.min(1, t));
  const projection = {
    lat: v.lat + t * (w.lat - v.lat),
    lng: v.lng + t * (w.lng - v.lng),
  };
  return haversine(point, projection);
}

export function pointToPolylineDistance(
  point: { lat: number; lng: number },
  polyline: [number, number][]
): number {
  let minDistance = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const v = { lat: polyline[i]![0], lng: polyline[i]![1] };
    const w = { lat: polyline[i + 1]![0], lng: polyline[i + 1]![1] };
    const dist = pointToSegmentDistance(point, v, w);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }
  return minDistance;
}

export function sampleAlongPolyline(
  polyline: [number, number][],
  intervalM: number
): { lat: number; lng: number }[] {
  if (polyline.length === 0) return [];
  if (polyline.length === 1) return [{ lat: polyline[0]![0], lng: polyline[0]![1] }];

  const samples: { lat: number; lng: number }[] = [];
  samples.push({ lat: polyline[0]![0], lng: polyline[0]![1] });

  let distanceSinceLastSample = 0;

  for (let i = 0; i < polyline.length - 1; i++) {
    const p1 = { lat: polyline[i]![0], lng: polyline[i]![1] };
    const p2 = { lat: polyline[i + 1]![0], lng: polyline[i + 1]![1] };
    const segmentLength = haversine(p1, p2);

    let remainingSegment = segmentLength;
    let currentPos = p1;

    while (distanceSinceLastSample + remainingSegment >= intervalM) {
      const distanceToNextSample = intervalM - distanceSinceLastSample;
      const ratio = distanceToNextSample / remainingSegment;
      const sample = {
        lat: currentPos.lat + (p2.lat - currentPos.lat) * ratio,
        lng: currentPos.lng + (p2.lng - currentPos.lng) * ratio,
      };
      samples.push(sample);
      currentPos = sample;
      remainingSegment -= distanceToNextSample;
      distanceSinceLastSample = 0;
    }
    distanceSinceLastSample += remainingSegment;
  }

  return samples;
}

export function roundCoords(lat: number, lng: number, gridM: number): { lat: number; lng: number } {
  const degreesPerMeterLat = 1 / 111111;
  const degreesPerMeterLng = 1 / (111111 * Math.cos(lat * (Math.PI / 180)));
  
  const gridDegLat = gridM * degreesPerMeterLat;
  const gridDegLng = gridM * degreesPerMeterLng;

  return {
    lat: Math.round(lat / gridDegLat) * gridDegLat,
    lng: Math.round(lng / gridDegLng) * gridDegLng,
  };
}

export function isPointNearPolyline(
  point: { lat: number; lng: number },
  polyline: [number, number][],
  thresholdM: number
): boolean {
  return pointToPolylineDistance(point, polyline) <= thresholdM;
}

export function decodePoly(encoded: string): [number, number][] {
  let points: [number, number][] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}
