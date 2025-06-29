"use client";
import React from "react";

const ProgressModal = ({ 
  isVisible, 
  progress, 
  estimatedTime, 
  onCancel, 
  showNextStep = false, 
  nextStepTitle = "詳細情報を読み込み中...",
  nextStepSubtitle = "画像・マップ・ホテル情報を取得しています"
}) => {
  if (!isVisible) return null;

  const progressPercentage = Math.min(100, progress || 0);
  const isCompleted = progressPercentage >= 100;
  const showTransition = isCompleted && showNextStep;

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
            {showTransition ? nextStepTitle : "AIが旅行プランを作成中..."}
          </h3>
          {showTransition && (
            <p className="text-gray-600 mb-4">
              {nextStepSubtitle}
            </p>
          )}
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${showTransition ? 0 : progressPercentage}%` }}
            />
          </div>
          <p className="text-gray-600">
            進捗: {showTransition ? "0.0" : progressPercentage.toFixed(1)}%
          </p>
          {estimatedTime && (
            <p className="text-sm text-gray-500 mt-2">
              推定時間: {Math.ceil(estimatedTime / 60)}分
            </p>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
            >
              キャンセル
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;
