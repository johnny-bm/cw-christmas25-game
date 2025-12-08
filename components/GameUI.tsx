import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { GameData } from '../App';
import { formatNumber } from '../lib/formatNumber';
import { GameConfig } from '../game/gameConfig';

interface GameUIProps {
  gameData: GameData;
  bestDistance: number;
}

export function GameUI({ gameData, bestDistance }: GameUIProps) {
  const { distance, energy, deadlineProximity, combo, sprintMode, sprintTimer, grinchScore = 0, elfScore = 0 } = gameData;
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

  // Determine deadline background color based on proximity (matching bubble style)
  const getDeadlineBgColor = () => {
    if (deadlineProximity > 70) return '#d7586c'; // red
    if (deadlineProximity > 40) return '#ff9c81'; // orange
    return '#ff9c81'; // yellow/orange
  };

  // Convert deadline proximity to meters (higher proximity = closer = fewer meters)
  // Uses maxDistance as the base - when energy is 100 (proximity 0), distance reaches maxDistance
  const getDeadlineDistance = () => {
    if (GameConfig.deadline.maxDistance === Infinity) {
      // No cap: use multiplier-based calculation
      return Math.round((100 - deadlineProximity) * GameConfig.deadline.distanceMultiplier);
    } else {
      // Capped: calculate as percentage of maxDistance
      // When energy is 100 (proximity 0): distance = maxDistance
      // When energy is 0 (proximity 100): distance = 0
      const calculatedDistance = (100 - deadlineProximity) / 100 * GameConfig.deadline.maxDistance;
      return Math.round(calculatedDistance);
    }
  };

  // Deadline Indicator Component - Named variable for easy reference
  // Position: Top left on mobile, middle left on desktop
  const deadlineIndicator = (
    <div 
      className="deadline-indicator absolute left-2 sm:left-4 md:left-6 flex items-center gap-1.5 sm:gap-2"
      style={{
        left: 'max(0.5rem, env(safe-area-inset-left, 0.5rem))',
      }}
    >
      <div 
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-2 rounded-full transition-colors deadline-indicator-content"
        style={{ 
          backgroundColor: getDeadlineBgColor(),
          fontFamily: '"Urbanist", sans-serif'
        }}
      >
        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        <span className="text-white text-xs sm:text-lg font-bold whitespace-nowrap">
          DEADLINE {getDeadlineDistance()}m
        </span>
      </div>
    </div>
  );

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

      {/* Character Scores - Below Distance Counter - Responsive - Bigger on mobile */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-4 md:gap-6"
        style={{
          top: 'max(5.5rem, env(safe-area-inset-top, 0.75rem) + 5rem)'
        }}
      >
        {/* Grinch Score */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <img 
            src={
              grinchScore > elfScore 
                ? "/Assets/Characters/Grinch-Happy.svg"
                : grinchScore < elfScore
                ? "/Assets/Characters/Grinch-Sad.svg"
                : "/Assets/Characters/Grinch.svg"
            }
            alt="Grinch" 
            className="w-8 h-8 max-md:landscape:w-7 max-md:landscape:h-7 sm:w-10 sm:h-10 md:w-10 md:h-10"
            style={{ objectFit: 'contain' }}
          />
          <span className="text-xl max-md:landscape:text-lg sm:text-2xl md:text-3xl text-black opacity-40 font-bold" style={{ fontFamily: '"Urbanist", sans-serif' }}>
            {grinchScore}
          </span>
        </div>

        {/* Elf Score */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <img 
            src={
              elfScore > grinchScore 
                ? "/Assets/Characters/Elf-Happy-Color.svg"
                : elfScore < grinchScore
                ? "/Assets/Characters/Elf-Sad-Grey.svg"
                : "/Assets/Characters/Elf.svg"
            }
            alt="Elf" 
            className="w-8 h-8 max-md:landscape:w-7 max-md:landscape:h-7 sm:w-10 sm:h-10 md:w-10 md:h-10"
            style={{ objectFit: 'contain' }}
          />
          <span className="text-xl max-md:landscape:text-lg sm:text-2xl md:text-3xl text-black opacity-40 font-bold" style={{ fontFamily: '"Urbanist", sans-serif' }}>
            {elfScore}
          </span>
        </div>
      </div>

      {/* Top HUD - Figma Design - Safe area support */}
      <div 
        className="absolute top-0 right-0 flex flex-col gap-2 sm:gap-3"
        style={{
          paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))',
          paddingRight: 'max(0.5rem, env(safe-area-inset-right, 0.5rem))',
        }}
      >
        {/* Energy Bar and Mute Button - Top Right Row */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {/* Energy Bar - White background, teal progress */}
          {/* RESPONSIVE: Use min-width with responsive scaling instead of fixed pixels */}
          <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 h-14 sm:h-16 min-w-[120px] sm:min-w-[140px] md:min-w-[160px] w-auto flex flex-col justify-between">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <img 
                  src="/Assets/Energy.svg" 
                  alt="Energy" 
                  className="w-3 h-3 sm:w-4 sm:h-4"
                />
                <span className="text-[#312f31] text-[10px] sm:text-xs font-bold uppercase" style={{ fontFamily: '"Urbanist", sans-serif' }}>
                  ENERGY
                </span>
              </div>
              <span className="text-[#312f31] text-[10px] sm:text-xs font-bold" style={{ fontFamily: '"Urbanist", sans-serif' }}>
                {Math.round(energy)}%
              </span>
            </div>
            <div className="relative h-2.5 sm:h-3.5 w-full rounded-full border border-[#00a994]">
              <div 
                className="absolute h-full bg-[#00a994] rounded-full transition-all duration-200"
                style={{ width: `${energy}%` }}
              />
            </div>
          </div>
          
          {/* Mute/Unmute Button - White square */}
          <button
            onClick={handleToggleMute}
            className="pointer-events-auto bg-white rounded-lg sm:rounded-xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all duration-150"
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
        </div>

        {/* Combo Counter - Purple background - Only show when combo >= 2 */}
        {/* RESPONSIVE: Use min-width with responsive scaling instead of fixed pixels */}
        {combo >= 2 && (
          <div className="bg-[#645290] rounded-lg sm:rounded-xl p-2 sm:p-3 h-14 sm:h-16 min-w-[184px] sm:min-w-[210px] md:min-w-[236px] w-auto flex items-center justify-between">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <img 
                src="/Assets/Combo.svg" 
                alt="Combo" 
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
              <span className="text-white text-[10px] sm:text-xs font-bold uppercase" style={{ fontFamily: '"Urbanist", sans-serif' }}>
                COMBO
              </span>
            </div>
            <span className="text-white text-3xl sm:text-5xl font-bold" style={{ fontFamily: '"Urbanist", sans-serif' }}>
              {combo}x
            </span>
          </div>
        )}

        {/* Combo Rush - Only show when active - Under combo counter */}
        {/* RESPONSIVE: Use min-width with responsive scaling instead of fixed pixels */}
        {sprintMode && sprintTimer !== undefined && sprintTimer > 0 && (
          <div className="bg-[#F6A288] rounded-lg sm:rounded-xl p-2 sm:p-3 h-14 sm:h-16 min-w-[184px] sm:min-w-[210px] md:min-w-[236px] w-auto flex flex-col justify-between">
            <div className="flex items-center justify-between w-full">
              <span className="text-white text-[10px] sm:text-xs font-bold uppercase" style={{ fontFamily: '"Urbanist", sans-serif' }}>
                COMBO RUSH
              </span>
              <span className="text-white text-[10px] sm:text-xs font-bold" style={{ fontFamily: '"Urbanist", sans-serif' }}>
                {Math.ceil(sprintTimer / 1000)}s
              </span>
            </div>
            <div className="relative h-2.5 sm:h-3.5 w-full rounded-full border border-white bg-white/20 overflow-hidden">
              <div 
                key={`progress-${Math.floor(sprintTimer)}`}
                className="absolute h-full bg-white rounded-full"
                style={{ 
                  width: `${Math.max(0, Math.min(100, (sprintTimer / GameConfig.sprint.duration) * 100))}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Deadline Indicator - Top left on mobile, middle left on desktop */}
      {deadlineIndicator}

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