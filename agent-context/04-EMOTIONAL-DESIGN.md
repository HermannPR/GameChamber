# 💭 Emotional Design Principles

## Overview

DreamExplorer is fundamentally about **emotion**, not entertainment. Every design decision should serve the emotional journey of the user.

## Core Principle

> "We are not making games to win. We are making spaces to feel."

---

## Emotional Mapping System

### From Emotion → Environment

The AI must translate emotional states into environmental parameters. This is the **core magic** of DreamExplorer.

```
User Emotion → Environmental Translation → TOML Parameters
```

### Emotional Dimensions

**1. Valence** (Positive ↔ Negative)
- Positive: Warm colors, bright lighting, gentle sounds
- Negative: Cool/desaturated colors, dim lighting, sparse sounds

**2. Arousal** (High ↔ Low)
- High: Fast movement, dramatic effects, intense colors
- Low: Slow movement, soft effects, muted tones

**3. Dominance** (Control ↔ Submission)
- High: Open spaces, clear paths, user control
- Low: Enclosed spaces, guided paths, predetermined flow

**4. Complexity** (Simple ↔ Complex)
- Simple: Clear, minimal, zen-like
- Complex: Detailed, rich, immersive

---

## Emotion-Environment Mappings

### ANXIETY → CALM

**Start State (Anxious)**:
```toml
[world]
scale = "confined"  # Feels closed-in
[atmosphere]
lighting = "harsh"
colors = "high_contrast"
fog = { density = 0.5 }  # Can't see far
[audio]
sounds = ["heartbeat", "muffled_sounds"]
tempo = 90  # Elevated heart rate
[camera]
effects = [{ type = "subtle_shake", intensity = 0.3 }]
```

**Transition**:
- Gradually expand space
- Soften lighting
- Reduce fog
- Slow heartbeat/tempo
- Stabilize camera

**End State (Calm)**:
```toml
[world]
scale = "open"  # Room to breathe
[atmosphere]
lighting = "soft_golden"
colors = "warm"
fog = { density = 0.1 }  # Clear visibility
[audio]
sounds = ["gentle_wind", "distant_water"]
tempo = 60  # Resting heart rate
[camera]
effects = [{ type = "breathing", intensity = 0.1 }]  # Gentle
```

### OVERWHELMED → PEACEFUL

**Start State (Overwhelmed)**:
```toml
[world]
complexity = "high"
elements = "many"  # Too much to take in
[audio]
layers = 8  # Too many sounds
volume = "loud"
[effects]
saturation = 1.5  # Overly vivid
contrast = 1.4
```

**Transition**:
- Remove elements gradually
- Simplify soundscape
- Reduce visual intensity

**End State (Peaceful)**:
```toml
[world]
complexity = "minimal"
elements = "few"  # Just essentials
[audio]
layers = 2  # Simple, clear
volume = "gentle"
[effects]
saturation = 0.9  # Soft, muted
contrast = 0.8
```

### SAD → HOPEFUL

**Start State (Sad)**:
```toml
[atmosphere]
time = "overcast_day"
colors = ["#888888", "#aaaaaa"]  # Desaturated
lighting = "flat"
weather = "light_rain"
[world.terrain]
type = "empty_plains"  # Barren
[audio]
mood = "melancholic"
instruments = ["piano", "strings"]
tempo = 40  # Slow
```

**Transition**:
- Clouds gradually part
- Colors warm and saturate
- Rain stops, sun emerges
- Tempo increases slightly
- Terrain becomes more alive

**End State (Hopeful)**:
```toml
[atmosphere]
time = "sunrise"
colors = ["#FFD700", "#FFA500", "#87CEEB"]  # Warm, vibrant
lighting = "warm_golden"
weather = "clear"
sky = { type = "gradient", hopeful = true }
[world.terrain]
type = "flowering_meadow"  # Life emerging
[audio]
mood = "uplifting"
instruments = ["piano", "strings", "chimes"]
tempo = 60  # More energetic
```

### LONELY → CONNECTED

