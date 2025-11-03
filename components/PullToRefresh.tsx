import React, { useState, useCallback } from 'react';
import RefreshIcon from './icons/RefreshIcon';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const REFRESH_THRESHOLD = 80; // pixels to pull to trigger refresh
const PULL_RESISTANCE = 0.5; // makes the pull feel "heavier"

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pullStart, setPullStart] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await onRefresh();
    // A small delay for the user to see the refresh animation completion
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, [onRefresh, isRefreshing]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only initiate pull-to-refresh if the user is at the top of the page
    if (window.scrollY === 0 && !isRefreshing) {
      setPullStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStart === null || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - pullStart;

    if (distance > 0) {
      // Prevent the browser's default pull-to-refresh or scroll-down behavior
      e.preventDefault();
      setPullDistance(distance * PULL_RESISTANCE);
    }
  };

  const handleTouchEnd = () => {
    if (pullStart === null || isRefreshing) return;

    if (pullDistance > REFRESH_THRESHOLD) {
      handleRefresh();
    }
    
    // Reset states
    setPullStart(null);
    setPullDistance(0);
  };

  // Determine the transform for the content based on pull distance and refresh state
  const contentTransform = isRefreshing
    ? `translateY(${REFRESH_THRESHOLD * PULL_RESISTANCE}px)`
    : `translateY(${pullDistance}px)`;
    
  // Animate the content snapping back only after the touch ends
  const contentTransition = pullStart === null ? 'transform 0.3s' : 'none';

  // Calculate rotation and opacity for the refresh icon
  const iconRotation = isRefreshing ? 0 : Math.min((pullDistance / REFRESH_THRESHOLD) * 360, 360);
  const iconOpacity = isRefreshing ? 1 : Math.min(pullDistance / (REFRESH_THRESHOLD / 2), 1);

  return (
    <div
      className="relative" // Correction : Ajout de la position relative
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* This is the visual indicator that appears when pulling */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-center items-start pt-3 text-slate-400 pointer-events-none"
        style={{ height: REFRESH_THRESHOLD, opacity: iconOpacity }}
        aria-hidden="true"
      >
        <div
          className={isRefreshing ? 'animate-spin' : ''}
          style={{ transform: `rotate(${iconRotation}deg)` }}
        >
          <RefreshIcon />
        </div>
      </div>
      
      {/* This wrapper applies the pull-down transform to the children */}
      <div
        style={{ transform: contentTransform, transition: contentTransition }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
