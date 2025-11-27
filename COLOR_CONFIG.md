# Color Configuration Guide

This document explains how to use the centralized color configuration system.

## Overview

All colors used throughout the game are now defined in `game/colorConfig.ts`. This allows you to change a color once, and it will be applied across all elements that use it.

## Structure

The color config has two main parts:

1. **Tokens**: Base color definitions (the actual hex color values)
2. **Elements**: Mapping of game elements to color tokens

## How It Works

### Color Tokens

Color tokens are the base color definitions. For example:

```typescript
tokens: {
  yellow: '#ffff00',
  red: '#ff0000',
  // ... etc
}
```

### Element Mappings

Elements map game features to color tokens:

```typescript
elements: {
  collectibleRegular1: 'yellow',
  deadlineEdge: 'red',
  // ... etc
}
```

This means:
- `collectibleRegular1` uses the `yellow` token
- `deadlineEdge` uses the `red` token

If you change `yellow` from `#ffff00` to `#ffcc00`, all elements using `yellow` (including `collectibleRegular1`) will automatically use the new color.

## Usage

### In Phaser Game Code (GameScene.ts)

For Phaser colors (0x format):

```typescript
import { getElementColorPhaser } from './colorConfig';

// Get color for a specific element
const color = getElementColorPhaser('collectibleRegular1'); // Returns 0xffff00

// Use in Phaser
this.add.rectangle(x, y, width, height, color);
```

### In React Components

For hex strings:

```typescript
import { getElementColor } from './colorConfig';

// Get color for a specific element
const bgColor = getElementColor('background'); // Returns '#ffffff'

// Use in React
<div style={{ backgroundColor: bgColor }} />
```

### Direct Token Access

You can also access tokens directly:

```typescript
import { getColorToken, getColorTokenPhaser } from './colorConfig';

// Get token value (hex string)
const yellow = getColorToken('yellow'); // Returns '#ffff00'

// Get token value (Phaser format)
const yellowPhaser = getColorTokenPhaser('yellow'); // Returns 0xffff00
```

### Predefined Color Arrays

For random color selection:

```typescript
import { 
  regularCollectibleColors,
  specialCollectibleColors,
  confettiColors,
  explosionColors
} from './colorConfig';

// Use in Phaser
const color = Phaser.Math.RND.pick(regularCollectibleColors);
```

## Available Elements

### Game Elements
- `background` - Game background color
- `ground` - Ground color
- `deadline` - The Deadline wall color
- `deadlineEdge` - The Deadline edge color

### Collectibles
- `collectibleRegular1` - Yellow regular collectible
- `collectibleRegular2` - Cyan regular collectible
- `collectibleRegular3` - Magenta regular collectible
- `collectibleSpecial1` - Red special collectible
- `collectibleSpecial2` - Green special collectible
- `collectibleSpecial3` - Blue special collectible

### Obstacles
- `obstacleRegular` - Regular ground obstacles
- `obstacleFloating` - Floating obstacles
- `obstacleProjectile` - Projectile obstacles

### Message Bubbles
- `messageBubbleNormal` - Normal message background
- `messageBubbleNegative` - Negative message background
- `messageBubbleSpecial` - Special message background
- `messageTextNormal` - Normal message text
- `messageTextSpecial` - Special message text
- `messageStrokeNormal` - Normal message stroke
- `messageStrokeSpecial` - Special message stroke

### Effects
- `sprintGlow` - Sprint mode glow color
- `confettiRed`, `confettiGreen`, `confettiBlue`, `confettiYellow`, `confettiMagenta`, `confettiCyan` - Confetti colors
- `explosionRed`, `explosionGray`, `explosionGrayDark`, `explosionWhite` - Explosion particle colors
- `ringWhite` - White ring effect color

### Background Elements
- `backgroundBuilding` - Background building color
- `backgroundCloud` - Background cloud color

### UI Colors
- `uiYellow` - Yellow for UI elements
- `uiRed` - Red for UI elements
- `uiOrange` - Orange for UI elements
- `uiText` - Primary text color
- `uiTextSecondary` - Secondary text color
- `uiBackground` - UI background color
- `uiBorder` - UI border color
- `uiSuccess` - Success state color
- `uiSuccessBackground` - Success background color

## Changing Colors

To change a color across the entire game:

1. Open `game/colorConfig.ts`
2. Find the token you want to change in the `tokens` object
3. Update the hex value
4. All elements using that token will automatically use the new color

### Example: Changing Yellow

To change all yellow colors in the game:

```typescript
// In colorConfig.ts
tokens: {
  yellow: '#ffcc00', // Changed from '#ffff00'
  // ...
}
```

This will update:
- Regular collectible 1
- Sprint mode glow
- Message bubble special glow
- Confetti yellow
- Any other element using the `yellow` token

## Tailwind CSS Classes

For React components using Tailwind CSS, you can reference the color tokens in comments:

```typescript
// Yellow-400 corresponds to uiYellow token
<div className="text-yellow-400">...</div>

// Red-600 corresponds to uiRed token  
<div className="text-red-600">...</div>
```

Note: Tailwind classes are static at build time, so they won't automatically update if you change the color config. For dynamic colors, use inline styles with `getElementColor()`.

## Best Practices

1. **Always use element names** - Use `getElementColor('collectibleRegular1')` instead of directly accessing tokens when possible. This makes it clear what the color is for.

2. **Use predefined arrays** - For random color selection, use the predefined arrays (`regularCollectibleColors`, etc.) instead of creating your own.

3. **Document custom mappings** - If you add new elements, document what they're used for in comments.

4. **Keep tokens semantic** - Token names should describe the color (e.g., `yellow`, `red`), not the usage (e.g., `collectibleColor`).

## Migration Notes

All hardcoded colors in `GameScene.ts` and `Game.tsx` have been migrated to use the color config. If you find any remaining hardcoded colors, please update them to use the color config system.

