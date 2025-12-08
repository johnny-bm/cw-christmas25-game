import { useEffect, useRef, memo } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/GameScene';
import { GameData } from '../App';
import { debounce } from '../lib/debounce';
import { getElementColor } from '../game/colorConfig';

// Global singleton to prevent multiple game instances
let globalGameInstance: Phaser.Game | null = null;

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
  
  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onGameOver, onUpdateGameData, onGameReady, onLoadingProgress };
  }, [onGameOver, onUpdateGameData, onGameReady, onLoadingProgress]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Check if game already exists globally (React Strict Mode protection)
    if (globalGameInstance && globalGameInstance.scene) {
      // Game already exists, just update our ref
      if (!gameRef.current) {
        gameRef.current = globalGameInstance;
      }
      return;
    }
    
    if (gameRef.current || isInitializingRef.current) {
      return;
    }
    
    isInitializingRef.current = true;
    
    // Store the container reference to prevent recreation
    const container = containerRef.current;

    // Get device pixel ratio for high DPI displays
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Use RESIZE mode to make the game world adapt to screen size
    // Get initial container dimensions for responsive game world
    // CRITICAL FIX for iPhone Pro Max: Use multiple methods to get accurate dimensions
    // This ensures the game world matches the actual visible area, preventing ground/character from being off-screen
    let initialWidth: number;
    let initialHeight: number;
    
    // CRITICAL FIX for Safari Mobile: Function to get accurate viewport dimensions
    // Safari mobile has timing issues where dimensions aren't ready immediately
    const getViewportDimensions = (): { width: number; height: number } => {
      // Priority 1: Use container's actual rendered dimensions (most reliable)
      // Wait a bit for container to be properly sized by React/CSS
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        return {
          width: container.clientWidth,
          height: container.clientHeight
        };
      }
      
      // Priority 2: Use visual viewport (accounts for Safari browser UI)
      if (window.visualViewport && window.visualViewport.width > 0 && window.visualViewport.height > 0) {
        return {
          width: window.visualViewport.width,
          height: window.visualViewport.height
        };
      }
      
      // Priority 3: Use window inner dimensions
      if (window.innerWidth > 0 && window.innerHeight > 0) {
        return {
          width: window.innerWidth,
          height: window.innerHeight
        };
      }
      
      // Final fallback (shouldn't happen in practice)
      return {
        width: 1920,
        height: 1080
      };
    };
    
    // CRITICAL FIX for Safari Mobile: Wait for container to have valid dimensions
    // Safari mobile often reports 0x0 initially, so we need to wait and retry
    const waitForValidDimensions = (attempts = 0): void => {
      const maxAttempts = 20; // Increased attempts for Safari
      const dimensions = getViewportDimensions();
      
      // Check if we have valid dimensions (increased minimum to 200px for safety)
      if (dimensions.width > 200 && dimensions.height > 200) {
        initialWidth = dimensions.width;
        initialHeight = dimensions.height;
        // Visual debug: Show dimensions on screen (remove in production if needed)
        if (typeof document !== 'undefined') {
          const debugEl = document.getElementById('game-debug');
          if (debugEl) {
            debugEl.textContent = `Game: ${Math.round(initialWidth)}x${Math.round(initialHeight)}`;
          }
        }
        initializeGame();
      } else if (attempts < maxAttempts) {
        // Retry after a delay (longer delay for Safari)
        setTimeout(() => waitForValidDimensions(attempts + 1), 100);
      } else {
        // Last resort: use window dimensions
        initialWidth = window.innerWidth || window.screen.width || 1920;
        initialHeight = window.innerHeight || window.screen.height || 1080;
        // Visual debug
        if (typeof document !== 'undefined') {
          const debugEl = document.getElementById('game-debug');
          if (debugEl) {
            debugEl.textContent = `Game (fallback): ${Math.round(initialWidth)}x${Math.round(initialHeight)}`;
          }
        }
        initializeGame();
      }
    };
    
    // Start waiting for valid dimensions
    waitForValidDimensions();
    
    // Don't continue with initialization here - it will happen in initializeGame()
    return;
    
    function initializeGame() {
      const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      width: initialWidth, // Game world adapts to screen width
      height: initialHeight, // Game world adapts to screen height
      parent: container,
      backgroundColor: getElementColor('background'), // White background
      audio: {
        disableWebAudio: false,
        noAudio: false,
        // Force Web Audio API usage for better mobile support
        // Note: iOS still respects silent mode, but Web Audio has better control
        context: undefined // Let Phaser create its own AudioContext
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 2000 },
          debug: false,
          fps: 60, // Target FPS for physics
          timeScale: 1.0 // Normal time scale
        }
      },
      fps: {
        target: 60, // Target 60 FPS for smooth gameplay
        forceSetTimeOut: false // Use requestAnimationFrame for better performance
      },
      scene: [GameScene],
      scale: {
        mode: Phaser.Scale.RESIZE, // RESIZE mode makes game world adapt to container size
        // No autoCenter needed - RESIZE mode fills container completely
        // No fixed width/height - game world will match container size exactly
        // This allows the design to adapt to any screen size proportionally
      },
      render: {
        pixelArt: false,
        antialias: true,
        antialiasGL: true,
        roundPixels: false,
        resolution: devicePixelRatio
      }
    };

    gameRef.current = new Phaser.Game(config);
    globalGameInstance = gameRef.current;
    const game = gameRef.current;
    
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
        console.warn('⚠️ Assets loading timeout - proceeding anyway');
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
          console.warn('⚠️ No valid dimensions available during resize');
          return;
        }
        
        // Ensure we have valid dimensions (at least 100px to prevent layout issues)
        if (containerWidth > 100 && containerHeight > 100) {
          // With RESIZE mode, this updates the game world size to match container
          // Everything will scale proportionally based on the new dimensions
          // The scene's resize handler (via scale.on('resize')) will be called automatically
          gameRef.current.scale.resize(containerWidth, containerHeight);
          console.log('🔄 Game resized to:', containerWidth, 'x', containerHeight);
        } else {
          console.warn('⚠️ Invalid container dimensions during resize:', containerWidth, containerHeight);
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
            console.log('🔄 Game resized after orientation change:', containerWidth, 'x', containerHeight);
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
          console.log('🔄 Game resized via visual viewport:', containerWidth, 'x', containerHeight);
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
        gameRef.current = null;
        isInitializingRef.current = false;
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
          }
        } catch (e) {
          console.warn('Error destroying game:', e);
        }
        gameRef.current = null;
        isInitializingRef.current = false;
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
          
          if (isActive) {
            scene.startGame();
            return true;
          } else {
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
        console.warn('⚠️ Scene or toggleMute not available');
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
  // CRITICAL for Safari Mobile: Ensure container fills parent completely with visual debug
  return (
    <>
      {/* Visual debug indicator - shows game dimensions (visible on screen for debugging) */}
      {/* CRITICAL: Position it in middle left to avoid deadline counter and be visible */}
      <div 
        id="game-debug"
        style={{
          position: 'fixed',
          left: '20px', // Middle left position
          top: '50%', // Center vertically
          transform: 'translateY(-50%) translateZ(0)', // Center vertically and force hardware acceleration
          zIndex: 2147483647, // Maximum z-index value (JavaScript number max)
          backgroundColor: 'rgba(255,0,0,0.95)',
          color: 'white',
          padding: '8px 12px',
          fontSize: '14px',
          fontFamily: 'monospace',
          borderRadius: '6px',
          pointerEvents: 'none',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          border: '2px solid white',
          // Force it to be on top
          isolation: 'isolate' // Creates new stacking context
        }}
      >
        Loading...
      </div>
      <div 
        ref={containerRef} 
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