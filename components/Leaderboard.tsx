import { useEffect, useState, useRef, useCallback } from 'react';
import { scoreService, ScoreEntry } from '../lib/scoreService';
import { formatNumber } from '../lib/formatNumber';
import { textConfig } from '../lib/textConfig';

interface LeaderboardProps {
  className?: string;
  refresh?: number | boolean; // Add a refresh prop to trigger reloads
  compact?: boolean; // Add compact mode for horizontal layout
  highlightScoreId?: string; // Score ID to highlight in the leaderboard
}

export function Leaderboard({ className = '', refresh = 0, compact = false, highlightScoreId }: LeaderboardProps) {
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
    loadScores(10).catch(() => {
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
      setError(textConfig.leaderboard.error);
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
    if (!highlightScoreId || !scrollContainerRef.current || hasScrolledToHighlightRef.current || loading || loadingMore) return;
    
    // Find the highlighted row in the current scores
    const highlightedScore = scores.find(score => score.id === highlightScoreId);
    if (!highlightedScore) {
      // Score not found yet, might need to load more or wait for refresh
      return;
    }
    
    const scrollContainer = scrollContainerRef.current;
    
    // Wait for DOM to update, then scroll to highlighted row
    const timeoutId = setTimeout(() => {
      const highlightedRow = highlightedRowRef.current;
      if (highlightedRow && scrollContainer) {
        const rowTop = highlightedRow.offsetTop;
        const rowHeight = highlightedRow.offsetHeight;
        const containerHeight = scrollContainer.clientHeight;
        
        // Calculate position to center the row in view
        const targetScroll = rowTop - (containerHeight / 2) + (rowHeight / 2);
        
        scrollContainer.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
        
        hasScrolledToHighlightRef.current = true;
      }
    }, 500); // Increased timeout to ensure leaderboard has fully rendered after refresh
    
    return () => clearTimeout(timeoutId);
  }, [highlightScoreId, scores.length, loading, loadingMore]);

  // Reset scroll flag when highlight changes
  useEffect(() => {
    if (!highlightScoreId) {
      hasScrolledToHighlightRef.current = false;
    } else {
      // Reset scroll flag when a new score ID is provided to allow scrolling again
      hasScrolledToHighlightRef.current = false;
    }
  }, [highlightScoreId]);

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
        <h2 className={`text-center mb-3 text-sm sm:text-base ${textColorClass}`}>{textConfig.leaderboard.title}</h2>
        <p className={`text-center opacity-60 text-xs sm:text-sm ${textColorClass}`}>{textConfig.leaderboard.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <h2 className={`text-center mb-4 ${textColorClass}`}>{textConfig.leaderboard.title}</h2>
        <p className="text-center opacity-60 text-red-600">{error}</p>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className={`${className}`}>
        <h2 className={`text-center mb-3 text-sm sm:text-base ${textColorClass}`}>{textConfig.leaderboard.title}</h2>
        <p className={`text-center opacity-60 text-xs sm:text-sm ${textColorClass}`}>{textConfig.leaderboard.empty}</p>
      </div>
    );
  }

  // Use light background for white pages, dark for dark pages
  const isLightMode = className?.includes('text-black') ?? false;
  const bgClass = isLightMode ? 'bg-gray-100' : 'bg-black/80';
  const borderClass = isLightMode ? 'border-gray-300' : 'border-white/30';
  const headerBorderClass = isLightMode ? 'border-gray-400' : 'border-white/20';
  const rowBorderClass = isLightMode ? 'border-gray-300' : 'border-white/10';
  const textClass = isLightMode ? 'text-black' : 'text-white';
  const mutedTextClass = isLightMode ? 'text-gray-600' : 'text-white/60';

  const hasMore = displayLimit < totalCount;

  return (
    <div id="leaderboard-view" className={`${bgClass} rounded border ${borderClass} ${compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4 md:p-5'} backdrop-blur-sm`}>
      {/* Table */}
      {/* RESPONSIVE: Use viewport-relative units (vh) instead of fixed pixels for better mobile support */}
      <div 
        ref={scrollContainerRef}
        className={`overflow-y-auto custom-scrollbar ${compact ? 'max-h-[25vh] sm:max-h-[30vh] md:max-h-[35vh]' : 'max-h-[30vh] sm:max-h-[35vh] md:max-h-[40vh]'}`}
      >
        <table className="w-full">
          <thead className={`sticky top-0 z-10 ${bgClass}`}>
            <tr 
              className={`border-b ${headerBorderClass}`}
              style={{ fontFamily: '"Urbanist", sans-serif' }}>
              <th className={`text-left ${mutedTextClass} ${compact ? 'text-[10px] sm:text-xs pb-1 sm:pb-2 pr-1 sm:pr-2' : 'text-xs sm:text-sm pb-2 sm:pb-3 pr-2 sm:pr-3'}`}>{textConfig.leaderboard.table.rank}</th>
              <th className={`text-left ${mutedTextClass} ${compact ? 'text-[10px] sm:text-xs pb-1 sm:pb-2 pr-1 sm:pr-2' : 'text-xs sm:text-sm pb-2 sm:pb-3 pr-2 sm:pr-3'}`}>{textConfig.leaderboard.table.name}</th>
              <th className={`text-right ${mutedTextClass} ${compact ? 'text-[10px] sm:text-xs pb-1 sm:pb-2 pr-1 sm:pr-2' : 'text-xs sm:text-sm pb-2 sm:pb-3 pr-2 sm:pr-3'}`}>{textConfig.leaderboard.table.distance}</th>
              <th className={`text-right ${mutedTextClass} ${compact ? 'text-[10px] sm:text-xs pb-1 sm:pb-2 pr-1 sm:pr-2' : 'text-xs sm:text-sm pb-2 sm:pb-3 pr-2 sm:pr-3'}`}>{textConfig.leaderboard.table.combo}</th>
              <th className={`text-right ${mutedTextClass} ${compact ? 'text-[10px] sm:text-xs pb-1 sm:pb-2' : 'text-xs sm:text-sm pb-2 sm:pb-3'}`}>{textConfig.leaderboard.table.elfVsGrinch}</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => {
              const isHighlighted = highlightScoreId && score.id === highlightScoreId;
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
                  {/* RESPONSIVE: Use percentage-based max-width instead of fixed pixels */}
                  <td className={`text-left ${rowTextClass} ${compact ? 'text-[10px] sm:text-xs py-1 sm:py-2 pr-1 sm:pr-2 max-w-[20vw] sm:max-w-[15vw] truncate' : 'text-xs sm:text-sm py-2 sm:py-3 pr-2 sm:pr-3'}`}>
                    {score.player_name}
                  </td>
                  <td className={`text-right ${rowTextClass} ${compact ? 'text-[10px] sm:text-xs py-1 sm:py-2 pr-1 sm:pr-2' : 'text-xs sm:text-sm py-2 sm:py-3 pr-2 sm:pr-3'}`}>
                    {formatNumber(score.distance)}m
                  </td>
                  <td className={`text-right ${rowTextClass} ${compact ? 'text-[10px] sm:text-xs py-1 sm:py-2 pr-1 sm:pr-2' : 'text-xs sm:text-sm py-2 sm:py-3 pr-2 sm:pr-3'}`}>
                    {score.max_combo && score.max_combo > 0 ? (
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        <img 
                          src="/Assets/Combo.svg" 
                          alt={textConfig.common.altText.combo} 
                          className="w-2 h-2 sm:w-2.5 sm:h-2.5"
                        />
                        <span className={`${isLightMode ? 'text-yellow-600' : 'text-yellow-400'}`}>
                          {score.max_combo}x
                        </span>
                      </div>
                    ) : (
                      <span className={mutedTextClass}>-</span>
                    )}
                  </td>
                  <td className={`text-right ${rowTextClass} ${compact ? 'text-[10px] sm:text-xs py-1 sm:py-2' : 'text-xs sm:text-sm py-2 sm:py-3'}`}>
                    {(score.elf_score !== undefined && score.elf_score > 0) || (score.grinch_score !== undefined && score.grinch_score > 0) ? (
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        {score.elf_score !== undefined && score.elf_score > 0 && (
                          <span className={`flex items-center gap-0.5 ${mutedTextClass} ${compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'}`}>
                            <img src="/Assets/Characters/Elf.svg" alt={textConfig.common.altText.elf} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {score.elf_score}
                          </span>
                        )}
                        {score.grinch_score !== undefined && score.grinch_score > 0 && (
                          <span className={`flex items-center gap-0.5 ${mutedTextClass} ${compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'}`}>
                            <img src="/Assets/Characters/Grinch.svg" alt={textConfig.common.altText.grinch} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {score.grinch_score}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={mutedTextClass}>-</span>
                    )}
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
                {textConfig.leaderboard.loadingMore}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}