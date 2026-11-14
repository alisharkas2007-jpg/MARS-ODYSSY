import { Language, RealmId } from '../types/game';

export interface TranslationDict {
  appTitle: string;
  appTagline: string;
  playBtn: string;
  chooseAdventure: string;
  howToPlay: string;
  realms: Record<RealmId, { name: string; short: string; desc: string }>;
  hud: {
    oxygen: string;
    shield: string;
    fuel: string;
    score: string;
    credits: string;
    speed: string;
    shop: string;
    spaceBook: string;
    starMap: string;
    challenges: string;
    menuBtn: string;
    mute: string;
    unmute: string;
    touchOn: string;
    touchOff: string;
    showControls: string;
    restart: string;
    home: string;
    radar: string;
    pickup: string;
    deliver: string;
    repair: string;
    jetpackMode: string;
    starfighterMode: string;
    carrying: string;
    quality: string;
    qualityUltra: string;
    qualityHigh: string;
    qualityBalanced: string;
    paused: string;
    resume: string;
    ampActive: string;
  };
  controlCenter: {
    title: string;
    subtitle: string;
    realmsLabel: string;
    missionProgress: string;
    toolsLabel: string;
    settingsLabel: string;
    escHint: string;
  };
  controlsHints: {
    space: string;
    mars: string;
    solar: string;
    touch: string;
  };
  challenges: {
    btnLabel: string;
    title: string;
    subtitle: string;
    startBtn: string;
    cancelBtn: string;
    activeLabel: string;
    completedLabel: string;
    lockedLabel: string;
    lockedBusy: string;
    readyLabel: string;
    rewardLabel: string;
    timeLeft: string;
    nextTarget: string;
  };
  planetInfo: {
    typeLabel: string;
    distanceLabel: string;
    diameterLabel: string;
    dayLabel: string;
    yearLabel: string;
    moonsLabel: string;
    tempLabel: string;
    factsTitle: string;
  };
  quizPilot: {
    badge: string;
    submitHint: string;
  };
  missions: {
    spaceCrystals: string;
    spaceRescued: string;
    marsIce: string;
    marsOxygen: string;
    marsStations: string;
    solarDiscovered: string;
    completeBadge: string;
  };
  shop: {
    title: string;
    subtitle: string;
    tabs: {
      suits: string;
      abilities: string;
      consumables: string;
      pets: string;
    };
    buy: string;
    equip: string;
    equipped: string;
    owned: string;
    free: string;
    useHotkey: string;
    needCredits: string;
    inBag: string;
  };
  spaceBook: {
    title: string;
    unlockedCounter: string;
    lockedTitle: string;
    lockedHint: string;
  };
  starMap: {
    title: string;
    subtitle: string;
    warp: string;
    discovered: string;
    undiscovered: string;
    sun: string;
    planet: string;
    star: string;
  };
  howTo: {
    title: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    desktopControls: string;
    mobileControls: string;
    controlsList: Array<{ key: string; action: string }>;
    mobileDesc: string;
    gotIt: string;
  };
  victory: {
    title: string;
    subtitle: string;
    astronauts: string;
    marsStations: string;
    bodies: string;
    score: string;
    playAgain: string;
    keepExploring: string;
  };
  nasaLab: {
    btnLabel: string;
    title: string;
    subtitle: string;
    liveBadge: string;
    cachedFallbackBadge: string;
    tabs: {
      weather: string;
      imagery: string;
      osdr: string;
      marstrek: string;
      csa: string;
    };
    weatherCalm: string;
    weatherWatch: string;
    weatherStorm: string;
    weatherLabel: string;
    donkiTitle: string;
    donkiDesc: string;
    radlabTitle: string;
    radlabDesc: string;
    syncWeatherBtn: string;
    syncedActive: string;
    issDoseLabel: string;
    marsDoseLabel: string;
    earthDoseLabel: string;
    flaresLabel: string;
    cmesLabel: string;
    apodTitle: string;
    roverPhotosTitle: string;
    osdrTitle: string;
    osdrPlaceholder: string;
    osdrSearchBtn: string;
    marsTrekTitle: string;
    marsTrekDesc: string;
    launchRealm: string;
    openPortal: string;
    csaTitle: string;
    csaDesc: string;
    loading: string;
  };
  pipName: string;
  pipHints: Record<string, string>;
  toasts: Record<string, string>;
  contextLostTitle: string;
  contextLostDesc: string;
  errorTitle: string;
  errorRetry: string;
  pwa: {
    installApp: string;
    installIos: string;
    iosTitle: string;
    iosStep1: string;
    iosStep2: string;
    close: string;
    offlineBadge: string;
  };
}

