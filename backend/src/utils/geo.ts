export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// Convert PostGIS geography ST_AsGeoJSON / binary point or array to lat/lng
export function parseGeoPoint(pointStr: any): GeoCoordinates | null {
  if (!pointStr) return null;
  try {
    if (typeof pointStr === 'object' && pointStr.coordinates) {
      return {
        longitude: pointStr.coordinates[0],
        latitude: pointStr.coordinates[1],
      };
    }
    if (typeof pointStr === 'string' && pointStr.startsWith('{')) {
      const parsed = JSON.parse(pointStr);
      if (parsed.coordinates) {
        return {
          longitude: parsed.coordinates[0],
          latitude: parsed.coordinates[1],
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}
