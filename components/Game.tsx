import { useEffect, useRef, memo } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/GameScene';
import { GameData } from '../App';
import { debounce } from '../lib/debounce';
import { getElementColor } from '../game/colorConfig';

// Global singleton to prevent multiple game instances
let globalGameInstance: Phaser.Game | null = null;
// Module-level flag to prevent double initialization (React Strict Mode protection)
let isInitializing = false;

interface GameProps {
  onGameOver: (score: number, maxCombo: number, grinchScore?: number, elfScore?: number) => void;
  onUpdateGameData: (data: GameData) => void;
  onGameReady?: () => void;
  onLoadingProgress?: (progress: number) => void;
  isActive: boolean;
}

function GameComponent({ onGameOver, onUpdateGameData, onGameReady, onLoadingProgress, isActive }: GameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef({ onGameOver, onUpdateGameData, onGameReady, onLoadingProgress });
  const isInitializingRef = useRef(false);
  const hasStartedGameRef = useRef(false); // Track if startGame() has been called
  
  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onGameOver, onUpdateGameData, onGameReady, onLoadingProgress };
  }, [onGameOver, onUpdateGameData, onGameReady, onLoadingProgress]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // CRITICAL: Multiple layers of protection against double initialization (React Strict Mode)
    // Layer 1: Check module-level flag
    if (isInitializing) {
      return;
    }
    
    // Layer 2: Check if game already exists globally
    if (globalGameInstance && globalGameInstance.scene && !globalGameInstance.scene.isDestroyed) {
      // Game already exists and is valid, just update our ref
      if (!gameRef.current) {
        gameRef.current = globalGameInstance;
      }
      return;
    }
    
    // Layer 3: Check if container already has a Phaser canvas
    if (containerRef.current.querySelector('canvas')) {
      return;
    }
    
    // Layer 4: Check component-level refs
    if (gameRef.current || isInitializingRef.current) {
      return;
    }
    
    // All checks passed - set flags to prevent double initialization
    isInitializing = true; // Module-level flag
    isInitializingRef.current = true; // Component-level flag
    
    // Store the container reference to prevent recreation
    const container = containerRef.current;

    // Get device pixel ratio for high DPI displays
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Mobile device detection (all mobile devices now use portrait mode)
    const isMobileDevice = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768 && 'ontouchstart' in window);
    };

    // Conditional sizing: portrait mode for all mobile, dynamic for desktop
    let initialWidth: number;
    let initialHeight: number;
    const isMobile = isMobileDevice();
    const useFitMode = isMobile; // All mobile devices use FIT mode with portrait dimensions

    if (useFitMode) {
      // Portrait dimensions for all mobile devices
      // Use actual viewport dimensions but ensure portrait orientation
      const viewportWidth = window.innerWidth || window.screen.width || 400;
      const viewportHeight = window.innerHeight || window.screen.height || 700;
      
      // Ensure portrait orientation (height > width)
      if (viewportHeight > viewportWidth) {
        initialWidth = Math.min(viewportWidth, 400);
        initialHeight = Math.min(viewportHeight, 700);
      } else {
        // If landscape, swap to force portrait
        initialWidth = Math.min(viewportHeight, 400);
        initialHeight = Math.min(viewportWidth, 700);
      }
      initializeGame();
      return;
    }

    // Non-Safari: keep existing dynamic dimension discovery
    // CRITICAL FIX for Safari Mobile: Function to get accurate viewport dimensions
    // Safari mobile has timing issues where dimensions aren't ready immediately
    const getViewportDimensions = (): { width: number; height: number } => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        return {
          width: container.clientWidth,
          height: container.clientHeight
        };
      }
      
      if (window.visualViewport && window.visualViewport.width > 0 && window.visualViewport.height > 0) {
        return {
          width: window.visualViewport.width,
          height: window.visualViewport.height
        };
      }
      
      if (window.innerWidth > 0 && window.innerHeight > 0) {
        return {
          width: window.innerWidth,
          height: window.innerHeight
        };
      }
      
      return {
        width: 1920,
        height: 1080
      };
    };
    
    const waitForValidDimensions = (attempts = 0): void => {
      const maxAttempts = 20; // Increased attempts for Safari
      const dimensions = getViewportDimensions();
      
      if (dimensions.width > 200 && dimensions.height > 200) {
        initialWidth = dimensions.width;
        initialHeight = dimensions.height;
        initializeGame();
      } else if (attempts < maxAttempts) {
        setTimeout(() => waitForValidDimensions(attempts + 1), 100);
      } else {
        initialWidth = window.innerWidth || window.screen.width || 1920;
        initialHeight = window.innerHeight || window.screen.height || 1080;
        initializeGame();
      }
    };
    
    waitForValidDimensions();
    return;
    
    function initializeGame() {
      // Portrait orientation for all mobile devices
      const MOBILE_WIDTH = isMobile ? Math.min(window.innerWidth, 400) : initialWidth; // Portrait width for mobile
      const MOBILE_HEIGHT = isMobile ? Math.min(window.innerHeight, 700) : initialHeight; // Portrait height for mobile
      
      const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: useFitMode ? MOBILE_WIDTH : initialWidth,
      height: useFitMode ? MOBILE_HEIGHT : initialHeight,
      parent: container,
      backgroundColor: getElementColor('background'), // White background
      audio: {
        disableWebAudio: false,
        noAudio: false,
        context: undefined
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 300 },
          debug: false
        }
      },
      fps: {
        target: 60,
        forceSetTimeOut: false
      },
      scene: [GameScene],
      scale: {
        mode: useFitMode ? Phaser.Scale.FIT : Phaser.Scale.RESIZE,
        autoCenter: useFitMode ? Phaser.Scale.CENTER_BOTH : undefined
      },
      render: {
        pixelArt: false,
        antialias: true,
        antialiasGL: true,
        roundPixels: false,
        // Cap resolution at 3 for performance, but ensure retina displays are supported
        // Safari mobile can have high DPR values that cause performance issues
        resolution: Math.min(devicePixelRatio || 1, 3),
        // Ensure crisp rendering on high DPI displays
        powerPreference: 'high-performance'
      }
    };

    // CRITICAL: Final check before creating game (React Strict Mode double-invoke protection)
    if (globalGameInstance && globalGameInstance.scene && !globalGameInstance.scene.isDestroyed) {
      gameRef.current = globalGameInstance;
      isInitializingRef.current = false;
      isInitializing = false; // Reset module-level flag
      return;
    }
    
    // Final check: if canvas exists, don't create
    if (container.querySelector('canvas')) {
      isInitializingRef.current = false;
      isInitializing = false;
      return;
    }
    
    gameRef.current = new Phaser.Game(config);
    globalGameInstance = gameRef.current;
    const game = gameRef.current;
    isInitializing = false; // Reset module-level flag after creation
    
    // Set up event listeners using refs so they always use latest callbacks
    game.events.on('gameOver', (score: number, maxCombo: number, grinchScore?: number, elfScore?: number) => {
      callbacksRef.current.onGameOver(score, maxCombo, grinchScore, elfScore);
    });

    game.events.on('updateGameData', (data: GameData) => {
      callbacksRef.current.onUpdateGameData(data);
    });
    
    // Set up mute toggle function
    game.events.on('getMuteState', (callback: (isMuted: boolean) => void) => {
      const scene = game.scene.getScene('GameScene') as GameScene;
      if (scene && typeof (scene as any).isSoundMuted === 'function') {
        callback((scene as any).isSoundMuted());
      }
    });
    
    game.events.on('toggleMute', () => {
      const scene = game.scene.getScene('GameScene') as GameScene;
      if (scene && typeof (scene as any).toggleMute === 'function') {
        const isMuted = (scene as any).toggleMute();
        game.events.emit('muteStateChanged', isMuted);
      }
    });

    // Track loading progress
    let loadingProgress = 0;
    let assetsLoaded = false;

    // Listen for loading progress
    game.events.on('loadingProgress', (progress: number) => {
      loadingProgress = progress;
      if (callbacksRef.current.onLoadingProgress) {
        callbacksRef.current.onLoadingProgress(progress);
      }
    });

    // Listen for assets loaded event
    game.events.once('assetsLoaded', () => {
      assetsLoaded = true;
      
      // Wait a bit for scene to be fully initialized, then emit ready
      setTimeout(() => {
        const scene = game.scene.getScene('GameScene');
        if (scene && scene.scene.isActive()) {
          game.events.emit('ready');
          if (callbacksRef.current.onGameReady) {
            callbacksRef.current.onGameReady();
          }
        } else {
          // Scene not active yet, start it
          if (scene) {
            game.scene.start('GameScene');
          }
          // Wait for scene to start
          const checkScene = setInterval(() => {
            const activeScene = game.scene.getScene('GameScene');
            if (activeScene && activeScene.scene.isActive()) {
              clearInterval(checkScene);
              game.events.emit('ready');
              if (callbacksRef.current.onGameReady) {
                callbacksRef.current.onGameReady();
              }
            }
          }, 100);
          
          // Fallback timeout
          setTimeout(() => {
            clearInterval(checkScene);
            game.events.emit('ready');
            if (callbacksRef.current.onGameReady) {
              callbacksRef.current.onGameReady();
            }
          }, 2000);
        }
      }, 100);
    });

    // Fallback: if assets don't load within 10 seconds, assume ready
    setTimeout(() => {
      if (!assetsLoaded) {
        assetsLoaded = true;
        game.events.emit('ready');
        if (callbacksRef.current.onGameReady) {
          callbacksRef.current.onGameReady();
        }
      }
    }, 10000);

    // Handle window resize with debouncing and visual viewport support
    // With RESIZE mode, Phaser automatically resizes the game world to match container
    // CRITICAL FIX for Safari Mobile: Use container dimensions first (most reliable)
    const handleResize = () => {
      if (gameRef.current && container) {
        // CRITICAL: Priority 1 - Use container's actual rendered dimensions
        // Container dimensions are most reliable because they reflect the actual CSS layout
        let containerWidth: number;
        let containerHeight: number;
        
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          // Container has valid dimensions - use them (most reliable)
          containerWidth = container.clientWidth;
          containerHeight = container.clientHeight;
        } else if (window.visualViewport && window.visualViewport.width > 0 && window.visualViewport.height > 0) {
          // Fallback to visual viewport (accounts for Safari browser UI)
          containerWidth = window.visualViewport.width;
          containerHeight = window.visualViewport.height;
        } else if (window.innerWidth > 0 && window.innerHeight > 0) {
          // Final fallback to window dimensions
          containerWidth = window.innerWidth;
          containerHeight = window.innerHeight;
        } else {
          // Shouldn't happen, but handle gracefully
          return;
        }
        
        // Ensure we have valid dimensions (at least 100px to prevent layout issues)
        if (containerWidth > 100 && containerHeight > 100) {
          // With RESIZE mode, this updates the game world size to match container
          // Everything will scale proportionally based on the new dimensions
          // The scene's resize handler (via scale.on('resize')) will be called automatically
          gameRef.current.scale.resize(containerWidth, containerHeight);
        }
      }
    };

    // Debounce resize events to prevent excessive recalculations
    // Use shorter debounce for orientation changes to respond faster
    const debouncedResize = debounce(handleResize, 100);

    // Handle orientation changes specifically - need immediate response
    // CRITICAL FIX: Ensure accurate dimensions after orientation change on iPhone Pro Max
    const handleOrientationChange = () => {
      // Immediate resize for orientation changes (no debounce)
      // Use multiple attempts with increasing delays to ensure accurate dimensions
      // This is especially important on iPhone Pro Max where dimension updates can be delayed
      const attemptResize = (attempt: number = 0) => {
        if (gameRef.current && container) {
          // CRITICAL: Priority 1 - Use container dimensions (most reliable)
          let containerWidth: number;
          let containerHeight: number;
          
          if (container.clientWidth > 0 && container.clientHeight > 0) {
            containerWidth = container.clientWidth;
            containerHeight = container.clientHeight;
          } else if (window.visualViewport && window.visualViewport.width > 0 && window.visualViewport.height > 0) {
            containerWidth = window.visualViewport.width;
            containerHeight = window.visualViewport.height;
          } else if (window.innerWidth > 0 && window.innerHeight > 0) {
            containerWidth = window.innerWidth;
            containerHeight = window.innerHeight;
          } else {
            // No valid dimensions yet
            if (attempt < 3) {
              setTimeout(() => attemptResize(attempt + 1), 100 * (attempt + 1));
            }
            return;
          }
          
          // Ensure we have valid dimensions before resizing
          if (containerWidth > 100 && containerHeight > 100) {
          // Resize game - scene's resize handler will be called automatically via scale.on('resize')
          gameRef.current.scale.resize(containerWidth, containerHeight);
          } else if (attempt < 3) {
            // Retry if dimensions are invalid (browser might not have updated yet)
            setTimeout(() => attemptResize(attempt + 1), 100 * (attempt + 1));
          }
        }
      };
      
      // Initial attempt after a short delay
      setTimeout(() => attemptResize(), 100);
      // Additional attempt after longer delay for slow devices
      setTimeout(() => attemptResize(1), 300);
    };

    // Listen to visual viewport API for mobile browsers (iOS Safari)
    // This is critical for Safari when tabs are open/closed - viewport changes
    // CRITICAL FIX for Safari Mobile: Use container dimensions first, then visual viewport
    const handleVisualViewportResize = () => {
      if (gameRef.current && container) {
        let containerWidth: number;
        let containerHeight: number;
        
        // Priority 1: Use container dimensions (most reliable)
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          containerWidth = container.clientWidth;
          containerHeight = container.clientHeight;
        } else if (window.visualViewport && window.visualViewport.width > 0 && window.visualViewport.height > 0) {
          // Priority 2: Use visual viewport
          containerWidth = window.visualViewport.width;
          containerHeight = window.visualViewport.height;
        } else {
          // Priority 3: Fallback to window dimensions
          containerWidth = window.innerWidth || container.clientWidth;
          containerHeight = window.innerHeight || container.clientHeight;
        }
        
        // Ensure we have valid dimensions (at least 100px to prevent layout issues)
        if (containerWidth > 100 && containerHeight > 100) {
          gameRef.current.scale.resize(containerWidth, containerHeight);
        }
      }
    };
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
      window.visualViewport.addEventListener('scroll', handleVisualViewportResize);
    }
    
    // Also listen to window resize as fallback
    window.addEventListener('resize', debouncedResize);

    // Listen to orientation changes specifically
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Also listen to screen.orientation API if available (more reliable)
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }

    // Note: window resize listener is added above in visual viewport section
    } // End of initializeGame function

    return () => {
      // Clean up resize listeners
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
        window.visualViewport.removeEventListener('scroll', handleVisualViewportResize);
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', debouncedResize);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      
      // Don't destroy game on cleanup in development (React Strict Mode)
      // The game will be destroyed when the app actually unmounts
      if (gameRef.current && import.meta.env.DEV) {
        // Don't reset flags in dev mode - keep game alive
        return;
      }
      
      if (gameRef.current) {
        try {
          gameRef.current.events.off('gameOver');
          gameRef.current.events.off('updateGameData');
          // Only destroy if this is the global instance
          if (globalGameInstance === gameRef.current) {
            gameRef.current.destroy(true);
            globalGameInstance = null;
            isInitializing = false; // Reset module-level flag
          }
        } catch (e) {
          // Error destroying game
        }
        gameRef.current = null;
        isInitializingRef.current = false;
        isInitializing = false; // Reset module-level flag
      }
    };
    // Only initialize once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle game active state
  useEffect(() => {
    if (!gameRef.current) {
      return;
    }

    const tryStartGame = () => {
      const scene = gameRef.current?.scene.getScene('GameScene') as GameScene | undefined;
      
      if (scene) {
        try {
          const sceneIsActive = scene.scene.isActive();
          
          // Ensure scene is started
          if (!sceneIsActive) {
            gameRef.current?.scene.start('GameScene');
            return false; // Will try again after scene starts
          }
          
          // CRITICAL: Check if assets are loaded before starting game
          // Access the private assetsLoaded flag via type assertion
          const assetsLoaded = (scene as any).assetsLoaded;
          if (isActive && !assetsLoaded) {
            return false; // Will try again after assets load
          }
          
          if (isActive) {
            // CRITICAL: Prevent double call to startGame()
            // Only call startGame() once per session to prevent resetting counters/obstacles
            if (!hasStartedGameRef.current) {
              hasStartedGameRef.current = true;
              scene.startGame();
            } else {
              // Don't call startGame() again - game is already started
              // Just ensure the game is running
              const isGameStarted = (scene as any).isGameStarted;
              if (!isGameStarted) {
                scene.startGame();
              }
            }
            return true;
          } else {
            // Reset the flag when game becomes inactive (going back to landing)
            hasStartedGameRef.current = false;
            scene.resetGame();
            return true;
          }
        } catch (e) {
          return false;
        }
      }
      return false;
    };

    // Try immediately
    if (tryStartGame()) return;

    // If scene not ready yet, wait a bit and try again
    if (isActive) {
      const interval = setInterval(() => {
        if (tryStartGame()) {
          clearInterval(interval);
        }
      }, 50);

      // Timeout after 2 seconds
      setTimeout(() => {
        clearInterval(interval);
        tryStartGame();
      }, 2000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [isActive]);

  // Expose toggle mute function
  useEffect(() => {
    if (gameRef.current) {
      (window as any).__toggleGameMute = () => {
        const scene = gameRef.current?.scene.getScene('GameScene') as GameScene | undefined;
        if (scene && typeof (scene as any).toggleMute === 'function') {
          return (scene as any).toggleMute();
        }
        return false;
      };
      (window as any).__getGameMuteState = () => {
        const scene = gameRef.current?.scene.getScene('GameScene') as GameScene | undefined;
        if (scene && typeof (scene as any).isSoundMuted === 'function') {
          return (scene as any).isSoundMuted();
        }
        return false;
      };
    }
    return () => {
      delete (window as any).__toggleGameMute;
      delete (window as any).__getGameMuteState;
    };
  }, []);

  // Game container: Uses flexible sizing to fill parent container completely.
  // Phaser's RESIZE mode will adapt the game world to match this container's dimensions exactly.
  return (
    <>
      <div 
        ref={containerRef} 
        id="game-canvas"
        className="w-full h-full overflow-hidden" 
        style={{ 
          margin: 0, 
          padding: 0,
          width: '100%',
          height: '100%',
          minHeight: '100%', // CRITICAL: Ensure minimum height fills container
          minWidth: '100%', // CRITICAL: Ensure minimum width fills container
          display: 'block',
          boxSizing: 'border-box',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }} 
      />
    </>
  );
}

export const Game = memo(GameComponent);