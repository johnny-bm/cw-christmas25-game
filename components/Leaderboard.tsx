import { useEffect, useState, useRef, useCallback } from 'react';
import { scoreService, ScoreEntry } from '../lib/scoreService';
import { formatNumber } from '../lib/formatNumber';
import { Zap } from 'lucide-react';

interface LeaderboardProps {
  className?: string;
  refresh?: number | boolean; // Add a refresh prop to trigger reloads
  compact?: boolean; // Add compact mode for horizontal layout
  highlightPlayerName?: string; // Player name/initials to highlight in the leaderboard
}

export function Leaderboard({ className = '', refresh = 0, compact = false, highlightPlayerName }: LeaderboardProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [displayLimit, setDisplayLimit] = useState(10);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const previousScrollTopRef = useRef<number>(0);
  const previousScrollHeightRef = useRef<number>(0);
  const shouldRestoreScrollRef = useRef<boolean>(false);
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  const hasScrolledToHighlightRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset display limit when refresh changes
    setDisplayLimit(10);
    // Load initial scores on refresh
    loadScores(10).catch(err => {
      console.error('Leaderboard load error:', err);
      setScores([]);
      setLoading(false);
    });
  }, [refresh]);

  const loadScores = async (limit: number) => {
    try {
      setLoading(true);
      setError(null);
      // Reset scroll restoration flag for initial loads
      shouldRestoreScrollRef.current = false;
      const [topScores, count] = await Promise.all([
        scoreService.getTopScores(limit),
        scoreService.getTotalCount()
      ]);
      setScores(topScores || []); // Ensure we always have an array
      setTotalCount(count);
    } catch (error) {
      console.error('Failed to load scores:', error);
      setError('Failed to load leaderboard');
      setScores([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || displayLimit >= totalCount) return;
    
    // Save current scroll position and height BEFORE loading
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      previousScrollTopRef.current = scrollContainer.scrollTop;
      previousScrollHeightRef.current = scrollContainer.scrollHeight;
      shouldRestoreScrollRef.current = true;
    }
    
    try {
      setLoadingMore(true);
      const newLimit = displayLimit + 10;
      const moreScores = await scoreService.getTopScores(newLimit);
      // Update scores without triggering the initial load effect
      setScores(moreScores || []);
      setDisplayLimit(newLimit);
    } catch (error) {
      console.error('Failed to load more scores:', error);
      shouldRestoreScrollRef.current = false;
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, displayLimit, totalCount]);

  // Restore scroll position after scores are updated (only when loading more)
  useEffect(() => {
    if (!shouldRestoreScrollRef.current || !scrollContainerRef.current) return;
    if (loadingMore) return; // Wait until loading is complete
    
    const scrollContainer = scrollContainerRef.current;
    const previousScrollTop = previousScrollTopRef.current;
    const previousScrollHeight = previousScrollHeightRef.current;
    
    // Use setTimeout to ensure DOM has fully updated and browser has painted
    const timeoutId = setTimeout(() => {
      if (scrollContainer && shouldRestoreScrollRef.current) {
        const newScrollHeight = scrollContainer.scrollHeight;
        const scrollDifference = newScrollHeight - previousScrollHeight;
        // Maintain the same relative scroll position by adding the height difference
        scrollContainer.scrollTop = previousScrollTop + scrollDifference;
        shouldRestoreScrollRef.current = false;
      }
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [scores.length, loadingMore]);

  // Scroll to highlighted row when it first appears
  useEffect(() => {
    if (!highlightPlayerName || !highlightedRowRef.current || !scrollContainerRef.current || hasScrolledToHighlightRef.current) return;
    
    const scrollContainer = scrollContainerRef.current;
    const highlightedRow = highlightedRowRef.current;
    
    // Wait for DOM to update, then scroll to highlighted row
    const timeoutId = setTimeout(() => {
      if (highlightedRow && scrollContainer) {
        const rowTop = highlightedRow.offsetTop;
        const rowHeight = highlightedRow.offsetHeight;
        const containerTop = scrollContainer.scrollTop;
        const containerHeight = scrollContainer.clientHeight;
        
        // Calculate position to center the row in view
        const targetScroll = rowTop - (containerHeight / 2) + (rowHeight / 2);
        
        scrollContainer.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
        
        hasScrolledToHighlightRef.current = true;
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [highlightPlayerName, scores.length]);

  // Reset scroll flag when highlight changes
  useEffect(() => {
    if (!highlightPlayerName) {
      hasScrolledToHighlightRef.current = false;
    }
  }, [highlightPlayerName]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreTriggerRef.current || !scrollContainerRef.current || loading || loadingMore || displayLimit >= totalCount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && displayLimit < totalCount) {
          loadMore();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    const triggerElement = loadMoreTriggerRef.current;
    observer.observe(triggerElement);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, loading, loadingMore, displayLimit, totalCount, scores.length]);

  // Determine text color based on className (if it contains 'text-black', use black, otherwise use white)
  const textColorClass = className?.includes('text-black') ? 'text-black' : 'text-white';
  const mutedTextColorClass = className?.includes('text-black') ? 'text-gray-600' : 'text-white/60';

  if (loading) {
    return (
      <div className={`${className}`}>
        <h2 className={`text-center mb-3 text-sm sm:text-base ${textColorClass}`}>🏆 Leaderboard</h2>
        <p className={`text-center opacity-60 text-xs sm:text-sm ${textColorClass}`}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <h2 className={`text-center mb-4 ${textColorClass}`}>Leaderboard</h2>
        <p className="text-center opacity-60 text-red-600">{error}</p>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className={`${className}`}>
        <h2 className={`text-center mb-3 text-sm sm:text-base ${textColorClass}`}>🏆 Leaderboard</h2>
        <p className={`text-center opacity-60 text-xs sm:text-sm ${textColorClass}`}>No scores yet. Be the first!</p>
      </div>
    );
  }

  // Use light background for white pages, dark for dark pages
  const isLightMode = className?.includes('text-black') ?? false;
  const bgClass = isLightMode ? 'bg-gray-100' : 'bg-black/80';
  const borderClass = isLightMode ? 'border-gray-300' : 'border-white/30';
  const headerBgClass = isLightMode ? 'bg-gray-200' : 'bg-black/90';
  const headerBorderClass = isLightMode ? 'border-gray-400' : 'border-white/20';
  const rowBorderClass = isLightMode ? 'border-gray-300' : 'border-white/10';
  const textClass = isLightMode ? 'text-black' : 'text-white';
  const mutedTextClass = isLightMode ? 'text-gray-600' : 'text-white/60';

  const hasMore = displayLimit < totalCount;

  return (
    <div className={`${bgClass} rounded border ${borderClass} ${compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4 md:p-5'} backdrop-blur-sm`}>
      {/* Table */}
      <div 
        ref={scrollContainerRef}
        className={`overflow-y-auto custom-scrollbar ${compact ? 'max-h-[200px] sm:max-h-[300px]' : 'max-h-[250px] sm:max-h-[350px] md:max-h-[400px]'}`}
      >
        <table className="w-full">
          <thead className={`sticky top-0 ${headerBgClass} backdrop-blur-sm z-10`}>
            <tr 
              className={`border-b ${headerBorderClass}`}
              style={{ fontFamily: '"Urbanist", sans-serif' }}>
              <th className={`text-left ${mutedTextClass} ${compact ? 'text-[10px] sm:text-xs pb-1 sm:pb-2 pr-1 sm:pr-2' : 'text-xs sm:text-sm pb-2 sm:pb-3 pr-2 sm:pr-3'}`}>#</th>
              <th className={`text-left ${mutedTextClass} ${compact ? 'text-[10px] sm:text-xs pb-1 sm:pb-2 pr-1 sm:pr-2' : 'text-xs sm:text-sm pb-2 sm:pb-3 pr-2 sm:pr-3'}`}>Name</th>
              <th className={`text-right ${mutedTextClass} ${compact ? 'text-[10px] sm:text-xs pb-1 sm:pb-2' : 'text-xs sm:text-sm pb-2 sm:pb-3'}`}>Distance</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => {
              const isHighlighted = highlightPlayerName && score.player_name.toUpperCase() === highlightPlayerName.toUpperCase().trim();
              const rowBgClass = isHighlighted 
                ? (isLightMode ? 'bg-yellow-200 border-yellow-500' : 'bg-yellow-900/50 border-yellow-500/60')
                : '';
              const rowTextClass = isHighlighted 
                ? (isLightMode ? 'text-black font-bold' : 'text-yellow-200 font-bold')
                : textClass;
              const rowBorderClassHighlighted = isHighlighted 
                ? (isLightMode ? 'border-yellow-500' : 'border-yellow-500/60')
                : rowBorderClass;
              
              return (
                <tr 
                  key={score.id}
                  ref={isHighlighted ? highlightedRowRef : null}
                  className={`border-b ${rowBorderClassHighlighted} ${rowBgClass} ${isHighlighted ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''} transition-all duration-300`}
                >
                  <td className={`text-left ${rowTextClass} ${compact ? 'text-[10px] sm:text-xs py-1 sm:py-2 pr-1 sm:pr-2' : 'text-xs sm:text-sm py-2 sm:py-3 pr-2 sm:pr-3'}`}>
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `${index + 1}.`}
                  </td>
                  <td className={`text-left ${rowTextClass} ${compact ? 'text-[10px] sm:text-xs py-1 sm:py-2 pr-1 sm:pr-2 max-w-[80px] sm:max-w-[120px] truncate' : 'text-xs sm:text-sm py-2 sm:py-3 pr-2 sm:pr-3'}`}>
                    {score.player_name}
                  </td>
                  <td className={`text-right ${rowTextClass} ${compact ? 'text-[10px] sm:text-xs py-1 sm:py-2' : 'text-xs sm:text-sm py-2 sm:py-3'}`}>
                    <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                      <span>{formatNumber(score.distance)}m</span>
                      {score.max_combo > 0 && (
                        <span className={`flex items-center gap-0.5 ${isLightMode ? 'text-yellow-600' : 'text-yellow-400'} opacity-70`}>
                          <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                          {score.max_combo}x
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Infinite scroll trigger */}
        {hasMore && (
          <div ref={loadMoreTriggerRef} className="h-4 flex items-center justify-center py-2">
            {loadingMore && (
              <div className={`text-xs ${mutedTextClass}`}>
                Loading more...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}