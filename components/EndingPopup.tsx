import { useState, useEffect } from 'react';
import { scoreService } from '../lib/scoreService';
import { formatNumber } from '../lib/formatNumber';
import { Confetti } from './Confetti';
import { getElementColor } from '../game/colorConfig';
import { Button } from './ui/button';

interface EndingPopupProps {
  distance: number;
  maxCombo: number;
  grinchScore: number;
  elfScore: number;
  isTop3: boolean;
  position: number | null;
  overallPosition?: number | null;
  onSave: (playerName: string, email: string, prizeSelection?: 'consultation' | 'discount') => Promise<void>;
  onClose: () => void;
}

export function EndingPopup({ 
  distance, 
  maxCombo, 
  grinchScore, 
  elfScore, 
  isTop3, 
  position,
  overallPosition,
  onSave,
  onClose 
}: EndingPopupProps) {
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [prizeSelection, setPrizeSelection] = useState<'consultation' | 'discount' | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [emailError, setEmailError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const uiRed = getElementColor('uiRed');
  const uiRedSoft = `${uiRed}1A`; // subtle translucent background based on UI red

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || window.innerHeight <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Detect Safari mobile for proper spacing
  const isMobileSafari = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  // Countdown timer to January 5th, 2026
  useEffect(() => {
    const updateTimer = () => {
      // Create deadline date explicitly: January 5, 2026 at 23:59:59 in local timezone
      // Month is 0-indexed (0 = January)
      const deadline = new Date(2026, 0, 5, 23, 59, 59, 999);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Deadline passed');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Format with proper padding for single digits
      const formattedDays = days.toString().padStart(1, '0');
      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const formattedSeconds = seconds.toString().padStart(2, '0');

      setTimeRemaining(`${formattedDays}d ${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s`);
    };

    // Run immediately and then every second
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Escape key to close popup
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Scroll popup to top on mobile when it opens
  useEffect(() => {
    const popup = document.getElementById('ending-popup');
    if (popup) {
      // Scroll to top immediately
      popup.scrollTop = 0;
      // Also scroll the window to top if needed (for mobile browsers)
      window.scrollTo(0, 0);
      // Use requestAnimationFrame to ensure it happens after render
      requestAnimationFrame(() => {
        popup.scrollTop = 0;
      });
    }
  }, []);

  // Email validation
  const isValidEmail = (email: string) => {
    if (!email.trim()) return !isTop3; // Empty is invalid for top 3, valid for regular
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value.trim() && !isValidEmail(value)) {
      setEmailError('Invalid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!playerName.trim()) return;
    if (playerName.trim().length < 3) return;
    if (isTop3 && !email.trim()) {
      setEmailError('Email is required for top 3 scores');
      return;
    }
    if (isTop3 && !isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (isTop3 && !prizeSelection) {
      alert('Please select a prize option');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(
        playerName.trim(),
        email.trim(),
        isTop3 &&         prizeSelection ? prizeSelection as 'consultation' | 'discount' : undefined
      );
    } catch (error) {
      alert('Failed to save score. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getTitle = () => {
    if (isTop3 && position) {
      if (position === 1) return "🥇 Champion! You're #1!";
      if (position === 2) return "🥈 Amazing! You're #2!";
      if (position === 3) return "🥉 Excellent! You're #3!";
    }
    return "Great ride!";
  };

  const getBodyMessage = () => {
    if (isTop3) {
      return (
        <>
          <p className="mb-2 sm:mb-3">
            You're Santa's New Favorite!
          </p>
          <p className="mb-2 sm:mb-3">
            Your score: <strong>{formatNumber(distance)}m</strong>
          </p>
          <p className="mb-2 sm:mb-3 text-sm sm:text-base">
            Leaderboard closes on <strong>January 5th, 2026</strong> stay <strong>TOP 3</strong> to claim your win! Refresh often... competitors roll in fast.
          </p>
        </>
      );
    }
    return (
      <>
        <p className="mb-2 sm:mb-3">
          Your elf almost out-skated the Deadline, but the Grinch caught up.
        </p>
        <p className="text-sm sm:text-base">
          Try again and push that score higher. Practice makes perfect!
        </p>
      </>
    );
  };

  const characterImage = isTop3 
    ? "/Assets/Characters/Elf-Happy-Color.svg"
    : "/Assets/Characters/Grinch-Happy.svg";

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto"
      style={{
        paddingTop: isMobileSafari 
          ? 'max(4.5rem, calc(env(safe-area-inset-top, 0px) + 1rem + 3.5rem))'
          : 'max(1.5rem, calc(env(safe-area-inset-top, 0px) + 1rem))',
        paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))',
        paddingLeft: 'max(1.5rem, calc(env(safe-area-inset-left, 0px) + 1rem))',
        paddingRight: 'max(1.5rem, calc(env(safe-area-inset-right, 0px) + 1rem))'
      }}
      onClick={onClose}
    >
      <div 
        id="ending-popup"
        data-popup-type={isTop3 ? 'top3' : 'regular'}
        data-position={position || null}
        className="relative bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl max-w-lg w-full my-2 sm:my-0 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti for top 3 */}
        {isTop3 && <Confetti active={true} />}
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-black/80 transition-colors text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>

        <div className="p-4 sm:p-6 md:p-8" style={{
          paddingLeft: 'max(1rem, calc(env(safe-area-inset-left, 0px) + 0.5rem))',
          paddingRight: 'max(1rem, calc(env(safe-area-inset-right, 0px) + 0.5rem))',
          paddingTop: 'max(0.5rem, calc(env(safe-area-inset-top, 0px) + 0.25rem))',
          paddingBottom: 'max(0.5rem, calc(env(safe-area-inset-bottom, 0px) + 0.25rem))'
        }}>
          {/* Character Image */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <img 
              src={characterImage} 
              alt={isTop3 ? "Happy Elf" : "Happy Grinch"}
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32"
            />
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 sm:mb-4 text-black">
            {getTitle()}
          </h2>

          {/* Body Message */}
          <div className="text-center text-sm sm:text-base md:text-lg text-gray-700 mb-4 sm:mb-6">
            {getBodyMessage()}
          </div>

          {/* Score Breakdown */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border-2 border-gray-200">
            <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 text-gray-800">Score Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Final Score:</span>
                <span id="final-score-display" className="text-base sm:text-lg md:text-xl font-bold text-black">{formatNumber(distance)}m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Elf vs Grinch:</span>
                <div className="flex items-center gap-2">
                  <span id="elf-score-display" className="text-xs sm:text-sm font-medium text-gray-700">
                    <img src="/Assets/Characters/Elf.svg" alt="Elf" className="inline w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                    {elfScore}
                  </span>
                  <span className="text-gray-400">vs</span>
                  <span id="grinch-score-display" className="text-xs sm:text-sm font-medium text-gray-700">
                    <img src="/Assets/Characters/Grinch.svg" alt="Grinch" className="inline w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                    {grinchScore}
                  </span>
                </div>
              </div>
              {maxCombo > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">Max Combo:</span>
                  <div id="combo-display" className="flex items-center gap-1">
                    <img src="/Assets/Combo.svg" alt="Combo" className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm font-bold text-yellow-600">{maxCombo}x</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top 3 Specific Elements */}
          {isTop3 && position && (
            <div className="mb-4 sm:mb-6 space-y-3">
              {/* Position Badge */}
              <div className="text-center">
                <div
                  className="inline-block border-2 rounded-full px-4 py-2"
                  style={{ backgroundColor: uiRedSoft, borderColor: uiRed }}
                >
                  <span
                    className="text-lg sm:text-xl md:text-2xl font-bold"
                    style={{ color: uiRed }}
                  >
                    {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'} Rank #{position}
                  </span>
                </div>
              </div>

              {/* Countdown Timer */}
              <div
                className="border-2 rounded-lg p-3 text-center"
                style={{ backgroundColor: uiRedSoft, borderColor: uiRed }}
              >
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Time remaining until deadline:</p>
                <p
                  className="text-lg sm:text-xl md:text-2xl font-bold"
                  style={{ color: uiRed }}
                >
                  {timeRemaining}
                </p>
              </div>

              {/* Main prize message under countdown */}
              <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 text-center">
                Choose your treat below! We'll contact you if you win!
              </p>
            </div>
          )}

          {/* Countdown Timer and Rank for Regular Scores */}
          {!isTop3 && (
            <div className="mb-4 sm:mb-6 space-y-3">
              {/* Rank Badge */}
              {overallPosition && (
                <div className="text-center">
                  <div className="inline-block bg-gray-100 border-2 border-gray-400 rounded-full px-4 py-2">
                    <span className="text-base sm:text-lg md:text-xl font-bold text-gray-700">
                      Rank #{overallPosition}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Countdown Timer */}
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 text-center">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Leaderboard closes on January 5th, 2026</p>
                <p className="text-base sm:text-lg md:text-xl font-bold text-gray-700">{timeRemaining}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Initials */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Initials {isTop3 && <span className="text-red-500">*</span>}
              </label>
              <input
                id="player-initials"
                type="text"
                value={playerName}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
                  setPlayerName(value);
                }}
                placeholder="ABC"
                maxLength={3}
                required
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base bg-white border-2 border-gray-300 rounded-lg focus:outline-none text-black"
                disabled={isSaving}
                autoFocus={!isMobile}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Email {isTop3 && <span className="text-red-500">*</span>}
                {!isTop3 && <span className="text-gray-500 text-xs">(optional)</span>}
              </label>
              <input
                id="player-email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="your@email.com"
                required={isTop3}
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base bg-white border-2 border-gray-300 rounded-lg focus:outline-none text-black"
                disabled={isSaving}
              />
              {emailError && (
                <p className="text-red-600 text-xs sm:text-sm mt-1">{emailError}</p>
              )}
            </div>

            {/* Prize Selection (Top 3 only) */}
            {isTop3 && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                  Prize Selection <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="prize-selection"
                      value="consultation"
                      checked={prizeSelection === 'consultation'}
                      onChange={(e) => setPrizeSelection(e.target.value as 'consultation' | 'discount')}
                      className="mr-3 w-4 h-4 sm:w-5 sm:h-5"
                      disabled={isSaving}
                      required
                    />
                    <span className="text-sm sm:text-base text-gray-700">
                      Free Consultation Session with Crackwits
                    </span>
                  </label>
                  <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="prize-selection"
                      value="discount"
                      checked={prizeSelection === 'discount'}
                      onChange={(e) => setPrizeSelection(e.target.value as 'discount' | 'consultation')}
                      className="mr-3 w-4 h-4 sm:w-5 sm:h-5"
                      disabled={isSaving}
                      required
                    />
                    <span className="text-sm sm:text-base text-gray-700">
                      Offer on a New Crackwits Service
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Disclaimer (Top 3 only) */}
            {isTop3 && (
              <p className="text-xs text-gray-500 italic text-center">
                Prize awarded if position maintained until 01/05/2026
              </p>
            )}

            {/* Submit Button */}
            <Button
              id="submit-score-btn"
              type="submit"
              disabled={
                !playerName.trim() || 
                playerName.trim().length < 3 ||
                isSaving ||
                (isTop3 && (!email.trim() || !isValidEmail(email) || !prizeSelection))
              }
              className="w-full py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base md:text-lg rounded-lg font-bold hover:scale-105 active:scale-95 transition-all"
            >
              {isSaving ? 'Saving...' : isTop3 ? 'Claim My Spot!' : 'Save My Score'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

