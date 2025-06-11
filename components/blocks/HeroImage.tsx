'use client';
import { useState, useEffect } from 'react';
import { HeroData } from '@/types/travel';

interface HeroImageProps {
  data: HeroData;
}

export function HeroImage({ data }: HeroImageProps) {
  const [scrollY, setScrollY] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const parallaxOffset = scrollY * 0.15;

  return (
    <div className="relative h-screen overflow-hidden">
      
      {/* キービジュアル - 完全フルスクリーン */}
      <div 
        className="absolute inset-0"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      >
        <img 
          src={data.key_visual?.main_image || data.hero_image}
          alt=""
          className="w-full h-[105%] object-cover"
          style={{ margin: 0, padding: 0 }}
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
  );
}