'use client';
import { HeroData } from '@/types/travel';
import { useTheme } from '../providers/ThemeProvider';

interface HeroInfoBarProps {
  data: HeroData;
}

export function HeroInfoBar({ data }: HeroInfoBarProps) {
  const { theme } = useTheme();

  return (
    <div 
      className="relative overflow-hidden"
      style={{ 
        background: theme.gradients.card // "linear-gradient(145deg, #fafaf8 0%, #f5f5f2 50%, #e8e6e0 100%)"
      }}
    >
      {/* 背景の和紙テクスチャ感 */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, ${theme.palette.neutral[100]} 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, ${theme.palette.primary[50]} 0%, transparent 50%)`
        }}
      />
      
      <div className="relative max-w-5xl mx-auto px-8 py-24">
        
        {/* 書道のような縦書き風レイアウト */}
        <div className="grid grid-cols-3 gap-20">
          
          {/* 期間 - 縦書き風 */}
          <div className="space-y-8">
            <div className="text-center">
              <div 
                className="text-sm tracking-[0.4em] mb-6"
                style={{ 
                  color: theme.palette.neutral[500],
                  fontFamily: theme.typography.body,
                  writingMode: 'horizontal-tb' // 横書きだが縦書き風の間隔
                }}
              >
                期
                <br />
                間
              </div>
              <div 
                className="text-3xl font-thin leading-tight"
                style={{ 
                  color: theme.palette.primary[900], // #2f1b14 墨色
                  fontFamily: theme.typography.heading
                }}
              >
                {data.duration}
              </div>
              {/* 墨で引いたような線 */}
              <div 
                className="w-px h-20 mx-auto mt-6"
                style={{ 
                  background: `linear-gradient(to bottom, 
                    ${theme.palette.primary[500]}, 
                    ${theme.palette.primary[900]}, 
                    transparent)`
                }}
              />
            </div>
          </div>
          
          {/* 場所 */}
          <div className="space-y-8">
            <div className="text-center">
              <div 
                className="text-sm tracking-[0.4em] mb-6"
                style={{ 
                  color: theme.palette.neutral[500],
                  fontFamily: theme.typography.body
                }}
              >
                場
                <br />
                所
              </div>
              <div 
                className="text-3xl font-thin leading-tight"
                style={{ 
                  color: theme.palette.secondary[900], // #3d4f2d 深山の緑
                  fontFamily: theme.typography.heading
                }}
              >
                {data.destination}
              </div>
              {/* 抹茶色の線 */}
              <div 
                className="w-px h-20 mx-auto mt-6"
                style={{ 
                  background: `linear-gradient(to bottom, 
                    ${theme.palette.secondary[500]}, 
                    ${theme.palette.secondary[900]}, 
                    transparent)`
                }}
              />
            </div>
          </div>
          
          {/* 予算 */}
          <div className="space-y-8">
            <div className="text-center">
              <div 
                className="text-sm tracking-[0.4em] mb-6"
                style={{ 
                  color: theme.palette.neutral[500],
                  fontFamily: theme.typography.body
                }}
              >
                予
                <br />
                算
              </div>
              <div 
                className="text-3xl font-thin leading-tight"
                style={{ 
                  color: theme.palette.accent[900], // #8b4513 古木の色
                  fontFamily: theme.typography.heading
                }}
              >
                {data.budget}
              </div>
              {/* 古銅色の線 */}
              <div 
                className="w-px h-20 mx-auto mt-6"
                style={{ 
                  background: `linear-gradient(to bottom, 
                    ${theme.palette.accent[500]}, 
                    ${theme.palette.accent[900]}, 
                    transparent)`
                }}
              />
            </div>
          </div>
        </div>

        {/* 間の余白 - 侘寂の「間」 */}
        <div className="my-32" />

        {/* ハイライト - 茶道の精神で（横並び） */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <div 
              className="text-sm tracking-[0.4em] mb-8"
              style={{ 
                color: theme.palette.neutral[500],
                fontFamily: theme.typography.body 
              }}
            >
              体験の調べ
            </div>
            {/* 円相のような装飾 */}
            <div 
              className="w-4 h-4 rounded-full mx-auto border-2"
              style={{ 
                borderColor: theme.palette.accent[500],
                backgroundColor: 'transparent'
              }}
            />
          </div>
          
          {/* 横並びの3列レイアウト */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {data.highlights?.map((highlight: string, index: number) => (
              <div key={index} className="text-center">
                <div className="relative">
                  {/* 背景の薄い円 */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div 
                      className="w-24 h-24 rounded-full opacity-10"
                      style={{ backgroundColor: theme.palette.accent[500] }}
                    />
                  </div>
                  
                  {/* テキスト */}
                  <div className="relative py-6">
                    <div 
                      className="text-base font-light leading-relaxed"
                      style={{ 
                        color: theme.palette.neutral[800],
                        fontFamily: theme.typography.accent
                      }}
                    >
                      {highlight}
                    </div>
                  </div>
                </div>
              </div>
            )) || null}
          </div>
        </div>
      </div>
    </div>
  );
}