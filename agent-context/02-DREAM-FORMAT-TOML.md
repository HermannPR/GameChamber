# 📋 Dream Definition Format (TOML)

## Overview

Dreams are defined using **TOML** (Tom's Obvious Minimal Language), a human-readable configuration format that's perfect for AI generation and human editing.

## Why TOML?

1. **AI-Friendly**: Less syntax to get wrong
2. **Human-Readable**: Easy to review and edit
3. **Comments**: AI can explain design decisions
4. **Strongly Typed**: Reduces errors
5. **Compact**: 18% smaller than JSON

## Core Schema Structure

### Minimal Valid Dream

```toml
[meta]
type = "dream"
title = "Simple Forest"
duration = 300

[world]
type = "landscape"
scale = "intimate"

[world.terrain]
type = "forest"

[atmosphere]
time = "day"
lighting = "natural"

[camera]
start_position = [0, 1.7, 0]
movement = "first_person"
```

### Complete Schema Reference

## `[meta]` - Metadata

```toml
[meta]
type = "dream"  # Required: "dream" | "nightmare" | "memory" | "abstract" | "meditation"
title = "Forest of Solitude"  # Required: Display name
duration = 300  # Optional: Recommended duration in seconds (0 = infinite)
description = "A peaceful forest for meditation"  # Optional
prompt = "Create a calming forest"  # Optional: Original AI prompt
```

## `[emotion]` - Emotional Journey

```toml
[emotion]
start = "anxious"  # Optional: User's starting emotional state
end = "peaceful"   # Optional: Desired ending state
intensity = 0.7    # Optional: 0-1, emotional intensity
transition = "gradual"  # Optional: "gradual" | "sudden" | "wave" | "none"
```

**Common Emotions:**
- Positive: peaceful, joyful, calm, excited, curious, hopeful
- Negative: anxious, sad, angry, overwhelmed, lonely, fearful
- Neutral: contemplative, nostalgic, dreamy, focused

## `[world]` - World Configuration

```toml
[world]
type = "landscape"  # Required: "landscape" | "interior" | "abstract" | "void" | "infinite"
width = 1000  # Optional: World width in meters
height = 600  # Optional: World height in meters
depth = 1000  # Optional: World depth in meters
scale = "intimate"  # Optional: "tiny" | "intimate" | "vast" | "infinite"
gravity = "earth"  # Optional: "earth" | "low" | "none" | "reverse" | "variable"
boundaries = "soft"  # Optional: "hard" | "soft" | "infinite" | "looping"
backgroundColor = "#0a0a1a"  # Optional: Skybox/background color
```

## `[world.terrain]` - Procedural Terrain

```toml
[world.terrain]
type = "forest"  # Required: See terrain types below
seed = 42  # Optional: Random seed for reproducibility
style = "realistic"  # Optional: "realistic" | "stylized" | "abstract" | "surreal" | "glitch"

# Noise parameters (for procedural generation)
height_variation = 20.0  # Optional: Terrain height range
frequency = 0.05  # Optional: Noise frequency (lower = smoother)
octaves = 4  # Optional: Noise detail levels
amplitude = 100  # Optional: Noise amplitude

# Terrain features (optional)
[[world.terrain.features]]
type = "clearing"
size = 50
position = "center"

[[world.terrain.features]]
type = "stream"
length = 200
sound = true
```

**Terrain Types:**
- Natural: `forest`, `desert`, `ocean`, `mountains`, `plains`, `tundra`, `jungle`
- Cave: `cave`, `cavern`, `underground`
- Abstract: `void`, `geometric`, `fractal`, `noise`
- Interior: `room`, `hallway`, `cathedral`, `library`

## `[atmosphere]` - Lighting & Effects

```toml
[atmosphere]
time = "golden_hour"  # Optional: "dawn" | "day" | "dusk" | "night" | "timeless"
lighting = "warm"  # Optional: "warm" | "cool" | "dramatic" | "flat" | "volumetric"
sun_intensity = 0.6  # Optional: 0-1
ambient_intensity = 0.4  # Optional: 0-1

# Fog configuration
[atmosphere.fog]
enabled = true
density = 0.3  # 0-1
color = "#d4a574"
distance = 100  # Fog starts at this distance

# God rays / light shafts
[atmosphere.god_rays]
enabled = true
intensity = 0.5
shafts = 20

# Particles
[[atmosphere.particles]]
type = "dust_motes"
density = 0.5
float = "gentle"

[[atmosphere.particles]]
type = "fireflies"
count = 50
pattern = "random"
glow = true

# Weather
[atmosphere.weather]
type = "clear"  # "clear" | "rain" | "snow" | "storm" | "fog"
intensity = 0.0  # 0-1

# Sky configuration
[atmosphere.sky]
type = "gradient"  # "gradient" | "procedural" | "color" | "starfield"
colors = ["#87CEEB", "#FFB6C1"]  # For gradient type
clouds = "soft"  # "none" | "soft" | "dramatic" | "stormy"
```

## `[camera]` - Camera & Movement

```toml
[camera]
start_position = [0, 1.7, 0]  # [x, y, z] - Default: eye level
start_rotation = [0, 0, 0]  # [x, y, z] - Default: looking forward
movement = "first_person"  # Required: "first_person" | "float" | "orbit" | "cinematic" | "guided"
speed = 2.0  # Optional: Movement speed in meters/second
can_fly = false  # Optional: Allow vertical movement
can_look_around = true  # Optional: Mouse look enabled

# Camera effects
[[camera.effects]]
type = "breathing"
intensity = 0.3  # Subtle sway like breathing

[[camera.effects]]
type = "depth_of_field"
focus_distance = 10
blur = 0.5
```

## `[audio]` - Sound & Music

```toml
[audio]
spatial_audio = true  # Optional: 3D positioned sounds
reverb_type = "forest"  # Optional: "forest" | "cave" | "hall" | "room" | "none"
reverb_intensity = 0.6  # Optional: 0-1

# Ambient sounds
[[audio.ambient]]
type = "wind"
volume = 0.3
variation = "gentle"

[[audio.ambient]]
type = "birds"
volume = 0.4
distance = "far"  # "near" | "far" | "ambient"

[[audio.ambient]]
type = "stream"
volume = 0.5
position = [20, 0, 30]  # 3D position
spatial = true

# Procedural music
[audio.music]
enabled = true
style = "ambient"  # "ambient" | "drone" | "melodic" | "rhythmic" | "none"
tempo = 60  # BPM
key = "C_major"
instruments = ["pad", "strings", "chimes"]
intensity = 0.3  # 0-1
evolution = "slow"  # How music changes: "static" | "slow" | "medium" | "fast"
```

## `[elements]` - World Objects

### Vegetation

```toml
[[elements.vegetation]]
type = "tree"
species = "oak"  # Affects shape, size, color
density = 0.3  # 0-1, coverage density
distribution = "clustered"  # "random" | "clustered" | "poisson" | "grid"
variation = 0.4  # 0-1, how much trees vary
sway = { enabled = true, wind_responsive = true }

[[elements.vegetation]]
type = "grass"
density = 0.8
height = [0.2, 0.5]  # Min/max height range
color_variation = 0.3
wind_effect = "wave"
```

### Water

```toml
[[elements.water]]
type = "stream"
path = "procedural"  # "procedural" | "manual" | "straight"
width = 2.0
depth = 0.3
clarity = 0.7  # 0 = murky, 1 = crystal clear
flow_speed = 0.5
sound = true
reflections = true
```

### Interactive Elements

```toml
[[elements.interactive]]
type = "safe_spot"
position = [0, 0, 0]
radius = 10
effect = "extra_calm"  # Effect when user enters
visual = "subtle_glow"
```

### Wildlife

```toml
[[elements.wildlife]]
type = "deer"
count = 2
behavior = "grazing"  # "grazing" | "flying" | "swimming" | "idle"
flee_distance = 5  # How close user can get
animation = "procedural"
```

### Structures

```toml
[[elements.structures]]
type = "old_bench"
position = [5, 0, 10]
material = "weathered_wood"
story = "Someone used to come here often"  # Narrative weight
interactive = true  # Can sit on it
```

## `[interaction]` - User Interaction

```toml
[interaction]
input_method = "first_person_controls"  # WASD + mouse look
can_run = false  # Allow sprint
can_interact = ["sit", "touch", "listen"]  # Context-sensitive actions

# Special moments
[[interaction.moments]]
trigger = "approach_stream"  # When user does this
effect = "camera_slows"  # This happens
audio = "water_becomes_prominent"
feeling = "draw_attention"

[[interaction.moments]]
trigger = "sit_on_bench"
effect = "time_slows"
audio = "heartbeat_calms"
camera = "gentle_pan_around"
duration = 30  # Seconds
```

## `[effects]` - Post-Processing

```toml
[effects]

# Color grading for mood
[effects.color_grading]
saturation = 1.1  # >1 = more saturated
temperature = "warm"  # "warm" | "cool" | "neutral"
vibrance = 1.2
tint = "#FFE4B5"  # Slight golden tint

# Visual effects
[effects.vignette]
intensity = 0.2
color = "#000000"

[effects.bloom]
enabled = true
threshold = 0.8
intensity = 0.5

[effects.chromatic_aberration]
enabled = false  # Good for nightmares/glitch

[effects.film_grain]
enabled = true
intensity = 0.1  # Adds dreamlike texture

[effects.motion_blur]
enabled = false

# Dream-specific effects
[[effects.dream_effects]]
type = "subtle_distortion"
intensity = 0.1

[[effects.dream_effects]]
type = "edge_glow"
color = "#ffffff"
intensity = 0.2

[[effects.dream_effects]]
type = "time_dilation"
factor = 0.9  # Everything slightly slower
```

## `[progression]` - How Experience Evolves

```toml
[progression]
type = "calm_to_calmer"  # "static" | "journey" | "revelation" | "cycle"

# Timed events
[[progression.events]]
time = 60  # Seconds after start
event = "sun_gets_warmer"
effect = { lighting = "brighter", audio = "birds_increase" }

[[progression.events]]
time = 180
event = "discover_hidden_grove"
effect = { reveal = "secret_area", reward = "moment_of_beauty" }
```

## `[metadata]` - Cataloging & Discovery

```toml
[metadata]
tags = ["peaceful", "nature", "meditation", "forest", "healing"]
mood = ["calm", "contemplative", "restorative"]
best_for = ["stress_relief", "meditation", "falling_asleep"]
intensity = "low"  # "low" | "medium" | "high" - How overwhelming
duration_recommendation = "5-15 minutes"

[metadata.accessibility]
motion_sickness_risk = "low"  # "low" | "medium" | "high"
photosensitivity_warning = false
requires_audio = false  # Can be enjoyed silently
```

## Example: Complete Dream

```toml
[meta]
type = "meditation"
title = "Forest Clearing at Dusk"
duration = 480
description = "A peaceful forest clearing as day turns to night"

[emotion]
start = "stressed"
end = "peaceful"
transition = "gradual"

[world]
type = "landscape"
scale = "intimate"
boundaries = "soft"

[world.terrain]
type = "forest"
seed = 42
style = "realistic"
height_variation = 15.0

[[world.terrain.features]]
type = "clearing"
size = 30
position = "center"

[[world.terrain.features]]
type = "stream"
length = 50
sound = true

[atmosphere]
time = "dusk"
lighting = "warm"

[atmosphere.fog]
enabled = true
density = 0.2
color = "#d4a574"

[[atmosphere.particles]]
type = "fireflies"
count = 30
glow = true

[camera]
start_position = [0, 1.7, 0]
movement = "first_person"
speed = 1.5
can_fly = false

[audio]
spatial_audio = true
reverb_type = "forest"

[[audio.ambient]]
type = "wind"
volume = 0.3

[[audio.ambient]]
type = "stream"
volume = 0.4
position = [10, 0, 15]
spatial = true

[audio.music]
enabled = true
style = "ambient"
tempo = 50
intensity = 0.2

[[elements.vegetation]]
type = "tree"
species = "oak"
density = 0.4
distribution = "clustered"

[[elements.vegetation]]
type = "grass"
density = 0.9
height = [0.3, 0.6]

[[elements.structures]]
type = "old_bench"
position = [0, 0, 5]
interactive = true

[effects.color_grading]
temperature = "warm"
saturation = 1.1

[metadata]
tags = ["peaceful", "nature", "dusk", "meditation"]
mood = ["calm", "contemplative"]
best_for = ["stress_relief", "evening_wind_down"]
intensity = "low"
```

## Validation Rules

1. **Required Fields**:
   - `[meta].type`
   - `[meta].title`
   - `[world].type`
   - `[world.terrain].type`
   - `[camera].movement`

2. **Value Ranges**:
   - All `intensity`, `density`, `volume` values: 0.0 - 1.0
   - Positions: `[x, y, z]` as floats
   - Colors: Hex format `#RRGGBB`

3. **Dependencies**:
   - If `audio.ambient[].spatial = true`, must include `position`
   - If `world.terrain.features`, must include valid `type`
   - If `progression.events`, must include `time` and `effect`

## Common Patterns

### Pattern 1: Minimal Meditation
```toml
[meta]
type = "meditation"
title = "Simple Calm"
[world]
type = "abstract"
[world.terrain]
type = "void"
[atmosphere]
lighting = "soft"
[camera]
movement = "float"
```

### Pattern 2: Nature Walk
```toml
[meta]
type = "dream"
title = "Forest Walk"
[world.terrain]
type = "forest"
[atmosphere]
time = "day"
[camera]
movement = "first_person"
speed = 2.0
```

### Pattern 3: Therapeutic Journey
```toml
[meta]
type = "therapeutic"
[emotion]
start = "anxious"
end = "calm"
transition = "gradual"
[progression]
type = "journey"
```
