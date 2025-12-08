import { useEffect, useState } from 'react';
import { Leaderboard } from './Leaderboard';
import { formatNumber } from '../lib/formatNumber';
import { getElementColor } from '../game/colorConfig';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  
  // Detect if we're on mobile Safari
  const isMobileSafari = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

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

  // Check fullscreen state
  useEffect(() => {
    const checkFullscreen = () => {
      const isFullscreenNow = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFullscreenNow);
    };

    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('mozfullscreenchange', checkFullscreen);
    document.addEventListener('MSFullscreenChange', checkFullscreen);

    checkFullscreen();

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('webkitfullscreenchange', checkFullscreen);
      document.removeEventListener('mozfullscreenchange', checkFullscreen);
      document.removeEventListener('MSFullscreenChange', checkFullscreen);
    };
  }, []);

  // Detect fullscreen support
  useEffect(() => {
    const elem = document.documentElement as any;
    const supported = !!(
      elem.requestFullscreen ||
      elem.webkitRequestFullscreen ||
      elem.mozRequestFullScreen ||
      elem.msRequestFullscreen
    );
    setFullscreenSupported(supported);
  }, []);

  // Show fullscreen prompt for mobile Safari on first load
  useEffect(() => {
    if (
      isMobileSafari &&
      fullscreenSupported &&
      !isFullscreen &&
      !localStorage.getItem('fullscreenPromptDismissed')
    ) {
      setShowFullscreenPrompt(true);
    }
  }, [isMobileSafari, isFullscreen, fullscreenSupported]);

  const handleRequestFullscreen = async () => {
    try {
      const elem = document.documentElement;
      
      // Try standard fullscreen API
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      }
      // Try webkit (Safari)
      else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      }
      // Try moz (Firefox)
      else if ((elem as any).mozRequestFullScreen) {
        (elem as any).mozRequestFullScreen();
      }
      // Try ms (IE/Edge)
      else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
      else {
        console.warn('Fullscreen not supported on this device/browser.');
        setShowFullscreenPrompt(false);
        localStorage.setItem('fullscreenPromptDismissed', 'true');
      }
    } catch (error) {
      console.warn('Fullscreen request failed:', error);
    }
  };

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

  const gameBackgroundColor = getElementColor('background');
  
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden relative" style={{ backgroundColor: gameBackgroundColor }}>
      {/* CW Logo - Top Center */}
      <div
        className="absolute z-20 left-1/2 transform -translate-x-1/2"
        style={{
          top: 'max(1rem, calc(env(safe-area-inset-top, 0.5rem) + 0.5rem))',
        }}
      >
        <img 
          src="/Assets/CW-Logo.svg" 
          alt="Crackwits Logo" 
          className="h-6 sm:h-8 md:h-10"
        />
      </div>
      
      {/* Mute/Unmute Button - Top Right */}
      <button
        onClick={handleToggleMute}
        className="absolute z-20 pointer-events-auto bg-white rounded-lg sm:rounded-xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all duration-150"
        style={{
          top: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))',
          right: 'max(0.5rem, env(safe-area-inset-right, 0.5rem))',
        }}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <img 
            src="/Assets/Mute.svg" 
            alt="Muted" 
            className="w-6 h-6 sm:w-7 sm:h-7"
          />
        ) : (
          <img 
            src="/Assets/Unmute.svg" 
            alt="Unmuted" 
            className="w-6 h-6 sm:w-7 sm:h-7"
          />
        )}
      </button>

      {/* Fullscreen Prompt for Mobile Safari */}
      {showFullscreenPrompt && isMobileSafari && fullscreenSupported && !isFullscreen && (
        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm text-center space-y-4">
            <h3 className="text-lg font-bold">Fullscreen Recommended</h3>
            <p className="text-sm text-gray-600">
              For the best experience on Safari, tap the fullscreen button below to hide browser tabs and get more screen space.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRequestFullscreen}
                className="flex-1 bg-black text-white px-4 py-2 rounded font-medium"
              >
                Go Fullscreen
              </button>
              <button
                onClick={() => {
                  setShowFullscreenPrompt(false);
                  localStorage.setItem('fullscreenPromptDismissed', 'true');
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Button for Mobile Safari */}
      {isMobileSafari && fullscreenSupported && !isFullscreen && (
        <button
          onClick={handleRequestFullscreen}
          className="absolute z-20 pointer-events-auto bg-white rounded-lg sm:rounded-xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all duration-150"
          style={{
            bottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))',
            right: 'max(0.5rem, env(safe-area-inset-right, 0.5rem))',
          }}
          aria-label="Enter Fullscreen"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      )}

      {/* Desktop/Tablet Portrait: Vertical Layout */}
      {/* RESPONSIVE: Use viewport-relative padding-top instead of fixed rem values for better mobile support */}
      <div className="max-md:landscape:hidden text-center space-y-2 sm:space-y-4 md:space-y-6 px-3 py-3 sm:px-4 sm:py-4 w-full max-w-4xl overflow-y-auto max-h-full" style={{ paddingTop: 'max(4rem, calc(env(safe-area-inset-top, 0.5rem) + 0.5rem + 3rem))' }}>
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
        {/* RESPONSIVE: Ensure leaderboard container adapts to available space */}
        <div className="flex items-center justify-center overflow-hidden min-h-0">
          <div className="w-full max-w-md h-full flex items-center min-h-0">
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