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
    drainAmount: 0.9,           // Energy lost per drain cycle (challenging but fair)
    drainInterval: 1000,        // Milliseconds between energy drains (faster drain = more challenging)
    jumpCost: 0.8,              // Energy cost per jump (higher cost = skill matters more)
    jumpCostSprint: 0,          // Energy cost per jump during sprint mode (0 = free jumps)
    obstaclePassReward: 4,       // Energy gained when successfully jumping over an obstacle (rewarding but not too generous)
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
        'Collectible-01',
        'Collectible-02',
        'Collectible-03',
        'Collectible-04'
      ] as string[],
      special: [
        // Add collectible names here to make them special (e.g., 'Crown', 'Diamond')
        // Special collectibles use special energy gain and spawn intervals
        // Example: ['Crown', 'Diamond', 'Trophy']
      ] as string[],
    },
    regular: {
      energyGain: 10,            // Energy restored when collecting regular collectible (balanced reward)
      spawnIntervalMin: 1000,    // Minimum milliseconds between spawns (less frequent = more strategic)
      spawnIntervalMax: 3000,    // Maximum milliseconds between spawns (less frequent = more strategic)
    },
    special: {
      energyGain: 20,           // Energy restored when collecting special collectible (valuable but rare)
      spawnIntervalMin: 8000,   // Minimum milliseconds between spawns (rarer = more valuable)
      spawnIntervalMax: 15000,   // Maximum milliseconds between spawns (rarer = more valuable)
    },
  },

  // ============================================
  // OBSTACLES
  // ============================================
  obstacles: {
    regular: {
      damage: 12,               // Energy cost when hitting regular obstacle (more punishing = skill matters)
      spawnIntervalMin: 700,    // Minimum milliseconds between spawns (more frequent = more challenging)
      spawnIntervalMax: 2200,    // Maximum milliseconds between spawns (more frequent = more challenging)
      difficultyRampDistance: 1000, // Distance (meters) to reach full difficulty (gradual ramp - longer = easier start)
    },
    floating: {
      damage: 12,               // Energy cost when hitting floating obstacle (more punishing = skill matters)
      spawnIntervalMin: 1200,   // Minimum milliseconds between spawns (more frequent = more challenging)
      spawnIntervalMax: 3200,   // Maximum milliseconds between spawns (more frequent = more challenging)
      unlockDistance: 3000,      // Distance (meters) before floating obstacles appear (earlier = more challenge)
      difficultyRampDistance: 1000, // Distance (meters) after unlock to reach full difficulty (longer = easier start)
    },
    projectile: {
      damage: 18,               // Energy cost when hitting projectile (high risk = high skill requirement)
      spawnIntervalMin: 1500,   // Minimum milliseconds between spawns (more frequent = more challenging)
      spawnIntervalMax: 4500,   // Maximum milliseconds between spawns (more frequent = more challenging)
      unlockDistance: 2000,      // Distance (meters) before projectile obstacles appear (earlier = more challenge)
      difficultyRampDistance: 1000, // Distance (meters) after unlock to reach full difficulty (longer = easier start)
    },
  },

  // ============================================
  // COMBO SYSTEM
  // ============================================
  combo: {
    sprintThreshold: 8,         // Combo count needed to activate sprint mode (challenging but achievable)
    milestone3: 3,              // Combo count for "3 in a row!" message (early milestone)
    milestone5: 5,              // Combo count for "5 in a row!" message (mid milestone)
    milestone10: 10,            // Combo count for "ON FIRE!" message (elite milestone)
  },

  // ============================================
  // SPRINT MODE
  // ============================================
  sprint: {
    duration: 5500,             // Duration in milliseconds (powerful but not too long)
    speedMultiplier: 2.0,       // Speed multiplier during sprint (2x = double speed)
    distanceMultiplier: 2.0,    // Distance accumulation multiplier during sprint
    energyRestore: 100,         // Energy restored when sprint activates (set to max energy)
  },

  // ============================================
  // GAME SPEED
  // ============================================
  speed: {
    initial: 300,               // Starting game speed
    max: 1000,                   // Maximum game speed
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
    obstacleInitial: 10000,      // Initial obstacle spawn timer (much easier start = very forgiving)
    floatingObstacleInitial: 12000, // Initial floating obstacle spawn timer (much easier start)
    projectileObstacleInitial: 15000, // Initial projectile obstacle spawn timer (much easier start)
    collectibleInitial: 2000,   // Initial collectible spawn timer (balanced rewards)
    specialCollectibleInitial: 5000, // Initial special collectible spawn timer (rarer = more valuable)
  },

  // ============================================
  // PHYSICS
  // ============================================
  physics: {
    baseGravity: 2000,          // Base gravity value (scaled by screen height)
    // RESPONSIVE: 1080 is a reference height for proportional scaling, not a fixed size
    // Game world scales to match actual viewport dimensions via Phaser RESIZE mode
    baseGravityHeight: 1080,    // Reference screen height for gravity scaling
    baseJumpVelocity: -800,      // Base jump velocity (scaled by screen height)
    mobileGravityMultiplier: 0.98, // Gravity multiplier on mobile (0.98 = 2% less)
    mobileJumpMultiplier: 1.15,   // Jump velocity multiplier on mobile (1.15 = 15% stronger for better obstacle clearance)
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