**Start State (Lonely)**:
```toml
[world]
scale = "vast_empty"  # Emphasizes aloneness
elements = "none"  # No life
[atmosphere]
fog = { density = 0.7 }  # Isolated in fog
[audio]
sounds = ["own_footsteps", "own_breathing"]  # Only self
reverb = "large_empty_hall"  # Echoing loneliness
```

**Transition**:
- Fog clears to reveal distant life
- Subtle signs of others (footpaths, left objects)
- Ambient life appears (birds, animals)
- Soundscape fills with gentle life

**End State (Connected)**:
```toml
[world]
scale = "intimate_populated"
[[elements.wildlife]]
type = "deer"
behavior = "calm_presence"  # Not alone
[[elements.structures]]
type = "campfire"  # Others have been here
[audio]
sounds = ["birds", "distant_laughter", "life"]
reverb = "warm_space"
```

### GRIEF → ACCEPTANCE

**This is a JOURNEY, not a sudden change**

```toml
[progression]
type = "therapeutic_journey"
duration = 600  # 10 minutes

# Act 1: Storm (2 minutes) - The pain
[[progression.acts]]
name = "storm"
duration = 120
[progression.acts.atmosphere]
weather = "heavy_storm"
lighting = "dark"
colors = "desaturated"
[progression.acts.audio]
sounds = ["thunder", "heavy_rain", "wind"]
music = { mood = "heavy", intensity = 0.9 }

# Act 2: Rain (3 minutes) - Processing
[[progression.acts]]
name = "walking_in_rain"
duration = 180
[progression.acts.atmosphere]
weather = "steady_rain"
lighting = "grey"
[progression.acts.world]
path = "clear"  # Must keep moving forward
[progression.acts.audio]
sounds = ["rain", "footsteps"]
music = { mood = "contemplative", intensity = 0.5 }

# Act 3: Clearing (3 minutes) - Hope
[[progression.acts]]
name = "storm_clearing"
duration = 180
[progression.acts.atmosphere]
weather = "light_rain_then_clearing"
lighting = "gradually_brightening"
sky = { transition = "clouds_parting" }
[progression.acts.audio]
rain = { volume = "fading" }
birds = { volume = "increasing" }
music = { mood = "hopeful", intensity = 0.6 }

# Act 4: Sunrise (2 minutes) - Acceptance
[[progression.acts]]
name = "new_day"
duration = 120
[progression.acts.atmosphere]
weather = "clear"
time = "sunrise"
lighting = "warm_golden"
[progression.acts.world]
vista = "expansive"  # Can see forward now
[progression.acts.audio]
sounds = ["birds", "gentle_wind", "nature_awakening"]
music = { mood = "peaceful_acceptance", intensity = 0.4 }
```

---

## Design Principles

### 1. **Subtlety Over Spectacle**

Wrong ❌:
```toml
[effects.bloom]
intensity = 2.0  # OVERWHELMING GLOW!
[audio]
volume = 1.0  # LOUD!
```

Right ✅:
```toml
[effects.bloom]
intensity = 0.3  # Gentle, dreamlike
[audio]
volume = 0.4  # Soft, present but not demanding
```

**Why**: Emotional experiences need space. Overwhelming the senses prevents feeling.

### 2. **Agency, Not Control**

Let users:
- ✅ Explore at their own pace
- ✅ Stop and sit when they want
- ✅ Look where they want
- ✅ Exit when ready

Don't:
- ❌ Force paths or sequences (unless therapeutic narrative)
- ❌ Time pressure
- ❌ Locked cameras
- ❌ Mandatory interactions

### 3. **Silence is Powerful**

Not every moment needs sound. Strategic silence:
- Emphasizes important moments
- Gives space for reflection
- Prevents fatigue

```toml
[[audio.ambient]]
type = "silence"
duration = 30  # 30 seconds of intentional quiet
after_trigger = "user_reaches_clearing"
```

### 4. **Natural Pacing**

**Slow is usually better**:
- Camera speed: 1-2 m/s (walking pace)
- Transitions: 5-10 seconds minimum
- Music tempo: 40-80 BPM for calm, 80-120 for energetic

