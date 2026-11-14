export type RealmId = 'space' | 'mars' | 'solar';
export type GameScreen = 'home' | 'playing' | 'paused' | 'victory';
export type GraphicsQuality = 'ultra' | 'high' | 'balanced';
export type Language = 'en' | 'ar';
export type SpaceVehicleMode = 'jetpack' | 'starfighter';

export type SuitId = 'vanguard' | 'cobalt' | 'helios' | 'crimson' | 'biodome';
export type AbilityId = 'overdrive' | 'magnet' | 'radar' | 'recycler';
export type ConsumableId = 'cryo_cell' | 'hydrazine_pack' | 'telemetry_amp';
export type PetId = 'scout_drone' | 'ares_k9' | 'valkyrie_probe';

export type ChallengeId =
  | 'space_speed_rescue'
  | 'space_asteroid_dodger'
  | 'space_crystal_chain'
  | 'mars_oxygen_sprint'
  | 'mars_solar_rush'
  | 'mars_dune_jumper'
  | 'solar_grand_tour'
  | 'solar_star_hopper'
  | 'solar_quiz_pilot';

export interface SuitItem {
  id: SuitId;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  cost: number;
  primaryHex: string;
  accentHex: string;
  visorHex: string;
}

export interface AbilityItem {
  id: AbilityId;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  cost: number;
  badgeColor: string;
}

export interface ConsumableItem {
  id: ConsumableId;
  hotkey: '1' | '2' | '3';
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  cost: number;
  accentColor: string;
}

export interface PetItem {
  id: PetId;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  cost: number;
  primaryHex: string;
  accentHex: string;
}

export interface ScienceFact {
  id: string;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
  metricEn: string;
  metricAr: string;
  categoryEn: string;
  categoryAr: string;
  accent: string;
}

export interface SolarBodySpec {
  id: string;
  nameEn: string;
  nameAr: string;
  kind: 'sun' | 'planet' | 'star';
  color: string;
  accentColor: string;
  radius: number;
  distance: number;
  angle: number;
  elevation: number;
  hasRings?: boolean;
  hasMoon?: boolean;
  subtitleEn: string;
  subtitleAr: string;
}

export interface SolarBodyDetails {
  id: string;
  typeEn: string;
  typeAr: string;
  distanceEn: string;
  distanceAr: string;
  diameterEn: string;
  diameterAr: string;
  dayLengthEn: string;
  dayLengthAr: string;
  yearLengthEn: string;
  yearLengthAr: string;
  moonsEn: string;
  moonsAr: string;
  tempEn: string;
  tempAr: string;
  factsEn: string[];
  factsAr: string[];
}

export interface PlanetQuizQuestion {
  bodyId: string;
  questionEn: string;
  questionAr: string;
  optionsEn: string[];
  optionsAr: string[];
  correctIndex: number;
}

export interface ChallengeSpec {
  id: ChallengeId;
  realm: RealmId;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  rewardScore: number;
  rewardCredits: number;
  timeLimitSec: number; // 0 if no hard overall timer
  targetCount: number;
  requiresChallengeId?: ChallengeId;
}

export interface ActiveChallengeState {
  id: ChallengeId;
  realm: RealmId;
  progress: number;
  target: number;
  timeRemaining: number; // overall or link countdown
  auxTimer: number; // e.g., crystal chain link timer
  nextPlanetId?: string;
}

export interface SpaceRealmProgress {
  crystals: number;
  totalCrystals: number;
  rescued: number;
  totalAstronauts: number;
  carryingCount: number;
  nearAstronaut: boolean;
  nearDock: boolean;
  vehicleMode: SpaceVehicleMode;
  completed: boolean;
}

export interface MarsRealmProgress {
  ice: number;
  totalIce: number;
  oxygenTanks: number;
  totalOxygenTanks: number;
  stationsRepaired: number;
  totalStations: number;
  nearStation: boolean;
  completed: boolean;
}

export interface SolarRealmProgress {
  discoveredIds: string[];
  totalBodies: number;
  nearestBodyId: string | null;
  activeInfoBodyId: string | null;
  completed: boolean;
}

export type SpaceWeatherAlert = 'calm' | 'watch' | 'storm';

export interface SpaceWeatherState {
  alertLevel: SpaceWeatherAlert;
  synced: boolean;
  issDoseRate: number;
  deepSpaceDoseRate: number;
  latestFlare: string;
}

export interface MarsTrekSite {
  id: string;
  nameEn: string;
  nameAr: string;
  coords: string;
  elevation: string;
  missionEn: string;
  missionAr: string;
  descEn: string;
  descAr: string;
  realmTarget: RealmId;
  accent: string;
}

export interface CsaResourceItem {
  id: string;
  titleEn: string;
  titleAr: string;
  badgeEn: string;
  badgeAr: string;
  descEn: string;
  descAr: string;
  connectionEn: string;
  connectionAr: string;
  url: string;
  accent: string;
}

export interface GameProgress {
  screen: GameScreen;
  realm: RealmId;
  oxygen: number;
  shield: number;
  fuel: number;
  score: number;
  credits: number;
  speed: number;
  scannerCooldown: number;
  scannerMaxCooldown: number;
  amplifierCharges: number;
  equippedSuit: SuitId;
  ownedSuits: SuitId[];
  ownedAbilities: AbilityId[];
  consumables: Record<ConsumableId, number>;
  equippedPet: PetId;
  ownedPets: PetId[];
  unlockedFactIds: string[];
  completedChallengeIds: ChallengeId[];
  activeChallenge: ActiveChallengeState | null;
  pendingQuizBodyId: string | null;
  space: SpaceRealmProgress;
  mars: MarsRealmProgress;
  solar: SolarRealmProgress;
  spaceWeather: SpaceWeatherState;
  pipHintKey: string;
  quality: GraphicsQuality;
  fps: number;
  isSoftwareGl: boolean;
  contextLost: boolean;
  allRealmsComplete: boolean;
  victoryShown: boolean;
}

export interface ToastPayload {
  id: number;
  textKey: string;
  params?: Record<string, string | number>;
  tone?: 'success' | 'info' | 'warning' | 'fact';
  factId?: string;
}
