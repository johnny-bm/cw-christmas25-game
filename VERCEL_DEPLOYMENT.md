# Vercel Deployment Guide

## Authentication Status

**No user authentication is required.** The app uses:
- **Firebase Firestore** for score storage
- Players enter 3-letter initials when saving scores
- No login, signup, or user accounts needed

## Pre-Deployment Checklist

### 1. Firebase Configuration

Make sure your Firebase project is set up:
- ✅ Firebase project created
- ✅ Firestore Database enabled
- ✅ `scores` collection will be created automatically on first use
- ✅ Firebase config added to `/lib/firebase.ts`

### 2. Build Configuration

Vercel should auto-detect Vite projects. The build command is:
```bash
npm run build
```

Output directory: `dist`

### 3. Firebase Database Setup

The `scores` collection will be created automatically when the first score is saved. No manual setup needed!

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

3. **Deploy**
   - Click **"Deploy"**
   - Wait for build to complete
   - Your app will be live!

## Post-Deployment Verification

1. ✅ Game loads and plays correctly
2. ✅ Leaderboard displays on start screen
3. ✅ Can save scores after game over
4. ✅ Scores persist (check Firebase console)
5. ✅ Audio works (mute/unmute button)
6. ✅ Responsive on mobile/desktop

## Important Notes

- **No authentication needed** - the app is completely public
- Firebase handles all backend infrastructure
- All users share the same leaderboard
- Scores are stored in Firebase Firestore (with localStorage fallback)

## Troubleshooting

**Build fails:**
- Check that all dependencies are in `package.json`
- Ensure Node.js version is compatible (Vercel uses Node 18+ by default)

**Scores not saving:**
- Check Firebase configuration in `/lib/firebase.ts`
- Verify Firebase project has Firestore enabled
- Check browser console for errors

**Leaderboard not showing:**
- Verify Firebase connection (check network tab)
- Ensure Firestore rules allow read/write access

## Security Considerations

- ✅ Firebase handles authentication and security
- ✅ Firestore security rules can be configured if needed
- ✅ No sensitive user data collected
- ⚠️ Consider rate limiting if you expect high traffic
