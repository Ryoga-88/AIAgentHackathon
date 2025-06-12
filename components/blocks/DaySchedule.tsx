'use client';
import { ActivityCard } from './ActivityCard';
import { useTheme } from '../providers/ThemeProvider';
import { DaySchedule as DayScheduleType } from '@/types/travel';

interface DayScheduleProps {
  data: DayScheduleType;
}

export function DaySchedule({ data }: DayScheduleProps) {
  const { theme } = useTheme();
  
  const limitedActivities = data.activities.slice(0, 3);

  return (
    <div className="h-full w-full relative flex flex-col" style={{ backgroundColor: theme.palette.neutral[50] }}>
      {/* ページヘッダー */}
      <div className="relative overflow-hidden flex-shrink-0">
        <div className="relative h-20">
          <img 
            src={data.city.image}
            alt={data.city.name}
            className="w-full h-full object-cover"
          />
          
          <div 
            className="absolute inset-0"
            style={{ 
              background: `linear-gradient(135deg, 
                ${theme.palette.secondary[500]}60 0%, 
                ${theme.palette.secondary[900]}80 100%)`
            }}
          />
          
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <div 
                className="text-xs tracking-[0.2em] uppercase mb-1 opacity-80"
                style={{ fontFamily: theme.typography.body }}
              >
                {data.date}
              </div>
              <h2 
                className="text-xl font-light leading-tight mb-1"
                style={{ 
                  fontFamily: theme.typography.heading,
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                Day {data.day}
              </h2>
              <div 
                className="text-sm font-light opacity-90"
                style={{ fontFamily: theme.typography.accent }}
              >
                {data.city.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* アクティビティタイムライン */}
      <div className="relative flex-1 p-4 overflow-hidden">
        
        <div className="space-y-4 h-full flex flex-col justify-start">
          {limitedActivities.map((activity, index) => {
            const formatTime = (timeString: string) => {
              const [start, end] = timeString.split(' - ');
              if (!end) return { display: start, duration: undefined };
              
              const startHour = parseInt(start.split(':')[0]);
              const endHour = parseInt(end.split(':')[0]);
              const duration = `${endHour - startHour}h`;
              
              return { start, end, duration, display: timeString };
            };

            const timeInfo = formatTime(activity.time);

            return (
              <div key={activity.id || index} className="flex gap-4" style={{ height: 'calc((100% - 2rem) / 3)' }}>
                {/* 時間軸領域（固定幅） */}
                <div className="flex-shrink-0" style={{ width: '80px' }}>
                  <div 
                    className="px-3 py-2 shadow-sm rounded-sm h-fit"
                    style={{ 
                      backgroundColor: theme.palette.secondary[100],
                      border: `1px solid ${theme.palette.secondary[200]}`
                    }}
                  >
                    <div 
                      className="text-sm font-medium leading-tight"
                      style={{ 
                        color: theme.palette.secondary[900],
                        fontFamily: theme.typography.heading
                      }}
                    >
                      {timeInfo.start?.split(':')[0] || timeInfo.display.split(':')[0]}:00
                    </div>
                    {timeInfo.duration && (
                      <div 
                        className="text-xs opacity-70"
                        style={{ color: theme.palette.secondary[600] }}
                      >
                        {timeInfo.duration}
                      </div>
                    )}
                  </div>
                </div>

                {/* アクティビティカード領域 */}
                <div className="flex-1 h-full">
                  <ActivityCard 
                    activity={activity} 
                    isLast={index === limitedActivities.length - 1}
                    isEven={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}