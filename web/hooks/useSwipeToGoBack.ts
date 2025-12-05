import { useEffect, useRef, useState } from 'react';

interface UseSwipeToGoBackOptions {
  onSwipeBack: () => void;
  enabled?: boolean;
  edgeThreshold?: number; // Distance from left edge to trigger (default: 20px)
  swipeThreshold?: number; // Minimum swipe distance to trigger (default: 100px)
}

/**
 * Hook to detect swipe-to-go-back gesture from the left edge
 * Similar to native iOS/Android back navigation
 */
export function useSwipeToGoBack({
  onSwipeBack,
  enabled = true,
  edgeThreshold = 20,
  swipeThreshold = 100,
}: UseSwipeToGoBackOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;

      // Only trigger if touch starts near the left edge
      // Also check if we're not in a scrollable container that's scrolled
      const target = e.target as HTMLElement;
      const scrollableParent = target.closest('[data-scrollable]') || 
                               (target.scrollHeight > target.clientHeight ? target : null);
      
      if (startX <= edgeThreshold && (!scrollableParent || scrollableParent.scrollLeft === 0)) {
        touchStartRef.current = {
          x: startX,
          y: startY,
          time: Date.now(),
        };
        setIsSwiping(true);
        setSwipeProgress(0);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const currentX = touch.clientX;
      const currentY = touch.clientY;
      const deltaX = currentX - touchStartRef.current.x;
      const deltaY = Math.abs(currentY - touchStartRef.current.y);

      // Only proceed if horizontal swipe is dominant
      if (Math.abs(deltaX) > deltaY && deltaX > 0) {
        const progress = Math.min(deltaX / swipeThreshold, 1);
        setSwipeProgress(progress);
        
        // Prevent default scrolling
        e.preventDefault();
      } else if (deltaX < 0 || deltaY > 50) {
        // Cancel swipe if moving backwards or too much vertical movement
        touchStartRef.current = null;
        setIsSwiping(false);
        setSwipeProgress(0);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const deltaX = endX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      const deltaTime = Date.now() - touchStartRef.current.time;
      const velocity = Math.abs(deltaX) / deltaTime;

      // Trigger back navigation if:
      // 1. Swiped far enough, OR
      // 2. Swiped fast enough (quick flick)
      if (
        (deltaX >= swipeThreshold || (deltaX >= 50 && velocity > 0.5)) &&
        deltaY < 100 // Not too much vertical movement
      ) {
        onSwipeBack();
      }

      // Reset
      touchStartRef.current = null;
      setIsSwiping(false);
      setSwipeProgress(0);
    };

    const handleTouchCancel = () => {
      touchStartRef.current = null;
      setIsSwiping(false);
      setSwipeProgress(0);
    };

    // Add event listeners to document for edge detection
    // Use passive: true for start to avoid blocking scroll, we'll preventDefault in move if needed
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enabled, edgeThreshold, swipeThreshold, onSwipeBack]);

  return {
    isSwiping,
    swipeProgress,
    containerRef,
  };
}

