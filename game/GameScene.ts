import Phaser from 'phaser';
import { createCharacterTextures } from './createCharacterTextures';
import { GameConfig } from './gameConfig';
import { 
  getElementColorPhaser, 
  getElementColor,
  getColorTokenPhaser,
  getColorToken,
  regularCollectibleColors,
  specialCollectibleColors,
  confettiColors,
  explosionColors
} from './colorConfig';

// Collectible-specific messages
const COLLECTIBLE_MESSAGES: Record<string, string[]> = {
  'Collectible-01': [ // Sugar Cane
    'Sweet speed boost!',
    'Run like you\'re late for Christmas Eve!',
    'Sugar rush activated'
  ],
  'Collectible-03': [ // Star
    'Star power!',
    'Twinkle twinkle, big turbo!',
    'Shine bright!',
    'A little stardust goes a long way, speed up!',
    'Wish granted: sprint mode unlocked.',
    'North Pole energy acquired.'
  ],
  'Collectible-02': [ // Santa's Hat
    'Ho-ho-go!',
    'Borrowing Santa\'s delivery pace.',
    'Festive fast track!',
    'Santa\'s speed boost!',
    'Holiday spirit detected.'
  ],
  'Collectible-04': [ // Gift
    'Surprise boost!',
    'Bonus unlocked!',
    'Unwrap a speed boost. No receipts needed.',
    'Suprise! Here\'s a little boost!',
    'Consider this your early present, run like you mean it.'
  ]
};

// Fallback messages for collectibles without specific messages
const COLLECT_MESSAGES = [
  'Creative spark\'s back!',
  'That\'s the good stuff.',
  'Fuel for ideas.',
  'Mood: inspired.',
  'Coffee for the soul.'
];

const SPECIAL_COLLECT_MESSAGES = [
  'Holiday mode: on.',
  'That\'s the spirit!',
  'Santa-level energy!',
  'Power trip unlocked.',
  'Vacation vibes!'
];

const HIT_MESSAGES = [
  'Classic deadline move.',
  'Oof. That brief hurt.',
  'Whoops—wrong layer.',
  'Client feedback hit!',
  'Creative crash!'
];

// Ground obstacle-specific messages
const GROUND_OBSTACLE_MESSAGES: Record<string, string[]> = {
  'Obstacle-01': [
    'The Grinch blocked my path. Typical.',
    'Log jam. Deadline endangered.',
    'Tree trap! Someone\'s trying to ruin Christmas.'
  ],
  'Obstacle-02': [
    'The Grinch blocked my path. Typical.',
    'Log jam. Deadline endangered.',
    'Tree trap! Someone\'s trying to ruin Christmas.'
  ]
};

const LOW_ENERGY_MESSAGES = [
  'Running on coffee fumes.',
  'Need… holiday… soon.',
  'Focus slipping.',
  'Almost there.',
  'One more idea…'
];

const CRITICAL_ENERGY_MESSAGES = [
  'Deadline\'s too close!',
  'Save me, Santa!',
  'Can\'t lose now!',
  'So close to freedom.',
  'Almost on OOO!'
];

const EASTER_EGG_MESSAGES = [
  'Next year, I\'m escaping earlier.',
  'Ctrl+S my soul.',
  'New Year\'s goal: fewer meetings, more meaning.',
  'Creative block? More like creative brick wall.',
  '2026 me better appreciate this.',
  'If The Deadline wins, it does my timesheet.'
];

