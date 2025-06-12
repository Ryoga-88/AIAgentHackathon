"use client";
import React from "react";

const ProgressModal = ({ isVisible, progress, estimatedTime, onCancel }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900 bg-opacity-75"></div>
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            AIが旅行プランを作成中...
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progress || 0)}%` }}
            />
          </div>
          <p className="text-gray-600">
            進捗: {Math.min(100, progress || 0).toFixed(1)}%
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
