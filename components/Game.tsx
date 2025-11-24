import { useEffect, useRef, memo } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/GameScene';
import { GameData } from '../App';
import { debounce } from '../lib/debounce';

// Global singleton to prevent multiple game instances
let globalGameInstance: Phaser.Game | null = null;

interface GameProps {
  onGameOver: (score: number, maxCombo: number) => void;
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
        console.log('🎮 Reusing existing global game instance');
      }
      return;
    }
    
    if (gameRef.current || isInitializingRef.current) {
      console.log('🎮 Game already initialized, skipping...');
      return;
    }
    
    isInitializingRef.current = true;
    
    console.log('🎮 Initializing Phaser game...');
    
    // Store the container reference to prevent recreation
    const container = containerRef.current;

    // Get device pixel ratio for high DPI displays
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Use actual window dimensions for fully responsive game
    const initialWidth = window.innerWidth;
    const initialHeight = window.innerHeight;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      width: initialWidth,
      height: initialHeight,
      parent: container,
      backgroundColor: '#ffffff', // White background
      audio: {
        disableWebAudio: false,
        noAudio: false
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 2000 },
          debug: false
        }
      },
      scene: [GameScene],
      scale: {
        mode: Phaser.Scale.RESIZE, // Canvas resizes to fit container
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: initialWidth,
        height: initialHeight
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
    game.events.on('gameOver', (score: number, maxCombo: number) => {
      callbacksRef.current.onGameOver(score, maxCombo);
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
      console.log('📦 Loading progress:', Math.round(progress * 100) + '%');
      if (callbacksRef.current.onLoadingProgress) {
        callbacksRef.current.onLoadingProgress(progress);
      }
    });

    // Listen for assets loaded event
    game.events.once('assetsLoaded', () => {
      console.log('✅ All assets loaded');
      assetsLoaded = true;
      
      // Wait a bit for scene to be fully initialized, then emit ready
      setTimeout(() => {
        const scene = game.scene.getScene('GameScene');
        if (scene && scene.scene.isActive()) {
          console.log('🎮 Game ready - all assets loaded and scene active');
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
              console.log('🎮 Game ready - scene started');
              game.events.emit('ready');
              if (callbacksRef.current.onGameReady) {
                callbacksRef.current.onGameReady();
              }
            }
          }, 100);
          
          // Fallback timeout
          setTimeout(() => {
            clearInterval(checkScene);
            console.log('🎮 Game ready (timeout fallback after assets loaded)');
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
    const handleResize = () => {
      if (gameRef.current) {
        // Use visual viewport if available (handles iOS Safari address bar)
        const width = window.visualViewport?.width || window.innerWidth;
        const height = window.visualViewport?.height || window.innerHeight;
        gameRef.current.scale.resize(width, height);
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
        console.log('🎮 Skipping game destruction in development mode (React Strict Mode)');
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
      console.log('🎮 Game.tsx - No game ref, isActive:', isActive);
      return;
    }

    console.log('🎮 Game.tsx - isActive changed to:', isActive);

    const tryStartGame = () => {
      const scene = gameRef.current?.scene.getScene('GameScene') as GameScene | undefined;
      
      if (scene) {
        try {
          const sceneIsActive = scene.scene.isActive();
          console.log('🎮 Game.tsx - tryStartGame - scene exists:', true, 'isActive:', sceneIsActive);
          
          // Ensure scene is started
          if (!sceneIsActive) {
            console.log('🎮 Game.tsx - Scene not active, starting it...');
            gameRef.current?.scene.start('GameScene');
            return false; // Will try again after scene starts
          }
          
          if (isActive) {
            console.log('🎮 Game.tsx - Calling startGame()');
            scene.startGame();
            return true;
          } else {
            console.log('🎮 Game.tsx - Game not active, resetting scene');
            scene.resetGame();
            return true;
          }
        } catch (e) {
          console.log('🎮 Game.tsx - Error checking scene:', e);
          return false;
        }
      }
      console.log('🎮 Game.tsx - tryStartGame - scene does not exist yet');
      return false;
    };

    // Try immediately
    if (tryStartGame()) return;

    // If scene not ready yet, wait a bit and try again
    if (isActive) {
      console.log('🎮 Game.tsx - Setting up retry interval for startGame');
      const interval = setInterval(() => {
        if (tryStartGame()) {
          console.log('🎮 Game.tsx - startGame succeeded, clearing interval');
          clearInterval(interval);
        }
      }, 50);

      // Timeout after 2 seconds
      setTimeout(() => {
        console.log('🎮 Game.tsx - Timeout reached, final attempt to startGame');
        clearInterval(interval);
        tryStartGame();
      }, 2000);

      return () => {
        console.log('🎮 Game.tsx - Cleaning up interval');
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
          const result = (scene as any).toggleMute();
          console.log('🔊 Toggle mute called, result:', result);
          return result;
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

  return <div ref={containerRef} className="w-full h-full" />;
}

export const Game = memo(GameComponent);