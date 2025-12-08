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
    const initialWidth = container.clientWidth || window.innerWidth || 1920;
    const initialHeight = container.clientHeight || window.innerHeight || 1080;
    
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
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // No fixed width/height - game world will match container size
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
    // We just need to trigger the resize event
    const handleResize = () => {
      if (gameRef.current && container) {
        // Get the actual container dimensions
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // With RESIZE mode, this updates the game world size to match container
        // Everything will scale proportionally based on the new dimensions
        gameRef.current.scale.resize(containerWidth, containerHeight);
      }
    };

    // Debounce resize events to prevent excessive recalculations
    const debouncedResize = debounce(handleResize, 250);

    // Listen to visual viewport API for mobile browsers (iOS Safari)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', debouncedResize);
      window.visualViewport.addEventListener('scroll', debouncedResize);
    }

    // Fallback to window resize for browsers without visual viewport API
    window.addEventListener('resize', debouncedResize);

    return () => {
      // Clean up resize listeners
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', debouncedResize);
        window.visualViewport.removeEventListener('scroll', debouncedResize);
      }
      window.removeEventListener('resize', debouncedResize);
      
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

  // Game container: Uses flexible sizing to fill parent container.
  // Phaser's RESIZE mode will adapt the game world to match this container's dimensions.
  // minHeight: 0 allows the container to shrink in flex layouts if needed.
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-hidden" 
      style={{ 
        margin: 0, 
        padding: 0,
        width: '100%',
        height: '100%',
        minHeight: 0, // Allow flex shrinking in flex layouts
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'stretch'
      }} 
    />
  );
}

export const Game = memo(GameComponent);