**Fast movement = motion sickness + overwhelm**

### 5. **Grounding Elements**

Always include something to orient the user:
- Horizon line
- Ground plane (even in abstract spaces)
- Reference objects for scale
- Spatial audio cues

### 6. **Color Psychology**

| Color | Emotion | Use For |
|-------|---------|---------|
| Blue | Calm, trust, sadness | Meditation, processing grief |
| Green | Nature, growth, renewal | Healing, grounding |
| Warm (orange/yellow) | Happiness, energy, hope | Uplifting, morning |
| Purple | Mystery, spirituality, creativity | Abstract, contemplative |
| Red | Passion, anger, intensity | Use sparingly! |
| Grey | Neutral, depression | Starting point for sad→hopeful |
| White | Purity, emptiness, peace | Minimalist, zen |

### 7. **Lighting = Emotion**

**Soft, diffused light** = Safe, calm
**Harsh, directional light** = Dramatic, tense
**Warm light** = Comfortable, inviting
**Cool light** = Distant, melancholic
**Golden hour** = Nostalgic, hopeful
**Darkness** = Fear, uncertainty (use carefully!)

### 8. **Sound Design**

**Layers of ambience**:
1. **Base layer**: Constant, grounding (wind, white noise)
2. **Mid layer**: Intermittent, environmental (birds, water)
3. **Detail layer**: Occasional, interesting (chimes, distant sounds)
4. **Musical layer**: Mood-setting, evolving

**Never**:
- Loud sudden sounds (unless intentional nightmare)
- Harsh frequencies
- Repetitive loops that become annoying
- Competing sounds that muddy the mix

### 9. **Time Dilation**

Dreams feel timeless. Techniques:
- Slow subtle animations
- No visible clocks/timers
- Ambient music without obvious beats
- Camera effects that suggest altered perception

```glsl
// Subtle time dilation shader
uniform float timeDilation;  // 0.9 = slightly slower

void main() {
  // Everything moves 10% slower
  // Creates dreamlike quality
}
```

### 10. **Exit Strategy**

Never trap users. Always allow:
- Pause menu (ESC)
- Gentle fade-out option
- "Are you ready to leave?" prompt
- Save progress on exit

---

## Therapeutic Considerations

### Safety First

For therapeutic dreams:
- **Trigger warnings**: Motion, photosensitivity, emotional intensity
- **Gentle defaults**: Start calm, never jarring
- **User control**: Can always pause or exit
- **No jump scares**: Even in nightmare mode, no sudden shocks

### Evidence-Based Techniques

**Grounding (5-4-3-2-1)**:
```toml
[[interaction.grounding_exercise]]
prompt = "Name 5 things you can see"
visual_highlight = true  # Highlight interactive objects

prompt = "4 things you can hear"
audio_highlight = true  # Emphasize sounds

prompt = "3 things you can touch"
haptic_feedback = true  # If supported

prompt = "2 things you can smell"
descriptive_text = true  # Text prompts

prompt = "1 thing you can taste"
mindful_moment = true
```

**Progressive Muscle Relaxation**:
```toml
[progression.relaxation]
type = "body_scan"
duration = 600  # 10 minutes

[[progression.steps]]
body_part = "feet"
duration = 60
instruction = "Notice tension in your feet"
visual = "subtle_glow_on_ground"

[[progression.steps]]
body_part = "legs"
duration = 60
instruction = "Release tension in your legs"
visual = "glow_rising"
# ... continues up body
```

**Exposure Therapy (Nightmares)**:
```toml
[meta]
type = "nightmare"
intensity_control = true  # User can adjust

[progression]
type = "controlled_exposure"
user_paced = true  # User proceeds when ready
safe_exit_always = true

[[progression.levels]]
intensity = 0.3  # Start mild
duration = "user_controlled"
can_skip = true
```

### Accessibility

**Motion Sickness Prevention**:
- Fixed horizon line
- Smooth camera movement (no sudden jerks)
- Vignette effect during movement
- Optional teleport movement
- Sitting mode (no walking needed)

