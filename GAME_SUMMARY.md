# Escape the Deadline - Game Summary

## Overview
**"Escape the Deadline"** is a responsive endless runner web game developed as a holiday greeting for Crackwits agency. The game serves as both a thank-you to partners/clients and a fun way to announce that Crackwits is signing off for the holidays.

## Theme & Concept
**"We made it through the chaos. Now it's time to outrun The Deadline and take our well-deserved break."**

Players control a marketing agency creative who auto-runs forward, desperately trying to escape "The Deadline" - a menacing black wall chasing from the left - to finally reach their well-deserved holiday break.

**Tagline:** *"Outrun the year. Enter the holidays."*

## Core Gameplay Mechanics

### Basic Controls
- **Jump:** Space bar, Up arrow, or tap/click
- The character automatically runs forward
- Time your jumps to avoid obstacles and collect power-ups

### Energy System
- Players start with 100% energy
- Energy drains at 1% every 0.5 seconds
- Collecting items restores energy (+5% for regular, +20% for special)
- Hitting obstacles reduces energy (-10%)
- The Deadline gets closer as energy drops
- Game ends when energy reaches 0% or The Deadline catches you

### Combo System
- Successfully dodging obstacles builds your combo streak
- **Combo Milestones:**
  - 3x combo: "🔥 3 in a row!"
  - 5x combo: Easter egg message
  - 10x combo: **SPRINT MODE ACTIVATED**
  - Every 5 combos after 10: More easter egg messages
- Hitting an obstacle resets combo to 0

### Sprint Mode (10x Combo Reward)
When you reach a 10x combo streak, you unlock Sprint Mode for 5 seconds:
- **Yellow pulsing glow** around the character
- **Invincibility** - destroy obstacles without taking damage
- **Energy restored** to 100%
- **2x speed** - everything moves twice as fast
- **2x distance accumulation** - progress faster toward freedom
- **Countdown timer** displayed in center of screen

### Distance Tracking
- Primary metric: **Meters Escaped**
- No scoring system - just pure distance
- Distance accumulates based on game speed
- Sprint mode doubles distance accumulation

## Game Elements

### Obstacles
- Gray rectangles of varying heights (40px, 60px, 80px)
- Variable widths (25-60px) for different challenges
- Spawn frequency increases as game speed increases
- Must jump over or activate sprint mode to destroy

### Collectibles

**Regular Collectibles (Squares):**
- Yellow, cyan, and magenta squares
- Restore +5% energy
- Spawn at various heights (ground level to high jump)
- Trigger sparkle particle effects when collected

**Special Collectibles (Circles):**
- Red, green, and blue circles
- Restore +20% energy
- Rarer spawns (8-15 second intervals)
- Trigger confetti explosion effects

## Speech Bubbles & Messages

The game features witty, agency-specific speech bubbles that appear during gameplay:

**Collection Messages:**
- "Creative spark's back!"
- "That's the good stuff."
- "Coffee for the soul."

**Special Collection Messages:**
- "Holiday mode: on."
- "Santa-level energy!"
- "Vacation vibes!"

**Obstacle Hit Messages:**
- "Classic deadline move."
- "Client feedback hit!"
- "Creative crash!"

**Low Energy Warnings:**
- "Running on coffee fumes."
- "Need... holiday... soon."
- "Almost there."

**Critical Energy Messages:**
- "Deadline's too close!"
- "Can't lose now!"
- "Almost on OOO!"

**Easter Egg Messages (Combo Milestones):**
- "Next year, I'm escaping earlier."
- "Ctrl+S my soul."
- "New Year's goal: fewer meetings, more meaning."
- "Creative block? More like creative brick wall."
- "If The Deadline wins, it does my timesheet."

## Visual Design

### Color Scheme
- **Background:** White
- **Ground:** Black (80px height)
- **The Deadline:** Black wall with red edge
- **Character:** Custom sprites with 2-frame running animation
- **Speech Bubbles:** Black background, white border, white text with black stroke

### Typography
- **Pixelify Sans** Google Font used throughout
- Pixel-art aesthetic matches the retro game vibe

### Particle Effects
- **Collision:** Red/gray explosion particles
- **Regular Collection:** Sparkle effect matching collectible color + burst ring
- **Special Collection:** Multi-colored confetti explosion + multiple burst rings
- **Sprint Mode:** Yellow pulsing glow effect

## Technical Stack

- **React** - UI framework
- **TypeScript** - Type-safe development
- **Phaser.js** - Game engine for canvas-based gameplay
- **Tailwind CSS** - Styling and responsive design
- **Figma** - Character sprite imports
- **Google Fonts** - Pixelify Sans typography

## Game Progression

1. **Early Game:** Slower speed, easier obstacle patterns, learning curve
2. **Mid Game:** Speed increases, obstacles spawn more frequently, combos build
3. **Sprint Moments:** 10x combo unlocks powerful sprint mode
4. **Survival:** Managing energy while dodging increasingly difficult obstacles
5. **The Escape:** How many meters can you put between you and The Deadline?

## Purpose & Goals

- **Holiday Announcement:** Creative way to tell clients Crackwits is taking a break
- **Brand Engagement:** Witty agency-specific humor resonates with creative industry
- **Shareable Fun:** Easy to play, challenging to master - encourages sharing
- **Thank You Gift:** Entertaining experience for partners and clients
- **Cultural Commentary:** Relatable creative burnout and deadline pressure themes

## Key Features Summary

✅ **No scoring system** - only distance matters  
✅ **Visible combo counter** (appears at 2x and above)  
✅ **Sprint mode** at 10x combo with special effects  
✅ **Variable obstacle widths** for variety  
✅ **Particle animations** for all interactions  
✅ **Custom character sprites** from Figma  
✅ **Speech bubbles** with agency-specific humor  
✅ **Responsive design** for desktop and mobile  
✅ **Professional polish** - refined UI and copy throughout

---

**Ready to escape The Deadline? Jump, collect, combo, and sprint your way to freedom! 🎮🏃‍♂️💨**
