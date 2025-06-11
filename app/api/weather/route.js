import { NextResponse } from 'next/server';

// OpenWeatherMap APIのベースURL
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// APIキー（実際の使用時には.env.localに追加する必要があります）
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// APIキーが設定されているかチェック
const isApiKeyConfigured = WEATHER_API_KEY && WEATHER_API_KEY !== 'あなたのOpenWeatherMapのAPIキーをここに入力してください';

// モックデータ（APIキーが設定されていない場合に使用）
const mockCurrentWeather = {
  "coord": {
    "lon": 139.6917,
    "lat": 35.6895
  },
  "weather": [
    {
      "id": 800,
      "main": "Clear",
      "description": "晴天",
      "icon": "01d"
    }
  ],
  "base": "stations",
  "main": {
    "temp": 25.05,
    "feels_like": 25.03,
    "temp_min": 23.34,
    "temp_max": 26.67,
    "pressure": 1013,
    "humidity": 57
  },
  "visibility": 10000,
  "wind": {
    "speed": 3.09,
    "deg": 180
  },
  "clouds": {
    "all": 0
  },
  "dt": 1686478800,
  "sys": {
    "type": 2,
    "id": 2001249,
    "country": "JP",
    "sunrise": 1686428276,
    "sunset": 1686481284
  },
  "timezone": 32400,
  "id": 1850144,
  "name": "東京",
  "cod": 200
};

// モックの予報データ
const mockForecastData = {
  "cod": "200",
  "message": 0,
  "cnt": 40,
  "list": [
    {
      "dt": 1686484800,
      "main": {
        "temp": 23.29,
        "feels_like": 23.22,
        "temp_min": 21.35,
        "temp_max": 23.29,
        "pressure": 1015,
        "sea_level": 1015,
        "grnd_level": 1012,
        "humidity": 62,
        "temp_kf": 1.94
      },
      "weather": [
        {
          "id": 800,
          "main": "Clear",
          "description": "晴天",
          "icon": "01n"
        }
      ],
      "clouds": {
        "all": 0
      },
      "wind": {
        "speed": 2.68,
        "deg": 197,
        "gust": 3.58
      },
      "visibility": 10000,
      "pop": 0,
      "sys": {
        "pod": "n"
      },
      "dt_txt": "2023-06-11 12:00:00"
    },
    {
      "dt": 1686495600,
      "main": {
        "temp": 21.63,
        "feels_like": 21.57,
        "temp_min": 20.14,
        "temp_max": 21.63,
        "pressure": 1015,
        "sea_level": 1015,
        "grnd_level": 1012,
        "humidity": 69,
        "temp_kf": 1.49
      },
      "weather": [
        {
          "id": 800,
          "main": "Clear",
          "description": "晴天",
          "icon": "01n"
        }
      ],
      "clouds": {
        "all": 0
      },
      "wind": {
        "speed": 1.97,
        "deg": 196,
        "gust": 2.11
      },
      "visibility": 10000,
      "pop": 0,
      "sys": {
        "pod": "n"
      },
      "dt_txt": "2023-06-11 15:00:00"
    }
  ],
  "city": {
    "id": 1850144,
    "name": "東京",
    "coord": {
      "lat": 35.6895,
      "lon": 139.6917
    },
    "country": "JP",
    "population": 12445327,
    "timezone": 32400,
    "sunrise": 1686428276,
    "sunset": 1686481284
  }
};

/**
 * 現在の天気を取得する
 * @param {string} location - 都市名または座標
 * @returns {Promise<Object>} - 天気情報
 */
async function getCurrentWeather(location) {
  // APIキーが設定されていない場合はエラーを投げる
  if (!isApiKeyConfigured) {
    throw new Error('OpenWeatherMap APIキーが設定されていません。.env.localファイルにAPIキーを設定してください。');
  }
  
  try {
    // 都市名で検索するURLを構築
    const url = `${WEATHER_API_BASE_URL}/weather?q=${encodeURIComponent(location)}&appid=${WEATHER_API_KEY}&units=metric&lang=ja`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching current weather:', error);
    throw error;
  }
}

/**
 * 5日間の天気予報を取得する
 * @param {string} location - 都市名または座標
 * @returns {Promise<Object>} - 天気予報情報
 */
async function getForecast(location) {
  // APIキーが設定されていない場合はエラーを投げる
  if (!isApiKeyConfigured) {
    throw new Error('OpenWeatherMap APIキーが設定されていません。.env.localファイルにAPIキーを設定してください。');
  }
  
  try {
    // 都市名で検索するURLを構築
    const url = `${WEATHER_API_BASE_URL}/forecast?q=${encodeURIComponent(location)}&appid=${WEATHER_API_KEY}&units=metric&lang=ja`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    throw error;
  }
}

