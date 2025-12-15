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
  ],
  'Obstacle-05': [
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
  'Santa just handed me the express lane. GO.',
  'I\'m sprinting. The Grinch is trembling.',
  'North Pole turbo unlocked, outrun every deadline.',
  'Combo cracked! I\'m faster than Santa on the 24th.',
  'Holiday hyper-speed: engaged. The Grinch can\'t keep up.',
  'My momentum just got wrapped and delivered.',
  'Elf-powered boost activated.',
  'Combo miracle! Even Santa\'s impressed.',
  'Festive frenzy mode: ON. Deadlines fear you now.',
  'I\'m officially on Santa\'s speed list!',
  'I\'m running so fast the Grinch filed a complaint.',
  'Combo unlocked! Santa said, "Finally, someone useful."',
  'My speed just made Rudolph insecure.',
  'The elves can\'t keep up!',
  'Turbo mode: I\'m basically Santa\'s Wi-Fi now.',
  'Combo cracked, HR is drafting my "Elf of the Month" post.',
  'I\'m speeding up. Even Santa\'s beard is blown back.',
  'This speed is illegal in all North Pole districts.',
  'Combo achieved! Make the Grinch rage-quit.',
  'Santa saw my speed and whispered… "Ho-ho-HOLY MOLY!"',
  'Boost activated. I\'m running like the deadline is watching!'
];

export class GameScene extends Phaser.Scene {
  private readonly SAFARI_FIXED_WIDTH = 400; // Portrait width for Safari mobile
  private readonly SAFARI_FIXED_HEIGHT = 700; // Portrait height for Safari mobile
  private lastJumpTime: number = 0;
  private jumpCooldown: number = 300; // 300ms cooldown between jumps
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.GameObjects.Group;
  private floatingObstacles!: Phaser.GameObjects.Group;
  private projectileObstacles!: Phaser.GameObjects.Group;
  private collectibles!: Phaser.GameObjects.Group;
  private collectibleImageKeys: string[] = [];
  private obstacleImageKeys: string[] = [];
  private parallaxImageKeys: string[] = [];
  private deadline!: Phaser.GameObjects.Image;
  
  private distance: number = 0;
  private energy: number = GameConfig.energy.initial;
  private combo: number = 0;
  private maxCombo: number = 0;
  private grinchScore: number = 0;
  private elfScore: number = 0;
  
  private gameSpeed: number = GameConfig.speed.initial;
  private initialSpeedBoostTimer: number = 0;
  
  private sprintMode: boolean = false;
  private sprintTimer: number = 0;
  private sprintGlow!: Phaser.GameObjects.Rectangle;
  private vignette!: Phaser.GameObjects.Image;
  
  private jumpsRemaining: number = 2;
  
  private isGameStarted: boolean = false;
  private isGameOver: boolean = false;
  private groundY: number = 0;
  private assetsLoaded: boolean = false; // Track if assets are fully loaded
  private lastAnimationKey: string = ''; // Track last animation we tried to play (not what's currently playing)
  private animationSwitchCooldown: number = 0; // Cooldown to prevent rapid switching (in frames)
  private animationState: 'pushing' | 'ollie' = 'pushing'; // Current animation state
  private animationStateChangeTime: number = 0; // Time when animation state last changed (for cooldown)
  private touchingGroundHistory: boolean[] = []; // Track touchingGround over last 5 frames for stable detection
  private visualViewportResizeTimer: NodeJS.Timeout | null = null; // Timer for visual viewport resize debouncing
  private visualViewportResizeHandler: (() => void) | null = null; // Handler for visual viewport resize events
  private isInitializing: boolean = true; // Flag to prevent visual viewport resize during initialization
  private zeroEnergyStartTime: number | null = null; // Fallback timer to end game if energy stays at 0
  
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
    
    // CRITICAL FIX: Also update the body's size property directly
    // Phaser Arcade Physics uses these properties for collision detection
    if (this.player.body.setSize) {
      this.player.body.setSize(bodyWidth, bodyHeight, false); // false = don't center
    }
    
    // Verify body size was set correctly
    if (Math.abs(this.player.body.width - bodyWidth) > 0.1 || Math.abs(this.player.body.height - bodyHeight) > 0.1) {
      // Force directly - sometimes Phaser's setSize doesn't work
      // Use type casting to access read-only properties
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
      // Force correct body height using type casting (read-only property)
      (this.player.body as any).height = bodyHeight;
      // Recalculate body position with correct height
      const correctedBodyY = spriteTopLeftY + offsetY;
      this.player.body.y = correctedBodyY;
    }
    
    // Final verification
    const finalBodyBottom = this.player.body.y + this.player.body.height;
    if (Math.abs(finalBodyBottom - this.player.y) > 0.5) {
      // Last resort: directly set body position to align bottom with sprite.y
      this.player.body.y = this.player.y - this.player.body.height;
    }
    
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
  
  private backgroundBuildings: Phaser.GameObjects.Image[] = [];
  private backgroundClouds: Phaser.GameObjects.Image[] = [];
  private cloudImageKeys: string[] = [];
  
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

