'use client';
import React, { useState, useRef } from 'react';
import { getMockSchedule } from '@/utils/getMockSchedule';
import { TravelHero } from './blocks/TravelHero';
import { DaySchedule } from './blocks/DaySchedule';
import { ThemeProvider } from './providers/ThemeProvider';
import { DaySchedule as DayScheduleType } from '@/types/travel';

export function DynamicTravelPage() {
  const scheduleData = getMockSchedule();
  const totalDays = scheduleData.itinerary.length;
  const totalPages = totalDays + 1;
  
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <ThemeProvider themeName={scheduleData.theme}>
      <div className="relative min-h-screen overflow-hidden bg-gray-100">
        
        {/* 横スクロールコンテナ（連続スクロール） */}
        <div 
          ref={containerRef}
          className="flex min-h-screen overflow-x-auto overflow-y-hidden p-4 gap-4"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
          }}
        >
          {/* 表紙ページ */}
          <div className="flex-shrink-0 a4-page">
            <TravelHero data={scheduleData.hero} />
          </div>
          
          {/* 日程ページ */}
          {scheduleData.itinerary.map((dayData, index) => (
            <div key={index} className="flex-shrink-0 a4-page">
              <DaySchedule data={dayData as DayScheduleType} />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        /* A4アスペクト比のページ */
        .a4-page {
          width: 70vh;
          height: calc(70vh * 1.414);
          max-height: 90vh;
          max-width: calc(90vh / 1.414);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-radius: 4px;
          overflow: hidden;
          background: white;
        }

        /* スクロールバーを隠す */
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
        
        /* スムーズスクロール */
        .overflow-x-auto {
          scroll-behavior: smooth;
        }

        /* タッチデバイス用の慣性スクロール */
        .overflow-x-auto {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </ThemeProvider>
  );
}