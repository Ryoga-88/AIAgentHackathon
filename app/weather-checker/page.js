'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function WeatherChecker() {
  const [location, setLocation] = useState('');
  const [datetime, setDatetime] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 現在の天気を取得する
  const getCurrentWeather = async () => {
    if (!location) {
      setError('場所を入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // APIキーが設定されていない場合の特別なエラーメッセージ
        if (errorData.error === 'API key not configured') {
          throw new Error(`${errorData.message}\n\n${errorData.setup_instructions || ''}`);
        }
        
        throw new Error(errorData.message || '天気データの取得に失敗しました');
      }
      
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 特定の日時の天気予報を取得する
  const getWeatherForecast = async () => {
    if (!location) {
      setError('場所を入力してください');
      return;
    }

    if (!datetime) {
      setError('日時を入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          datetime,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // APIキーが設定されていない場合の特別なエラーメッセージ
        if (errorData.error === 'API key not configured') {
          throw new Error(`${errorData.message}\n\n${errorData.setup_instructions || ''}`);
        }
        
        throw new Error(errorData.message || '天気予報の取得に失敗しました');
      }
      
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 天気アイコンのURLを取得する
  const getWeatherIconUrl = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  return (
    <div className="min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="mb-8">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <span className="text-sm">← ホームに戻る</span>
        </Link>
        <h1 className="text-3xl font-bold mb-2">天気チェッカー</h1>
        <p className="text-gray-600 dark:text-gray-400">
          場所と日時を入力して、天気情報を取得できます。
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">天気情報を取得</h2>
          
          <div className="mb-4">
            <label htmlFor="location" className="block text-sm font-medium mb-1">
              場所（都市名）
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例: 東京、Kyoto、New York"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="datetime" className="block text-sm font-medium mb-1">
              日時（オプション）
            </label>
            <input
              type="datetime-local"
              id="datetime"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">
              ※日時を指定しない場合は現在の天気を取得します。5日先までの予報が取得可能です。
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={getCurrentWeather}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              現在の天気を取得
            </button>
            <button
              onClick={getWeatherForecast}
              disabled={loading || !datetime}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              予報を取得
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">天気情報</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : weatherData ? (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium">
                  {weatherData.location.name}, {weatherData.location.country}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  緯度: {weatherData.location.coordinates.lat}, 経度: {weatherData.location.coordinates.lon}
                </p>
              </div>
              
              {weatherData.current ? (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center mb-4">
                    <div className="mr-4">
                      <img
                        src={getWeatherIconUrl(weatherData.current.weather.icon)}
                        alt={weatherData.current.weather.description}
                        width={64}
                        height={64}
                      />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold">{weatherData.current.temperature.current}°C</h4>
                      <p className="capitalize">{weatherData.current.weather.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">体感温度</p>
                      <p>{weatherData.current.temperature.feels_like}°C</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">湿度</p>
                      <p>{weatherData.current.humidity}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">風速</p>
                      <p>{weatherData.current.wind.speed} m/s</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">気圧</p>
                      <p>{weatherData.current.pressure} hPa</p>
                    </div>
                  </div>
                  
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    取得時刻: {new Date(weatherData.current.time).toLocaleString()}
                  </p>
                </div>
              ) : weatherData.forecast ? (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center mb-4">
                    <div className="mr-4">
                      <img
                        src={getWeatherIconUrl(weatherData.forecast.weather.icon)}
                        alt={weatherData.forecast.weather.description}
                        width={64}
                        height={64}
                      />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold">{weatherData.forecast.temperature.current}°C</h4>
                      <p className="capitalize">{weatherData.forecast.weather.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">体感温度</p>
                      <p>{weatherData.forecast.temperature.feels_like}°C</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">湿度</p>
                      <p>{weatherData.forecast.humidity}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">風速</p>
                      <p>{weatherData.forecast.wind.speed} m/s</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">気圧</p>
                      <p>{weatherData.forecast.pressure} hPa</p>
                    </div>
                  </div>
                  
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    予報時刻: {new Date(weatherData.forecast.time).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div>
                  {weatherData.forecast && Array.isArray(weatherData.forecast) && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h3 className="text-lg font-medium mb-2">5日間予報</h3>
                      <div className="space-y-4">
                        {weatherData.forecast.slice(0, 8).map((item, index) => (
                          <div key={index} className="flex items-center p-2 border-b border-gray-200 dark:border-gray-700">
                            <div className="mr-2">
                              <img
                                src={getWeatherIconUrl(item.weather.icon)}
                                alt={item.weather.description}
                                width={40}
                                height={40}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{new Date(item.time).toLocaleString()}</p>
                              <p className="text-sm">{item.temperature.current}°C - {item.weather.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 text-gray-500">
              <p>天気情報を取得するには、場所を入力して「取得」ボタンをクリックしてください。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}