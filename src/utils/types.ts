/**
 * TypeScript type definitions for DreamExplorer
 * Mirrors the TOML schema structure
 */

// ============================================================================
// Meta Information
// ============================================================================

export type DreamType = 'dream' | 'nightmare' | 'memory' | 'abstract' | 'meditation';

export interface DreamMeta {
  type: DreamType;
  title: string;
  duration?: number;  // 0 = infinite
  description?: string;
  prompt?: string;  // Original AI prompt
}

// ============================================================================
// Emotional Journey
// ============================================================================

export type Emotion =
  | 'peaceful' | 'joyful' | 'calm' | 'excited' | 'curious' | 'hopeful'
  | 'anxious' | 'sad' | 'angry' | 'overwhelmed' | 'lonely' | 'fearful'
  | 'contemplative' | 'nostalgic' | 'dreamy' | 'focused' | 'stressed'
  | 'awestruck' | 'adventurous';

export type TransitionType = 'gradual' | 'sudden' | 'wave' | 'none';

export interface EmotionJourney {
  start?: Emotion;
  end?: Emotion;
  intensity?: number;  // 0-1
  transition?: TransitionType;
}

// ============================================================================
// World Configuration
// ============================================================================

export type WorldType = 'landscape' | 'interior' | 'abstract' | 'void' | 'infinite';
export type WorldScale = 'tiny' | 'intimate' | 'vast' | 'infinite';
export type GravityType = 'earth' | 'low' | 'none' | 'reverse' | 'variable';
export type BoundaryType = 'hard' | 'soft' | 'infinite' | 'looping';

export interface World {
  type: WorldType;
  width?: number;
  height?: number;
  depth?: number;
  scale?: WorldScale;
  gravity?: GravityType;
  boundaries?: BoundaryType;
  backgroundColor?: string;
  terrain: TerrainConfig;
}

export type TerrainType =
  | 'forest' | 'desert' | 'ocean' | 'mountains' | 'plains' | 'tundra' | 'jungle'
  | 'cave' | 'cavern' | 'underground'
  | 'void' | 'geometric' | 'fractal' | 'noise'
  | 'volcanic' | 'alien';

export type TerrainStyle = 'realistic' | 'stylized' | 'abstract' | 'surreal' | 'glitch';

export interface TerrainFeature {
  type: string;
  size?: number;
  count?: number;
  position?: [number, number, number] | string;
  [key: string]: any;  // Allow additional properties
}

export interface TerrainConfig {
  type: TerrainType;
  seed?: number;
  style?: TerrainStyle;
  height_variation?: number;
  frequency?: number;
  octaves?: number;
  amplitude?: number;
  features?: TerrainFeature[];
}

// ============================================================================
// Atmosphere & Lighting
// ============================================================================

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night' | 'golden_hour' | 'twilight' | 'timeless';
export type LightingType = 'warm' | 'cool' | 'dramatic' | 'flat' | 'volumetric' | 'natural';
export type WeatherType = 'clear' | 'rain' | 'snow' | 'storm' | 'fog';
export type SkyType = 'gradient' | 'procedural' | 'color' | 'starfield';
export type CloudType = 'none' | 'soft' | 'dramatic' | 'stormy';

export interface FogConfig {
  enabled: boolean;
  density: number;  // 0-1
  color: string;
  distance?: number;
}

export interface GodRaysConfig {
  enabled: boolean;
  intensity: number;
  shafts?: number;
  color?: string;
}

export interface ParticleConfig {
  type: string;
  density?: number;
  count?: number;
  float?: string;
  pattern?: string;
  glow?: boolean;
  color?: string;
  size?: number;
  [key: string]: any;
}

export interface SkyConfig {
  type: SkyType;
  colors?: string[];
  clouds?: CloudType;
  alien_features?: boolean;
}

export interface Atmosphere {
  time?: TimeOfDay;
  lighting?: LightingType;
  sun_intensity?: number;
  ambient_intensity?: number;
  fog?: FogConfig;
  god_rays?: GodRaysConfig;
  particles?: ParticleConfig[];
  weather?: WeatherType;
  sky?: SkyConfig;
}

// ============================================================================
// Camera & Controls
// ============================================================================

export type MovementType = 'first_person' | 'float' | 'orbit' | 'cinematic' | 'guided';

export interface CameraEffect {
  type: string;
  intensity?: number;
  [key: string]: any;
}

export interface CameraConfig {
  start_position: [number, number, number];
  start_rotation?: [number, number, number];
  movement: MovementType;
  speed?: number;
  can_fly?: boolean;
  can_look_around?: boolean;
  effects?: CameraEffect[];
}

// ============================================================================
// Audio
// ============================================================================

export type AudioStyle = 'ambient' | 'drone' | 'melodic' | 'rhythmic' | 'cinematic' | 'none';
export type ReverbType = 'forest' | 'cave' | 'hall' | 'room' | 'canyon' | 'none';

export interface AmbientSound {
  type: string;
  volume: number;
  variation?: string;
  distance?: string;
  position?: [number, number, number];
  spatial?: boolean;
  [key: string]: any;
}

export interface MusicConfig {
  enabled: boolean;
  style: AudioStyle;
  tempo?: number;
  key?: string;
  instruments?: string[];
  intensity?: number;
  evolution?: string;
}

