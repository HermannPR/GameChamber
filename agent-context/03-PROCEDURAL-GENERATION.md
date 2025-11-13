# 🌿 Procedural Generation Systems

## Overview

DreamExplorer uses procedural generation to create unique, varied experiences from compact definitions. This allows AI to describe **intent** while algorithms handle **implementation**.

## Core Philosophy

> "AI describes what the world should feel like.
> Procedural systems figure out how to make it real."

## System Architecture

```
TOML Definition (Intent)
        ↓
Procedural Generators (Implementation)
        ↓
Three.js Scene (Rendered World)
```

---

## 1. TERRAIN GENERATION

### Technique: Marching Cubes + Noise Fields

**Input**: Terrain parameters from TOML
**Output**: 3D mesh geometry

### Algorithm

```typescript
class TerrainGenerator {
  generate(config: TerrainConfig): THREE.BufferGeometry {
    // 1. Create 3D noise field
    const noiseField = this.createNoiseField(
      config.width,
      config.height,
      config.depth,
      config.seed
    );

    // 2. Apply terrain type modifications
    this.applyTerrainType(noiseField, config.type);

    // 3. Use marching cubes to extract surface
    const geometry = this.marchingCubes(noiseField, config.threshold);

    // 4. Apply textures based on biome
    this.applyBiomeTextures(geometry, config.type);

    // 5. Add details (grass, rocks, etc.)
    this.addSurfaceDetails(geometry, config);

    return geometry;
  }

  private createNoiseField(width, height, depth, seed) {
    const noise = new SimplexNoise(seed);
    const field = new Float32Array(width * height * depth);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
          // Layer multiple octaves for detail
          let value = 0;
          let amplitude = 1;
          let frequency = config.frequency;

          for (let octave = 0; octave < config.octaves; octave++) {
            value += noise.noise3D(
              x * frequency,
              y * frequency,
              z * frequency
            ) * amplitude;

            amplitude *= 0.5;
            frequency *= 2.0;
          }

          const index = x + y * width + z * width * height;
          field[index] = value;
        }
      }
    }

    return field;
  }
}
```

### Terrain Types

**Forest**
- Base elevation: gentle hills (frequency: 0.03)
- Features: flat areas for clearings
- Surface: dirt, grass, rocks

**Mountains**
- Base elevation: high peaks (frequency: 0.02, amplitude: high)
- Features: sharp ridges, cliffs
- Surface: rock, snow at peaks

**Desert**
- Base elevation: dunes (frequency: 0.05)
- Features: smooth, rolling
- Surface: sand, occasional rocks

**Cave/Underground**
- Inverted noise (hollows create caverns)
- Features: stalactites, stalagmites
- Surface: rock, crystals, water pools

**Abstract/Void**
- Minimal or no terrain
- Floating platforms
- Geometric shapes

### Performance Optimizations

1. **Level of Detail (LOD)**
   - Generate high detail near player
   - Lower detail for distant terrain
   - Dynamically update as player moves

2. **Chunk System**
   - Divide world into chunks (32x32 meters)
   - Load/unload chunks based on distance
   - Async generation in Web Workers

3. **Geometry Simplification**
   - Reduce polygon count for distant terrain
   - Use normal maps for detail

---

## 2. VEGETATION GENERATION

### Technique: L-Systems (Lindenmayer Systems)

**Input**: Species, size, seed
**Output**: 3D tree/plant geometry

### L-System Basics

L-systems use recursive rules to generate complex branching structures.

**Alphabet**:
- `F` = Forward (draw branch)
- `+` = Rotate left
- `-` = Rotate right
- `[` = Push state (save position)
- `]` = Pop state (return to saved position)

**Example: Simple Tree**
```
Axiom: F
Rules: F → F[+F]F[-F]F
Iterations: 4

Generation:
0: F
1: F[+F]F[-F]F
2: F[+F]F[-F]F[+F[+F]F[-F]F]F[+F]F[-F]F[-F[+F]F[-F]F]F[+F]F[-F]F
... (continues)
```

### Implementation

