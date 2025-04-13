import React, { useState, useEffect, useRef } from 'react';
import SplineViewer from './SplineViewer';

const LoadingTexts = [
  "Firing up neurons... please wait",
  "Stretching artificial muscles",
  "Lubricating digital joints",
  "Waking up from REM sleep mode",
  "Brewing caffeine for CPU cortex",
];

const SplineLoader = ({ onLoadingComplete, showStatus = true }) => {
  const initialSplineRef = useRef(null);
  const [currentLoadingPhase, setCurrentLoadingPhase] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingText, setLoadingText] = useState(LoadingTexts[0]);
  const [textOpacity, setTextOpacity] = useState(1);

  // Handle loading text animation
  useEffect(() => {
    if (!isInitialLoading) return;

    const textInterval = setInterval(() => {
      setTextOpacity(0);
      
      setTimeout(() => {
        setCurrentLoadingPhase(prev => {
          const nextPhase = prev + 1;
          if (nextPhase >= LoadingTexts.length) {
            clearInterval(textInterval);
            return prev;
          }
          setLoadingText(LoadingTexts[nextPhase]);
          setTextOpacity(1);
          return nextPhase;
        });
      }, 500); // Wait for fade out before changing text
    }, 1300); // Change text every 1 second (reduced from 1.2s to show more messages)
    
    // Handle transition to main scene after 6 seconds (increased from 5 seconds to allow for more messages)
    const loadingTimer = setTimeout(() => {
      setIsInitialLoading(false);
      if (onLoadingComplete) onLoadingComplete();
    }, 6000);
    
    return () => {
      clearInterval(textInterval);
      clearTimeout(loadingTimer);
    };
  }, [isInitialLoading, onLoadingComplete]);

  return (
    <div className="loader-container">
      {/* Initial loading animation */}
      {isInitialLoading && (
        <>
          <div className="spline-container">
            <SplineViewer 
              ref={initialSplineRef}
              url="https://prod.spline.design/xpxDmF5OWl8sWQlZ/scene.splinecode" 
              persistOnUpdate={true}
            />
          </div>
          <div className="loading-text" style={{ opacity: textOpacity }}>
            {loadingText}
          </div>
          <div className="loading-progress">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${(currentLoadingPhase + 1) / LoadingTexts.length * 100}%` 
              }}
            ></div>
          </div>
        </>
      )}
      
      {/* Main scene after loading - we don't need to render this here anymore,
          as it will be handled by the App component for persistence */}
      {!isInitialLoading && null}
    </div>
  );
};

export default SplineLoader; 