import { Trophy, Navigation, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { scoreService } from '../lib/scoreService';
import { Leaderboard } from './Leaderboard';
import { formatNumber } from '../lib/formatNumber';

interface GameOverProps {
  distance: number;
  bestDistance: number;
  maxCombo: number;
  grinchScore?: number;
  elfScore?: number;
  onRestart: () => void;
}

export function GameOver({ distance, bestDistance, maxCombo, grinchScore = 0, elfScore = 0, onRestart }: GameOverProps) {
  const isNewBest = distance === bestDistance && distance > 0;
  const [showContent, setShowContent] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [isTopScore, setIsTopScore] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    // Check localStorage for saved mute state
    return localStorage.getItem('escapeTheDeadline_muted') === 'true';
  });

  useEffect(() => {
    // Check if this is a top score
    checkTopScore();
    
    // Stagger the animations
    const timer1 = setTimeout(() => setShowContent(true), 300);
    const timer2 = setTimeout(() => setShowStats(true), 800);
    const timer3 = setTimeout(() => setShowButton(true), 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [distance]); // Add distance as dependency

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

  const checkTopScore = async () => {
    console.log('🏆 Checking if score is top 10:', distance);
    const isTop = await scoreService.isTopScore(distance);
    console.log('🏆 Is top score?', isTop, 'Distance > 0?', distance > 0);
    setIsTopScore(isTop && distance > 0);
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation: If email is provided, all 3 initials are required
    if (!playerName.trim() || isSaving || scoreSaved) return;
    if (email.trim() && playerName.trim().length < 3) return;

    setIsSaving(true);
    try {
      await scoreService.saveScore(
        playerName.trim(), 
        distance, 
        maxCombo, 
        grinchScore, 
        elfScore,
        email.trim() || undefined // Only pass email if it's not empty
      );
      setScoreSaved(true);
    } catch (error) {
      console.error('Failed to save score:', error);
      // Show error but don't block UI
      setScoreSaved(true); // Still mark as "saved" to prevent retry loops
      alert('Failed to save score. It has been saved locally instead.');
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

  return (
    <div className="w-full h-full bg-white overflow-y-auto animate-in fade-in duration-500 relative">
      {/* Mute/Unmute Button - Top Right */}
      <button
        onClick={handleToggleMute}
        className="absolute z-20 pointer-events-auto bg-black/80 border-2 border-white hover:bg-black/90 active:scale-95 transition-all duration-150 touch-target rounded"
        style={{
          top: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))',
          right: 'max(0.5rem, env(safe-area-inset-right, 0.5rem))',
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

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, black 2px, black 4px)',
          transform: 'skewY(-12deg) translateY(-50%)'
        }} />
      </div>

      <div className="relative min-h-full flex flex-col items-center justify-center px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 gap-1.5 sm:gap-3 md:gap-4">
        {/* Main Title Section - Smaller on mobile */}
        <div className={`text-center transition-all duration-1000 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="relative inline-block">
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl text-black tracking-tighter mb-0.5 sm:mb-1">
              THE DEADLINE
            </h1>
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-red-600 tracking-tighter -mt-0.5 sm:-mt-1">
              WON
            </h1>
            {isNewBest && (
              <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 animate-bounce">
                <Trophy className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-500 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
              </div>
            )}
          </div>
          <p className="text-gray-600 italic mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] md:text-xs">
            But hey, the holidays are here anyway
          </p>
        </div>

        {/* Stats & Leaderboard Container - Stacked on mobile portrait, horizontal on landscape */}
        <div className={`w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4 transition-all duration-1000 delay-300 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          {/* Left: Your Stats */}
          <div className="space-y-1.5 sm:space-y-2">
            {/* Distance Card */}
            <div className="bg-gray-50 border-2 border-gray-300 p-2 sm:p-3 md:p-4 relative overflow-hidden group hover:border-yellow-500 transition-all rounded">
              <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative flex items-center justify-between h-full">
                <div className="flex-1">
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                    <Navigation className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-gray-600" />
                    <span className="text-[7px] sm:text-[8px] md:text-[10px] tracking-widest text-gray-600">YOU ESCAPED</span>
                  </div>
                  <div className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-black tracking-tight" style={{ fontFamily: '"Urbanist", sans-serif' }}>{formatNumber(distance)}<span className="text-sm sm:text-xl md:text-2xl text-gray-500">m</span></div>
                </div>
                <button
                  onClick={onRestart}
                  className="group/btn relative px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-black text-white text-[7px] sm:text-[8px] md:text-[10px] sm:text-xs overflow-hidden transition-all hover:scale-105 active:scale-95 whitespace-nowrap ml-2 sm:ml-3 md:ml-4 rounded"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-red-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 tracking-wide font-medium">ONE MORE LAP</span>
                </button>
              </div>
            </div>

            {/* Save Score Form - Always show unless already saved */}
            {!scoreSaved && (
              <div className={`border-2 p-1.5 sm:p-2 md:p-3 animate-in slide-in-from-bottom duration-500 rounded ${
                isTopScore 
                  ? 'bg-yellow-50 border-yellow-500' 
                  : 'bg-gray-50 border-gray-300'
              }`}>
                {isTopScore && (
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
                    <Trophy className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-yellow-600" />
                    <span className="text-yellow-600 text-[8px] sm:text-[10px] md:text-xs">TOP 10 ESCAPE! CLAIM YOUR GLORY</span>
                  </div>
                )}
                {!isTopScore && (
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
                    <span className="text-gray-700 text-[8px] sm:text-[10px] md:text-xs">SAVE YOUR ESCAPE</span>
                  </div>
                )}
                <form onSubmit={handleSaveScore} className="space-y-1.5 sm:space-y-2">
                  <div className="flex gap-1 sm:gap-1.5">
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => {
                        // Only allow letters, uppercase, max 3 characters
                        const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
                        setPlayerName(value);
                      }}
                      placeholder="Your initials (3 letters)"
                      maxLength={3}
                      className="flex-1 px-1.5 py-1 sm:px-2 sm:py-1.5 text-[10px] sm:text-xs md:text-sm bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-yellow-500 focus:outline-none rounded"
                      disabled={isSaving}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={
                        !playerName.trim() || 
                        isSaving || 
                        playerName.length < 1 ||
                        (email.trim() && !isValidEmail(email)) ||
                        (email.trim() && playerName.trim().length < 3)
                      }
                      className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs md:text-sm bg-yellow-500 text-black hover:bg-yellow-400 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all rounded"
                    >
                      {isSaving ? '...' : 'SAVE'}
                    </button>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    placeholder="Email (optional)"
                    className="w-full px-1.5 py-1 sm:px-2 sm:py-1.5 text-[10px] sm:text-xs md:text-sm bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-yellow-500 focus:outline-none rounded"
                    disabled={isSaving}
                  />
                  {email.trim() && !isValidEmail(email) && (
                    <p className="text-red-600 text-[9px] sm:text-[10px] md:text-xs">Please enter a valid email address</p>
                  )}
                  {email.trim() && playerName.trim().length < 3 && (
                    <p className="text-red-600 text-[9px] sm:text-[10px] md:text-xs">All 3 initials are required when email is provided</p>
                  )}
                </form>
              </div>
            )}

            {scoreSaved && (
              <div className="bg-green-50 border-2 border-green-500 p-1.5 sm:p-2 md:p-3 animate-in zoom-in duration-300 rounded">
                <p className="text-green-700 text-center text-[9px] sm:text-[10px] md:text-xs">✓ ON THE BOARD!</p>
              </div>
            )}

            {/* Footer text - moved under save your escape card */}
            <div className={`text-center transition-all duration-1000 delay-500 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="space-y-0.5 text-gray-700 text-[9px] sm:text-[10px] md:text-xs hidden sm:block">
                <p>The Deadline got you, but Crackwits made it through the chaos.</p>
                <p className="text-gray-600">🎄 We're officially on holiday mode — see you next year!</p>
              </div>

              <p className="text-[7px] sm:text-[8px] md:text-[10px] text-gray-500 pt-0.5 sm:pt-1 hidden sm:block">
                Made with ☕ and ⏰ by the Crackwits crew
              </p>
            </div>
          </div>

          {/* Right: Leaderboard */}
          <div className="flex flex-col">
            <Leaderboard 
              className="text-black" 
              refresh={scoreSaved} 
              compact={true}
              highlightPlayerName={scoreSaved ? playerName.trim() : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}