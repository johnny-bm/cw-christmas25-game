import { ArrowLeft, Zap, Trophy, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { GameData } from '../App';
import { formatNumber } from '../lib/formatNumber';

interface GameUIProps {
  gameData: GameData;
  bestDistance: number;
}

export function GameUI({ gameData, bestDistance }: GameUIProps) {
  const { distance, energy, deadlineProximity, combo, sprintMode, sprintTimer } = gameData;
  const [isMuted, setIsMuted] = useState(() => {
    // Check localStorage for saved mute state
    return localStorage.getItem('escapeTheDeadline_muted') === 'true';
  });

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
      console.log('🔊 Mute button clicked, new state:', newMutedState);
    } else {
      console.warn('⚠️ __toggleGameMute function not available');
    }
  };
  
  // Calculate energy slots (5 slots of 20% each)
  const energySlots = Array.from({ length: 5 }, (_, i) => {
    const slotThreshold = (4 - i) * 20;
    return energy > slotThreshold;
  });

  // Determine deadline text color based on proximity
  const getDeadlineTextColor = () => {
    if (deadlineProximity > 70) return 'text-red-600';
    if (deadlineProximity > 40) return 'text-orange-500';
    return 'text-yellow-500';
  };

  // Convert deadline proximity to meters (higher proximity = closer = fewer meters)
  const getDeadlineDistance = () => {
    return Math.round((100 - deadlineProximity) * 2);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">
      {/* Distance Counter - Top Center, no box - Better mobile sizing - Safe area support */}
      <div 
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: 'max(0.75rem, env(safe-area-inset-top, 0.75rem) + 0.25rem)'
        }}
      >
        <div className="text-3xl max-md:landscape:text-2xl sm:text-5xl md:text-7xl text-black opacity-40 font-bold" style={{ fontFamily: '"Urbanist", sans-serif' }}>
          {formatNumber(distance)}m
        </div>
      </div>

      {/* Top HUD - Responsive Layout - Smaller on mobile landscape - Safe area support */}
      <div 
        className="max-md:landscape:p-1 sm:p-3 md:p-4 flex justify-between items-start gap-1 sm:gap-2 flex-wrap"
        style={{
          paddingTop: 'max(0.375rem, env(safe-area-inset-top, 0.375rem))',
          paddingRight: 'max(0.375rem, env(safe-area-inset-right, 0.375rem))',
          paddingLeft: 'max(0.375rem, env(safe-area-inset-left, 0.375rem))',
          paddingBottom: '0.375rem'
        }}
      >
        {/* Combo Counter - Only show when combo >= 2 - No box - Better mobile sizing */}
        {combo >= 2 && (
          <div className="px-2 py-1 max-md:landscape:px-1.5 max-md:landscape:py-0.5 sm:px-3 sm:py-2">
            <div className="flex items-center gap-1 sm:gap-2 text-yellow-400 text-xs max-md:landscape:text-[10px] sm:text-sm mb-0.5 font-semibold">
              <Zap className="w-3 h-3 max-md:landscape:w-2.5 max-md:landscape:h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span>COMBO</span>
            </div>
            <div className="text-2xl max-md:landscape:text-xl sm:text-4xl md:text-5xl text-yellow-400 animate-pulse font-bold" style={{ fontFamily: '"Urbanist", sans-serif' }}>{combo}x</div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Energy Bar and Mute Button - Top Right - Simplified single bar - Compact on mobile landscape */}
        <div className="flex items-start gap-1 sm:gap-2">
          {/* Energy Bar - Better mobile sizing */}
          <div className="bg-black/80 border-2 border-white px-2 py-1.5 max-md:landscape:px-1.5 max-md:landscape:py-1 sm:px-3 sm:py-2 min-w-[90px] max-md:landscape:min-w-[80px] sm:min-w-[140px] rounded">
            <div className="flex items-center gap-1 sm:gap-2 text-white text-[9px] max-md:landscape:text-[8px] sm:text-xs mb-1 sm:mb-1 font-semibold">
              <Trophy className="w-2.5 h-2.5 max-md:landscape:w-2 max-md:landscape:h-2 sm:w-3 sm:h-3 md:w-4 md:h-4" />
              <span>ENERGY</span>
              <span className="ml-auto font-bold" style={{ fontFamily: '"Urbanist", sans-serif' }}>{Math.round(energy)}%</span>
            </div>
            <div className="w-full h-2 max-md:landscape:h-1.5 sm:h-2.5 bg-gray-800 border border-white rounded">
              <div 
                className="h-full bg-white transition-all duration-200"
                style={{ width: `${energy}%` }}
              />
            </div>
          </div>
          
          {/* Mute/Unmute Button - Next to Energy Bar */}
          <button
            onClick={handleToggleMute}
            className="pointer-events-auto bg-black/80 border-2 border-white hover:bg-black/90 active:scale-95 transition-all duration-150 touch-target rounded"
            style={{
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
        </div>
      </div>

      {/* Spacer to push deadline indicator to middle */}
      <div className="flex-1" />

      {/* Deadline Distance with Arrow - Left side, better mobile sizing - Safe area support */}
      <div 
        className="absolute left-2 sm:left-4 md:left-6 top-[35%] sm:top-[40%] flex items-center gap-1.5 sm:gap-2"
        style={{
          left: 'max(0.5rem, env(safe-area-inset-left, 0.5rem))'
        }}
      >
        <ArrowLeft className={`w-4 h-4 max-md:landscape:w-3 max-md:landscape:h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 ${getDeadlineTextColor()} transition-colors`} />
        <div className={`text-xs max-md:landscape:text-[10px] sm:text-base md:text-lg font-semibold ${getDeadlineTextColor()} transition-colors`} style={{ fontFamily: '"Urbanist", sans-serif' }}>
          DEADLINE {getDeadlineDistance()}m
        </div>
      </div>

      {/* Sprint Mode Timer - Only show when active - Centered - Simple without box - Safe area support */}
      {sprintMode && sprintTimer && sprintTimer > 0 && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"
          style={{
            top: 'calc(50% + env(safe-area-inset-top, 0px) / 2)'
          }}
        >
          <div className="text-center">
            <div className="text-yellow-400 text-sm max-md:landscape:text-xs sm:text-lg md:text-xl mb-1 sm:mb-2 whitespace-nowrap" style={{ fontFamily: '"Urbanist", sans-serif' }}>
              ⚡ SPRINT MODE ⚡
            </div>
            <div className="text-4xl max-md:landscape:text-3xl sm:text-6xl md:text-7xl text-yellow-400" style={{ fontFamily: '"Urbanist", sans-serif' }}>
              {Math.ceil(sprintTimer / 1000)}s
            </div>
          </div>
        </div>
      )}

      {/* Mobile Jump Hint - Bottom right - Better mobile sizing - Safe area support */}
      <div 
        className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 md:hidden"
        style={{
          bottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))',
          right: 'max(0.5rem, env(safe-area-inset-right, 0.5rem))'
        }}
      >
        <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 max-md:landscape:px-2 max-md:landscape:py-1 sm:px-3 sm:py-2 text-xs max-md:landscape:text-[10px] sm:text-sm border border-white/40 rounded font-semibold">
          TAP TO JUMP
        </div>
      </div>
    </div>
  );
}