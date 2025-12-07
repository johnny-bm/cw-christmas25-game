/**
 * Color Configuration
 * 
 * This file defines all colors used throughout the game as tokens.
 * Change a color token once, and it will be applied across all elements that use it.
 * 
 * Structure:
 * - tokens: Base color definitions (the actual color values)
 * - elements: Mapping of game elements to color tokens
 */

export const ColorConfig = {
  // ============================================
  // COLOR TOKENS
  // ============================================
  tokens: {
    // Primary Colors
    white: '#ffffff',
    black: '#312f31',
    
    // Yellow
    yellow: '#ff9c81',
    yellowLight: '#ff9c81', // Orange-yellow for special messages
    yellowUI: '#ff9c81', // Yellow-500 for UI elements
    
    // Red
    red: '#d7586c',
    redDark: '#a95661', // Darker red for projectiles
    redUI: '#d7586c', // Red-600 for UI elements
    
    // Green
    green: '#00a994',
    
    // Blue
    blue: '#4fa7dd',
    
    // Cyan
    cyan: '#00ffff',
    
    // Magenta
    magenta: '#ff00ff',
    
    // Purple
    purple: '#af81b7', // Purple-500 for combo messages
    
    // Gray Scale
    grayLight: '#aaaaaa', // Light gray for regular obstacles
    grayMedium: '#888888', // Medium gray for floating obstacles
    grayDark: '#666666', // Dark gray for negative messages
    grayUI: '#717182', // Gray for UI text
    grayBackground: '#f3f3f5', // Light gray background
    grayBorder: '#e5e7eb', // Gray border
    
    // Orange
    orange: '#ff9c81',
    orangeUI: '#ff9c81', // Orange-500 for UI elements
    
    // Combo Rush (Sprint Mode)
    comboRush: '#F6A288', // Combo Rush background color
    comboRushBar: '#E37B62', // Combo Rush progress bar color
    
    // Special UI Colors
    greenSuccess: '#16a34a', // Green for success states
    greenSuccessLight: '#dcfce7', // Light green background
    
    // Background Elements
    gameBackground: '#EEEDEE', // Game background color
    groundColor: '#DEDCDE', // Ground color
    backgroundBuilding: '#E8E7E8', // Light gray for background buildings
    backgroundCloud: '#e8e8e8', // Slightly darker gray for background clouds
  },

  // ============================================
  // ELEMENT MAPPINGS
  // ============================================
  elements: {
    // Background
    background: 'gameBackground',
    
    // Ground
    ground: 'groundColor',
    
    // Deadline
    deadline: 'black',
    deadlineEdge: 'red',
    
    // Collectibles - Regular (squares)
    collectibleRegular1: 'yellow',
    collectibleRegular2: 'cyan',
    collectibleRegular3: 'magenta',
    
    // Collectibles - Special (circles)
    collectibleSpecial1: 'red',
    collectibleSpecial2: 'green',
    collectibleSpecial3: 'blue',
    
    // Obstacles
    obstacleRegular: 'grayLight',
    obstacleFloating: 'grayMedium',
    obstacleProjectile: 'redDark',
    
    // Message Bubbles
    messageBubbleNormal: 'black',
    messageBubbleNegative: 'grayDark',
    messageBubbleSpecial: 'yellowLight',
    messageTextNormal: 'white',
    messageTextSpecial: 'black',
    messageStrokeNormal: 'black',
    messageStrokeSpecial: 'white',
    
    // Sprint Mode / Combo Rush
    sprintGlow: 'yellow',
    comboRushBackground: 'comboRush',
    comboRushProgressBar: 'comboRushBar',
    
    // Particle Effects
    confettiRed: 'red',
    confettiGreen: 'green',
    confettiBlue: 'blue',
    confettiYellow: 'yellow',
    confettiMagenta: 'magenta',
    confettiCyan: 'cyan',
    explosionRed: 'red',
    explosionGray: 'grayLight',
    explosionGrayDark: 'grayMedium',
    explosionWhite: 'white',
    ringWhite: 'white',
    
    // UI Colors
    uiYellow: 'yellowUI',
    uiRed: 'redUI',
    uiOrange: 'orangeUI',
    uiText: 'black',
    uiTextSecondary: 'grayUI',
    uiBackground: 'white',
    uiBorder: 'grayBorder',
    uiSuccess: 'greenSuccess',
    uiSuccessBackground: 'greenSuccessLight',
    
    // Background Elements
    backgroundBuilding: 'backgroundBuilding',
    backgroundCloud: 'backgroundCloud',
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a color token value by name
 */
export function getColorToken(tokenName: keyof typeof ColorConfig.tokens): string {
  return ColorConfig.tokens[tokenName];
}

/**
 * Get a color for a specific element
 */
export function getElementColor(elementName: keyof typeof ColorConfig.elements): string {
  const tokenName = ColorConfig.elements[elementName] as keyof typeof ColorConfig.tokens;
  return ColorConfig.tokens[tokenName];
}

/**
 * Convert hex color to Phaser 0x format
 * @param hex - Hex color string (e.g., '#ffffff' or 'ffffff')
 * @returns Phaser color number (e.g., 0xffffff)
 */
export function hexToPhaser(hex: string): number {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  return parseInt(cleanHex, 16);
}

/**
 * Get a Phaser color for a specific element
 */
export function getElementColorPhaser(elementName: keyof typeof ColorConfig.elements): number {
  return hexToPhaser(getElementColor(elementName));
}

/**
 * Get a Phaser color token directly
 */
export function getColorTokenPhaser(tokenName: keyof typeof ColorConfig.tokens): number {
  return hexToPhaser(ColorConfig.tokens[tokenName]);
}

// ============================================
// PREDEFINED COLOR ARRAYS
// ============================================

/**
 * Array of regular collectible colors (for random selection)
 */
export const regularCollectibleColors: number[] = [
  getElementColorPhaser('collectibleRegular1'),
  getElementColorPhaser('collectibleRegular2'),
  getElementColorPhaser('collectibleRegular3'),
];

/**
 * Array of special collectible colors (for random selection)
 */
export const specialCollectibleColors: number[] = [
  getElementColorPhaser('collectibleSpecial1'),
  getElementColorPhaser('collectibleSpecial2'),
  getElementColorPhaser('collectibleSpecial3'),
];

/**
 * Array of confetti colors (for special collect effect)
 */
export const confettiColors: number[] = [
  getColorTokenPhaser('red'),
  getColorTokenPhaser('green'),
  getColorTokenPhaser('blue'),
  getColorTokenPhaser('yellow'),
  getColorTokenPhaser('magenta'),
  getColorTokenPhaser('cyan'),
];

/**
 * Array of explosion particle colors
 */
export const explosionColors: number[] = [
  getColorTokenPhaser('red'),
  getColorTokenPhaser('grayLight'),
  getColorTokenPhaser('grayMedium'),
  getColorTokenPhaser('white'),
];

