export interface ColorPalette {
  50: string;
  100: string;
  500: string;
  600: string;
  900: string;
}

export interface ThemeGradients {
  primary: string;
  secondary: string;
  accent: string;
  hero: string;
  card: string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  premium: string;
  aurora?: string;
}

export interface ThemeTypography {
  heading: string;
  body: string;
  accent: string;
}

export interface ActivityStyle {
  gradient: string;
  accent: string;
}

export interface ThemeHarmonies {
  [key: string]: string[];
}

export interface ThemeDefinition {
  name: string;
  display_name: string;
  description: string;
  mood: string;
  color_story: string;
  palette: {
    primary: ColorPalette;
    secondary: ColorPalette;
    accent: ColorPalette;
    neutral: ColorPalette;
  };
  gradients: ThemeGradients;
  harmonies: ThemeHarmonies;
  typography: ThemeTypography;
  shadows: ThemeShadows;
  activity_styles: {
    [key: string]: ActivityStyle;
  };
}

export interface ThemeContextValue {
  theme: ThemeDefinition;
  getActivityStyle: (activityType: string) => ActivityStyle;
  getColor: (colorType: string, shade?: number) => string;
}