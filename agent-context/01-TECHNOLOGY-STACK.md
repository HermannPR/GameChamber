# 🛠️ Technology Stack - DreamExplorer

## Core Technologies

### 3D Rendering Engine
**Three.js v0.160+** (~150KB gzipped)
- Industry-standard WebGL library
- Mature, well-documented
- Large ecosystem
- Active development
- Includes: renderer, scene graph, cameras, materials, lights

**Why Three.js?**
- ✅ Best-in-class 3D for web
- ✅ No need for Babylon.js complexity
- ✅ Excellent performance
- ✅ Huge community
- ✅ TypeScript support

### Data Format
**TOML** (Tom's Obvious Minimal Language)
- Parser: `@iarna/toml` v2.2.5 (~15KB)

**Why TOML over JSON?**
- ✅ 18% smaller files
- ✅ Native comments (AI can explain decisions!)
- ✅ More human-readable
- ✅ Less syntax noise (no quotes on keys)
- ✅ Strongly typed
- ✅ Better for nested configs
- ✅ AI-friendly (trained on Cargo.toml, pyproject.toml)
- ✅ More forgiving syntax (fewer AI errors)

**Example Comparison:**
```toml
# TOML - Clean and readable
[world.terrain]
type = "forest"
frequency = 0.05
# Using Perlin noise for natural variation
```

```json
// JSON - More verbose
{
  "world": {
    "terrain": {
      "type": "forest",
      "frequency": 0.05
    }
  }
}
```

### Procedural Generation

**Terrain Generation**
- `simplex-noise` v4.0.1 (~5KB) - 3D noise fields
- Custom marching cubes implementation (~15KB) - Smooth terrain from noise

**Vegetation**
- Custom L-system engine (~10KB) - Recursive plant generation
- Three.js instanced rendering - Render 10,000+ objects efficiently

**Placement Algorithms**
- `poisson-disk-sampling` v2.0.0 (~3KB) - Natural object distribution

### Audio System

**Generative Audio**
- Tone.js v14.8+ (~50KB subset) - Procedural music and sound effects
  - Synths, effects, patterns
  - Timing and scheduling
  - Easy musical concepts

**Spatial Audio**
- Web Audio API (native) - 3D positioned sounds
- THREE.PositionalAudio - Spatial audio integrated with Three.js

### Storage & Persistence

**Dream Library**
- localForage v1.10+ (~30KB)
  - IndexedDB (primary)
  - localStorage (fallback)
  - Store dreams, settings, history

**Features**
- Save generated dreams
- Create custom dreams
- Dream collections
- Visit history
- Analytics
- Export/import

### Post-Processing Effects

**Built-in (Three.js)**
- EffectComposer - Post-processing pipeline
- UnrealBloomPass - Glow effects
- BokehPass - Depth of field
- FilmPass - Film grain
- VignetteShader - Edge darkening

**Custom Shaders (GLSL)**
- Volumetric fog
- God rays (light shafts)
- Dream distortion
- Edge glow
- Time dilation effects

### Development Stack

**Build System**
- Vite v5.0+ - Ultra-fast dev server, HMR, tree-shaking
- TypeScript v5.3+ - Type safety
- ESLint + Prettier - Code quality

**Why Vite?**
- ✅ Instant server start
- ✅ Lightning-fast HMR
- ✅ Optimized production builds
- ✅ Modern ES modules
- ✅ Built-in TypeScript support

## Bundle Size Analysis

```
Main Bundle: ~400KB gzipped
├── Three.js core: 150KB
├── DreamEngine: 80KB
├── TOML parser: 15KB
├── localForage: 30KB
├── Procedural systems: 50KB
└── UI components: 75KB

Procedural Chunk: ~100KB gzipped (lazy loaded)
├── simplex-noise: 5KB
├── Marching cubes: 15KB
├── L-systems: 10KB
├── Poisson sampling: 3KB
└── Procedural logic: 67KB

Audio Chunk: ~80KB gzipped (lazy loaded)
├── Tone.js subset: 50KB
├── Procedural audio: 20KB
└── Audio utilities: 10KB

TOTAL: ~580KB gzipped
```

**Target**: <600KB ✅ (acceptable for a rich 3D app)

## Performance Targets

| Metric | Desktop | Mobile |
|--------|---------|--------|
| Frame Rate | 60 fps | 30 fps |
| Memory | <200MB | <100MB |
| Generation Time | <5s | <8s |
| Load Time | <3s | <5s |

## Browser Support

**Minimum Requirements**
- WebGL 2.0 support
- ES6+ JavaScript
- IndexedDB support
- Web Audio API

**Supported Browsers**
- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+
- Mobile: iOS 15+, Android Chrome 90+

## Dependencies

### Production Dependencies
```json
{
  "three": "^0.160.0",
  "@iarna/toml": "^2.2.5",
  "localforage": "^1.10.0",
  "simplex-noise": "^4.0.1",
  "poisson-disk-sampling": "^2.0.0",
  "tone": "^14.8.49"
}
```

### Development Dependencies
```json
{
  "vite": "^5.0.0",
  "typescript": "^5.3.0",
  "@types/three": "^0.160.0",
  "eslint": "^8.56.0",
  "prettier": "^3.1.0",
  "@typescript-eslint/eslint-plugin": "^6.18.0",
  "@typescript-eslint/parser": "^6.18.0"
}
```

## Alternatives Considered

### Why Not Babylon.js?
- More complex API
- Larger bundle size
- Overkill for our needs
- Three.js more popular

### Why Not Unity WebGL?
- Massive bundle size (5-10MB+)
- Slow load times
- Overkill for procedural experiences
- Less control over generation

### Why Not YAML?
- Whitespace-sensitive (AI errors)
- Security concerns (code execution)
- Ambiguous parsing
- TOML is cleaner

### Why Not JSON5?
- Less adoption
- Still has JSON verbosity
- TOML more readable

## Technology Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Three.js API changes | Medium | Lock to specific version, test upgrades |
| Bundle size growth | High | Aggressive tree-shaking, code splitting |
| Performance on mobile | High | Quality presets, LOD systems, profiling |
| Browser compatibility | Medium | Polyfills, progressive enhancement |
| Procedural generation bugs | Medium | Extensive testing, seed-based reproducibility |

## Future Technology Considerations

**v2.0 Possibilities**
- WebGPU support (when widely available)
- VR mode (WebXR)
- Multiplayer dreams (WebRTC)
- Cloud dream storage (backend API)
- Advanced procedural (L-systems for everything)
- AI-generated textures (Stable Diffusion)
- Voice input for dream creation

**Not Planned**
- Native apps (web-first strategy)
- Blockchain/NFTs (not relevant)
- Social features (privacy-first)
