# 🎵 Adding Background Music to Escape the Deadline

This guide explains how to add background music to your game using an external URL.

## Quick Setup - Using External URL (Recommended)

### Step 1: Upload Your MP3 File

Since you can't upload to `/public`, upload your MP3 to one of these **free hosting services**:

#### **Option 1: Catbox.moe (Easiest - No Account Needed)** ⭐
1. Go to [catbox.moe](https://catbox.moe)
2. Drag & drop your MP3 file
3. Click "Upload"
4. Copy the direct link (it looks like: `https://files.catbox.moe/xxxxx.mp3`)

#### **Option 2: Dropbox**
1. Upload your file to [Dropbox](https://www.dropbox.com)
2. Click "Share" → "Create link"
3. **Important:** Change the end from `?dl=0` to `?dl=1`
4. Example: `https://www.dropbox.com/s/xxxxx/music.mp3?dl=1`

#### **Option 3: Google Drive**
1. Upload to [Google Drive](https://drive.google.com)
2. Right-click file → "Get link" → Set to "Anyone with the link"
3. Copy the FILE_ID from the URL
4. Use this format: `https://drive.google.com/uc?export=download&id=FILE_ID`

#### **Option 4: GitHub (If You Have a Repo)**
1. Upload to your GitHub repository
2. Click the file → Click "Raw"
3. Copy the URL (looks like: `https://raw.githubusercontent.com/user/repo/main/music.mp3`)

---

### Step 2: Add URL to Code

Open `/game/GameScene.ts` and find the `preload()` method (around line 97).

**Replace `YOUR_MUSIC_URL_HERE` with your actual URL:**

```typescript
// Find this in the preload() method:
// this.load.audio('bgMusic', 'YOUR_MUSIC_URL_HERE');

// Change it to (example with Catbox):
this.load.audio('bgMusic', 'https://files.catbox.moe/abc123.mp3');
```

**Then uncomment the line** by removing the `//` at the start.

That's it! Your music will now play automatically! 🎉

## Music Controls

### Volume Adjustment

To change the volume, edit the `playMusic()` method in `/game/GameScene.ts`:

```typescript
this.bgMusic = this.sound.add('bgMusic', { 
  loop: true, 
  volume: 0.5 // Change this value (0.0 to 1.0)
});
```

- `0.0` = Muted
- `0.5` = 50% volume (default)
- `1.0` = 100% volume

### Adding a Mute Button (Optional)

You can access the game scene from React and call:

```typescript
// Get the game scene
const scene = gameRef.current.scene.getScene('GameScene') as GameScene;

// Toggle music on/off
scene.toggleMusic();

// Check if muted
const isMuted = scene.getMusicMuted();
```

## Recommended Music Formats

- **MP3**: Best browser compatibility
- **OGG**: Good compression, excellent for web
- **WAV**: Large file size, use only for short loops

## File Size Optimization

For web games, keep your music file under 5MB for fast loading:

1. Use **MP3 format** at 128kbps bitrate
2. Consider looping a shorter clip (30-60 seconds)
3. Tools for compression:
   - [Audacity](https://www.audacityteam.org/) (Free)
   - [Online MP3 Compressor](https://www.onlineconverter.com/compress-mp3)

## Troubleshooting

### Music doesn't play?

1. **Check console**: Look for audio loading errors
2. **Verify file path**: Make sure `/public/music.mp3` exists
3. **Browser autoplay policy**: Some browsers block autoplay until user interaction
4. **File format**: Try MP3 if using another format

### Music plays but sounds bad?

- Check your bitrate (128kbps is recommended minimum)
- Ensure the source file is good quality
- Adjust volume in the code (might be too loud/quiet)

## Advanced: Multiple Audio Files

Want different music for different game states? Edit `/game/GameScene.ts`:

```typescript
// In preload()
this.load.audio('menuMusic', '/menu-music.mp3');
this.load.audio('gameMusic', '/game-music.mp3');
this.load.audio('gameoverMusic', '/gameover-music.mp3');

// In your methods
this.sound.play('menuMusic', { loop: true });
this.sound.play('gameMusic', { loop: true });
this.sound.play('gameoverMusic', { loop: false });
```

## Adding Sound Effects

Want jump sounds, collision sounds, etc.?

```typescript
// In preload()
this.load.audio('jumpSound', '/jump.mp3');
this.load.audio('collectSound', '/collect.mp3');
this.load.audio('hitSound', '/hit.mp3');

// In your game methods
this.sound.play('jumpSound'); // One-shot sound effect
this.sound.play('collectSound', { volume: 0.7 });
```

## Music Attribution

Don't forget to credit your music sources! Add attribution to `/Attributions.md`.

### Free Music Resources

- [Pixabay Music](https://pixabay.com/music/)
- [Free Music Archive](https://freemusicarchive.org/)
- [Incompetech](https://incompetech.com/music/royalty-free/)
- [YouTube Audio Library](https://www.youtube.com/audiolibrary)

## Current Implementation

✅ Music system is fully integrated
✅ LocalStorage support for mute preference
✅ Auto-play on game start
✅ Auto-stop on game over
✅ Looping enabled
✅ 50% volume by default

**All you need to do is add your music file and uncomment one line!**