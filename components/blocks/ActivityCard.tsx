'use client';
import { useTheme } from '../providers/ThemeProvider';
import { useState } from 'react';
import { Activity } from '@/types/travel';

interface ActivityCardProps {
  activity: Activity;
  isLast: boolean;
  isEven: boolean;
}

export function ActivityCard({ activity, isLast, isEven }: ActivityCardProps) {
  const { theme, getActivityStyle } = useTheme();
  const activityStyle = getActivityStyle(activity.type);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  return (
    <div className="relative h-full w-full">
      {/* メインカード */}
      <div className="relative h-full w-full">
        <div 
          className="relative h-full flex shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer rounded-sm"
          style={{ 
            backgroundColor: theme.palette.neutral[50],
            border: `1px solid ${theme.palette.neutral[200]}`
          }}
        >
          
          {/* 画像部分 */}
          <div className="relative w-2/3 overflow-hidden">
            <img 
              src={activity.image}
              alt={activity.title}
              className="w-full h-full object-cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            
            {/* カテゴリラベル（画像上のみ） */}
            <div className="absolute top-2 left-2">
              <div 
                className="px-2 py-1 rounded-sm"
                style={{ 
                  backgroundColor: activityStyle.accent,
                  color: 'white'
                }}
              >
                <span className="font-medium text-xs uppercase tracking-wide">
                  {activity.type}
                </span>
              </div>
            </div>
          </div>

          {/* 情報部分 */}
          <div className="w-1/3 p-3 flex flex-col justify-between">
            {/* 上部：タイトルと場所 */}
            <div>
              <h3 
                className="text-sm font-medium leading-tight mb-1"
                style={{ 
                  fontFamily: theme.typography.heading,
                  color: theme.palette.secondary[900]
                }}
              >
                {activity.title}
              </h3>
              <p 
                className="text-xs opacity-80"
                style={{ 
                  fontFamily: theme.typography.body,
                  color: theme.palette.secondary[600]
                }}
              >
                {activity.location}
              </p>
            </div>

            {/* 下部：価格 */}
            <div className="mt-auto">
              <div 
                className="text-sm font-medium"
                style={{ 
                  color: activityStyle.accent,
                  fontFamily: theme.typography.heading
                }}
              >
                {activity.price}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}