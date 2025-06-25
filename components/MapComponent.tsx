
import React, { useEffect, useRef } from 'react';
import type { LatLngLiteral } from '../types';

interface MapComponentProps {
  center: LatLngLiteral;
  zoom: number;
  startPoint: google.maps.LatLng | null;
  onMarkerDragEnd: (position: google.maps.LatLng) => void;
  routeResult: google.maps.DirectionsResult | null;
  onMapLoad: (map: google.maps.Map) => void;
  onGoToCurrentLocation: () => void;
}

const LocationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
  </svg>
);


export const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom,
  startPoint,
  onMarkerDragEnd,
  routeResult,
  onMapLoad,
  onGoToCurrentLocation,
}) => {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const startMarkerRef = useRef<google.maps.Marker | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Initialize map
  useEffect(() => {
    if (mapDivRef.current && window.google && window.google.maps && !mapInstanceRef.current) {
      const map = new window.google.maps.Map(mapDivRef.current, {
        center: center,
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;
      onMapLoad(map);
    }
  }, [center, zoom, onMapLoad]);

  // Update map center when prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
        // Only pan if the center is significantly different to avoid jitter during initial load
        const currentMapCenter = mapInstanceRef.current.getCenter();
        if (currentMapCenter && (Math.abs(currentMapCenter.lat() - center.lat) > 0.0001 || Math.abs(currentMapCenter.lng() - center.lng) > 0.0001)) {
            mapInstanceRef.current.panTo(center);
        }
    }
  }, [center]);


  // Manage start marker
  useEffect(() => {
    if (mapInstanceRef.current && window.google) {
      // Clear existing marker
      if (startMarkerRef.current) {
        startMarkerRef.current.setMap(null);
        google.maps.event.clearInstanceListeners(startMarkerRef.current); // Clear listeners
      }

      if (startPoint) {
        const marker = new window.google.maps.Marker({
          position: startPoint,
          map: mapInstanceRef.current,
          draggable: true,
          title: "Start/End Point",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4", // Google Blue
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }
        });
        marker.addListener('dragend', () => {
          const newPosition = marker.getPosition();
          if (newPosition) {
            onMarkerDragEnd(newPosition);
          }
        });
        startMarkerRef.current = marker;
      }
    }
  }, [startPoint, onMarkerDragEnd]);

  // Manage directions renderer
  useEffect(() => {
    if (mapInstanceRef.current && window.google) {
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            polylineOptions: {
              strokeColor: '#FF0000', // Bright red for visibility
              strokeOpacity: 0.8,
              strokeWeight: 6,
            },
            markerOptions: { // Hide default A/B markers from DirectionsRenderer
                suppressMarkers: true,
            }
        });
      }
      
      directionsRendererRef.current.setMap(mapInstanceRef.current);

      if (routeResult) {
        directionsRendererRef.current.setDirections(routeResult);
      } else {
        // Clear previous route if routeResult is null
        directionsRendererRef.current.setDirections({routes: []} as google.maps.DirectionsResult);
      }
    }
  }, [routeResult]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapDivRef} className="w-full h-full map-container-full" />
      <button
        onClick={onGoToCurrentLocation}
        title="Go to my current location"
        className="absolute top-4 left-4 z-10 bg-white p-2 rounded-md shadow-lg hover:bg-gray-100 transition-colors"
      >
        <LocationIcon className="w-6 h-6 text-blue-600" />
      </button>
    </div>
  );
};
