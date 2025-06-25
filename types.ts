// This file will now rely on global.d.ts for Google Maps types.

export interface RouteStats {
  totalDistanceKm: number;
  cumulativeElevationGainM: number;
  estimatedTimeMin: number;
}

export interface GeneratedCourse {
  directionsResult: google.maps.DirectionsResult;
  stats: RouteStats;
}

// Result from mapService containing the core route data
export interface OptimalRouteData {
  route: google.maps.DirectionsResult;
  distanceKm: number;
  elevationGainM: number;
}

export interface LatLngLiteral {
  lat: number;
  lng: number;
}