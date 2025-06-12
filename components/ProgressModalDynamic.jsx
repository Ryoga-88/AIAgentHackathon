"use client";
import React, { useEffect, useState, useRef } from "react";

const ProgressModalDynamic = ({ 
  isVisible, 
  progress, 
  totalPlans = 3, 
  onCancel, 
  onPlanReceived,
  customTitle = "AIが旅行プランを作成中...",
  customSubtitle = "あなたの理想の旅程を生成しています"
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [isCalculating, setIsCalculating] = useState(true);
  const [plansReceived, setPlansReceived] = useState(0);
  const [timePerPlan, setTimePerPlan] = useState(null);
  const [smoothedEstimatedTime, setSmoothedEstimatedTime] = useState(null);
  
  const startTimeRef = useRef(null);
  const firstPlanTimeRef = useRef(null);
  const estimateHistoryRef = useRef([]);

  useEffect(() => {
    if (!isVisible) {
      // リセット
      setElapsedTime(0);
      setEstimatedTime(null);
      setIsCalculating(true);
      setPlansReceived(0);
      setTimePerPlan(null);
      setSmoothedEstimatedTime(null);
      startTimeRef.current = null;
      firstPlanTimeRef.current = null;
      estimateHistoryRef.current = [];
      return;
    }

    // 開始時間を記録
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  // プランが受信されたときの処理
  useEffect(() => {
    if (progress > 0 && startTimeRef.current) {
      const currentTime = Date.now();
      const totalElapsedTime = Math.floor((currentTime - startTimeRef.current) / 1000);
      
      // 進捗に基づいてプラン完成数を計算（より精密に）
      let currentPlans;
      if (progress < 25) {
        currentPlans = 0;
      } else if (progress < 60) {
        currentPlans = 1;
      } else if (progress < 90) {
        currentPlans = 2;
      } else {
        currentPlans = Math.min(3, Math.floor((progress / 100) * totalPlans));
      }
      
      if (currentPlans > plansReceived) {
        setPlansReceived(currentPlans);
        
        if (currentPlans === 1 && !firstPlanTimeRef.current) {
          // 最初のプランが完成した時間を記録
          firstPlanTimeRef.current = currentTime;
          const timeForFirstPlan = Math.floor((firstPlanTimeRef.current - startTimeRef.current) / 1000);
          setTimePerPlan(timeForFirstPlan);
          setIsCalculating(false);
          
          // 初期推定時間を計算（第一プランの時間を基準）
          const initialEstimate = Math.round(timeForFirstPlan * totalPlans * 0.9); // 最初のプランは時間がかかるため0.9倍で調整
          setEstimatedTime(initialEstimate);
          setSmoothedEstimatedTime(initialEstimate);
          estimateHistoryRef.current = [initialEstimate];
        } else if (currentPlans > 1 && timePerPlan) {
          // 2番目以降のプランで推定時間を再計算
          const avgTimePerPlan = totalElapsedTime / currentPlans;
          const newEstimate = avgTimePerPlan * totalPlans;
          
          // 加重移動平均でスムージング（より長い履歴を保持）
          estimateHistoryRef.current.push(newEstimate);
          if (estimateHistoryRef.current.length > 5) {
            estimateHistoryRef.current.shift();
          }
          
          // より細かい重み付け
          const weights = [0.1, 0.15, 0.2, 0.25, 0.3];
          let weightedSum = 0;
          let totalWeight = 0;
          
          estimateHistoryRef.current.forEach((estimate, index) => {
            const weight = weights[Math.min(index, weights.length - 1)];
            weightedSum += estimate * weight;
            totalWeight += weight;
          });
          
          const smoothedEstimate = Math.round(weightedSum / totalWeight);
          setSmoothedEstimatedTime(smoothedEstimate);
          setEstimatedTime(newEstimate);
        }
      }
      
      // 現在の進捗に基づく動的推定計算（プラン完成していない場合）
      if (!isCalculating && timePerPlan && progress < 100 && progress > 0) {
        const progressRatio = progress / 100;
        
        // 非線形な進捗パターンを考慮（最初の20%は時間がかかり、中盤は加速、最後の10%で減速）
        let adjustedProgressRatio;
        if (progressRatio < 0.2) {
          adjustedProgressRatio = progressRatio * 0.5; // 最初の20%は遅い
        } else if (progressRatio < 0.8) {
          adjustedProgressRatio = 0.1 + (progressRatio - 0.2) * 1.2; // 中盤は加速
        } else {
          adjustedProgressRatio = 0.82 + (progressRatio - 0.8) * 0.9; // 最後の20%は少し減速
        }
        
        const expectedTimeForProgress = timePerPlan * totalPlans * adjustedProgressRatio;
        
        // 実際の時間が予想より遅い場合、推定時間を調整
        if (totalElapsedTime > expectedTimeForProgress * 1.15) {
          // 現在のペースに基づいて全体時間を再推定
          const currentPace = totalElapsedTime / progressRatio;
          const dynamicEstimate = Math.round(currentPace);
          
          // 急激な変化を避けるため、既存の推定値とブレンド（より保守的に）
          const blendRatio = Math.min(0.4, (totalElapsedTime / (timePerPlan * totalPlans)) * 0.5);
          const blendedEstimate = Math.round((smoothedEstimatedTime * (1 - blendRatio)) + (dynamicEstimate * blendRatio));
          setSmoothedEstimatedTime(blendedEstimate);
        }
      }
    }
  }, [progress, plansReceived, timePerPlan, totalPlans, isCalculating, smoothedEstimatedTime]);

  const getCurrentActivity = () => {
    const progressPercentage = Math.min(100, progress || 0);
    
    // カスタマイズ用の活動表示（totalPlans = 1の場合）
    if (totalPlans === 1) {
      if (progressPercentage < 15) {
        return "要望を分析中...";
      } else if (progressPercentage < 35) {
        return "現在のプランを解析中...";
      } else if (progressPercentage < 60) {
        return "カスタマイズされたプランを作成中...";
      } else if (progressPercentage < 85) {
        return "スポット情報を最新化中...";
      } else if (progressPercentage < 100) {
        return "最終調整中...";
      } else {
        return "カスタマイズ完了";
      }
    }
    
    // 既存の3プラン生成用の活動表示
    if (progressPercentage < 10) {
      return "目的地の観光情報を調査中";
    } else if (progressPercentage < 25) {
      return "最適なルートを計算中";
    } else if (progressPercentage < 45) {
      return "第1プラン：晴天時向けプランを作成中";
    } else if (progressPercentage < 60) {
      return "第1プランの詳細を調整中";
    } else if (progressPercentage < 75) {
      return "第2プラン：別アプローチのプランを作成中";
    } else if (progressPercentage < 90) {
      return "第3プラン：雨天時対応プランを作成中";
    } else if (progressPercentage < 100) {
      return "全プランの最終チェック中";
    } else {
      return "生成完了";
    }
  };

  if (!isVisible) return null;

  const progressPercentage = Math.min(100, progress || 0);
  const remainingTime = smoothedEstimatedTime ? Math.max(0, smoothedEstimatedTime - elapsedTime) : 0;
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900 bg-opacity-75"></div>
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* アイコン */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {customTitle}
          </h3>
          <p className="text-gray-600 mb-2">
            {customSubtitle}
          </p>
          <p className="text-sm text-blue-600 font-medium">
            {getCurrentActivity()}
          </p>

          {/* プログレスバー */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>進捗状況</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* 時間情報 */}
          <div className="flex justify-center text-sm text-gray-500 mb-6">
            <div className="text-center">
              <span className="block font-medium text-gray-700">経過時間</span>
              <span className="text-lg font-semibold text-blue-600">{formatTime(elapsedTime)}</span>
            </div>
          </div>

          {/* プラン生成状況（totalPlans > 1の場合のみ表示）*/}
          {totalPlans > 1 && (
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm font-medium text-gray-700 mb-2">プラン生成状況</div>
              <div className="space-y-2">
                {Array.from({ length: totalPlans }, (_, index) => (
                  <div key={index} className={`flex items-center text-sm ${
                    plansReceived > index ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      plansReceived > index ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    プラン {index + 1}
                    {plansReceived > index && <span className="ml-2 text-xs">✓</span>}
                    {plansReceived === index && <span className="ml-2 text-xs animate-pulse">生成中...</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              キャンセル
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressModalDynamic;
