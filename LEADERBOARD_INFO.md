# 🏆 Leaderboard System - Complete Guide

## What's Been Added

Your game now has a **fully functional leaderboard system** with these features:

### ✅ Features Implemented

1. **Start Screen Leaderboard**
   - Shows top 10 scores when you launch the game
   - Displays player names and distances
   - Medal icons (🥇🥈🥉) for top 3 players
   - Status badge showing LIVE (Supabase) or LOCAL (browser only)

2. **Game Over Score Submission**
   - Automatically detects if your score makes the top 10
   - Shows a highlighted form to enter your name
   - Saves score with timestamp
   - Success confirmation message

3. **Smart Fallback System**
   - Works immediately with localStorage (no setup required)
   - Automatically upgrades to Supabase when configured
   - Graceful error handling if Supabase is down

4. **Visual Indicators**
   - Connection status badge in bottom-right corner
   - "LIVE" badge when using Supabase (green)
   - "LOCAL" badge when using browser storage (yellow)

## Current State: LOCAL MODE

Right now, the leaderboard works using **localStorage**, which means:
- ✅ Works immediately, no setup needed
- ✅ Scores are saved persistently in your browser
- ❌ Scores are NOT shared between devices/browsers
- ❌ Clearing browser data will delete scores

## How to Go LIVE with Supabase

To make the leaderboard **live** and **shared globally**:

### Quick Setup (5 min)
1. Follow **[QUICK_START.md](./QUICK_START.md)** for step-by-step instructions
2. Or see **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** for detailed guide

### What You'll Need
- Free Supabase account (https://supabase.com)
- 2 environment variables (URL + API key)
- 1 SQL query to create the database table

### After Setup
Once configured, the leaderboard will automatically:
- 🌍 Share scores with all players globally
- 💾 Store scores permanently in the cloud
- 📊 Allow you to export/analyze data from Supabase dashboard
- 🔒 Prevent score tampering with database policies

## File Structure

```
/lib/
├── supabase.ts              # Supabase client configuration
├── database.types.ts        # TypeScript types for database
├── scoreService.ts          # Score saving/loading logic (smart fallback)
└── testSupabase.ts          # Connection testing utility

/components/
├── Leaderboard.tsx          # Leaderboard display component
├── GameOver.tsx             # Updated with score submission form
├── StartScreen.tsx          # Updated with leaderboard display
└── SupabaseStatus.tsx       # Connection status indicator

/.env.example                # Template for your credentials
/QUICK_START.md              # 5-minute setup guide
/SUPABASE_SETUP.md           # Detailed setup instructions
```

## Testing

### Test Local Mode (No Setup)
1. Play the game and get a score
2. Enter your name when prompted
3. Restart the game
4. You should see your score on the start screen

### Test Supabase Mode (After Setup)
1. Set up Supabase following QUICK_START.md
2. Restart your dev server
3. Check the bottom-right corner says "Supabase Connected"
4. Play the game and submit a score
5. Go to Supabase dashboard → Table Editor → scores
6. Your score should appear in the database!
7. Open the game in a different browser - score should still be there!

### Debug Supabase Connection
Open browser console and run:
```javascript
import { testSupabaseConnection } from './lib/testSupabase'
testSupabaseConnection()
```

## Database Schema

When you set up Supabase, this table is created:

```sql
scores table:
├── id           UUID          (auto-generated unique ID)
├── player_name  TEXT          (player's name, max 30 chars in UI)
├── distance     INTEGER       (meters escaped)
└── created_at   TIMESTAMP     (when score was saved)
```

### Security Policies
- ✅ Anyone can READ all scores (public leaderboard)
- ✅ Anyone can INSERT new scores (submit after game)
- ❌ Nobody can UPDATE scores (prevent cheating)
- ❌ Nobody can DELETE scores (preserve history)

## Viewing Scores

### In the Game
- **Start Screen:** Top 10 scores displayed
- **Game Over:** Your rank shown if you make top 10

### In Supabase Dashboard
1. Go to your Supabase project
2. Click "Table Editor" 
3. Select "scores" table
4. See all scores with timestamps
5. Export as CSV/JSON if needed

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

**As noted in Figma Make guidelines:** This is not meant for collecting PII or securing sensitive data. It's perfect for a fun holiday game leaderboard!

## Troubleshooting

**"No scores yet" on start screen**
- This is normal if nobody has played yet!
- Play a game to add the first score

**Score not saving**
- Check browser console for errors
- Make sure you're entering a name
- If using Supabase, check connection status

**Scores disappeared**
- If using LOCAL mode: Browser data may have been cleared
- If using LIVE mode: Check Supabase dashboard

**"LOCAL" badge won't change to "LIVE"**
- Make sure .env file exists and has correct values
- Restart your development server
- Check browser console for Supabase errors

## Next Steps

Once Supabase is connected, you can:
- 📧 Set up email notifications for new high scores
- 📊 Add analytics to track total games played
- 🎯 Create filtered leaderboards (daily, weekly, monthly)
- 🏅 Add achievements and badges
- 💬 Let players add messages with their scores
- 🎨 Customize the leaderboard design

---

**Current Status:** ✅ Leaderboard fully functional in LOCAL mode

**To Go Live:** Follow [QUICK_START.md](./QUICK_START.md)

Enjoy your game! 🎮🏆