  private isSafariMobile(): boolean {
    const ua = navigator.userAgent;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua);
    const isMobile = /iPhone|iPad|iPod/.test(ua);
    return isSafari && isMobile;
  }

  init() {
    // Only attach resize handling for non-Safari mobile
    if (!this.isSafariMobile()) {
      this.scale.on('resize', this.handleResize, this);
      
      // CRITICAL FIX for Safari Mobile: Listen for visual viewport changes
      // This handles Safari UI (address bar, tab bar) changes when multiple tabs are open
      if (window.visualViewport) {
        // Store the handler so we can remove it later
        this.visualViewportResizeHandler = () => {
          // Debounce resize to prevent excessive updates
          if (this.visualViewportResizeTimer) {
            clearTimeout(this.visualViewportResizeTimer);
          }
          this.visualViewportResizeTimer = setTimeout(() => {
            this.handleVisualViewportResize();
          }, 100);
        };
        window.visualViewport.addEventListener('resize', this.visualViewportResizeHandler);
      }
    }
  }
  
  private handleVisualViewportResize() {
    if (!window.visualViewport) return;
    
    // CRITICAL: Don't resize during initialization - wait until create() is complete
    if (this.isInitializing) {
      return;
    }
    
    // Get actual visible viewport dimensions (accounts for Safari UI)
    const visibleWidth = window.visualViewport.width;
    const visibleHeight = window.visualViewport.height;
    
    // Only resize if dimensions are valid and different from current
    if (visibleWidth > 0 && visibleHeight > 0 && 
        (Math.abs(this.scale.width - visibleWidth) > 5 || Math.abs(this.scale.height - visibleHeight) > 5)) {
      // Resize game to match visible viewport
      this.scale.resize(visibleWidth, visibleHeight);
      // Trigger handleResize to update all game elements
      this.handleResize();
    }
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
      'Obstacle-04',
      'Obstacle-05'
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
    
    // Load parallax background images
    const parallaxFiles = [
      'Parallax-01',
      'Parallax-02',
      'Parallax-03',
      'Parallax-04',
      'Parallax-05',
      'Parallax-06',
      'Parallax-07',
      'Parallax-08',
      'Parallax-09',
      'Parallax-10',
      'Parallax-11',
      'Parallax-12',
      'Parallax-13'
    ];
    
    parallaxFiles.forEach((name) => {
      const key = `parallax-${name.toLowerCase().replace(/\s+/g, '-')}`;
      const encodedName = encodeURIComponent(name);
      const path = `/Assets/Background/${encodedName}.png`;
      this.load.image(key, path);
      this.parallaxImageKeys.push(key);
    });
    
    // Load cloud images
    const cloudFiles = ['Cloud 1', 'Cloud 2'];
    cloudFiles.forEach((name) => {
      const key = `cloud-${name.toLowerCase().replace(/\s+/g, '-')}`;
      const encodedName = encodeURIComponent(name);
      const path = `/Assets/Background/${encodedName}.png`;
      this.load.image(key, path);
      this.cloudImageKeys.push(key);
    });
    
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
      
      // CRITICAL: Set texture filtering for crisp rendering (prevents pixelation)
      // Apply LINEAR filtering to all textures for smooth scaling
      Object.keys(this.textures.list).forEach(key => {
        const texture = this.textures.get(key);
        if (texture) {
          texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        }
      });
      
      this.game.events.emit('assetsLoaded');
    });
    
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      // Still emit progress even on error to continue
      this.game.events.emit('loadingProgress', this.load.progress);
    });
  }

  // Get a safe viewport height that won't shrink the game world excessively on Safari
  // Returns visualViewport.height only if it's reasonable; otherwise falls back to scale height
  private getReliableViewportHeight(): number {
    const scaleHeightRaw = this.scale?.height || 0;
    const scaleHeight = scaleHeightRaw > 0 ? scaleHeightRaw : (window.innerHeight || 1080);
    const visualHeight = (window.visualViewport && window.visualViewport.height > 0) ? window.visualViewport.height : 0;
    const minHeight = 300; // Minimum usable height
    const minScaleRatio = 0.7; // Visual height must be at least 70% of scale height

    if (visualHeight >= minHeight && visualHeight >= scaleHeight * minScaleRatio) {
      return visualHeight;
    }

    return scaleHeight;
  }

  // Late-game difficulty multiplier based on distance.
  // After 1500m, obstacle spawn intervals gradually shrink (more frequent obstacles),
  // reaching 50% of their normal value by 2500m+.
  private getLateGameIntervalMultiplier(): number {
    const lateGameStart = 1500;
    const lateGameEnd = 2500;
    if (this.distance <= lateGameStart) return 1;
    const progress = Math.min(1, (this.distance - lateGameStart) / (lateGameEnd - lateGameStart));
    const minMultiplier = 0.5; // At full late-game, intervals are 50% (twice as many obstacles)
    return 1 - progress * (1 - minMultiplier);
  }

  create() {
    // EMERGENCY FIX: Absolute basics for Safari mobile
    const isSafariMobile = this.isSafariMobile();
    let { width, height } = this.scale;
    
    // For Safari mobile: use portrait dimensions
    if (isSafariMobile) {
      width = 400;  // Portrait width
      height = 700; // Portrait height
      // Don't call resize - let Phaser handle it with FIT mode
    } else {
      // Desktop/other mobile: keep existing dynamic logic
      this.isInitializing = true;
      const reliableHeight = this.getReliableViewportHeight();
      if (reliableHeight !== height) {
        height = reliableHeight;
        this.scale.resize(width, height);
      }
      
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isMobile = width <= 768 || height <= 768;
      
      if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
        if (window.visualViewport && window.visualViewport.width > 0 && window.visualViewport.height > 0) {
          width = window.visualViewport.width;
          height = window.visualViewport.height;
        } else {
          width = window.innerWidth || 1920;
          height = window.innerHeight || 1080;
        }
        this.scale.resize(width, height);
      }
      
      if (isSafari && isMobile) {
        const minWidth = 300;
        const minHeight = 400;
        const maxWidth = 2000;
        const maxHeight = 2000;
        
        if (width < minWidth || width > maxWidth) {
          width = Math.max(minWidth, Math.min(maxWidth, width || window.innerWidth || 750));
          this.scale.resize(width, height);
        }
        if (height < minHeight || height > maxHeight) {
          height = Math.max(minHeight, Math.min(maxHeight, height || window.innerHeight || 402));
          this.scale.resize(width, height);
        }
      }
    }

    // Set camera bounds to match actual canvas size
    // With RESIZE mode, the camera automatically shows the full game world (0, 0, width, height)
    // The camera viewport is automatically managed by Phaser's scale manager in RESIZE mode
    if (isSafariMobile) {
      // Safari mobile: portrait orientation - fixed dimensions
      const safariWidth = 400;
      const safariHeight = 700;
      this.physics.world.setBounds(0, 0, safariWidth, safariHeight);
      this.cameras.main.setBounds(0, 0, safariWidth, safariHeight);
      this.cameras.main.setBackgroundColor(getElementColorPhaser('background'));
      // Safari mobile: FIXED camera, no scrolling, no following
      this.cameras.main.setScroll(0, 0);
      this.cameras.main.scrollX = 0;
      this.cameras.main.scrollY = 0;
      this.cameras.main.stopFollow();
    } else {
      this.cameras.main.setBounds(0, 0, width, height);
      this.cameras.main.setBackgroundColor(getElementColorPhaser('background')); // White background
      // Desktop: allow camera setup as normal
      this.cameras.main.setScroll(0, 0);
      this.cameras.main.setViewport(0, 0, width, height);
      this.cameras.main.setDeadzone(0, 0); // No deadzone - show full world
    }
    
    
    // Set physics world bounds to match canvas size
    this.physics.world.setBounds(0, 0, width, height);
    
    // Configure physics for smooth, consistent updates
    this.physics.world.timeScale = 1.0; // Normal time scale for consistent physics
    
    // Scale gravity relative to screen height for responsive jump physics
    // Reduced gravity for lighter, more responsive feel
    const isMobile = width <= 768 || height <= 768;
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

    // GROUND SETUP - Portrait orientation for Safari mobile
    const FIXED_GAME_WIDTH = 400;  // Portrait width
    const FIXED_GAME_HEIGHT = 700; // Portrait height
    
    let groundHeight: number;
    let groundWidth: number;
    
    if (isSafariMobile) {
      // Safari mobile: portrait orientation
      groundHeight = 100;
      // Position ground at the actual bottom of the viewport
      this.groundY = height - groundHeight; // Use actual height, not fixed
      groundWidth = FIXED_GAME_WIDTH * 2; // Only 2x width for vertical
    } else {
      // Desktop: existing logic
      const aspectRatio = width / height;
      const isIPhoneProMax = /iPhone/.test(navigator.userAgent) && (window.screen.height >= 926 || window.screen.width >= 926);
      const isShortViewport = height < 500;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      let groundHeightRatio = 0.15;
      
      if (isShortViewport) {
        if (aspectRatio > 1.8) {
          groundHeightRatio = 0.20;
        } else {
          groundHeightRatio = 0.18;
        }
      } else if (aspectRatio > 2.2) {
        groundHeightRatio = (isSafari || isIPhoneProMax) ? 0.24 : 0.22;
      } else if (aspectRatio > 1.8) {
        groundHeightRatio = (isSafari || isIPhoneProMax) ? 0.20 : 0.18;
      } else if (isSafari || isIPhoneProMax) {
        groundHeightRatio = 0.17;
      }
      
      groundHeight = height * groundHeightRatio;
      this.groundY = height - groundHeight;
      groundWidth = width * 3;
    }
    
    // Create ground
    this.ground = this.physics.add.staticGroup();
    const groundColor = getElementColorPhaser('ground');
    
    if (isSafariMobile) {
      // Safari mobile: position ground at bottom with top-left origin
      const groundRect = this.add.rectangle(
        0,  // Start at left edge
        this.groundY,  // Top edge at groundY
        groundWidth,  // 800
        groundHeight,  // 100
        groundColor, 
        1.0
      );
      groundRect.setOrigin(0, 0);  // Top-left origin for proper positioning
      groundRect.setDepth(10);
      
      this.physics.add.existing(groundRect, true);
      
      // Set body to match top-left origin positioning
      if (groundRect.body) {
        const body = groundRect.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(groundWidth, groundHeight);
        body.setOffset(0, 0);
        body.x = 0;
        body.y = this.groundY;
      }
      
      this.ground.add(groundRect);
    } else {
      // Desktop: existing logic with top-left origin
      const groundRect = this.add.rectangle(0, this.groundY, groundWidth, groundHeight, groundColor, 1.0);
      groundRect.setDepth(10);
      groundRect.setOrigin(0, 0); // Top-left origin
      
      this.physics.add.existing(groundRect, true);
      if (groundRect.body) {
        const body = groundRect.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(groundWidth, groundHeight);
        body.setOffset(0, 0);
        body.x = 0;
        body.y = this.groundY;
      }
      this.ground.add(groundRect);
    }

    // PLAYER SETUP - Portrait orientation for Safari mobile
    if (isSafariMobile) {
      // Safari mobile: portrait orientation - smaller and left-aligned
      const PLAYER_SIZE = 60; // Smaller for better visibility (reduced from 80)
      const PLAYER_START_X = FIXED_GAME_WIDTH * 0.28; // Nudge right for clearer deadline runway
      const PLAYER_Y = this.groundY; // Position feet on ground (with bottom-center origin)
      
      this.player = this.physics.add.sprite(PLAYER_START_X, PLAYER_Y, 'character-pushing-01');
      this.player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);
      this.player.setOrigin(0.5, 1); // Bottom-center origin so feet align with ground
      this.player.setDepth(20);
      this.player.setVisible(true);
      
      // Ensure crisp rendering on high DPI displays
      if (this.player.texture) {
        this.player.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
      
      // Simple physics
      this.player.body.setCollideWorldBounds(true);
      this.player.body.setBounce(0.2);
      
      // For bottom-center origin sprites, adjust body positioning
      const bodyWidth = PLAYER_SIZE * 0.7;
      const bodyHeight = PLAYER_SIZE * 0.85;
      this.player.body.setSize(bodyWidth, bodyHeight);
      // Offset for bottom-center origin - body should be centered horizontally and positioned from bottom
      this.player.body.setOffset((PLAYER_SIZE - bodyWidth) / 2, PLAYER_SIZE - bodyHeight);
      
      // CRITICAL: Ensure character is positioned exactly on top of ground
      // With bottom-center origin, player.y should equal groundY for feet to be on ground
      // But we need to account for the body offset - position slightly above to ensure feet are on ground
      this.player.y = this.groundY;
      
      // Ensure body is properly positioned - body bottom should be at groundY
      // With bottom-center origin and body offset, we may need to adjust
      const bodyBottom = this.player.body.y + this.player.body.height;
      if (Math.abs(bodyBottom - this.groundY) > 2) {
        // Adjust player position to ensure body bottom aligns with ground
        const adjustment = this.groundY - bodyBottom;
        this.player.y += adjustment;
      }
      
    } else {
      // Desktop/other mobile: keep existing logic
      if (!this.textures.exists('character-pushing-01')) {
        const placeholder = this.add.rectangle(width * 0.25, height * 0.5, 40, 60, 0xff0000, 1.0);
        placeholder.setDepth(20);
      }
      
      const originalSpriteHeight = 160;
      const originalSpriteWidth = 160;
      const isMobilePlayer = width <= 768 || height <= 768;
      const isShortViewport = height < 500;
      let characterHeightRatio = isMobilePlayer ? 0.198 : 0.15;
      if (isShortViewport) {
        characterHeightRatio = isMobilePlayer ? 0.15 : 0.12;
      }
      const targetHeight = height * characterHeightRatio;
      const scale = targetHeight / originalSpriteHeight;
      
      this.player = this.physics.add.sprite(width * 0.25, 0, 'character-pushing-01');
      this.player.setDepth(20);
      const displayWidth = originalSpriteWidth * scale;
      const displayHeight = originalSpriteHeight * scale;
      this.player.setDisplaySize(displayWidth, displayHeight);
      this.player.setVisible(true);
      this.player.setAlpha(1.0);
      this.player.setOrigin(0.5, 1);
      
      if (this.player.texture) {
        this.player.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
      
      const playerX = width * 0.25;
      this.player.setPosition(playerX, this.groundY);
    }
    
    // EMERGENCY FIX: Absolute basics for Safari mobile - simple physics
    if (isSafariMobile) {
      // Safari mobile: absolute basics
      this.player.body.setCollideWorldBounds(true);
      this.player.body.setBounce(0.2);
    } else {
      // Desktop/other mobile: keep existing logic
      this.setupCharacterBody();
      
      const playerX = width * 0.25;
      const playerHeight = this.player.displayHeight;
      const playerTopY = this.groundY - playerHeight;
      
      if (playerTopY < 0) {
        const minGroundY = playerHeight + 10;
        if (minGroundY < height * 0.9) {
          this.groundY = minGroundY;
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
          this.player.setPosition(playerX, this.groundY);
        } else {
          const maxPlayerHeight = height * 0.8;
          const originalSpriteHeight = 160;
          const adjustedScale = maxPlayerHeight / originalSpriteHeight;
          const originalSpriteWidth = 160;
          const displayWidth = originalSpriteWidth * adjustedScale;
          const displayHeight = originalSpriteHeight * adjustedScale;
          this.player.setDisplaySize(displayWidth, displayHeight);
        }
      }
      
      const isMobilePlayer = width <= 768 || height <= 768;
      const mobileGravityReduction = isMobilePlayer ? 0.98 : 1.0;
      const playerBaseGravity = 2200;
      const playerScaledGravity = playerBaseGravity * (height / GameConfig.physics.baseGravityHeight) * mobileGravityReduction;
      this.player.body.setGravityY(playerScaledGravity);
      this.player.body.setBounce(0, 0);
      this.player.body.setCollideWorldBounds(false);
      this.player.body.setAllowGravity(true);
      this.player.body.setMaxVelocityY(1400);
      this.player.body.setDrag(200, 0);
      this.player.body.setVelocity(0, 0);
      this.player.body.setAllowGravity(false);
      this.setupCharacterBody();
    }
    
    // Add collider for all cases
    this.physics.add.collider(this.player, this.ground);

    // Setup animation
    if (this.textures.exists('character-pushing-01') && this.textures.exists('character-ollie-01')) {
      this.setupCharacterAnimation();
    } else {
      // Try to set a fallback texture or create a placeholder
      if (!this.textures.exists('character-pushing-01')) {
        // Create a simple colored rectangle as placeholder
        const placeholderX = isSafariMobile ? 100 : (width * 0.25);
        this.add.graphics()
          .fillStyle(0xff0000, 1)
          .fillRect(placeholderX - 20, this.groundY - 40, 40, 40)
          .setDepth(20);
      }
    }
    

    // Sprint glow effect
    if (isSafariMobile) {
      this.sprintGlow = this.add.rectangle(
        this.player.x, 
        this.player.y, 
        60, 
        80, 
        getElementColorPhaser('sprintGlow'),
        0
      );
    } else {
      // Desktop path: scale was defined earlier in the character setup
      const glowScale = (this.player.displayHeight || 160) / 160;
      const glowWidth = 60 * glowScale;
      const glowHeight = 80 * glowScale;
      this.sprintGlow = this.add.rectangle(
        this.player.x, 
        this.player.y, 
        glowWidth, 
        glowHeight, 
        getElementColorPhaser('sprintGlow'),
        0
      );
    }
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
      this.deadline.setPosition(-this.deadline.displayWidth - GameConfig.deadline.offsetFromPlayer, 0);
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
        audioContext.resume().catch(() => {
          // Could not resume audio context
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
        // Some sound effects may not be loaded yet
      }
    } catch (error) {
      // Failed to initialize sounds
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
        audioContext.resume().catch(() => {
          // Failed to resume audio context
        });
      }
      
      // Start music after unlock
      if (this.backgroundMusic && !this.backgroundMusic.isPlaying && !this.isMuted) {
        try {
          this.backgroundMusic.play();
        } catch (error) {
          // Failed to play music
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
    
    // CRITICAL: Mark initialization as complete to allow visual viewport resize
    // This prevents visual viewport resize from interfering during create()
    this.isInitializing = false;
    
    // Debug text removed - no longer needed
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
    
    // Reliable ground detection - use collision flags AND position-based detection
    // CRITICAL: Position-based detection is essential for Safari where collision flags can be unreliable
    const touchingGround = this.player.body.touching.down || this.player.body.blocked.down;
    // For Safari mobile with bottom-center origin, check if player.y is at or very close to groundY
    const distanceFromGround = Math.abs(this.player.y - this.groundY);
    const nearGround = distanceFromGround < 10; // Within 10px of ground (increased tolerance for Safari)
    const velocityDownward = this.player.body.velocity.y >= 0; // Not moving up
    // Use collision OR (position near ground AND not moving up) for reliable detection
    const onGround = touchingGround || (nearGround && velocityDownward);
    
    // Scale jump velocity relative to screen height for responsive jump physics
    const { width, height } = this.scale;
    let jumpVelocity: number;
    
    const isMobileJump = width <= 768 || height <= 768;
    // Use config value for mobile jump multiplier (reduced for better balance)
    const mobileJumpMultiplier = isMobileJump ? GameConfig.physics.mobileJumpMultiplier : 1.0;
    // Desktop: higher jump velocity for lighter, more responsive feel
    // Mobile: lower velocity for better balance
    const baseJumpVelocity = isMobileJump ? -1100 : -1300; // Desktop: -1300 for snappier feel, Mobile: -1100 for balance
    jumpVelocity = baseJumpVelocity * (height / GameConfig.physics.baseGravityHeight) * mobileJumpMultiplier;
    
    // Safari mobile: use proper scaling for 700px height screen
    if (this.isSafariMobile()) {
      // Safari mobile has fixed 700px height, so calculate jump properly
      // Reduced jump height for better balance on Safari mobile
      jumpVelocity = -450; // Lower jump height for Safari mobile (reduced from -600)
    }
    
    // CRITICAL: Allow jumping immediately when on ground, regardless of jumpsRemaining
    // This prevents delay when landing and trying to jump immediately
    // Reset jumpsRemaining if on ground to ensure we can always jump from ground
    if (onGround) {
      // Reset jumps immediately when on ground to allow instant jumping
      if (this.jumpsRemaining <= 0) {
        this.jumpsRemaining = 2;
      }
      
      // CRITICAL FIX: Check jump cooldown before allowing jump
      const canJump = (this.time.now - this.lastJumpTime) > this.jumpCooldown;
      
      // Allow jump from ground - always allow first jump when on ground
      if (this.jumpsRemaining > 0 && canJump) {
        // CRITICAL: Re-enable gravity when jumping
        this.player.body.setAllowGravity(true);
        this.player.body.setVelocityY(jumpVelocity);
        this.lastJumpTime = this.time.now; // Record jump time for cooldown
        this.jumpsRemaining = 1;
        // Switch to ollie animation when jumping
        // NOTE: Don't update animationState here - let the update loop handle it based on ground state
        // This prevents conflicts between jump handler and update loop
        const ollieAnim = this.getAnimationName(false);
        if (this.anims.exists(ollieAnim)) {
          this.player.play(ollieAnim, false); // Always restart from beginning
          // Don't update animationState here - update loop will handle it
          this.lastAnimationKey = ollieAnim;
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
            // Failed to play jump sound
          }
        }
        return; // Exit early after ground jump
      }
    }
    
    // Double jump - only allow if in air and have jumps remaining
    if (this.jumpsRemaining > 0 && !onGround) {
      // CRITICAL: Double jump - only allow if not on ground and have jumps remaining
      // Ensure gravity is enabled for double jump
      this.player.body.setAllowGravity(true);
      this.player.body.setVelocityY(jumpVelocity);
      this.lastJumpTime = this.time.now; // Record jump time for cooldown
      this.jumpsRemaining = 0;
      // Restart ollie animation for double jump
      // NOTE: Don't update animationState here - let the update loop handle it
      const ollieAnim = this.getAnimationName(false);
      if (this.anims.exists(ollieAnim)) {
        this.player.play(ollieAnim, false); // Always restart from beginning
        // Don't update animationState here - update loop will handle it
        this.lastAnimationKey = ollieAnim;
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
            // Failed to play jump sound
        }
      }
    }
  }

  spawnObstacle() {
    const { width, height } = this.scale;
    
    // Scale obstacle sizes relative to screen - ensure minimum speed on mobile
    const isMobileSpeed = width <= 768 || height <= 768;
    const baseSpeed = isMobileSpeed ? Math.max(width / 1920, 0.5) : width / 1920;
    
    // Pick a random obstacle image (only Obstacle-01, Obstacle-02, and Obstacle-05 for regular obstacles)
    const regularObstacleKeys = this.obstacleImageKeys.filter(key => 
      key.includes('obstacle-01') || key.includes('obstacle-02') || key.includes('obstacle-05')
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
    
    // Scale obstacle size relative to screen height
    const isMobile = width <= 768 || height <= 768;
    // Safari mobile: smaller obstacles (400x700 viewport needs smaller obstacles)
    const isSafariMobile = this.isSafariMobile();
    let baseObstacleSize: number;
    let maxObstacleSize: number;
    
    if (isSafariMobile) {
      // Safari mobile: much smaller obstacles for 700px height
      baseObstacleSize = height * 0.035; // 3.5% of height = 24.5px
      maxObstacleSize = 35; // Cap at 35px for Safari (reduced from 50px)
    } else if (isMobile) {
      baseObstacleSize = height * 0.0735; // 7.35% on mobile (5% bigger), 6% on desktop
      maxObstacleSize = 105; // Proportional cap on mobile (105px, 5% bigger) vs desktop (80px)
    } else {
      baseObstacleSize = height * 0.06; // 6% on desktop
      maxObstacleSize = 80; // Desktop cap
    }
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
    
    // CRITICAL FIX: Set origin based on platform
    if (this.isSafariMobile()) {
      // Safari mobile: use center origin to match player
      obstacle.setOrigin(0.5, 0.5);
      // Position obstacle center on ground surface
      const obstacleHeight = obstacle.displayHeight || 100;
      const obstacleY = this.groundY - (obstacleHeight / 2);
      obstacle.setPosition(width + 50, obstacleY);
    } else {
      // Desktop: use bottom origin (0.5, 1) - makes obstacle.y represent the bottom
      obstacle.setOrigin(0.5, 1);
      // Position obstacle.y = groundY to place bottom on ground surface
      obstacle.setPosition(width + 50, this.groundY);
    }
    obstacle.setDepth(10);
    
    // Note: Obstacles don't have physics bodies in this game (collision is checked via bounds)
    
    // Store obstacle name for collision messages
    obstacle.setData('obstacleName', obstacleName);
    this.obstacles.add(obstacle);
    
    // Scale obstacle speed relative to screen width
    const obstacleSpeed = -400 * baseSpeed;
    obstacle.setData('speed', obstacleSpeed);
    
    // Calculate difficulty based on distance - start easy, gradually increase
    const minInterval = GameConfig.obstacles.regular.spawnIntervalMin;
    const maxInterval = GameConfig.obstacles.regular.spawnIntervalMax;
    const rampDistance = GameConfig.obstacles.regular.difficultyRampDistance;
    
    // Start with intervals 6x longer than max, gradually decrease to configured values
    const startMaxInterval = maxInterval * 6;
    const startMinInterval = minInterval * 6;
    
    // Calculate difficulty progress (0 = start, 1 = full difficulty)
    const difficultyProgress = Math.min(1, this.distance / rampDistance);
    
    // Interpolate between easy start and full difficulty
    const currentMaxInterval = startMaxInterval - (difficultyProgress * (startMaxInterval - maxInterval));
    const currentMinInterval = startMinInterval - (difficultyProgress * (startMinInterval - minInterval));
    
    // Also factor in game speed for additional challenge (faster = shorter intervals)
    const speedFactor = Math.min(1, (this.gameSpeed - GameConfig.speed.initial) / GameConfig.speed.initial);
    // Speed adjustment: interpolate from current intervals toward min/max intervals (shorter = harder)
    const speedAdjustedMin = currentMinInterval - (speedFactor * (currentMinInterval - minInterval));
    const speedAdjustedMax = currentMaxInterval - (speedFactor * (currentMaxInterval - maxInterval));
    
    // Random spacing: wider variation at start (easy), tighter at end (hard)
    // Early game: 0.4x to 2.5x (very random, easy)
    // Late game: 0.6x to 1.8x (still varied but tighter, harder)
    const randomVariationMin = 0.4 + (difficultyProgress * 0.2); // 0.4 to 0.6
    const randomVariationMax = 2.5 - (difficultyProgress * 0.7); // 2.5 to 1.8
    const lateGameMultiplier = this.getLateGameIntervalMultiplier();
    this.obstacleTimer = Phaser.Math.Between(
      speedAdjustedMin * randomVariationMin * lateGameMultiplier,
      speedAdjustedMax * randomVariationMax * lateGameMultiplier
    );
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
      
      // Calculate difficulty based on distance - start easy, gradually increase
      const minInterval = GameConfig.obstacles.floating.spawnIntervalMin;
      const maxInterval = GameConfig.obstacles.floating.spawnIntervalMax;
      const unlockDistance = GameConfig.obstacles.floating.unlockDistance;
      const rampDistance = GameConfig.obstacles.floating.difficultyRampDistance;
      
      // Start with intervals 6x longer than max, gradually decrease to configured values
      const startMaxInterval = maxInterval * 6;
      const startMinInterval = minInterval * 6;
      
      // Calculate difficulty progress (0 = just unlocked, 1 = full difficulty)
      const distanceSinceUnlock = Math.max(0, this.distance - unlockDistance);
      const difficultyProgress = Math.min(1, distanceSinceUnlock / rampDistance);
      
      // Interpolate between easy start and full difficulty
      const currentMaxInterval = startMaxInterval - (difficultyProgress * (startMaxInterval - maxInterval));
      const currentMinInterval = startMinInterval - (difficultyProgress * (startMinInterval - minInterval));
      
      // Random spacing: wider variation at start (easy), tighter at end (hard)
      const randomVariationMin = 0.4 + (difficultyProgress * 0.2); // 0.4 to 0.6
      const randomVariationMax = 2.5 - (difficultyProgress * 0.7); // 2.5 to 1.8
      const lateGameMultiplier = this.getLateGameIntervalMultiplier();
      this.floatingObstacleTimer = Phaser.Math.Between(
        currentMinInterval * randomVariationMin * lateGameMultiplier,
        currentMaxInterval * randomVariationMax * lateGameMultiplier
      );
      return;
    }
    
    // Scale obstacle size relative to screen height
    const isMobile = width <= 768 || height <= 768;
    const isSafariMobile = this.isSafariMobile();
    let baseObstacleSize: number;
    let maxObstacleSize: number;
    
    if (isSafariMobile) {
      // Safari mobile: smaller floating obstacles
      baseObstacleSize = height * 0.04; // 4% of height = 28px
      maxObstacleSize = 40; // Cap at 40px for Safari (reduced from 55px)
    } else if (isMobile) {
      baseObstacleSize = height * 0.0847; // 8.47% on mobile (10% bigger than before), 6.6% on desktop (10% bigger)
      maxObstacleSize = 121; // Proportional cap on mobile (121px, 10% bigger) vs desktop (88px, 10% bigger)
    } else {
      baseObstacleSize = height * 0.066; // 6.6% on desktop
      maxObstacleSize = 88; // Desktop cap
    }
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
    
    // Calculate difficulty based on distance - start easy, gradually increase
    const minInterval = GameConfig.obstacles.floating.spawnIntervalMin;
    const maxInterval = GameConfig.obstacles.floating.spawnIntervalMax;
    const unlockDistance = GameConfig.obstacles.floating.unlockDistance;
    const rampDistance = GameConfig.obstacles.floating.difficultyRampDistance;
    
    // Start with intervals 6x longer than max, gradually decrease to configured values
    const startMaxInterval = maxInterval * 6;
    const startMinInterval = minInterval * 6;
    
    // Calculate difficulty progress (0 = just unlocked, 1 = full difficulty)
    // Only start ramping after unlock distance
    const distanceSinceUnlock = Math.max(0, this.distance - unlockDistance);
    const difficultyProgress = Math.min(1, distanceSinceUnlock / rampDistance);
    
    // Interpolate between easy start and full difficulty
    const currentMaxInterval = startMaxInterval - (difficultyProgress * (startMaxInterval - maxInterval));
    const currentMinInterval = startMinInterval - (difficultyProgress * (startMinInterval - minInterval));
    
    // Random spacing: wider variation at start (easy), tighter at end (hard)
    const randomVariationMin = 0.4 + (difficultyProgress * 0.2); // 0.4 to 0.6
    const randomVariationMax = 2.5 - (difficultyProgress * 0.7); // 2.5 to 1.8
    const lateGameMultiplier = this.getLateGameIntervalMultiplier();
    this.floatingObstacleTimer = Phaser.Math.Between(
      currentMinInterval * randomVariationMin * lateGameMultiplier,
      currentMaxInterval * randomVariationMax * lateGameMultiplier
    );
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
      
      // Calculate difficulty based on distance - start easy, gradually increase
      const minInterval = GameConfig.obstacles.projectile.spawnIntervalMin;
      const maxInterval = GameConfig.obstacles.projectile.spawnIntervalMax;
      const unlockDistance = GameConfig.obstacles.projectile.unlockDistance;
      const rampDistance = GameConfig.obstacles.projectile.difficultyRampDistance;
      
      // Start with intervals 6x longer than max, gradually decrease to configured values
      const startMaxInterval = maxInterval * 6;
      const startMinInterval = minInterval * 6;
      
      // Calculate difficulty progress (0 = just unlocked, 1 = full difficulty)
      const distanceSinceUnlock = Math.max(0, this.distance - unlockDistance);
      const difficultyProgress = Math.min(1, distanceSinceUnlock / rampDistance);
      
      // Interpolate between easy start and full difficulty
      const currentMaxInterval = startMaxInterval - (difficultyProgress * (startMaxInterval - maxInterval));
      const currentMinInterval = startMinInterval - (difficultyProgress * (startMinInterval - minInterval));
      
      // Random spacing: wider variation at start (easy), tighter at end (hard)
      const randomVariationMin = 0.4 + (difficultyProgress * 0.2); // 0.4 to 0.6
      const randomVariationMax = 2.5 - (difficultyProgress * 0.7); // 2.5 to 1.8
      const lateGameMultiplier = this.getLateGameIntervalMultiplier();
      this.projectileObstacleTimer = Phaser.Math.Between(
        currentMinInterval * randomVariationMin * lateGameMultiplier,
        currentMaxInterval * randomVariationMax * lateGameMultiplier
      );
      return;
    }
    
    // Scale projectile size relative to screen height - 10% bigger on mobile
    const isMobile = width <= 768 || height <= 768;
    const isSafariMobile = this.isSafariMobile();
    let baseObstacleSize: number;
    let maxObstacleSize: number;
    
    if (isSafariMobile) {
      // Safari mobile: smaller projectile obstacles
      baseObstacleSize = height * 0.035; // 3.5% of height = 24.5px
      maxObstacleSize = 35; // Cap at 35px for Safari (reduced from 50px)
    } else if (isMobile) {
      baseObstacleSize = height * 0.077; // 7.7% on mobile (10% bigger), 6% on desktop
      maxObstacleSize = 110; // Proportional cap on mobile (110px, 10% bigger) vs desktop (80px)
    } else {
      baseObstacleSize = height * 0.06; // 6% on desktop
      maxObstacleSize = 80; // Desktop cap
    }
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
    // Calculate difficulty based on distance - start easy, gradually increase
    const minInterval = GameConfig.obstacles.projectile.spawnIntervalMin;
    const maxInterval = GameConfig.obstacles.projectile.spawnIntervalMax;
    const unlockDistance = GameConfig.obstacles.projectile.unlockDistance;
    const rampDistance = GameConfig.obstacles.projectile.difficultyRampDistance;
    
    // Start with intervals 6x longer than max, gradually decrease to configured values
    const startMaxInterval = maxInterval * 6;
    const startMinInterval = minInterval * 6;
    
    // Calculate difficulty progress (0 = just unlocked, 1 = full difficulty)
    const distanceSinceUnlock = Math.max(0, this.distance - unlockDistance);
    const difficultyProgress = Math.min(1, distanceSinceUnlock / rampDistance);
    
    // Interpolate between easy start and full difficulty
    const currentMaxInterval = startMaxInterval - (difficultyProgress * (startMaxInterval - maxInterval));
    const currentMinInterval = startMinInterval - (difficultyProgress * (startMinInterval - minInterval));
    
    // Random spacing: wider variation at start (easy), tighter at end (hard)
    const randomVariationMin = 0.4 + (difficultyProgress * 0.2); // 0.4 to 0.6
    const randomVariationMax = 2.5 - (difficultyProgress * 0.7); // 2.5 to 1.8
    const lateGameMultiplier = this.getLateGameIntervalMultiplier();
    this.projectileObstacleTimer = Phaser.Math.Between(
      currentMinInterval * randomVariationMin * lateGameMultiplier,
      currentMaxInterval * randomVariationMax * lateGameMultiplier
    );
  }

  spawnCollectible() {
    const { width, height } = this.scale;
    
    // Scale collectible positions and sizes relative to screen - proportional to obstacles
    // Ensure minimum speed on mobile
    const isMobileSpeedCollectible = width <= 768 || height <= 768;
    const baseSpeed = isMobileSpeedCollectible ? Math.max(width / 1920, 0.5) : width / 1920;
    // Detect mobile - use appropriate size on mobile devices
    const isMobile = width <= 768 || height <= 768;
    // Desktop: larger size for better visibility, Mobile: smaller for Safari
    const isSafariMobile = this.isSafariMobile();
    let baseCollectibleSize: number;
    let maxCollectibleSize: number;
    
    if (isSafariMobile) {
      // Safari mobile: smaller collectibles
      baseCollectibleSize = height * 0.025; // 2.5% of height = 17.5px
      maxCollectibleSize = 20; // Cap at 20px for Safari (reduced from 30px)
    } else if (isMobile) {
      baseCollectibleSize = height * 0.0088; // 0.88% on mobile (10% bigger), 2.5% on desktop (larger)
      maxCollectibleSize = 27; // Mobile: 27px (10% bigger), Desktop: 60px (larger)
    } else {
      baseCollectibleSize = height * 0.025; // 2.5% on desktop
      maxCollectibleSize = 60; // Desktop cap
    }
    const collectibleSize = Math.min(baseCollectibleSize, maxCollectibleSize);
    const heights = [
      this.groundY - height * 0.028,  // ~2.8% from ground
      this.groundY - height * 0.074,  // ~7.4% from ground
      this.groundY - height * 0.12,   // ~12% from ground
      this.groundY - height * 0.167,  // ~16.7% from ground
      this.groundY - height * 0.22,   // ~22% from ground (double jump target)
      this.groundY - height * 0.30    // ~30% from ground (requires double jump)
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
    
    // CRITICAL FIX: Position collectible above ground for Safari mobile
    let collectibleY = y;
    if (this.isSafariMobile()) {
      // Safari mobile: keep within reach but allow higher placements for double jump
      const minLift = height * 0.12;
      const maxLift = height * 0.35;
      const desiredLift = this.groundY - y;
      const clampedLift = Phaser.Math.Clamp(desiredLift, minLift, maxLift);
      collectibleY = this.groundY - clampedLift;
    }
    
    const collectible = this.add.image(width + 50, collectibleY, imageKey);
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

  // Cache for texture image data to avoid recreating canvases every frame
  private textureImageDataCache: Map<string, ImageData> = new Map();

  /**
   * Get cached image data for a texture frame
   */
  private getTextureImageData(texture: Phaser.Textures.Texture, frame: Phaser.Textures.Frame): ImageData | null {
    const cacheKey = `${texture.key}-${frame.name}`;
    
    if (this.textureImageDataCache.has(cacheKey)) {
      return this.textureImageDataCache.get(cacheKey)!;
    }

    try {
      const source = texture.source[0]?.image;
      if (!source) return null;

      // Check if source is a valid CanvasImageSource (not Uint8Array)
      if (source instanceof Uint8Array) {
        return null;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;

      canvas.width = frame.width;
      canvas.height = frame.height;
      
      // Draw the frame to canvas
      ctx.drawImage(
        source as CanvasImageSource,
        frame.cutX, frame.cutY, frame.width, frame.height,
        0, 0, frame.width, frame.height
      );
      
      const imageData = ctx.getImageData(0, 0, frame.width, frame.height);
      this.textureImageDataCache.set(cacheKey, imageData);
      return imageData;
    } catch (error) {
      // Failed to get texture image data
      return null;
    }
  }

  /**
   * Collision detection using a small area around the character's center
   * This provides more accurate collision than full bounding box but is simpler than pixel-perfect
   */
  checkPixelPerfectCollision(
    obj1: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    obj2: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle
  ): boolean {
    // Get bounds of both objects first
    const bounds1 = obj1.getBounds();
    const bounds2 = obj2.getBounds();
    
    // First check: full bounding box intersection (most reliable)
    const fullBoundsIntersect = Phaser.Geom.Intersects.RectangleToRectangle(bounds1, bounds2);
    
    // If bounds don't intersect at all, no collision
    if (!fullBoundsIntersect) {
      return false;
    }
    
    // Calculate player's center point
    // Player origin is (0.5, 1), so x is center but y is bottom
    const playerCenterX = obj1.x;
    const playerCenterY = obj1.y - (obj1.displayHeight / 2);
    
    // Use a collision area around the center - make it relative to character size
    // Use 30% of character width/height, with a minimum of 30px and maximum of 60px
    // This ensures collisions work even with oddly-shaped obstacles
    const baseRadius = Math.max(30, Math.min(60, Math.min(obj1.displayWidth, obj1.displayHeight) * 0.3));
    const playerCollisionArea = new Phaser.Geom.Rectangle(
      playerCenterX - baseRadius,
      playerCenterY - baseRadius,
      baseRadius * 2,
      baseRadius * 2
    );
    
    // Check if the center collision area intersects with the object's bounds
    const areaIntersects = Phaser.Geom.Intersects.RectangleToRectangle(playerCollisionArea, bounds2);
    
    // Also check if the player's center point is directly within the obstacle bounds
    const centerInBounds = Phaser.Geom.Rectangle.Contains(bounds2, playerCenterX, playerCenterY);
    
    // Use center-based check: if bounds intersect, check if center area or center point hits
    // This ensures collisions happen when the center of the character hits, not just the edges
    // Calculate intersection area to see how much overlap there is
    const intersection = Phaser.Geom.Rectangle.Intersection(bounds1, bounds2);
    const intersectionArea = intersection.width * intersection.height;
    
    // If there's any meaningful overlap (more than just edge touching), allow collision
    // Use a very small threshold - just 1% of the smaller object's area
    const minOverlapArea = Math.min(bounds1.width * bounds1.height, bounds2.width * bounds2.height) * 0.01;
    const hasMeaningfulOverlap = intersectionArea > minOverlapArea;
    
    // Also check distance between centers - if they're close, allow collision
    const obj2CenterX = obj2.x;
    const obj2CenterY = obj2 instanceof Phaser.GameObjects.Image ? 
      (obj2.originY === 1 ? obj2.y - (obj2.displayHeight / 2) : obj2.y) : 
      bounds2.y + bounds2.height / 2;
    const centerDistance = Phaser.Math.Distance.Between(playerCenterX, playerCenterY, obj2CenterX, obj2CenterY);
    const maxCenterDistance = Math.max(baseRadius, Math.min(bounds2.width, bounds2.height) * 0.5);
    const centersAreClose = centerDistance < maxCenterDistance;
    
    // Collision if: center area/point hits OR there's meaningful overlap OR centers are close
    const intersects = fullBoundsIntersect && (areaIntersects || centerInBounds || hasMeaningfulOverlap || centersAreClose);
    
    // Debug logging for obstacle 2 specifically - log more frequently when close
    if (obj2 instanceof Phaser.GameObjects.Image) {
      const obstacleName = obj2.getData('obstacleName') || '';
      const distance = Math.abs(obj2.x - obj1.x);
      
      // Log if it's Obstacle-02 and we're close to it (within 200px)
      if (obstacleName === 'Obstacle-02' && distance < 200) {
        const intersection = Phaser.Geom.Rectangle.Intersection(bounds1, bounds2);
        const intersectionArea = intersection.width * intersection.height;
        const minOverlapArea = Math.min(bounds1.width * bounds1.height, bounds2.width * bounds2.height) * 0.01;
        const hasMeaningfulOverlap = intersectionArea > minOverlapArea;
        const obj2CenterX = obj2.x;
        const obj2CenterY = obj2 instanceof Phaser.GameObjects.Image ? 
          (obj2.originY === 1 ? obj2.y - (obj2.displayHeight / 2) : obj2.y) : 
          bounds2.y + bounds2.height / 2;
        const centerDistance = Phaser.Math.Distance.Between(playerCenterX, playerCenterY, obj2CenterX, obj2CenterY);
        const maxCenterDistance = Math.max(baseRadius, Math.min(bounds2.width, bounds2.height) * 0.5);
        const centersAreClose = centerDistance < maxCenterDistance;
        
        console.log('Obstacle-02 close collision debug', {
          collisionArea: {
            x: (playerCenterX - baseRadius).toFixed(1),
            y: (playerCenterY - baseRadius).toFixed(1),
            width: (baseRadius * 2).toFixed(1),
            height: (baseRadius * 2).toFixed(1)
          },
          obstacleBounds: {
            x: bounds2.x.toFixed(1),
            y: bounds2.y.toFixed(1),
            width: bounds2.width.toFixed(1),
            height: bounds2.height.toFixed(1)
          },
          intersectionArea: intersectionArea.toFixed(1),
          minOverlapArea: minOverlapArea.toFixed(1),
          hasMeaningfulOverlap,
          fullBoundsIntersect,
          areaIntersects,
          centerInBounds,
          finalResult: intersects
        });
      }
    }
    
    return intersects;
  }

  checkCollisions() {
    // Check obstacles
    this.obstacles.children.iterate((child) => {
      const obstacle = child as Phaser.GameObjects.Image;
      if (!obstacle || !obstacle.active) return false;
      
      // Use pixel-perfect collision detection
      if (this.checkPixelPerfectCollision(this.player, obstacle)) {
        if (this.sprintMode) {
          // Show combo messages during sprint mode
          const message = Phaser.Math.RND.pick(COMBO_MESSAGES);
          this.showMessage(message);
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
              // Failed to play stumble sound
            }
          }
          obstacle.destroy();
          this.obstacles.remove(obstacle);
          
          // Don't end game immediately when energy reaches 0
          // Let the deadline collision check handle game over to ensure visual sync
          if (this.energy <= 0) {
            this.energy = 0;
            // Deadline position will be synced immediately in the update loop
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
          
          // Combo messages are now only shown during sprint mode
          
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
      
      // Use pixel-perfect collision detection
      if (this.checkPixelPerfectCollision(this.player, obstacle)) {
        if (this.sprintMode) {
          // Show combo messages during sprint mode
          const message = Phaser.Math.RND.pick(COMBO_MESSAGES);
          this.showMessage(message);
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
              // Failed to play stumble sound
            }
          }
          obstacle.destroy();
          this.floatingObstacles.remove(obstacle);
          
          // Don't end game immediately when energy reaches 0
          // Let the deadline collision check handle game over to ensure visual sync
          if (this.energy <= 0) {
            this.energy = 0;
            // Deadline position will be synced immediately in the update loop
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
                // Failed to play combo sound
              }
            }
          }
          
          // Activate sprint mode at threshold
          if (this.combo % GameConfig.combo.sprintThreshold === 0 && this.combo >= GameConfig.combo.sprintThreshold && !this.sprintMode) {
            this.activateSprintMode();
          }
          
          // Combo messages are now only shown during sprint mode
          
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
      
      // Use pixel-perfect collision detection
      if (this.checkPixelPerfectCollision(this.player, projectile)) {
        if (this.sprintMode) {
          // Show combo messages during sprint mode
          const message = Phaser.Math.RND.pick(COMBO_MESSAGES);
          this.showMessage(message);
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
              // Failed to play stumble sound
            }
          }
          projectile.destroy();
          this.projectileObstacles.remove(projectile);
          
          // Don't end game immediately when energy reaches 0
          // Let the deadline collision check handle game over to ensure visual sync
          if (this.energy <= 0) {
            this.energy = 0;
            // Deadline position will be synced immediately in the update loop
          }
        }
      }
    });

    // Check collectibles
    this.collectibles.children.iterate((child) => {
      const collectible = child as Phaser.GameObjects.Image;
      if (!collectible || !collectible.active) return false;
      
      // Use pixel-perfect collision detection
      if (this.checkPixelPerfectCollision(this.player, collectible)) {
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
            // Failed to play collect sound
          }
        }
        collectible.destroy();
        this.collectibles.remove(collectible);
      }
    });

    // Check special collectibles
    for (let i = this.specialCollectibles.length - 1; i >= 0; i--) {
      const collectible = this.specialCollectibles[i];
      
      // Use pixel-perfect collision detection
      if (this.checkPixelPerfectCollision(this.player, collectible)) {
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
            // Failed to play collect sound
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
    // During sprint mode, only show combo messages
    if (this.sprintMode) {
      const isComboMessage = COMBO_MESSAGES.includes(message) || message === 'Five in a row? Santa calls that elite behavior.';
      if (!isComboMessage) {
        return; // Skip non-combo messages during sprint mode
      }
    }
    
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
    // Scale factor to make the entire text bubble ~10% bigger on all screen sizes
    const bubbleScaleFactor = 1.1;
    const baseFontSizePx = isMobile ? 12 : 18;
    const baseFontSize = `${baseFontSizePx * bubbleScaleFactor}px`; // 10% larger font size for all messages
    
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
    // Use device pixel ratio for sharp text rendering (capped at 3 for performance)
    const devicePixelRatio = window.devicePixelRatio || 1;
    const textResolution = Math.min(devicePixelRatio, 3); // Cap at 3x for performance, but use actual DPR for sharpness
    
    // Max width for text wrapping - responsive (increased and scaled by bubble factor)
    const maxTextWidth = (isMobile ? 280 : 400) * bubbleScaleFactor;
    
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

    // Responsive padding - scaled by bubble factor to keep the bubble visually consistent
    const horizontalPaddingBase = isMobile ? 12 : 16;
    const verticalPaddingBase = isMobile ? 4 : 8;
    const horizontalPadding = horizontalPaddingBase * bubbleScaleFactor;
    const verticalPadding = verticalPaddingBase * bubbleScaleFactor;
    
    // Create rounded rectangle (pill shape) using graphics
    const bgWidth = messageText.width + (horizontalPadding * 2);
    const bgHeight = messageText.height + (verticalPadding * 2);
    const borderRadius = bgHeight / 2; // Make it a pill shape (half the height)
    
    const messageBg = this.add.graphics();
    // Ensure graphics render at proper resolution for retina displays
    // Graphics objects automatically use the scene's resolution, but we ensure crisp rendering
    messageBg.fillStyle(bgColor, 1);
    messageBg.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, borderRadius);
    messageBg.setDepth(1000);
    // Ensure graphics are rendered crisply on high DPI displays
    messageBg.setScale(1); // Explicit scale to ensure proper rendering
    
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

  public endGame() {
    if (this.isGameOver) return;
    
    this.isGameOver = true;
    
    // Stop skateboard sound when game ends
    if (this.skateboardSound && this.skateboardSound.isPlaying) {
      try {
        this.skateboardSound.stop();
      } catch (error) {
        // Failed to stop skateboard sound on game over
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
        // Failed to reset music speed on game over
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

  public update(time: number, delta: number) {
    // Note: Visual debugging moved after ground state calculation
    
    // CRITICAL: Lock camera for Safari mobile - prevent any scrolling
    if (this.isSafariMobile()) {
      this.cameras.main.scrollX = 0;
      this.cameras.main.scrollY = 0;
    }
    
    if (this.isGameOver || !this.isGameStarted) {
      return;
    }

    const deltaSeconds = delta / 1000;
    const { width: canvasWidth, height: canvasHeight } = this.scale;
    
    // Detect mobile - use speed multiplier for mobile devices
    // Check if mobile horizontal (width > height and small screen)
    const isMobile = canvasWidth <= 768 || canvasHeight <= 768;
    const isMobileHorizontal = isMobile && canvasWidth > canvasHeight;
    const mobileSpeedMultiplier = isMobile 
      ? (isMobileHorizontal ? GameConfig.speed.mobileHorizontalMultiplier : GameConfig.speed.mobileMultiplier)
      : 1.0;
    
    // Scale base speed relative to screen width, then apply mobile multiplier
    // Ensure minimum speed on mobile for responsive feel
    const rawBaseSpeed = canvasWidth / 1920;
    const minBaseSpeed = isMobile ? 0.5 : rawBaseSpeed;
    const baseSpeed = Math.max(rawBaseSpeed, minBaseSpeed) * mobileSpeedMultiplier;

    // STABLE GROUND DETECTION: Track touchingGround over multiple frames to prevent flickering
    const touchingGround = this.player.body.touching.down || this.player.body.blocked.down;
    const velocityY = this.player.body.velocity.y;
    const isMovingUpward = velocityY < -50; // Moving up significantly (at least 50px/frame)
    
    // Calculate distance from ground (used in other logic)
    const spriteY = this.player.y;
    const distanceFromGround = spriteY - this.groundY;
    
    // FALLBACK: Also check distance-based ground detection when collision detection fails
    // This handles cases where gravity is disabled or character is manually positioned
    const isNearGround = Math.abs(distanceFromGround) <= 10; // Within 10 pixels of ground
    const isOnGroundByDistance = isNearGround && !isMovingUpward && velocityY >= -10; // Not moving up and near ground
    
    // Track touchingGround history (last 5 frames) for stable detection
    // Include distance-based detection as fallback
    const groundDetected = touchingGround || isOnGroundByDistance;
    this.touchingGroundHistory.push(groundDetected);
    if (this.touchingGroundHistory.length > 5) {
      this.touchingGroundHistory.shift();
    }
    
    // Only consider "on ground" if groundDetected has been true for at least 3 of the last 5 frames
    // This prevents flickering from causing animation switches
    const touchingCount = this.touchingGroundHistory.filter(t => t === true).length;
    const consistentlyTouching = touchingCount >= 3; // At least 3 of last 5 frames
    
    // Stable ground detection: consistently touching AND not moving upward
    const isOnGround = consistentlyTouching && !isMovingUpward;
    
    
    // SIMPLIFIED ANIMATION LOGIC
    // Determine target animation state based on simple ground check
    const targetAnimationState: 'pushing' | 'ollie' = isOnGround ? 'pushing' : 'ollie';
    
    // Only switch if state changed AND enough time has passed (cooldown to prevent rapid switching)
    const timeSinceLastChange = time - this.animationStateChangeTime;
    const minTimeBetweenSwitches = 200; // 200ms minimum between switches
    
    const currentAnim = this.player.anims.currentAnim;
    const targetAnim = this.getAnimationName(isOnGround);
    
    
    if (targetAnimationState !== this.animationState && timeSinceLastChange >= minTimeBetweenSwitches) {
      // Only switch if we're not already playing the correct animation
      if (!currentAnim || currentAnim.key !== targetAnim) {
        this.player.play(targetAnim, false);
        
        this.animationState = targetAnimationState;
        this.animationStateChangeTime = time;
        this.lastAnimationKey = targetAnim;
      } else {
        // Animation is already correct, but state is out of sync - update state without switching
        // Sync the state to match the actual animation
        this.animationState = targetAnimationState;
        // Don't update animationStateChangeTime since we didn't actually switch
      }
    } else if (targetAnimationState === this.animationState && currentAnim && currentAnim.key === targetAnim) {
      // State and animation are both correct - ensure they stay in sync
      // This prevents state drift over time
      // No action needed, but this branch ensures we're handling all cases
    } else if (targetAnimationState !== this.animationState) {
      // Log when we want to switch but can't due to cooldown
      if (Math.floor(time / 16) % 20 === 0) { // Every 20 frames
      }
    }
    
    // Debug text removed - no longer needed
    
    // Animation state is now managed by the simplified system above
    
    // CRITICAL FIX: Prevent character from sinking below ground
    // Only correct if character is significantly below ground AND not touching ground
    // This prevents the infinite correction loop
    // Note: spriteY and distanceFromGround are already declared above
    if (distanceFromGround > 5 && !touchingGround) {
      // CHARACTER BELOW GROUND - CORRECTING
      // (debug logging removed, just apply correction)
      
      // Character is below ground - correct it immediately
      if (this.isSafariMobile()) {
        // Safari mobile: with bottom-center origin, player.y should be at groundY
        this.player.y = this.groundY;
        // Ensure body bottom aligns with ground
        const bodyBottom = this.player.body.y + this.player.body.height;
        if (bodyBottom > this.groundY) {
          const adjustment = this.groundY - bodyBottom;
          this.player.y += adjustment;
        }
      } else {
        // Desktop: use existing correction
        this.player.y = this.groundY;
        // Fix body position using setupCharacterBody logic
        this.setupCharacterBody();
      }
      
      // Reset vertical velocity and disable gravity when on ground
      this.player.body.setVelocityY(0);
      this.player.body.setAllowGravity(false);
      
    }
    
    // CRITICAL FIX: Manage gravity based on ground state
    // Only enable gravity when truly in air (not touching ground AND above ground)
    const isAboveGround = distanceFromGround < -5; // At least 5px above ground
    if (isAboveGround && !touchingGround && !isOnGround) {
      this.player.body.setAllowGravity(true);
    } else if (touchingGround || (distanceFromGround <= 5 && this.player.body.velocity.y >= 0)) {
      // Disable gravity when on or near ground
      if (this.player.body.allowGravity) {
        this.player.body.setAllowGravity(false);
        this.player.body.setVelocityY(0);
      }
    }
    // When on ground or touching ground, let physics collider handle everything
    // Do NOT adjust position or velocity - this causes bouncing/wiggling
    
    // Jump handling is done in jump() method via event listeners
    // No duplicate jump handling here to avoid inconsistency
    this.pointerWasDown = this.input.activePointer.isDown;
    
    // Handle ground state - reset jumps when on ground
    // CRITICAL: Reset jumpsRemaining when on ground AND not moving upward
    // This prevents double jump from being disabled while still in the air or bouncing
    const isMovingUpwardSignificantly = this.player.body.velocity.y < -50; // Moving up significantly (for jump reset logic)
    const isStable = Math.abs(this.player.body.velocity.y) < 10; // Velocity is near zero (stable on ground)
    // Reset jumps when on ground and stable (not bouncing), and not moving up
    if (isOnGround && !isMovingUpwardSignificantly && isStable) {
      this.jumpsRemaining = 2;
      
      // CRITICAL FIX: Ensure body height is correct when on ground
      // Phaser sometimes resets body height, causing collider to fail
      // Reduced frequency of checks on mobile to prevent bugging
      const spriteHeight = this.player.displayHeight;
      const expectedBodyHeight = spriteHeight * 0.85;
      // Only check every few frames on mobile to reduce corrections
      const shouldCheck = !isMobile || (Math.floor(time / 100) % 3 === 0); // Check every 3rd frame on mobile
      if (shouldCheck && Math.abs(this.player.body.height - expectedBodyHeight) > 5) {
        // Body height is wrong - force correct value using type casting (read-only properties)
        (this.player.body as any).height = expectedBodyHeight;
        (this.player.body as any).width = spriteHeight * 0.85; // Also ensure width is correct
        // Re-setup body to ensure offset is correct
        this.setupCharacterBody();
      }
      
      // CRITICAL FIX: Disable gravity when on ground to prevent constant sinking
      // Re-enable it when jumping
      if (isOnGround && this.player.body.allowGravity) {
        this.player.body.setAllowGravity(false);
      }
      
      // Reset velocity to prevent any downward movement
      if (isOnGround && this.player.body.velocity.y > 0) {
        this.player.body.setVelocityY(0);
      }
      
      // Play skateboard sound when pushing
      if (this.animationState === 'pushing' && this.skateboardSound && !this.isMuted && !this.skateboardSound.isPlaying) {
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
          // Failed to play skateboard sound
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
          // Failed to update skateboard sound rate
        }
      }
    } else {
      // In air - stop skateboard sound
      if (this.skateboardSound && this.skateboardSound.isPlaying) {
        try {
          this.skateboardSound.stop();
        } catch (error) {
          // Failed to stop skateboard sound
        }
      }
    }

    // Increase speed over time
    let maxSpeed = GameConfig.speed.max * baseSpeed;
    // Late-game: allow a higher max speed after 1500m so the game keeps ramping up
    if (this.distance > 1500) {
      const lateGameStart = 1500;
      const lateGameEnd = 3000;
      const progress = Math.min(1, (this.distance - lateGameStart) / (lateGameEnd - lateGameStart));
      const lateGameMaxMultiplier = 1.3; // Up to 30% faster at very long distances
      maxSpeed *= 1 + progress * (lateGameMaxMultiplier - 1);
    }
    // Early-game acceleration boost so the first speed ramp is felt sooner
    this.initialSpeedBoostTimer += delta;
    const accelerationMultiplier = this.initialSpeedBoostTimer <= GameConfig.speed.initialBoostDuration
      ? GameConfig.speed.initialAccelerationMultiplier
      : 1;
    this.gameSpeed = Math.min(
      maxSpeed,
      this.gameSpeed + delta * GameConfig.speed.acceleration * accelerationMultiplier * baseSpeed
    );
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

    // Energy drain - slightly faster on mobile for better challenge
    this.energyDrainTimer += delta;
    const { width: screenWidth, height: screenHeight } = this.scale;
    const isMobileDevice = screenWidth <= 768 || screenHeight <= 768;
    // Mobile: 10% faster drain (900ms vs 1000ms) and 5% more drain per cycle
    const drainInterval = isMobileDevice ? GameConfig.energy.drainInterval * 0.9 : GameConfig.energy.drainInterval;
    const drainAmount = isMobileDevice ? GameConfig.energy.drainAmount * 1.05 : GameConfig.energy.drainAmount;
    
    if (this.energyDrainTimer >= drainInterval) {
      if (!this.sprintMode) {
        this.energy = Math.max(0, this.energy - drainAmount);
      }
      this.energyDrainTimer = 0;
      
      // Don't end game immediately when energy reaches 0
      // Let the deadline collision check handle game over to ensure visual sync
      // The deadline position will be synced immediately when energy is 0 (see deadline movement code above)
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
          // Failed to update music speed
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

    // Distance tracking - counts 1, 2, 3... incrementally, speeds up with game speed
    this.distanceTimer += delta;
    // Calculate speed ratio (how much faster than initial speed)
    const speedRatio = this.gameSpeed / GameConfig.speed.initial;
    // Base interval scales inversely with speed - faster game = faster counter
    let baseInterval = GameConfig.timers.distanceUpdateInterval / speedRatio;
    // Sprint mode makes it even faster
    const updateInterval = this.sprintMode 
      ? Math.max(30, baseInterval / 2)  // Faster updates in sprint mode, min 30ms
      : Math.max(50, baseInterval);      // Minimum 50ms to prevent too fast updates
    if (this.distanceTimer >= updateInterval) {
      this.distance += 1;  // Always increment by 1 for smooth counting
      this.distanceTimer = 0;
    }

    // Move deadline - starts far left, moves right as energy decreases
    // When energy is max (100), deadline stays far left (off-screen)
    // When energy is 0, deadline moves right toward player position
    const { width: deadlineScreenWidth } = this.scale;
    const energyRatio = this.energy / GameConfig.energy.max; // 1.0 = full energy, 0.0 = no energy
    
    // Calculate start position based on deadline width to ensure it's fully off-screen
    const deadlineWidth = this.deadline.displayWidth || 100; // Fallback if not set
    const startX = -deadlineWidth - GameConfig.deadline.offsetFromPlayer; // Start well off-screen (deadline width + buffer)
    // End position: deadline's right edge should reach player's center
    // deadline.x + deadlineWidth = player.x, so deadline.x = player.x - deadlineWidth
    const endX = this.player.x - deadlineWidth; // Deadline's right edge reaches player center
    
    // Start far left, move right as energy decreases
    // At full energy: deadline at startX (off-screen left)
    // At zero energy: deadline at endX (approaches player from right)
    const deadlineTargetX = startX + (1 - energyRatio) * (endX - startX);
    
    // CRITICAL: When energy is 0, immediately sync deadline position (no interpolation delay)
    // Position deadline so its right edge is slightly past player center to ensure collision triggers
    // This ensures the deadline and energy bar are always perfectly synced
    if (this.energy <= 0) {
      // Position deadline so right edge is at or slightly past player center
      // This ensures the collision check will trigger immediately
      this.deadlineX = this.player.x - deadlineWidth;
      this.deadline.x = this.deadlineX;
    } else {
      // Normal interpolation when energy > 0
      const deadlineLerpSpeed = this.isSafariMobile() ? GameConfig.deadline.movementSpeed * 0.65 : GameConfig.deadline.movementSpeed;
      this.deadlineX = this.deadlineX + (deadlineTargetX - this.deadlineX) * deltaSeconds * deadlineLerpSpeed;
      this.deadline.x = this.deadlineX;
    }

    // SAFETY NET: If energy has been at 0 for a short time but the deadline collision
    // still hasn't triggered (observed on some mobile Safari cases), force game over.
    if (this.energy <= 0) {
      if (this.zeroEnergyStartTime === null) {
        this.zeroEnergyStartTime = time;
      } else if (!this.isGameOver && time - this.zeroEnergyStartTime > 750) {
        // Force-align energy and trigger game end as a backup
        this.energy = 0;
        this.endGame();
      }
    } else {
      this.zeroEnergyStartTime = null;
    }

    // Check collisions
    this.checkCollisions();

    // Update message bubbles
    this.updateMessageBubblePositions();

    // Update UI
    this.updateGameData();
  }

  public startGame(): void {
    
    // CRITICAL: Prevent double call to startGame() - if game is already started, don't reset
    if (this.isGameStarted && !this.isGameOver) {
      return;
    }
    
    // CRITICAL: Don't start game until assets are fully loaded
    if (!this.assetsLoaded) {
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
          // Assets failed to load within 5 seconds, starting anyway
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
      // CRITICAL: Player does not exist when startGame() is called!
      return;
    }
    
    
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
    // CRITICAL: Only set scroll for desktop, Safari mobile camera is locked
    if (!this.isSafariMobile()) {
      this.cameras.main.setScroll(0, 0);
    }
    
    // CRITICAL: Reposition player at ground level before starting game
    // This ensures player is always on ground, especially after orientation changes
    // Note: Player positioning will be handled in the code block below after scaling
    
    this.isGameStarted = true;
    this.isGameOver = false;
    this.energy = GameConfig.energy.initial;
    this.combo = 0;
    
    // CRITICAL: Reset animation state to ensure animations start playing
    this.animationState = 'pushing'; // Start with pushing animation
    this.animationStateChangeTime = this.time.now;
    this.lastAnimationKey = 'pushing';
    
    // CRITICAL: Initialize ground detection history - assume character starts on ground
    // Fill with true values to prevent initial flickering
    this.touchingGroundHistory = [true, true, true, true, true];
    
    // CRITICAL: Start the pushing animation when game starts
    if (this.player && this.anims.exists('pushing')) {
      this.player.play('pushing', false); // Start from beginning
    }
    
    this.distance = 0;
    this.gameSpeed = GameConfig.speed.initial;
    this.initialSpeedBoostTimer = 0;
    this.grinchScore = 0;
    this.elfScore = 0;
    
    // Reset camera fade/effects to ensure visibility
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);
    
    // CRITICAL: Player positioning is done in create() - don't reposition here
    // This prevents visible repositioning when game starts
    // Just ensure velocities are reset and gravity is disabled if on ground
    if (this.player?.body) {
      // Reset all velocities to prevent falling or movement
      this.player.body.setVelocity(0, 0);
      
      // Ensure gravity is disabled when starting on ground
      const touchingGround = this.player.body.touching.down || this.player.body.blocked.down;
      if (touchingGround) {
        this.player.body.setAllowGravity(false);
      }
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
    
    // Faster initial spawns on mobile for more engaging gameplay
    const { width: startWidth, height: startHeight } = this.scale;
    const isMobileStart = startWidth <= 768 || startHeight <= 768;
    
    // Mobile: spawn obstacles much faster (50% faster) to keep game engaging
    this.obstacleTimer = isMobileStart ? 500 : 1000; // 0.5s on mobile vs 1s on desktop
    this.floatingObstacleTimer = isMobileStart ? 1000 : 2000; // 1s on mobile vs 2s on desktop
    this.projectileObstacleTimer = isMobileStart ? 1500 : 3000; // 1.5s on mobile vs 3s on desktop
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
        // Failed to reset music speed on game start
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
        audioContext.resume().catch(() => {
          // Failed to resume audio context
        });
      }
      if (!this.backgroundMusic.isPlaying && !this.isMuted) {
        try {
          this.backgroundMusic.play();
        } catch (error) {
          // Failed to start music on game start
        }
      } else {
      }
    } else {
    }
    
    this.updateGameData();
  }

  public resetGame() {
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
        // Failed to reset music speed on game reset
      }
    }
    
    this.gameSpeed = GameConfig.speed.initial;
    this.distance = 0;
    this.energy = GameConfig.energy.initial;
    this.combo = 0;
    this.maxCombo = 0;
    this.grinchScore = 0;
    this.elfScore = 0;
    this.initialSpeedBoostTimer = 0;
    
    // Faster initial spawns on mobile for more engaging gameplay
    const { width: resetWidth, height: resetHeight } = this.scale;
    const isMobileReset = resetWidth <= 768 || resetHeight <= 768;
    
    // Mobile: spawn obstacles much faster (50% faster) to keep game engaging
    this.obstacleTimer = isMobileReset ? 500 : 1000; // 0.5s on mobile vs 1s on desktop
    this.floatingObstacleTimer = isMobileReset ? 1000 : 2000; // 1s on mobile vs 2s on desktop
    this.projectileObstacleTimer = isMobileReset ? 1500 : 3000; // 1.5s on mobile vs 3s on desktop
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
    // CRITICAL FIX: Only apply this for desktop, not Safari mobile (which uses center origin)
    if (this.player?.body && !this.isSafariMobile()) {
      const { width: screenWidth } = this.cameras.main;
      // Test with default body first - uncomment if you need custom body size
      // this.setupCharacterBody();
      // Position sprite at ground level - feet at groundY
      this.player.setPosition(screenWidth * 0.25, this.groundY);
      this.player.body.setVelocity(0, 0);
    }
    // Safari mobile already positioned correctly in create() - don't override
    
    // Initialize deadline well off-screen so it eases in smoothly
    const { width, height } = this.scale;
    const resetDeadlineWidth = this.deadline.displayWidth || width * 0.25;
    const resetStartX = -resetDeadlineWidth - GameConfig.deadline.offsetFromPlayer;
    this.deadlineX = resetStartX;
    this.deadline.x = resetStartX;
    this.deadline.y = height * 0.1;
    
    this.updateGameData();
  }

  private createCollisionEffect(x: number, y: number) {
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

  private createCollectEffect(x: number, y: number, color: number) {
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

  private createSpecialCollectEffect(x: number, y: number) {
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
    
    // Switch to sprint animations
    const isOnGround = this.player.body.touching.down;
    const animationName = this.getAnimationName(isOnGround);
    if (this.anims.exists(animationName)) {
      this.player.play(animationName, false); // Always restart when switching to sprint mode
      this.lastAnimationKey = animationName; // Update tracking
      this.animationSwitchCooldown = 0; // Reset cooldown
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
        // Failed to speed up music
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
        // Failed to speed up skateboard sound
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
          this.player.play(animationName, false); // Always restart when switching from sprint mode
          this.lastAnimationKey = animationName; // Update tracking
          this.animationSwitchCooldown = 0; // Reset cooldown
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
            // Failed to reset music speed
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
            // Failed to reset skateboard sound rate
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
    
    // Detect mobile for frame rate adjustment
    const { width, height } = this.scale;
    const isMobile = width <= 768 || height <= 768;
    
    // Create pushing animation (10 frames)
    // CRITICAL: For individual image files, just use the key - don't specify frame: 0
    const pushingFrames = [];
    for (let i = 1; i <= 10; i++) {
      const frameNumber = i.toString().padStart(2, '0');
      pushingFrames.push({ key: `character-pushing-${frameNumber}` });
    }
    
    // Slower frame rate on mobile to prevent animation from being too fast
    const pushingFrameRate = isMobile ? 8 : 12;
    
    
    this.anims.create({
      key: 'pushing',
      frames: pushingFrames,
      frameRate: pushingFrameRate, // Slower on mobile (8) vs desktop (12)
      repeat: -1 // Loop infinitely
    });
    
    
    // Create ollie animation (10 frames)
    const ollieFrames = [];
    for (let i = 1; i <= 10; i++) {
      const frameNumber = i.toString().padStart(2, '0');
      ollieFrames.push({ key: `character-ollie-${frameNumber}` });
    }
    
    // Slower frame rate on mobile for ollie too
    const ollieFrameRate = isMobile ? 12 : 15;
    
    
    this.anims.create({
      key: 'ollie',
      frames: ollieFrames,
      frameRate: ollieFrameRate, // Slower on mobile (12) vs desktop (15)
      repeat: -1 // Loop while in air - will be switched back to pushing when on ground
      // Note: Transition back to pushing is handled in update() loop when on ground
    });
    
    
    // Create sprint pushing animation (10 frames)
    const sprintPushingFrames = [];
    for (let i = 1; i <= 10; i++) {
      const frameNumber = i.toString().padStart(2, '0');
      sprintPushingFrames.push({ key: `sprint-character-pushing-${frameNumber}` });
    }
    
    // Slower frame rate on mobile for sprint pushing too
    const sprintPushingFrameRate = isMobile ? 8 : 12;
    
    
    this.anims.create({
      key: 'sprint-pushing',
      frames: sprintPushingFrames,
      frameRate: sprintPushingFrameRate, // Slower on mobile (8) vs desktop (12)
      repeat: -1 // Loop infinitely
    });
    
    
    // Create sprint ollie animation (10 frames)
    const sprintOllieFrames = [];
    for (let i = 1; i <= 10; i++) {
      const frameNumber = i.toString().padStart(2, '0');
      sprintOllieFrames.push({ key: `sprint-character-ollie-${frameNumber}` });
    }
    
    // Slower frame rate on mobile for sprint ollie too
    const sprintOllieFrameRate = isMobile ? 12 : 15;
    
    
    this.anims.create({
      key: 'sprint-ollie',
      frames: sprintOllieFrames,
      frameRate: sprintOllieFrameRate, // Slower on mobile (12) vs desktop (15)
      repeat: -1 // Loop while in air - will be switched back to sprint-pushing when on ground
      // Note: Transition back to sprint-pushing is handled in update() loop when on ground
    });
    
    
    // Set initial texture and start pushing animation
    // Note: Scale is already set in create() method based on screen size
    this.player.setTexture('character-pushing-01');
    
    
    if (this.anims.exists('pushing')) {
      this.player.play('pushing');
      this.animationState = 'pushing';
      this.animationStateChangeTime = 0; // Will be set when game starts
      this.lastAnimationKey = 'pushing'; // Initialize tracking
      
    }
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
    
    // Detect mobile horizontal orientation
    const isMobile = width <= 768 || height <= 768;
    const isMobileHorizontal = isMobile && width > height;
    
    // Track recently used building images to avoid repetition
    const recentlyUsedBuildings: string[] = [];
    const maxRecentHistory = 2; // Avoid repeating the last 2 buildings
    
    // Scale building sizes relative to screen
    // On mobile horizontal, use larger percentages since height is small
    for (let i = 0; i < 8; i++) {
      const buildingWidth = Phaser.Math.Between(width * 0.031, width * 0.063); // ~3.1% to 6.3% of screen width
      // Mobile horizontal: use larger height percentage since screen height is small
      const heightMultiplier = isMobileHorizontal ? 0.25 : 0.093; // 25% on mobile horizontal vs 9.3% normal
      const heightMaxMultiplier = isMobileHorizontal ? 0.40 : 0.185; // 40% on mobile horizontal vs 18.5% normal
      let buildingHeight = Phaser.Math.Between(height * heightMultiplier, height * heightMaxMultiplier);
      
      // Ensure minimum building height for visibility (especially on mobile horizontal)
      const minBuildingHeight = isMobileHorizontal ? 60 : 40; // Minimum 60px on mobile horizontal, 40px otherwise
      if (buildingHeight < minBuildingHeight) {
        buildingHeight = minBuildingHeight;
      }
      
      // Pick a random parallax image, avoiding recently used ones
      const availableImages = this.parallaxImageKeys.filter(key => !recentlyUsedBuildings.includes(key));
      const imageKey = availableImages.length > 0 
        ? Phaser.Math.RND.pick(availableImages)
        : Phaser.Math.RND.pick(this.parallaxImageKeys); // Fallback if all images were recently used
      
      // Update recently used list
      recentlyUsedBuildings.push(imageKey);
      if (recentlyUsedBuildings.length > maxRecentHistory) {
        recentlyUsedBuildings.shift(); // Remove oldest entry
      }
      const building = this.add.image(
        Phaser.Math.Between(0, width * 2),
        this.groundY,
        imageKey
      );
      
      // Set origin to bottom center (0.5, 1) so building sits on ground
      building.setOrigin(0.5, 1);
      
      // Scale building to match desired dimensions
      // Calculate scale based on the image's natural dimensions
      const scaleX = buildingWidth / building.width;
      const scaleY = buildingHeight / building.height;
      // Use uniform scaling to maintain aspect ratio, based on the smaller scale
      // Add random size variation (0.70 to 1.30 = ±30% variation)
      const randomSizeMultiplier = Phaser.Math.FloatBetween(0.70, 1.30);
      const scale = Math.min(scaleX, scaleY) * 1.38 * randomSizeMultiplier; // 38% bigger base + random variation
      building.setScale(scale);
      
      building.setDepth(-100);
      building.setAlpha(1.0);
      this.backgroundBuildings.push(building);
    }
    
    // Scale cloud sizes relative to screen
    for (let i = 0; i < 6; i++) {
      const cloudWidth = Phaser.Math.Between(width * 0.042, width * 0.073); // ~4.2% to 7.3% of screen width
      const cloudHeight = Phaser.Math.Between(height * 0.028, height * 0.046); // ~2.8% to 4.6% of screen height
      
      // Pick a random cloud image
      const imageKey = Phaser.Math.RND.pick(this.cloudImageKeys);
      const cloud = this.add.image(
        Phaser.Math.Between(0, width * 2),
        Phaser.Math.Between(height * 0.1, height * 0.4),
        imageKey
      );
      
      // Set origin to center
      cloud.setOrigin(0.5, 0.5);
      
      // Scale cloud to match desired dimensions (38% bigger)
      const scaleX = cloudWidth / cloud.width;
      const scaleY = cloudHeight / cloud.height;
      // Add random size variation (0.70 to 1.30 = ±30% variation)
      const randomSizeMultiplier = Phaser.Math.FloatBetween(0.70, 1.30);
      const scale = Math.min(scaleX, scaleY) * 1.38 * randomSizeMultiplier; // 38% bigger base + random variation
      cloud.setScale(scale);
      
      cloud.setDepth(-80);
      cloud.setAlpha(1.0);
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
    // Safari mobile uses fixed dimensions; skip resize adjustments
    if (this.isSafariMobile()) {
      const width = this.SAFARI_FIXED_WIDTH;
      const height = this.SAFARI_FIXED_HEIGHT;
      this.scale.resize(width, height);
      this.physics.world.setBounds(0, 0, width, height);
      if (this.cameras && this.cameras.main) {
        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.setScroll(0, 0);
      }
      return;
    }

    // With RESIZE mode, game world adapts to screen size (non-Safari)
    let { width, height } = this.scale; // These are the actual game world dimensions (adapts to screen)
    
    // Use a reliable viewport height that won't shrink the world excessively on Safari
    const reliableHeight = this.getReliableViewportHeight();
    if (reliableHeight !== height) {
      height = reliableHeight;
      this.scale.resize(width, height);
    }
    
    // Validate dimensions - ensure they're valid (prevents issues on iPhone Pro Max)
    if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
      // Invalid dimensions in handleResize, using fallback
      // Use visualViewport as fallback if available, otherwise window dimensions
      if (window.visualViewport && window.visualViewport.width > 0 && window.visualViewport.height > 0) {
        width = window.visualViewport.width;
        height = window.visualViewport.height;
      } else {
        width = window.innerWidth || width || 1920;
        height = window.innerHeight || height || 1080;
      }
      // Force resize to valid dimensions
      this.scale.resize(width, height);
    }
    
    // Update camera bounds to match game world
    // With RESIZE mode, camera automatically shows full world - viewport is managed by scale manager
    if (this.cameras && this.cameras.main) {
      this.cameras.main.setBounds(0, 0, width, height);
      this.cameras.main.setBackgroundColor(getElementColorPhaser('background'));
      // CRITICAL: Only set scroll for desktop, Safari mobile camera is locked
      if (!this.isSafariMobile()) {
        // Reset camera scroll to origin to ensure full world is visible (ground at bottom)
        this.cameras.main.setScroll(0, 0);
      }
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
      // Ground Y position is negative in resize, adjusting
      this.groundY = Math.max(0, height * 0.85); // Ensure ground is at least 15% from bottom
    }
    if (this.groundY >= height) {
      // Ground Y position exceeds height in resize, adjusting
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
      const originalSpriteHeight = 160; // Base sprite height
      const originalSpriteWidth = 160; // Base sprite width
      const playerScale = targetHeight / originalSpriteHeight;
      
      // CRITICAL FIX: Use setDisplaySize instead of setScale to prevent stretching
      const displayWidth = originalSpriteWidth * playerScale;
      const displayHeight = originalSpriteHeight * playerScale;
      this.player.setDisplaySize(displayWidth, displayHeight);
      
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
        // Character would be cut off after resize, adjusting
        
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
          const originalSpriteHeight = 160;
          const originalSpriteWidth = 160;
          const adjustedScale = maxPlayerHeight / originalSpriteHeight;
          const displayWidth = originalSpriteWidth * adjustedScale;
          const displayHeight = originalSpriteHeight * adjustedScale;
          this.player.setDisplaySize(displayWidth, displayHeight);
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
  
  shutdown() {
    // Clean up visual viewport listener
    if (window.visualViewport && this.visualViewportResizeHandler) {
      window.visualViewport.removeEventListener('resize', this.visualViewportResizeHandler);
      this.visualViewportResizeHandler = null;
    }
    
    // Clear any pending timers
    if (this.visualViewportResizeTimer) {
      clearTimeout(this.visualViewportResizeTimer);
      this.visualViewportResizeTimer = null;
    }
    
    // Remove scale resize listener
    this.scale.off('resize', this.handleResize, this);
  }
}