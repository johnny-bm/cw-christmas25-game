# Vercel Deployment Guide

## Authentication Status

**No user authentication is required.** The app uses:
- **Anonymous/public access** to Supabase
- Players enter 3-letter initials when saving scores
- No login, signup, or user accounts needed

## Pre-Deployment Checklist

### 1. Environment Variables Setup

The app now supports environment variables for Supabase credentials. You have two options:

#### Option A: Use Environment Variables (Recommended for Production)

1. In Vercel Dashboard:
   - Go to your project → **Settings** → **Environment Variables**
   - Add these two variables:
     - `VITE_SUPABASE_URL` = `https://xssagbzhftjgkrcutjtd.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2FnYnpoZnRqZ2tyY3V0anRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDY3NTUsImV4cCI6MjA3ODEyMjc1NX0.-R0nFL7kqyLS5eJZkXq5yn_cV_F24CF-RsozQsuvJXc`

2. The code will automatically use these in production
3. For local development, you can create a `.env` file (already has fallback values)

#### Option B: Keep Hardcoded (Current - Works but not recommended)

The code currently has fallback values hardcoded, so it will work without environment variables, but it's better practice to use env vars.

### 2. Build Configuration

Vercel should auto-detect Vite projects. The build command is:
```bash
npm run build
```

Output directory: `dist`

### 3. Supabase Database Setup

Make sure your Supabase database has:
- ✅ `scores` table created
- ✅ Row Level Security (RLS) enabled
- ✅ Public read/write policies for anonymous users

See `SUPABASE_SETUP.md` for details.

## Deployment Steps

1. **Push to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click **"Add New Project"**
   - Import your repository
   - Vercel will auto-detect Vite settings

3. **Add Environment Variables** (if using Option A)
   - In project settings → Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Make sure they're set for **Production**, **Preview**, and **Development**

4. **Deploy**
   - Click **"Deploy"**
   - Wait for build to complete
   - Your app will be live!

## Post-Deployment Verification

1. ✅ Game loads and plays correctly
2. ✅ Leaderboard displays on start screen
3. ✅ Can save scores after game over
4. ✅ Scores persist (check Supabase dashboard)
5. ✅ Audio works (mute/unmute button)
6. ✅ Responsive on mobile/desktop

## Important Notes

- **No authentication needed** - the app is completely public
- The Supabase `anon` key is safe to expose in client-side code
- All users share the same leaderboard
- Scores are stored in Supabase (or localStorage if Supabase fails)

## Troubleshooting

**Build fails:**
- Check that all dependencies are in `package.json`
- Ensure Node.js version is compatible (Vercel uses Node 18+ by default)

**Scores not saving:**
- Check environment variables are set correctly in Vercel
- Verify Supabase table exists and RLS policies are correct
- Check browser console for errors

**Leaderboard not showing:**
- Verify Supabase connection (check network tab)
- Ensure RLS policies allow public read access

## Security Considerations

- ✅ Using anonymous key (safe for client-side)
- ✅ RLS policies prevent score deletion/updates
- ✅ No sensitive user data collected
- ⚠️ Consider rate limiting if you expect high traffic

