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

  // デバッグログ
  console.log('🗺️ InteractiveMap props:', {
    staticMapUrl: !!staticMapUrl,
    routeInfo: routeInfo,
    routeInfoKeys: routeInfo ? Object.keys(routeInfo) : []
  });

  // 距離表示のヘルパー関数
  const formatDistance = (distance) => {
    if (!distance && distance !== 0) return '計算中...';
    return `${Math.round(distance * 10) / 10} km`;
  };

  // 時間表示のヘルパー関数
  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return '計算中...';
    return minutes >= 60 ? 
      `${Math.floor(minutes / 60)}時間${minutes % 60}分` :
      `${minutes}分`;
  };

  // 静的マップが利用可能な場合はそれを表示
  if (staticMapUrl) {
    return (
      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={staticMapUrl}
          alt="ルートマップ"
          className="w-full h-auto object-contain"
          style={{ maxHeight: height || 'auto' }}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/600x400/e5e7eb/6b7280?text=マップを読み込み中...';
          }}
        />
        
        {/* 基本経路情報を表示 */}
        {routeInfo && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">経路情報</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">📏</span>
                <span>
                  総距離: {formatDistance(
                    routeInfo.route?.distance_km || 
                    routeInfo.distance_km || 
                    routeInfo.dayTotalDistance
                  )}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">⏱️</span>
                <span>
                  所要時間: {formatDuration(
                    routeInfo.route?.duration_minutes || 
                    routeInfo.duration_minutes || 
                    routeInfo.dayTotalDuration
                  )}
                </span>
              </div>
              {(routeInfo.route?.mode || routeInfo.mode) && (
                <div className="flex items-center space-x-2">
                  <span className="text-purple-600">🚗</span>
                  <span>移動手段: {routeInfo.route?.mode || routeInfo.mode}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-orange-600">💰</span>
                <span>
                  交通費: 約¥{Math.round((
                    routeInfo.route?.distance_km || 
                    routeInfo.distance_km || 
                    routeInfo.dayTotalDistance || 0
                  ) * 28).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 日跨ぎ移動情報の表示 */}
        {routeInfo && routeInfo.crossDaySegment && (
          <div className="mt-4 bg-amber-50 rounded-lg shadow-sm border border-amber-200 p-4">
            <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
              <span className="mr-2">🌅</span>
              日跨ぎ移動（前日最終地点→本日最初の観光地）
            </h4>
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {routeInfo.crossDaySegment.from?.title || routeInfo.crossDaySegment.from?.name} 
                    → {routeInfo.crossDaySegment.to?.title || routeInfo.crossDaySegment.to?.name}
                  </span>
                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                    宿泊地経由
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">📏</span>
                  <span>距離: {formatDistance(routeInfo.crossDaySegment.distance_km)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">⏱️</span>
                  <span>時間: {formatDuration(routeInfo.crossDaySegment.duration_minutes)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 詳細経路セグメント情報の表示 */}
        {routeInfo && routeInfo.segments && routeInfo.segments.length > 0 && (
          <div className="mt-4 bg-white rounded-lg shadow-sm border p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🗺️</span>
              観光地間の移動詳細
            </h4>
            <div className="space-y-3">
              {routeInfo.segments.map((segment, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {segment.from?.title || segment.from?.name} 
                        → {segment.to?.title || segment.to?.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        観光地 → 観光地
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <span className="text-blue-600 mr-2">📏</span>
                      <span>距離: {formatDistance(segment.distance_km)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-600 mr-2">⏱️</span>
                      <span>時間: {formatDuration(segment.duration_minutes)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 1日の合計情報 */}
              <div className="border-t pt-3 mt-3 bg-blue-50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-2">📏</span>
                    <span>この日の総距離: {formatDistance(routeInfo.dayTotalDistance)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">⏱️</span>
                    <span>移動時間計: {formatDuration(routeInfo.dayTotalDuration)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* データが不足している場合の警告 */}
        {routeInfo && !routeInfo.route && !routeInfo.segments && !routeInfo.crossDaySegment && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-2">⚠️</span>
              <div>
                <p className="text-yellow-800 font-medium">経路情報を取得中</p>
                <p className="text-yellow-700 text-sm">観光地間の移動ルートを計算しています...</p>
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

      {/* ルート詳細情報 */}
      {routeInfo && (
        <div className="mt-4 bg-white rounded-lg shadow-sm border p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">📊</span>
            ルート詳細
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">📏</span>
              <span className="text-gray-600">距離:</span>
              <span className="ml-1 font-medium">
                {(routeInfo.route?.distance_km || routeInfo.distance_km) ? 
                  `${Math.round((routeInfo.route?.distance_km || routeInfo.distance_km) * 10) / 10} km` : 
                  '計算中...'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">⏱️</span>
              <span className="text-gray-600">時間:</span>
              <span className="ml-1 font-medium">
                {(() => {
                  const minutes = routeInfo.route?.duration_minutes || routeInfo.duration_minutes;
                  if (!minutes) return '計算中...';
                  return minutes >= 60 ? 
                    `${Math.floor(minutes / 60)}時間${minutes % 60}分` :
                    `${minutes}分`;
                })()}
              </span>
            </div>
            {(routeInfo.route?.mode || routeInfo.mode) && (
              <div className="flex items-center">
                <span className="text-purple-600 mr-2">🚗</span>
                <span className="text-gray-600">手段:</span>
                <span className="ml-1 font-medium">{routeInfo.route?.mode || routeInfo.mode}</span>
              </div>
            )}
            {(routeInfo.route?.distance_km || routeInfo.distance_km) && (
              <div className="flex items-center">
                <span className="text-orange-600 mr-2">💰</span>
                <span className="text-gray-600">交通費:</span>
                <span className="ml-1 font-medium">約¥{Math.round((routeInfo.route?.distance_km || routeInfo.distance_km) * 28).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 日跨ぎ移動情報の表示 */}
      {routeInfo && routeInfo.crossDaySegment && (
        <div className="mt-4 bg-amber-50 rounded-lg shadow-sm border border-amber-200 p-4">
          <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
            <span className="mr-2">🌅</span>
            日跨ぎ移動（前日最終地点→本日最初の観光地）
          </h4>
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {routeInfo.crossDaySegment.from.title} → {routeInfo.crossDaySegment.to.title}
                </span>
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                  宿泊地経由
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <span className="text-blue-600 mr-2">📏</span>
                <span>距離: {routeInfo.crossDaySegment.distance_km ? 
                  `${Math.round(routeInfo.crossDaySegment.distance_km * 10) / 10} km` : 
                  '計算中...'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">⏱️</span>
                <span>時間: {routeInfo.crossDaySegment.duration_minutes ? 
                  routeInfo.crossDaySegment.duration_minutes >= 60 ? 
                    `${Math.floor(routeInfo.crossDaySegment.duration_minutes / 60)}時間${routeInfo.crossDaySegment.duration_minutes % 60}分` :
                    `${routeInfo.crossDaySegment.duration_minutes}分`
                  : '計算中...'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 詳細経路セグメント情報の表示（既存を改善） */}
      {routeInfo && routeInfo.segments && routeInfo.segments.length > 0 && (
        <div className="mt-4 bg-white rounded-lg shadow-sm border p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">🗺️</span>
            観光地間の移動詳細
          </h4>
          <div className="space-y-3">
            {routeInfo.segments.map((segment, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {segment.from.title} → {segment.to.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      観光地 → 観光地
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">#{index + 1}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-2">📏</span>
                    <span>距離: {segment.distance_km ? `${Math.round(segment.distance_km * 10) / 10} km` : '計算中...'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">⏱️</span>
                    <span>時間: {segment.duration_minutes ? 
                      segment.duration_minutes >= 60 ? 
                        `${Math.floor(segment.duration_minutes / 60)}時間${segment.duration_minutes % 60}分` :
                        `${segment.duration_minutes}分`
                      : '計算中...'}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* 1日の合計情報 */}
            <div className="border-t pt-3 mt-3 bg-blue-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">📏</span>
                  <span>この日の総距離: {routeInfo.dayTotalDistance ? 
                    `${Math.round(routeInfo.dayTotalDistance * 10) / 10} km` : 
                    '計算中...'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">⏱️</span>
                  <span>移動時間計: {routeInfo.dayTotalDuration ? 
                    routeInfo.dayTotalDuration >= 60 ? 
                      `${Math.floor(routeInfo.dayTotalDuration / 60)}時間${routeInfo.dayTotalDuration % 60}分` :
                      `${routeInfo.dayTotalDuration}分`
                    : '計算中...'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}