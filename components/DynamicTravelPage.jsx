'use client';
import React from 'react';
import { getMockSchedule } from '@/utils/getMockSchedule';
import { TravelHero } from './blocks/TravelHero';
import { DaySchedule } from './blocks/DaySchedule';
import { ThemeProvider } from './providers/ThemeProvider';

export function DynamicTravelPage() {
  const scheduleData = getMockSchedule();

  return (
    <ThemeProvider themeName={scheduleData.theme}>
      <div className="min-h-screen bg-gradient-to-br from-[var(--background-color)] to-[var(--surface-color)]">
        <div className="max-w-7xl mx-auto">
          <TravelHero data={scheduleData.hero} />
          
          <div className="px-6 pb-12">
            <div className="space-y-12 mt-12">
              {scheduleData.itinerary.map((dayData) => (
                <DaySchedule key={dayData.day} data={dayData} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}