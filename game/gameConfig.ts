/**
 * Game Mechanics Configuration
 * 
 * This file contains all the game mechanics values that can be easily adjusted.
 * Modify these values to balance gameplay without touching the game logic.
 */

export const GameConfig = {
  // ============================================
  // ENERGY SYSTEM
  // ============================================
  energy: {
    initial: 100,              // Starting energy (0-100)
    max: 100,                   // Maximum energy (0-100)
    drainAmount: 1,             // Energy lost per drain cycle
    drainInterval: 500,         // Milliseconds between energy drains
    jumpCost: 3,                // Energy cost per jump (normal mode)
    jumpCostSprint: 0,          // Energy cost per jump during sprint mode (0 = free jumps)
    obstaclePassReward: 3,       // Energy gained when successfully jumping over an obstacle
  },

  // ============================================
  // COLLECTIBLES
  // ============================================
  collectibles: {
    // Define which collectible items are regular vs special
    // Items listed here as 'special' will use special energy gain and spawn intervals
    // All other items will be treated as regular collectibles
    types: {
      regular: [
        'Bow and Arrow',
        'Bread',
        'Chicken',
        'Coin',
        'Crown',
        'Diamond',
        'Emerald',
        'Star',
        'Trophy',
        'Yellow Potion'
      ] as string[],
      special: [
        // Add collectible names here to make them special (e.g., 'Crown', 'Diamond')
        // Special collectibles use special energy gain and spawn intervals
        // Example: ['Crown', 'Diamond', 'Trophy']
      ] as string[],
    },
    regular: {
      energyGain: 5,            // Energy restored when collecting regular collectible
      spawnIntervalMin: 1000,    // Minimum milliseconds between spawns
      spawnIntervalMax: 3000,   // Maximum milliseconds between spawns
    },
    special: {
      energyGain: 20,           // Energy restored when collecting special collectible
      spawnIntervalMin: 8000,   // Minimum milliseconds between spawns
      spawnIntervalMax: 15000,  // Maximum milliseconds between spawns
    },
  },

  // ============================================
  // OBSTACLES
  // ============================================
  obstacles: {
    regular: {
      damage: 10,               // Energy cost when hitting regular obstacle
      spawnIntervalMin: 800,    // Minimum milliseconds between spawns
      spawnIntervalMax: 2500,   // Maximum milliseconds between spawns
    },
    floating: {
      damage: 10,              // Energy cost when hitting floating obstacle
      spawnIntervalMin: 1500,   // Minimum milliseconds between spawns
      spawnIntervalMax: 3500,   // Maximum milliseconds between spawns
      unlockDistance: 5000,     // Distance (meters) before floating obstacles appear
    },
    projectile: {
      damage: 15,              // Energy cost when hitting projectile (more than regular)
      spawnIntervalMin: 2000,   // Minimum milliseconds between spawns
      spawnIntervalMax: 5000,   // Maximum milliseconds between spawns
      unlockDistance: 3000,     // Distance (meters) before projectile obstacles appear
    },
  },

  // ============================================
  // COMBO SYSTEM
  // ============================================
  combo: {
    sprintThreshold: 10,        // Combo count needed to activate sprint mode
    milestone3: 3,              // Combo count for "3 in a row!" message
    milestone10: 10,            // Combo count for "ON FIRE!" message
  },

  // ============================================
  // SPRINT MODE
  // ============================================
  sprint: {
    duration: 5000,             // Duration in milliseconds
    speedMultiplier: 2.0,       // Speed multiplier during sprint (2x = double speed)
    distanceMultiplier: 2.0,    // Distance accumulation multiplier during sprint
    energyRestore: 100,         // Energy restored when sprint activates (set to max energy)
  },

  // ============================================
  // GAME SPEED
  // ============================================
  speed: {
    initial: 300,               // Starting game speed
    max: 600,                   // Maximum game speed
    acceleration: 0.5,         // Speed increase per millisecond (when scaled)
    distanceSpeedBonus: 8,      // Speed bonus per 15 meters traveled
    distanceSpeedInterval: 15,  // Meters needed for speed bonus
    distanceSpeedCap: 180,      // Maximum speed bonus from distance
    mobileMultiplier: 1.5,     // Speed multiplier on mobile devices (1.5 = 50% faster)
  },

  // ============================================
  // DEADLINE
  // ============================================
  deadline: {
    distanceMultiplier: 2,      // Multiplier for deadline distance display
    maxDistance: 500,       // Maximum deadline distance in meters (set to Infinity for no cap, or a number like 500 for a cap)
    movementSpeed: 3,           // Deadline movement interpolation speed
    offsetFromPlayer: 500,      // Pixels offset from player position
  },

  // ============================================
  // ENERGY WARNINGS
  // ============================================
  warnings: {
    lowEnergyThreshold: 40,      // Energy level for low energy warning
    criticalEnergyThreshold: 20, // Energy level for critical energy warning
    warningInterval: 3000,      // Milliseconds between warning messages
  },

  // ============================================
  // MESSAGES
  // ============================================
  messages: {
    maxBubbles: 3,              // Maximum message bubbles on screen
    cooldown: 2000,             // Milliseconds cooldown between messages (except special)
    displayDuration: 2500,      // Milliseconds each message is displayed
  },

  // ============================================
  // TIMERS & INTERVALS
  // ============================================
  timers: {
    distanceUpdateInterval: 100, // Milliseconds between distance updates
    obstacleInitial: 1000,      // Initial obstacle spawn timer
    floatingObstacleInitial: 2000, // Initial floating obstacle spawn timer
    projectileObstacleInitial: 3000, // Initial projectile obstacle spawn timer
    collectibleInitial: 2000,   // Initial collectible spawn timer
    specialCollectibleInitial: 5000, // Initial special collectible spawn timer
  },

  // ============================================
  // PHYSICS
  // ============================================
  physics: {
    baseGravity: 2000,          // Base gravity value (scaled by screen height)
    baseGravityHeight: 1080,    // Reference screen height for gravity scaling
    baseJumpVelocity: -800,      // Base jump velocity (scaled by screen height)
    mobileGravityMultiplier: 0.98, // Gravity multiplier on mobile (0.98 = 2% less)
    mobileJumpMultiplier: 1.05,   // Jump velocity multiplier on mobile (1.05 = 5% stronger)
  },

  // ============================================
  // AUDIO
  // ============================================
  audio: {
    musicVolumeDesktop: 0.2,    // Background music volume on desktop
    musicVolumeMobile: 0.3,     // Background music volume on mobile
    musicVolumeGameplayDesktop: 0.5, // Music volume during gameplay on desktop
    musicVolumeGameplayMobile: 0.7,  // Music volume during gameplay on mobile
    soundVolumeDesktop: 0.7,    // Sound effects volume on desktop
    soundVolumeMobile: 0.9,     // Sound effects volume on mobile
    comboVolumeDesktop: 0.8,    // Combo sound volume on desktop
    comboVolumeMobile: 1.0,     // Combo sound volume on mobile
    musicRateNormal: 1.0,       // Normal music playback rate
    musicRateSprint: 1.3,       // Music playback rate during sprint mode
    musicRateMin: 0.75,         // Minimum music playback rate (when energy is low)
    musicRateTransitionSpeed: 0.02, // Speed of music rate transitions
  },

  // ============================================
  // VISUAL EFFECTS
  // ============================================
  effects: {
    vignetteStartEnergy: 80,    // Energy level where vignette starts appearing
    vignetteMaxAlpha: 0.9,      // Maximum vignette opacity (at 0 energy)
    vignetteCurve: 1.8,         // Vignette intensity curve (higher = more dramatic)
    cameraShakeDuration: 150,  // Camera shake duration on obstacle hit (milliseconds)
    cameraShakeIntensity: 0.005, // Camera shake intensity on obstacle hit
    cameraShakeProjectileDuration: 200, // Camera shake duration on projectile hit
    cameraShakeProjectileIntensity: 0.008, // Camera shake intensity on projectile hit
  },
} as const;