// Combo messages
const COMBO_MESSAGES = [
  'Santa just handed you the express lane. GO.',
  'You\'re sprinting. The Grinch is trembling.',
  'North Pole turbo unlocked, outrun every deadline.',
  'Combo cracked! You\'re faster than Santa on the 24th.',
  'Holiday hyper-speed: engaged. The Grinch can\'t keep up.',
  'Your momentum just got wrapped and delivered.',
  'Elf-powered boost activated.',
  'Combo miracle! Even Santa\'s impressed.',
  'Festive frenzy mode: ON. Deadlines fear you now.',
  'You hit 5. The universe rewards your chaos mastery.',
  'You\'re officially on Santa\'s speed list!',
  '5 collectibles?! Santa just promoted you to Senior Sleigh Driver.',
  'You\'re running so fast the Grinch filed a complaint.',
  'Combo unlocked! Santa said, "Finally, someone useful."',
  'Your speed just made Rudolph insecure.',
  'The elves can\'t keep up!',
  'You hit x10. The Grinch is now questioning his life choices.',
  'Turbo mode: You\'re basically Santa\'s Wi-Fi now.',
  'Combo cracked, HR is drafting your "Elf of the Month" post.',
  'You\'re sprinting. Even Santa\'s beard is blown back.',
  'This speed is illegal in all North Pole districts.',
  'Combo achieved! Make the Grinch rage-quit.',
  'Santa saw your speed and whispered… "Ho-ho-HOLY MOLY!"',
  'Boost activated. You\'re running like the deadline is watching!'
];

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.GameObjects.Group;
  private floatingObstacles!: Phaser.GameObjects.Group;
  private projectileObstacles!: Phaser.GameObjects.Group;
  private collectibles!: Phaser.GameObjects.Group;
  private collectibleImageKeys: string[] = [];
  private obstacleImageKeys: string[] = [];
  private deadline!: Phaser.GameObjects.Image;
  
  private distance: number = 0;
  private energy: number = GameConfig.energy.initial;
  private combo: number = 0;
  private maxCombo: number = 0;
  private grinchScore: number = 0;
  private elfScore: number = 0;
  
  private gameSpeed: number = GameConfig.speed.initial;
  
  private sprintMode: boolean = false;
  private sprintTimer: number = 0;
  private sprintGlow!: Phaser.GameObjects.Rectangle;
  private vignette!: Phaser.GameObjects.Image;
  
  private jumpsRemaining: number = 2;
  
  private isGameStarted: boolean = false;
  private isGameOver: boolean = false;
  private groundY: number = 0;
  private assetsLoaded: boolean = false; // Track if assets are fully loaded
  
  // Helper function to setup character physics body correctly - responsive
  // CRITICAL FIX for Safari Mobile: Ensure body bottom aligns with sprite.y (feet position)
  private setupCharacterBody() {
    if (!this.player || !this.player.body) return;
    
    // Get current sprite dimensions (already scaled) - these are responsive
    const spriteWidth = this.player.displayWidth;
    const spriteHeight = this.player.displayHeight;
    
    // Body size - use actual sprite dimensions with slight reduction for tighter collision
    // This ensures the collision box matches the visual sprite more closely
    const bodyWidth = spriteWidth * 0.85; // 85% of sprite width for tighter collision
    const bodyHeight = spriteHeight * 0.85; // 85% of sprite height for tighter collision
    
    // Set body size - CRITICAL: Use setSize to set both width and height
    this.player.body.setSize(bodyWidth, bodyHeight);
    
    // CRITICAL FIX: Force body size directly - Phaser sometimes doesn't apply setSize correctly
    // Set width and height directly on the body object
    this.player.body.width = bodyWidth;
    this.player.body.height = bodyHeight;
    
    // CRITICAL FIX: Also update the body's size property directly
    // Phaser Arcade Physics uses these properties for collision detection
    if (this.player.body.setSize) {
      this.player.body.setSize(bodyWidth, bodyHeight, false); // false = don't center
    }
    
    // Verify body size was set correctly
    if (Math.abs(this.player.body.width - bodyWidth) > 0.1 || Math.abs(this.player.body.height - bodyHeight) > 0.1) {
      console.warn('⚠️ Body size still incorrect after correction, forcing:', {
        expectedWidth: bodyWidth.toFixed(1),
        actualWidth: this.player.body.width.toFixed(1),
        expectedHeight: bodyHeight.toFixed(1),
        actualHeight: this.player.body.height.toFixed(1),
        forcing: true
      });
      // Force directly - sometimes Phaser's setSize doesn't work
      (this.player.body as any).width = bodyWidth;
      (this.player.body as any).height = bodyHeight;
      (this.player.body as any).halfWidth = bodyWidth / 2;
      (this.player.body as any).halfHeight = bodyHeight / 2;
    }
    
    // CRITICAL FIX: Calculate offset so body bottom aligns with sprite.y (feet position)
    // With origin (0.5, 1), sprite.y is at the bottom center (feet)
    // Body offset is relative to sprite's top-left corner
    // 
    // Sprite origin is at (0.5, 1) = bottom center
    // Sprite top-left corner is at: (sprite.x - spriteWidth/2, sprite.y - spriteHeight)
    // Body is positioned relative to sprite's top-left corner
    // 
    // We want: body bottom = sprite.y (ground surface)
    // Body bottom = sprite top-left Y + offsetY + bodyHeight
    // = (sprite.y - spriteHeight) + offsetY + bodyHeight
    // 
    // Set equal to sprite.y:
    // (sprite.y - spriteHeight) + offsetY + bodyHeight = sprite.y
    // offsetY = spriteHeight - bodyHeight
    
    const offsetX = (spriteWidth - bodyWidth) / 2; // Center horizontally
    const offsetY = spriteHeight - bodyHeight; // Align body bottom with sprite.y (feet)
    
    this.player.body.setOffset(offsetX, offsetY);
    
    // CRITICAL FIX: After setting offset, manually verify and correct body position
    // With origin (0.5, 1), sprite.y is the bottom/feet position
    // Body bottom should align with sprite.y
    // 
    // Sprite top-left Y = sprite.y - spriteHeight
    // Body should be positioned at: sprite top-left Y + offsetY
    // Body bottom = body.y + bodyHeight
    // We want: body bottom = sprite.y
    //
    // So: body.y = (sprite.y - spriteHeight) + offsetY
    // And: body bottom = body.y + bodyHeight = (sprite.y - spriteHeight) + offsetY + bodyHeight
    // Since offsetY = spriteHeight - bodyHeight:
    // body bottom = (sprite.y - spriteHeight) + (spriteHeight - bodyHeight) + bodyHeight = sprite.y ✓
    
    // Calculate correct body position
    const spriteTopLeftY = this.player.y - spriteHeight;
    const correctBodyY = spriteTopLeftY + offsetY;
    
    // Set body position directly to ensure correct alignment
    this.player.body.y = correctBodyY;
    
    // Verify the calculation - use the actual body.height value from Phaser
    const actualBodyHeight = this.player.body.height;
    const actualBodyBottom = this.player.body.y + actualBodyHeight;
    
    // If body height is wrong, fix it
    if (Math.abs(actualBodyHeight - bodyHeight) > 0.1) {
      console.warn('⚠️ Body height is incorrect, fixing:', {
        expected: bodyHeight.toFixed(1),
        actual: actualBodyHeight.toFixed(1),
        correcting: true
      });
      // Force correct body height
      this.player.body.height = bodyHeight;
      // Recalculate body position with correct height
      const correctedBodyY = spriteTopLeftY + offsetY;
      this.player.body.y = correctedBodyY;
    }
    
    // Final verification
    const finalBodyBottom = this.player.body.y + this.player.body.height;
    if (Math.abs(finalBodyBottom - this.player.y) > 0.5) {
      console.warn('⚠️ Body bottom still doesn\'t match sprite.y after correction:', {
        bodyY: this.player.body.y.toFixed(1),
        bodyHeight: this.player.body.height.toFixed(1),
        bodyBottom: finalBodyBottom.toFixed(1),
        spriteY: this.player.y.toFixed(1),
        difference: (finalBodyBottom - this.player.y).toFixed(1),
        correcting: true
      });
      // Last resort: directly set body position to align bottom with sprite.y
      this.player.body.y = this.player.y - this.player.body.height;
    }
    
    // Debug: Log body setup values to verify alignment
    // Use calculated bodyHeight for verification since Phaser might report wrong values
    const verifiedBodyHeight = Math.abs(this.player.body.height - bodyHeight) < 0.1 ? this.player.body.height : bodyHeight;
    const verifiedBodyBottom = this.player.body.y + verifiedBodyHeight;
    
    console.log('=== CHARACTER BODY SETUP ===');
    console.log('Sprite dimensions:', spriteWidth.toFixed(1), 'x', spriteHeight.toFixed(1));
    console.log('Body size (set):', bodyWidth.toFixed(1), 'x', bodyHeight.toFixed(1));
    console.log('Body size (reported):', this.player.body.width.toFixed(1), 'x', this.player.body.height.toFixed(1));
    console.log('Body offset:', offsetX.toFixed(1), offsetY.toFixed(1));
    console.log('Sprite.y (feet/ground):', this.player.y.toFixed(1));
    console.log('Body.y:', this.player.body.y.toFixed(1));
    console.log('Body.height (verified):', verifiedBodyHeight.toFixed(1));
    console.log('Body bottom (verified):', verifiedBodyBottom.toFixed(1));
    console.log('Ground Y:', this.groundY?.toFixed(1) || 'N/A');
    console.log('Match:', Math.abs(verifiedBodyBottom - this.player.y) < 1 ? '✅' : '❌');
    if (Math.abs(this.player.body.height - bodyHeight) > 0.1) {
      console.warn('⚠️ Body height mismatch - using calculated value for verification');
    }
    console.log('======================================');
  }
  
  private deadlineX: number = -100;
  
  private specialCollectibles: Phaser.GameObjects.Arc[] = [];
  private obstaclesPassed: Set<Phaser.GameObjects.Image> = new Set();
  private messageBubbles: Array<{
    container: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
    height: number;
    timer: number;
    id: number;
  }> = [];
  private messageIdCounter: number = 0;
  
  private backgroundBuildings: Phaser.GameObjects.Rectangle[] = [];
  private backgroundClouds: Phaser.GameObjects.Ellipse[] = [];
  
  private lowEnergyMessageTimer: number = 0;
  private energyDrainTimer: number = 0;
  private distanceTimer: number = 0;
  private obstacleTimer: number = GameConfig.timers.obstacleInitial;
  private floatingObstacleTimer: number = GameConfig.timers.floatingObstacleInitial;
  private projectileObstacleTimer: number = GameConfig.timers.projectileObstacleInitial;
  private collectibleTimer: number = GameConfig.timers.collectibleInitial;
  private specialCollectibleTimer: number = GameConfig.timers.specialCollectibleInitial;
  private messageTimer: number = 0; // Cooldown timer for messages
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys; // Cursor keys for jump controls
  private pointerWasDown: boolean = false; // Track previous pointer state for justDown detection
  
  private backgroundMusic!: Phaser.Sound.BaseSound;
  private isMuted: boolean = false;
  private jumpSound!: Phaser.Sound.BaseSound;
  private collectSound!: Phaser.Sound.BaseSound;
  private comboSound!: Phaser.Sound.BaseSound;
  private stumbleSound!: Phaser.Sound.BaseSound;
  private skateboardSound!: Phaser.Sound.BaseSound;
  private currentMusicRate: number = 1.0; // Track current music playback rate

  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    this.scale.on('resize', this.handleResize, this);
  }

  preload() {
    createCharacterTextures(this);
    
    // Load collectible images
    const collectibleFiles = [
      'Collectible-01',
      'Collectible-02',
      'Collectible-03',
      'Collectible-04'
    ];
    
    collectibleFiles.forEach((name) => {
      const key = `collectible-${name.toLowerCase().replace(/\s+/g, '-')}`;
      // Encode spaces in URL path
      const encodedName = encodeURIComponent(name);
      const path = `/Assets/Collectibles/${encodedName}.png`;
      this.load.image(key, path);
      this.collectibleImageKeys.push(key);
    });
    
    // Load obstacle images
    const obstacleFiles = [
      'Obstacle-01',
      'Obstacle-02',
      'Obstacle-03',
      'Obstacle-04'
    ];
    
    obstacleFiles.forEach((name) => {
      const key = `obstacle-${name.toLowerCase().replace(/\s+/g, '-')}`;
      // Encode spaces in URL path
      const encodedName = encodeURIComponent(name);
      const path = `/Assets/Obstacles/${encodedName}.png`;
      this.load.image(key, path);
      this.obstacleImageKeys.push(key);
    });
    
    // Load deadline image
    this.load.image('deadline', '/Assets/Obstacles/Deadline.png');
    
    // Load vignette image
    this.load.image('vignette', '/Assets/Vignet.png');
    
    
    // Load background music - encode spaces in filename
    const musicPath = '/Deck The Halls Christmas Rock.mp3';
    this.load.audio('bgMusic', musicPath);
    
    // Load sound effects
    this.load.audio('jumpSound', '/Jump.wav');
    this.load.audio('collectSound', '/Collect.mp3');
    this.load.audio('comboSound', '/Combo.wav');
    this.load.audio('stumbleSound', '/Stumble.wav');
    this.load.audio('skateboardSound', '/skateboard.mp3');
    
    // Track loading progress
    this.load.on('progress', (progress: number) => {
      this.game.events.emit('loadingProgress', progress);
    });
    
    // Listen for load complete
    this.load.on('complete', () => {
      this.assetsLoaded = true; // Mark assets as loaded
      console.log('✅ All assets loaded, game is ready to start');
      this.game.events.emit('assetsLoaded');
    });
    
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file.key === 'bgMusic') {
        console.error('❌ Failed to load bgMusic:', file.src);
      }
      // Still emit progress even on error to continue
      this.game.events.emit('loadingProgress', this.load.progress);
    });
  }

  create() {
    // Get actual canvas dimensions (no fixed 1920x1080)
    // CRITICAL FIX for Safari Mobile: Ensure dimensions are valid and reasonable
    let { width, height } = this.scale;
    
    // CRITICAL FIX for Safari Mobile: Additional validation
    // Safari mobile sometimes reports incorrect dimensions initially
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isMobile = width <= 768 || height <= 768;
    
    // Validate and correct dimensions if invalid (prevents issues on iPhone Pro Max and Safari)
    if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
      console.warn('⚠️ Invalid game dimensions detected, using fallback:', width, height);
      // RESPONSIVE: 1920x1080 used as fallback reference only, not a fixed size
      // Actual game world will scale to match container dimensions via RESIZE mode
      width = window.innerWidth || 1920;
      height = window.innerHeight || 1080;
      // Force resize to valid dimensions
      this.scale.resize(width, height);
    }
    
    // CRITICAL FIX for Safari Mobile: Ensure minimum dimensions
    // Safari mobile can report very small or very large dimensions
    if (isSafari && isMobile) {
      const minWidth = 300;
      const minHeight = 400;
      const maxWidth = 2000;
      const maxHeight = 2000;
      
      if (width < minWidth || width > maxWidth) {
        console.warn('⚠️ Safari mobile width out of range, adjusting:', width);
        width = Math.max(minWidth, Math.min(maxWidth, width || window.innerWidth || 750));
        this.scale.resize(width, height);
      }
      if (height < minHeight || height > maxHeight) {
        console.warn('⚠️ Safari mobile height out of range, adjusting:', height);
        height = Math.max(minHeight, Math.min(maxHeight, height || window.innerHeight || 402));
        this.scale.resize(width, height);
      }
    }
    
    // Debug: Log final dimensions
    console.log('📐 Final game dimensions:', {
      width: Math.round(width),
      height: Math.round(height),
      aspectRatio: (width / height).toFixed(2),
      isSafari,
      isMobile,
      scaleManager: this.scale.manager?.getParentBounds ? 'available' : 'N/A'
    });

    // Set camera bounds to match actual canvas size
    // With RESIZE mode, the camera automatically shows the full game world (0, 0, width, height)
    // The camera viewport is automatically managed by Phaser's scale manager in RESIZE mode
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setBackgroundColor(getElementColorPhaser('background')); // White background
    
    // CRITICAL FIX for Safari Mobile: Ensure camera shows full world from (0,0) to (width, height)
    // Reset camera scroll to origin to ensure we see the full world from top-left
    // This ensures ground (at bottom) and character are always visible
    this.cameras.main.setScroll(0, 0);
    
    // CRITICAL: Force camera to show the full world - ensure viewport matches game world
    this.cameras.main.setViewport(0, 0, width, height);
    
    // CRITICAL: Ensure camera follows the world properly
    this.cameras.main.setDeadzone(0, 0); // No deadzone - show full world
    
    // Debug: Log camera and world info
    console.log('🎥 Camera setup:', {
      bounds: { x: 0, y: 0, width, height },
      scroll: { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY },
      viewport: { x: 0, y: 0, width, height },
      worldView: { x: this.cameras.main.worldView.x, y: this.cameras.main.worldView.y, width: this.cameras.main.worldView.width, height: this.cameras.main.worldView.height }
    });
    
    // Visual debug: Add corner markers to verify camera viewport
    // Top-left corner (should be visible) - GREEN
    const topLeftMarker = this.add.rectangle(10, 10, 30, 30, 0x00ff00, 1.0);
    topLeftMarker.setDepth(1000);
    topLeftMarker.setOrigin(0, 0);
    // Bottom-right corner (should be visible) - BLUE
    // CRITICAL FIX for Safari: Ensure it's within visible bounds
    const bottomRightX = Math.min(width - 10, width - 1);
    const bottomRightY = Math.min(height - 10, height - 1);
    const bottomRightMarker = this.add.rectangle(bottomRightX, bottomRightY, 30, 30, 0x0000ff, 1.0);
    bottomRightMarker.setDepth(1000);
    bottomRightMarker.setOrigin(1, 1); // Bottom-right origin
    // Center marker - YELLOW
    const centerMarker = this.add.rectangle(width / 2, height / 2, 30, 30, 0xffff00, 1.0);
    centerMarker.setDepth(1000);
    centerMarker.setOrigin(0.5, 0.5);
    
    console.log('📍 Debug markers positioned:', {
      topLeft: { x: 10, y: 10 },
      center: { x: width / 2, y: height / 2 },
      bottomRight: { x: bottomRightX, y: bottomRightY },
      viewport: { width, height }
    });
    
    // Set physics world bounds to match canvas size
    this.physics.world.setBounds(0, 0, width, height);
    
    // Configure physics for smooth, consistent updates
    this.physics.world.timeScale = 1.0; // Normal time scale for consistent physics
    
    // Scale gravity relative to screen height for responsive jump physics
    // Reduced gravity for lighter, more responsive feel
    // Note: isMobile is already declared above
    const mobileGravityMultiplier = isMobile ? GameConfig.physics.mobileGravityMultiplier : 1.0;
    // Use slightly lower base gravity (2200 instead of 2000) for better jump feel
    const baseGravity = 2200;
    const scaledGravity = baseGravity * (height / GameConfig.physics.baseGravityHeight) * mobileGravityMultiplier;
    this.physics.world.gravity.y = scaledGravity;

    // White game background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, getElementColorPhaser('background'));
    bg.setDepth(-100);

    // Parallax background
    this.createParallaxBackground();

    // Ground setup - responsive to aspect ratio
    // CRITICAL FIX for Safari Mobile: Ensure ground is always within visible bounds
    // Special handling for short viewports (like 750x402) where height is very limited
    // Note: isSafari is already declared above
    const aspectRatio = width / height;
    const isIPhoneProMax = /iPhone/.test(navigator.userAgent) && (window.screen.height >= 926 || window.screen.width >= 926);
    const isShortViewport = height < 500; // CRITICAL: Detect very short viewports (like 402px height)
    
    // CRITICAL FIX: For very short viewports, use moderate ground ratio
    // Reduced from 30% to 20% for better proportions
    let groundHeightRatio = 0.15; // Default 15%
    
    if (isShortViewport) {
      // Very short viewport (height < 500px) - use moderate ground ratio
      // Reduced from 30% to 20% for better proportions
      if (aspectRatio > 1.8) {
        groundHeightRatio = 0.20; // 20% for wide + short viewports (reduced from 30%)
      } else {
        groundHeightRatio = 0.18; // 18% for short viewports (reduced from 25%)
      }
    } else if (aspectRatio > 2.2) {
      groundHeightRatio = (isSafari || isIPhoneProMax) ? 0.24 : 0.22; // 24% on Safari/Pro Max, 22% otherwise
    } else if (aspectRatio > 1.8) {
      groundHeightRatio = (isSafari || isIPhoneProMax) ? 0.20 : 0.18; // 20% on Safari/Pro Max, 18% otherwise
    } else if (isSafari || isIPhoneProMax) {
      groundHeightRatio = 0.17; // 17% on Safari/Pro Max for normal screens
    }
    
    const groundHeight = height * groundHeightRatio; // Scale proportionally
    this.groundY = height - groundHeight; // Ground top edge at this Y position
    
    // CRITICAL: Ensure groundY is within valid bounds (0 to height)
    // This prevents ground from being positioned off-screen on iPhone Pro Max
    if (this.groundY < 0) {
      console.warn('⚠️ Ground Y position is negative, adjusting:', this.groundY);
      this.groundY = Math.max(0, height * 0.85); // Ensure ground is at least 15% from bottom
    }
    if (this.groundY >= height) {
      console.warn('⚠️ Ground Y position exceeds height, adjusting:', this.groundY, height);
      this.groundY = height * 0.85; // Ensure ground is at least 15% from bottom
    }
    
    // Debug: Log ground positioning
    console.log('🌍 Ground setup:', {
      width,
      height,
      aspectRatio: (width / height).toFixed(2),
      isShortViewport,
      groundHeightRatio: (groundHeightRatio * 100).toFixed(1) + '%',
      groundHeight: Math.round(groundHeight),
      groundY: Math.round(this.groundY),
      groundBottom: Math.round(this.groundY + groundHeight)
    });
    const groundWidth = width * 3;
    
    this.ground = this.physics.add.staticGroup();
    
    // Create ground rectangle at groundY
    // CRITICAL: Make ground highly visible for debugging - use bright color
    // Use a more visible color for debugging (darker gray with higher opacity)
    const groundColor = 0x888888; // Bright gray for visibility
    const groundRect = this.add.rectangle(0, this.groundY, groundWidth, groundHeight, groundColor, 1.0);
    groundRect.setDepth(10); // Ground depth - character (20) will render above
    groundRect.setOrigin(0, 0); // Top-left origin
    
    // Debug: Add a visible border to ground for testing (can remove later)
    // This helps verify ground is positioned correctly - make it more visible
    const groundDebug = this.add.rectangle(width / 2, this.groundY + groundHeight / 2, groundWidth, groundHeight, 0xff0000, 0.5);
    groundDebug.setDepth(9);
    groundDebug.setOrigin(0.5, 0.5);
    
    // Ground surface line will be created after character positioning to ensure correct position
    
    // Add physics body and configure it
    this.physics.add.existing(groundRect, true);
    if (groundRect.body) {
      const body = groundRect.body as Phaser.Physics.Arcade.StaticBody;
      // Body matches sprite exactly - full width and height
      body.setSize(groundWidth, groundHeight);
      body.setOffset(0, 0); // No offset with (0,0) origin
      
      // CRITICAL FIX: Explicitly set body position to match ground surface
      // The ground's top surface is at groundY, so body.y should be at groundY
      // Phaser may calculate body position differently, so we force it here
      body.x = 0; // Ground starts at x=0
      body.y = this.groundY; // Ground top surface is at groundY
      
      // Static bodies are immovable by default in Phaser - no need to call setImmovable()
      // Static bodies cannot be moved by physics interactions
      
      console.log('🌍 Ground body positioned:', {
        bodyX: body.x,
        bodyY: body.y,
        bodyWidth: body.width,
        bodyHeight: body.height,
        bodyBottom: body.y + body.height,
        groundY: this.groundY,
        spriteY: groundRect.y,
        match: Math.abs(body.y - this.groundY) < 1 ? '✅' : '❌'
      });
    }
    this.ground.add(groundRect);

    // Character setup with square bounding box - responsive
    // CRITICAL FIX for short viewports: Reduce character size if viewport is very short
    const isMobilePlayer = width <= 768 || height <= 768;
    // Note: isShortViewport is already declared above in ground setup section
    
    // For short viewports, use smaller character to ensure it fits above ground
    let characterHeightRatio = isMobilePlayer ? 0.198 : 0.15; // 19.8% on mobile (10% bigger), 15% on desktop
    if (isShortViewport) {
      // Reduce character size for short viewports to ensure it fits
      characterHeightRatio = isMobilePlayer ? 0.15 : 0.12; // Smaller on short viewports
    }
    
    const targetHeight = height * characterHeightRatio;
    const scale = targetHeight / 160;
    
    // CRITICAL: Check if texture exists before creating sprite
    if (!this.textures.exists('character-pushing-01')) {
      console.error('❌ CRITICAL: Character texture "character-pushing-01" does not exist!');
      console.log('Available textures:', Object.keys(this.textures.list));
      // Create a placeholder rectangle so we can see something
      const placeholder = this.add.rectangle(width * 0.25, height * 0.5, 40, 60, 0xff0000, 1.0);
      placeholder.setDepth(20);
      console.warn('⚠️ Created red placeholder rectangle at center - character texture missing!');
    }
    
    this.player = this.physics.add.sprite(width * 0.25, 0, 'character-pushing-01');
    this.player.setDepth(20);
    this.player.setScale(scale);
    this.player.setVisible(true); // CRITICAL: Ensure character is visible
    this.player.setAlpha(1.0); // CRITICAL: Ensure character is fully opaque
    
    // Set origin to BOTTOM CENTER (0.5, 1) - sprite.y will be the bottom
    this.player.setOrigin(0.5, 1);
    
    // Position sprite at ground level - CRITICAL FIX for Safari Mobile
    // With origin (0.5, 1), sprite.y is the bottom/feet position
    // Ground is at groundY (top of ground rectangle), so character feet should be AT groundY
    // But we need to ensure the physics body bottom aligns with ground surface
    const playerX = width * 0.25; // 25% from left edge
    
    // CRITICAL: Position character so feet are ON the ground surface (at groundY)
    // The ground's top surface is at groundY, so character feet should be at groundY
    // Use groundY directly (not safeGroundY) to ensure character is on the ground
    this.player.setPosition(playerX, this.groundY);
    
    // Setup physics body BEFORE setting physics properties to ensure proper alignment
    this.setupCharacterBody();
    
    // Debug: Log character positioning
    console.log('👤 Character setup:', {
      playerX: Math.round(playerX),
      playerY: Math.round(this.groundY),
      characterHeight: Math.round(targetHeight),
      characterTop: Math.round(this.groundY - targetHeight),
      groundY: Math.round(this.groundY),
      worldHeight: height
    });
    
    // CRITICAL FIX for iPhone Pro Max: Ensure player is fully visible
    // Verify character fits in visible area and adjust if necessary
    const playerHeight = this.player.displayHeight || targetHeight;
    const playerTopY = this.groundY - playerHeight; // Top of character sprite
    
    if (playerTopY < 0) {
      // Character would be cut off at top - adjust ground position or character scale
      console.warn('⚠️ Character would be cut off at top, adjusting:', {
        groundY: this.groundY,
        playerHeight: playerHeight,
        playerTopY: playerTopY,
        screenHeight: height
      });
      
      // Option 1: Move ground down slightly (reduce ground height ratio)
      const minGroundY = playerHeight + 10; // Leave 10px margin at top
      if (minGroundY < height * 0.9) {
        // Only adjust if it doesn't make ground too small
        this.groundY = minGroundY;
        // Update ground position
        const groundRect = this.ground.getChildren()[0] as Phaser.GameObjects.Rectangle;
        if (groundRect) {
          const newGroundHeight = height - this.groundY;
          groundRect.setPosition(0, this.groundY);
          groundRect.setSize(width * 3, newGroundHeight);
          if (groundRect.body) {
            const body = groundRect.body as Phaser.Physics.Arcade.StaticBody;
            body.setSize(width * 3, newGroundHeight);
            // CRITICAL: Update body position to match new groundY
            body.x = 0;
            body.y = this.groundY;
          }
        }
        // Reposition player at new ground level
        this.player.setPosition(playerX, this.groundY);
      } else {
        // Option 2: Reduce character scale if ground adjustment isn't possible
        const maxPlayerHeight = height * 0.8; // Max 80% of screen height
        const adjustedScale = (maxPlayerHeight / 160);
        this.player.setScale(adjustedScale);
        console.warn('⚠️ Reduced character scale to fit screen:', adjustedScale);
      }
    }
    
    // Debug: Log positioning values to verify correct setup
    const groundRectDebug = this.ground.getChildren()[0] as Phaser.GameObjects.Rectangle;
    if (groundRectDebug && this.player.body) {
      console.log('=== GROUND & CHARACTER POSITIONING DEBUG (create) ===');
      console.log('Screen height:', height);
      console.log('Ground height:', groundHeight);
      console.log('groundY (top surface):', this.groundY);
      console.log('Ground body.y:', groundRectDebug.body ? (groundRectDebug.body as Phaser.Physics.Arcade.StaticBody).y : 'N/A');
      console.log('Character sprite.y (feet position):', this.player.y);
      console.log('Character body.y:', this.player.body.y);
      console.log('Character body.height:', this.player.body.height);
      console.log('Character body bottom (body.y + body.height):', this.player.body.y + this.player.body.height);
      console.log('Expected: sprite.y = body bottom = groundY =', this.groundY);
      console.log('==================================================');
    }
    
    // Physics properties - normal gravity on mobile to prevent floating feeling
    const mobileGravityReduction = isMobilePlayer ? 0.98 : 1.0; // Slight reduction on mobile (2% less)
    const playerBaseGravity = 2200;
    const playerScaledGravity = playerBaseGravity * (height / GameConfig.physics.baseGravityHeight) * mobileGravityReduction;
    this.player.body.setGravityY(playerScaledGravity);
    this.player.body.setBounce(0, 0);
    this.player.body.setCollideWorldBounds(false);
    this.player.body.setAllowGravity(true);
    this.player.body.setMaxVelocityY(1400);
    this.player.body.setDrag(200, 0);
    
    // CRITICAL: Reset velocity to 0 to prevent character from falling through ground
    this.player.body.setVelocity(0, 0);
    
    // CRITICAL FIX for Safari Mobile: Re-setup body after all physics properties are set
    // This ensures body is properly aligned with sprite position
    this.setupCharacterBody();
    
    // Add collider - this is a COLLIDER (not overlap), so it will prevent penetration
    // Arcade Physics will automatically keep player on top of ground
    // The collider handles collision response, preventing character from sinking
    this.physics.add.collider(this.player, this.ground);
    
    // CRITICAL: Final position adjustment - ensure character is exactly on ground surface
    // Position character so physics body bottom aligns with ground top surface
    // CRITICAL FIX for Safari Mobile: Validate groundY is within visible bounds
    if (this.groundY < 0 || this.groundY >= height) {
      console.error('❌ CRITICAL: groundY is out of bounds!', {
        groundY: this.groundY,
        height: height,
        adjusting: true
      });
      // Force groundY to be within bounds
      this.groundY = Math.max(10, Math.min(height - 50, this.groundY));
      // Update ground position
      const groundRect = this.ground.getChildren()[0] as Phaser.GameObjects.Rectangle;
      if (groundRect) {
        const newGroundHeight = height - this.groundY;
        groundRect.setPosition(0, this.groundY);
        groundRect.setSize(width * 3, newGroundHeight);
        if (groundRect.body) {
          const body = groundRect.body as Phaser.Physics.Arcade.StaticBody;
          body.setSize(width * 3, newGroundHeight);
          body.x = 0;
          body.y = this.groundY;
        }
      }
    }
    
    // CRITICAL: Ensure character is positioned ON the ground surface
    // The ground surface is at groundY, so character feet (sprite.y with origin 0.5, 1) should be at groundY
    // Don't use safeGroundY - use groundY directly to ensure character is on the ground
    this.player.setPosition(playerX, this.groundY);
    
    // CRITICAL FIX for Safari Mobile: Force body bottom to align with ground surface
    // After setting up the body, manually verify and correct body position
    if (this.player.body) {
      // Calculate where body bottom should be (at sprite.y / groundY)
      // The body bottom should align with groundY (the ground surface)
      const expectedBodyBottom = this.groundY;
      const currentBodyBottom = this.player.body.y + this.player.body.height;
      
      // If body bottom doesn't match groundY, adjust body position
      if (Math.abs(currentBodyBottom - expectedBodyBottom) > 0.5) {
        const adjustment = expectedBodyBottom - currentBodyBottom;
        // Move body up/down to align bottom with ground
        this.player.body.y += adjustment;
        console.log('🔧 Adjusted character body Y by', adjustment.toFixed(1), 'to align bottom with ground');
      }
      
      // CRITICAL: Also ensure sprite position matches (in case body moved)
      // The sprite should be at groundY with origin (0.5, 1) - feet on ground surface
      if (Math.abs(this.player.y - this.groundY) > 0.5) {
        this.player.setPosition(playerX, this.groundY);
        // Re-setup body after repositioning
        this.setupCharacterBody();
        // Re-adjust body if needed
        const newBodyBottom = this.player.body.y + this.player.body.height;
        if (Math.abs(newBodyBottom - this.groundY) > 0.5) {
          this.player.body.y += (this.groundY - newBodyBottom);
        }
      }
      
      // CRITICAL FIX for Safari Mobile: Final validation - ensure character is visible
      const characterTop = this.player.y - this.player.displayHeight;
      const characterBottom = this.player.y;
      if (characterTop < 0 || characterBottom > height) {
        console.error('❌ CRITICAL: Character is outside visible bounds!', {
          characterTop: characterTop.toFixed(1),
          characterBottom: characterBottom.toFixed(1),
          characterY: this.player.y.toFixed(1),
          height: height,
          groundY: this.groundY.toFixed(1),
          adjusting: true
        });
        // Force character to be visible - but keep it on the ground
        // Only adjust if character would be cut off, but keep feet on ground
        const minY = this.player.displayHeight + 10;
        const maxY = height - 10;
        if (this.groundY < minY) {
          // Ground is too high, move it down
          this.groundY = minY;
          // Update ground position
          const groundRect = this.ground.getChildren()[0] as Phaser.GameObjects.Rectangle;
          if (groundRect) {
            const newGroundHeight = height - this.groundY;
            groundRect.setPosition(0, this.groundY);
            groundRect.setSize(width * 3, newGroundHeight);
            if (groundRect.body) {
              const body = groundRect.body as Phaser.Physics.Arcade.StaticBody;
              body.setSize(width * 3, newGroundHeight);
              body.x = 0;
              body.y = this.groundY;
            }
          }
        }
        this.player.setPosition(playerX, this.groundY);
        this.setupCharacterBody();
      }
      
      // Visual debug: Show character body outline (green = body, yellow = ground surface)
      const bodyDebug = this.add.rectangle(
        this.player.body.x + this.player.body.width / 2,
        this.player.body.y + this.player.body.height / 2,
        this.player.body.width,
        this.player.body.height,
        0x00ff00,
        0.4
      );
      bodyDebug.setDepth(1001);
      bodyDebug.setOrigin(0.5, 0.5);
      
      // Show ground surface line (yellow) - this is where character feet should be
      // This line shows where the ground surface is - character feet should be at this line
      const groundSurfaceLine = this.add.line(
        0, this.groundY, 
        0, this.groundY, 
        width, this.groundY,
        0xffff00, 1.0 // Bright yellow line
      );
      groundSurfaceLine.setDepth(1001);
      groundSurfaceLine.setLineWidth(4);
      
      // Show body bottom line (cyan) - should align with yellow line
      const bodyBottomLine = this.add.line(
        0, this.player.body.y + this.player.body.height,
        0, this.player.body.y + this.player.body.height,
        width, this.player.body.y + this.player.body.height,
        0x00ffff, 1
      );
      bodyBottomLine.setDepth(1001);
      bodyBottomLine.setLineWidth(2);
    }

    // Setup animation
    if (this.textures.exists('character-pushing-01') && this.textures.exists('character-ollie-01')) {
      this.setupCharacterAnimation();
    } else {
      console.error('❌ CRITICAL: Character textures not loaded!', {
        pushingExists: this.textures.exists('character-pushing-01'),
        ollieExists: this.textures.exists('character-ollie-01'),
        allTextures: Object.keys(this.textures.list)
      });
      // Try to set a fallback texture or create a placeholder
      if (!this.textures.exists('character-pushing-01')) {
        console.warn('⚠️ Creating placeholder for character texture');
        // Create a simple colored rectangle as placeholder
        this.add.graphics()
          .fillStyle(0xff0000, 1)
          .fillRect(playerX - 20, this.groundY - 40, 40, 40)
          .setDepth(20);
      }
    }
    
    // CRITICAL: Verify character is visible and positioned correctly
    console.log('✅ Character creation complete:', {
      playerExists: !!this.player,
      playerX: this.player?.x?.toFixed(1),
      playerY: this.player?.y?.toFixed(1),
      playerVisible: this.player?.visible,
      playerAlpha: this.player?.alpha,
      playerScale: this.player?.scaleX,
      groundY: this.groundY.toFixed(1),
      screenHeight: height,
      textureExists: this.textures.exists('character-pushing-01')
    });

    // Sprint glow effect - scale relative to player size
    const glowWidth = 60 * scale;
    const glowHeight = 80 * scale;
    this.sprintGlow = this.add.rectangle(
      this.player.x, 
      this.player.y, 
      glowWidth, 
      glowHeight, 
      getElementColorPhaser('sprintGlow'),
      0
    );
    this.sprintGlow.setDepth(19);

    // Create deadline using image asset - positioned at far left, will move right as energy decreases
    // Start at far left (negative position off-screen) - will be repositioned after scaling
    this.deadline = this.add.image(0, height * 0.1, 'deadline');
    this.deadline.setOrigin(0, 0); // Top-left aligned
    this.deadline.setDepth(1);
    // Scale deadline to full screen height (preserve aspect ratio)
    if (this.deadline.texture && this.deadline.texture.source) {
      const frame = this.deadline.frame;
      const aspectRatio = frame.width / frame.height;
      // Always use full height
      const deadlineHeight = height;
      const deadlineWidth = deadlineHeight * aspectRatio;
      this.deadline.setDisplaySize(deadlineWidth, deadlineHeight);
      // Position deadline far left (off-screen) after scaling
      this.deadline.setPosition(-this.deadline.displayWidth - 200, 0);
      this.deadlineX = this.deadline.x;
    }
    

    // Create vignette effect using PNG image (starts invisible, will be shown when energy is low)
    if (this.textures.exists('vignette')) {
      this.vignette = this.add.image(width / 2, height / 2, 'vignette');
      // Scale to cover entire screen (use larger dimension to ensure full coverage)
      const maxDimension = Math.max(width, height);
      this.vignette.setDisplaySize(maxDimension, maxDimension); // Scale to cover screen
      this.vignette.setOrigin(0.5, 0.5);
      this.vignette.setDepth(9999); // Maximum depth to ensure it's above all game elements (UI is rendered separately in React)
      this.vignette.setAlpha(0); // Start invisible
      // Use NORMAL blend mode (MULTIPLY was making it too dark/invisible)
      this.vignette.setBlendMode(Phaser.BlendModes.NORMAL);
    } else {
      console.warn('⚠️ Vignette texture not found - image may not have loaded');
      console.warn('⚠️ Available textures:', Object.keys(this.textures.list));
    }

    // Initialize groups
    this.obstacles = this.add.group();
    this.floatingObstacles = this.add.group();
    this.projectileObstacles = this.add.group();
    this.collectibles = this.add.group();

    // Input setup
    this.input.keyboard!.on('keydown-SPACE', () => this.jump());
    this.input.keyboard!.on('keydown-UP', () => this.jump());
    this.input.on('pointerdown', () => this.jump());
    
    // Create cursors for jump controls in update()
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Initialize all sounds
    try {
      // Ensure Web Audio API is being used (better mobile support)
      // Note: iOS Safari still respects silent mode switch, but Web Audio gives us more control
      const audioContext = this.getAudioContext();
      if (audioContext && audioContext.state === 'suspended') {
        // Try to resume audio context immediately
        audioContext.resume().catch((err) => {
          console.warn('⚠️ Could not resume audio context:', err);
        });
      }
      
      // Initialize background music - start playing immediately at low volume
      // Higher volume on mobile for better audibility
      const isMobile = width <= 768 || height <= 768;
      const musicVolume = isMobile ? GameConfig.audio.musicVolumeMobile : GameConfig.audio.musicVolumeDesktop;
      if (this.cache.audio.exists('bgMusic')) {
        this.backgroundMusic = this.sound.add('bgMusic', { 
          loop: true, 
          volume: musicVolume,
          // Use Web Audio API explicitly
          detune: 0,
          rate: 1.0
        });
      } else {
        this.backgroundMusic = this.sound.add('bgMusic', { 
          loop: true, 
          volume: musicVolume,
          detune: 0,
          rate: 1.0
        });
      }
      
      // Initialize sound effects - increased volumes for better audibility, especially on mobile
      try {
        // Detect mobile for higher volume
        const isMobile = width <= 768 || height <= 768;
        const soundVolume = isMobile ? GameConfig.audio.soundVolumeMobile : GameConfig.audio.soundVolumeDesktop;
        const comboVolume = isMobile ? GameConfig.audio.comboVolumeMobile : GameConfig.audio.comboVolumeDesktop;
        
        // Use Web Audio API explicitly for all sounds
        const soundConfig = { 
          detune: 0,
          rate: 1.0
        };
        
        this.jumpSound = this.sound.add('jumpSound', { volume: soundVolume, ...soundConfig });
        this.collectSound = this.sound.add('collectSound', { volume: soundVolume, ...soundConfig });
        this.comboSound = this.sound.add('comboSound', { volume: comboVolume, ...soundConfig });
        this.stumbleSound = this.sound.add('stumbleSound', { volume: soundVolume, ...soundConfig });
        this.skateboardSound = this.sound.add('skateboardSound', { volume: soundVolume, loop: true, rate: 1.2, ...soundConfig });
      } catch (error) {
        console.warn('⚠️ Some sound effects may not be loaded yet:', error);
      }
    } catch (error) {
      console.error('❌ Failed to initialize sounds:', error);
    }
    
    // Load mute state from localStorage
    const savedMuteState = localStorage.getItem('escapeTheDeadline_muted');
    if (savedMuteState === 'true') {
      this.isMuted = true;
      this.sound.mute = true;
    }
    
    // Unlock audio on first user interaction and start music
    // Mobile browsers require user interaction to play audio
    const unlockAndStartAudio = () => {
      if (this.sound.locked) {
        this.sound.unlock();
      }
      
      // Ensure audio context is resumed (required for mobile)
      const audioContext = this.getAudioContext();
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch((err) => {
          console.warn('⚠️ Failed to resume audio context:', err);
        });
      }
      
      // Start music after unlock
      if (this.backgroundMusic && !this.backgroundMusic.isPlaying && !this.isMuted) {
        try {
          this.backgroundMusic.play();
        } catch (error) {
          console.warn('⚠️ Failed to play music:', error);
        }
      }
    };
    
    if (this.sound.locked) {
      // Listen for multiple interaction types for better mobile support
      const unlockAudio = (e: Event) => {
        e.preventDefault();
        unlockAndStartAudio();
        // Remove listeners after first interaction
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('touchend', unlockAudio);
        document.removeEventListener('pointerdown', unlockAudio);
      };
      
      // Use more aggressive mobile audio unlocking
      document.addEventListener('click', unlockAudio, { once: true });
      document.addEventListener('touchstart', unlockAudio, { once: true, passive: false });
      document.addEventListener('touchend', unlockAudio, { once: true });
      document.addEventListener('pointerdown', unlockAudio, { once: true });
      this.input.once('pointerdown', unlockAndStartAudio);
    } else {
      // Audio already unlocked, start music
      unlockAndStartAudio();
    }
    
    // Don't emit ready here - wait for assets to be loaded
    // The ready event will be emitted after assets are loaded
  }
  
  // Helper function to safely get audio context
  private getAudioContext(): AudioContext | null {
    if ('context' in this.sound && this.sound.context) {
      return this.sound.context as AudioContext;
    }
    return null;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.sound.mute = this.isMuted;
    localStorage.setItem('escapeTheDeadline_muted', this.isMuted.toString());
    return this.isMuted;
  }
  
  isSoundMuted(): boolean {
    return this.isMuted || this.sound.mute;
  }
  
  setMusicVolume(volume: number) {
    if (this.backgroundMusic && 'setVolume' in this.backgroundMusic) {
      (this.backgroundMusic as any).setVolume(volume);
    }
  }

  jump() {
    if (this.isGameOver || !this.isGameStarted) return;
    
    // Ensure audio is unlocked on first jump (mobile)
    if (this.sound.locked) {
      this.sound.unlock();
    }
    
    // Reliable ground detection - use collision flags with position fallback
    // Check collision flags first, then check if very close to ground
    const touchingGround = this.player.body.touching.down || this.player.body.blocked.down;
    const nearGround = Math.abs(this.player.y - this.groundY) < 5; // Within 5px of ground
    const onGround = touchingGround || (nearGround && this.player.body.velocity.y >= 0);
    
    // Scale jump velocity relative to screen height for responsive jump physics
    // Stronger jump on mobile to allow clearing obstacles
    const { width, height } = this.scale;
    const isMobileJump = width <= 768 || height <= 768;
    // Use config value for mobile jump multiplier (1.05 = 5% stronger on mobile)
    const mobileJumpMultiplier = isMobileJump ? GameConfig.physics.mobileJumpMultiplier : 1.0;
    // Use base velocity for consistent jump feel - increased for better obstacle clearance
    const baseJumpVelocity = -1200;
    const jumpVelocity = baseJumpVelocity * (height / GameConfig.physics.baseGravityHeight) * mobileJumpMultiplier;
    
    if (onGround) {
      // CRITICAL: Re-enable gravity when jumping
      this.player.body.setAllowGravity(true);
      this.player.body.setVelocityY(jumpVelocity);
      this.jumpsRemaining = 1;
      // Switch to ollie animation when jumping
      const ollieAnim = this.getAnimationName(false);
      if (this.anims.exists(ollieAnim)) {
        this.player.play(ollieAnim);
      }
      // Deduct energy for jumping (free during sprint mode)
      const jumpCost = this.sprintMode ? GameConfig.energy.jumpCostSprint : GameConfig.energy.jumpCost;
      this.energy = Math.max(0, this.energy - jumpCost);
      // Play jump sound - ensure audio context is active
      if (this.jumpSound && !this.isMuted) {
        try {
          // Resume audio context if suspended (mobile requirement)
          const audioContext = this.getAudioContext();
          if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
          }
          this.jumpSound.play();
        } catch (error) {
          console.warn('⚠️ Failed to play jump sound:', error);
        }
      }
    } else if (this.jumpsRemaining > 0) {
      // CRITICAL: Ensure gravity is enabled for double jump
      this.player.body.setAllowGravity(true);
      this.player.body.setVelocityY(jumpVelocity);
      this.jumpsRemaining = 0;
      // Restart ollie animation for double jump
      const ollieAnim = this.getAnimationName(false);
      if (this.anims.exists(ollieAnim)) {
        this.player.play(ollieAnim);
      }
      // Deduct energy for jumping (free during sprint mode)
      const jumpCost = this.sprintMode ? GameConfig.energy.jumpCostSprint : GameConfig.energy.jumpCost;
      this.energy = Math.max(0, this.energy - jumpCost);
      // Play jump sound - ensure audio context is active
      if (this.jumpSound && !this.isMuted) {
        try {
          // Resume audio context if suspended (mobile requirement)
          const audioContext = this.getAudioContext();
          if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
          }
          this.jumpSound.play();
        } catch (error) {
          console.warn('⚠️ Failed to play jump sound:', error);
        }
      }
    }
  }

  spawnObstacle() {
    const { width, height } = this.scale;
    
    // Scale obstacle sizes relative to screen - ensure minimum speed on mobile
    const isMobileSpeed = width <= 768 || height <= 768;
    const baseSpeed = isMobileSpeed ? Math.max(width / 1920, 0.5) : width / 1920;
    
    // Pick a random obstacle image (only Obstacle-01 and Obstacle-02 for regular obstacles)
    const regularObstacleKeys = this.obstacleImageKeys.filter(key => 
      key.includes('obstacle-01') || key.includes('obstacle-02')
    );
    const imageKey = Phaser.Math.RND.pick(regularObstacleKeys);
    
    // Extract obstacle name from key (e.g., "obstacle-obstacle-01" -> "Obstacle-01")
    // The key format is "obstacle-{name-lowercase-with-dashes}"
    const keyNameLower = imageKey.replace('obstacle-', '');
    // Convert back to original name format (e.g., "obstacle-01" -> "Obstacle-01")
    // Split by hyphen, capitalize first letter of each part, then join
    const obstacleName = keyNameLower.split('-').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('-');
    
    // Scale obstacle size relative to screen height - 5% bigger on mobile
    const isMobile = width <= 768 || height <= 768;
    const baseObstacleSize = isMobile ? height * 0.0735 : height * 0.06; // 7.35% on mobile (5% bigger), 6% on desktop
    const maxObstacleSize = isMobile ? 105 : 80; // Proportional cap on mobile (105px, 5% bigger) vs desktop (80px)
    const obstacleSize = Math.min(baseObstacleSize, maxObstacleSize);
    
    // Create obstacle image
    const obstacle = this.add.image(width + 50, 0, imageKey);
    
    // Scale obstacle image relative to screen height (assuming base image is ~100px, scale to obstacleSize)
    const imageScale = obstacleSize / 100;
    obstacle.setScale(imageScale);
    // Ensure minimum visibility
    if (imageScale < 0.3) {
      obstacle.setScale(0.3);
    }
    
    // Match player origin - bottom-center (same as character)
    // This makes obstacle.y represent the bottom of the obstacle (like character.y represents feet)
    obstacle.setOrigin(0.5, 1);
    
    // Position obstacle on ground - simple and correct
    // With origin (0.5, 1), obstacle.y is the bottom
    // Position obstacle.y = groundY to place bottom on ground surface (same as character)
    obstacle.setPosition(width + 50, this.groundY);
    obstacle.setDepth(10);
    
    // Note: Obstacles don't have physics bodies in this game (collision is checked via bounds)
    
    // Store obstacle name for collision messages
    obstacle.setData('obstacleName', obstacleName);
    this.obstacles.add(obstacle);
    
    // Scale obstacle speed relative to screen width
    const obstacleSpeed = -400 * baseSpeed;
    obstacle.setData('speed', obstacleSpeed);
    
    const minInterval = GameConfig.obstacles.regular.spawnIntervalMin;
    const maxInterval = GameConfig.obstacles.regular.spawnIntervalMax;
    const speedFactor = Math.min(1, (this.gameSpeed - GameConfig.speed.initial) / GameConfig.speed.initial);
    const baseInterval = maxInterval - (speedFactor * (maxInterval - minInterval));
    this.obstacleTimer = Phaser.Math.Between(baseInterval * 0.5, baseInterval * 1.5);
  }

  spawnFloatingObstacle() {
    const { width, height } = this.scale;
    
    // Scale floating obstacle positions and sizes relative to screen - ensure minimum speed on mobile
    const isMobileSpeed = width <= 768 || height <= 768;
    const baseSpeed = isMobileSpeed ? Math.max(width / 1920, 0.5) : width / 1920;
    const jumpHeight = height * 0.15; // Estimate max jump height as 15% of screen
    const heights = [
      this.groundY - jumpHeight * 0.7,
      this.groundY - jumpHeight * 0.85,
      this.groundY - jumpHeight * 1.0
    ];
    const y = Phaser.Math.RND.pick(heights);
    
    // Use Obstacle-03 image for floating obstacles
    const imageKey = this.obstacleImageKeys.find(key => key.includes('obstacle-03'));
    if (!imageKey) {
      console.warn('Obstacle-03 not found, falling back to rectangle');
      // Fallback to rectangle if image not found
      const obstacleWidth = width * 0.02;
      const obstacleHeight = height * 0.023;
      const obstacle = this.add.rectangle(
        width + 50,
        y,
        obstacleWidth,
        obstacleHeight,
        getElementColorPhaser('obstacleFloating')
      );
      obstacle.setDepth(10);
      this.floatingObstacles.add(obstacle);
      const obstacleSpeed = -400 * baseSpeed;
      obstacle.setData('speed', obstacleSpeed);
      const minInterval = GameConfig.obstacles.floating.spawnIntervalMin;
      const maxInterval = GameConfig.obstacles.floating.spawnIntervalMax;
      this.floatingObstacleTimer = Phaser.Math.Between(minInterval, maxInterval);
      return;
    }
    
    // Scale obstacle size relative to screen height - 10% bigger on mobile
    const isMobile = width <= 768 || height <= 768;
    const baseObstacleSize = isMobile ? height * 0.077 : height * 0.06; // 7.7% on mobile (10% bigger), 6% on desktop
    const maxObstacleSize = isMobile ? 110 : 80; // Proportional cap on mobile (110px, 10% bigger) vs desktop (80px)
    const obstacleSize = Math.min(baseObstacleSize, maxObstacleSize);
    
    // Create obstacle image
    const obstacle = this.add.image(width + 50, y, imageKey);
    
    // Scale obstacle image relative to screen height (assuming base image is ~100px)
    const imageScale = obstacleSize / 100;
    obstacle.setScale(imageScale);
    if (imageScale < 0.3) {
      obstacle.setScale(0.3);
    }
    
    obstacle.setOrigin(0.5, 0.5);
    obstacle.setDepth(10);
    this.floatingObstacles.add(obstacle);
    
    // Scale obstacle speed relative to screen width
    const obstacleSpeed = -400 * baseSpeed;
    obstacle.setData('speed', obstacleSpeed);
    
    const minInterval = GameConfig.obstacles.floating.spawnIntervalMin;
    const maxInterval = GameConfig.obstacles.floating.spawnIntervalMax;
    this.floatingObstacleTimer = Phaser.Math.Between(minInterval, maxInterval);
  }

  spawnProjectileObstacle() {
    const { width, height } = this.scale;
    // Ensure minimum speed on mobile
    const isMobileSpeed = width <= 768 || height <= 768;
    const baseSpeed = isMobileSpeed ? Math.max(width / 1920, 0.5) : width / 1920;
    
    // Always spawn from the right side of the screen (off-screen to the right)
    const startX = width + 50; // Right edge + 50 pixels
    
    // Calculate where projectile should be when it reaches player's x position
    const playerX = this.player.x;
    const distanceToPlayer = startX - playerX;
    
    // Vary the height - some low (need to jump), some high (need to stay low)
    const projectileType = Phaser.Math.Between(0, 1); // 0 = low, 1 = high
    
    let startY: number;
    let targetYAtPlayer: number; // Height when projectile reaches player
    
    // Get player's actual height for precise targeting
    const playerHeight = this.player.height || height * 0.08;
    
    if (projectileType === 0) {
      // Low projectile - at ground level where player stands, player needs to jump
      startY = this.groundY - height * 0.03; // Start slightly above ground
      targetYAtPlayer = this.groundY - playerHeight * 0.3; // At player's lower body when reaching (hittable if on ground)
    } else {
      // High projectile - at jump height, player needs to stay low/duck
      const jumpHeight = height * 0.15; // Estimate max jump height
      startY = this.groundY - jumpHeight * 0.35; // Start at mid-jump height
      targetYAtPlayer = this.groundY - jumpHeight * 0.3; // At jump height when reaching player (hittable if jumping)
    }
    
    // Calculate flight time to reach player's x position
    const horizontalSpeed = 400 * baseSpeed; // Speed from right to left
    const timeToPlayer = distanceToPlayer / horizontalSpeed;
    
    // Use minimal gravity for a flatter, more visible trajectory
    // The arc should be small - projectile mostly goes straight with slight downward curve
    const gravity = 150 * baseSpeed; // Very small gravity for almost-flat trajectory
    // Calculate initial vertical velocity to reach target height at player position
    const vy = (targetYAtPlayer - startY - 0.5 * gravity * timeToPlayer * timeToPlayer) / timeToPlayer;
    
    // Use Obstacle-04 image for projectile obstacles
    const imageKey = this.obstacleImageKeys.find(key => key.includes('obstacle-04'));
    if (!imageKey) {
      console.warn('Obstacle-04 not found, falling back to rectangle');
      // Fallback to rectangle if image not found
      const projectileSize = width * 0.02;
      const projectile = this.add.rectangle(
        startX,
        startY,
        projectileSize,
        projectileSize,
        getElementColorPhaser('obstacleProjectile')
      );
      projectile.setDepth(10);
      this.projectileObstacles.add(projectile);
      projectile.setData('startX', startX);
      projectile.setData('startY', startY);
      projectile.setData('elapsedTime', 0);
      projectile.setData('gravity', gravity);
      projectile.setData('velocityX', -Math.abs(horizontalSpeed));
      projectile.setData('velocityY', vy);
      const minInterval = GameConfig.obstacles.projectile.spawnIntervalMin;
      const maxInterval = GameConfig.obstacles.projectile.spawnIntervalMax;
      this.projectileObstacleTimer = Phaser.Math.Between(minInterval, maxInterval);
      return;
    }
    
    // Scale projectile size relative to screen height - 10% bigger on mobile
    const isMobile = width <= 768 || height <= 768;
    const baseObstacleSize = isMobile ? height * 0.077 : height * 0.06; // 7.7% on mobile (10% bigger), 6% on desktop
    const maxObstacleSize = isMobile ? 110 : 80; // Proportional cap on mobile (110px, 10% bigger) vs desktop (80px)
    const obstacleSize = Math.min(baseObstacleSize, maxObstacleSize);
    
    // Create projectile obstacle image
    const projectile = this.add.image(startX, startY, imageKey);
    
    // Scale projectile image relative to screen height (assuming base image is ~100px)
    const imageScale = obstacleSize / 100;
    projectile.setScale(imageScale);
    if (imageScale < 0.3) {
      projectile.setScale(0.3);
    }
    
    projectile.setOrigin(0.5, 0.5);
    projectile.setDepth(10);
    this.projectileObstacles.add(projectile);
    
    // Store initial position and trajectory for parabolic calculation
    // IMPORTANT: velocityX must be NEGATIVE to move from right to left
    projectile.setData('startX', startX);
    projectile.setData('startY', startY);
    projectile.setData('elapsedTime', 0);
    projectile.setData('gravity', gravity);
    // Set velocity: NEGATIVE = moves LEFT (from right to left)
    // Positive would move RIGHT (left to right), which is wrong
    projectile.setData('velocityX', -Math.abs(horizontalSpeed)); // Ensure negative for leftward movement
    projectile.setData('velocityY', vy);
    
    // Set timer for next spawn
    const minInterval = GameConfig.obstacles.projectile.spawnIntervalMin;
    const maxInterval = GameConfig.obstacles.projectile.spawnIntervalMax;
    this.projectileObstacleTimer = Phaser.Math.Between(minInterval, maxInterval);
  }

  spawnCollectible() {
    const { width, height } = this.scale;
    
    // Scale collectible positions and sizes relative to screen - proportional to obstacles
    // Ensure minimum speed on mobile
    const isMobileSpeedCollectible = width <= 768 || height <= 768;
    const baseSpeed = isMobileSpeedCollectible ? Math.max(width / 1920, 0.5) : width / 1920;
    // Detect mobile - use appropriate size on mobile devices
    const isMobile = width <= 768 || height <= 768;
    // Desktop: larger size for better visibility, Mobile: 10% bigger but still smaller than obstacles
    const baseCollectibleSize = isMobile ? height * 0.0088 : height * 0.025; // 0.88% on mobile (10% bigger), 2.5% on desktop (larger)
    const maxCollectibleSize = isMobile ? 27 : 60; // Mobile: 27px (10% bigger), Desktop: 60px (larger)
    const collectibleSize = Math.min(baseCollectibleSize, maxCollectibleSize);
    const heights = [
      this.groundY - height * 0.028,  // ~2.8% from ground
      this.groundY - height * 0.074,  // ~7.4% from ground
      this.groundY - height * 0.12,   // ~12% from ground
      this.groundY - height * 0.167   // ~16.7% from ground
    ];
    const y = Phaser.Math.RND.pick(heights);
    
    // Pick a random collectible image
    const imageKey = Phaser.Math.RND.pick(this.collectibleImageKeys);
    
    // Determine if this collectible is special or regular based on config
    // Extract the original name from the key (e.g., "collectible-crown" -> "Crown")
    // The key format is "collectible-{name-lowercase-with-dashes}"
    // We need to match it back to the original name in the config
    const keyNameLower = imageKey.replace('collectible-', '');
    // Find matching name from config by comparing lowercase versions
    const matchingName = GameConfig.collectibles.types.regular.find(name => 
      name.toLowerCase().replace(/\s+/g, '-') === keyNameLower
    ) || GameConfig.collectibles.types.special.find(name => 
      name.toLowerCase().replace(/\s+/g, '-') === keyNameLower
    );
    const isSpecial = matchingName ? GameConfig.collectibles.types.special.includes(matchingName) : false;
    
    const collectible = this.add.image(width + 50, y, imageKey);
    // Scale collectible image relative to screen height (assuming base image is ~50px, scale to collectibleSize)
    const imageScale = collectibleSize / 50;
    collectible.setScale(imageScale);
    // Ensure minimum visibility - reduced threshold to allow smaller collectibles
    if (imageScale < 0.3) {
      collectible.setScale(0.3);
    }
    collectible.setOrigin(0.5, 0.5);
    // Store collectible type and name for collection logic
    collectible.setData('isSpecial', isSpecial);
    collectible.setData('collectibleName', matchingName || imageKey);
    this.collectibles.add(collectible);
    
    // Scale animation distance relative to screen height
    const animationDistance = height * 0.009; // ~0.9% of screen height
    
    this.tweens.add({
      targets: collectible,
      y: y - animationDistance,
      duration: Phaser.Math.Between(1500, 2500),
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Scale collectible speed relative to screen width
    const collectibleSpeed = -400 * baseSpeed;
    collectible.setData('speed', collectibleSpeed);
    
    // Use appropriate spawn interval based on collectible type
    const spawnInterval = isSpecial 
      ? Phaser.Math.Between(GameConfig.collectibles.special.spawnIntervalMin, GameConfig.collectibles.special.spawnIntervalMax)
      : Phaser.Math.Between(GameConfig.collectibles.regular.spawnIntervalMin, GameConfig.collectibles.regular.spawnIntervalMax);
    this.collectibleTimer = spawnInterval;
  }

  spawnSpecialCollectible() {
    const { width, height } = this.scale;
    
    // Scale special collectible positions and sizes relative to screen - ensure minimum speed on mobile
    const isMobileSpeedSpecial = width <= 768 || height <= 768;
    const baseSpeed = isMobileSpeedSpecial ? Math.max(width / 1920, 0.5) : width / 1920;
    // Detect mobile - use appropriate size on mobile devices
    const isMobile = width <= 768 || height <= 768;
    // Desktop: larger size for better visibility, Mobile: 10% bigger but still smaller than obstacles
    const baseCollectibleRadius = isMobile ? height * 0.0044 : height * 0.012; // 0.44% on mobile (10% bigger), 1.2% on desktop (larger)
    const maxCollectibleRadius = isMobile ? 14 : 30; // Mobile: 14px (10% bigger), Desktop: 30px (larger)
    const collectibleRadius = Math.min(baseCollectibleRadius, maxCollectibleRadius);
    const heights = [
      this.groundY - height * 0.028,  // ~2.8% from ground
      this.groundY - height * 0.074,  // ~7.4% from ground
      this.groundY - height * 0.12,   // ~12% from ground
      this.groundY - height * 0.167   // ~16.7% from ground
    ];
    const y = Phaser.Math.RND.pick(heights);
    const color = Phaser.Math.RND.pick(specialCollectibleColors);
    
    const collectible = this.add.arc(width + 50, y, collectibleRadius, 0, Math.PI * 2, false, color);
    this.specialCollectibles.push(collectible);
    
    // Scale animation distance relative to screen height
    const animationDistance = height * 0.014; // ~1.4% of screen height
    
    this.tweens.add({
      targets: collectible,
      y: y - animationDistance,
      duration: Phaser.Math.Between(1200, 2000),
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    this.tweens.add({
      targets: collectible,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: Phaser.Math.Between(800, 1200),
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Scale collectible speed relative to screen width
    const collectibleSpeed = -400 * baseSpeed;
    collectible.setData('speed', collectibleSpeed);
    
    this.specialCollectibleTimer = Phaser.Math.Between(GameConfig.collectibles.special.spawnIntervalMin, GameConfig.collectibles.special.spawnIntervalMax);
  }

  checkCollisions() {
    const playerBounds = this.player.getBounds();

    // Check obstacles
    this.obstacles.children.iterate((child) => {
      const obstacle = child as Phaser.GameObjects.Image;
      if (!obstacle || !obstacle.active) return false;
      
      const obstacleBounds = obstacle.getBounds();
      
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, obstacleBounds)) {
        if (this.sprintMode) {
          this.createCollisionEffect(obstacle.x, obstacle.y);
          obstacle.destroy();
          this.obstacles.remove(obstacle);
        } else {
          this.energy -= GameConfig.obstacles.regular.damage;
          this.combo = 0;
          this.grinchScore += 1; // Increment Grinch score on obstacle hit
          this.elfScore = Math.max(0, this.elfScore - 1); // Decrement Elf score on obstacle hit (minimum 0)
          
          // Get obstacle name and show specific message
          const obstacleName = obstacle.getData('obstacleName') || '';
          const specificMessages = GROUND_OBSTACLE_MESSAGES[obstacleName];
          const message = specificMessages && specificMessages.length > 0
            ? Phaser.Math.RND.pick(specificMessages)
            : Phaser.Math.RND.pick(HIT_MESSAGES);
          
          this.showMessage(message);
          this.cameras.main.shake(GameConfig.effects.cameraShakeDuration, GameConfig.effects.cameraShakeIntensity);
          this.createCollisionEffect(obstacle.x, obstacle.y);
          // Play stumble sound - ensure audio context is active
          if (this.stumbleSound && !this.isMuted) {
            try {
              // Resume audio context if suspended (mobile requirement)
              const audioContext = this.getAudioContext();
              if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
              }
              this.stumbleSound.play();
            } catch (error) {
              console.warn('⚠️ Failed to play stumble sound:', error);
            }
          }
          obstacle.destroy();
          this.obstacles.remove(obstacle);
          
          if (this.energy <= 0) {
            this.energy = 0;
            this.endGame();
          }
        }
      } else if (!this.obstaclesPassed.has(obstacle) && obstacle.x < this.player.x) {
        this.obstaclesPassed.add(obstacle);
        // Reward energy for successfully passing obstacle
        this.energy = Math.min(GameConfig.energy.max, this.energy + GameConfig.energy.obstaclePassReward);
        
        // Only accumulate combos when not in sprint mode
        if (!this.sprintMode) {
          this.combo += 1;
          
          if (this.combo % GameConfig.combo.sprintThreshold === 0 && this.combo >= GameConfig.combo.sprintThreshold && !this.sprintMode) {
            this.activateSprintMode();
          }
          
          // Show combo messages
          if (this.combo >= 3) {
            // Special message for x5 combo
            if (this.combo === 5) {
              this.showMessage('Five in a row? Santa calls that elite behavior.');
            } else {
              // Random combo message for other combos
              const message = Phaser.Math.RND.pick(COMBO_MESSAGES);
              this.showMessage(message);
            }
          }
          
          if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
          }
        }
      }
    });

    // Check floating obstacles
    this.floatingObstacles.children.iterate((child) => {
      const obstacle = child as Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
      if (!obstacle || !obstacle.active) return false;
      
      const obstacleBounds = obstacle.getBounds();
      
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, obstacleBounds)) {
        if (this.sprintMode) {
          this.createCollisionEffect(obstacle.x, obstacle.y);
          obstacle.destroy();
          this.floatingObstacles.remove(obstacle);
        } else {
          this.energy -= GameConfig.obstacles.floating.damage;
          this.combo = 0;
          this.grinchScore += 1; // Increment Grinch score on floating obstacle hit
          this.elfScore = Math.max(0, this.elfScore - 1); // Decrement Elf score on floating obstacle hit (minimum 0)
          this.showMessage(Phaser.Math.RND.pick(HIT_MESSAGES));
          this.cameras.main.shake(GameConfig.effects.cameraShakeDuration, GameConfig.effects.cameraShakeIntensity);
          this.createCollisionEffect(obstacle.x, obstacle.y);
          // Play stumble sound - ensure audio context is active
          if (this.stumbleSound && !this.isMuted) {
            try {
              // Resume audio context if suspended (mobile requirement)
              const audioContext = this.getAudioContext();
              if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
              }
              this.stumbleSound.play();
            } catch (error) {
              console.warn('⚠️ Failed to play stumble sound:', error);
            }
          }
          obstacle.destroy();
          this.floatingObstacles.remove(obstacle);
          
          if (this.energy <= 0) {
            this.energy = 0;
            this.endGame();
          }
        }
      } else if (obstacle instanceof Phaser.GameObjects.Image && !this.obstaclesPassed.has(obstacle) && obstacle.x < this.player.x) {
        this.obstaclesPassed.add(obstacle);
        // Reward energy for successfully passing floating obstacle
        this.energy = Math.min(GameConfig.energy.max, this.energy + GameConfig.energy.obstaclePassReward);
        
        // Only accumulate combos when not in sprint mode
        if (!this.sprintMode) {
          this.combo += 1;
          
          // Play combo sound for milestones - ensure audio context is active
          if (this.comboSound && !this.isMuted) {
            // Play sound for milestone3, milestone5, and sprint threshold
            if (this.combo === GameConfig.combo.milestone3 || 
                this.combo === GameConfig.combo.milestone5 || 
                this.combo % GameConfig.combo.sprintThreshold === 0) {
              try {
                // Resume audio context if suspended (mobile requirement)
                const audioContext = this.getAudioContext();
                if (audioContext && audioContext.state === 'suspended') {
                  audioContext.resume();
                }
                this.comboSound.play();
              } catch (error) {
                console.warn('⚠️ Failed to play combo sound:', error);
              }
            }
          }
          
          // Activate sprint mode at threshold
          if (this.combo % GameConfig.combo.sprintThreshold === 0 && this.combo >= GameConfig.combo.sprintThreshold && !this.sprintMode) {
            this.activateSprintMode();
          }
          
          // Show combo messages with milestone rewards
          if (this.combo === GameConfig.combo.milestone3) {
            // First milestone - encouraging message
            this.showMessage('🔥 3 in a row! You\'re getting the hang of this!');
          } else if (this.combo === GameConfig.combo.milestone5) {
            // Second milestone - special message
            this.showMessage('Five in a row? Santa calls that elite behavior.');
          } else if (this.combo >= 3 && this.combo < GameConfig.combo.sprintThreshold) {
            // Random combo message for other combos before sprint
            const message = Phaser.Math.RND.pick(COMBO_MESSAGES);
            this.showMessage(message);
          }
          
          if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
          }
        }
      }
    });

    // Check projectile obstacles
    this.projectileObstacles.children.iterate((child) => {
      const projectile = child as Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
      if (!projectile || !projectile.active) return false;
      
      const projectileBounds = projectile.getBounds();
      
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, projectileBounds)) {
        if (this.sprintMode) {
          this.createCollisionEffect(projectile.x, projectile.y);
          projectile.destroy();
          this.projectileObstacles.remove(projectile);
        } else {
          this.energy -= GameConfig.obstacles.projectile.damage;
          this.combo = 0;
          this.grinchScore += 1; // Increment Grinch score on projectile hit
          this.elfScore = Math.max(0, this.elfScore - 1); // Decrement Elf score on projectile hit (minimum 0)
          this.showMessage(Phaser.Math.RND.pick(HIT_MESSAGES));
          this.cameras.main.shake(GameConfig.effects.cameraShakeProjectileDuration, GameConfig.effects.cameraShakeProjectileIntensity);
          this.createCollisionEffect(projectile.x, projectile.y);
          // Play stumble sound - ensure audio context is active
          if (this.stumbleSound && !this.isMuted) {
            try {
              // Resume audio context if suspended (mobile requirement)
              const audioContext = this.getAudioContext();
              if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
              }
              this.stumbleSound.play();
            } catch (error) {
              console.warn('⚠️ Failed to play stumble sound:', error);
            }
          }
          projectile.destroy();
          this.projectileObstacles.remove(projectile);
          
          if (this.energy <= 0) {
            this.energy = 0;
            this.endGame();
          }
        }
      }
    });

    // Check collectibles
    this.collectibles.children.iterate((child) => {
      const collectible = child as Phaser.GameObjects.Image;
      if (!collectible || !collectible.active) return false;
      
      const collectibleBounds = collectible.getBounds();
      
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, collectibleBounds)) {
        // Check if this is a special collectible
        const isSpecial = collectible.getData('isSpecial') || false;
        const energyGain = isSpecial 
          ? GameConfig.collectibles.special.energyGain 
          : GameConfig.collectibles.regular.energyGain;
        
        this.energy = Math.min(GameConfig.energy.max, this.energy + energyGain);
        this.elfScore += 1; // Increment Elf score on collectible collection
        
        // Get collectible name and show specific message
        const collectibleName = collectible.getData('collectibleName') || '';
        const specificMessages = COLLECTIBLE_MESSAGES[collectibleName];
        let message: string;
        
        if (specificMessages && specificMessages.length > 0) {
          message = Phaser.Math.RND.pick(specificMessages);
        } else if (isSpecial) {
          message = Phaser.Math.RND.pick(SPECIAL_COLLECT_MESSAGES);
        } else {
          message = Phaser.Math.RND.pick(COLLECT_MESSAGES);
        }
        
        this.showMessage(message);
        
        if (isSpecial) {
          this.createSpecialCollectEffect(collectible.x, collectible.y);
        } else {
          // Use a default color for the effect (yellow/gold)
          this.createCollectEffect(collectible.x, collectible.y, getElementColorPhaser('collectibleRegular1'));
        }
        // Play collect sound - ensure audio context is active
        if (this.collectSound && !this.isMuted) {
          try {
            // Resume audio context if suspended (mobile requirement)
            const audioContext = this.getAudioContext();
            if (audioContext && audioContext.state === 'suspended') {
              audioContext.resume();
            }
            this.collectSound.play();
          } catch (error) {
            console.warn('⚠️ Failed to play collect sound:', error);
          }
        }
        collectible.destroy();
        this.collectibles.remove(collectible);
      }
    });

    // Check special collectibles
    for (let i = this.specialCollectibles.length - 1; i >= 0; i--) {
      const collectible = this.specialCollectibles[i];
      const collectibleBounds = collectible.getBounds();
      
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, collectibleBounds)) {
        this.energy = Math.min(GameConfig.energy.max, this.energy + GameConfig.collectibles.special.energyGain);
        this.elfScore += 1; // Increment Elf score on special collectible collection
        this.showMessage(Phaser.Math.RND.pick(SPECIAL_COLLECT_MESSAGES));
        this.createSpecialCollectEffect(collectible.x, collectible.y);
        // Play collect sound - ensure audio context is active
        if (this.collectSound && !this.isMuted) {
          try {
            // Resume audio context if suspended (mobile requirement)
            const audioContext = this.getAudioContext();
            if (audioContext && audioContext.state === 'suspended') {
              audioContext.resume();
            }
            this.collectSound.play();
          } catch (error) {
            console.warn('⚠️ Failed to play collect sound:', error);
          }
        }
        collectible.destroy();
        this.specialCollectibles.splice(i, 1);
      }
    }

    // Check deadline - deadline hits character at the CENTER
    // Deadline's RIGHT edge (deadline.x + deadline.width) hits player's CENTER (player.x)
    // Only check collision if deadline is actually to the left of player (deadline.x < player.x)
    if (this.deadline.x < this.player.x) {
      const deadlineRightEdge = this.deadline.x + this.deadline.displayWidth;
      const playerCenter = this.player.x; // Character center (origin is 0.5, so x is center)
      // Character loses when deadline's right edge reaches player's center
      if (deadlineRightEdge >= playerCenter) {
        this.energy = 0;
        this.endGame();
      }
    }
  }

  showMessage(message: string) {
    // Check cooldown timer - only allow messages every X seconds (except for special messages)
    const isSpecialMessage = message.includes('SPRINT') || message.includes('ON FIRE') || message.includes('🔥');
    if (!isSpecialMessage && this.messageTimer > 0) {
      return; // Skip this message if cooldown hasn't expired
    }
    
    // Reset cooldown timer
    if (!isSpecialMessage) {
      this.messageTimer = GameConfig.messages.cooldown;
    }
    
    if (this.messageBubbles.length >= GameConfig.messages.maxBubbles) {
      const oldest = this.messageBubbles[0];
      oldest.container.destroy();
      this.messageBubbles.shift();
    }

    // Determine message type for color coding
    const isObstacleMessage = HIT_MESSAGES.includes(message) || 
      Object.values(GROUND_OBSTACLE_MESSAGES).some(messages => messages.includes(message));
    
    const isComboMessage = COMBO_MESSAGES.includes(message) || message === 'Five in a row? Santa calls that elite behavior.';
    
    const isCollectibleMessage = COLLECT_MESSAGES.includes(message) || 
      SPECIAL_COLLECT_MESSAGES.includes(message) ||
      Object.values(COLLECTIBLE_MESSAGES).some(messages => messages.includes(message));
    
    const isSpecial = isSpecialMessage;
    
    // Responsive font size - same size for all messages
    const { width } = this.scale;
    const isMobile = width <= 768;
    const baseFontSize = isMobile ? '12px' : '18px'; // Same size for all messages
    
    // Set background color based on message type (only difference)
    let bgColor: number;
    if (isObstacleMessage) {
      // Red for obstacles
      bgColor = getColorTokenPhaser('red');
    } else if (isComboMessage) {
      // Purple for combos
      bgColor = getColorTokenPhaser('purple');
    } else if (isCollectibleMessage || isSpecial) {
      // Green for collectibles and positive messages
      bgColor = getColorTokenPhaser('green');
    } else {
      // Default green for other positive messages (low energy, critical energy, etc.)
      bgColor = getColorTokenPhaser('green');
    }
    
    const textColor = getColorToken('white'); // White text for all messages
    
    // Match text resolution to canvas resolution for crisp rendering on mobile
    // Use higher resolution on mobile to prevent pixelation
    const textResolution = isMobile ? Math.max(window.devicePixelRatio || 1, 3) : Math.max(window.devicePixelRatio || 1, 2); // Higher on mobile (3x) for crisp text
    
    // Max width for text wrapping - responsive (increased)
    const maxTextWidth = isMobile ? 280 : 400;
    
    const messageText = this.add.text(0, 0, message, {
      fontFamily: '"Urbanist", sans-serif',
      fontSize: baseFontSize,
      color: textColor,
      align: 'center',
      resolution: textResolution, // Match canvas resolution for crisp text
      fontStyle: 'bold',
      wordWrap: { width: maxTextWidth }
    });
    messageText.setOrigin(0.5, 0.5); // Center the text
    messageText.setDepth(1001);

    // Responsive padding - same padding for all messages
    const horizontalPadding = isMobile ? 12 : 16; // Same padding for all messages
    const verticalPadding = isMobile ? 4 : 8; // Same padding for all messages
    
    // Create rounded rectangle (pill shape) using graphics
    const bgWidth = messageText.width + (horizontalPadding * 2);
    const bgHeight = messageText.height + (verticalPadding * 2);
    const borderRadius = bgHeight / 2; // Make it a pill shape (half the height)
    
    const messageBg = this.add.graphics();
    messageBg.fillStyle(bgColor, 1);
    messageBg.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, borderRadius);
    messageBg.setDepth(1000);
    
    // Create container first
    const messageContainer = this.add.container(0, 0, [messageBg, messageText]);
    
    messageContainer.setDepth(1002);
    messageContainer.setAlpha(0);
    messageContainer.setScale(0.784); // Start slightly smaller for pop-in effect (0.8 * 0.98 = 2% smaller)

    const bubbleData = {
      container: messageContainer,
      bg: messageBg,
      text: messageText,
      height: bgHeight, // Store height for positioning
      timer: GameConfig.messages.displayDuration,
      id: this.messageIdCounter++
    };
    
    this.messageBubbles.push(bubbleData);
    
    // Pop-in animation with scale (2% smaller than before)
    this.tweens.add({
      targets: messageContainer,
      alpha: 1,
      scaleX: 0.98,
      scaleY: 0.98,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    this.updateMessageBubblePositions();
  }

  updateGameData() {
    const deadlineProximity = 100 - this.energy;
    
    this.game.events.emit('updateGameData', {
      distance: Math.floor(this.distance),
      energy: Math.round(this.energy),
      deadlineProximity: deadlineProximity,
      message: '',
      messageTimer: 0,
      combo: this.combo,
      maxCombo: this.maxCombo,
      sprintMode: this.sprintMode,
      sprintTimer: this.sprintTimer,
      grinchScore: this.grinchScore,
      elfScore: this.elfScore
    });
  }

  endGame() {
    if (this.isGameOver) return;
    
    this.isGameOver = true;
    
    // Stop skateboard sound when game ends
    if (this.skateboardSound && this.skateboardSound.isPlaying) {
      try {
        this.skateboardSound.stop();
      } catch (error) {
        console.warn('⚠️ Failed to stop skateboard sound on game over:', error);
      }
    }
    
    // Lower music volume for game over screen and reset speed
    if (this.backgroundMusic) {
      this.setMusicVolume(0.2); // Low volume for game over screen
      // Reset music speed to normal
      try {
        this.currentMusicRate = GameConfig.audio.musicRateNormal;
        if ('setRate' in this.backgroundMusic) {
          (this.backgroundMusic as any).setRate(GameConfig.audio.musicRateNormal);
        } else if ('rate' in this.backgroundMusic) {
          (this.backgroundMusic as any).rate = GameConfig.audio.musicRateNormal;
        }
      } catch (error) {
        console.warn('⚠️ Failed to reset music speed on game over:', error);
      }
    }
    
    this.cameras.main.shake(500, 0.01); // Game over shake (hardcoded for dramatic effect)
    this.cameras.main.flash(300, 255, 0, 0);
    
    this.time.delayedCall(100, () => {
      this.cameras.main.flash(200, 255, 255, 255);
    });
    
    this.time.delayedCall(400, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
    });
    
    this.time.delayedCall(1000, () => {
      this.game.events.emit('gameOver', Math.floor(this.distance), this.maxCombo, this.grinchScore, this.elfScore);
    });
  }

  update(time: number, delta: number) {
    if (this.isGameOver || !this.isGameStarted) {
      return;
    }

    const deltaSeconds = delta / 1000;
    const { width: canvasWidth, height: canvasHeight } = this.scale;
    
    // Detect mobile - use speed multiplier for mobile devices
    const isMobile = canvasWidth <= 768 || canvasHeight <= 768;
    const mobileSpeedMultiplier = isMobile ? GameConfig.speed.mobileMultiplier : 1.0;
    
    // Scale base speed relative to screen width, then apply mobile multiplier
    // Ensure minimum speed on mobile for responsive feel
    const rawBaseSpeed = canvasWidth / 1920;
    const minBaseSpeed = isMobile ? 0.5 : rawBaseSpeed;
    const baseSpeed = Math.max(rawBaseSpeed, minBaseSpeed) * mobileSpeedMultiplier;

    // Check if on ground - reliable detection with position fallback
    const touchingGround = this.player.body.touching.down || this.player.body.blocked.down;
    const nearGround = Math.abs(this.player.y - this.groundY) < 3; // Within 3px of ground
    const onGround = touchingGround || (nearGround && this.player.body.velocity.y >= 0);
    
    // CRITICAL FIX: Ensure gravity is enabled when in air (not on ground)
    // This ensures character falls back down after jumping
    if (!onGround) {
      this.player.body.setAllowGravity(true);
    }
    
    // CRITICAL FIX: Prevent character from sinking below ground
    // Completely disable safeguard when touching ground to prevent bouncing/wiggling
    // Only check if character is significantly below ground AND not touching ground
    if (!touchingGround && !onGround) {
      // Character is not touching ground - check if sinking significantly
      const spriteHeight = this.player.displayHeight;
      const calculatedBodyHeight = spriteHeight * 0.85;
      const reportedBodyHeight = this.player.body.height;
      const reliableBodyHeight = Math.abs(reportedBodyHeight - calculatedBodyHeight) > 5 
        ? calculatedBodyHeight 
        : reportedBodyHeight;
      
      const characterBodyBottom = this.player.body.y + reliableBodyHeight;
      const spriteY = this.player.y;
      
      // Only correct if character is significantly below ground (more than 20px)
      // This prevents constant micro-adjustments that cause wiggling
      const sinkingThreshold = 20; // Only correct if more than 20px below ground
      if (characterBodyBottom > this.groundY + sinkingThreshold || spriteY > this.groundY + sinkingThreshold) {
        // Character is sinking significantly - correct it
        this.player.y = this.groundY;
        
        // Fix body position to align with sprite
        const spriteTopLeftY = this.player.y - spriteHeight;
        const offsetY = spriteHeight - reliableBodyHeight;
        const correctBodyY = spriteTopLeftY + offsetY;
        this.player.body.y = correctBodyY;
        
        // Reset vertical velocity
        this.player.body.setVelocityY(0);
        
        // Only log on mobile if sinking is severe
        if (isMobile) {
          console.warn('⚠️ Character sinking detected (mobile) - corrected:', {
            bodyBottom: characterBodyBottom.toFixed(1),
            spriteY: spriteY.toFixed(1),
            groundY: this.groundY.toFixed(1)
          });
        }
      }
    }
    // When on ground or touching ground, let physics collider handle everything
    // Do NOT adjust position or velocity - this causes bouncing/wiggling
    
    // Jump handling is done in jump() method via event listeners
    // No duplicate jump handling here to avoid inconsistency
    this.pointerWasDown = this.input.activePointer.isDown;
    
    // Handle ground state
    if (onGround) {
      this.jumpsRemaining = 2;
      
      // CRITICAL FIX: Ensure body height is correct when on ground
      // Phaser sometimes resets body height, causing collider to fail
      const spriteHeight = this.player.displayHeight;
      const expectedBodyHeight = spriteHeight * 0.85;
      if (Math.abs(this.player.body.height - expectedBodyHeight) > 5) {
        // Body height is wrong - force correct value
        this.player.body.height = expectedBodyHeight;
        this.player.body.width = spriteHeight * 0.85; // Also ensure width is correct
        // Re-setup body to ensure offset is correct
        this.setupCharacterBody();
      }
      
      // CRITICAL FIX: Disable gravity when on ground to prevent constant sinking
      // Re-enable it when jumping
      if (this.player.body.allowGravity) {
        this.player.body.setAllowGravity(false);
      }
      
      // Reset velocity to prevent any downward movement
      if (this.player.body.velocity.y > 0) {
        this.player.body.setVelocityY(0);
      }
      
      // Let Arcade Physics handle all position corrections
      // Do NOT manually adjust Y position - it causes jittering and conflicts with physics
      // The collider will automatically keep the player on the ground
      
      // Switch to pushing animation when on ground
      const pushingAnim = this.getAnimationName(true);
      if (this.player.anims.currentAnim?.key !== pushingAnim) {
        this.player.play(pushingAnim);
        
        // Play skateboard sound when pushing
        if (this.skateboardSound && !this.isMuted && !this.skateboardSound.isPlaying) {
          try {
            const audioContext = this.getAudioContext();
            if (audioContext && audioContext.state === 'suspended') {
              audioContext.resume();
            }
            this.skateboardSound.play();
            
            // Set appropriate rate based on sprint mode
            const skateboardRate = this.sprintMode ? 1.5 : 1.2;
            if ('setRate' in this.skateboardSound) {
              (this.skateboardSound as any).setRate(skateboardRate);
            } else if ('rate' in this.skateboardSound) {
              (this.skateboardSound as any).rate = skateboardRate;
            }
          } catch (error) {
            console.warn('⚠️ Failed to play skateboard sound:', error);
          }
        } else if (this.skateboardSound && this.skateboardSound.isPlaying && this.sprintMode) {
          // Update rate if sprint mode is active and sound is already playing
          try {
            if ('setRate' in this.skateboardSound) {
              (this.skateboardSound as any).setRate(1.5);
            } else if ('rate' in this.skateboardSound) {
              (this.skateboardSound as any).rate = 1.5;
            }
          } catch (error) {
            console.warn('⚠️ Failed to update skateboard sound rate:', error);
          }
        }
      }
    } else {
      // Switch to ollie animation when in air
      const ollieAnim = this.getAnimationName(false);
      if (this.player.anims.currentAnim?.key !== ollieAnim) {
        this.player.play(ollieAnim);
        
        // Stop skateboard sound when jumping
        if (this.skateboardSound && this.skateboardSound.isPlaying) {
          try {
            this.skateboardSound.stop();
          } catch (error) {
            console.warn('⚠️ Failed to stop skateboard sound:', error);
          }
        }
      }
    }

    // Increase speed over time
    const maxSpeed = GameConfig.speed.max * baseSpeed;
    this.gameSpeed = Math.min(maxSpeed, this.gameSpeed + delta * GameConfig.speed.acceleration * baseSpeed);
    // Distance-based minimum speed: ensures speed increases as you progress
    const distanceMinSpeed = (GameConfig.speed.initial + Math.min(GameConfig.speed.distanceSpeedCap, Math.floor(this.distance / GameConfig.speed.distanceSpeedInterval) * GameConfig.speed.distanceSpeedBonus)) * baseSpeed;
    // Use the higher of time-accumulated speed or distance-based minimum
    this.gameSpeed = Math.max(this.gameSpeed, Math.min(maxSpeed, distanceMinSpeed));

    const speedMultiplier = this.sprintMode ? GameConfig.sprint.speedMultiplier : 1.0;
    const currentSpeed = this.gameSpeed * speedMultiplier;

    // Move parallax background
    for (const building of this.backgroundBuildings) {
      building.x -= (currentSpeed * 0.5) * deltaSeconds;
      if (building.x < -100) {
        building.x = this.scale.width + 100;
      }
    }
    
    for (const cloud of this.backgroundClouds) {
      cloud.x -= (currentSpeed * 0.2) * deltaSeconds;
      if (cloud.x < -100) {
        cloud.x = this.scale.width + 100;
      }
    }

    // Move obstacles
    this.obstacles.children.iterate((child) => {
      const obstacle = child as Phaser.GameObjects.Image;
      if (!obstacle || !obstacle.active) return false;
      
      obstacle.x -= currentSpeed * deltaSeconds;
      
      if (obstacle.x < -100) {
        obstacle.destroy();
        this.obstacles.remove(obstacle);
        this.obstaclesPassed.delete(obstacle);
      }
    });

    // Move floating obstacles
    this.floatingObstacles.children.iterate((child) => {
      const obstacle = child as Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
      if (!obstacle || !obstacle.active) return false;
      
      obstacle.x -= currentSpeed * deltaSeconds;
      
      if (obstacle.x < -100) {
        obstacle.destroy();
        this.floatingObstacles.remove(obstacle);
      }
    });

    // Move projectile obstacles with parabolic trajectory
    this.projectileObstacles.children.iterate((child) => {
      const projectile = child as Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
      if (!projectile || !projectile.active) return false;
      
      const elapsedTime = projectile.getData('elapsedTime') + deltaSeconds;
      projectile.setData('elapsedTime', elapsedTime);
      
      const startX = projectile.getData('startX');
      const startY = projectile.getData('startY');
      const velocityX = projectile.getData('velocityX');
      const velocityY = projectile.getData('velocityY');
      const gravity = projectile.getData('gravity');
      
      // Calculate parabolic position
      // velocityX is negative, so this moves from right to left
      const newX = startX + velocityX * elapsedTime; // velocityX is negative = moves LEFT
      const newY = startY + velocityY * elapsedTime + 0.5 * gravity * elapsedTime * elapsedTime;
      
      projectile.x = newX;
      projectile.y = newY;
      
      // Rotate projectile for visual effect
      projectile.rotation += deltaSeconds * 5;
      
      // Remove if off screen or past target
      const { width, height } = this.scale;
      if (projectile.x < -100 || projectile.x > width + 100 || projectile.y > height + 100) {
        projectile.destroy();
        this.projectileObstacles.remove(projectile);
      }
    });

    // Move collectibles
    this.collectibles.children.iterate((child) => {
      const collectible = child as Phaser.GameObjects.Image;
      if (!collectible || !collectible.active) return false;
      
      collectible.x -= currentSpeed * deltaSeconds;
      
      if (collectible.x < -100) {
        collectible.destroy();
        this.collectibles.remove(collectible);
      }
    });

    // Move special collectibles
    for (let i = this.specialCollectibles.length - 1; i >= 0; i--) {
      const collectible = this.specialCollectibles[i];
      collectible.x -= currentSpeed * deltaSeconds;
      
      if (collectible.x < -100) {
        collectible.destroy();
        this.specialCollectibles.splice(i, 1);
      }
    }

    // Spawn obstacles
    this.obstacleTimer -= delta;
    if (this.obstacleTimer <= 0) {
      this.spawnObstacle();
    }

    // Spawn floating obstacles (only after unlock distance)
    if (this.distance > GameConfig.obstacles.floating.unlockDistance) {
      this.floatingObstacleTimer -= delta;
      if (this.floatingObstacleTimer <= 0) {
        this.spawnFloatingObstacle();
      }
    }

    // Spawn projectile obstacles (only after unlock distance)
    if (this.distance > GameConfig.obstacles.projectile.unlockDistance) {
      this.projectileObstacleTimer -= delta;
      if (this.projectileObstacleTimer <= 0) {
        this.spawnProjectileObstacle();
      }
    }

    // Spawn collectibles
    this.collectibleTimer -= delta;
    if (this.collectibleTimer <= 0) {
      this.spawnCollectible();
    }

    // Spawn special collectibles
    this.specialCollectibleTimer -= delta;
    if (this.specialCollectibleTimer <= 0) {
      this.spawnSpecialCollectible();
    }

    // Energy drain
    this.energyDrainTimer += delta;
    if (this.energyDrainTimer >= GameConfig.energy.drainInterval) {
      if (!this.sprintMode) {
        this.energy = Math.max(0, this.energy - GameConfig.energy.drainAmount);
      }
      this.energyDrainTimer = 0;
      
      if (this.energy <= 0) {
        this.endGame();
      }
    }
    
    // Update sprint mode
    this.updateSprintMode(delta);
    
    // Update sprint glow
    this.sprintGlow.setPosition(this.player.x, this.player.y);
    if (this.sprintMode) {
      const pulseAlpha = 0.3 + Math.sin(time * 0.01) * 0.2;
      this.sprintGlow.setAlpha(pulseAlpha);
    }
    
    // Update music speed based on energy/deadline proximity
    // Sprint mode overrides this (handled in activateSprintMode)
    if (!this.sprintMode && this.backgroundMusic && !this.isMuted) {
      // Calculate desired music rate based on energy
      // Energy 100-50: normal speed (1.0)
      // Energy 50-0: gradually slow down from 1.0 to min rate
      let targetRate = GameConfig.audio.musicRateNormal;
      if (this.energy < 50) {
        // Linear interpolation: energy 50 = 1.0, energy 0 = min rate
        const energyRatio = this.energy / 50; // 0 to 1 as energy goes from 0 to 50
        targetRate = GameConfig.audio.musicRateMin + (energyRatio * (GameConfig.audio.musicRateNormal - GameConfig.audio.musicRateMin));
      }
      
      // Smoothly transition to target rate (avoid abrupt changes)
      const rateChangeSpeed = GameConfig.audio.musicRateTransitionSpeed;
      if (Math.abs(this.currentMusicRate - targetRate) > 0.01) {
        if (this.currentMusicRate > targetRate) {
          this.currentMusicRate = Math.max(targetRate, this.currentMusicRate - rateChangeSpeed);
        } else {
          this.currentMusicRate = Math.min(targetRate, this.currentMusicRate + rateChangeSpeed);
        }
        
        // Apply the rate change
        try {
          if ('setRate' in this.backgroundMusic) {
            (this.backgroundMusic as any).setRate(this.currentMusicRate);
          } else if ('rate' in this.backgroundMusic) {
            (this.backgroundMusic as any).rate = this.currentMusicRate;
          }
        } catch (error) {
          console.warn('⚠️ Failed to update music speed:', error);
        }
      }
    }
    
    // Update vignette intensity based on energy
    this.updateVignette();

    // Low energy warnings
    this.lowEnergyMessageTimer += delta;
    if (this.lowEnergyMessageTimer >= GameConfig.warnings.warningInterval) {
      if (this.energy <= GameConfig.warnings.criticalEnergyThreshold && this.energy > 0) {
        this.showMessage(Phaser.Math.RND.pick(CRITICAL_ENERGY_MESSAGES));
      } else if (this.energy <= GameConfig.warnings.lowEnergyThreshold && this.energy > GameConfig.warnings.criticalEnergyThreshold) {
        this.showMessage(Phaser.Math.RND.pick(LOW_ENERGY_MESSAGES));
      }
      this.lowEnergyMessageTimer = 0;
    }

    // Decrement message cooldown timer
    if (this.messageTimer > 0) {
      this.messageTimer -= delta;
    }

    // Distance tracking
    this.distanceTimer += delta;
    if (this.distanceTimer >= GameConfig.timers.distanceUpdateInterval) {
      const distanceMultiplier = this.sprintMode ? GameConfig.sprint.distanceMultiplier : 1.0;
      this.distance += (this.gameSpeed / 100) * distanceMultiplier;
      this.distanceTimer = 0;
    }

    // Move deadline - starts far left, moves right as energy decreases
    // When energy is max (100), deadline stays far left (off-screen)
    // When energy is 0, deadline moves right toward player position
    const { width } = this.scale;
    const energyRatio = this.energy / GameConfig.energy.max; // 1.0 = full energy, 0.0 = no energy
    
    // Calculate start position based on deadline width to ensure it's fully off-screen
    const deadlineWidth = this.deadline.displayWidth || 100; // Fallback if not set
    const startX = -deadlineWidth - 200; // Start well off-screen (deadline width + buffer)
    // End position: deadline's right edge should reach player's center
    // deadline.x + deadlineWidth = player.x, so deadline.x = player.x - deadlineWidth
    const endX = this.player.x - deadlineWidth; // Deadline's right edge reaches player center
    
    // Start far left, move right as energy decreases
    // At full energy: deadline at startX (off-screen left)
    // At zero energy: deadline at endX (approaches player from right)
    const deadlineTargetX = startX + (1 - energyRatio) * (endX - startX);
    this.deadlineX = this.deadlineX + (deadlineTargetX - this.deadlineX) * deltaSeconds * GameConfig.deadline.movementSpeed;
    this.deadline.x = this.deadlineX;

    // Check collisions
    this.checkCollisions();

    // Update message bubbles
    this.updateMessageBubblePositions();

    // Update UI
    this.updateGameData();
  }

  startGame() {
    console.log('🎮 startGame() called');
    
    // CRITICAL: Don't start game until assets are fully loaded
    if (!this.assetsLoaded) {
      console.warn('⚠️ startGame() called before assets are loaded, waiting...');
      // Wait for assets to load, then retry
      const checkAssets = setInterval(() => {
        if (this.assetsLoaded) {
          clearInterval(checkAssets);
          this.startGame(); // Retry after assets are loaded
        }
      }, 100);
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkAssets);
        if (!this.assetsLoaded) {
          console.error('❌ Assets failed to load within 5 seconds, starting anyway');
          this.assetsLoaded = true; // Force allow start
          this.startGame();
        }
      }, 5000);
      return;
    }
    
    // Ensure audio is unlocked when game starts (mobile)
    if (this.sound.locked) {
      this.sound.unlock();
    }
    
    // Get current game world dimensions (use scale, not camera)
    const { width, height } = this.scale;
    
    // CRITICAL: Verify player exists before starting
    if (!this.player) {
      console.error('❌ CRITICAL: Player does not exist when startGame() is called!');
      return;
    }
    
    console.log('✅ Player exists:', {
      x: this.player.x.toFixed(1),
      y: this.player.y.toFixed(1),
      visible: this.player.visible,
      alpha: this.player.alpha,
      scale: this.player.scaleX
    });
    
    // Ensure ground is positioned correctly before starting game
    // This is critical after orientation changes
    // CRITICAL: Use the SAME logic as create() to ensure consistency
    const aspectRatio = width / height;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIPhoneProMax = /iPhone/.test(navigator.userAgent) && (window.screen.height >= 926 || window.screen.width >= 926);
    const isShortViewport = height < 500; // CRITICAL: Detect very short viewports (like 402px height)
    
    // CRITICAL FIX: For very short viewports, use moderate ground ratio
    // This MUST match the logic in create() exactly
    // Reduced from 30% to 20% for better proportions
    let groundHeightRatio = 0.15; // Default 15%
    
    if (isShortViewport) {
      // Very short viewport (height < 500px) - use moderate ground ratio
      // Reduced from 30% to 20% for better proportions
      if (aspectRatio > 1.8) {
        groundHeightRatio = 0.20; // 20% for wide + short viewports (reduced from 30%)
      } else {
        groundHeightRatio = 0.18; // 18% for short viewports (reduced from 25%)
      }
    } else if (aspectRatio > 2.2) {
      groundHeightRatio = (isSafari || isIPhoneProMax) ? 0.24 : 0.22; // 24% on Safari/Pro Max, 22% otherwise
    } else if (aspectRatio > 1.8) {
      groundHeightRatio = (isSafari || isIPhoneProMax) ? 0.20 : 0.18; // 20% on Safari/Pro Max, 18% otherwise
    } else if (isSafari || isIPhoneProMax) {
      groundHeightRatio = 0.17; // 17% on Safari/Pro Max for normal screens
    }
    
    const groundHeight = height * groundHeightRatio;
    this.groundY = height - groundHeight;
    
    console.log('🌍 startGame() ground recalculation:', {
      width,
      height,
      aspectRatio: aspectRatio.toFixed(2),
      isShortViewport,
      groundHeightRatio: (groundHeightRatio * 100).toFixed(1) + '%',
      groundHeight: Math.round(groundHeight),
      groundY: Math.round(this.groundY)
    });
    
    // Update ground position if it exists
    if (this.ground) {
      const groundRect = this.ground.getChildren()[0] as Phaser.GameObjects.Rectangle;
      if (groundRect) {
        const groundWidth = width * 3;
        groundRect.setPosition(0, this.groundY);
        groundRect.setSize(groundWidth, groundHeight);
        if (groundRect.body) {
          const body = groundRect.body as Phaser.Physics.Arcade.StaticBody;
          body.setSize(groundWidth, groundHeight);
          body.setOffset(0, 0);
          // CRITICAL: Update body position to match groundY
          body.x = 0;
          body.y = this.groundY;
        }
      }
    }
    
    // Ensure camera shows full world
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setScroll(0, 0);
    
    // CRITICAL: Reposition player at ground level before starting game
    // This ensures player is always on ground, especially after orientation changes
    // Note: Player positioning will be handled in the code block below after scaling
    
    this.isGameStarted = true;
    this.isGameOver = false;
    this.energy = GameConfig.energy.initial;
    this.combo = 0;
    
    console.log('✅ Game started:', {
      isGameStarted: this.isGameStarted,
      isGameOver: this.isGameOver,
      energy: this.energy,
      playerExists: !!this.player,
      playerVisible: this.player?.visible,
      playerX: this.player?.x?.toFixed(1),
      playerY: this.player?.y?.toFixed(1)
    });
    this.distance = 0;
    this.gameSpeed = GameConfig.speed.initial;
    this.grinchScore = 0;
    this.elfScore = 0;
    
    // Reset camera fade/effects to ensure visibility
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);
    
    // Reset player position - use actual game world width, not camera width
    // With origin (0.5, 1), sprite.y is the bottom/feet position
    // Position sprite.y = groundY to place feet at ground level
    if (this.player?.body) {
      const playerX = width * 0.25; // 25% from left edge
      
      // Ensure player scale is correct for current screen size
      const isMobile = width <= 768 || height <= 768;
      const characterHeightRatio = isMobile ? 0.198 : 0.15;
      const targetHeight = height * characterHeightRatio;
      const playerScale = targetHeight / 160;
      this.player.setScale(playerScale);
      
      // Position sprite at ground level - with origin (0.5, 1), sprite.y is the bottom/feet
      // Setting sprite.y = groundY places feet exactly on ground surface
      // Phaser's collider will automatically keep the player on the ground
      this.player.setPosition(playerX, this.groundY);
      
      // CRITICAL: Re-setup body after repositioning to ensure body bottom aligns with ground
      this.setupCharacterBody();
      
      // CRITICAL FIX: After setting position and body, ensure sprite and body are aligned
      // The sprite.y should be at groundY (feet position with origin 0.5, 1)
      // The body bottom should also be at groundY
      this.player.setPosition(playerX, this.groundY);
      
      // Re-setup body again after final position is set
      this.setupCharacterBody();
      
      // CRITICAL FIX for Mobile: Verify body height is correct (Phaser sometimes reports wrong values)
      const spriteHeight = this.player.displayHeight;
      const expectedBodyHeight = spriteHeight * 0.85;
      if (Math.abs(this.player.body.height - expectedBodyHeight) > 5) {
        // Body height is wrong - force correct value
        this.player.body.height = expectedBodyHeight;
        // Recalculate body position with correct height
        const spriteTopLeftY = this.player.y - spriteHeight;
        const offsetY = spriteHeight - expectedBodyHeight;
        this.player.body.y = spriteTopLeftY + offsetY;
        console.warn('⚠️ Mobile: Corrected body height from', this.player.body.height.toFixed(1), 'to', expectedBodyHeight.toFixed(1));
      }
      
      // Verify and fix body bottom alignment
      const bodyBottom = this.player.body.y + this.player.body.height;
      if (Math.abs(bodyBottom - this.groundY) > 0.5) {
        // Calculate correct body position
        const spriteHeight = this.player.displayHeight;
        const bodyHeight = this.player.body.height;
        const offsetY = this.player.body.offset.y;
        const spriteTopLeftY = this.player.y - spriteHeight;
        const correctBodyY = spriteTopLeftY + offsetY;
        
        // Set body position directly
        this.player.body.y = correctBodyY;
        
        // Verify again
        const newBodyBottom = this.player.body.y + this.player.body.height;
        if (Math.abs(newBodyBottom - this.groundY) > 0.5) {
          // Last resort: adjust body position to match groundY
          this.player.body.y += (this.groundY - newBodyBottom);
        }
        
        console.log('🔧 startGame() corrected body position:', {
          oldBodyBottom: bodyBottom.toFixed(1),
          newBodyBottom: (this.player.body.y + this.player.body.height).toFixed(1),
          groundY: this.groundY.toFixed(1),
          spriteY: this.player.y.toFixed(1)
        });
      }
      
      // CRITICAL: Ensure sprite position matches groundY (in case body adjustment moved things)
      if (Math.abs(this.player.y - this.groundY) > 0.5) {
        this.player.setPosition(playerX, this.groundY);
        this.setupCharacterBody();
      }
      
      // Reset all velocities to prevent falling or movement
      this.player.body.setVelocity(0, 0);
      
      console.log('✅ startGame() player repositioned:', {
        playerX: this.player.x.toFixed(1),
        playerY: this.player.y.toFixed(1),
        groundY: this.groundY.toFixed(1),
        bodyY: this.player.body.y.toFixed(1),
        bodyBottom: (this.player.body.y + this.player.body.height).toFixed(1),
        match: Math.abs((this.player.body.y + this.player.body.height) - this.groundY) < 1 ? '✅' : '❌'
      });
    }
    
    this.jumpsRemaining = 2;
    
    this.obstacles.clear(true, true);
    this.obstaclesPassed.clear();
    this.floatingObstacles.clear(true, true);
    this.projectileObstacles.clear(true, true);
    this.collectibles.clear(true, true);
    this.specialCollectibles.forEach(obj => obj.destroy());
    this.specialCollectibles = [];
    this.messageBubbles.forEach(bubble => bubble.container.destroy());
    this.messageBubbles = [];
    
    this.obstacleTimer = 1000;
    this.floatingObstacleTimer = 2000;
    this.projectileObstacleTimer = 3000;
    this.collectibleTimer = 2000;
    this.specialCollectibleTimer = 5000;
    this.energyDrainTimer = 0;
    this.distanceTimer = 0;
    this.lowEnergyMessageTimer = 0;
    
    this.sprintMode = false;
    this.sprintTimer = 0;
    this.sprintGlow.setAlpha(0);
    
    // Reset music speed to normal when starting new game
    if (this.backgroundMusic && !this.isMuted) {
      try {
        this.currentMusicRate = GameConfig.audio.musicRateNormal;
        if ('setRate' in this.backgroundMusic) {
          (this.backgroundMusic as any).setRate(GameConfig.audio.musicRateNormal);
        } else if ('rate' in this.backgroundMusic) {
          (this.backgroundMusic as any).rate = GameConfig.audio.musicRateNormal;
        }
      } catch (error) {
        console.warn('⚠️ Failed to reset music speed on game start:', error);
      }
    }
    
    // Increase music volume for gameplay and ensure it plays
    // Higher volume on mobile for better audibility
    // Note: width and height are already declared at the start of this method
    
    // Initialize deadline at far left (off-screen) - position after scaling
    if (this.deadline && this.deadline.displayWidth) {
      this.deadlineX = -this.deadline.displayWidth - 200;
      this.deadline.x = this.deadlineX;
      this.deadline.y = 0;
    } else {
      // Fallback if deadline not scaled yet
      this.deadlineX = -500;
      this.deadline.x = -500;
      this.deadline.y = 0;
    }
    const isMobile = width <= 768 || height <= 768;
    const gameplayVolume = isMobile ? GameConfig.audio.musicVolumeGameplayMobile : GameConfig.audio.musicVolumeGameplayDesktop;
    if (this.backgroundMusic) {
      this.setMusicVolume(gameplayVolume);
      // Ensure audio context is resumed (required for mobile)
      const audioContext = this.getAudioContext();
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch((err) => {
          console.warn('⚠️ Failed to resume audio context:', err);
        });
      }
      if (!this.backgroundMusic.isPlaying && !this.isMuted) {
        try {
          this.backgroundMusic.play();
        } catch (error) {
          console.warn('⚠️ Failed to start music on game start:', error);
        }
      } else {
      }
    } else {
      console.warn('⚠️ Background music not loaded');
    }
    
    this.updateGameData();
  }

  resetGame() {
    this.isGameStarted = false;
    this.isGameOver = false;
    
    // Lower music volume for start screen and reset speed
    if (this.backgroundMusic) {
      this.setMusicVolume(0.2); // Low volume for start screen
      // Reset music speed to normal
      try {
        this.currentMusicRate = GameConfig.audio.musicRateNormal;
        if ('setRate' in this.backgroundMusic) {
          (this.backgroundMusic as any).setRate(GameConfig.audio.musicRateNormal);
        } else if ('rate' in this.backgroundMusic) {
          (this.backgroundMusic as any).rate = GameConfig.audio.musicRateNormal;
        }
      } catch (error) {
        console.warn('⚠️ Failed to reset music speed on game reset:', error);
      }
    }
    
    this.gameSpeed = GameConfig.speed.initial;
    this.distance = 0;
    this.energy = GameConfig.energy.initial;
    this.combo = 0;
    this.maxCombo = 0;
    this.grinchScore = 0;
    this.elfScore = 0;
    
    this.obstacleTimer = 1000;
    this.floatingObstacleTimer = 2000;
    this.projectileObstacleTimer = 3000;
    this.collectibleTimer = 2000;
    this.specialCollectibleTimer = 5000;
    this.energyDrainTimer = 0;
    this.distanceTimer = 0;
    this.lowEnergyMessageTimer = 0;
    
    this.obstacles.clear(true, true);
    this.obstaclesPassed.clear();
    this.floatingObstacles.clear(true, true);
    this.projectileObstacles.clear(true, true);
    this.collectibles.clear(true, true);
    this.specialCollectibles.forEach(obj => obj.destroy());
    this.specialCollectibles = [];
    
    // Reset player position - simple and correct
    // With origin (0.5, 1), sprite.y is the bottom/feet position
    // Position sprite.y = groundY to place feet at ground level
    if (this.player?.body) {
      const { width: screenWidth } = this.cameras.main;
      // Test with default body first - uncomment if you need custom body size
      // this.setupCharacterBody();
      // Position sprite at ground level - feet at groundY
      this.player.setPosition(screenWidth * 0.25, this.groundY);
      this.player.body.setVelocity(0, 0);
    }
    
    // Initialize deadline at top left
    const { width, height } = this.scale;
    this.deadlineX = width * 0.1;
    this.deadline.x = width * 0.1;
    this.deadline.y = height * 0.1;
    
    this.updateGameData();
  }

  createCollisionEffect(x: number, y: number) {
    for (let i = 0; i < 15; i++) {
      const particle = this.add.circle(x, y, Phaser.Math.Between(3, 6), Phaser.Math.RND.pick(explosionColors));
      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(100, 300);
      const velocityX = Math.cos(angle * Math.PI / 180) * speed;
      const velocityY = Math.sin(angle * Math.PI / 180) * speed;
      
      this.tweens.add({
        targets: particle,
        x: particle.x + velocityX * 0.5,
        y: particle.y + velocityY * 0.5,
        alpha: 0,
        scale: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  createCollectEffect(x: number, y: number, color: number) {
    for (let i = 0; i < 8; i++) {
      const particle = this.add.circle(x, y, Phaser.Math.Between(2, 5), color);
      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(50, 150);
      const velocityX = Math.cos(angle * Math.PI / 180) * speed;
      const velocityY = Math.sin(angle * Math.PI / 180) * speed;
      
      this.tweens.add({
        targets: particle,
        x: particle.x + velocityX * 0.3,
        y: particle.y + velocityY * 0.3,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
    
    const ring = this.add.circle(x, y, 5, color);
    ring.setStrokeStyle(2, color);
    ring.setFillStyle(color, 0);
    
    this.tweens.add({
      targets: ring,
      scale: 3,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => ring.destroy()
    });
  }

  createSpecialCollectEffect(x: number, y: number) {
    for (let i = 0; i < 25; i++) {
      const isRect = Math.random() > 0.5;
      const color = Phaser.Math.RND.pick(confettiColors);
      const size = Phaser.Math.Between(3, 8);
      
      const particle = isRect 
        ? this.add.rectangle(x, y, size, size, color)
        : this.add.circle(x, y, size / 2, color);
      
      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(150, 350);
      const velocityX = Math.cos(angle * Math.PI / 180) * speed;
      const velocityY = Math.sin(angle * Math.PI / 180) * speed;
      const rotationSpeed = Phaser.Math.Between(-10, 10);
      
      this.tweens.add({
        targets: particle,
        x: particle.x + velocityX * 0.6,
        y: particle.y + velocityY * 0.6 + 100,
        angle: rotationSpeed * 180,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
    
    for (let i = 0; i < 3; i++) {
      const ringColor = getColorTokenPhaser('white');
      const ring = this.add.circle(x, y, 5, ringColor);
      ring.setStrokeStyle(3, ringColor);
      ring.setFillStyle(ringColor, 0);
      
      this.tweens.add({
        targets: ring,
        scale: 4,
        alpha: 0,
        duration: 400 + (i * 100),
        ease: 'Power2',
        onComplete: () => ring.destroy()
      });
    }
  }

  // Helper method to get the correct animation name based on sprint mode and state
  private getAnimationName(isOnGround: boolean): string {
    if (this.sprintMode) {
      return isOnGround ? 'sprint-pushing' : 'sprint-ollie';
    } else {
      return isOnGround ? 'pushing' : 'ollie';
    }
  }

  activateSprintMode() {
    this.sprintMode = true;
    this.sprintTimer = GameConfig.sprint.duration;
    this.energy = GameConfig.sprint.energyRestore;
    this.sprintGlow.setAlpha(0.5);
    this.showMessage('💨 SPRINT MODE! UNSTOPPABLE!');
    
    // Switch to sprint animations
    const isOnGround = this.player.body.touching.down;
    const animationName = this.getAnimationName(isOnGround);
    if (this.anims.exists(animationName)) {
      this.player.play(animationName);
    }
    
    // Speed up music during sprint mode (overrides energy-based slowdown)
    if (this.backgroundMusic && !this.isMuted) {
      try {
        // Increase playback rate for sprint mode
        this.currentMusicRate = GameConfig.audio.musicRateSprint;
        if ('setRate' in this.backgroundMusic) {
          (this.backgroundMusic as any).setRate(GameConfig.audio.musicRateSprint);
        } else if ('rate' in this.backgroundMusic) {
          (this.backgroundMusic as any).rate = GameConfig.audio.musicRateSprint;
        }
      } catch (error) {
        console.warn('⚠️ Failed to speed up music:', error);
      }
    }
    
    // Speed up skateboard sound during sprint mode
    if (this.skateboardSound && this.skateboardSound.isPlaying) {
      try {
        if ('setRate' in this.skateboardSound) {
          (this.skateboardSound as any).setRate(1.5); // Faster during sprint
        } else if ('rate' in this.skateboardSound) {
          (this.skateboardSound as any).rate = 1.5;
        }
      } catch (error) {
        console.warn('⚠️ Failed to speed up skateboard sound:', error);
      }
    }
  }

  updateSprintMode(delta: number) {
    if (this.sprintMode) {
      this.sprintTimer -= delta;
      if (this.sprintTimer <= 0) {
        this.sprintMode = false;
        this.sprintGlow.setAlpha(0);
        
        // Switch back to regular animations
        const isOnGround = this.player.body.touching.down;
        const animationName = this.getAnimationName(isOnGround);
        if (this.anims.exists(animationName)) {
          this.player.play(animationName);
        }
        
        // Reset music speed back to normal (will be adjusted by energy-based slowdown if needed)
        if (this.backgroundMusic && !this.isMuted) {
          try {
            // Reset playback rate tracking - will be recalculated based on energy in update loop
            this.currentMusicRate = GameConfig.audio.musicRateNormal;
            if ('setRate' in this.backgroundMusic) {
              (this.backgroundMusic as any).setRate(GameConfig.audio.musicRateNormal);
            } else if ('rate' in this.backgroundMusic) {
              (this.backgroundMusic as any).rate = GameConfig.audio.musicRateNormal;
            }
          } catch (error) {
            console.warn('⚠️ Failed to reset music speed:', error);
          }
        }
        
        // Reset skateboard sound rate back to normal
        if (this.skateboardSound && this.skateboardSound.isPlaying) {
          try {
            if ('setRate' in this.skateboardSound) {
              (this.skateboardSound as any).setRate(1.2); // Back to normal faster rate
            } else if ('rate' in this.skateboardSound) {
              (this.skateboardSound as any).rate = 1.2;
            }
          } catch (error) {
            console.warn('⚠️ Failed to reset skateboard sound rate:', error);
          }
        }
      }
    }
  }

  private setupCharacterAnimation() {
    // Remove old animations if they exist
    if (this.anims.exists('pushing')) {
      this.anims.remove('pushing');
    }
    if (this.anims.exists('ollie')) {
      this.anims.remove('ollie');
    }
    if (this.anims.exists('sprint-pushing')) {
      this.anims.remove('sprint-pushing');
    }
    if (this.anims.exists('sprint-ollie')) {
      this.anims.remove('sprint-ollie');
    }
    
    // Create pushing animation (10 frames)
    const pushingFrames = [];
    for (let i = 1; i <= 10; i++) {
      const frameNumber = i.toString().padStart(2, '0');
      pushingFrames.push({ key: `character-pushing-${frameNumber}`, frame: 0 });
    }
    
    this.anims.create({
      key: 'pushing',
      frames: pushingFrames,
      frameRate: 12, // Adjust speed as needed
      repeat: -1
    });
    
    // Create ollie animation (10 frames)
    const ollieFrames = [];
    for (let i = 1; i <= 10; i++) {
      const frameNumber = i.toString().padStart(2, '0');
      ollieFrames.push({ key: `character-ollie-${frameNumber}`, frame: 0 });
    }
    
    this.anims.create({
      key: 'ollie',
      frames: ollieFrames,
      frameRate: 15, // Slightly faster for jump animation
      repeat: 0 // Don't loop - play once per jump
    });
    
    // Create sprint pushing animation (10 frames)
    const sprintPushingFrames = [];
    for (let i = 1; i <= 10; i++) {
      const frameNumber = i.toString().padStart(2, '0');
      sprintPushingFrames.push({ key: `sprint-character-pushing-${frameNumber}`, frame: 0 });
    }
    
    this.anims.create({
      key: 'sprint-pushing',
      frames: sprintPushingFrames,
      frameRate: 12, // Adjust speed as needed
      repeat: -1
    });
    
    // Create sprint ollie animation (10 frames)
    const sprintOllieFrames = [];
    for (let i = 1; i <= 10; i++) {
      const frameNumber = i.toString().padStart(2, '0');
      sprintOllieFrames.push({ key: `sprint-character-ollie-${frameNumber}`, frame: 0 });
    }
    
    this.anims.create({
      key: 'sprint-ollie',
      frames: sprintOllieFrames,
      frameRate: 15, // Slightly faster for jump animation
      repeat: 0 // Don't loop - play once per jump
    });
    
    // Set initial texture and start pushing animation
    // Note: Scale is already set in create() method based on screen size
    this.player.setTexture('character-pushing-01');
    this.player.play('pushing');
  }

  private updateMessageBubblePositions() {
    const { width } = this.scale;
    const isMobile = width <= 768;
    const bubbleSpacing = 15; // Increased spacing
    this.messageBubbles.sort((a, b) => a.id - b.id);
    
    // Move bubbles higher on mobile for better visibility
    let offsetY = isMobile ? -120 : -100; // Higher above player on mobile
    const offsetX = 50; // More to the right
    
    for (const bubble of this.messageBubbles) {
      const bubbleHeight = bubble.height || bubble.text.height + 16; // Use stored height or fallback
      
      bubble.container.setPosition(
        this.player.x + offsetX, 
        this.player.y + offsetY - bubbleHeight / 2
      );
      
      bubble.timer -= this.game.loop.delta;
      if (bubble.timer <= 0) {
        this.tweens.add({
          targets: bubble.container,
          alpha: 0,
          y: bubble.container.y - 20,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            bubble.container.destroy();
            this.messageBubbles = this.messageBubbles.filter(b => b.id !== bubble.id);
          }
        });
      }
      
      offsetY -= (bubbleHeight + bubbleSpacing);
    }
  }

  private createParallaxBackground() {
    const { width, height } = this.scale;
    
    // Scale building sizes relative to screen
    for (let i = 0; i < 8; i++) {
      const buildingWidth = Phaser.Math.Between(width * 0.031, width * 0.063); // ~3.1% to 6.3% of screen width
      const buildingHeight = Phaser.Math.Between(height * 0.093, height * 0.185); // ~9.3% to 18.5% of screen height
      const building = this.add.rectangle(
        Phaser.Math.Between(0, width * 2),
        this.groundY - (buildingHeight / 2), // Position relative to ground
        buildingWidth,
        buildingHeight,
        getElementColorPhaser('backgroundBuilding')
      );
      building.setDepth(-100);
      building.setAlpha(0.4);
      this.backgroundBuildings.push(building);
    }
    
    // Scale cloud sizes relative to screen
    for (let i = 0; i < 6; i++) {
      const cloudWidth = Phaser.Math.Between(width * 0.042, width * 0.073); // ~4.2% to 7.3% of screen width
      const cloudHeight = Phaser.Math.Between(height * 0.028, height * 0.046); // ~2.8% to 4.6% of screen height
      const cloud = this.add.ellipse(
        Phaser.Math.Between(0, width * 2),
        Phaser.Math.Between(height * 0.1, height * 0.4),
        cloudWidth,
        cloudHeight,
        getElementColorPhaser('backgroundCloud')
      );
      cloud.setDepth(-80);
      cloud.setAlpha(0.3);
      this.backgroundClouds.push(cloud);
    }
  }

  private updateVignette() {
    if (!this.vignette) return;
    
    // Calculate vignette intensity based on energy
    let vignetteAlpha = 0;
    if (this.energy < GameConfig.effects.vignetteStartEnergy) {
      // Calculate progress: 0 to 1 as energy goes from startEnergy to 0
      const progress = 1 - (this.energy / GameConfig.effects.vignetteStartEnergy); // 0 to 1
      // Use exponential curve (ease-in) for more dramatic darkening at low energy
      const curvedProgress = Math.pow(progress, GameConfig.effects.vignetteCurve); // Exponential curve
      vignetteAlpha = curvedProgress * GameConfig.effects.vignetteMaxAlpha;
    }
    
    // Update vignette alpha (the PNG already has the vignette effect built in)
    this.vignette.setAlpha(vignetteAlpha);
    
    // Update vignette size on screen resize (ensure full coverage)
    const { width, height } = this.scale;
    this.vignette.setPosition(width / 2, height / 2);
    const maxDimension = Math.max(width, height);
    this.vignette.setDisplaySize(maxDimension, maxDimension); // Scale to cover screen
  }

  private handleResize() {
    // With RESIZE mode, game world adapts to screen size
    // CRITICAL FIX for iPhone Pro Max: Validate dimensions before use
    // Everything scales proportionally based on actual screen dimensions
    let { width, height } = this.scale; // These are the actual game world dimensions (adapts to screen)
    
    // Validate dimensions - ensure they're valid (prevents issues on iPhone Pro Max)
    if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
      console.warn('⚠️ Invalid dimensions in handleResize, using fallback:', width, height);
      // RESPONSIVE: 1920x1080 used as fallback reference only, not a fixed size
      // Actual game world will scale to match container dimensions via RESIZE mode
      width = window.innerWidth || width || 1920;
      height = window.innerHeight || height || 1080;
      // Force resize to valid dimensions
      this.scale.resize(width, height);
    }
    
    // Update camera bounds to match game world
    // With RESIZE mode, camera automatically shows full world - viewport is managed by scale manager
    if (this.cameras && this.cameras.main) {
      this.cameras.main.setBounds(0, 0, width, height);
      this.cameras.main.setBackgroundColor(getElementColorPhaser('background'));
      // Reset camera scroll to origin to ensure full world is visible (ground at bottom)
      this.cameras.main.setScroll(0, 0);
    }
    
    // Update gravity - scale based on actual screen height for consistent physics
    // Use a reference height (1080) as base, then scale proportionally
    // Lighter gravity on mobile for better jump feel
    const isMobileResize = width <= 768 || height <= 768;
    const mobileGravityMultiplier = isMobileResize ? 0.92 : 1.0; // 8% less gravity on mobile (more than config's 0.98)
    const resizeBaseGravity = 2200;
    // Scale gravity proportionally to screen height (maintains physics feel across screen sizes)
    const resizeScaledGravity = resizeBaseGravity * (height / GameConfig.physics.baseGravityHeight) * mobileGravityMultiplier;
    this.physics.world.gravity.y = resizeScaledGravity;
    
    // Also update player body gravity if player exists
    if (this.player && this.player.body) {
      this.player.body.setGravityY(resizeScaledGravity);
    }
    
    // Reposition ground at new bottom - responsive to aspect ratio
    // CRITICAL FIX for Safari Mobile: Ensure ground is always within visible bounds
    // Special handling for short viewports (like 750x402) where height is very limited
    const aspectRatio = width / height;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIPhoneProMax = /iPhone/.test(navigator.userAgent) && (window.screen.height >= 926 || window.screen.width >= 926);
    const isShortViewport = height < 500; // CRITICAL: Detect very short viewports (like 402px height)
    
    // CRITICAL FIX: For very short viewports, use larger ground ratio to ensure visibility
    let groundHeightRatio = 0.15; // Default 15%
    
    if (isShortViewport) {
      // Very short viewport (height < 500px) - use larger ground ratio
      if (aspectRatio > 1.8) {
        groundHeightRatio = 0.30; // 30% for wide + short viewports
      } else {
        groundHeightRatio = 0.25; // 25% for short viewports
      }
    } else if (aspectRatio > 2.2) {
      groundHeightRatio = (isSafari || isIPhoneProMax) ? 0.24 : 0.22; // 24% on Safari/Pro Max, 22% otherwise
    } else if (aspectRatio > 1.8) {
      groundHeightRatio = (isSafari || isIPhoneProMax) ? 0.20 : 0.18; // 20% on Safari/Pro Max, 18% otherwise
    } else if (isSafari || isIPhoneProMax) {
      groundHeightRatio = 0.17; // 17% on Safari/Pro Max for normal screens
    }
    const groundHeight = height * groundHeightRatio; // Scale proportionally
    this.groundY = height - groundHeight; // Ground top edge at this Y position
    
    // CRITICAL: Ensure groundY is within valid bounds (0 to height)
    // This prevents ground from being positioned off-screen on iPhone Pro Max
    if (this.groundY < 0) {
      console.warn('⚠️ Ground Y position is negative in resize, adjusting:', this.groundY);
      this.groundY = Math.max(0, height * 0.85); // Ensure ground is at least 15% from bottom
    }
    if (this.groundY >= height) {
      console.warn('⚠️ Ground Y position exceeds height in resize, adjusting:', this.groundY, height);
      this.groundY = height * 0.85; // Ensure ground is at least 15% from bottom
    }
    
    const groundWidth = width * 3; // Ground width extends 3x screen width
    
    // Update ground rectangle - MUST position at groundY (not groundCenterY) since origin is (0,0)
    if (this.ground) {
      const groundRect = this.ground.getChildren()[0] as Phaser.GameObjects.Rectangle;
      if (groundRect) {
        // Position at groundY (top-left origin, so this is the top of the ground)
        groundRect.setPosition(0, this.groundY);
        groundRect.setSize(groundWidth, groundHeight);
        
        // Update physics body - body should match sprite exactly (full height, no offset)
        if (groundRect.body) {
          const body = groundRect.body as Phaser.Physics.Arcade.StaticBody;
          // Body matches sprite exactly - full height, no offset
          body.setSize(groundWidth, groundHeight);
          body.setOffset(0, 0); // No offset with (0,0) origin
          // CRITICAL: Update body position to match groundY
          body.x = 0;
          body.y = this.groundY;
        }
      }
    }
    
    // Update player position and scale - scale proportionally with screen size
    if (this.player) {
      const playerX = width * 0.25; // Keep at 25% from left (proportional)
      
      // Rescale player proportionally to screen height - 10% bigger on mobile
      // CRITICAL FIX for short viewports: Reduce character size if viewport is very short
      const isMobile = width <= 768 || height <= 768;
      // Note: isShortViewport is already declared above in ground setup section
      
      // For short viewports, use smaller character to ensure it fits above ground
      let characterHeightRatio = isMobile ? 0.198 : 0.15; // 19.8% on mobile (10% bigger), 15% on desktop
      if (isShortViewport) {
        // Reduce character size for short viewports to ensure it fits
        characterHeightRatio = isMobile ? 0.15 : 0.12; // Smaller on short viewports
      }
      
      const targetHeight = height * characterHeightRatio;
      const playerScale = targetHeight / 160; // 160 is the raw image height
      this.player.setScale(playerScale);
      
      // Recalculate player position - with origin (0.5, 1), sprite.y is the bottom
      // Position at groundY to ensure feet align with ground surface
      // Always update position, even if game hasn't started, to ensure visibility
      // Phaser's collider will automatically keep the player on the ground
      this.player.setPosition(playerX, this.groundY);
      
      // CRITICAL FIX for iPhone Pro Max: Verify player is fully visible after resize
      const playerHeight = this.player.displayHeight || targetHeight;
      const playerTopY = this.groundY - playerHeight;
      
      if (playerTopY < 0) {
        // Character would be cut off at top - adjust position or scale
        console.warn('⚠️ Character would be cut off after resize, adjusting:', {
          groundY: this.groundY,
          playerHeight: playerHeight,
          playerTopY: playerTopY,
          screenHeight: height
        });
        
        // Adjust ground position if possible
        const minGroundY = playerHeight + 10; // Leave 10px margin
        if (minGroundY < height * 0.9) {
          this.groundY = minGroundY;
          // Update ground
          const groundRect = this.ground.getChildren()[0] as Phaser.GameObjects.Rectangle;
          if (groundRect) {
            const newGroundHeight = height - this.groundY;
            groundRect.setPosition(0, this.groundY);
            groundRect.setSize(width * 3, newGroundHeight);
            if (groundRect.body) {
              const body = groundRect.body as Phaser.Physics.Arcade.StaticBody;
              body.setSize(width * 3, newGroundHeight);
              // CRITICAL: Update body position to match groundY
              body.x = 0;
              body.y = this.groundY;
            }
          }
          // Reposition player
          this.player.setPosition(playerX, this.groundY);
        } else {
          // Reduce character scale if needed
          const maxPlayerHeight = height * 0.8;
          const adjustedScale = (maxPlayerHeight / 160);
          this.player.setScale(adjustedScale);
          // Reposition at adjusted scale
          this.player.setPosition(playerX, this.groundY);
        }
      }
      
      // Reset velocity to prevent sinking
      if (this.player.body) {
        this.player.body.setVelocityY(0);
        this.player.body.setVelocityX(0);
      }
    }
    
    // Update deadline position and scale - far left, moves right as energy decreases
    if (this.deadline && this.deadline.texture && this.deadline.frame) {
      this.deadline.setOrigin(0, 0); // Top-left aligned
      // Scale deadline to full screen height (preserve aspect ratio)
      const frame = this.deadline.frame;
      const aspectRatio = frame.width / frame.height;
      // Always use full height
      const deadlineHeight = height;
      const deadlineWidth = deadlineHeight * aspectRatio;
      this.deadline.setDisplaySize(deadlineWidth, deadlineHeight);
      // Position deadline at top of screen (y = 0) and far left (or current position if game is running)
      if (!this.isGameStarted || this.isGameOver) {
        this.deadline.setPosition(-this.deadline.displayWidth - 200, 0);
        this.deadlineX = this.deadline.x;
      } else {
        this.deadline.setPosition(this.deadlineX, 0);
      }
    }
    
    
    // Update vignette on resize
    if (this.vignette) {
      this.vignette.setPosition(width / 2, height / 2);
      const maxDimension = Math.max(width, height);
      this.vignette.setDisplaySize(maxDimension, maxDimension); // Scale to cover screen
    }
    
    // Update parallax buildings if needed
    // Buildings will reposition themselves during update loop
  }
}