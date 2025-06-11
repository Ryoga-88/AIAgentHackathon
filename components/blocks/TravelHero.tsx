'use client';
import { HeroData } from '@/types/travel';
import { HeroImage } from './HeroImage';
import { HeroInfoBar } from './HeroInfoBar';

interface TravelHeroProps {
  data: HeroData;
}

export function TravelHero({ data }: TravelHeroProps) {
  if (!data) {
    return <div className="h-screen bg-gray-100" />;
  }

  return (
    <div className="relative">
      {/* ヒーロー画像セクション */}
      <HeroImage data={data} />
      
      {/* 情報バーセクション */}
      <HeroInfoBar data={data} />
    </div>
  );
}