const EN: TranslationDict = {
  appTitle: 'Mars Odyssey',
  appTagline: 'Space Rescue & Colony',
  playBtn: 'PLAY',
  chooseAdventure: 'Choose Adventure',
  howToPlay: 'How to Play',
  realms: {
    space: {
      name: 'Space Rescue',
      short: 'Space Rescue',
      desc: 'Jetpack or Starfighter rescue in glowing nebulae!',
    },
    mars: {
      name: 'Mars Base',
      short: 'Mars Base',
      desc: 'Explore 0.38g Mars, collect ice & fix solar stations.',
    },
    solar: {
      name: 'Solar Map',
      short: 'Solar Map',
      desc: 'Soar past all 8 planets, the Sun, and 4 bright stars!',
    },
  },
  hud: {
    oxygen: 'Oxygen',
    shield: 'Shield',
    fuel: 'Fuel',
    score: 'Star Points',
    credits: 'Credits',
    speed: 'Speed',
    shop: 'Suits & Pets',
    spaceBook: 'Space Book',
    starMap: 'Star Map',
    challenges: 'Challenges',
    menuBtn: 'Menu',
    mute: 'Sound On',
    unmute: 'Muted',
    touchOn: 'Touch Pad',
    touchOff: 'Touch Off',
    showControls: 'Show Controls',
    restart: 'Restart',
    home: 'Home',
    radar: 'Radar',
    pickup: 'PICK UP',
    deliver: 'DELIVER',
    repair: 'REPAIR',
    jetpackMode: 'Jetpack',
    starfighterMode: 'Starfighter',
    carrying: 'Aboard',
    quality: 'Quality',
    qualityUltra: 'Ultra',
    qualityHigh: 'High',
    qualityBalanced: 'Balanced',
    paused: 'Mission Paused',
    resume: 'Resume Mission',
    ampActive: '2x Boost',
  },
  controlCenter: {
    title: 'Mission Control Center',
    subtitle: 'Switch worlds, launch tools, check NASA science, or adjust settings.',
    realmsLabel: 'Select Realm',
    missionProgress: 'Current Mission',
    toolsLabel: 'Explorer Tools',
    settingsLabel: 'System & Controls',
    escHint: 'Press ESC anytime to open or close this menu',
  },
  controlsHints: {
    space: 'WASD Fly · Space Up · C Down · Shift Boost · E Pick Up / Deliver · V Ship · F Radar · ESC Menu',
    mars: 'WASD Move · Space Jump / Hover · Shift Sprint · E Repair Station · F Radar · 1-3 Supplies · ESC Menu',
    solar: 'WASD Fly · Space / C Altitude · Shift Warp Boost · F Radar · Fly near worlds for Info Card · ESC Menu',
    touch: 'Left Stick Move · Right Buttons Up / Down / Boost / Radar · Tap Action Prompts · Menu Top-Right',
  },
  challenges: {
    btnLabel: 'Challenges',
    title: 'Realm Side Challenges',
    subtitle: 'Complete optional challenges for bonus Star Points & Credits!',
    startBtn: 'Start Challenge',
    cancelBtn: 'Cancel Active',
    activeLabel: 'Active',
    completedLabel: 'Completed',
    lockedLabel: 'Locked',
    lockedBusy: 'Finish or cancel active challenge first',
    readyLabel: 'Ready',
    rewardLabel: 'Reward',
    timeLeft: 'Time',
    nextTarget: 'Next',
  },
  planetInfo: {
    typeLabel: 'Type',
    distanceLabel: 'Distance',
    diameterLabel: 'Diameter',
    dayLabel: 'Day Length',
    yearLabel: 'Year Length',
    moonsLabel: 'Moons',
    tempLabel: 'Temperature',
    factsTitle: 'Cosmic Facts',
  },
  quizPilot: {
    badge: 'Quiz Pilot Challenge',
    submitHint: 'Pick the correct science answer to claim your reward!',
  },
  missions: {
    spaceCrystals: 'Crystals',
    spaceRescued: 'Rescued',
    marsIce: 'Water Ice',
    marsOxygen: 'O2 Tanks',
    marsStations: 'Solar Fix',
    solarDiscovered: 'Discovered',
    completeBadge: 'Complete!',
  },
  shop: {
    title: 'Colony Armory & Pet Hangar',
    subtitle: 'Upgrade your suit, ship tech, supplies, and robotic companions!',
    tabs: {
      suits: 'Suit Skins',
      abilities: 'Abilities',
      consumables: 'Supplies',
      pets: 'Space Pets',
    },
    buy: 'Unlock',
    equip: 'Equip',
    equipped: 'Equipped',
    owned: 'Active',
    free: 'Free',
    useHotkey: 'Hotkey',
    needCredits: 'Need more Credits',
    inBag: 'In Pack',
  },
  spaceBook: {
    title: 'Explorer Space Book',
    unlockedCounter: 'Facts unlocked',
    lockedTitle: 'Uncharted Mystery',
    lockedHint: 'Keep exploring all 3 realms to discover this space science fact!',
  },
  starMap: {
    title: 'Solar System Star Map',
    subtitle: 'Tap any planet, the Sun, or a distant star to warp right beside it!',
    warp: 'Warp Here',
    discovered: 'Discovered',
    undiscovered: 'Uncharted',
    sun: 'Star Core',
    planet: 'Planet',
    star: 'Distant Star',
  },
  howTo: {
    title: 'How to Play Mars Odyssey',
    step1Title: '1. Fly & Bounce',
    step1Desc: 'Soar through Space Rescue and the Solar Map in your Jetpack or Starfighter, and bounce across 0.38g Mars hills!',
    step2Title: '2. Rescue, Repair & Quiz',
    step2Desc: 'Pick up stranded astronauts and dock at the green Mothership ring, fix Mars solar stations, and beat side challenges!',
    step3Title: '3. Upgrade & Discover',
    step3Desc: 'Spend Credits in Suits & Pets, trigger Radar (F) to find targets, unlock all 12 Space Book facts, and read Planet Info Cards!',
    desktopControls: 'Desktop Controls',
    mobileControls: 'Mobile & Tablet',
    controlsList: [
      { key: 'WASD / Arrows', action: 'Move / Fly' },
      { key: 'Space', action: 'Up / Jump & Hover' },
      { key: 'Shift / C', action: 'Boost / Down' },
      { key: 'Mouse Drag / Q, E', action: 'Look / Rotate Camera' },
      { key: 'E / Enter', action: 'Pick Up / Deliver / Repair' },
      { key: 'V · F', action: 'Swap Ship · Radar Pulse' },
      { key: 'B · 1 2 3', action: 'Suits Shop · Supplies' },
      { key: 'ESC', action: 'Mission Control Center' },
    ],
    mobileDesc: 'Use the virtual joystick on the left to move and the chunky action buttons on the right to fly, jump, boost, pick up, deliver, and scan!',
    gotIt: 'Blast Off!',
  },
  victory: {
    title: 'Galactic Hero Victory!',
    subtitle: 'Amazing work, Explorer! You completed all 3 realms of Mars Odyssey!',
    astronauts: 'Astronauts Rescued',
    marsStations: 'Mars Stations Fixed',
    bodies: 'Bodies Discovered',
    score: 'Total Star Points',
    playAgain: 'Play Again',
    keepExploring: 'Keep Exploring',
  },
  nasaLab: {
    btnLabel: 'NASA & CSA Lab',
    title: 'NASA & CSA Science Resource Lab',
    subtitle: 'Real space weather, Mars rover imagery, OSDR biology, RadLab dosimetry & CSA STEM!',
    liveBadge: 'Live NASA Data',
    cachedFallbackBadge: 'Reference Dataset',
    tabs: {
      weather: 'DONKI & RadLab',
      imagery: 'APOD & Rovers',
      osdr: 'OSDR Health',
      marstrek: 'Mars Trek',
      csa: 'CSA Youth & Food',
    },
    weatherCalm: 'Calm',
    weatherWatch: 'Solar Watch',
    weatherStorm: 'Solar Storm',
    weatherLabel: 'Space Weather',
    donkiTitle: 'NASA DONKI Space Weather',
    donkiDesc: 'Real solar flares & coronal mass ejections that drive astronaut shielding and radiation risk in Space Rescue & Solar Map.',
    radlabTitle: 'ISS RadLab Dosimetry',
    radlabDesc: 'Authentic absorbed radiation dose rates recorded aboard the International Space Station vs. Mars surface.',
    syncWeatherBtn: 'Sync Live Weather to Game',
    syncedActive: 'Synced to Game Shields',
    issDoseLabel: 'ISS Dose Rate',
    marsDoseLabel: 'Mars Surface',
    earthDoseLabel: 'Earth Sea Level',
    flaresLabel: 'Recent Solar Flares',
    cmesLabel: 'Coronal Mass Ejections',
    apodTitle: 'NASA Astronomy Picture of the Day',
    roverPhotosTitle: 'Latest Mars Rover Photos',
    osdrTitle: 'NASA Open Science Data Repository (OSDR)',
    osdrPlaceholder: 'Search space biology (bone, muscle, immune, sleep)...',
    osdrSearchBtn: 'Search',
    marsTrekTitle: 'NASA Mars Trek Landing & Terrain Sites',
    marsTrekDesc: 'Real Martian elevation and mission coordinates powering Mars Base.',
    launchRealm: 'Explore in Game',
    openPortal: 'Open Official Portal',
    csaTitle: 'Canadian Space Agency (CSA) Partner Resources',
    csaDesc: 'Bilingual STEM youth toolkits and Moon/remote food production science.',
    loading: 'Contacting NASA Deep Space Network...',
  },
  pipName: 'Pip the Space Bot',
  pipHints: {
    space_default: 'Collect glowing crystals and rescue all 5 waving astronauts!',
    space_near_astro: 'An astronaut is right there! Tap PICK UP or press E!',
    space_carry_dock: 'Crew safe! Fly back to the big green Mothership ring and press DELIVER!',
    space_complete: 'Space Rescue complete! Open Menu (ESC) to jump to Mars Base or Solar Map!',
    mars_default: 'Bounce in 0.38g Mars gravity! Find 12 water-ice, 8 O2 tanks, and 5 solar stations.',
    mars_near_station: 'Broken solar station nearby! Press REPAIR or E to fix the array!',
    mars_complete: 'Mars Base is thriving! Open Menu (ESC) to explore the Solar Map!',
    solar_default: 'Fly near planets and stars to see their Info Card and chart them!',
    solar_complete: 'All 13 celestial bodies discovered! You mastered the Solar System!',
    low_oxygen: 'Watch your Oxygen! Grab an O2 tank or use a Cryo Cell (key 1)!',
    low_fuel: 'Jetpack fuel is low—pause thrust to recharge or use a Fuel Pack (key 2)!',
    solar_storm: 'NASA DONKI Solar Storm alert! Radiation is elevated—watch your Shield meter!',
  },
  toasts: {
    great_job: 'Great Job, Space Hero!',
    astro_pickup: 'Astronaut onboard! Fly to the green Mothership ring!',
    astro_delivered: 'Astronaut safely docked! +250 Star Points!',
    crystal_get: 'Crystal collected! +{pts} pts',
    ice_get: 'Water-Ice harvested! +{pts} pts',
    o2_get: 'Oxygen Tank refilled! +35% O2',
    station_fixed: 'Solar Station online! +200 Star Points!',
    body_discovered: 'Discovered {name}! +200 Star Points!',
    asteroid_bump: 'Bonk! Watch out for drifting asteroids! Shield -12%',
    realm_complete: 'Realm Complete! Outstanding exploring!',
    purchased: 'Unlocked {item}!',
    equipped: 'Equipped {item}!',
    consumable_used: 'Activated {item}!',
    fact_unlocked: 'New Space Book Fact: {title}!',
    radar_pulse: 'Radar pulse sent! Follow the glowing beacon!',
    warped: 'Warped to {name}!',
    vehicle_swap: 'Switched to {mode}!',
    weather_synced: 'NASA DONKI Space Weather synced ({level})!',
    challenge_started: 'Challenge Started: {title}!',
    challenge_complete: 'Challenge Complete: {title}! +{pts} pts & +{credits} Credits!',
    challenge_failed: 'Challenge Failed: {title}. Try again!',
  },
  contextLostTitle: '3D Graphics Paused',
  contextLostDesc: 'Your browser temporarily reset WebGL graphics. Waiting to restore automatically...',
  errorTitle: 'Oops! Cosmic Glitch Detected',
  errorRetry: 'Reload Adventure',
  pwa: {
    installApp: 'Install App',
    installIos: 'Install on iPhone/iPad',
    iosTitle: 'Install Mars Odyssey',
    iosStep1: '1. Tap the Share button in your Safari toolbar.',
    iosStep2: '2. Scroll down and tap "Add to Home Screen".',
    close: 'Got it!',
    offlineBadge: 'Offline Mode · Game Ready',
  },
};

