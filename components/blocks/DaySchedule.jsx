'use client';
import { ActivityCard } from './ActivityCard';
import { useTheme } from '../providers/ThemeProvider';

export function DaySchedule({ data }) {
  const { theme } = useTheme();

  return (
    <div className="relative">
      {/* 日程ヘッダー */}
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-2xl shadow-2xl">
          {/* 背景画像 */}
          <div className="relative h-64">
            <img 
              src={data.city.image}
              alt={data.city.name}
              className="w-full h-full object-cover"
            />
            
            {/* オーバーレイ - 新しいグラデーション使用 */}
            <div 
              className="absolute inset-0"
              style={{ background: theme.gradients.secondary }}
            />
            
            {/* コンテンツ */}
            <div className="absolute inset-0 flex items-center justify-between p-8 text-white">
              <div>
                <h2 
                  className="text-4xl md:text-5xl font-bold mb-2"
                  style={{ fontFamily: 'var(--heading-font)' }}
                >
                  Day {data.day}
                </h2>
                <p className="text-lg opacity-90">{data.date}</p>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold mb-1">{data.city.name}</div>
                <div className="text-lg opacity-80">{data.city.name_en}</div>
                <p className="text-sm opacity-70 max-w-xs mt-2">{data.city.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* アクティビティタイムライン */}
      <div className="relative ml-8">
        {/* タイムライン線 */}
        <div 
          className="absolute left-6 top-0 bottom-0 w-1 rounded-full"
          style={{ backgroundColor: 'var(--accent-500)30' }}
        />
        
        {/* アクティビティカード */}
        <div className="space-y-8">
          {data.activities.map((activity, index) => (
            <ActivityCard 
              key={activity.id || index} 
              activity={activity} 
              isLast={index === data.activities.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}