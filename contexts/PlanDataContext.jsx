"use client";
import { createContext, useContext, useState } from 'react';

const PlanDataContext = createContext();

export const PlanDataProvider = ({ children }) => {
  const [planData, setPlanData] = useState(null);
  const [isDirectTransition, setIsDirectTransition] = useState(false);
  
  const setGeneratedPlanData = (plans, travelDates, requestData) => {
    console.log('🎯 Context: setGeneratedPlanData実行');
    console.log('🎯 Context: plans:', plans);
    console.log('🎯 Context: travelDates:', travelDates);
    console.log('🎯 Context: requestData:', requestData);
    
    const newPlanData = {
      plans,
      travelDates,
      requestData,
      timestamp: Date.now()
    };
    
    setPlanData(newPlanData);
    setIsDirectTransition(true);
    
    console.log('🎯 Context: データ設定完了');
    console.log('🎯 Context: isDirectTransition set to true');
  };
  
  const clearPlanData = () => {
    console.log('🎯 Context: clearPlanData実行');
    setPlanData(null);
    setIsDirectTransition(false);
    console.log('🎯 Context: データクリア完了');
  };
  
  return (
    <PlanDataContext.Provider value={{
      planData,
      isDirectTransition,
      setGeneratedPlanData,
      clearPlanData
    }}>
      {children}
    </PlanDataContext.Provider>
  );
};

export const usePlanData = () => {
  const context = useContext(PlanDataContext);
  if (!context) {
    throw new Error('usePlanData must be used within a PlanDataProvider');
  }
  return context;
};