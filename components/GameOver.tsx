import { Trophy, Navigation } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scoreService } from '../lib/scoreService';
import { Leaderboard } from './Leaderboard';
import { formatNumber } from '../lib/formatNumber';
import { getElementColor } from '../game/colorConfig';
import { EndingPopup } from './EndingPopup';
import { textConfig } from '../lib/textConfig';

interface GameOverProps {
  distance: number;
  bestDistance: number;
  maxCombo: number;
  grinchScore?: number;
  elfScore?: number;
  onRestart: () => void;
}

export function GameOver({ distance, bestDistance, maxCombo, grinchScore = 0, elfScore = 0, onRestart }: GameOverProps) {
  const location = useLocation();
  
  // Detect Safari mobile for proper spacing
  const isMobileSafari = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const [showContent, setShowContent] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [savedScoreId, setSavedScoreId] = useState<string | null>(null);
  const [isTopScore, setIsTopScore] = useState(false);
  const [isTop3, setIsTop3] = useState(false);
  const [top3Position, setTop3Position] = useState<number | null>(null);
  const [scorePosition, setScorePosition] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugDistance, setDebugDistance] = useState<number | null>(null);
  const [debugMaxCombo, setDebugMaxCombo] = useState<number | null>(null);
  const [debugGrinchScore, setDebugGrinchScore] = useState<number | null>(null);
  const [debugElfScore, setDebugElfScore] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(() => {
    // Check localStorage for saved mute state
    return localStorage.getItem('escapeTheDeadline_muted') === 'true';
  });

  useEffect(() => {
    // Check for debug mode
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    
    if (debugParam === 'popup') {
      const debugScore = parseInt(urlParams.get('score') || '0') || distance;
      const debugTop3 = urlParams.get('top3') === 'true';
      const debugPosition = parseInt(urlParams.get('position') || '0') || null;
      
      // Set debug values
      setDebugMode(true);
      setDebugDistance(debugScore);
      setDebugMaxCombo(debugTop3 ? 10 : 5);
      setDebugGrinchScore(debugTop3 ? Math.floor(debugScore / 2) : Math.floor(debugScore / 2));
      setDebugElfScore(debugTop3 ? Math.floor(debugScore / 2) : Math.floor(debugScore / 2));
      setIsTop3(debugTop3);
      setTop3Position(debugTop3 && debugPosition ? debugPosition : null);
      // For debug mode, set a mock overall position if not top 3
      if (!debugTop3) {
        setScorePosition(debugPosition || 10); // Default to rank 10 for regular scores in debug
      } else {
        setScorePosition(debugPosition);
      }
      
      // Show popup immediately in debug mode
      setTimeout(() => {
        setShowPopup(true);
      }, 100);
      return;
    }
    
    // Check if a game was just completed (not a page refresh)
    const shouldShowPopup = sessionStorage.getItem('escapeTheDeadline_showEndingPopup') === 'true';
    
    // Normal mode - check if this is a top score and top 3
    checkTopScore();
    checkTop3();
    
    // Only show popup if a game was just completed
    if (shouldShowPopup) {
      // Clear the flag so it doesn't show on refresh
      sessionStorage.removeItem('escapeTheDeadline_showEndingPopup');
      
      // Show popup after a short delay
      const popupTimer = setTimeout(() => {
        setShowPopup(true);
      }, 500);
      
      // Stagger the animations
      const timer1 = setTimeout(() => setShowContent(true), 300);
      const timer2 = setTimeout(() => setShowStats(true), 800);
      const timer3 = setTimeout(() => setShowButton(true), 1200);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(popupTimer);
      };
    } else {
      // Still show animations even if popup shouldn't show
      const timer1 = setTimeout(() => setShowContent(true), 300);
      const timer2 = setTimeout(() => setShowStats(true), 800);
      const timer3 = setTimeout(() => setShowButton(true), 1200);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [distance, location.search]); // Add location.search to detect URL param changes

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
    }
  };

  const checkTopScore = async () => {
    const isTop = await scoreService.isTopScore(distance);
    setIsTopScore(isTop && distance > 0);
  };

  const checkTop3 = async () => {
    if (distance <= 0) return;
    const { isTop3: top3, position } = await scoreService.getTop3Position(distance);
    setIsTop3(top3);
    setTop3Position(position);
    
    // Also get the overall position for all scores
    const overallPosition = await scoreService.getScorePosition(distance);
    setScorePosition(overallPosition);
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation: If email is provided, all 3 initials are required
    if (!playerName.trim() || isSaving || scoreSaved) return;
    if (email.trim() && playerName.trim().length < 3) return;

    setIsSaving(true);
    try {
      const savedScore = await scoreService.saveScore(
        playerName.trim(), 
        distance, 
        maxCombo, 
        grinchScore, 
        elfScore,
        email.trim() || undefined, // Only pass email if it's not empty
        undefined // Prize selection handled by popup
      );
      setSavedScoreId(savedScore.id);
      setScoreSaved(true);
    } catch (error) {
      // Show error but don't block UI
      setScoreSaved(true); // Still mark as "saved" to prevent retry loops
      alert(textConfig.endingPopup.form.errors.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePopupSave = async (playerName: string, email: string, prizeSelection?: 'consultation' | 'discount') => {
    setIsSaving(true);
    try {
      const savedScore = await scoreService.saveScore(
        playerName,
        distance,
        maxCombo,
        grinchScore,
        elfScore,
        email || undefined,
        prizeSelection
      );
      setSavedScoreId(savedScore.id);
      setScoreSaved(true);
      setShowPopup(false);
    } catch (error) {
      alert('Failed to save score. Please try again.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Email validation helper
  const isValidEmail = (email: string) => {
    if (!email.trim()) return true; // Empty is valid (optional field)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const gameBackgroundColor = getElementColor('background');
  const accentColor = getElementColor('uiOrange');
  // Light transparent accent for soft backgrounds
  const accentSoftColor = `${accentColor}22`;
  
  return (
    <div className="w-full h-full overflow-y-auto animate-in fade-in duration-500 relative" style={{ backgroundColor: gameBackgroundColor }}>
      {/* Enhanced Ending Popup */}
      {showPopup && !scoreSaved && (
        <EndingPopup
          distance={debugMode && debugDistance !== null ? debugDistance : distance}
          maxCombo={debugMode && debugMaxCombo !== null ? debugMaxCombo : maxCombo}
          grinchScore={debugMode && debugGrinchScore !== null ? debugGrinchScore : grinchScore}
          elfScore={debugMode && debugElfScore !== null ? debugElfScore : elfScore}
          isTop3={isTop3}
          position={top3Position}
          overallPosition={scorePosition}
          onSave={handlePopupSave}
          onClose={() => setShowPopup(false)}
        />
      )}
      {/* CW Logo - Top Center - Well below Dynamic Island on Safari mobile */}
      <div
        className="absolute z-20 left-1/2 transform -translate-x-1/2"
        style={{
          top: isMobileSafari 
            ? 'max(4.5rem, calc(env(safe-area-inset-top, 0px) + 1rem + 3.5rem))'
            : 'max(1.5rem, calc(env(safe-area-inset-top, 0px) + 1rem))',
        }}
      >
        <img 
          src="/Assets/CW-Logo.svg" 
          alt={textConfig.common.altText.crackwitsLogo} 
          className="h-8 sm:h-10 md:h-12 lg:h-14"
        />
      </div>
      
      {/* Mute/Unmute Button - Top Right - Well below Dynamic Island on Safari mobile */}
      <button
        onClick={handleToggleMute}
        className="absolute z-20 pointer-events-auto bg-white rounded-lg sm:rounded-xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all duration-150"
        style={{
          top: isMobileSafari 
            ? 'max(4.5rem, calc(env(safe-area-inset-top, 0px) + 1rem + 3.5rem))'
            : 'max(1rem, calc(env(safe-area-inset-top, 0px) + 1rem))',
          right: 'max(1rem, calc(env(safe-area-inset-right, 0px) + 1rem))',
        }}
        aria-label={isMuted ? textConfig.common.ariaLabels.unmute : textConfig.common.ariaLabels.mute}
      >
        {isMuted ? (
          <img 
            src="/Assets/Mute.svg" 
            alt={textConfig.common.altText.muted} 
            className="w-6 h-6 sm:w-7 sm:h-7"
          />
        ) : (
          <img 
            src="/Assets/Unmute.svg" 
            alt={textConfig.common.altText.unmuted} 
            className="w-6 h-6 sm:w-7 sm:h-7"
          />
        )}
      </button>

      <div 
        className="relative min-h-full flex flex-col items-center justify-start py-3 sm:py-4 md:py-6 gap-4 sm:gap-5 md:gap-6" 
        style={{ 
          paddingTop: isMobileSafari 
            ? 'max(8rem, calc(env(safe-area-inset-top, 0px) + 1rem + 7rem))'
            : 'max(7rem, calc(env(safe-area-inset-top, 0px) + 1rem + 5rem + 1rem))',
          paddingLeft: 'max(2rem, calc(env(safe-area-inset-left, 0px) + 1.5rem))',
          paddingRight: 'max(2rem, calc(env(safe-area-inset-right, 0px) + 1.5rem))',
          paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))'
        }}
      >
        {/* Main Title Section - Single line on mobile landscape */}
        <div className={`text-center transition-all duration-1000 w-full max-w-full ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
          <div className="relative inline-block">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-black tracking-normal break-words inline">
              {textConfig.gameOver.title}{' '}
              <span className="text-red-600">{textConfig.gameOver.titleHighlight}</span>
            </h1>
          </div>
          <p className="text-gray-700 italic mt-1 sm:mt-1.5 md:mt-2 text-sm sm:text-base md:text-lg">
            {textConfig.gameOver.subtitle}
          </p>
        </div>

        {/* Stats Cards - Stacked on mobile, side by side on larger screens */}
        <div className={`w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 transition-all duration-1000 delay-300 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem', boxSizing: 'border-box' }}>
          
          {/* You Escaped Card */}
          <div className="bg-gray-50 border-2 border-gray-300 p-2 sm:p-3 md:p-4 relative overflow-hidden group hover:border-yellow-500 transition-all rounded-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                <Navigation className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />
                <span className="text-[8px] sm:text-[9px] md:text-[10px] tracking-widest text-gray-600 uppercase">{textConfig.gameOver.stats.youEscaped}</span>
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-black tracking-tight mb-2 sm:mb-3" style={{ fontFamily: '"Urbanist", sans-serif' }}>
                {formatNumber(distance)}<span className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-500">m</span>
              </div>
              {/* RESPONSIVE: Use rem-based min-height for better scaling across devices */}
              <button
                id="replay-btn"
                onClick={onRestart}
                className="group/btn relative px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 bg-black text-white text-[9px] sm:text-[10px] md:text-xs overflow-hidden transition-all hover:scale-105 active:scale-95 whitespace-nowrap rounded-lg font-medium min-h-[2.25rem] sm:min-h-[2.5rem] flex items-center justify-center mt-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-red-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 tracking-wide">{textConfig.gameOver.stats.rollOneMoreTime}</span>
              </button>
            </div>
          </div>

          {/* Save Score Form Card */}
          {!scoreSaved && (
            <div
              className={`border-2 p-2 sm:p-3 md:p-4 animate-in slide-in-from-bottom duration-500 rounded-lg flex flex-col ${
                isTopScore 
                  ? ''
                  : 'bg-gray-50 border-gray-300'
              }`}
              style={isTopScore ? { borderColor: accentColor, backgroundColor: accentSoftColor } : undefined}
            >
              {isTopScore && (
                <div className="flex items-center gap-1 sm:gap-1.5 mb-2 sm:mb-2.5">
                  <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" style={{ color: accentColor }} />
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium leading-tight" style={{ color: accentColor }}>{textConfig.gameOver.stats.leaderboard}</span>
                </div>
              )}
              {!isTopScore && (
                <div className="mb-2 sm:mb-2.5">
                  <span className="text-gray-700 text-[8px] sm:text-[9px] md:text-[10px] font-medium">{textConfig.gameOver.stats.saveYourScore}</span>
                </div>
              )}
              <form onSubmit={handleSaveScore} className="space-y-1.5 sm:space-y-2 flex-1 flex flex-col">
                {/* RESPONSIVE: Use rem-based min-height for better scaling across devices */}
                <input
                  id="player-initials"
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    // Only allow letters, uppercase, max 3 characters
                    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
                    setPlayerName(value);
                  }}
                  placeholder={textConfig.gameOver.form.initials.placeholder}
                  maxLength={3}
                  className="w-full px-2 py-1.5 sm:px-2.5 sm:py-2 text-[10px] sm:text-xs md:text-sm bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black focus:outline-none rounded-lg min-h-[2.25rem] sm:min-h-[2.5rem]"
                  disabled={isSaving}
                  autoFocus
                />
                {/* RESPONSIVE: Use rem-based min-height for better scaling across devices */}
                <input
                  id="player-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  placeholder={textConfig.gameOver.form.email.placeholder}
                  className="w-full px-2 py-1.5 sm:px-2.5 sm:py-2 text-[10px] sm:text-xs md:text-sm bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black focus:outline-none rounded-lg min-h-[2.25rem] sm:min-h-[2.5rem]"
                  disabled={isSaving}
                />
                {/* RESPONSIVE: Use rem-based min-height for better scaling across devices */}
                <button
                  id="submit-score-btn"
                  type="submit"
                  disabled={
                    !playerName.trim() || 
                    isSaving || 
                    playerName.length < 1 ||
                    (email.trim() && !isValidEmail(email)) ||
                    (email.trim() && playerName.trim().length < 3)
                  }
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs md:text-sm text-black hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all rounded-lg font-medium min-h-[2.25rem] sm:min-h-[2.5rem] whitespace-nowrap"
                  style={{ backgroundColor: accentColor }}
                >
                  {isSaving ? textConfig.gameOver.form.button.saving : textConfig.gameOver.form.button.save}
                </button>
                {email.trim() && !isValidEmail(email) && (
                  <p className="text-red-600 text-[9px] sm:text-[10px]">{textConfig.gameOver.form.errors.invalidEmail}</p>
                )}
                {email.trim() && playerName.trim().length < 3 && (
                  <p className="text-red-600 text-[9px] sm:text-[10px]">{textConfig.gameOver.form.errors.needThreeInitials}</p>
                )}
              </form>
            </div>
          )}

          {scoreSaved && (
            <div className="bg-green-50 border-2 border-green-500 p-2 sm:p-3 md:p-4 animate-in zoom-in duration-300 rounded-lg flex items-center justify-center">
              <p className="text-green-700 text-center text-xs sm:text-sm md:text-base font-medium">{textConfig.gameOver.form.success}</p>
            </div>
          )}
        </div>

        {/* Leaderboard Container - Full width below - Ensure it's on screen on Safari mobile */}
        <div className={`w-full max-w-6xl transition-all duration-1000 delay-300 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Leaderboard - Full width, ensure proper padding on Safari mobile */}
          <div className="flex flex-col w-full px-2 sm:px-0">
            <Leaderboard 
              className="text-black" 
              refresh={scoreSaved} 
              compact={true}
              highlightScoreId={savedScoreId || undefined}
            />
          </div>
        </div>

        {/* Footer - Made with text */}
        <div className="w-full max-w-6xl text-center">
          <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 pt-1 sm:pt-2">
            {textConfig.gameOver.footer}
          </p>
        </div>
      </div>
    </div>
  );
}