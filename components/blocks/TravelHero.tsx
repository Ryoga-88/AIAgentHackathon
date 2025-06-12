'use client';
import { HeroData } from '@/types/travel';
import { useTheme } from '../providers/ThemeProvider';

interface TravelHeroProps {
  data: HeroData;
}

export function TravelHero({ data }: TravelHeroProps) {
  const { theme } = useTheme();

  return (
    <div className="h-full w-full relative flex flex-col" style={{ backgroundColor: theme.palette.neutral[50] }}>
      {/* 上部：キービジュアル画像エリア（70%） */}
      <div className="relative overflow-hidden" style={{ height: '70%' }}>
        <img 
          src={data.key_visual?.main_image || data.hero_image}
          alt={data.title}
          className="w-full h-full object-cover object-center"
          style={{ 
            objectPosition: 'center center',
            minHeight: '100%',
            minWidth: '100%'
          }}
        />
        
        {/* 抹茶色のオーバーレイ */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(135deg, 
              ${theme.palette.secondary[500]}40 0%, 
              ${theme.palette.secondary[600]}30 50%, 
              ${theme.palette.secondary[900]}50 100%)`
          }}
        />
        
        {/* タイトル（中央下部） */}
        <div className="absolute bottom-0 left-0 right-0 text-white p-6">
          <div className="text-center">
            <h1 
              className="text-3xl md:text-4xl font-light leading-tight mb-2"
              style={{ 
                fontFamily: theme.typography.heading,
                textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                color: 'white'
              }}
            >
              {data.title}
            </h1>
            <p 
              className="text-base font-light opacity-90"
              style={{ 
                fontFamily: theme.typography.accent,
                textShadow: '0 1px 6px rgba(0,0,0,0.4)'
              }}
            >
              {data.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* 下部：情報エリア（30%） */}
      <div 
        className="flex-shrink-0 p-4"
        style={{ 
          height: '30%',
          backgroundColor: theme.palette.secondary[50]
        }}
      >
        <div className="grid grid-cols-3 gap-4 text-center h-full items-center">
          <div>
            <div 
              className="text-xs tracking-wider mb-1 opacity-70"
              style={{ 
                color: theme.palette.secondary[600],
                fontFamily: theme.typography.body
              }}
            >
              期間
            </div>
            <div 
              className="text-base font-medium"
              style={{ 
                color: theme.palette.secondary[900],
                fontFamily: theme.typography.heading
              }}
            >
              {data.duration}
            </div>
          </div>
          <div>
            <div 
              className="text-xs tracking-wider mb-1 opacity-70"
              style={{ 
                color: theme.palette.secondary[600],
                fontFamily: theme.typography.body
              }}
            >
              場所
            </div>
            <div 
              className="text-base font-medium"
              style={{ 
                color: theme.palette.secondary[900],
                fontFamily: theme.typography.heading
              }}
            >
              {data.destination}
            </div>
          </div>
          <div>
            <div 
              className="text-xs tracking-wider mb-1 opacity-70"
              style={{ 
                color: theme.palette.secondary[600],
                fontFamily: theme.typography.body
              }}
            >
              予算
            </div>
            <div 
              className="text-base font-medium"
              style={{ 
                color: theme.palette.secondary[900],
                fontFamily: theme.typography.heading
              }}
            >
              {data.budget}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}