/**
 * 特定の日時に最も近い予報を取得する
 * @param {Array} forecastList - 予報リスト
 * @param {string} targetDate - 対象日時（YYYY-MM-DD HH:MM形式）
 * @returns {Object} - 最も近い予報
 */
function findClosestForecast(forecastList, targetDate) {
  const targetTime = new Date(targetDate).getTime();
  
  // 最も時間差が小さい予報を見つける
  return forecastList.reduce((closest, current) => {
    const currentTime = new Date(current.dt * 1000).getTime();
    const closestTime = closest ? new Date(closest.dt * 1000).getTime() : null;
    
    if (!closest || Math.abs(currentTime - targetTime) < Math.abs(closestTime - targetTime)) {
      return current;
    }
    return closest;
  }, null);
}

/**
 * 天気情報をフォーマットする
 * @param {Object} weatherData - 天気データ
 * @returns {Object} - フォーマットされた天気情報
 */
function formatWeatherResponse(weatherData) {
  // 現在の天気の場合
  if (weatherData.weather && !weatherData.list) {
    return {
      location: {
        name: weatherData.name,
        country: weatherData.sys.country,
        coordinates: {
          lat: weatherData.coord.lat,
          lon: weatherData.coord.lon
        }
      },
      current: {
        time: new Date(weatherData.dt * 1000).toISOString(),
        temperature: {
          current: weatherData.main.temp,
          feels_like: weatherData.main.feels_like,
          min: weatherData.main.temp_min,
          max: weatherData.main.temp_max
        },
        weather: {
          main: weatherData.weather[0].main,
          description: weatherData.weather[0].description,
          icon: weatherData.weather[0].icon
        },
        wind: {
          speed: weatherData.wind.speed,
          deg: weatherData.wind.deg
        },
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure
      }
    };
  }
  
  // 予報の場合
  if (weatherData.list) {
    return {
      location: {
        name: weatherData.city.name,
        country: weatherData.city.country,
        coordinates: {
          lat: weatherData.city.coord.lat,
          lon: weatherData.city.coord.lon
        }
      },
      forecast: weatherData.list.map(item => ({
        time: new Date(item.dt * 1000).toISOString(),
        temperature: {
          current: item.main.temp,
          feels_like: item.main.feels_like,
          min: item.main.temp_min,
          max: item.main.temp_max
        },
        weather: {
          main: item.weather[0].main,
          description: item.weather[0].description,
          icon: item.weather[0].icon
        },
        wind: {
          speed: item.wind.speed,
          deg: item.wind.deg
        },
        humidity: item.main.humidity,
        pressure: item.main.pressure
      }))
    };
  }
  
  return weatherData;
}

// GET: 現在の天気を取得
export async function GET(request) {
  try {
    // URLからクエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter is required' },
        { status: 400 }
      );
    }
    
    // APIキーが設定されていない場合はモックデータを返す
    if (!isApiKeyConfigured) {
      console.log('Using mock data for current weather (API key not configured)');
      
      // モックデータを返す（場所に応じて名前を変更）
      const mockData = { ...mockCurrentWeather };
      mockData.name = location;
      
      // レスポンスをフォーマット
      const formattedResponse = formatWeatherResponse(mockData);
      
      return NextResponse.json(formattedResponse);
    }
    
    try {
      // 現在の天気を取得
      const weatherData = await getCurrentWeather(location);
      
      // レスポンスをフォーマット
      const formattedResponse = formatWeatherResponse(weatherData);
      
      return NextResponse.json(formattedResponse);
    } catch (apiError) {
      // APIキーのエラーの場合はモックデータを返す
      if (apiError.message.includes('401: Unauthorized')) {
        console.log('Using mock data due to API key error');
        
        // モックデータを返す（場所に応じて名前を変更）
        const mockData = { ...mockCurrentWeather };
        mockData.name = location;
        
        // レスポンスをフォーマット
        const formattedResponse = formatWeatherResponse(mockData);
        
        return NextResponse.json(formattedResponse);
      }
      
      // その他のエラーは再スロー
      throw apiError;
    }
  } catch (error) {
    console.error('Error in weather API:', error);
    return NextResponse.json(
      { error: 'Weather data retrieval failed', message: error.message },
      { status: 500 }
    );
  }
}

