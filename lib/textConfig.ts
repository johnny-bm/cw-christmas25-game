/**
 * Centralized text configuration for ALL text in the application
 * This file contains all titles, subtitles, buttons, labels, placeholders, messages, and SEO metadata
 */

export const textConfig = {
  // ============================================
  // START SCREEN
  // ============================================
  startScreen: {
    title: "ESCAPE THE DEADLINE",
    subtitle: "Skate fast, dodge sabotage, and collect whatever the Grinch didn’t manage to destroy. Outrun the final deadline of the year.",
    button: {
      ready: "LET'S ROLL",
      loading: "LOADING...",
    },
    hint: "Press SPACEBAR or tap to start",
    fullscreen: {
      title: "Fullscreen Recommended",
      description: "For the best experience on Safari, tap the fullscreen button below to hide browser tabs and get more screen space.",
      button: {
        goFullscreen: "Go Fullscreen",
        skip: "Skip",
      },
    },
  },

  // ============================================
  // GAME OVER SCREEN
  // ============================================
  gameOver: {
    title: "DEADLINE 1 - ",
    titleHighlight: "0 YOU",
    subtitle: "But don’t stress, the holidays still showed up anyway.",
    stats: {
      youEscaped: "YOUR RUN",
      rollOneMoreTime: "Roll One More Time",
      leaderboard: "View Rankings",
      saveYourScore: "SAVE YOUR PERFORMANCE",
    },
    form: {
      initials: {
        label: "Initials",
        placeholder: "Initials",
      },
      email: {
        label: "Email",
        placeholder: "Email (optional)",
      },
      button: {
        save: "SAVE",
        saving: "...",
      },
      errors: {
        invalidEmail: "Invalid email",
        needThreeInitials: "Please enter 3 initials",
      },
      success: "SAVED ON THE BOARD",
    },
    footer: "Made with ☕ and ⏰ by the Crackwits Squad",
  },

  // ============================================
  // LEADERBOARD
  // ============================================
  leaderboard: {
    title: "🏆 Rankings",
    loading: "Loading...",
    error: "Failed to load rankings",
    empty: "No entries yet. Set the benchmark",
    loadingMore: "Loading more...",
    table: {
      rank: "#",
      name: "Name",
      distance: "Distance",
      combo: "Combo",
      elfVsGrinch: "Elf vs Grinch",
    },
  },

  // ============================================
  // ENDING POPUP
  // ============================================
  endingPopup: {
    titles: {
      champion: "🥇 Top Performer",
      second: "🥈 Strong Performance",
      third: "🥉 Great Run",
      regular: "Solid Effort",
    },
    messages: {
      top3: {
        santaFavorite: "Santa’s taking notes.",
        yourScore: "Your score:",
        leaderboardCloses: "Ranking closes on",
        stayTop3: "maintain",
        claimWin: "your position by staying in the top ranks. Rankings update frequently.",
      },
      regular: {
        elfOutskated: "Your elf almost out-skated the Deadline, but the Grinch caught up.",
        tryAgain: "Try again and push that score higher. Practice makes perfect!",
      },
    },
    scoreBreakdown: {
      title: "Score Breakdown",
      finalScore: "Final Score:",
      elfVsGrinch: "Elf vs Grinch:",
      maxCombo: "Max Combo:",
    },
    top3: {
      rank: "Rank #",
      timeRemaining: "Time remaining until evaluation period ends:",
      chooseTreat: "Select your professional benefit below. We’ll contact you if your position is maintained.",
      deadlinePassed: "DEvaluation period ended",
    },
    regular: {
      leaderboardCloses: "Rankings close on January 5th, 2026",
    },
    form: {
      initials: {
        label: "Initials",
        placeholder: "ABC",
        required: "*",
      },
      email: {
        label: "Email",
        placeholder: "your@email.com",
        required: "*",
        optional: "(optional)",
      },
      prizeSelection: {
        label: "Professional Benefit Selection",
        required: "*",
        consultation: "Complimentary Consultation Session with Crackwits",
        discount: "Service Credit on a New Crackwits Engagement",
        disclaimer: "Benefit granted if position is maintained until 01/05/2026",
      },
      button: {
        saving: "Saving...",
        claimSpot: "Confirm My Position",
        saveScore: "Save My Score",
      },
      errors: {
        emailRequired: "Email is required for top-ranked participants",
        invalidEmail: "Please enter a valid email address",
        selectPrize: "Please select a benefit option",
        saveFailed: "Failed to save score. Please try again.",
      },
    },
  },

  // ============================================
  // GAME UI
  // ============================================
  gameUI: {
    energy: "ENERGY",
    combo: "COMBO",
    comboRush: "COMBO RUSH",
    deadline: "DEADLINE",
    tapToJump: "TAP TO JUMP",
  },

  // ============================================
  // APP (Loading, Portrait Blocker)
  // ============================================
  app: {
    loading: {
      title: "Loading experience...",
    },
    portraitBlocker: {
      title: "Please Rotate Your Device",
      description: {
        line1: "This experience is for landscape mode.",
        line2: "",
        line3: "The experience will load automatically once you rotate to landscape.",
      },
      copyright: "CRACKWITS™ 2025 - 2020. All Rights Reserved.",
    },
  },

  // ============================================
  // GAME MESSAGES (from /game directory)
  // ============================================
  game: {
    collectibleMessages: {
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
    },
    collectMessages: [
      'Creative spark\'s back!',
      'That\'s the good stuff.',
      'Fuel for ideas.',
      'Mood: inspired.',
      'Coffee for the soul.'
    ],
    specialCollectMessages: [
      'Holiday mode: on.',
      'That\'s the spirit!',
      'Santa-level energy!',
      'Power trip unlocked.',
      'Vacation vibes!'
    ],
    hitMessages: [
      'Classic deadline move.',
      'Oof. That brief hurt.',
      'Whoops—wrong layer.',
      'Client feedback hit!',
      'Creative crash!'
    ],
    groundObstacleMessages: {
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
    },
    lowEnergyMessages: [
      'Running on coffee fumes.',
      'Need… holiday… soon.',
      'Focus slipping.',
      'Almost there.',
      'One more idea…'
    ],
    criticalEnergyMessages: [
      'Deadline\'s too close!',
      'Save me, Santa!',
      'Can\'t lose now!',
      'So close to freedom.',
      'Almost on OOO!'
    ],
    easterEggMessages: [
      'Next year, I\'m escaping earlier.',
      'Ctrl+S my soul.',
      'New Year\'s goal: fewer meetings, more meaning.',
      'Creative block? More like creative brick wall.',
      '2026 me better appreciate this.',
      'If The Deadline wins, it does my timesheet.'
    ],
    comboMessages: [
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
    ],
  },

  // ============================================
  // SEO METADATA
  // ============================================
  seo: {
    title: "Escape the Deadline | CRACKWITS Holiday Challenge",
    description: "Escape the Deadline is a CRACKWITS holiday skill-based challenge where participants skate past obstacles, avoid Grinch sabotage, collect boosts, and improve performance before the final deadline. No chance, no entry fees.",
    keywords: "Christmas game, escape game, deadline game, skateboard game, holiday game, Crackwits",
    ogTitle: "Escape the Deadline | CRACKWITS Holiday Challenge",
    ogDescription: "Escape the Deadline is a CRACKWITS holiday skill-based challenge where participants skate past obstacles, avoid Grinch sabotage, collect boosts, and improve performance before the final deadline. No chance, no entry fees.",
    ogImage: "/Assets/CW-Logo.svg",
    ogType: "website",
    twitterCard: "summary_large_image",
    twitterTitle: "Escape the Deadline | CRACKWITS Holiday Challenge",
    twitterDescription: "Escape the Deadline is a CRACKWITS holiday skill-based challenge where participants skate past obstacles, avoid Grinch sabotage, collect boosts, and improve performance before the final deadline. No chance, no entry fees.",
    twitterImage: "/Assets/CW-Logo.svg",
  },

  // ============================================
  // COMMON / SHARED
  // ============================================
  common: {
    ariaLabels: {
      mute: "Mute",
      unmute: "Unmute",
      enterFullscreen: "Enter Fullscreen",
      close: "Close",
    },
    altText: {
      crackwitsLogo: "Crackwits Logo",
      muted: "Muted",
      unmuted: "Unmuted",
      energy: "Energy",
      combo: "Combo",
      elf: "Elf",
      grinch: "Grinch",
      happyElf: "Happy Elf",
      happyGrinch: "Happy Grinch",
      errorLoadingImage: "Error loading image",
    },
  },
} as const;

// Type helper for text config access
export type TextConfig = typeof textConfig;

