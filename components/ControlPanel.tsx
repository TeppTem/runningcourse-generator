
import React from 'react';
import type { RouteStats } from '../types';
import { Button } from './ui/Button';

interface ControlPanelProps {
  desiredDistanceKm: number;
  onDistanceChange: (distance: number) => void;
  onGenerateCourse: () => void;
  generatedStats: RouteStats | null;
  isLoading: boolean;
  error: string | null;
}

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
    {children}
  </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${props.className || ''}`}
  />
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  desiredDistanceKm,
  onDistanceChange,
  onGenerateCourse,
  generatedStats,
  isLoading,
  error,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow float numbers, prevent negative, handle empty string
    if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0) ) {
        onDistanceChange(value === '' ? 0 : parseFloat(value));
    } else if (/^\d+$/.test(value) && parseFloat(value) >= 0) { // for whole numbers
        onDistanceChange(parseFloat(value));
    }
  };


  return (
    <div className="space-y-6 p-2">
      <div>
        <Label htmlFor="distance">希望の距離 (km) / Desired Distance (km)</Label>
        <Input
          type="number"
          id="distance"
          name="distance"
          value={desiredDistanceKm === 0 && isLoading ? '' : desiredDistanceKm.toString()} // Show empty or actual val
          onChange={handleInputChange}
          min="0.1"
          step="0.1"
          placeholder="例: 5.5"
          disabled={isLoading}
        />
      </div>

      <Button
        onClick={onGenerateCourse}
        disabled={isLoading || desiredDistanceKm <=0}
        className="w-full"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </div>
        ) : (
          "この条件でコースを作成 / Create Course"
        )}
      </Button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {generatedStats && !isLoading && !error && (
        <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-green-800 mb-3">Generated Course Details:</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-medium">総距離 / Total Distance:</span> {generatedStats.totalDistanceKm} km
            </p>
            <p>
              <span className="font-medium">累積標高差 / Elevation Gain:</span> {generatedStats.cumulativeElevationGainM} m
            </p>
            <p>
              <span className="font-medium">推定時間 / Estimated Time:</span> {generatedStats.estimatedTimeMin} minutes
            </p>
          </div>
        </div>
      )}
       {!generatedStats && !isLoading && !error && (
         <div className="mt-6 p-4 bg-blue-50 border border-blue-300 rounded-lg shadow text-center">
            <p className="text-sm text-blue-700">Set your start point on the map, enter desired distance, and click "Create Course".</p>
         </div>
       )}
    </div>
  );
};
