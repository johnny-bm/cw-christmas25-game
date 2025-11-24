import { Zap } from 'lucide-react';
import { useEffect } from 'react';
import { Leaderboard } from './Leaderboard';
import { formatNumber } from '../lib/formatNumber';

interface StartScreenProps {
  onStart: () => void;
  bestDistance: number;
  leaderboardRefresh?: number;
}

export function StartScreen({ onStart, bestDistance, leaderboardRefresh = 0 }: StartScreenProps) {
  useEffect(() => {
    console.log('✅ StartScreen RENDERED - Refresh count:', leaderboardRefresh);
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onStart, leaderboardRefresh]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-white overflow-hidden">
      {/* Desktop/Tablet Portrait: Vertical Layout */}
      <div className="max-md:landscape:hidden text-center space-y-2 sm:space-y-4 md:space-y-6 px-3 py-3 sm:px-4 sm:py-4 w-full max-w-4xl overflow-y-auto max-h-full">
        <div className="space-y-1 sm:space-y-2 md:space-y-3">
          <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-black tracking-tight leading-tight">
            ESCAPE THE DEADLINE
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">
            Outrun the year. Enter the holidays.
          </p>
        </div>

        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          
          <button
            onClick={() => {
              console.log('🚀 START button clicked');
              onStart();
            }}
            className="px-6 py-2 sm:px-8 sm:py-3 md:px-10 md:py-4 bg-black text-white text-base sm:text-lg md:text-xl lg:text-2xl hover:bg-gray-800 active:bg-gray-900 transition-colors rounded"
          >
            LET'S RUN
          </button>
          
          <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-500">
            Press SPACEBAR or tap to start
          </p>
        </div>

        {/* Leaderboard - wrapped in error boundary */}
        <div className="pt-2 sm:pt-3 md:pt-4 max-w-2xl mx-auto">
          <LeaderboardWrapper refresh={leaderboardRefresh} />
        </div>
      </div>

      {/* Mobile/Tablet Landscape: 2-Column Grid Layout */}
      <div className="hidden max-md:landscape:grid grid-cols-2 w-full h-full gap-4 px-4 py-3">
        {/* Left Column: Title + Button */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="text-center space-y-2">
            <h1 className="text-2xl text-black tracking-tight leading-tight">
              ESCAPE THE DEADLINE
            </h1>
            <p className="text-xs text-gray-600">
              Outrun the year. Enter the holidays.
            </p>
          </div>

          <div className="space-y-3 flex flex-col items-center">
            
            <button
              onClick={() => {
                console.log('🚀 START button clicked');
                onStart();
              }}
              className="px-8 py-2 bg-black text-white text-lg hover:bg-gray-800 active:bg-gray-900 transition-colors rounded"
            >
              LET'S RUN
            </button>
            
            <p className="text-[10px] text-gray-500">
              Press SPACEBAR or tap to start
            </p>
          </div>
        </div>

        {/* Right Column: Leaderboard */}
        <div className="flex items-center justify-center overflow-hidden">
          <div className="w-full max-w-md h-full flex items-center">
            <LeaderboardWrapper refresh={leaderboardRefresh} compact={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple wrapper to catch leaderboard errors
function LeaderboardWrapper({ refresh, compact }: { refresh: number, compact?: boolean }) {
  try {
    return <Leaderboard className="text-black" refresh={refresh} compact={compact} />;
  } catch (error) {
    console.error('Leaderboard error:', error);
    return (
      <div className="text-black">
        <h2 className="text-center mb-3 text-sm sm:text-base">🏆 Leaderboard</h2>
        <p className="text-center opacity-60 text-xs sm:text-sm">Loading...</p>
      </div>
    );
  }
}