const AR: TranslationDict = {
  appTitle: 'رحلة المريخ',
  appTagline: 'الإنقاذ الفضائي والمستعمرة',
  playBtn: 'العب الآن',
  chooseAdventure: 'اختر مغامرتك',
  howToPlay: 'طريقة اللعب',
  realms: {
    space: {
      name: 'إنقاذ الفضاء',
      short: 'إنقاذ الفضاء',
      desc: 'حلّق بحقيبة الطيران أو المركبة لإنقاذ الرواد في السدم!',
    },
    mars: {
      name: 'قاعدة المريخ',
      short: 'قاعدة المريخ',
      desc: 'استكشف جاذبية المريخ، اجمع الجليد وأصلح محطات الطاقة.',
    },
    solar: {
      name: 'خريطة النجوم',
      short: 'خريطة النجوم',
      desc: 'حلّق نحو الشمس والكواكب الثمانية وأربعة نجوم لامعة!',
    },
  },
  hud: {
    oxygen: 'الأكسجين',
    shield: 'الدرع',
    fuel: 'الوقود',
    score: 'نقاط النجوم',
    credits: 'الرصيد',
    speed: 'السرعة',
    shop: 'المتجر والمرافقون',
    spaceBook: 'كتاب الفضاء',
    starMap: 'خريطة النجوم',
    challenges: 'التحديات',
    menuBtn: 'القائمة',
    mute: 'الصوت يعمل',
    unmute: 'صامت',
    touchOn: 'لوحة اللمس',
    touchOff: 'إخفاء اللمس',
    showControls: 'إظهار المفاتيح',
    restart: 'إعادة البدء',
    home: 'الرئيسية',
    radar: 'الرادار',
    pickup: 'التقاط',
    deliver: 'تسليم',
    repair: 'إصلاح',
    jetpackMode: 'حقيبة الطيران',
    starfighterMode: 'مقاتلة نجمية',
    carrying: 'على المتن',
    quality: 'الجودة',
    qualityUltra: 'فائقة',
    qualityHigh: 'عالية',
    qualityBalanced: 'متوازنة',
    paused: 'المهمة متوقفة',
    resume: 'متابعة المغامرة',
    ampActive: 'مضاعف 2x',
  },
  controlCenter: {
    title: 'مركز التحكم بالمهمة',
    subtitle: 'بدّل العوالم، افتح الأدوات، تصفح بيانات ناسا أو عدّل الإعدادات.',
    realmsLabel: 'اختر العالم',
    missionProgress: 'تقدم المهمة',
    toolsLabel: 'أدوات المستكشف',
    settingsLabel: 'النظام والتحكم',
    escHint: 'اضغط ESC في أي وقت لفتح هذه القائمة أو إغلاقها',
  },
  controlsHints: {
    space: 'WASD طيران · Space صعود · C نزول · Shift تسارع · E التقاط/تسليم · V تبديل المركبة · F رادار · ESC القائمة',
    mars: 'WASD حركة · Space قفز/تحليق · Shift جري · E إصلاح المحطة · F رادار · 1-3 إمدادات · ESC القائمة',
    solar: 'WASD طيران · Space/C ارتفاع · Shift تسارع · F رادار · اقترب من الأجرام لبطاقة المعلومات · ESC القائمة',
    touch: 'العصا اليسرى للحركة · الأزرار اليمنى للصعود والهبوط والتسارع والرادار · زر القائمة بالأعلى',
  },
  challenges: {
    btnLabel: 'التحديات',
    title: 'تحديات العالم الجانبية',
    subtitle: 'أكمل التحديات الاختيارية لتحصل على نقاط نجوم ورصيد إضافي!',
    startBtn: 'بدء التحدي',
    cancelBtn: 'إلغاء الحالي',
    activeLabel: 'نشط',
    completedLabel: 'مكتمل',
    lockedLabel: 'مقفل',
    lockedBusy: 'أكمل أو ألغِ التحدي الحالي أولاً',
    readyLabel: 'متاح',
    rewardLabel: 'المكافأة',
    timeLeft: 'الوقت',
    nextTarget: 'التالي',
  },
  planetInfo: {
    typeLabel: 'النوع',
    distanceLabel: 'المسافة',
    diameterLabel: 'القطر',
    dayLabel: 'طول اليوم',
    yearLabel: 'طول السنة',
    moonsLabel: 'الأقمار',
    tempLabel: 'الحرارة',
    factsTitle: 'حقائق مذهلة',
  },
  quizPilot: {
    badge: 'تحدي طيار الاختبار',
    submitHint: 'اختر الإجابة العلمية الصحيحة للفوز بالمكافأة!',
  },
  missions: {
    spaceCrystals: 'البلورات',
    spaceRescued: 'تم إنقاذهم',
    marsIce: 'جليد الماء',
    marsOxygen: 'خزانات O2',
    marsStations: 'المحطات',
    solarDiscovered: 'مكتشف',
    completeBadge: 'مكتمل!',
  },
  shop: {
    title: 'ورشة البدلات والمرافقين',
    subtitle: 'طوّر بدلتك، تقنياتك، إمداداتك، وحيواناتك الآلية!',
    tabs: {
      suits: 'البدلات',
      abilities: 'القدرات',
      consumables: 'الإمدادات',
      pets: 'المرافقون',
    },
    buy: 'شراء',
    equip: 'تجهيز',
    equipped: 'مجهّز',
    owned: 'مفعّل',
    free: 'مجاني',
    useHotkey: 'اختصار',
    needCredits: 'رصيد غير كافٍ',
    inBag: 'في الحقيبة',
  },
  spaceBook: {
    title: 'كتاب علوم الفضاء',
    unlockedCounter: 'حقائق مكتشفة',
    lockedTitle: 'لغز فضائي غير مكتشف',
    lockedHint: 'واصل استكشاف العوالم الثلاثة لفتح هذه المعلومة العلمية!',
  },
  starMap: {
    title: 'خريطة المجموعة الشمسية',
    subtitle: 'اضغط على أي كوكب أو الشمس أو نجم بعيد للانتقال الفوري إليه!',
    warp: 'انتقال فوري',
    discovered: 'مكتشف',
    undiscovered: 'غير مكتشف',
    sun: 'النجم الأم',
    planet: 'كوكب',
    star: 'نجم بعيد',
  },
  howTo: {
    title: 'كيف تلعب رحلة المريخ',
    step1Title: '1. حلّق واقفز بخفة',
    step1Desc: 'طر في عالم الإنقاذ وخريطة النجوم بحقيبة الطيران أو المقاتلة، واقفز بخفة في جاذبية المريخ (0.38g)!',
    step2Title: '2. أنقذ وأصلح وتحدَّ',
    step2Desc: 'التقط الرواد وعد لحلقة السفينة الخضراء، أصلح محطات المريخ الشمسية، وأنجز التحديات الجانبية!',
    step3Title: '3. طوّر واكتشف العلوم',
    step3Desc: 'استخدم الرصيد في المتجر، شغّل الرادار (F)، افتح 12 حقيقة علمية وتصفح بطاقات الكواكب!',
    desktopControls: 'تحكم الكمبيوتر',
    mobileControls: 'الهاتف واللوحي',
    controlsList: [
      { key: 'WASD / الأسهم', action: 'حركة / طيران' },
      { key: 'Space', action: 'صعود / قفز وتحليق' },
      { key: 'Shift / C', action: 'تسارع / نزول' },
      { key: 'سحب الفأرة / Q, E', action: 'تدوير الكاميرا' },
      { key: 'E / Enter', action: 'التقاط / تسليم / إصلاح' },
      { key: 'V · F', action: 'تبديل المركبة · نبضة الرادار' },
      { key: 'B · 1 2 3', action: 'المتجر · الإمدادات' },
      { key: 'ESC', action: 'مركز التحكم والقائمة' },
    ],
    mobileDesc: 'استخدم عصا التحكم اليسرى للحركة والأزرار الكبيرة على اليمين للطيران والقفز والتسارع والالتقاط والرادار!',
    gotIt: 'انطلاق!',
  },
  victory: {
    title: 'انتصار بطل المجرة!',
    subtitle: 'عمل رائع أيها المستكشف! لقد أكملت جميع العوالم الثلاثة في رحلة المريخ!',
    astronauts: 'رواد تم إنقاذهم',
    marsStations: 'محطات المريخ المصلحة',
    bodies: 'أجرام مكتشفة',
    score: 'مجموع النقاط',
    playAgain: 'العب مجدداً',
    keepExploring: 'واصل الاستكشاف',
  },
  nasaLab: {
    btnLabel: 'مختبر ناسا',
    title: 'مختبر موارد ناسا ووكالة الفضاء الكندية',
    subtitle: 'طقس الفضاء الحي، صور عربات المريخ، أبحاث OSDR، قياسات RadLab وموارد CSA!',
    liveBadge: 'بيانات ناسا الحية',
    cachedFallbackBadge: 'مجموعة بيانات مرجعية',
    tabs: {
      weather: 'DONKI و RadLab',
      imagery: 'APOD والعربات',
      osdr: 'أبحاث OSDR',
      marstrek: 'خرائط Mars Trek',
      csa: 'شراكة CSA والغذاء',
    },
    weatherCalm: 'هادئ',
    weatherWatch: 'مراقبة شمسية',
    weatherStorm: 'عاصفة شمسية',
    weatherLabel: 'طقس الفضاء',
    donkiTitle: 'قاعدة بيانات طقس الفضاء DONKI',
    donkiDesc: 'توهجات شمسية وانبعاثات إكليلية حقيقية تؤثر على درع الإشعاع في عالم إنقاذ الفضاء وخريطة النجوم.',
    radlabTitle: 'قياسات إشعاع محطة الفضاء RadLab',
    radlabDesc: 'معدلات الجرعة الإشعاعية الممتصة المسجلة على محطة الفضاء الدولية مقارنة بسطح المريخ.',
    syncWeatherBtn: 'مزامنة الطقس الحي مع اللعبة',
    syncedActive: 'متزامن مع دروع اللعبة',
    issDoseLabel: 'معدل محطة الفضاء',
    marsDoseLabel: 'سطح المريخ',
    earthDoseLabel: 'سطح الأرض',
    flaresLabel: 'أحدث التوهجات الشمسية',
    cmesLabel: 'الانبعاثات الإكليلية',
    apodTitle: 'صورة اليوم الفلكية من ناسا',
    roverPhotosTitle: 'أحدث صور عربات المريخ',
    osdrTitle: 'مستودع بيانات العلوم المفتوحة OSDR',
    osdrPlaceholder: 'ابحث في بيولوجيا الفضاء (bone, muscle, immune, sleep)...',
    osdrSearchBtn: 'بحث',
    marsTrekTitle: 'مواقع الهبوط والتضاريس في Mars Trek',
    marsTrekDesc: 'إحداثيات وارتفاعات مريخية حقيقية تستند إليها قاعدة المريخ.',
    launchRealm: 'استكشف في اللعبة',
    openPortal: 'فتح البوابة الرسمية',
    csaTitle: 'موارد وكالة الفضاء الكندية (CSA)',
    csaDesc: 'أدوات تعليمية ثنائية اللغة للشباب وتقنيات إنتاج الغذاء في الفضاء والمناطق النائية.',
    loading: 'جارٍ الاتصال بشبكة ناسا للفضاء العميق...',
  },
  pipName: 'بيب الروبوت الفضائي',
  pipHints: {
    space_default: 'اجمع البلورات المضيئة وأنقذ الرواد الخمسة!',
    space_near_astro: 'يوجد رائد فضاء هنا! اضغط التقاط أو مفتاح E!',
    space_carry_dock: 'الرائد بأمان! عد إلى حلقة السفينة الخضراء واضغط تسليم!',
    space_complete: 'اكتمل إنقاذ الفضاء! افتح القائمة (ESC) للانتقال لقاعدة المريخ أو خريطة النجوم!',
    mars_default: 'استمتع بجاذبية المريخ! اجمع 12 جليداً و8 أكسجين وأصلح 5 محطات شمسية.',
    mars_near_station: 'محطة شمسية معطلة قريبة! اضغط إصلاح أو E لتشغيلها!',
    mars_complete: 'قاعدة المريخ مزدهرة! افتح القائمة (ESC) لاستكشاف خريطة النجوم!',
    solar_default: 'حلّق قرب الكواكب والنجوم لرؤية بطاقة المعلومات واكتشافها!',
    solar_complete: 'اكتشفت جميع الأجرام الـ 13! أنت خبير المجموعة الشمسية!',
    low_oxygen: 'انتبه للأكسجين! التقط خزان O2 أو استخدم خلية التبريد (مفتاح 1)!',
    low_fuel: 'وقود الطيران منخفض—توقف قليلاً لإعادة الشحن أو استخدم عبوة الوقود (2)!',
    solar_storm: 'تنبيه عاصفة شمسية من ناسا DONKI! الإشعاع مرتفع—راقب مقياس الدرع!',
  },
  toasts: {
    great_job: 'عمل رائع يا بطل الفضاء!',
    astro_pickup: 'الرائد على المتن! حلّق إلى الحلقة الخضراء!',
    astro_delivered: 'تم تسليم الرائد بأمان! +250 نقطة!',
    crystal_get: 'تم جمع بلورة! +{pts} نقطة',
    ice_get: 'تم جمع جليد الماء! +{pts} نقطة',
    o2_get: 'تمت تعبئة الأكسجين! +35%',
    station_fixed: 'تم تشغيل المحطة الشمسية! +200 نقطة!',
    body_discovered: 'تم اكتشاف {name}! +200 نقطة!',
    asteroid_bump: 'احترس من الكويكبات! الدرع -12%',
    realm_complete: 'اكتمل العالم! استكشاف مذهل!',
    purchased: 'تم فتح {item}!',
    equipped: 'تم تجهيز {item}!',
    consumable_used: 'تم تفعيل {item}!',
    fact_unlocked: 'حقيقة علمية جديدة: {title}!',
    radar_pulse: 'تم إرسال نبضة الرادار! اتبع الإشارة!',
    warped: 'تم الانتقال إلى {name}!',
    vehicle_swap: 'تم التبديل إلى {mode}!',
    weather_synced: 'تمت مزامنة طقس الفضاء من ناسا DONKI ({level})!',
    challenge_started: 'بدأ التحدي: {title}!',
    challenge_complete: 'نجحت في التحدي: {title}! +{pts} نقطة و+{credits} رصيد!',
    challenge_failed: 'فشل التحدي: {title}. حاول مجدداً!',
  },
  contextLostTitle: 'توقف العرض ثلاثي الأبعاد مؤقتاً',
  contextLostDesc: 'قام المتصفح بإعادة ضبط الرسوميات، جارٍ الاستعادة تلقائياً...',
  errorTitle: 'عذراً! حدث خلل كوني بسيط',
  errorRetry: 'إعادة تحميل المغامرة',
  pwa: {
    installApp: 'تثبيت التطبيق',
    installIos: 'تثبيت على الآيفون/الآيباد',
    iosTitle: 'تثبيت رحلة المريخ',
    iosStep1: '1. اضغط على زر المشاركة (Share) في شريط سفاري.',
    iosStep2: '2. مرّر للأسفل واختر "إضافة إلى الشاشة الرئيسية".',
    close: 'حسناً!',
    offlineBadge: 'وضع عدم الاتصال · اللعبة جاهزة',
  },
};

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  en: EN,
  ar: AR,
};

export function formatMsg(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    template
  );
}
