# Supabase Setup Guide for Escape the Deadline

## Quick Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Enter:
   - **Name:** escape-the-deadline (or your choice)
   - **Database Password:** (create a strong password)
   - **Region:** (choose closest to your location)
5. Click **"Create new project"**
6. Wait ~2 minutes for setup to complete

### 2. Create the Scores Table
1. In your Supabase project dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Copy and paste this SQL:

```sql
-- Create scores table
CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  distance INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_scores_distance ON scores(distance DESC);

-- Enable Row Level Security
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read scores (public leaderboard)
CREATE POLICY "Allow public read access" ON scores
  FOR SELECT
  TO anon
  USING (true);

-- Allow anyone to insert scores
CREATE POLICY "Allow public insert access" ON scores
  FOR INSERT
  TO anon
  WITH CHECK (true);
```

4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

### 3. Get Your API Credentials
1. Click **"Settings"** in the left sidebar
2. Click **"API"**
3. Find and copy these two values:
   - **Project URL** (under "Project URL") - looks like `https://xxxxx.supabase.co`
   - **anon public** key (under "Project API keys") - long string starting with `eyJ...`

### 4. Add Credentials to Your Project

#### Option A: Create .env file (Recommended)
1. Create a file named `.env` in the root of your project (same folder as `package.json`)
2. Add these lines (replace with your actual values):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Save the file
4. **Important:** Add `.env` to your `.gitignore` file if sharing code publicly

#### Option B: Edit /lib/supabase.ts directly (Quick test)
1. Open `/lib/supabase.ts`
2. Replace the first two lines with your values:

```typescript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 5. Test the Connection
1. Restart your development server
2. Open the game
3. Play a game and get a score
4. Enter your name when prompted
5. Check the leaderboard - your score should appear!
6. Go to Supabase → **"Table Editor"** → **"scores"** to see the data

## Verification

### How to know it's working:
- ✅ The leaderboard shows on the start screen
- ✅ After a game, you can enter your name
- ✅ Scores persist even after refreshing the page
- ✅ Scores are visible in Supabase Table Editor

### Troubleshooting:

**"Failed to save score"**
- Check that your credentials are correct
- Make sure you ran the SQL to create the table
- Check browser console for error messages

**Scores only save locally**
- The app falls back to localStorage if Supabase isn't configured
- Check that your `.env` file is in the right location
- Restart your dev server after adding `.env`

**Scores don't persist**
- If using localStorage, scores are per-browser
- To share scores across devices, you must use Supabase

## Database Schema

```
scores table:
├── id (UUID, primary key, auto-generated)
├── player_name (TEXT, required)
├── distance (INTEGER, required)
└── created_at (TIMESTAMP, auto-generated)
```

## Security Notes

- The `anon` key is safe to expose in client-side code
- Row Level Security (RLS) policies control what users can do
- Current setup: Anyone can read and insert scores (perfect for a public leaderboard)
- No one can update or delete existing scores (prevents cheating)

## Next Steps

Once Supabase is connected, you can:
- View all scores in real-time from Supabase dashboard
- Export scores as CSV/JSON
- Add more features like filtering by date
- Set up email notifications for new high scores
- Add analytics

Enjoy your global leaderboard! 🎮🏆