// POST: 特定の日時の天気予報を取得
export async function POST(request) {
  try {
    const body = await request.json();
    
    // リクエストからパラメータを取得
    const { location, datetime } = body;
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter is required' },
        { status: 400 }
      );
    }
    
    // APIキーが設定されていない場合はモックデータを返す
    if (!isApiKeyConfigured) {
      console.log('Using mock data for forecast (API key not configured)');
      
      // 日時が指定されていない場合は現在の天気を返す
      if (!datetime) {
        // モックデータを返す（場所に応じて名前を変更）
        const mockData = { ...mockCurrentWeather };
        mockData.name = location;
        
        return NextResponse.json(formatWeatherResponse(mockData));
      }
      
      // モック予報データを返す（場所に応じて名前を変更）
      const mockData = { ...mockForecastData };
      mockData.city.name = location;
      
      // 指定された日時に最も近い予報を見つける
      const closestForecast = mockData.list[0]; // 最初の予報を使用
      
      // 単一の予報をフォーマット
      const formattedForecast = {
        location: {
          name: mockData.city.name,
          country: mockData.city.country,
          coordinates: {
            lat: mockData.city.coord.lat,
            lon: mockData.city.coord.lon
          }
        },
        forecast: {
          time: new Date(closestForecast.dt * 1000).toISOString(),
          temperature: {
            current: closestForecast.main.temp,
            feels_like: closestForecast.main.feels_like,
            min: closestForecast.main.temp_min,
            max: closestForecast.main.temp_max
          },
          weather: {
            main: closestForecast.weather[0].main,
            description: closestForecast.weather[0].description,
            icon: closestForecast.weather[0].icon
          },
          wind: {
            speed: closestForecast.wind.speed,
            deg: closestForecast.wind.deg
          },
          humidity: closestForecast.main.humidity,
          pressure: closestForecast.main.pressure
        }
      };
      
      return NextResponse.json(formattedForecast);
    }
    
    try {
      // 日時が指定されていない場合は現在の天気を返す
      if (!datetime) {
        const currentWeather = await getCurrentWeather(location);
        return NextResponse.json(formatWeatherResponse(currentWeather));
      }
      
      // 5日間の予報を取得
      const forecastData = await getForecast(location);
      
      // 指定された日時に最も近い予報を見つける
      const closestForecast = findClosestForecast(forecastData.list, datetime);
      
      if (!closestForecast) {
        return NextResponse.json(
          { error: 'No forecast available for the specified datetime' },
          { status: 404 }
        );
      }
      
      // 単一の予報をフォーマット
      const formattedForecast = {
        location: {
          name: forecastData.city.name,
          country: forecastData.city.country,
          coordinates: {
            lat: forecastData.city.coord.lat,
            lon: forecastData.city.coord.lon
          }
        },
        forecast: {
          time: new Date(closestForecast.dt * 1000).toISOString(),
          temperature: {
            current: closestForecast.main.temp,
            feels_like: closestForecast.main.feels_like,
            min: closestForecast.main.temp_min,
            max: closestForecast.main.temp_max
          },
          weather: {
            main: closestForecast.weather[0].main,
            description: closestForecast.weather[0].description,
            icon: closestForecast.weather[0].icon
          },
          wind: {
            speed: closestForecast.wind.speed,
            deg: closestForecast.wind.deg
          },
          humidity: closestForecast.main.humidity,
          pressure: closestForecast.main.pressure
        }
      };
      
      return NextResponse.json(formattedForecast);
    } catch (apiError) {
      // APIキーのエラーの場合はモックデータを返す
      if (apiError.message.includes('401: Unauthorized')) {
        console.log('Using mock data due to API key error');
        
        // 日時が指定されていない場合は現在の天気を返す
        if (!datetime) {
          // モックデータを返す（場所に応じて名前を変更）
          const mockData = { ...mockCurrentWeather };
          mockData.name = location;
          
          return NextResponse.json(formatWeatherResponse(mockData));
        }
        
        // モック予報データを返す（場所に応じて名前を変更）
        const mockData = { ...mockForecastData };
        mockData.city.name = location;
        
        // 指定された日時に最も近い予報を見つける
        const closestForecast = mockData.list[0]; // 最初の予報を使用
        
        // 単一の予報をフォーマット
        const formattedForecast = {
          location: {
            name: mockData.city.name,
            country: mockData.city.country,
            coordinates: {
              lat: mockData.city.coord.lat,
              lon: mockData.city.coord.lon
            }
          },
          forecast: {
            time: new Date(closestForecast.dt * 1000).toISOString(),
            temperature: {
              current: closestForecast.main.temp,
              feels_like: closestForecast.main.feels_like,
              min: closestForecast.main.temp_min,
              max: closestForecast.main.temp_max
            },
            weather: {
              main: closestForecast.weather[0].main,
              description: closestForecast.weather[0].description,
              icon: closestForecast.weather[0].icon
            },
            wind: {
              speed: closestForecast.wind.speed,
              deg: closestForecast.wind.deg
            },
            humidity: closestForecast.main.humidity,
            pressure: closestForecast.main.pressure
          }
        };
        
        return NextResponse.json(formattedForecast);
      }
      
      // その他のエラーは再スロー
      throw apiError;
    }
  } catch (error) {
    console.error('Error in weather forecast API:', error);
    return NextResponse.json(
      { error: 'Weather forecast retrieval failed', message: error.message },
      { status: 500 }
    );
  }
}