```typescript
class LSystem {
  generate(species: string, seed: number): string {
    const rules = this.getSpeciesRules(species);
    let state = rules.axiom;

    for (let i = 0; i < rules.iterations; i++) {
      state = this.applyRules(state, rules.rules, seed);
    }

    return state;
  }

  private applyRules(state: string, rules: Rules, seed: number): string {
    const rng = seededRandom(seed);
    let newState = '';

    for (const char of state) {
      if (rules[char]) {
        // Stochastic rules: multiple possibilities
        const options = rules[char];
        const chosen = options[Math.floor(rng() * options.length)];
        newState += chosen;
      } else {
        newState += char;
      }
    }

    return newState;
  }

  interpretTo3D(lstring: string, params: TreeParams): THREE.Group {
    const tree = new THREE.Group();
    const stack: State[] = [];
    let state = {
      position: new THREE.Vector3(0, 0, 0),
      direction: new THREE.Vector3(0, 1, 0),
      thickness: params.trunkThickness
    };

    for (const char of lstring) {
      switch (char) {
        case 'F':
          // Draw branch
          const branch = this.createBranch(
            state.position,
            state.direction,
            params.branchLength,
            state.thickness
          );
          tree.add(branch);
          state.position.add(
            state.direction.clone().multiplyScalar(params.branchLength)
          );
          state.thickness *= 0.9; // Taper
          break;

        case '+':
          state.direction.applyAxisAngle(
            new THREE.Vector3(0, 0, 1),
            params.angle
          );
          break;

        case '-':
          state.direction.applyAxisAngle(
            new THREE.Vector3(0, 0, 1),
            -params.angle
          );
          break;

        case '[':
          stack.push({...state});
          break;

        case ']':
          state = stack.pop();
          break;
      }
    }

    // Add leaves/foliage
    this.addFoliage(tree, params);

    return tree;
  }
}
```

### Species Definitions

**Oak Tree**
```typescript
{
  axiom: 'F',
  rules: {
    'F': ['F[+F]F[-F]F', 'F[++F][-F]F', 'F[+F][-F]']
  },
  iterations: 4,
  angle: 25,
  branchLength: 2.0,
  trunkThickness: 0.3,
  foliage: 'dense_spherical'
}
```

**Pine Tree**
```typescript
{
  axiom: 'F',
  rules: {
    'F': ['F[+++++F][-F]F', 'F[++++F][-F]F']
  },
  iterations: 5,
  angle: 35,
  branchLength: 1.5,
  trunkThickness: 0.2,
  foliage: 'conical_needles'
}
```

**Willow Tree**
```typescript
{
  axiom: 'F',
  rules: {
    'F': ['F[+F][-F]F', 'F[--F][++F]']
  },
  iterations: 6,
  angle: 20,
  branchLength: 3.0,
  trunkThickness: 0.25,
  foliage: 'hanging_dense'
}
```

### Instanced Rendering

For grass, flowers, and repeated small vegetation:

```typescript
class GrassSystem {
  create(density: number, area: number, seed: number): THREE.InstancedMesh {
    const count = Math.floor(density * area * 10);
    const geometry = this.createGrassBlade();
    const material = this.createGrassMaterial();

    const mesh = new THREE.InstancedMesh(geometry, material, count);

    const rng = seededRandom(seed);
    const matrix = new THREE.Matrix4();

    for (let i = 0; i < count; i++) {
      const x = (rng() - 0.5) * area;
      const z = (rng() - 0.5) * area;
      const y = this.getTerrainHeight(x, z);

      // Random rotation and scale
      const rotation = rng() * Math.PI * 2;
      const scale = 0.8 + rng() * 0.4;

      matrix.makeRotationY(rotation);
      matrix.scale(new THREE.Vector3(scale, scale, scale));
      matrix.setPosition(x, y, z);

      mesh.setMatrixAt(i, matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }
}
```

**Performance**: Render 10,000+ grass blades at 60fps

---

## 3. OBJECT PLACEMENT

### Technique: Poisson Disk Sampling

**Goal**: Distribute objects naturally (not too close, not too uniform)

**Input**: Area, minimum distance, density
**Output**: Array of 2D positions

