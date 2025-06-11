'use client';
import { useTheme } from '../providers/ThemeProvider';
import { useState, useEffect } from 'react';

export function TravelHero({ data }) {
  const { theme } = useTheme();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const parallaxOffset = scrollY * 0.15;

  // dataが存在しない場合のデフォルト値
  if (!data) {
    return <div className="h-screen bg-gray-100" />;
  }

  return (
    <div className="relative">
      {/* フルスクリーンヒーロー */}
      <div className="relative h-screen overflow-hidden">
        
        {/* キービジュアル */}
        <div 
          className="absolute inset-0"
          style={{ transform: `translateY(${parallaxOffset}px)` }}
        >
          <img 
            src={data.key_visual?.main_image || data.hero_image}
            alt=""
            className="w-full h-[105%] object-cover"
          />
        </div>
        
        {/* 侘寂オーバーレイ */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              background: `linear-gradient(135deg, 
                rgba(93, 78, 55, 0.8) 0%, 
                rgba(123, 160, 91, 0.3) 50%, 
                rgba(205, 127, 50, 0.2) 100%)`
            }}
          />
        </div>

        {/* ミニマルフレーム */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-8 right-8 bottom-8 border border-white/20" />
        </div>

        {/* 左上テキスト */}
        <div className="absolute top-16 left-16 text-white z-10">
          <div 
            className="text-xs font-light tracking-[0.3em] uppercase mb-2 opacity-80"
            style={{ fontFamily: 'var(--body-font)' }}
          >
            OCT 2025.15
          </div>
          <h1 
            className="text-6xl lg:text-8xl font-thin leading-[0.9] tracking-[-0.02em] mb-4"
            style={{ 
              fontFamily: 'var(--heading-font)',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {data.title}
          </h1>
          <div 
            className="w-20 h-px bg-white/60 mb-6"
          />
          <div 
            className="text-sm font-light tracking-wide max-w-xs opacity-90"
            style={{ fontFamily: 'var(--body-font)' }}
          >
            {data.destination}
          </div>
        </div>

        {/* 右下説明文 */}
        <div className="absolute bottom-20 right-16 text-white z-10 max-w-md text-right">
          <p 
            className="text-base font-light leading-relaxed mb-4 opacity-90"
            style={{ fontFamily: 'var(--body-font)' }}
          >
            心が静まっていく、穏やかな水辺。<br />
            物語はここりはじまります。
          </p>
          <p 
            className="text-lg font-light tracking-wide opacity-95"
            style={{ 
              fontFamily: 'var(--accent-font)',
              fontStyle: 'italic'
            }}
          >
            {data.subtitle}
          </p>
        </div>

        {/* 右下詳細リンク */}
        <div className="absolute bottom-16 right-16 z-10">
          <div className="flex items-center space-x-4 text-white">
            <div 
              className="w-12 h-px bg-white/60"
            />
            <span 
              className="text-sm font-light tracking-wider uppercase opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
              style={{ fontFamily: 'var(--body-font)' }}
            >
              See Detail
            </span>
          </div>
        </div>
      </div>
      
      {/* ミニマル情報バー */}
      <div className="relative bg-white">
        <div className="max-w-7xl mx-auto px-16 py-16">
          
          {/* 3列情報 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 text-center lg:text-left">
            
            {/* 期間 */}
            <div>
              <div 
                className="text-xs font-medium tracking-[0.2em] uppercase mb-4 opacity-60"
                style={{ color: 'var(--neutral-500)' }}
              >
                Duration
              </div>
              <div 
                className="text-2xl font-light"
                style={{ 
                  color: 'var(--primary-600)',
                  fontFamily: 'var(--heading-font)'
                }}
              >
                {data.duration}
              </div>
            </div>
            
            {/* 場所 */}
            <div>
              <div 
                className="text-xs font-medium tracking-[0.2em] uppercase mb-4 opacity-60"
                style={{ color: 'var(--neutral-500)' }}
              >
                Destination
              </div>
              <div 
                className="text-2xl font-light"
                style={{ 
                  color: 'var(--secondary-600)',
                  fontFamily: 'var(--heading-font)'
                }}
              >
                {data.destination}
              </div>
            </div>
            
            {/* 予算 */}
            <div>
              <div 
                className="text-xs font-medium tracking-[0.2em] uppercase mb-4 opacity-60"
                style={{ color: 'var(--neutral-500)' }}
              >
                Budget
              </div>
              <div 
                className="text-2xl font-light"
                style={{ 
                  color: 'var(--accent-600)',
                  fontFamily: 'var(--heading-font)'
                }}
              >
                {data.budget}
              </div>
            </div>
          </div>

          {/* ハイライト */}
          <div className="mt-20 pt-12 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {data.highlights?.map((highlight, index) => (
                <div key={index} className="text-center">
                  <div 
                    className="w-2 h-2 rounded-full mx-auto mb-4"
                    style={{ backgroundColor: 'var(--accent-500)' }}
                  />
                  <div 
                    className="text-base font-light tracking-wide"
                    style={{ 
                      color: 'var(--neutral-700)',
                      fontFamily: 'var(--body-font)'
                    }}
                  >
                    {highlight}
                  </div>
                </div>
              )) || null}
            </div>
          </div>
        </div>
      </div>

      {/* 静寂の余白 */}
      <div className="h-24 bg-white" />
    </div>
  );
}