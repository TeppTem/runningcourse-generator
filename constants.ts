
// Default latitude and longitude (Tokyo as a fallback if geolocation fails or is denied)
export const DEFAULT_LATITUDE = 35.6895;
export const DEFAULT_LONGITUDE = 139.6917;
export const DEFAULT_ZOOM = 12;

// Assumed average running pace for time estimation
export const DEFAULT_PACE_MIN_PER_KM = 6; // minutes per kilometer

// Number of candidate directions to explore for intermediate points
// More points might find better routes but increase API calls and processing time.
export const NUM_INTERMEDIATE_POINT_CANDIDATES = 8;

// Factor of desired total distance to determine the straight-line radius for finding intermediate points.
// e.g., 0.4 means the intermediate point is roughly at a straight-line distance of 40% of the total desired route length
// from the start point. This helps in forming a loop.
export const INTERMEDIATE_POINT_RADIUS_FACTOR = 0.4;

// Tolerance for how closely the generated route's distance should match the user's desired distance.
// e.g., 0.25 means the route distance can be +/- 25% of the desired distance.
export const DISTANCE_TOLERANCE_FACTOR = 0.25;

// Number of samples to request along the path for the Elevation API.
// More samples give more accurate elevation profiles but are limited by the API (max 512).
export const ELEVATION_SAMPLES = 128;

// Earth's radius in kilometers, used for some spherical calculations if needed (though google.maps.geometry.spherical handles most)
export const EARTH_RADIUS_KM = 6371;