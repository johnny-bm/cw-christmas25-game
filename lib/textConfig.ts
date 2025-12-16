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
    subtitle: "Skate fast, dodge sabotage, and collect whatever the Grinch didn't manage to destroy. Outrun the final deadline of the year!",
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
    title: "The Deadline",
    titleHighlight: "Won",
    subtitle: "But hey, the holidays still showed up for you!",
    stats: {
      youEscaped: "YOU ESCAPED",
      rollOneMoreTime: "Roll One More Time",
      leaderboard: "Leaderboard",
      saveYourScore: "SAVE YOUR SCORE",
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
        needThreeInitials: "Need 3 initials",
      },
      success: "✓ ON THE BOARD!",
    },
    footer: "Made with ☕ and ⏰ by the Crackwits Squad",
  },

  // ============================================
  // LEADERBOARD
  // ============================================
  leaderboard: {
    title: "🏆 Leaderboard",
    loading: "Loading...",
    error: "Failed to load leaderboard",
    empty: "No scores yet. Be the first!",
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
      champion: "🥇 Champion! You're #1!",
      second: "🥈 Amazing! You're #2!",
      third: "🥉 Excellent! You're #3!",
      regular: "Great ride!",
    },
    messages: {
      top3: {
        santaFavorite: "You're Santa's New Favorite!",
        yourScore: "Your score:",
        leaderboardCloses: "Leaderboard closes on",
        stayTop3: "stay",
        claimWin: "to claim your win! Refresh often... competitors roll in fast.",
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
      timeRemaining: "Time remaining until deadline:",
      chooseTreat: "Choose your treat below! We'll contact you if you win!",
      deadlinePassed: "Deadline passed",
    },
    regular: {
      leaderboardCloses: "Leaderboard closes on January 5th, 2026",
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
        label: "Prize Selection",
        required: "*",
        consultation: "Free Consultation Session with Crackwits",
        discount: "Offer on a New Crackwits Service",
        disclaimer: "Prize awarded if position maintained until 01/05/2026",
      },
      button: {
        saving: "Saving...",
        claimSpot: "Claim My Spot!",
        saveScore: "Save My Score",
      },
      errors: {
        emailRequired: "Email is required for top 3 scores",
        invalidEmail: "Please enter a valid email address",
        selectPrize: "Please select a prize option",
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
      title: "Loading game...",
    },
    portraitBlocker: {
      title: "Please Rotate Your Device",
      description: {
        line1: "This game is for landscape mode.",
        line2: "",
        line3: "The game will load automatically once you rotate to landscape.",
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
    title: "Escape The Deadline - Crackwits Christmas Game",
    description: "Skate fast, dodge sabotage, and collect whatever the Grinch didn't manage to destroy. Outrun the final deadline of the year!",
    keywords: "Christmas game, escape game, deadline game, skateboard game, holiday game, Crackwits",
    ogTitle: "Escape The Deadline - Crackwits Christmas Game",
    ogDescription: "Skate fast, dodge sabotage, and collect whatever the Grinch didn't manage to destroy. Outrun the final deadline of the year!",
    ogImage: "/Assets/CW-Logo.svg",
    ogType: "website",
    twitterCard: "summary_large_image",
    twitterTitle: "Escape The Deadline - Crackwits Christmas Game",
    twitterDescription: "Skate fast, dodge sabotage, and collect whatever the Grinch didn't manage to destroy. Outrun the final deadline of the year!",
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

