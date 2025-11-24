# 🏆 Leaderboard System - Complete Guide

## What's Been Added

Your game now has a **fully functional leaderboard system** with these features:

### ✅ Features Implemented

1. **Start Screen Leaderboard**
   - Shows top 10 scores when you launch the game
   - Displays player names and distances
   - Medal icons (🥇🥈🥉) for top 3 players
   - Status badge showing LIVE (Firebase) or LOCAL (browser only)

2. **Game Over Score Submission**
   - Automatically detects if your score makes the top 10
   - Shows a highlighted form to enter your name
   - Saves score with timestamp
   - Success confirmation message

3. **Smart Fallback System**
   - Works immediately with localStorage (no setup required)
   - Automatically uses Firebase when configured
   - Graceful error handling if Firebase is down

4. **Visual Indicators**
   - Connection status badge in bottom-right corner
   - "LIVE" badge when using Firebase (green)
   - "LOCAL" badge when using browser storage (yellow)

## Current State: Firebase Mode

The leaderboard uses **Firebase Firestore**, which means:
- ✅ Scores are shared between all devices/browsers
- ✅ Scores are saved persistently in the cloud
- ✅ Real-time updates across all players
- ✅ Firebase handles all backend infrastructure

## File Structure

```
/lib/
├── firebase.ts              # Firebase client configuration
└── scoreService.ts          # Score saving/loading logic (Firebase + fallback)

/components/
├── Leaderboard.tsx          # Leaderboard display component
└── GameOver.tsx             # Updated with score submission form
```

## Testing

### Test Firebase Mode
1. Play the game and get a score
2. Enter your name when prompted
3. Restart the game
4. You should see your score on the start screen
5. Open the game in a different browser - score should still be there!

## Database Schema

Firebase Firestore collection: `scores`

Each document contains:
- `id` - Auto-generated document ID
- `player_name` - Player's name (max 30 chars in UI)
- `distance` - Meters escaped (integer)
- `max_combo` - Maximum combo achieved (optional)
- `created_at` - ISO timestamp string

## Viewing Scores

### In the Game
- **Start Screen:** Top 10 scores displayed
- **Game Over:** Your rank shown if you make top 10

### In Firebase Console
1. Go to your Firebase project
2. Click "Firestore Database"
3. Select "scores" collection
4. See all scores with timestamps
5. Export data if needed

## Customization

Want to change settings? Edit `/lib/scoreService.ts`:

```typescript
private readonly MAX_SCORES = 10;  // Change to show more/less scores
```

Want different styling? Edit:
- `/components/Leaderboard.tsx` - Start screen display
- `/components/GameOver.tsx` - Score submission form

## Privacy Note

The current setup:
- ✅ Collects only player nicknames (not real names)
- ✅ Does not collect email, IP, or personal data
- ✅ Stores only game scores and timestamps
- ✅ All data is public (anyone can see the leaderboard)

## Troubleshooting

**"No scores yet" on start screen**
- This is normal if nobody has played yet!
- Play a game to add the first score

**Score not saving**
- Check browser console for errors
- Make sure you're entering a name
- Check Firebase connection status

**Scores disappeared**
- If using LOCAL mode: Browser data may have been cleared
- If using Firebase: Check Firebase console

**"LOCAL" badge won't change to "LIVE"**
- Make sure Firebase is properly configured
- Check browser console for Firebase errors

## Next Steps

With Firebase connected, you can:
- 📧 Set up Cloud Functions for notifications
- 📊 Add analytics to track total games played
- 🎯 Create filtered leaderboards (daily, weekly, monthly)
- 🏅 Add achievements and badges
- 💬 Let players add messages with their scores
- 🎨 Customize the leaderboard design

---

**Current Status:** ✅ Leaderboard fully functional with Firebase

Enjoy your game! 🎮🏆
