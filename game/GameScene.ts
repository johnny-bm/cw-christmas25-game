import Phaser from 'phaser';
import { createCharacterTextures } from './createCharacterTextures';
import { GameConfig } from './gameConfig';
import { 
  getElementColorPhaser, 
  getElementColor,
  getColorTokenPhaser,
  regularCollectibleColors,
  specialCollectibleColors,
  confettiColors,
  explosionColors
} from './colorConfig';

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

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.GameObjects.Group;
  private floatingObstacles!: Phaser.GameObjects.Group;
  private projectileObstacles!: Phaser.GameObjects.Group;
  private collectibles!: Phaser.GameObjects.Group;
  private collectibleImageKeys: string[] = [];
  private deadline!: Phaser.GameObjects.Rectangle;
  private deadlineEdge!: Phaser.GameObjects.Rectangle;
  
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
  
  private deadlineX: number = -100;
  
  private specialCollectibles: Phaser.GameObjects.Arc[] = [];
  private obstaclesPassed: Set<Phaser.GameObjects.Rectangle> = new Set();
  private messageBubbles: Array<{
    container: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
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
  
  private backgroundMusic!: Phaser.Sound.BaseSound;
  private isMuted: boolean = false;
  private jumpSound!: Phaser.Sound.BaseSound;
  private collectSound!: Phaser.Sound.BaseSound;
  private comboSound!: Phaser.Sound.BaseSound;
  private stumbleSound!: Phaser.Sound.BaseSound;
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
    ];
    
    collectibleFiles.forEach((name) => {
      const key = `collectible-${name.toLowerCase().replace(/\s+/g, '-')}`;
      // Encode spaces in URL path
      const encodedName = encodeURIComponent(name);
      const path = `/Assets/Collectibles/${encodedName}.png`;
      this.load.image(key, path);
      this.collectibleImageKeys.push(key);
    });
    
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
    
    // Track loading progress
    this.load.on('progress', (progress: number) => {
      this.game.events.emit('loadingProgress', progress);
    });
    
    // Listen for load complete
    this.load.on('complete', () => {
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
    const { width, height } = this.scale;

    // Set camera bounds to match actual canvas size
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setBackgroundColor(getElementColorPhaser('background')); // White background
    
    // Set physics world bounds to match canvas size
    this.physics.world.setBounds(0, 0, width, height);
    
    // Scale gravity relative to screen height for responsive jump physics
    const isMobile = width <= 768 || height <= 768;
    const mobileGravityMultiplier = isMobile ? GameConfig.physics.mobileGravityMultiplier : 1.0;
    const scaledGravity = GameConfig.physics.baseGravity * (height / GameConfig.physics.baseGravityHeight) * mobileGravityMultiplier;
    this.physics.world.gravity.y = scaledGravity;

    // White game background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, getElementColorPhaser('background'));
    bg.setDepth(-100);

    // Parallax background
    this.createParallaxBackground();

    // Position ground at bottom (80px from bottom)
    this.groundY = height - 80;
    const groundHeight = 80; // Fixed 80px height
    const groundCenterY = this.groundY + (groundHeight / 2);
    
    // Ground width: 2x canvas width for scrolling
    const groundWidth = width * 2;
    this.ground = this.physics.add.staticGroup();
    
    // Create ground rectangle
    const groundRect = this.add.rectangle(width / 2, groundCenterY, groundWidth, groundHeight, getElementColorPhaser('ground'));
    groundRect.setDepth(10);
    groundRect.setOrigin(0.5, 0.5);
    groundRect.setVisible(true);
    groundRect.setActive(true);
    groundRect.setAlpha(1);
    
    // Add physics body to ground rectangle (static body)
    this.physics.add.existing(groundRect, true);
    
    // Add to ground group
    this.ground.add(groundRect);
    
    // Ensure physics body is properly configured
    if (groundRect.body) {
      const body = groundRect.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(groundWidth, groundHeight);
      body.setOffset(0, 0);
    }

    // Position player at 20% from left, on ground
    const playerX = width * 0.2;
    const playerY = this.groundY - 50;
    
    // Scale player size relative to screen height (8% of screen height)
    const playerSize = height * 0.08;
    const playerScale = playerSize / 50; // Base character size is ~50px
    
    this.player = this.physics.add.sprite(playerX, playerY, 'character-run-1');
    this.player.setScale(playerScale);
    this.player.setDepth(20);
    
    // Scale collision box relative to player size
    const bodyWidth = 20 * playerScale;
    const bodyHeight = 33 * playerScale;
    this.player.body.setSize(bodyWidth, bodyHeight);
    this.player.body.setCollideWorldBounds(false);
    this.player.body.setAllowGravity(true);
    this.player.body.enable = true;

    // Add collider between player and ground
    this.physics.add.collider(this.player, this.ground);

    // Setup animation
    if (this.textures.exists('character-run-1') && this.textures.exists('character-run-2')) {
      this.setupCharacterAnimation();
    }

    // Sprint glow effect - scale relative to player size
    const glowWidth = 60 * playerScale;
    const glowHeight = 80 * playerScale;
    this.sprintGlow = this.add.rectangle(
      this.player.x, 
      this.player.y, 
      glowWidth, 
      glowHeight, 
      getElementColorPhaser('sprintGlow'),
      0
    );
    this.sprintGlow.setDepth(19);

    // Position deadline at center or relative to height
    this.deadline = this.add.rectangle(-50, height * 0.5, 5000, height, getElementColorPhaser('deadline'));
    this.deadline.setOrigin(1, 0.5);
    this.deadline.setDepth(1);
    
    this.deadlineEdge = this.add.rectangle(-100, height * 0.5, 5, height, getElementColorPhaser('deadlineEdge'));
    this.deadlineEdge.setDepth(2);

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
    
    const onGround = this.player.body.touching.down;
    
    // Scale jump velocity relative to screen height for responsive jump physics
    // Base jump velocity is -800 for 1080px height, scale proportionally
    const { width, height } = this.scale;
    const isMobile = width <= 768 || height <= 768;
    const mobileJumpMultiplier = isMobile ? GameConfig.physics.mobileJumpMultiplier : 1.0;
    const jumpVelocity = GameConfig.physics.baseJumpVelocity * (height / GameConfig.physics.baseGravityHeight) * mobileJumpMultiplier;
    
    if (onGround) {
      this.player.setVelocityY(jumpVelocity);
      this.jumpsRemaining = 1;
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
      this.player.setVelocityY(jumpVelocity);
      this.jumpsRemaining = 0;
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
    
    // Scale obstacle sizes relative to screen
    const baseSpeed = width / 1920;
    const obstacleHeights = [
      height * 0.04,  // 4% of screen height
      height * 0.06,  // 6% of screen height
      height * 0.08   // 8% of screen height
    ];
    const obstacleHeight = Phaser.Math.RND.pick(obstacleHeights);
    const obstacleWidths = [
      width * 0.013,  // ~1.3% of screen width
      width * 0.016,  // ~1.6% of screen width
      width * 0.021,  // ~2.1% of screen width
      width * 0.026,  // ~2.6% of screen width
      width * 0.031   // ~3.1% of screen width
    ];
    const obstacleWidth = Phaser.Math.RND.pick(obstacleWidths);
    
    const obstacle = this.add.rectangle(
      width + 50,
      this.groundY - obstacleHeight / 2,
      obstacleWidth,
      obstacleHeight,
      getElementColorPhaser('obstacleRegular')
    );
    obstacle.setDepth(10);
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
    
    // Scale floating obstacle positions and sizes relative to screen
    const baseSpeed = width / 1920;
    const jumpHeight = height * 0.15; // Estimate max jump height as 15% of screen
    const heights = [
      this.groundY - jumpHeight * 0.7,
      this.groundY - jumpHeight * 0.85,
      this.groundY - jumpHeight * 1.0
    ];
    const y = Phaser.Math.RND.pick(heights);
    
    const obstacleWidths = [
      width * 0.016,  // ~1.6% of screen width
      width * 0.021,  // ~2.1% of screen width
      width * 0.026,  // ~2.6% of screen width
      width * 0.031,  // ~3.1% of screen width
      width * 0.036   // ~3.6% of screen width
    ];
    const obstacleWidth = Phaser.Math.RND.pick(obstacleWidths);
    const obstacleHeight = height * 0.023; // ~2.3% of screen height (thin horizontal obstacle)
    
    const obstacle = this.add.rectangle(
      width + 50,
      y,
      obstacleWidth,
      obstacleHeight,
      getElementColorPhaser('obstacleFloating')
    );
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
    const baseSpeed = width / 1920;
    
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
    
    // Create projectile obstacle
    const projectileSize = width * 0.02; // 2% of screen width
    const projectile = this.add.rectangle(
      startX,
      startY,
      projectileSize,
      projectileSize,
      getElementColorPhaser('obstacleProjectile') // Red color to distinguish from regular obstacles
    );
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
    
    // Scale collectible positions and sizes relative to screen
    const baseSpeed = width / 1920;
    // Detect mobile - use larger size on mobile devices
    const isMobile = width <= 768 || height <= 768;
    // Use larger percentage on mobile, smaller on desktop
    const baseCollectibleSize = isMobile ? height * 0.008 : height * 0.004; // 0.8% on mobile, 0.4% on desktop
    const maxCollectibleSize = isMobile ? 24 : 12; // Larger cap on mobile (24px) vs desktop (12px)
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
    collectible.setOrigin(0.5, 0.5);
    // Store collectible type for collection logic
    collectible.setData('isSpecial', isSpecial);
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
    
    // Scale special collectible positions and sizes relative to screen
    const baseSpeed = width / 1920;
    // Detect mobile - use larger size on mobile devices
    const isMobile = width <= 768 || height <= 768;
    // Use larger percentage on mobile, smaller on desktop
    const baseCollectibleRadius = isMobile ? height * 0.014 : height * 0.007; // 1.4% on mobile, 0.7% on desktop
    const maxCollectibleRadius = isMobile ? 36 : 18; // Larger cap on mobile (36px) vs desktop (18px)
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
      const obstacle = child as Phaser.GameObjects.Rectangle;
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
          this.obstacles.remove(obstacle);
          
          if (this.energy <= 0) {
            this.energy = 0;
            this.endGame();
          }
        }
      } else if (!this.obstaclesPassed.has(obstacle) && obstacle.x < this.player.x) {
        this.obstaclesPassed.add(obstacle);
        this.combo += 1;
        // Reward energy for successfully passing obstacle
        this.energy = Math.min(GameConfig.energy.max, this.energy + GameConfig.energy.obstaclePassReward);
        
        if (this.combo % GameConfig.combo.sprintThreshold === 0 && this.combo >= GameConfig.combo.sprintThreshold && !this.sprintMode) {
          this.activateSprintMode();
        }
        
        if (this.combo === GameConfig.combo.milestone3) {
          this.showMessage('🔥 3 in a row!');
        } else if (this.combo % GameConfig.combo.sprintThreshold === 0 && this.combo >= GameConfig.combo.sprintThreshold) {
          this.showMessage(`⚡ ON FIRE! ${this.combo} COMBO!`);
        }
        
        if (this.combo > this.maxCombo) {
          this.maxCombo = this.combo;
        }
      }
    });

    // Check floating obstacles
    this.floatingObstacles.children.iterate((child) => {
      const obstacle = child as Phaser.GameObjects.Rectangle;
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
      } else if (!this.obstaclesPassed.has(obstacle) && obstacle.x < this.player.x) {
        this.obstaclesPassed.add(obstacle);
        this.combo += 1;
        // Reward energy for successfully passing floating obstacle
        this.energy = Math.min(GameConfig.energy.max, this.energy + GameConfig.energy.obstaclePassReward);
        
        // Play combo sound for milestones - ensure audio context is active
        if (this.comboSound && !this.isMuted) {
          if (this.combo === GameConfig.combo.milestone3 || this.combo % GameConfig.combo.sprintThreshold === 0) {
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
        
        if (this.combo % GameConfig.combo.sprintThreshold === 0 && this.combo >= GameConfig.combo.sprintThreshold && !this.sprintMode) {
          this.activateSprintMode();
        }
        
        if (this.combo === GameConfig.combo.milestone3) {
          this.showMessage('🔥 3 in a row!');
        } else if (this.combo % GameConfig.combo.sprintThreshold === 0 && this.combo >= GameConfig.combo.sprintThreshold) {
          this.showMessage(`⚡ ON FIRE! ${this.combo} COMBO!`);
        }
        
        if (this.combo > this.maxCombo) {
          this.maxCombo = this.combo;
        }
      }
    });

    // Check projectile obstacles
    this.projectileObstacles.children.iterate((child) => {
      const projectile = child as Phaser.GameObjects.Rectangle;
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
        
        if (isSpecial) {
          this.showMessage(Phaser.Math.RND.pick(SPECIAL_COLLECT_MESSAGES));
          this.createSpecialCollectEffect(collectible.x, collectible.y);
        } else {
          this.showMessage(Phaser.Math.RND.pick(COLLECT_MESSAGES));
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

    // Check deadline
    if (this.deadlineEdge.x >= this.player.x - 15) {
      this.energy = 0;
      this.endGame();
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

    const isNegative = HIT_MESSAGES.includes(message);
    const isSpecial = isSpecialMessage;
    
    // Responsive font size - smaller on mobile
    const { width } = this.scale;
    const isMobile = width <= 768;
    const baseFontSize = isMobile 
      ? (isSpecial ? '16px' : '12px')  // Smaller on mobile
      : (isSpecial ? '24px' : '18px'); // Normal on desktop
    const bgColor = isNegative 
      ? getElementColorPhaser('messageBubbleNegative') 
      : (isSpecial ? getElementColorPhaser('messageBubbleSpecial') : getElementColorPhaser('messageBubbleNormal'));
    const textColor = isSpecial ? getElementColor('messageTextSpecial') : getElementColor('messageTextNormal');
    const strokeColor = isSpecial ? getElementColor('messageStrokeSpecial') : getElementColor('messageStrokeNormal');
    
    // Match text resolution to canvas resolution for crisp rendering
    // Use device pixel ratio (same as canvas resolution) for crisp text
    const textResolution = Math.max(window.devicePixelRatio || 1, 2); // At least 2x for quality
    
    const messageText = this.add.text(0, 0, message, {
      fontFamily: '"Urbanist", sans-serif',
      fontSize: baseFontSize,
      color: textColor,
      align: 'center',
      stroke: strokeColor,
      strokeThickness: isSpecial ? 2 : 1,
      resolution: textResolution, // Match canvas resolution for crisp text
      fontStyle: 'bold'
    });
    messageText.setOrigin(0.5, 0.5); // Center the text
    messageText.setDepth(1001);

    // Responsive padding - smaller on mobile
    const padding = isMobile 
      ? (isSpecial ? 6 : 5)  // Smaller padding on mobile
      : (isSpecial ? 10 : 8); // Normal padding on desktop
    const messageBg = this.add.rectangle(0, 0, messageText.width + (padding * 2), messageText.height + (padding * 2), bgColor);
    messageBg.setStrokeStyle(isSpecial ? 2 : 1, getColorTokenPhaser('white'));
    messageBg.setOrigin(0.5, 0.5); // Center the background
    messageBg.setDepth(1000);
    
    // Create container first
    const messageContainer = this.add.container(0, 0, [messageBg, messageText]);
    
    // Add subtle glow effect for special messages
    if (isSpecial) {
      const glow = this.add.rectangle(0, 0, messageText.width + (padding * 2) + 6, messageText.height + (padding * 2) + 6, getElementColorPhaser('sprintGlow'), 0.3);
      glow.setOrigin(0.5, 0.5); // Center the glow
      glow.setDepth(999);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      
      // Pulsing glow animation
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.3, to: 0.6 },
        duration: 800,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
      
      messageContainer.add(glow);
    }
    messageContainer.setDepth(1002);
    messageContainer.setAlpha(0);
    messageContainer.setScale(0.8); // Start slightly smaller for pop-in effect

    const bubbleData = {
      container: messageContainer,
      bg: messageBg,
      text: messageText,
      timer: GameConfig.messages.displayDuration,
      id: this.messageIdCounter++
    };
    
    this.messageBubbles.push(bubbleData);
    
    // Pop-in animation with scale
    this.tweens.add({
      targets: messageContainer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
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
    const baseSpeed = (canvasWidth / 1920) * mobileSpeedMultiplier;

    // Check if on ground
    const onGround = this.player.body.touching.down;
    if (onGround) {
      this.jumpsRemaining = 2;
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
      const obstacle = child as Phaser.GameObjects.Rectangle;
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
      const obstacle = child as Phaser.GameObjects.Rectangle;
      if (!obstacle || !obstacle.active) return false;
      
      obstacle.x -= currentSpeed * deltaSeconds;
      
      if (obstacle.x < -100) {
        obstacle.destroy();
        this.floatingObstacles.remove(obstacle);
      }
    });

    // Move projectile obstacles with parabolic trajectory
    this.projectileObstacles.children.iterate((child) => {
      const projectile = child as Phaser.GameObjects.Rectangle;
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

    // Move deadline
    const deadlineTargetX = -100 + ((GameConfig.energy.max - this.energy) / GameConfig.energy.max) * (this.player.x + GameConfig.deadline.offsetFromPlayer);
    this.deadlineX = this.deadlineX + (deadlineTargetX - this.deadlineX) * deltaSeconds * GameConfig.deadline.movementSpeed;
    this.deadline.x = this.deadlineX;
    this.deadlineEdge.x = this.deadlineX;

    // Check collisions
    this.checkCollisions();

    // Update message bubbles
    this.updateMessageBubblePositions();

    // Update UI
    this.updateGameData();
  }

  startGame() {
    // Ensure audio is unlocked when game starts (mobile)
    if (this.sound.locked) {
      this.sound.unlock();
    }
    
    this.isGameStarted = true;
    this.isGameOver = false;
    this.energy = GameConfig.energy.initial;
    this.combo = 0;
    this.distance = 0;
    this.gameSpeed = GameConfig.speed.initial;
    this.grinchScore = 0;
    this.elfScore = 0;
    
    // Reset camera fade/effects to ensure visibility
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);
    
    this.player.y = this.groundY - 50;
    this.player.setVelocityY(0);
    this.player.setVelocityX(0);
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
    
    this.deadlineX = -100;
    this.deadline.x = -100;
    this.deadlineEdge.x = -100;
    
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
      const { width, height } = this.scale;
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
      }
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
    
    this.player.y = this.groundY - 50;
    
    this.deadlineX = -100;
    this.deadline.x = -100;
    this.deadlineEdge.x = -100;
    
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

  activateSprintMode() {
    this.sprintMode = true;
    this.sprintTimer = GameConfig.sprint.duration;
    this.energy = GameConfig.sprint.energyRestore;
    this.sprintGlow.setAlpha(0.5);
    this.showMessage('💨 SPRINT MODE! UNSTOPPABLE!');
    
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
  }

  updateSprintMode(delta: number) {
    if (this.sprintMode) {
      this.sprintTimer -= delta;
      if (this.sprintTimer <= 0) {
        this.sprintMode = false;
        this.sprintGlow.setAlpha(0);
        
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
      }
    }
  }

  private setupCharacterAnimation() {
    if (this.anims.exists('run')) {
      this.anims.remove('run');
    }
    
    this.anims.create({
      key: 'run',
      frames: [
        { key: 'character-run-1', frame: 0 },
        { key: 'character-run-2', frame: 0 }
      ],
      frameRate: 6,
      repeat: -1
    });
    
    this.player.setTexture('character-run-1');
    this.player.setScale(0.8);
    this.player.play('run');
  }

  private updateMessageBubblePositions() {
    const bubbleSpacing = 15; // Increased spacing
    this.messageBubbles.sort((a, b) => a.id - b.id);
    
    let offsetY = -100; // Higher above player for better visibility
    const offsetX = 50; // More to the right
    
    for (const bubble of this.messageBubbles) {
      const bubbleHeight = bubble.bg.height;
      
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
    const { width, height } = this.scale;
    
    // Update camera bounds
    if (this.cameras && this.cameras.main) {
      this.cameras.main.setBounds(0, 0, width, height);
      this.cameras.main.setBackgroundColor(getElementColorPhaser('background'));
    }
    
    // Update gravity to scale with new screen height
    const isMobile = width <= 768 || height <= 768;
    const mobileGravityMultiplier = isMobile ? GameConfig.physics.mobileGravityMultiplier : 1.0;
    const scaledGravity = GameConfig.physics.baseGravity * (height / GameConfig.physics.baseGravityHeight) * mobileGravityMultiplier;
    this.physics.world.gravity.y = scaledGravity;
    
    // Reposition ground at new bottom (80px from bottom)
    this.groundY = height - 80;
    const groundHeight = 80; // Fixed 80px height
    const groundCenterY = this.groundY + (groundHeight / 2);
    
    // Update ground rectangle
    if (this.ground) {
      const groundRect = this.ground.getChildren()[0] as Phaser.GameObjects.Rectangle;
      if (groundRect) {
        groundRect.setPosition(width / 2, groundCenterY);
        groundRect.setSize(width * 2, groundHeight);
        
        // Update physics body size
        if (groundRect.body) {
          const body = groundRect.body as Phaser.Physics.Arcade.StaticBody;
          body.setSize(width * 2, groundHeight);
        }
      }
    }
    
    // Update player position (keep relative position)
    if (this.player) {
      const playerX = width * 0.2; // Keep at 20% from left
      const playerY = this.groundY - 50;
      
      // Rescale player size relative to new screen height
      const playerSize = height * 0.08;
      const playerScale = playerSize / 50;
      this.player.setPosition(playerX, playerY);
      this.player.setScale(playerScale);
      
      // Update collision box
      const bodyWidth = 20 * playerScale;
      const bodyHeight = 33 * playerScale;
      this.player.body.setSize(bodyWidth, bodyHeight);
    }
    
    // Update deadline Y position
    if (this.deadline) {
      this.deadline.setPosition(-50, height * 0.5);
      this.deadline.setSize(5000, height);
    }
    
    if (this.deadlineEdge) {
      this.deadlineEdge.setPosition(-100, height * 0.5);
      this.deadlineEdge.setSize(5, height);
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