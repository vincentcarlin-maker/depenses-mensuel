import React, { useState, useRef, useEffect, useCallback } from 'react';
import RefreshIcon from './icons/RefreshIcon';

const PULL_THRESHOLD = 80;

interface PullToRefreshProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  children: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, isRefreshing, children }) => {
  const pullStartRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only track pulls that start at the top of the scrollable area.
    if (window.scrollY === 0 && !isRefreshing) {
      pullStartRef.current = e.touches[0].clientY;
    } else {
      pullStartRef.current = null;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (pullStartRef.current === null) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - pullStartRef.current;

    // If scrolling up, stop tracking.
    if (distance < 0) {
      pullStartRef.current = null;
      setPullDistance(0);
      return;
    }
    
    // Apply resistance for a more natural feel.
    const resistedDistance = Math.pow(distance, 0.85);
    setPullDistance(resistedDistance);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullStartRef.current === null) return;
    
    if (pullDistance > PULL_THRESHOLD && !isRefreshing) {
      onRefresh();
    }
    
    // Reset the start position ref.
    pullStartRef.current = null;
    
    // Let the isRefreshing prop control the visual state.
    // If we didn't pull far enough, reset the distance immediately.
    if (!isRefreshing && pullDistance <= PULL_THRESHOLD) {
        setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh]);
  
  useEffect(() => {
    // When parent component signals refreshing is done, reset pull distance.
    if (!isRefreshing) {
      setPullDistance(0);
    }
  }, [isRefreshing]);

  useEffect(() => {
    // Use document to capture touch events globally once a pull has started.
    // This handles cases where the finger moves outside the app area.
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Visual calculations
  const rotation = Math.min(pullDistance / PULL_THRESHOLD, 1) * 360;
  const opacity = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const contentTranslateY = isRefreshing ? PULL_THRESHOLD : pullDistance;

  // Dynamically create a transition style to handle both user drag (no transition) and snapping back (with transition).
  const transitionStyle = pullStartRef.current === null ? 'transform 0.3s ease' : 'none';

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center items-start pt-4 pointer-events-none"
        style={{ 
            height: `${PULL_THRESHOLD}px`, 
            transform: `translateY(-100%)` 
        }}
      >
        <div 
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 shadow-lg text-slate-500 dark:text-slate-400 transition-all duration-200 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ 
                opacity: isRefreshing ? 1 : opacity, 
                transform: `rotate(${isRefreshing ? 360 : rotation}deg)` 
            }}
        >
            <RefreshIcon />
        </div>
      </div>
      <div
        style={{ transform: `translateY(${contentTranslateY}px)`, transition: transitionStyle }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
