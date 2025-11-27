import { useState, useEffect, useCallback, useMemo } from 'react';
import { StartScreen } from './components/StartScreen';
import { Game } from './components/Game';
import { GameUI } from './components/GameUI';
import { GameOver } from './components/GameOver';
import { RotateCw } from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(false);

  useEffect(() => {
    // Load best distance from local storage
    const savedBestDistance = localStorage.getItem('escapeTheDeadline_bestDistance');
    if (savedBestDistance) {
      setBestDistance(parseInt(savedBestDistance, 10));
    }
    
    // Detect mobile device
    setIsMobile(isMobileDevice());
  }, []);
  
  useEffect(() => {
    // Show start screen only when game is fully ready (all assets loaded)
    if (gameReady) {
      setShowStartScreen(true);
    }
  }, [gameReady]);

  // Handle fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFullscreenNow);
      
      if (!isFullscreenNow && gameState === 'playing') {
        // User exited fullscreen during gameplay - could pause game here if needed
        console.log('📱 Fullscreen exited during gameplay');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [gameState]);

  // Handle orientation changes
  useEffect(() => {
    const checkOrientation = () => {
      // Check if portrait mode
      const isPortraitNow = window.innerHeight > window.innerWidth;
      setIsPortrait(isPortraitNow);
    };

    // Initial check
    checkOrientation();

    // Listen to orientation change events
    const handleOrientationChange = () => {
      // Small delay to let browser update dimensions
      setTimeout(checkOrientation, 100);
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
  }, []);

  const handleStartGame = () => {
    // Block game start if game is not ready
    if (!gameReady) {
      console.log('🚫 Game start blocked: Assets not fully loaded');
      return;
    }
    
    // Block game start if on mobile and in portrait mode
    if (isMobile && isPortrait) {
      console.log('🚫 Game start blocked: Mobile device in portrait mode');
      return;
    }
    
    // Request fullscreen on mobile devices (moved to user gesture handler)
    // This is now called from the button click, which is a user gesture
    const requestFullscreen = () => {
      if (window.innerWidth < 1024) {
        const elem = document.documentElement;
        
        // Try standard fullscreen API
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(err => {
            console.log('Fullscreen request failed:', err);
          });
          return;
        }
        
        // Try webkit fullscreen for iOS Safari
        const webkitElem = elem as any;
        if (webkitElem.webkitRequestFullscreen) {
          webkitElem.webkitRequestFullscreen();
          return;
        }
        
        // Try moz fullscreen for Firefox
        const mozElem = elem as any;
        if (mozElem.mozRequestFullScreen) {
          mozElem.mozRequestFullScreen();
          return;
        }
        
        // Try ms fullscreen for IE/Edge
        const msElem = elem as any;
        if (msElem.msRequestFullscreen) {
          msElem.msRequestFullscreen();
        }
      }
    };
    
    // Request fullscreen as part of user gesture
    requestFullscreen();
    
    setGameState('playing');
    setGameData({
      distance: 0,
      energy: 100,
      deadlineProximity: 0,
      message: '',
      messageTimer: 0,
      combo: 0
    });
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
  }, [bestDistance]);

  const handleUpdateGameData = useCallback((data: GameData) => {
    setGameData(data);
  }, []);

  const handleRestart = () => {
    console.log('🔄 RESTART CLICKED - Current state:', gameState);
    
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
    console.log('🔄 State changed to: start');
    
    // After a brief delay, transition to playing state to ensure game scene resets properly
    setTimeout(() => {
      setGameState('playing');
      console.log('🔄 State changed to: playing after restart');
    }, 150);
    
    setLeaderboardRefresh(prev => {
      const newValue = prev + 1;
      console.log('📊 Leaderboard refresh triggered:', newValue);
      return newValue;
    });
  };

  // Check if we should show portrait blocker
  const showPortraitBlocker = isMobile && isPortrait;
  
  console.log('🎮 App render - State:', gameState, 'Distance:', finalDistance, 'Best:', bestDistance);
  console.log('📱 Mobile:', isMobile, 'Portrait:', isPortrait, 'Show blocker:', showPortraitBlocker);

  return (
    <div className="w-full h-[100dvh] bg-white overflow-hidden relative" style={{ margin: 0, padding: 0, width: '100vw', height: '100vh' }}>
      {/* Portrait orientation blocker - blocks everything on mobile portrait */}
      {showPortraitBlocker && (
        <div className="absolute inset-0 z-[9999] bg-black flex flex-col items-center justify-center px-4">
          <div className="text-white text-center max-w-md">
            <div className="mb-8 animate-spin-slow">
              <RotateCw className="w-24 h-24 mx-auto text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: '"Urbanist", sans-serif' }}>
              Please Rotate Your Device
            </h2>
            <p className="text-lg sm:text-xl opacity-80 mb-6" style={{ fontFamily: '"Urbanist", sans-serif' }}>
              This game is designed for landscape mode. Please rotate your phone to continue.
            </p>
            <div className="text-sm opacity-60" style={{ fontFamily: '"Urbanist", sans-serif' }}>
              The game will load automatically once you rotate to landscape.
            </div>
          </div>
        </div>
      )}
      
      {/* Game canvas - always rendered so it can initialize, but hidden when not playing */}
      <div className={`absolute inset-0 z-0 ${gameState !== 'playing' ? 'opacity-0 pointer-events-none' : ''}`}>
        <Game
          onGameOver={handleGameOver}
          onUpdateGameData={handleUpdateGameData}
          onGameReady={() => setGameReady(true)}
          onLoadingProgress={(progress) => setLoadingProgress(progress)}
          isActive={gameState === 'playing' && !showPortraitBlocker}
        />
      </div>
      
      {/* Loading screen - show until all assets are loaded */}
      {!gameReady && !showPortraitBlocker && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          <div className="text-white text-center px-4 max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
            </div>
            <p className="text-base sm:text-lg mb-4" style={{ fontFamily: '"Urbanist", sans-serif' }}>
              Loading game...
            </p>
            {/* Progress bar */}
            <div className="w-full max-w-xs h-2 bg-white/20 rounded-full overflow-hidden mx-auto mb-2">
              <div 
                className="h-full bg-white transition-all duration-300 ease-out"
                style={{ width: `${Math.round(loadingProgress * 100)}%` }}
              />
            </div>
            <p className="text-sm sm:text-base opacity-60" style={{ fontFamily: '"Urbanist", sans-serif' }}>
              {Math.round(loadingProgress * 100)}%
            </p>
          </div>
        </div>
      )}
      
      {/* Start screen - show when in start state, not blocked, and game is ready */}
      {gameState === 'start' && !showPortraitBlocker && showStartScreen && (
        <div className="absolute inset-0 z-50 bg-white">
          <StartScreen 
            onStart={handleStartGame} 
            bestDistance={bestDistance} 
            leaderboardRefresh={leaderboardRefresh}
            gameReady={gameReady}
          />
        </div>
      )}
      
      {gameState === 'playing' && !showPortraitBlocker && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <GameUI 
            gameData={gameData} 
            bestDistance={bestDistance}
          />
        </div>
      )}
      
      {gameState === 'gameover' && !showPortraitBlocker && (
        <div className="absolute inset-0 z-50 bg-white">
          <GameOver
            distance={finalDistance}
            bestDistance={bestDistance}
            maxCombo={finalMaxCombo}
            grinchScore={(window as any).__finalGrinchScore}
            elfScore={(window as any).__finalElfScore}
            onRestart={handleRestart}
          />
        </div>
      )}
    </div>
  );
}