```typescript
class ObjectPlacer {
  placeObjects(
    width: number,
    height: number,
    minDistance: number,
    density: number,
    seed: number
  ): Vector2[] {
    const sampler = new PoissonDiskSampling({
      shape: [width, height],
      minDistance: minDistance,
      maxDistance: minDistance * 2,
      tries: 10
    });

    const points = sampler.fill();

    // Thin based on density
    const rng = seededRandom(seed);
    return points.filter(() => rng() < density);
  }

  placeVegetation(terrain: Terrain, config: VegetationConfig): Object3D[] {
    const positions = this.placeObjects(
      terrain.width,
      terrain.depth,
      config.minDistance,
      config.density,
      config.seed
    );

    return positions.map(pos => {
      const x = pos[0];
      const z = pos[1];
      const y = terrain.getHeight(x, z);

      // Check if valid placement (not in water, on steep slopes, etc.)
      if (!this.isValidPlacement(terrain, x, y, z)) {
        return null;
      }

      // Create object (tree, rock, etc.)
      const object = this.createVegetationObject(config, x, y, z);
      return object;
    }).filter(obj => obj !== null);
  }

  private isValidPlacement(terrain, x, y, z): boolean {
    // Check slope
    const normal = terrain.getNormal(x, z);
    const slope = Math.acos(normal.dot(new THREE.Vector3(0, 1, 0)));
    if (slope > Math.PI / 6) return false; // Too steep

    // Check if underwater
    if (y < terrain.waterLevel) return false;

    return true;
  }
}
```

**Result**: Natural-looking distribution of trees, rocks, flowers

---

## 4. ATMOSPHERIC EFFECTS

### Volumetric Fog

**Technique**: Custom shader with distance-based density

```glsl
// Fragment shader
uniform vec3 fogColor;
uniform float fogDensity;
uniform float fogHeightFalloff;

void main() {
  vec3 color = texture2D(tDiffuse, vUv).rgb;
  float depth = texture2D(tDepth, vUv).r;

  // Calculate world position from depth
  vec3 worldPos = calculateWorldPosition(vUv, depth);

  // Distance-based fog
  float distance = length(worldPos - cameraPosition);
  float fogAmount = 1.0 - exp(-distance * fogDensity);

  // Height-based fog (thicker near ground)
  float heightFactor = exp(-worldPos.y * fogHeightFalloff);
  fogAmount *= heightFactor;

  // Apply fog
  color = mix(color, fogColor, fogAmount);

  gl_FragColor = vec4(color, 1.0);
}
```

### God Rays / Light Shafts

**Technique**: Radial blur from light source

```glsl
uniform sampler2D tDiffuse;
uniform vec2 lightPosition; // Screen space
uniform float exposure;
uniform float decay;
uniform float density;
uniform int samples;

void main() {
  vec2 uv = vUv;
  vec2 delta = uv - lightPosition;
  delta *= 1.0 / float(samples) * density;

  vec3 color = texture2D(tDiffuse, uv).rgb;
  float illuminationDecay = 1.0;

  for (int i = 0; i < samples; i++) {
    uv -= delta;
    vec3 sample = texture2D(tDiffuse, uv).rgb;
    sample *= illuminationDecay * (1.0 / float(samples));
    color += sample;
    illuminationDecay *= decay;
  }

  gl_FragColor = vec4(color * exposure, 1.0);
}
```

### Particle Systems

**Dust Motes, Fireflies, Rain, Snow**

```typescript
class ParticleSystem {
  createDustMotes(config: ParticleConfig): THREE.Points {
    const count = config.count || 1000;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    const rng = seededRandom(config.seed);

    for (let i = 0; i < count; i++) {
      // Random position in volume
      positions[i * 3] = (rng() - 0.5) * 100;
      positions[i * 3 + 1] = rng() * 50;
      positions[i * 3 + 2] = (rng() - 0.5) * 100;

      // Slow upward drift
      velocities[i * 3] = (rng() - 0.5) * 0.1;
      velocities[i * 3 + 1] = rng() * 0.05;
      velocities[i * 3 + 2] = (rng() - 0.5) * 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
      size: config.size || 0.1,
      color: config.color || 0xffffff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    return new THREE.Points(geometry, material);
  }

  update(particles: THREE.Points, deltaTime: number) {
    const positions = particles.geometry.attributes.position.array;
    const velocities = particles.geometry.attributes.velocity.array;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i] * deltaTime;
      positions[i + 1] += velocities[i + 1] * deltaTime;
      positions[i + 2] += velocities[i + 2] * deltaTime;

      // Wrap around
      if (positions[i + 1] > 50) positions[i + 1] = 0;
    }

    particles.geometry.attributes.position.needsUpdate = true;
  }
}
```

