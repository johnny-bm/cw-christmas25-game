import { useState, useEffect } from 'react';
import { scoreService } from '../lib/scoreService';
import { formatNumber } from '../lib/formatNumber';
import { Confetti } from './Confetti';

interface EndingPopupProps {
  distance: number;
  maxCombo: number;
  grinchScore: number;
  elfScore: number;
  isTop3: boolean;
  position: number | null;
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
  onSave,
  onClose 
}: EndingPopupProps) {
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [prizeSelection, setPrizeSelection] = useState<'consultation' | 'discount' | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [emailError, setEmailError] = useState('');

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
        isTop3 && prizeSelection ? prizeSelection as 'consultation' | 'discount' : undefined
      );
    } catch (error) {
      console.error('Failed to save:', error);
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
    return Math.random() > 0.5 ? "Nice Try!" : "Great Effort!";
  };

  const getBodyMessage = () => {
    if (isTop3) {
      return (
        <>
          <p className="mb-2 sm:mb-3">
            🎉 You've secured a spot in the <strong>TOP 3</strong>!
          </p>
          <p className="mb-2 sm:mb-3">
            Your score: <strong>{formatNumber(distance)}m</strong>
          </p>
          <p className="mb-2 sm:mb-3 text-sm sm:text-base">
            The leaderboard closes on <strong>January 5th, 2026</strong>. If you're still in the 
            top 3 by then, you can claim your prize! Keep an eye on the leaderboard—
            someone might challenge your position.
          </p>
          <p className="text-sm sm:text-base">
            Choose your reward below and we'll contact you if you win!
          </p>
        </>
      );
    }
    return (
      <>
        <p className="mb-2 sm:mb-3">
          Great job escaping The Deadline! Your score shows real determination.
        </p>
        <p className="text-sm sm:text-base">
          Want to try again and beat your best? Every run is a chance to improve!
        </p>
      </>
    );
  };

  const characterImage = isTop3 
    ? "/Assets/Characters/Elf-Happy-Color.svg"
    : "/Assets/Characters/Grinch-Happy.svg";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        id="ending-popup"
        data-popup-type={isTop3 ? 'top3' : 'regular'}
        data-position={position || null}
        className="relative bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300"
      >
        {/* Confetti for top 3 */}
        {isTop3 && <Confetti active={true} />}
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors text-gray-700 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>

        <div className="p-4 sm:p-6 md:p-8">
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
                <div className="inline-block bg-yellow-100 border-2 border-yellow-500 rounded-full px-4 py-2">
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-700">
                    {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'} Rank #{position}
                  </span>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 text-center">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Time remaining until deadline:</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700">{timeRemaining}</p>
              </div>
            </div>
          )}

          {/* Countdown Timer for Regular Scores */}
          {!isTop3 && (
            <div className="mb-4 sm:mb-6">
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
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base bg-white border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none text-black"
                disabled={isSaving}
                autoFocus
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
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base bg-white border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none text-black"
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
                      Discount on New Crackwits Service
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
            <button
              id="submit-score-btn"
              type="submit"
              disabled={
                !playerName.trim() || 
                playerName.trim().length < 3 ||
                isSaving ||
                (isTop3 && (!email.trim() || !isValidEmail(email) || !prizeSelection))
              }
              className="w-full py-2.5 sm:py-3 md:py-3.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold text-sm sm:text-base md:text-lg rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              {isSaving ? 'Saving...' : isTop3 ? 'Claim My Spot!' : 'Save My Score'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

