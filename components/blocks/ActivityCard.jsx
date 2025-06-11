'use client';
import { useTheme } from '../providers/ThemeProvider';
import { Clock, MapPin, Wallet, Star, ChevronRight, Calendar } from 'lucide-react';
import { useState } from 'react';

export function ActivityCard({ activity, isLast }) {
  const { theme, getActivityStyle } = useTheme();
  const activityStyle = getActivityStyle(activity.type);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getPriorityLevel = (priority) => {
    const levels = {
      must_see: { level: 4, label: 'Must See', icon: Star },
      must_do: { level: 3, label: 'Must Do', icon: ChevronRight },
      recommended: { level: 2, label: 'Recommended', icon: Calendar },
      optional: { level: 1, label: 'Optional', icon: Clock }
    };
    return levels[priority] || levels.optional;
  };

  const priorityInfo = getPriorityLevel(activity.priority);
  const PriorityIcon = priorityInfo.icon;

  const formatTime = (timeString) => {
    const [start, end] = timeString.split(' - ');
    if (!end) return { display: start, duration: null };
    
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    const duration = `${endHour - startHour}h`;
    
    return { start, end, duration, display: timeString };
  };

  const timeInfo = formatTime(activity.time);

  return (
    <div className="relative group">
      {/* タイムライン */}
      <div className="absolute left-0 top-0 flex flex-col items-center z-20">
        {/* メインノード */}
        <div className="relative">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold shadow-2xl border-4 border-white backdrop-blur-sm relative overflow-hidden"
            style={{ 
              backgroundColor: activityStyle.accent,
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {/* 背景パターン */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{ background: activityStyle.gradient }}
            />
            <div className="relative z-10 text-lg font-black">
              {timeInfo.start?.split(':')[0] || timeInfo.display.split(':')[0]}
            </div>
          </div>
          
          {/* 優先度インジケーター */}
          <div className="absolute -top-2 -right-2 z-30">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
              style={{ 
                backgroundColor: 'var(--accent-500)',
                opacity: 0.9 + (priorityInfo.level * 0.025)
              }}
            >
              <PriorityIcon className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        
        {/* タイムライン接続線 */}
        {!isLast && (
          <div 
            className="w-1 h-24 mt-4 rounded-full relative"
            style={{ backgroundColor: `${activityStyle.accent}30` }}
          >
            <div 
              className="absolute top-0 left-0 w-full h-8 rounded-full animate-pulse"
              style={{ backgroundColor: activityStyle.accent }}
            />
          </div>
        )}
      </div>

      {/* メインカード */}
      <div className="ml-24 mb-12">
        <div 
          className="relative rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-700 overflow-hidden group-hover:-translate-y-2 group-hover:rotate-1"
          style={{ 
            background: theme.gradients.card,
            borderLeft: `6px solid ${activityStyle.accent}`,
            boxShadow: 'var(--shadow-md)',
            transform: 'perspective(1000px)'
          }}
        >
          {/* プレミアム画像セクション */}
          <div className="relative h-80 overflow-hidden">
            {/* ローディングプレースホルダー */}
            {!imageLoaded && !imageError && (
              <div 
                className="absolute inset-0 animate-pulse flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, var(--neutral-200), var(--neutral-100))' 
                }}
              >
                <div 
                  className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--neutral-500)' }}
                />
              </div>
            )}
            
            {/* メイン画像 */}
            <img 
              src={activity.image}
              alt={activity.title}
              className={`w-full h-full object-cover transition-all duration-1000 ${
                imageLoaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
              } group-hover:scale-105`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            
            {/* 動的グラデーションオーバーレイ */}
            <div 
              className="absolute inset-0 opacity-60"
              style={{ background: activityStyle.gradient }}
            />
            
            {/* フローティング情報 */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/20">
                <span className="text-white font-bold text-sm uppercase tracking-wider">
                  {activity.type}
                </span>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-3 py-2 flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span 
                  className="font-bold text-sm"
                  style={{ color: 'var(--neutral-800)' }}
                >
                  {activity.rating}
                </span>
              </div>
            </div>
            
            {/* 優先度ラベル */}
            <div className="absolute bottom-6 left-6">
              <div 
                className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2 border-l-4"
                style={{ borderLeftColor: activityStyle.accent }}
              >
                <span className="text-white font-bold text-sm">{priorityInfo.label}</span>
              </div>
            </div>
          </div>

          {/* コンテンツセクション */}
          <div className="p-8">
            {/* ヘッダー */}
            <div className="mb-6">
              <h3 
                className="text-3xl font-bold mb-3"
                style={{ 
                  fontFamily: 'var(--heading-font)',
                  color: 'var(--primary-600)'
                }}
              >
                {activity.title}
              </h3>
              <p 
                className="text-xl italic font-light"
                style={{ 
                  fontFamily: 'var(--accent-font)',
                  color: 'var(--neutral-500)'
                }}
              >
                {activity.subtitle}
              </p>
            </div>

            {/* プレミアム情報グリッド */}
            <div className="grid grid-cols-1 gap-4 mb-8">
              {/* 時間情報 */}
              <div 
                className="flex items-center justify-between p-4 rounded-2xl border"
                style={{ 
                  background: 'var(--secondary-50)',
                  borderColor: 'var(--secondary-100)'
                }}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: 'var(--secondary-500)' }}
                  >
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div 
                      className="font-bold"
                      style={{ color: 'var(--primary-600)' }}
                    >
                      {timeInfo.display}
                    </div>
                    {timeInfo.duration && (
                      <div 
                        className="text-sm"
                        style={{ color: 'var(--neutral-500)' }}
                      >
                        Duration: {timeInfo.duration}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 場所と価格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className="flex items-center p-4 rounded-2xl border"
                  style={{ 
                    background: 'var(--secondary-50)',
                    borderColor: 'var(--secondary-100)'
                  }}
                >
                  <div 
                    className="p-2 rounded-xl mr-3"
                    style={{ backgroundColor: 'var(--secondary-500)' }}
                  >
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div 
                      className="font-medium text-sm"
                      style={{ color: 'var(--neutral-500)' }}
                    >
                      Location
                    </div>
                    <div 
                      className="font-bold"
                      style={{ color: 'var(--secondary-600)' }}
                    >
                      {activity.location}
                    </div>
                  </div>
                </div>
                
                <div 
                  className="flex items-center p-4 rounded-2xl border"
                  style={{ 
                    background: 'var(--accent-50)',
                    borderColor: 'var(--accent-100)'
                  }}
                >
                  <div 
                    className="p-2 rounded-xl mr-3"
                    style={{ backgroundColor: 'var(--accent-500)' }}
                  >
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div 
                      className="font-medium text-sm"
                      style={{ color: 'var(--neutral-500)' }}
                    >
                      Price
                    </div>
                    <div 
                      className="font-bold text-lg"
                      style={{ color: activityStyle.accent }}
                    >
                      {activity.price}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 説明 */}
            <div className="mb-6">
              <p 
                className="leading-relaxed text-lg"
                style={{ 
                  color: 'var(--neutral-800)',
                  fontFamily: 'var(--body-font)'
                }}
              >
                {activity.description}
              </p>
            </div>

            {/* プレミアムTips */}
            {activity.tips && (
              <div 
                className="relative p-6 rounded-2xl border-2 border-dashed"
                style={{ 
                  borderColor: `${activityStyle.accent}50`,
                  backgroundColor: `${activityStyle.accent}05`
                }}
              >
                <div className="flex items-start space-x-4">
                  <div 
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${activityStyle.accent}20` }}
                  >
                    <Star className="w-6 h-6" style={{ color: activityStyle.accent }} />
                  </div>
                  <div>
                    <h4 
                      className="font-bold text-lg mb-2"
                      style={{ 
                        color: activityStyle.accent,
                        fontFamily: 'var(--heading-font)'
                      }}
                    >
                      Pro Tips
                    </h4>
                    <p 
                      className="leading-relaxed"
                      style={{ 
                        color: 'var(--neutral-800)',
                        fontFamily: 'var(--body-font)'
                      }}
                    >
                      {activity.tips}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}