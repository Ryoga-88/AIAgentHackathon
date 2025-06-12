"use client";
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { useState, useEffect } from 'react';

export default function InteractiveMap({ 
  waypoints = [], 
  staticMapUrl = null,
  routeInfo = null,
  center = { lat: 35.6762, lng: 139.6503 }, 
  zoom = 12,
  height = "400px"
}) {
  const apiKey = "AIzaSyCB_NyYDaauWJHRGBsX4vn9fQvq6_Hxvzo";

  // 静的マップが利用可能な場合はそれを表示
  if (staticMapUrl) {
    return (
      <div className="relative">
        <img
          src={staticMapUrl}
          alt="旅行ルート"
          className="w-full rounded-lg"
          style={{ height }}
        />
        
        {/* 経路情報を表示 */}
        {routeInfo && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">経路情報</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">📏</span>
                <span>総距離: {routeInfo.distance}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">⏱️</span>
                <span>所要時間: {routeInfo.duration}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // インタラクティブマップを表示
  return (
    <div className="relative">
      <APIProvider apiKey={apiKey} libraries={['marker']}>
        <Map
          mapId="travel-plan-map"
          style={{ width: '100%', height }}
          defaultCenter={center}
          defaultZoom={zoom}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
        >
          {/* マーカーを表示 */}
          {waypoints.map((waypoint, index) => (
            <Marker
              key={index}
              position={waypoint.coordinates || center}
              title={waypoint.name || waypoint}
            />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}