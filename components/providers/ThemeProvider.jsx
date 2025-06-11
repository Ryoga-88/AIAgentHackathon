'use client';
import React, { createContext, useContext } from 'react';
import { getTheme } from '@/utils/themeDefinitions';

const ThemeContext = createContext();

export function ThemeProvider({ themeName, children }) {
  const theme = getTheme(themeName);

  const getActivityStyle = (activityType) => {
    return theme.activity_styles[activityType] || theme.activity_styles.heritage;
  };

  // 新しい色構造に対応したヘルパー関数
  const getColor = (colorType, shade = 500) => {
    const colorPalette = theme.palette[colorType];
    if (typeof colorPalette === 'object') {
      return colorPalette[shade] || colorPalette[500];
    }
    return colorPalette;
  };

  return (
    <ThemeContext.Provider value={{ theme, getActivityStyle, getColor }}>
      <div 
        style={{
          '--primary-50': getColor('primary', 50),
          '--primary-100': getColor('primary', 100),
          '--primary-500': getColor('primary', 500),
          '--primary-600': getColor('primary', 600),
          '--primary-900': getColor('primary', 900),
          '--secondary-50': getColor('secondary', 50),
          '--secondary-100': getColor('secondary', 100),
          '--secondary-500': getColor('secondary', 500),
          '--secondary-600': getColor('secondary', 600),
          '--secondary-900': getColor('secondary', 900),
          '--accent-50': getColor('accent', 50),
          '--accent-100': getColor('accent', 100),
          '--accent-500': getColor('accent', 500),
          '--accent-600': getColor('accent', 600),
          '--accent-900': getColor('accent', 900),
          '--neutral-50': getColor('neutral', 50),
          '--neutral-100': getColor('neutral', 100),
          '--neutral-200': getColor('neutral', 200),
          '--neutral-500': getColor('neutral', 500),
          '--neutral-800': getColor('neutral', 800),
          '--neutral-900': getColor('neutral', 900),
          '--gradient-primary': theme.gradients.primary,
          '--gradient-secondary': theme.gradients.secondary,
          '--gradient-accent': theme.gradients.accent,
          '--gradient-hero': theme.gradients.hero,
          '--gradient-card': theme.gradients.card,
          '--shadow-sm': theme.shadows.sm,
          '--shadow-md': theme.shadows.md,
          '--shadow-lg': theme.shadows.lg,
          '--shadow-xl': theme.shadows.xl,
          '--shadow-premium': theme.shadows.premium,
          '--heading-font': theme.typography.heading,
          '--body-font': theme.typography.body,
          '--accent-font': theme.typography.accent,
          // 修正: border_radiusの構造に対応
          '--border-radius-sm': theme.effects?.border_radius?.sm || '8px',
          '--border-radius-md': theme.effects?.border_radius?.md || '12px',
          '--border-radius-lg': theme.effects?.border_radius?.lg || '16px',
          '--border-radius-xl': theme.effects?.border_radius?.xl || '24px'
        }}
        className="theme-container"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);