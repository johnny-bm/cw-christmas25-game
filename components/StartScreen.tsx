import { useEffect, useState } from 'react';
import { Leaderboard } from './Leaderboard';
import { formatNumber } from '../lib/formatNumber';
import { getElementColor } from '../game/colorConfig';
import { textConfig } from '../lib/textConfig';

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
        setShowFullscreenPrompt(false);
        localStorage.setItem('fullscreenPromptDismissed', 'true');
      }
    } catch (error) {
      // Fullscreen request failed
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof (window as any).__toggleGameMute === 'function') {
      const newMutedState = (window as any).__toggleGameMute();
      setIsMuted(newMutedState);
    }
  };

  const gameBackgroundColor = getElementColor('background');
  
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden relative" style={{ backgroundColor: gameBackgroundColor }}>
      {/* CW Logo - Top Center - Hidden on mobile landscape to prevent overlap */}
      <div
        className="absolute z-20 left-1/2 transform -translate-x-1/2 max-md:landscape:hidden"
        style={{
          top: isMobileSafari 
            ? 'max(4.5rem, calc(env(safe-area-inset-top, 0px) + 1rem + 3.5rem))'
            : 'max(1.5rem, calc(env(safe-area-inset-top, 0px) + 1rem))',
        }}
      >
        <img 
          src="/Assets/CW-Logo.svg" 
          alt={textConfig.common.altText.crackwitsLogo} 
          className="h-6 sm:h-8 md:h-10"
        />
      </div>
      
      {/* Mute/Unmute Button - Top Right Corner - Always visible */}
      <button
        onClick={handleToggleMute}
        className="absolute z-30 pointer-events-auto bg-white rounded-lg sm:rounded-xl w-12 h-12 max-md:landscape:w-10 max-md:landscape:h-10 sm:w-16 sm:h-16 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all duration-150 shadow-md"
        style={{
          top: 'max(0.75rem, calc(env(safe-area-inset-top, 0px) + 0.75rem))',
          right: 'max(0.75rem, calc(env(safe-area-inset-right, 0px) + 0.75rem))',
        }}
        aria-label={isMuted ? textConfig.common.ariaLabels.unmute : textConfig.common.ariaLabels.mute}
      >
        {isMuted ? (
          <img 
            src="/Assets/Mute.svg" 
            alt={textConfig.common.altText.muted} 
            className="w-5 h-5 max-md:landscape:w-4 max-md:landscape:h-4 sm:w-7 sm:h-7"
          />
        ) : (
          <img 
            src="/Assets/Unmute.svg" 
            alt={textConfig.common.altText.unmuted} 
            className="w-5 h-5 max-md:landscape:w-4 max-md:landscape:h-4 sm:w-7 sm:h-7"
          />
        )}
      </button>

      {/* Fullscreen Prompt for Mobile Safari */}
      {showFullscreenPrompt && isMobileSafari && fullscreenSupported && !isFullscreen && (
        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm text-center space-y-4">
            <h3 className="text-lg font-bold">{textConfig.startScreen.fullscreen.title}</h3>
            <p className="text-sm text-gray-600">
              {textConfig.startScreen.fullscreen.description}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRequestFullscreen}
                className="flex-1 bg-black text-white px-4 py-2 rounded font-medium"
              >
                {textConfig.startScreen.fullscreen.button.goFullscreen}
              </button>
              <button
                onClick={() => {
                  setShowFullscreenPrompt(false);
                  localStorage.setItem('fullscreenPromptDismissed', 'true');
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium"
              >
                {textConfig.startScreen.fullscreen.button.skip}
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
            bottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))',
            right: 'max(1rem, calc(env(safe-area-inset-right, 0px) + 1rem))',
          }}
          aria-label={textConfig.common.ariaLabels.enterFullscreen}
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      )}

      {/* Desktop/Tablet Portrait: Vertical Layout */}
      {/* RESPONSIVE: Use viewport-relative padding-top instead of fixed rem values for better mobile support */}
      <div className="max-md:landscape:hidden text-center space-y-2 sm:space-y-4 md:space-y-6 py-3 sm:py-4 w-full max-w-4xl overflow-y-auto max-h-full" style={{ 
        paddingTop: isMobileSafari 
          ? 'max(6rem, calc(env(safe-area-inset-top, 0px) + 1rem + 5rem))'
          : 'max(4rem, calc(env(safe-area-inset-top, 0px) + 1rem + 3rem))',
        paddingLeft: 'max(2rem, calc(env(safe-area-inset-left, 0px) + 1.5rem))',
        paddingRight: 'max(2rem, calc(env(safe-area-inset-right, 0px) + 1.5rem))',
        paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))',
        boxSizing: 'border-box'
      }}>
        <div className="space-y-1 sm:space-y-2 md:space-y-3">
          <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-black tracking-tight leading-tight">
            {textConfig.startScreen.title}
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">
            {textConfig.startScreen.subtitle}
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
            {gameReady ? textConfig.startScreen.button.ready : textConfig.startScreen.button.loading}
          </button>
          
          <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-500">
            {textConfig.startScreen.hint}
          </p>
        </div>

        {/* Leaderboard - wrapped in error boundary */}
        <div className="pt-2 sm:pt-3 md:pt-4 max-w-2xl mx-auto">
          <LeaderboardWrapper refresh={leaderboardRefresh} />
        </div>

        {/* Disclaimer */}
        <div className="w-full max-w-6xl text-center mt-auto pt-2 sm:pt-3">
          <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 italic px-4">
            {textConfig.common.disclaimer}
          </p>
        </div>

        {/* Footer - Made with text */}
        <div className="w-full max-w-6xl text-center mt-auto pt-4 sm:pt-6">
          <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 pt-1 sm:pt-2">
            Made with ☕ and ⏰ by the{' '}
            <a 
              href="https://crackwits.com/?utm_source=Christmas25&utm_medium=Footer&utm_campaign=Christmas25"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-black underline transition-colors"
            >
              Crackwits
            </a>{' '}
            Squad
          </p>
        </div>
      </div>

      {/* Mobile/Tablet Landscape: 2-Column Grid Layout */}
      <div className="hidden max-md:landscape:grid grid-cols-2 grid-rows-[1fr_auto] w-full h-full gap-4 py-3" style={{
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 0px) + 0.75rem + 2.75rem))',
        paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))',
        paddingLeft: 'max(2rem, calc(env(safe-area-inset-left, 0px) + 1.5rem))',
        paddingRight: 'max(2rem, calc(env(safe-area-inset-right, 0px) + 1.5rem))',
        boxSizing: 'border-box'
      }}>
        {/* Left Column: Title + Button */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="text-center space-y-2">
            <h1 className="text-2xl text-black tracking-tight leading-tight">
              {textConfig.startScreen.title}
            </h1>
            <p className="text-xs text-gray-600">
              {textConfig.startScreen.subtitle}
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
              {gameReady ? textConfig.startScreen.button.ready : textConfig.startScreen.button.loading}
            </button>
            
            <p className="text-[10px] text-gray-500">
              {textConfig.startScreen.hint}
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

        {/* Disclaimer */}
        <div className="col-span-2 w-full text-center pt-2">
          <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 italic px-4">
            {textConfig.common.disclaimer}
          </p>
        </div>

        {/* Footer - Made with text */}
        <div className="col-span-2 w-full text-center pt-4">
          <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 pt-1 sm:pt-2">
            Made with ☕ and ⏰ by the{' '}
            <a 
              href="https://crackwits.com/?utm_source=Christmas25&utm_medium=Footer&utm_campaign=Christmas25"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-black underline transition-colors"
            >
              Crackwits
            </a>{' '}
            Squad
          </p>
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
    return (
      <div className="text-black">
        <h2 className="text-center mb-3 text-sm sm:text-base">{textConfig.leaderboard.title}</h2>
        <p className="text-center opacity-60 text-xs sm:text-sm">{textConfig.leaderboard.loading}</p>
      </div>
    );
  }
}