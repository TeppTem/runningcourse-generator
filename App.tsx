
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapComponent } from './components/MapComponent';
import { ControlPanel } from './components/ControlPanel';
import { findOptimalLoopRoute } from './services/mapService';
import type { GeneratedCourse, RouteStats, OptimalRouteData, LatLngLiteral } from './types';
import { DEFAULT_LATITUDE, DEFAULT_LONGITUDE, DEFAULT_ZOOM, DEFAULT_PACE_MIN_PER_KM } from './constants';

const App: React.FC = () => {
  const [isGoogleMapsApiLoaded, setIsGoogleMapsApiLoaded] = useState(false);
  const [currentMapCenter, setCurrentMapCenter] = useState<LatLngLiteral>({ lat: DEFAULT_LATITUDE, lng: DEFAULT_LONGITUDE });
  const [userStartPoint, setUserStartPoint] = useState<google.maps.LatLng | null>(null);
  const [desiredDistanceKm, setDesiredDistanceKm] = useState<number>(5);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const checkApiInterval = setInterval(() => {
      if (window.google && window.google.maps) {
        setIsGoogleMapsApiLoaded(true);
        clearInterval(checkApiInterval);
      }
    }, 100);
    return () => clearInterval(checkApiInterval);
  }, []);

  const initializeMapAndMarker = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Attempt to get user's current location first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentMapCenter(newCenter);
          const initialStartPoint = new window.google.maps.LatLng(newCenter.lat, newCenter.lng);
          setUserStartPoint(initialStartPoint);
          map.setCenter(newCenter);
          map.setZoom(DEFAULT_ZOOM + 2); // Zoom in a bit more for current location
        },
        () => { // Error or permission denied
          const defaultLatLng = new window.google.maps.LatLng(DEFAULT_LATITUDE, DEFAULT_LONGITUDE);
          setUserStartPoint(defaultLatLng);
          map.setCenter(defaultLatLng); // Fallback to default
        }
      );
    } else { // Geolocation not supported
      const defaultLatLng = new window.google.maps.LatLng(DEFAULT_LATITUDE, DEFAULT_LONGITUDE);
      setUserStartPoint(defaultLatLng);
      map.setCenter(defaultLatLng);
    }
  }, []);


  const handleMarkerDragEnd = useCallback((newPosition: google.maps.LatLng) => {
    setUserStartPoint(newPosition);
    setGeneratedCourse(null); // Clear previous course on marker move
    setError(null);
  }, []);

  const handleDistanceChange = useCallback((newDistance: number) => {
    setDesiredDistanceKm(newDistance);
  }, []);

  const handleGenerateCourse = useCallback(async () => {
    if (!userStartPoint) {
      setError("Please set a start point on the map.");
      return;
    }
    if (desiredDistanceKm <= 0) {
      setError("Please enter a valid distance greater than 0 km.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedCourse(null);

    try {
      const optimalRouteData: OptimalRouteData | null = await findOptimalLoopRoute(
        userStartPoint,
        desiredDistanceKm
      );

      if (optimalRouteData) {
        const estimatedTimeMin = optimalRouteData.distanceKm * DEFAULT_PACE_MIN_PER_KM;
        const stats: RouteStats = {
          totalDistanceKm: parseFloat(optimalRouteData.distanceKm.toFixed(1)),
          cumulativeElevationGainM: parseFloat(optimalRouteData.elevationGainM.toFixed(0)),
          estimatedTimeMin: parseFloat(estimatedTimeMin.toFixed(0)),
        };
        setGeneratedCourse({ directionsResult: optimalRouteData.route, stats });
        if (mapRef.current) {
           const bounds = optimalRouteData.route.routes[0].bounds;
           if (bounds) mapRef.current.fitBounds(bounds);
        }

      } else {
        setError("Could not find a suitable course. Try adjusting the distance or start point.");
      }
    } catch (err) {
      console.error("Course generation error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during course generation.");
    } finally {
      setIsLoading(false);
    }
  }, [userStartPoint, desiredDistanceKm]);

  const handleGoToCurrentLocation = useCallback(() => {
    if (navigator.geolocation && mapRef.current) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentMapCenter(newCenter);
          const newStartPoint = new window.google.maps.LatLng(newCenter.lat, newCenter.lng);
          setUserStartPoint(newStartPoint);
          if(mapRef.current) {
            mapRef.current.panTo(newCenter);
            mapRef.current.setZoom(DEFAULT_ZOOM + 2);
          }
          setGeneratedCourse(null); // Clear course
          setError(null);
          setIsLoading(false);
        },
        (err) => {
          setError("Could not get current location: " + err.message);
          setIsLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser or map not ready.");
    }
  }, []);
  
  if (!isGoogleMapsApiLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-800 text-white">
        <div className="text-center p-4">
          <svg className="mx-auto h-12 w-12 animate-spin text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg">Loading Map API...</p>
          <p className="text-sm text-gray-400">
            Please ensure the <code>{'{{GOOGLE_MAPS_API_KEY}}'}</code> placeholder in <code>index.html</code> 
            is replaced with your valid Google Maps API key.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This key should ideally be injected from an environment variable during your build/deployment process.
            Also, ensure you have installed <code>@types/google.maps</code> if you haven't already.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen font-sans">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">Running Course Generator</h1>
      </header>
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/3 lg:w-1/4 p-4 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <ControlPanel
            desiredDistanceKm={desiredDistanceKm}
            onDistanceChange={handleDistanceChange}
            onGenerateCourse={handleGenerateCourse}
            generatedStats={generatedCourse?.stats ?? null}
            isLoading={isLoading}
            error={error}
          />
        </div>
        <div className="flex-grow h-64 md:h-full relative">
          <MapComponent
            center={currentMapCenter}
            zoom={DEFAULT_ZOOM}
            startPoint={userStartPoint}
            onMarkerDragEnd={handleMarkerDragEnd}
            routeResult={generatedCourse?.directionsResult ?? null}
            onMapLoad={initializeMapAndMarker}
            onGoToCurrentLocation={handleGoToCurrentLocation}
          />
        </div>
      </main>
    </div>
  );
};

export default App;