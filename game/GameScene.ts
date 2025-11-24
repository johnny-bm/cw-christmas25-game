import Phaser from 'phaser';
import { createCharacterTextures } from './createCharacterTextures';

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
  private collectibles!: Phaser.GameObjects.Group;
  private collectibleImageKeys: string[] = [];
  private deadline!: Phaser.GameObjects.Rectangle;
  private deadlineEdge!: Phaser.GameObjects.Rectangle;
  
  private distance: number = 0;
  private energy: number = 100;
  private combo: number = 0;
  private maxCombo: number = 0;
  
  private gameSpeed: number = 300;
  
  private sprintMode: boolean = false;
  private sprintTimer: number = 0;
  private sprintGlow!: Phaser.GameObjects.Rectangle;
  
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
  private obstacleTimer: number = 1000;
  private floatingObstacleTimer: number = 2000;
  private collectibleTimer: number = 2000;
  private specialCollectibleTimer: number = 5000;
  private messageTimer: number = 0; // Cooldown timer for messages
  
  private backgroundMusic!: Phaser.Sound.BaseSound;
  private isMuted: boolean = false;
  private jumpSound!: Phaser.Sound.BaseSound;
  private collectSound!: Phaser.Sound.BaseSound;
  private comboSound!: Phaser.Sound.BaseSound;
  private stumbleSound!: Phaser.Sound.BaseSound;

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
    
    // Load background music - encode spaces in filename
    const musicPath = '/Deck The Halls Christmas Rock.mp3';
    console.log('🎵 Loading audio:', musicPath);
    this.load.audio('bgMusic', musicPath);
    
    // Load sound effects
    this.load.audio('jumpSound', '/Jump.wav');
    this.load.audio('collectSound', '/Collect.mp3');
    this.load.audio('comboSound', '/Combo.wav');
    this.load.audio('stumbleSound', '/Stumble.wav');
    
    // Listen for load complete
    this.load.on('filecomplete-audio-bgMusic', () => {
      console.log('✅ bgMusic audio file loaded successfully');
    });
    
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file.key === 'bgMusic') {
        console.error('❌ Failed to load bgMusic:', file.src);
      }
    });
  }

  create() {
    console.log('🎮 GameScene create() started');
    // Get actual canvas dimensions (no fixed 1920x1080)
    const { width, height } = this.scale;

    console.log('📐 Canvas size:', width, 'x', height);
    console.log('📐 Scale mode:', this.scale.scaleMode);

    // Set camera bounds to match actual canvas size
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setBackgroundColor('#ffffff'); // White background
    
    // Set physics world bounds to match canvas size
    this.physics.world.setBounds(0, 0, width, height);
    
    // Scale gravity relative to screen height for responsive jump physics
    // Base gravity is 2000 for 1080px height, scale proportionally
    const baseGravity = 2000;
    const baseHeight = 1080;
    const scaledGravity = baseGravity * (height / baseHeight);
    this.physics.world.gravity.y = scaledGravity;
    console.log('📐 Scaled gravity:', scaledGravity, 'for height:', height);

    // White game background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff);
    bg.setDepth(-100);
    console.log('✅ Game background created');

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
    const groundRect = this.add.rectangle(width / 2, groundCenterY, groundWidth, groundHeight, 0x000000);
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
    
    console.log('✅ Ground created at:', groundRect.x, groundRect.y, 'size:', groundWidth, 'x', groundHeight);

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
    
    console.log('✅ Player created at:', this.player.x, this.player.y);
    console.log('✅ Ground Y:', this.groundY);

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
      0xffff00,
      0
    );
    this.sprintGlow.setDepth(19);

    // Position deadline at center or relative to height
    this.deadline = this.add.rectangle(-50, height * 0.5, 5000, height, 0x000000);
    this.deadline.setOrigin(1, 0.5);
    this.deadline.setDepth(1);
    
    this.deadlineEdge = this.add.rectangle(-100, height * 0.5, 5, height, 0xff0000);
    this.deadlineEdge.setDepth(2);

    // Initialize groups
    this.obstacles = this.add.group();
    this.floatingObstacles = this.add.group();
    this.collectibles = this.add.group();

    // Input setup
    this.input.keyboard!.on('keydown-SPACE', () => this.jump());
    this.input.keyboard!.on('keydown-UP', () => this.jump());
    this.input.on('pointerdown', () => this.jump());

    console.log('✅ GameScene setup complete');
    
    // Initialize all sounds
    try {
      // Initialize background music - start playing immediately at low volume
      if (this.cache.audio.exists('bgMusic')) {
        this.backgroundMusic = this.sound.add('bgMusic', { loop: true, volume: 0.2 }); // Low volume for start screen
        console.log('✅ Background music initialized');
      } else {
        this.backgroundMusic = this.sound.add('bgMusic', { loop: true, volume: 0.2 });
      }
      
      // Initialize sound effects - increased volumes for better audibility
      try {
        this.jumpSound = this.sound.add('jumpSound', { volume: 0.7 });
        this.collectSound = this.sound.add('collectSound', { volume: 0.7 });
        this.comboSound = this.sound.add('comboSound', { volume: 0.8 });
        this.stumbleSound = this.sound.add('stumbleSound', { volume: 0.7 });
        console.log('✅ Sound effects initialized');
      } catch (error) {
        console.warn('⚠️ Some sound effects may not be loaded yet:', error);
      }
      
      console.log('✅ All sounds initialized');
    } catch (error) {
      console.error('❌ Failed to initialize sounds:', error);
    }
    
    // Load mute state from localStorage
    const savedMuteState = localStorage.getItem('escapeTheDeadline_muted');
    if (savedMuteState === 'true') {
      this.isMuted = true;
      this.sound.mute = true;
      console.log('🔇 Sound muted from localStorage');
    } else {
      console.log('🔊 Sound not muted');
    }
    
    // Unlock audio on first user interaction and start music
    if (this.sound.locked) {
      console.log('🔒 Audio is locked, will unlock on user interaction');
      const unlockAudio = () => {
        this.sound.unlock();
        console.log('🔓 Audio unlocked');
        // Start music after unlock
        if (this.backgroundMusic && !this.backgroundMusic.isPlaying && !this.isMuted) {
          this.backgroundMusic.play();
          console.log('🎵 Music started after unlock');
        }
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
      };
      document.addEventListener('click', unlockAudio);
      document.addEventListener('touchstart', unlockAudio);
    } else {
      // Audio already unlocked, start music
      if (this.backgroundMusic && !this.isMuted) {
        this.backgroundMusic.play();
        console.log('🎵 Music started (audio already unlocked)');
      }
    }
    
    // Emit ready event to React
    this.game.events.emit('ready');
  }
  
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.sound.mute = this.isMuted;
    localStorage.setItem('escapeTheDeadline_muted', this.isMuted.toString());
    console.log('🔊 Mute toggled:', this.isMuted);
    return this.isMuted;
  }
  
  isSoundMuted(): boolean {
    return this.isMuted || this.sound.mute;
  }
  
  setMusicVolume(volume: number) {
    if (this.backgroundMusic && 'setVolume' in this.backgroundMusic) {
      (this.backgroundMusic as any).setVolume(volume);
      console.log('🎵 Music volume set to:', volume);
    }
  }

  jump() {
    if (this.isGameOver || !this.isGameStarted) return;
    
    const onGround = this.player.body.touching.down;
    
    // Scale jump velocity relative to screen height for responsive jump physics
    // Base jump velocity is -800 for 1080px height, scale proportionally
    const { height } = this.scale;
    const baseJumpVelocity = -800;
    const baseHeight = 1080;
    const jumpVelocity = baseJumpVelocity * (height / baseHeight);
    
    if (onGround) {
      this.player.setVelocityY(jumpVelocity);
      this.jumpsRemaining = 1;
      // Play jump sound
      if (this.jumpSound && !this.isMuted) {
        this.jumpSound.play();
      }
    } else if (this.jumpsRemaining > 0) {
      this.player.setVelocityY(jumpVelocity);
      this.jumpsRemaining = 0;
      // Play jump sound
      if (this.jumpSound && !this.isMuted) {
        this.jumpSound.play();
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
      0xaaaaaa
    );
    obstacle.setDepth(10);
    this.obstacles.add(obstacle);
    
    // Scale obstacle speed relative to screen width
    const obstacleSpeed = -400 * baseSpeed;
    obstacle.setData('speed', obstacleSpeed);
    
    const minInterval = 800;
    const maxInterval = 2500;
    const speedFactor = Math.min(1, (this.gameSpeed - 300) / 300);
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
      0x888888
    );
    obstacle.setDepth(10);
    this.floatingObstacles.add(obstacle);
    
    // Scale obstacle speed relative to screen width
    const obstacleSpeed = -400 * baseSpeed;
    obstacle.setData('speed', obstacleSpeed);
    
    const minInterval = 1500;
    const maxInterval = 3500;
    this.floatingObstacleTimer = Phaser.Math.Between(minInterval, maxInterval);
  }

  spawnCollectible() {
    const { width, height } = this.scale;
    
    // Scale collectible positions and sizes relative to screen
    const baseSpeed = width / 1920;
    // Use smaller percentage and cap max size for desktop screens
    // Base size is 0.4% of screen height, but cap at ~12px equivalent for larger screens
    const baseCollectibleSize = height * 0.004; // ~0.4% of screen height (smaller on all screens)
    const maxCollectibleSize = 12; // Cap at 12px equivalent size
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
    
    const collectible = this.add.image(width + 50, y, imageKey);
    // Scale collectible image relative to screen height (assuming base image is ~50px, scale to collectibleSize)
    const imageScale = collectibleSize / 50;
    collectible.setScale(imageScale);
    collectible.setOrigin(0.5, 0.5);
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
    
    this.collectibleTimer = Phaser.Math.Between(500, 3000);
  }

  spawnSpecialCollectible() {
    const { width, height } = this.scale;
    
    // Scale special collectible positions and sizes relative to screen
    const baseSpeed = width / 1920;
    // Use smaller percentage and cap max size for desktop screens
    // Base radius is 0.7% of screen height, but cap at ~18px for larger screens
    const baseCollectibleRadius = height * 0.007; // ~0.7% of screen height (smaller on all screens)
    const maxCollectibleRadius = 18; // Cap at 18px radius
    const collectibleRadius = Math.min(baseCollectibleRadius, maxCollectibleRadius);
    const heights = [
      this.groundY - height * 0.028,  // ~2.8% from ground
      this.groundY - height * 0.074,  // ~7.4% from ground
      this.groundY - height * 0.12,   // ~12% from ground
      this.groundY - height * 0.167   // ~16.7% from ground
    ];
    const y = Phaser.Math.RND.pick(heights);
    const colors = [0xff0000, 0x00ff00, 0x0000ff];
    const color = Phaser.Math.RND.pick(colors);
    
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
    
    this.specialCollectibleTimer = Phaser.Math.Between(8000, 15000);
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
          this.energy -= 10;
          this.combo = 0;
          this.showMessage(Phaser.Math.RND.pick(HIT_MESSAGES));
          this.cameras.main.shake(150, 0.005);
          this.createCollisionEffect(obstacle.x, obstacle.y);
          // Play stumble sound
          if (this.stumbleSound && !this.isMuted) {
            this.stumbleSound.play();
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
        
        if (this.combo % 10 === 0 && this.combo >= 10 && !this.sprintMode) {
          this.activateSprintMode();
        }
        
        if (this.combo === 3) {
          this.showMessage('🔥 3 in a row!');
        } else if (this.combo % 10 === 0 && this.combo >= 10) {
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
          this.energy -= 10;
          this.combo = 0;
          this.showMessage(Phaser.Math.RND.pick(HIT_MESSAGES));
          this.cameras.main.shake(150, 0.005);
          this.createCollisionEffect(obstacle.x, obstacle.y);
          // Play stumble sound
          if (this.stumbleSound && !this.isMuted) {
            this.stumbleSound.play();
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
        
        // Play combo sound for milestones
        if (this.comboSound && !this.isMuted) {
          if (this.combo === 3 || this.combo % 10 === 0) {
            this.comboSound.play();
          }
        }
        
        if (this.combo % 10 === 0 && this.combo >= 10 && !this.sprintMode) {
          this.activateSprintMode();
        }
        
        if (this.combo === 3) {
          this.showMessage('🔥 3 in a row!');
        } else if (this.combo % 10 === 0 && this.combo >= 10) {
          this.showMessage(`⚡ ON FIRE! ${this.combo} COMBO!`);
        }
        
        if (this.combo > this.maxCombo) {
          this.maxCombo = this.combo;
        }
      }
    });

    // Check collectibles
    this.collectibles.children.iterate((child) => {
      const collectible = child as Phaser.GameObjects.Image;
      if (!collectible || !collectible.active) return false;
      
      const collectibleBounds = collectible.getBounds();
      
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, collectibleBounds)) {
        this.energy = Math.min(100, this.energy + 5);
        this.showMessage(Phaser.Math.RND.pick(COLLECT_MESSAGES));
        // Use a default color for the effect (yellow/gold)
        this.createCollectEffect(collectible.x, collectible.y, 0xffff00);
        // Play collect sound
        if (this.collectSound && !this.isMuted) {
          this.collectSound.play();
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
        this.energy = Math.min(100, this.energy + 20);
        this.showMessage(Phaser.Math.RND.pick(SPECIAL_COLLECT_MESSAGES));
        this.createSpecialCollectEffect(collectible.x, collectible.y);
        // Play collect sound
        if (this.collectSound && !this.isMuted) {
          this.collectSound.play();
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
    // Check cooldown timer - only allow messages every 2 seconds (except for special messages)
    const isSpecialMessage = message.includes('SPRINT') || message.includes('ON FIRE') || message.includes('🔥');
    if (!isSpecialMessage && this.messageTimer > 0) {
      return; // Skip this message if cooldown hasn't expired
    }
    
    // Reset cooldown timer
    if (!isSpecialMessage) {
      this.messageTimer = 2000; // 2 second cooldown
    }
    
    if (this.messageBubbles.length >= 3) {
      const oldest = this.messageBubbles[0];
      oldest.container.destroy();
      this.messageBubbles.shift();
    }

    const isNegative = HIT_MESSAGES.includes(message);
    const isSpecial = isSpecialMessage;
    
    // Smaller, more compact design
    const baseFontSize = isSpecial ? '24px' : '18px';
    const bgColor = isNegative ? 0x666666 : (isSpecial ? 0xffaa00 : 0x000000);
    const textColor = isSpecial ? '#000000' : '#ffffff';
    const strokeColor = isSpecial ? '#ffffff' : '#000000';
    
    const messageText = this.add.text(0, 0, message, {
      fontFamily: '"Urbanist", sans-serif',
      fontSize: baseFontSize,
      color: textColor,
      align: 'left',
      stroke: strokeColor,
      strokeThickness: isSpecial ? 2 : 1,
      resolution: 2
    });
    messageText.setOrigin(0, 0.5);
    messageText.setDepth(1001);

    // Smaller padding for more compact bubbles
    const padding = isSpecial ? 10 : 8;
    const messageBg = this.add.rectangle(0, 0, messageText.width + (padding * 2), messageText.height + (padding * 2), bgColor);
    messageBg.setStrokeStyle(isSpecial ? 2 : 1, 0xffffff);
    messageBg.setOrigin(0, 0.5);
    messageBg.setDepth(1000);
    
    // Create container first
    const messageContainer = this.add.container(0, 0, [messageBg, messageText]);
    
    // Add subtle glow effect for special messages
    if (isSpecial) {
      const glow = this.add.rectangle(0, 0, messageText.width + (padding * 2) + 6, messageText.height + (padding * 2) + 6, 0xffff00, 0.3);
      glow.setOrigin(0, 0.5);
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
      timer: 2500,
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
      sprintTimer: this.sprintTimer
    });
  }

  endGame() {
    if (this.isGameOver) return;
    
    console.log('💀 Game Over! Distance:', this.distance);
    this.isGameOver = true;
    
    // Lower music volume for game over screen
    if (this.backgroundMusic) {
      this.setMusicVolume(0.2); // Low volume for game over screen
    }
    
    this.cameras.main.shake(500, 0.01);
    this.cameras.main.flash(300, 255, 0, 0);
    
    this.time.delayedCall(100, () => {
      this.cameras.main.flash(200, 255, 255, 255);
    });
    
    this.time.delayedCall(400, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
    });
    
    this.time.delayedCall(1000, () => {
      this.game.events.emit('gameOver', Math.floor(this.distance), this.maxCombo);
    });
  }

  update(time: number, delta: number) {
    if (this.isGameOver || !this.isGameStarted) {
      return;
    }

    const deltaSeconds = delta / 1000;
    const { width: canvasWidth } = this.scale;
    
    // Scale base speed relative to screen width
    const baseSpeed = canvasWidth / 1920;

    // Check if on ground
    const onGround = this.player.body.touching.down;
    if (onGround) {
      this.jumpsRemaining = 2;
    }

    // Increase speed over time - more noticeable acceleration
    // Scale max speed relative to screen width
    const maxSpeed = 600 * baseSpeed;
    this.gameSpeed = Math.min(maxSpeed, this.gameSpeed + delta * 0.05 * baseSpeed);

    const speedMultiplier = this.sprintMode ? 2.0 : 1.0;
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

    // Spawn floating obstacles (only after 5000m)
    if (this.distance > 5000) {
      this.floatingObstacleTimer -= delta;
      if (this.floatingObstacleTimer <= 0) {
        this.spawnFloatingObstacle();
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
    if (this.energyDrainTimer >= 500) {
      if (!this.sprintMode) {
        this.energy = Math.max(0, this.energy - 1);
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

    // Low energy warnings
    this.lowEnergyMessageTimer += delta;
    if (this.lowEnergyMessageTimer >= 3000) {
      if (this.energy <= 20 && this.energy > 0) {
        this.showMessage(Phaser.Math.RND.pick(CRITICAL_ENERGY_MESSAGES));
      } else if (this.energy <= 40 && this.energy > 20) {
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
    if (this.distanceTimer >= 100) {
      const distanceMultiplier = this.sprintMode ? 2.0 : 1.0;
      this.distance += (this.gameSpeed / 100) * distanceMultiplier;
      this.distanceTimer = 0;
    }

    // Move deadline
    const deadlineTargetX = -100 + ((100 - this.energy) / 100) * (this.player.x + 150);
    this.deadlineX = this.deadlineX + (deadlineTargetX - this.deadlineX) * deltaSeconds * 3;
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
    console.log('🚀 START GAME CALLED');
    console.log('🚀 Setting isGameStarted to true');
    
    this.isGameStarted = true;
    console.log('🚀 isGameStarted is now:', this.isGameStarted);
    this.isGameOver = false;
    this.energy = 100;
    this.combo = 0;
    this.distance = 0;
    this.gameSpeed = 300;
    
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
    this.collectibles.clear(true, true);
    this.specialCollectibles.forEach(obj => obj.destroy());
    this.specialCollectibles = [];
    this.messageBubbles.forEach(bubble => bubble.container.destroy());
    this.messageBubbles = [];
    
    this.obstacleTimer = 1000;
    this.floatingObstacleTimer = 2000;
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
    
    // Increase music volume for gameplay
    if (this.backgroundMusic) {
      this.setMusicVolume(0.5); // Normal volume during gameplay
    }
    
    this.updateGameData();
    
    console.log('✅ Game started successfully!');
  }

  resetGame() {
    console.log('🔄 Resetting game...');
    this.isGameStarted = false;
    this.isGameOver = false;
    
    // Lower music volume for start screen
    if (this.backgroundMusic) {
      this.setMusicVolume(0.2); // Low volume for start screen
    }
    
    this.gameSpeed = 300;
    this.distance = 0;
    this.energy = 100;
    this.combo = 0;
    this.maxCombo = 0;
    
    this.obstacleTimer = 1000;
    this.floatingObstacleTimer = 2000;
    this.collectibleTimer = 2000;
    this.specialCollectibleTimer = 5000;
    this.energyDrainTimer = 0;
    this.distanceTimer = 0;
    this.lowEnergyMessageTimer = 0;
    
    this.obstacles.clear(true, true);
    this.obstaclesPassed.clear();
    this.floatingObstacles.clear(true, true);
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
    const colors = [0xff0000, 0xaaaaaa, 0x888888, 0xffffff];
    
    for (let i = 0; i < 15; i++) {
      const particle = this.add.circle(x, y, Phaser.Math.Between(3, 6), Phaser.Math.RND.pick(colors));
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
    const confettiColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    
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
      const ring = this.add.circle(x, y, 5, 0xffffff);
      ring.setStrokeStyle(3, 0xffffff);
      ring.setFillStyle(0xffffff, 0);
      
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
    console.log('⚡ Sprint mode activated!');
    this.sprintMode = true;
    this.sprintTimer = 5000;
    this.energy = 100;
    this.sprintGlow.setAlpha(0.5);
    this.showMessage('💨 SPRINT MODE! UNSTOPPABLE!');
  }

  updateSprintMode(delta: number) {
    if (this.sprintMode) {
      this.sprintTimer -= delta;
      if (this.sprintTimer <= 0) {
        this.sprintMode = false;
        this.sprintGlow.setAlpha(0);
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
        0xf0f0f0
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
        0xe8e8e8
      );
      cloud.setDepth(-80);
      cloud.setAlpha(0.3);
      this.backgroundClouds.push(cloud);
    }
  }

  private handleResize() {
    const { width, height } = this.scale;
    
    // Update camera bounds
    if (this.cameras && this.cameras.main) {
      this.cameras.main.setBounds(0, 0, width, height);
      this.cameras.main.setBackgroundColor('#ffffff');
    }
    
    // Update gravity to scale with new screen height
    const baseGravity = 2000;
    const baseHeight = 1080;
    const scaledGravity = baseGravity * (height / baseHeight);
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
    
    // Update parallax buildings if needed
    // Buildings will reposition themselves during update loop
  }
}