---

## 5. PROCEDURAL AUDIO

### Ambient Soundscapes

```typescript
class AmbienceSoundscape {
  create(config: AudioConfig): Tone.Player[] {
    const layers = [];

    // Base drone
    if (config.style === 'ambient' || config.style === 'drone') {
      const drone = this.createDronePad(config.key, config.mood);
      layers.push(drone);
    }

    // Evolving texture
    if (config.evolution !== 'static') {
      const texture = this.createEvolvingTexture(config);
      layers.push(texture);
    }

    // Melodic elements
    if (config.style === 'melodic') {
      const melody = this.createGenerativeMelody(config);
      layers.push(melody);
    }

    return layers;
  }

  private createDronePad(key: string, mood: string): Tone.Synth {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 4,
        decay: 0,
        sustain: 1,
        release: 8
      }
    }).toDestination();

    // Play chord based on mood
    const chords = this.getChordsForMood(key, mood);
    const pattern = new Tone.Pattern((time, chord) => {
      synth.triggerAttackRelease(chord, '8m', time);
    }, chords, 'random');

    pattern.start(0);
    return synth;
  }

  private createEvolvingTexture(config: AudioConfig): Tone.Noise {
    const noise = new Tone.Noise('pink').start();
    const filter = new Tone.Filter(400, 'lowpass').toDestination();
    noise.connect(filter);

    // Slowly modulate filter
    const lfo = new Tone.LFO(0.05, 200, 800);
    lfo.connect(filter.frequency);
    lfo.start();

    return noise;
  }
}
```

### Spatial 3D Audio

```typescript
class SpatialAudio {
  create3DSound(type: string, position: Vector3): THREE.PositionalAudio {
    const sound = new THREE.PositionalAudio(this.listener);

    // Generate sound procedurally
    const buffer = this.generateSoundBuffer(type);
    sound.setBuffer(buffer);
    sound.setRefDistance(10);
    sound.setLoop(true);
    sound.play();

    // Position in 3D space
    const mesh = new THREE.Mesh();
    mesh.position.copy(position);
    mesh.add(sound);
    this.scene.add(mesh);

    return sound;
  }

  private generateSoundBuffer(type: string): AudioBuffer {
    // Procedurally generate sound using Web Audio API
    const duration = 2.0;
    const sampleRate = 44100;
    const buffer = this.audioContext.createBuffer(
      1,
      sampleRate * duration,
      sampleRate
    );

    const data = buffer.getChannelData(0);

    switch (type) {
      case 'stream':
        this.generateStreamSound(data, sampleRate);
        break;
      case 'wind':
        this.generateWindSound(data, sampleRate);
        break;
      case 'birds':
        this.generateBirdSound(data, sampleRate);
        break;
    }

    return buffer;
  }
}
```

---

## Performance Budgets

| System | CPU Budget | Memory Budget |
|--------|-----------|---------------|
| Terrain Generation | 100ms initial | 20MB |
| Vegetation (L-systems) | 50ms per tree | 5MB total |
| Object Placement | 30ms | 10MB |
| Particle Systems | 2ms per frame | 5MB |
| Audio Generation | 200ms initial | 10MB |

**Total**: <400ms initial load, <50MB runtime

---

## Quality Presets

### Low (Mobile)
- Terrain: 32x32 chunks, LOD aggressive
- Vegetation: 50% density, simplified geometry
- Particles: 500 max
- Post-processing: Minimal (bloom only)

### Medium (Default)
- Terrain: 64x64 chunks, LOD moderate
- Vegetation: 80% density, normal geometry
- Particles: 2000 max
- Post-processing: Full suite

### High (Desktop)
- Terrain: 128x128 chunks, LOD subtle
- Vegetation: 100% density, high-poly geometry
- Particles: 5000 max
- Post-processing: Full + shadows + AO

---

## Seed-Based Reproducibility

All procedural systems use **seeded random number generators**, allowing:
- Exact reproduction of any dream
- Sharing seeds between users
- Debugging and iteration

```typescript
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 0x100000000;
    return state / 0x100000000;
  };
}
```
