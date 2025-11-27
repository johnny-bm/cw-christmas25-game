import { Zap, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Leaderboard } from './Leaderboard';
import { formatNumber } from '../lib/formatNumber';

interface StartScreenProps {
  onStart: () => void;
  bestDistance: number;
  leaderboardRefresh?: number;
  gameReady?: boolean;
}

export function StartScreen({ onStart, bestDistance, leaderboardRefresh = 0, gameReady = true }: StartScreenProps) {
  const [isMuted, setIsMuted] = useState(() => {
    // Check localStorage for saved mute state
    return localStorage.getItem('escapeTheDeadline_muted') === 'true';
  });

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onStart, leaderboardRefresh]);

  useEffect(() => {
    // Sync with Phaser game mute state
    const checkMuteState = () => {
      if (typeof (window as any).__getGameMuteState === 'function') {
        const muted = (window as any).__getGameMuteState();
        setIsMuted(muted);
      }
    };
    
    checkMuteState();
    const interval = setInterval(checkMuteState, 500);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof (window as any).__toggleGameMute === 'function') {
      const newMutedState = (window as any).__toggleGameMute();
      setIsMuted(newMutedState);
    } else {
      console.warn('⚠️ __toggleGameMute function not available');
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-white overflow-hidden relative">
      {/* Mute/Unmute Button - Top Right */}
      <button
        onClick={handleToggleMute}
        className="absolute z-20 pointer-events-auto bg-black/80 border-2 border-white hover:bg-black/90 active:scale-95 transition-all duration-150 touch-target rounded"
        style={{
          top: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))',
          right: 'max(0.5rem, env(safe-area-inset-right, 0.5rem))',
          padding: 'clamp(0.75rem, 2vw, 1rem)',
          minWidth: '44px',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        ) : (
          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        )}
      </button>

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
              if (!gameReady) return;
              onStart();
            }}
            disabled={!gameReady}
            className={`px-6 py-2 sm:px-8 sm:py-3 md:px-10 md:py-4 text-base sm:text-lg md:text-xl lg:text-2xl transition-colors rounded ${
              gameReady 
                ? 'bg-black text-white hover:bg-gray-800 active:bg-gray-900' 
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            {gameReady ? 'LET\'S RUN' : 'LOADING...'}
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
                if (!gameReady) return;
                onStart();
              }}
              disabled={!gameReady}
              className={`px-8 py-2 text-lg transition-colors rounded ${
                gameReady 
                  ? 'bg-black text-white hover:bg-gray-800 active:bg-gray-900' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              {gameReady ? 'LET\'S RUN' : 'LOADING...'}
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