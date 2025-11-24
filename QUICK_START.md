# Quick Start: Connect to Supabase

Your leaderboard is ready! It currently saves scores locally in your browser. To make it **live** and share scores with everyone:

## Fast Setup (5 minutes)

### 1. Create Supabase Account
- Go to https://supabase.com
- Click "Start your project"
- Sign up (free tier is perfect)

### 2. Create Project
- Click "New Project"
- Name: `escape-the-deadline`
- Set a database password
- Choose a region near you
- Wait ~2 minutes

### 3. Create Database Table
- Go to **SQL Editor** → **New Query**
- Copy/paste this:

```sql
CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  distance INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scores_distance ON scores(distance DESC);

ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON scores
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert access" ON scores
  FOR INSERT TO anon WITH CHECK (true);
```

- Click **Run**

### 4. Get Your Keys
- Go to **Settings** → **API**
- Copy:
  - **Project URL** 
  - **anon public** key

### 5. Add to Your Project

Create a file named `.env` in your project root:

```env
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

**Replace** `your_url_here` and `your_key_here` with your actual values!

### 6. Restart & Test
- Restart your dev server
- Play the game
- Check the leaderboard - it should say **LIVE** instead of **LOCAL**!

---

## Need Help?

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions with screenshots.

## Current Status

- ✅ Leaderboard component created
- ✅ Score saving on game over
- ✅ Automatic fallback to localStorage
- ✅ Ready for Supabase (just add credentials!)

The game works perfectly without Supabase - scores just won't be shared across browsers!