export interface AudioConfig {
  spatial_audio?: boolean;
  reverb_type?: ReverbType;
  reverb_intensity?: number;
  ambient?: AmbientSound[];
  music?: MusicConfig;
}

// ============================================================================
// World Elements
// ============================================================================

export interface VegetationConfig {
  type: string;
  species?: string;
  density: number;
  distribution?: string;
  variation?: number;
  count?: number;
  sway?: {
    enabled: boolean;
    wind_responsive?: boolean;
    intensity?: number;
  };
  glow?: boolean;
  glow_color?: string;
  pulsing?: boolean;
  height?: [number, number];
  color_variation?: number;
  wind_effect?: string;
  colors?: string[];
  [key: string]: any;
}

export interface WaterConfig {
  type: string;
  path?: string;
  width?: number;
  depth?: number;
  clarity?: number;
  flow_speed?: number;
  sound?: boolean;
  reflections?: boolean;
  [key: string]: any;
}

export interface InteractiveElement {
  type: string;
  position: [number, number, number];
  radius?: number;
  effect?: string;
  visual?: string;
  [key: string]: any;
}

export interface Wildlife {
  type: string;
  count: number;
  behavior: string;
  flee_distance?: number;
  animation?: string;
  glow?: boolean;
  [key: string]: any;
}

export interface Structure {
  type: string;
  position?: [number, number, number];
  count?: number;
  size_range?: [number, number];
  height_range?: [number, number];
  material?: string;
  story?: string;
  interactive?: boolean;
  glow_veins?: boolean;
  vein_color?: string;
  colors?: string[];
  pulsing_glow?: boolean;
  [key: string]: any;
}

export interface LavaConfig {
  type: string;
  path?: string;
  width?: number;
  flow_speed?: number;
  glow_intensity?: number;
  heat_distortion?: boolean;
  sound?: boolean;
  count?: number;
  size_range?: [number, number];
  bubbling?: boolean;
  particles?: boolean;
  [key: string]: any;
}

export interface Elements {
  vegetation?: VegetationConfig[];
  water?: WaterConfig[];
  interactive?: InteractiveElement[];
  wildlife?: Wildlife[];
  structures?: Structure[];
  lava?: LavaConfig[];
  [key: string]: any;
}

// ============================================================================
// Interaction
// ============================================================================

export interface InteractionMoment {
  trigger: string;
  effect?: string;
  audio?: string;
  visual?: string;
  camera?: string;
  feeling?: string;
  description?: string;
  duration?: number;
}

export interface Interaction {
  input_method: string;
  can_run?: boolean;
  can_interact?: string[];
  moments?: InteractionMoment[];
}

// ============================================================================
// Effects & Post-Processing
// ============================================================================

export interface ColorGradingConfig {
  saturation?: number;
  temperature?: string;
  vibrance?: number;
  tint?: string;
  contrast?: number;
}

export interface VignetteConfig {
  intensity: number;
  color: string;
}

export interface BloomConfig {
  enabled: boolean;
  threshold?: number;
  intensity?: number;
}

export interface FilmGrainConfig {
  enabled: boolean;
  intensity?: number;
}

export interface DreamEffect {
  type: string;
  intensity?: number;
  color?: string;
  factor?: number;
  near_lava?: boolean;
  [key: string]: any;
}

export interface Effects {
  color_grading?: ColorGradingConfig;
  vignette?: VignetteConfig;
  bloom?: BloomConfig;
  chromatic_aberration?: { enabled: boolean; intensity?: number };
  film_grain?: FilmGrainConfig;
  motion_blur?: { enabled: boolean };
  dream_effects?: DreamEffect[];
}

// ============================================================================
// Progression
// ============================================================================

export type ProgressionType =
  | 'static' | 'calm_to_calmer' | 'journey' | 'revelation'
  | 'cycle' | 'therapeutic_journey';

export interface ProgressionEvent {
  time: number;  // Seconds after start
  event: string;
  effect?: Record<string, any>;
}

export interface ProgressionConfig {
  type: ProgressionType;
  events?: ProgressionEvent[];
  acts?: any[];  // For therapeutic journeys
}

// ============================================================================
// Metadata
// ============================================================================

export interface AccessibilityInfo {
  motion_sickness_risk: 'low' | 'medium' | 'high';
  photosensitivity_warning: boolean;
  requires_audio?: boolean;
}

export interface Metadata {
  tags: string[];
  mood: string[];
  best_for: string[];
  intensity: 'low' | 'medium' | 'high';
  duration_recommendation: string;
  accessibility: AccessibilityInfo;
}

// ============================================================================
// Complete Dream Definition
// ============================================================================

export interface DreamDefinition {
  meta: DreamMeta;
  emotion?: EmotionJourney;
  world: World;
  atmosphere: Atmosphere;
  camera: CameraConfig;
  audio: AudioConfig;
  elements?: Elements;
  interaction?: Interaction;
  effects?: Effects;
  progression?: ProgressionConfig;
  metadata?: Metadata;
}

// ============================================================================
// Runtime State
// ============================================================================

export interface DreamState {
  elapsed_time: number;
  player_position: [number, number, number];
  triggered_moments: Set<string>;
  current_act?: number;
}