**Photosensitivity**:
- No flashing lights
- Adjustable brightness
- High contrast mode option

**Audio Accessibility**:
- Visual indicators for important sounds
- Subtitles for any spoken content
- Can be enjoyed silently

---

## Measuring Emotional Impact

### Qualitative Metrics

**Post-experience survey**:
1. "How did you feel before entering?" (emotion scale)
2. "How do you feel now?" (emotion scale)
3. "Did the experience meet your needs?" (yes/no/somewhat)
4. "Would you return to this space?" (yes/no/maybe)
5. "Any feedback?" (open text)

### Quantitative Metrics

Track (with user consent):
- Time spent in dream
- Pause frequency (many pauses = overwhelmed?)
- Movement patterns (exploring vs rushing)
- Return visits
- Time of day used (morning meditation vs night sleep aid)

---

## Anti-Patterns to Avoid

❌ **Forcing emotion**: Can't force someone to feel peaceful
✅ **Creating conditions**: Provide environment that invites peace

❌ **Toxic positivity**: "Just be happy!"
✅ **Validated processing**: Meet them where they are

❌ **Overstimulation**: MORE PARTICLES! MORE BLOOM! MORE SOUND!
✅ **Restraint**: Less is usually more

❌ **Gamification**: Points, achievements, comparisons
✅ **Personal journey**: No scores, no competition

❌ **One-size-fits-all**: Single "relaxation" preset
✅ **Personalization**: Tailored to individual emotional state

❌ **Mandatory path**: Follow this exact route
✅ **Open exploration**: Find your own way

❌ **Ignoring discomfort**: User shows signs of distress, continue anyway
✅ **Responsive**: Offer exit, adjust intensity, check in

---

## The Dream Language

We're creating a **visual-spatial-audio language of emotion**.

| Emotion | Visual | Spatial | Audio |
|---------|--------|---------|-------|
| Peace | Soft colors, gentle light | Open, safe spaces | Gentle ambience |
| Anxiety | Harsh contrast, fog | Confined, maze-like | Heartbeat, tension |
| Joy | Bright, saturated | Open, sunlit | Upbeat, light |
| Sadness | Desaturated, grey | Empty, vast | Sparse, melancholic |
| Hope | Warm tones, sunrise | Path forward, clearing | Rising, brightening |
| Contemplation | Muted, balanced | Intimate, enclosed | Minimal, spacious |
| Nostalgia | Warm, slightly faded | Familiar geometry | Distant, muffled |
| Awe | Vast scale, dramatic | Enormous, transcendent | Expansive, ethereal |

---

## Ethical Considerations

### Do No Harm

1. **Not a replacement for therapy**: Clearly state this is a tool, not treatment
2. **Trigger warnings**: Warn about potentially intense content
3. **Emergency resources**: Provide crisis hotline info if needed
4. **Data privacy**: Emotional data is sensitive; handle with care
5. **Age-appropriate**: Some content may not be suitable for children

### Informed Consent

Users should know:
- This is an experimental emotional experience
- It may evoke strong feelings
- They can exit at any time
- Their data (if collected) will be used respectfully

### Cultural Sensitivity

- Emotional expression varies by culture
- Symbolism may have different meanings
- Color associations differ globally
- Sound preferences vary
- Provide diverse examples and templates

---

## Success Indicators

A dream is successful if:

✅ User reports feeling the intended emotion
✅ User wants to return to the space
✅ User shares it with others
✅ User reports therapeutic benefit
✅ User feels safe and in control throughout
✅ User exits feeling better than when they entered

A dream has failed if:

❌ User reports motion sickness
❌ User feels overwhelmed or distressed (unintentionally)
❌ User exits without completing (unless by choice)
❌ User feels manipulated or forced
❌ Technical issues interrupt immersion

---

## The Ultimate Goal

> "When someone leaves a dream, they should feel:
> 'That was exactly what I needed.'"

Not impressed, not entertained - **helped**.
