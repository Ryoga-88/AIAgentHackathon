export const THEME_DEFINITIONS = {
  wabi_sabi: {
    name: "Wabi-Sabi",
    display_name: "侘寂",
    description: "不完全な美しさと時の流れを表現する日本の美学",
    mood: "contemplative",
    color_story: "茶の湯の世界観：抹茶グリーン、土の温もり、墨の深み",
    palette: {
      primary: {
        50: "#f4f5f0",   // 和紙の白
        100: "#e8e6d9",  // 薄茶
        500: "#5d4e37",  // 深い茶 (umber)
        600: "#4a3728",  // 焦げ茶
        900: "#2f1b14"   // 墨色
      },
      secondary: {
        50: "#f0f4ed",   // 若草色の薄い版
        100: "#d4e4c8",  // 薄抹茶
        500: "#7ba05b",  // 抹茶グリーン
        600: "#5e7d45",  // 深い緑
        900: "#3d4f2d"   // 深山の緑
      },
      accent: {
        50: "#fdf2f0",   // 桜の薄いピンク
        100: "#f7ddd6",  // 薄朱色
        500: "#cd7f32",  // 古銅色 (bronze)
        600: "#b8661f",  // 濃い銅
        900: "#8b4513"   // 古木の色
      },
      neutral: {
        50: "#fafaf8",   // 白絹
        100: "#f5f5f2",  // 薄雲
        200: "#e8e6e0",  // 石色
        500: "#9b9b8f",  // 鼠色
        800: "#3c3c37",  // 墨黒
        900: "#1a1a17"   // 漆黒
      }
    },
    gradients: {
      primary: "linear-gradient(135deg, #5d4e37 0%, #4a3728 40%, #2f1b14 100%)",
      secondary: "linear-gradient(135deg, #f0f4ed 0%, #d4e4c8 50%, #7ba05b 100%)",
      accent: "linear-gradient(135deg, #cd7f32 0%, #b8661f 60%, #8b4513 100%)",
      hero: "linear-gradient(135deg, #5d4e3780 0%, #7ba05b60 40%, #cd7f3240 100%)",
      card: "linear-gradient(145deg, #fafaf8 0%, #f5f5f2 50%, #e8e6e0 100%)"
    },
    harmonies: {
      analogous: ["#7ba05b", "#5d4e37", "#cd7f32"],  // 隣接色相
      triadic: ["#5d4e37", "#7ba05b", "#cd7f32"],     // 三角配色
      complementary: ["#5d4e37", "#f0f4ed"]           // 補色
    },
    typography: {
      heading: "'Shippori Mincho', 'Noto Serif JP', serif",
      body: "'Zen Kaku Gothic New', 'Noto Sans JP', sans-serif",
      accent: "'Sawarabi Mincho', serif"
    },
    shadows: {
      sm: "0 1px 3px rgba(93, 78, 55, 0.08)",
      md: "0 4px 12px rgba(93, 78, 55, 0.12)",
      lg: "0 8px 25px rgba(93, 78, 55, 0.15)",
      xl: "0 16px 35px rgba(93, 78, 55, 0.18)",
      premium: "0 25px 50px rgba(93, 78, 55, 0.25)"
    },
    activity_styles: {
      heritage: { 
        gradient: "linear-gradient(135deg, #8b4513 0%, #5d4e37 100%)",
        accent: "#8b4513"  // 古木の色
      },
      culinary: { 
        gradient: "linear-gradient(135deg, #cd7f32 0%, #b8661f 100%)",
        accent: "#cd7f32"  // 古銅色
      },
      experience: { 
        gradient: "linear-gradient(135deg, #7ba05b 0%, #5e7d45 100%)",
        accent: "#7ba05b"  // 抹茶グリーン
      },
      scenic: { 
        gradient: "linear-gradient(135deg, #5e7d45 0%, #3d4f2d 100%)",
        accent: "#5e7d45"  // 深い緑
      },
      cultural: { 
        gradient: "linear-gradient(135deg, #5d4e37 0%, #4a3728 100%)",
        accent: "#5d4e37"  // 深い茶
      },
      art: { 
        gradient: "linear-gradient(135deg, #b8661f 0%, #8b4513 100%)",
        accent: "#b8661f"  // 濃い銅
      },
      nature: { 
        gradient: "linear-gradient(135deg, #3d4f2d 0%, #2f1b14 100%)",
        accent: "#3d4f2d"  // 深山の緑
      },
      wellness: { 
        gradient: "linear-gradient(135deg, #f7ddd6 0%, #cd7f32 100%)",
        accent: "#f7ddd6"  // 薄朱色
      },
      adventure: { 
        gradient: "linear-gradient(135deg, #4a3728 0%, #2f1b14 100%)",
        accent: "#4a3728"  // 焦げ茶
      },
      beach: { 
        gradient: "linear-gradient(135deg, #d4e4c8 0%, #7ba05b 100%)",
        accent: "#d4e4c8"  // 薄抹茶
      }
    }
  },

  azure_mediterranean: {
    name: "Azure Mediterranean",
    display_name: "地中海の蒼",
    description: "エーゲ海の青と白い街並みが織りなす永遠の美",
    mood: "serene_luxury",
    color_story: "サントリーニ島：地中海ブルー、純白の壁、夕陽のゴールド",
    palette: {
      primary: {
        50: "#e8f4fd",   // 空の薄青
        100: "#bde3fb",  // 雲の青
        500: "#1e40af",  // 地中海ブルー (deep blue)
        600: "#1d4ed8",  // ロイヤルブルー
        900: "#1e3a8a"   // 深海の青
      },
      secondary: {
        50: "#fefefe",   // 純白
        100: "#f8fafc",  // 雲白
        500: "#64748b",  // スレートグレー
        600: "#475569",  // 石色
        900: "#1e293b"   // チャコール
      },
      accent: {
        50: "#fffbeb",   // 朝日の薄黄
        100: "#fef3c7",  // 砂の色
        500: "#f59e0b",  // サンセットゴールド
        600: "#d97706",  // 深いゴールド
        900: "#92400e"   // ブロンズ
      },
      neutral: {
        50: "#f8fafc",   // 朝霧
        100: "#f1f5f9",  // 雲
        200: "#e2e8f0",  // 薄雲
        500: "#64748b",  // 海の灰色
        800: "#1e293b",  // 夜の海
        900: "#0f172a"   // 深夜
      }
    },
    gradients: {
      primary: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #1e3a8a 100%)",
      secondary: "linear-gradient(135deg, #fefefe 0%, #f8fafc 50%, #64748b 100%)",
      accent: "linear-gradient(135deg, #f59e0b 0%, #d97706 60%, #92400e 100%)",
      hero: "linear-gradient(135deg, #1e40af90 0%, #64748b50 50%, #f59e0b30 100%)",
      card: "linear-gradient(145deg, #fefefe 0%, #f8fafc 50%, #e8f4fd 100%)"
    },
    harmonies: {
      analogous: ["#1e40af", "#64748b", "#f59e0b"],
      split_complementary: ["#1e40af", "#f59e0b", "#fefefe"],
      monochromatic: ["#e8f4fd", "#1e40af", "#1e3a8a"]
    },
    typography: {
      heading: "'Lora', 'Noto Serif', serif",
      body: "'Source Sans Pro', 'Noto Sans', sans-serif",
      accent: "'Playfair Display', serif"
    },
    shadows: {
      sm: "0 1px 3px rgba(30, 64, 175, 0.08)",
      md: "0 4px 12px rgba(30, 64, 175, 0.12)",
      lg: "0 8px 25px rgba(30, 64, 175, 0.15)",
      xl: "0 16px 35px rgba(30, 64, 175, 0.18)",
      premium: "0 25px 50px rgba(30, 64, 175, 0.25)"
    },
    activity_styles: {
      heritage: { 
        gradient: "linear-gradient(135deg, #64748b 0%, #475569 100%)",
        accent: "#64748b"  // スレートグレー
      },
      culinary: { 
        gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        accent: "#f59e0b"  // サンセットゴールド
      },
      experience: { 
        gradient: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)",
        accent: "#1e40af"  // 地中海ブルー
      },
      scenic: { 
        gradient: "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)",
        accent: "#1d4ed8"  // ロイヤルブルー
      },
      cultural: { 
        gradient: "linear-gradient(135deg, #475569 0%, #1e293b 100%)",
        accent: "#475569"  // 石色
      },
      art: { 
        gradient: "linear-gradient(135deg, #d97706 0%, #92400e 100%)",
        accent: "#d97706"  // 深いゴールド
      },
      nature: { 
        gradient: "linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)",
        accent: "#1e3a8a"  // 深海の青
      },
      wellness: { 
        gradient: "linear-gradient(135deg, #fefefe 0%, #f8fafc 100%)",
        accent: "#64748b"  // スレートグレー
      },
      adventure: { 
        gradient: "linear-gradient(135deg, #1e40af 0%, #f59e0b 100%)",
        accent: "#1e40af"  // 地中海ブルー
      },
      beach: { 
        gradient: "linear-gradient(135deg, #e8f4fd 0%, #1e40af 100%)",
        accent: "#1e40af"  // 地中海ブルー
      }
    }
  },

  tuscan_sunset: {
    name: "Tuscan Sunset",
    display_name: "トスカーナの夕暮れ",
    description: "イタリア・トスカーナの丘陵地帯に沈む夕陽の色彩詩",
    mood: "romantic_warmth",
    color_story: "トスカーナの黄昏：温かいテラコッタ、オリーブの緑、ワインレッド",
    palette: {
      primary: {
        50: "#fdf4f3",   // 薄い陶土色
        100: "#fce7e6",  // 桃色の陶土
        500: "#a0522d",  // シエナ (sienna)
        600: "#8b4513",  // サドルブラウン
        900: "#654321"   // 深いブラウン
      },
      secondary: {
        50: "#f6f7f1",   // オリーブの薄緑
        100: "#e8ebd7",  // 薄オリーブ
        500: "#8fbc8f",  // ダークシーグリーン
        600: "#6b8e23",  // オリーブドラブ
        900: "#556b2f"   // ダークオリーブグリーン
      },
      accent: {
        50: "#fdf2f2",   // 薄いワイン色
        100: "#fce4e4",  // ロゼ
        500: "#722f37",  // ワインレッド
        600: "#5f1a20",  // 深いワイン
        900: "#4c1319"   // ボルドー
      },
      neutral: {
        50: "#faf9f7",   // 石灰岩
        100: "#f4f1ea",  // 古い紙
        200: "#e6ddd4",  // ベージュ
        500: "#a8998a",  // 灰褐色
        800: "#4a423a",  // ダークベージュ
        900: "#2d251e"   // セピア
      }
    },
    gradients: {
      primary: "linear-gradient(135deg, #a0522d 0%, #8b4513 50%, #654321 100%)",
      secondary: "linear-gradient(135deg, #f6f7f1 0%, #8fbc8f 50%, #6b8e23 100%)",
      accent: "linear-gradient(135deg, #722f37 0%, #5f1a20 60%, #4c1319 100%)",
      hero: "linear-gradient(135deg, #a0522d80 0%, #8fbc8f60 40%, #722f3750 100%)",
      card: "linear-gradient(145deg, #faf9f7 0%, #f4f1ea 50%, #e6ddd4 100%)"
    },
    harmonies: {
      earth_tones: ["#a0522d", "#8fbc8f", "#722f37"],
      warm_analogous: ["#a0522d", "#8b4513", "#654321"],
      complementary: ["#a0522d", "#8fbc8f"]
    },
    typography: {
      heading: "'Cormorant Garamond', 'Noto Serif', serif",
      body: "'Crimson Text', 'Noto Serif', serif",
      accent: "'Dancing Script', cursive"
    },
    shadows: {
      sm: "0 1px 3px rgba(160, 82, 45, 0.08)",
      md: "0 4px 12px rgba(160, 82, 45, 0.12)",
      lg: "0 8px 25px rgba(160, 82, 45, 0.15)",
      xl: "0 16px 35px rgba(160, 82, 45, 0.18)",
      premium: "0 25px 50px rgba(160, 82, 45, 0.25)"
    },
    activity_styles: {
      heritage: { 
        gradient: "linear-gradient(135deg, #8b4513 0%, #654321 100%)",
        accent: "#8b4513"  // サドルブラウン
      },
      culinary: { 
        gradient: "linear-gradient(135deg, #722f37 0%, #5f1a20 100%)",
        accent: "#722f37"  // ワインレッド
      },
      art: { 
        gradient: "linear-gradient(135deg, #a0522d 0%, #8b4513 100%)",
        accent: "#a0522d"  // シエナ
      },
      scenic: { 
        gradient: "linear-gradient(135deg, #8fbc8f 0%, #6b8e23 100%)",
        accent: "#8fbc8f"  // ダークシーグリーン
      },
      // ... 他のカテゴリも追加
    }
  },

  nordic_aurora: {
    name: "Nordic Aurora",
    display_name: "北欧オーロラ",
    description: "スカンジナビアの夜空に踊るオーロラの神秘的な色彩",
    mood: "mystical_calm",
    color_story: "オーロラの夜：深い青紫、エメラルドグリーン、ピンクの光",
    palette: {
      primary: {
        50: "#f0f4f8",   // 氷雪の白
        100: "#d6e6f2",  // 薄い氷色
        500: "#1e293b",  // 深い青灰 (slate)
        600: "#0f172a",  // 夜空の青
        900: "#020617"   // 北極の夜
      },
      secondary: {
        50: "#ecfdf5",   // 薄いオーロラグリーン
        100: "#d1fae5",  // 薄緑
        500: "#059669",  // エメラルドグリーン
        600: "#047857",  // 深い緑
        900: "#064e3b"   // 森の深緑
      },
      accent: {
        50: "#fdf2f8",   // 薄いオーロラピンク
        100: "#fce7f3",  // 薄ピンク
        500: "#be185d",  // オーロラピンク
        600: "#9d174d",  // 深いピンク
        900: "#831843"   // マゼンタ
      },
      neutral: {
        50: "#f8fafc",   // 雪景色
        100: "#f1f5f9",  // 薄雲
        200: "#e2e8f0",  // 氷の色
        500: "#64748b",  // スレート
        800: "#1e293b",  // 夜の色
        900: "#0f172a"   // 深夜
      }
    },
    gradients: {
      primary: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)",
      secondary: "linear-gradient(135deg, #ecfdf5 0%, #059669 50%, #047857 100%)",
      accent: "linear-gradient(135deg, #be185d 0%, #9d174d 60%, #831843 100%)",
      hero: "linear-gradient(135deg, #1e293b90 0%, #05966960 40%, #be185d40 100%)",
      aurora: "linear-gradient(45deg, #059669 0%, #be185d 50%, #1e293b 100%)",
      card: "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)"
    },
    harmonies: {
      aurora_triad: ["#1e293b", "#059669", "#be185d"],
      cool_analogous: ["#1e293b", "#0f172a", "#020617"],
      mystical: ["#059669", "#be185d", "#831843"]
    },
    typography: {
      heading: "'Inter', 'Noto Sans', sans-serif",
      body: "'Source Sans Pro', 'Noto Sans', sans-serif",
      accent: "'JetBrains Mono', monospace"
    },
    shadows: {
      sm: "0 1px 3px rgba(30, 41, 59, 0.08)",
      md: "0 4px 12px rgba(30, 41, 59, 0.12)",
      lg: "0 8px 25px rgba(30, 41, 59, 0.15)",
      xl: "0 16px 35px rgba(30, 41, 59, 0.18)",
      premium: "0 25px 50px rgba(30, 41, 59, 0.25)",
      aurora: "0 0 20px rgba(5, 150, 105, 0.4), 0 0 40px rgba(190, 24, 93, 0.3)"
    },
    activity_styles: {
      heritage: { 
        gradient: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        accent: "#1e293b"  // 深い青灰
      },
      culinary: { 
        gradient: "linear-gradient(135deg, #be185d 0%, #9d174d 100%)",
        accent: "#be185d"  // オーロラピンク
      },
      nature: { 
        gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)",
        accent: "#059669"  // エメラルドグリーン
      },
      wellness: { 
        gradient: "linear-gradient(135deg, #be185d 0%, #9d174d 100%)",
        accent: "#be185d"  // オーロラピンク
      },
      adventure: { 
        gradient: "linear-gradient(135deg, #059669 0%, #be185d 50%, #1e293b 100%)",
        accent: "#059669"  // エメラルドグリーン
      },
      // ... 他のカテゴリも追加
    }
  }
};

// ヘルパー関数も改善
export function getTheme(themeName) {
  return THEME_DEFINITIONS[themeName] || THEME_DEFINITIONS.wabi_sabi;
}

export function getColorHarmony(theme, harmonyType) {
  return theme.harmonies[harmonyType] || theme.harmonies.analogous || [];
}

export function getContrastRatio(color1, color2) {
  // 色のコントラスト比を計算するヘルパー関数
  // アクセシビリティの確保
}

export function getSeasonalPalette(theme, season) {
  // 季節に応じたカラーパレットの調整
  const seasonalAdjustments = {
    spring: { saturation: 1.1, brightness: 1.05 },
    summer: { saturation: 1.2, brightness: 1.1 },
    autumn: { saturation: 0.9, brightness: 0.95 },
    winter: { saturation: 0.8, brightness: 0.9 }
  };
  
  return theme; // 実装は後で
}