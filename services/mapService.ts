
import type { OptimalRouteData } from '../types';
import { NUM_INTERMEDIATE_POINT_CANDIDATES, INTERMEDIATE_POINT_RADIUS_FACTOR, DISTANCE_TOLERANCE_FACTOR, ELEVATION_SAMPLES } from '../constants';

// Helper to calculate LatLng for an intermediate point
function calculateIntermediatePoint(
  startPoint: google.maps.LatLng,
  angleDegrees: number,
  distanceMeters: number
): google.maps.LatLng | null {
  if (window.google && window.google.maps && window.google.maps.geometry) {
    return window.google.maps.geometry.spherical.computeOffset(startPoint, distanceMeters, angleDegrees);
  }
  return null; // Should not happen if API is loaded
}

// Helper to calculate cumulative elevation gain
function calculateCumulativeElevation(elevations: google.maps.ElevationResult[]): number {
  let gain = 0;
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i].elevation - elevations[i - 1].elevation;
    if (diff > 0) {
      gain += diff;
    }
  }
  return gain;
}

export const findOptimalLoopRoute = async (
  startPoint: google.maps.LatLng,
  desiredDistanceKm: number
): Promise<OptimalRouteData | null> => {
  if (!window.google || !window.google.maps) {
    throw new Error("Google Maps API not loaded.");
  }

  const directionsService = new window.google.maps.DirectionsService();
  const elevationService = new window.google.maps.ElevationService();
  const intermediateDistanceMeters = desiredDistanceKm * INTERMEDIATE_POINT_RADIUS_FACTOR * 1000;

  const candidatePromises: Promise<OptimalRouteData | null>[] = [];

  for (let i = 0; i < NUM_INTERMEDIATE_POINT_CANDIDATES; i++) {
    const angle = (360 / NUM_INTERMEDIATE_POINT_CANDIDATES) * i;
    const intermediateGeoPoint = calculateIntermediatePoint(startPoint, angle, intermediateDistanceMeters);

    if (!intermediateGeoPoint) continue;

    const request: google.maps.DirectionsRequest = {
      origin: startPoint,
      destination: startPoint,
      waypoints: [{ location: intermediateGeoPoint, stopover: true }],
      travelMode: google.maps.TravelMode.WALKING,
      provideRouteAlternatives: false, // Simpler to handle one route per request
    };

    const promise = new Promise<OptimalRouteData | null>((resolve) => {
      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result && result.routes && result.routes.length > 0) {
          const route = result.routes[0];
          const actualDistanceMeters = route.legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
          
          if (actualDistanceMeters === 0) {
             resolve(null); // Ignore zero distance routes
             return;
          }

          const pathForElevation = route.overview_path;
          if (pathForElevation.length < 2) { // Need at least 2 points for elevation
             resolve(null);
             return;
          }
          
          elevationService.getElevationForPath(
            { path: pathForElevation, samples: Math.min(ELEVATION_SAMPLES, pathForElevation.length) },
            (elevationResults, elevationStatus) => {
              if (elevationStatus === google.maps.ElevationStatus.OK && elevationResults) {
                const elevationGainM = calculateCumulativeElevation(elevationResults);
                resolve({
                  route: result, // Store the original DirectionsResult
                  distanceKm: actualDistanceMeters / 1000,
                  elevationGainM: elevationGainM,
                });
              } else {
                console.warn(`Elevation query failed for a route: ${elevationStatus}`);
                resolve(null); // Failed to get elevation
              }
            }
          );
        } else {
          if (status !== google.maps.DirectionsStatus.ZERO_RESULTS) {
             console.warn(`Directions request failed: ${status}`);
          }
          resolve(null); // No route found or error
        }
      });
    });
    candidatePromises.push(promise);
  }

  const results = await Promise.allSettled(candidatePromises);
  const validRoutes: OptimalRouteData[] = results
    .filter((result): result is PromiseFulfilledResult<OptimalRouteData | null> => result.status === 'fulfilled' && result.value !== null)
    .map(result => result.value as OptimalRouteData); // Type assertion after filter

  if (validRoutes.length === 0) {
    return null;
  }

  // Selection logic:
  // 1. Filter routes within a distance tolerance.
  // 2. From these, pick the one with the lowest elevation gain.
  // 3. If none in tolerance, pick the overall closest distance route with reasonable elevation.

  const minDesiredKm = desiredDistanceKm * (1 - DISTANCE_TOLERANCE_FACTOR);
  const maxDesiredKm = desiredDistanceKm * (1 + DISTANCE_TOLERANCE_FACTOR);

  const routesInTolerance = validRoutes.filter(
    (r) => r.distanceKm >= minDesiredKm && r.distanceKm <= maxDesiredKm
  );

  if (routesInTolerance.length > 0) {
    routesInTolerance.sort((a, b) => {
      // Prioritize lower elevation gain
      if (a.elevationGainM !== b.elevationGainM) {
        return a.elevationGainM - b.elevationGainM;
      }
      // Then, closer to desired distance
      return Math.abs(a.distanceKm - desiredDistanceKm) - Math.abs(b.distanceKm - desiredDistanceKm);
    });
    return routesInTolerance[0];
  } else {
    // If no routes in tolerance, pick the one closest to the desired distance overall
    validRoutes.sort((a, b) => {
       // Prioritize closer to desired distance
      const distDiffA = Math.abs(a.distanceKm - desiredDistanceKm);
      const distDiffB = Math.abs(b.distanceKm - desiredDistanceKm);
      if (distDiffA !== distDiffB) {
        return distDiffA - distDiffB;
      }
       // Then, lower elevation gain
      return a.elevationGainM - b.elevationGainM;
    });
    return validRoutes.length > 0 ? validRoutes[0] : null;
  }
};
