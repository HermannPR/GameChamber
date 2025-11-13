/**
 * TOML Parser for Dream Definitions
 *
 * Parses and validates TOML dream files into DreamDefinition objects.
 */

import TOML from '@iarna/toml';
import type { DreamDefinition } from '../utils/types';

/**
 * Parse TOML text into a DreamDefinition object
 */
export function parseTOML(tomlText: string): DreamDefinition {
  try {
    // Parse TOML
    const parsed = TOML.parse(tomlText) as any;

    // Validate required fields
    validateDreamDefinition(parsed);

    // Return typed object
    return parsed as DreamDefinition;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse TOML: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validate that a parsed object has all required fields
 */
function validateDreamDefinition(dream: any): void {
  const errors: string[] = [];

  // Check [meta]
  if (!dream.meta) {
    errors.push('Missing required section: [meta]');
  } else {
    if (!dream.meta.type) errors.push('Missing required field: meta.type');
    if (!dream.meta.title) errors.push('Missing required field: meta.title');
  }

  // Check [world]
  if (!dream.world) {
    errors.push('Missing required section: [world]');
  } else {
    if (!dream.world.type) errors.push('Missing required field: world.type');
    if (!dream.world.terrain) {
      errors.push('Missing required section: [world.terrain]');
    } else {
      if (!dream.world.terrain.type) {
        errors.push('Missing required field: world.terrain.type');
      }
    }
  }

  // Check [atmosphere]
  if (!dream.atmosphere) {
    errors.push('Missing required section: [atmosphere]');
  }

  // Check [camera]
  if (!dream.camera) {
    errors.push('Missing required section: [camera]');
  } else {
    if (!dream.camera.start_position) {
      errors.push('Missing required field: camera.start_position');
    }
    if (!dream.camera.movement) {
      errors.push('Missing required field: camera.movement');
    }
  }

  // Check [audio]
  if (!dream.audio) {
    errors.push('Missing required section: [audio]');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid dream definition:\n${errors.join('\n')}`);
  }
}

/**
 * Stringify a DreamDefinition back to TOML
 */
export function stringifyTOML(dream: DreamDefinition): string {
  try {
    return TOML.stringify(dream as any);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to stringify TOML: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validate value ranges (0-1 for intensity, density, volume, etc.)
 */
export function validateRanges(dream: DreamDefinition): string[] {
  const warnings: string[] = [];

  // Helper to check 0-1 range
  const check01 = (value: number | undefined, name: string) => {
    if (value !== undefined && (value < 0 || value > 1)) {
      warnings.push(`${name} should be between 0 and 1, got ${value}`);
    }
  };

  // Check emotion intensity
  check01(dream.emotion?.intensity, 'emotion.intensity');

  // Check atmosphere values
  check01(dream.atmosphere?.sun_intensity, 'atmosphere.sun_intensity');
  check01(dream.atmosphere?.ambient_intensity, 'atmosphere.ambient_intensity');
  check01(dream.atmosphere?.fog?.density, 'atmosphere.fog.density');

  // Check audio volumes
  dream.audio?.ambient?.forEach((sound, i) => {
    check01(sound.volume, `audio.ambient[${i}].volume`);
  });

  check01(dream.audio?.music?.intensity, 'audio.music.intensity');

  // Check effects
  check01(dream.effects?.color_grading?.saturation, 'effects.color_grading.saturation');
  check01(dream.effects?.vignette?.intensity, 'effects.vignette.intensity');
  check01(dream.effects?.bloom?.intensity, 'effects.bloom.intensity');

  return warnings;
}
