import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { StartScreen } from './components/StartScreen';
import { Game } from './components/Game';
import { GameUI } from './components/GameUI';
import { GameOver } from './components/GameOver';
import { SEOHead } from './components/SEOHead';
import { getElementColor } from './game/colorConfig';
import { textConfig } from './lib/textConfig';
import { trackPageView } from './lib/analytics';
import { TermsPopup } from './components/TermsPopup';
import { LegalNoticePopup } from './components/LegalNoticePopup';

export type GameState = 'start' | 'playing' | 'gameover';

export interface GameData {
  distance: number;
  energy: number;
  deadlineProximity: number;
  message: string;
  messageTimer: number;
  combo: number;
  maxCombo?: number;
  sprintMode?: boolean;
  sprintTimer?: number;
  grinchScore?: number;
  elfScore?: number;
}

// Detect if device is mobile
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768 && 'ontouchstart' in window);
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Helper function to detect mobile devices (all mobile devices now use portrait mode)
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window.innerWidth <= 768 && 'ontouchstart' in window);
  };
  const [gameState, setGameState] = useState<GameState>('start');
  const [gameReady, setGameReady] = useState(false); // Track if game is loaded
  const [loadingProgress, setLoadingProgress] = useState(0); // Track loading progress
  const [gameData, setGameData] = useState<GameData>({
    distance: 0,
    energy: 100,
    deadlineProximity: 0,
    message: '',
    messageTimer: 0,
    combo: 0
  });
  const [bestDistance, setBestDistance] = useState(0);
  const [finalDistance, setFinalDistance] = useState(0);
  const [finalMaxCombo, setFinalMaxCombo] = useState(0);
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [showLegalNoticePopup, setShowLegalNoticePopup] = useState(false);

  // On initial mount, redirect to landing if not already there
  // BUT: Allow debug mode to bypass redirect
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      // Check for debug mode in URL params
      const urlParams = new URLSearchParams(location.search);
      const isDebugMode = urlParams.get('debug') === 'popup';
      
      // If debug mode on /ending, initialize values and set game state
      if (isDebugMode && location.pathname === '/ending') {
        const debugScore = parseInt(urlParams.get('score') || '0') || 1200;
        setFinalDistance(debugScore);
        setFinalMaxCombo(urlParams.get('top3') === 'true' ? 10 : 3);
        (window as any).__finalGrinchScore = Math.floor(debugScore / 2);
        (window as any).__finalElfScore = Math.floor(debugScore / 2);
        setGameState('gameover');
        return; // Don't redirect
      }
      
      // Don't redirect if in debug mode or if already on landing
      // Note: location.pathname is relative to basename when basename is set
      const currentPath = location.pathname;
      const currentFullPath = window.location.pathname;
      const newPath = '/game/Christmas25/landing';
      
      if ((currentPath === '/' || (currentPath !== '/landing' && currentPath !== '/game' && currentPath !== '/ending')) && !isDebugMode) {
        // Always manually update URL first
        if (currentFullPath !== newPath) {
          try {
            window.history.replaceState({}, '', newPath);
            // Force React Router to recognize the change
            window.dispatchEvent(new PopStateEvent('popstate'));
          } catch (e) {
            // Failed to update URL
          }
        }
        
        navigate('/landing', { replace: true });
      }
    }
  }, [hasInitialized, location.pathname, location.search, navigate]);

  // Setup debug mode commands
  useEffect(() => {
    // Add debug commands to window object for console testing
    (window as any).debugGame = {
      showRegularPopup: () => {
        // Navigate to ending with mock data
        setFinalDistance(1200);
        setFinalMaxCombo(3);
        (window as any).__finalGrinchScore = 600;
        (window as any).__finalElfScore = 600;
        setGameState('gameover');
        navigate('/ending?debug=popup&score=1200', { replace: false });
      },
      showTop3Popup: (position: number = 1) => {
        const scores = [5000, 4500, 4000];
        const score = scores[position - 1] || 4000;
        setFinalDistance(score);
        setFinalMaxCombo(10);
        (window as any).__finalGrinchScore = Math.floor(score / 2);
        (window as any).__finalElfScore = Math.floor(score / 2);
        setGameState('gameover');
        navigate(`/ending?debug=popup&top3=true&position=${position}&score=${score}`, { replace: false });
      }
    };
  }, [navigate]);

  // Sync route with game state on initial load or direct navigation
  // Only sync if gameState doesn't already match the route
  // BUT: Allow debug mode to bypass state sync
  useEffect(() => {
    const path = location.pathname;
    const urlParams = new URLSearchParams(location.search);
    const isDebugMode = urlParams.get('debug') === 'popup';
    
    // In debug mode, set gameover state immediately
    if (isDebugMode && path === '/ending') {
      setGameState('gameover');
      return;
    }
    
    // Sync game state with route
    // Note: location.pathname is relative to basename when basename is set
    if (path === '/landing' && gameState !== 'start') {
      setGameState('start');
    } else if (path === '/game' && gameState !== 'playing') {
      setGameState('playing');
    } else if (path === '/ending' && gameState !== 'gameover') {
      setGameState('gameover');
    } else if (path === '/' && gameState !== 'start') {
      // Handle root path - should redirect to landing
      setGameState('start');
    }
  }, [location.pathname, location.search, gameState]);

  useEffect(() => {
    // Load best distance from local storage
    const savedBestDistance = localStorage.getItem('escapeTheDeadline_bestDistance');
    if (savedBestDistance) {
      setBestDistance(parseInt(savedBestDistance, 10));
    }
    
    // Detect mobile device
    const mobile = isMobileDevice();
    setIsMobile(mobile);
    
    // Add class to body for CSS-based responsive design
    if (mobile) {
      document.body.classList.add('is-mobile-device');
    } else {
      document.body.classList.remove('is-mobile-device');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('is-mobile-device');
    };
  }, []);
  
  useEffect(() => {
    // Show start screen only when game is fully ready (all assets loaded)
    if (gameReady) {
      setShowStartScreen(true);
    }
  }, [gameReady]);

  // Handle orientation changes
  useEffect(() => {
    let previousOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    
    const checkOrientation = () => {
      // Check if portrait mode
      const isPortraitNow = window.innerHeight > window.innerWidth;
      const currentOrientation = isPortraitNow ? 'portrait' : 'landscape';
      
      // If orientation actually changed (not just a resize), refresh the page
      // This ensures the game initializes correctly with new dimensions
      if (previousOrientation !== currentOrientation && gameState === 'playing') {
        // Only refresh if game is currently playing (not on start screen)
        // Small delay to let browser finish orientation change
        setTimeout(() => {
          window.location.reload();
        }, 300);
        return;
      }
      
      previousOrientation = currentOrientation;
      setIsPortrait(isPortraitNow);
    };

    // Initial check
    checkOrientation();

    // Listen to orientation change events
    const handleOrientationChange = () => {
      // Longer delay to let browser update dimensions
      setTimeout(checkOrientation, 200);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Also listen to screen.orientation API if available
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, [gameState]);

  const handleStartGame = () => {
    // Block game start if game is not ready
    if (!gameReady) {
      return;
    }
    
    // GTM Tracking: Game Started
    if (typeof window !== 'undefined') {
      if (!(window as any).dataLayer) {
        (window as any).dataLayer = [];
      }
      (window as any).dataLayer.push({
        'event': 'game_started'
      });
    }
    
    // All mobile devices now support portrait mode, so no blocking needed
    
    setGameState('playing');
    setGameData({
      distance: 0,
      energy: 100,
      deadlineProximity: 0,
      message: '',
      messageTimer: 0,
      combo: 0
    });
    
    const currentPath = window.location.pathname;
    const newPath = '/game/Christmas25/game';
    
    // Always manually update URL first
    if (currentPath !== newPath) {
      try {
        window.history.pushState({}, '', newPath);
        // Force React Router to recognize the change
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (e) {
        // Failed to update URL
      }
    }
    
    // Navigate using React Router (should sync with the URL we just set)
    navigate('/game', { replace: false });
  };

  const handleGameOver = useCallback((finalDist: number, maxCombo: number, grinchScore?: number, elfScore?: number) => {
    setFinalDistance(finalDist);
    setFinalMaxCombo(maxCombo);
    setGameState('gameover');
    
    // Update best distance if needed
    if (finalDist > bestDistance) {
      setBestDistance(finalDist);
      localStorage.setItem('escapeTheDeadline_bestDistance', finalDist.toString());
    }
    
    // Store character scores for GameOver component
    if (grinchScore !== undefined) {
      (window as any).__finalGrinchScore = grinchScore;
    }
    if (elfScore !== undefined) {
      (window as any).__finalElfScore = elfScore;
    }
    
    // Set flag to indicate a game was just completed (so popup should show)
    sessionStorage.setItem('escapeTheDeadline_showEndingPopup', 'true');
    
    const currentPath = window.location.pathname;
    const newPath = '/game/Christmas25/ending';
    
    // Always manually update URL first
    if (currentPath !== newPath) {
      try {
        window.history.pushState({}, '', newPath);
        // Force React Router to recognize the change
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (e) {
        // Failed to update URL
      }
    }
    
    // Navigate using React Router (should sync with the URL we just set)
    navigate('/ending', { replace: false });
  }, [bestDistance, navigate]);

  const handleUpdateGameData = useCallback((data: GameData) => {
    setGameData(data);
  }, []);

  const handleRestart = () => {
    // Reset game data to initial state
    setGameData({
      distance: 0,
      energy: 100,
      deadlineProximity: 0,
      message: '',
      messageTimer: 0,
      combo: 0
    });
    setFinalDistance(0);
    setFinalMaxCombo(0);
    
    // Don't reset gameReady - game is already loaded, just restarting
    // Transition directly to playing state (not via start screen)
    // First set to start briefly to reset the game scene, then immediately to playing
    setGameState('start');
    
    // After a brief delay, transition to playing state to ensure game scene resets properly
    setTimeout(() => {
      setGameState('playing');
      
      // Always manually update URL first
      const newPath = '/game/Christmas25/game';
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
        // Force React Router to recognize the change
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      
      navigate('/game', { replace: false });
    }, 150);
    
    setLeaderboardRefresh(prev => prev + 1);
  };


  const gameBackgroundColor = getElementColor('background');
  
  // CRITICAL FIX for Safari Mobile: Use CSS-based height instead of JavaScript calculation
  // CSS dvh (dynamic viewport height) is more reliable on Safari than JS calculations
  // This ensures the container always fills the visible viewport
  const viewportHeight = '100dvh'; // Use CSS dvh directly - Safari handles this better

  // Map gameState to scene name for analytics
  const sceneName = gameState === 'start' ? 'main-menu' : gameState === 'playing' ? 'gameplay' : 'ending';
  
  // Track page view when scene changes
  useEffect(() => {
    trackPageView(sceneName);
  }, [sceneName]);
  
  return (
    <>
      <SEOHead />
      <div 
        id="game-container"
        data-game-state={gameState}
        data-scene={sceneName}
        className="w-full overflow-hidden relative" 
      style={{ 
        margin: 0, 
        padding: 0, 
        width: '100vw', 
        height: '100dvh', // CRITICAL: Use CSS dvh directly - Safari handles this better than JS
        minHeight: '100vh', // Fallback for browsers without dvh support
        backgroundColor: gameBackgroundColor,
        boxSizing: 'border-box',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // CRITICAL for Safari Mobile: Ensure container fills viewport exactly
        display: 'block' // Use block instead of flex to avoid layout issues
        // Note: Safe areas are handled by individual UI components (GameUI, etc.)
        // The game canvas should fill the entire container to ensure proper scaling
      }}
    >
      {/* Legal Popups */}
      <TermsPopup
        open={showTermsPopup}
        onOpenChange={setShowTermsPopup}
      />
      <LegalNoticePopup
        open={showLegalNoticePopup}
        onOpenChange={setShowLegalNoticePopup}
      />
      
      {/* Game canvas - always rendered so it can initialize, but hidden when not playing */}
      {/* Keep it visible during loading so it can initialize properly */}
      <div 
        className={`absolute z-0 ${gameState !== 'playing' && gameReady ? 'opacity-0 pointer-events-none' : ''}`}
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0,
          overflow: 'hidden'
        }}
      >
        <Game
          onGameOver={handleGameOver}
          onUpdateGameData={handleUpdateGameData}
          onGameReady={() => setGameReady(true)}
          onLoadingProgress={(progress) => setLoadingProgress(progress)}
          isActive={gameState === 'playing'}
        />
      </div>
      
      {/* Loading screen - show until all assets are loaded */}
      {!gameReady && (
        <div 
          className="absolute inset-0 z-[100] flex flex-col items-center"
          style={{ backgroundColor: gameBackgroundColor }}
        >
          {/* CW Logo - Top Center */}
          <div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20"
            style={{
              top: 'max(1rem, calc(env(safe-area-inset-top, 0.5rem) + 0.5rem))',
            }}
          >
          <img 
            src="/Assets/CW-Logo.svg" 
            alt={textConfig.common.altText.crackwitsLogo} 
            className="h-6 sm:h-8 md:h-10 mb-4 sm:mb-6 md:mb-8"
          />
          </div>
          
          {/* RESPONSIVE: Use viewport-relative margin-top instead of fixed rem values */}
          <div 
            className="text-center px-4 max-w-md w-full flex flex-col items-center justify-center flex-1"
            style={{ 
              color: getElementColor('uiText'),
              marginTop: 'max(5rem, calc(env(safe-area-inset-top, 0.5rem) + 0.5rem + 4rem))'
            }}
          >
            <div className="mb-6 sm:mb-8 flex justify-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 rounded-full animate-spin mx-auto" 
                style={{ 
                  borderColor: `${getElementColor('uiText')}20`,
                  borderTopColor: getElementColor('uiText')
                }}
              ></div>
            </div>
            <p 
              className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6 font-medium" 
              style={{ fontFamily: '"Urbanist", sans-serif' }}
            >
              {textConfig.app.loading.title}
            </p>
            {/* Progress bar */}
            <div 
              className="w-full max-w-xs h-2 rounded-full overflow-hidden mx-auto mb-2 sm:mb-3"
              style={{ backgroundColor: `${getElementColor('uiText')}20` }}
            >
              <div 
                className="h-full transition-all duration-300 ease-out"
                style={{ 
                  width: `${Math.round(loadingProgress * 100)}%`,
                  backgroundColor: getElementColor('uiText')
                }}
              />
            </div>
            <p 
              className="text-sm sm:text-base opacity-60" 
              style={{ fontFamily: '"Urbanist", sans-serif' }}
            >
              {Math.round(loadingProgress * 100)}%
            </p>
          </div>
        </div>
      )}
      
      <Routes>
        {/* Root redirect to landing - but allow debug mode */}
        <Route path="/" element={<Navigate to="/landing" replace />} />
        
        {/* Landing route */}
        <Route path="/landing" element={
          showStartScreen ? (
            <div className="absolute inset-0 z-50" style={{ backgroundColor: gameBackgroundColor }}>
              <StartScreen 
                onStart={handleStartGame} 
                bestDistance={bestDistance} 
                leaderboardRefresh={leaderboardRefresh}
                gameReady={gameReady}
              />
            </div>
          ) : null
        } />
        
        {/* Game route */}
        <Route path="/game" element={
          <div className="absolute inset-0 z-10 pointer-events-none">
            <GameUI 
              gameData={gameData} 
              bestDistance={bestDistance}
            />
          </div>
        } />
        
        {/* Ending route */}
        <Route path="/ending" element={
          <div className="absolute inset-0 z-50" style={{ backgroundColor: gameBackgroundColor }}>
            <GameOver
              distance={finalDistance}
              bestDistance={bestDistance}
              maxCombo={finalMaxCombo}
              grinchScore={(window as any).__finalGrinchScore}
              elfScore={(window as any).__finalElfScore}
              onRestart={handleRestart}
            />
          </div>
        } />
        
        {/* Catch-all route - redirect any unknown routes to landing */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </div>
    </>
  );
}
