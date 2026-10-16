# AMI'S MISSION — Desi Mother vs Naughty Family 🩴

A Mario-STYLE (100% original — no Nintendo IP) 2D comedy platformer starring **Ami**,
a desi mother in shalwar kameez whose weapon of choice is the mighty **chapal** (slipper).
Bonk naughty kids, wake the snoring husband off his sofa, dodge Dadi's complaints —
every 10 seconds, something to grin at.

Built with Babylon.js + Vite + TypeScript. Procedural WebAudio chiptune (original melodies).

## Status (2026-10-14)

- [x] Scaffold (Vite + TS + @babylonjs/core), dev server on :5173
- [x] Ami locked design: 5 poses sliced + matted from `AMI-OFFICIAL-LOCKED.png` (user-approved)
- [x] 9 missions with maps, objectives, timers
- [x] Chapal boomerang, stomp, masala-dabba question blocks, pickups, goals
- [x] Comedy systems: slow-mo, hit-stop freeze-frames, particles, Roman Urdu popups, Zzz/sweat/heart VFX
- [x] Original chiptune music (happy/urgent) + ~15 Mario-esque original SFX via WebAudio
- [x] HUD (score / mission / 😌 sakoon / ⚡ stamina / ❤️ lives / chapal / time), keyboard + touch controls
- [x] Menu → mission intro → win/fail cards verified via screenshots
- [x] Proof video: `proof-gameplay.mp4` (16.5s)
- [x] **SAKOON power system (2026-10-14):** chapal hits → +Sakoon (combos: DOUBLE/TRIPLE SAKOON!) → meter FULL = **SUPER AMI** (Mario-mushroom style: grows 1.35x with easeOutBack animation, golden aura, bigger/faster chapal, faster run, higher jump, 10s) → hit as super = shrink back (not out) → hit as normal = **AMI OUT** → 3 lives → Game Over ("Ami ko araam chahiye! 😴")
- [x] **Stamina:** running drains, resting restores; tired ≤30 (steam, slower, "Haanf... haanf!"); exhausted = OUT; toy/mud/car hits drain stamina + sakoon ("Sakoon gaya!")
- [x] **PERF + CONTROLS FIX (2026-10-14, Sehrish playtest feedback):**
  - Particles & popups now **pooled** (200-mesh ring buffer, 24-DOM popup pool) — zero create/dispose churn in the hot loop; Super Ami activation no longer spikes
  - HUD writes **cached** — DOM touched only on value change (was: every frame)
  - Chapal trail rate 50%→20%, Super bursts 16+10→10+6, grow sparkles 20→12/s
  - **Controls:** jump/chapal presses register in the event handler (quick taps shorter than a frame no longer missed); coyote time 0.12s + jump buffer 0.15s; ground accel 30→60, air 18→30
  - **Unstick:** penetration resolve pass after collision + auto-hop if input held with no movement for 0.5s
  - **Touch:** pointer capture (sliding thumb no longer drops the button), buttons 68→84px, blur resets all input
  - **"Ami Out" card auto-respawns** after 4s countdown (never looks stuck); overlay innerHTML cleared on hide
- [x] **V5 PERF FIX (2026-10-14, Sehrish: "sare level lag, bhaga nahi ja raha, hit pe stuck"):**
  - **Layout thrashing KILLED:** `project()` was calling `getBoundingClientRect()` per popup per frame (10-24 forced layouts/frame!) — now cached on resize only
  - **Material leak FIXED:** `spriteMesh()` created a new StandardMaterial (random name!) per chapal/mud throw, never disposed — now uses shared cached materials
  - **Stamina NERFED (was too punishing):** drain 3.5/s → 1.2/s; recovers while moving (4/s) not just idle (12/s); tired threshold 30→20; tired speed 0.6x→0.75x — Ami can actually RUN now
  - **Attack freeze FIXED:** returning chapal was re-hitting bonked enemies → hitStop spam (400ms+ freeze!) — now skips stunned enemies; only OUTGOING chapal triggers hitStop/slowMo
  - **hitStop/slowMo reduced:** kid 0.14s→0.08s, dadi 0.1s→0.06s, husband slowMo (0.25x, 1.0s)→(0.5x, 0.5s) — Ami never locked long
  - **Enemy culling:** off-screen enemies (>18 units from camera) skip AI updates
  - **Camera:** `new Vector3` per frame → scratch vector reuse
  - **Popup:** removed per-popup `requestAnimationFrame` (CSS transition handles it)
  - Husband sofa bump pushes Ami AWAY (was: into the collider → jitter)
  - Verified: headless playtest — tap-jump OK, tap-chapal OK, all 9 missions traversed with 0 stuck windows, smart bot scored 2950 with chapal hits

## Missions

| # | Mission | Type | Goal |
|---|---------|------|------|
| 1 | Rasoi | collect | 6 grocery items, reach stove |
| 2 | Bazaar | collect | 8 saman items, reach home gate |
| 3 | Doodh Wala | timed 75s | reach the milk stall |
| 4 | Potty Emergency 🚽 | timed 60s | reach bathroom (toys = slip!) |
| 5 | Homework 📚 | catch | bonk 5 kids → "Copy nikalo!" |
| 6 | School Run 🏫 | timed 80s | reach school gate, dodge traffic |
| 7 | Subah Uthana ⏰ | wake | wake 4 sleepers with chapal |
| 8 | Papa Ka Tiffin 🍱 | collect+timed 90s | 5 tiffin boxes |
| 9 | Kapray Dhona 👕 | collect+timed 75s | 6 flying kapray, dodge mud |

## Controls

- **Move:** ← → / A D · **Jump:** Space / W / ↑ (variable height) · **Chapal:** X / J
- Touch buttons on mobile.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Asset manifest

| Name | Description | In-game size | Path | Cost |
|------|-------------|--------------|------|------|
| Ami frames | idle/run/jump/throw/victory + chapal — sliced from user-locked `AMI-OFFICIAL-LOCKED.png`, white bg flood-fill matted | 2.0 units tall | `src/assets/ami/` | user-supplied |
| Ami face | menu/intro portrait, face crop from locked sheet | 130px UI | `src/assets/ami-face.png` | user-supplied |
| Family/props | kids, husband, dadi, aunty, doodhwala, sleepers, pickups, goals, tiles — procedural canvas pixel art | 0.7–3.2 units | `src/sprites.ts` | free |
| Music/SFX | original chiptune + 15 SFX, pure WebAudio | — | `src/audio.ts` | free |

All art, music, characters, and names are original. No Nintendo assets, melodies, or sprites.

## Stuck-spot fix (2026-10-14, v3.1)

**User report:** Ami "can't go forward" in Kapray Dhona, with a staircase-like visual blocking her.

**Root causes found:**
1. **No staircase exists in the map** — Kapray Dhona is flat ground. The visual is a phone-GPU rendering artifact (road tiles smearing). Added NaN guards on player position + camera: any NaN snaps back instead of smearing geometry.
2. **Death loop feels like stuck** — walking into mudkids triggers: 2.4s outro (frozen) → 4s "Ami Out!" card → respawn at LEVEL START (progress lost). For a casual player this reads as "stuck".
3. **Road texture** was 16×16 — upscaled to 32×32 to reduce high-DPI aliasing on phones.

**Fixes:**
- **Safe-spot respawn:** game tracks last safe grounded position (no enemies within 2.5u); respawn there, not at level start.
- **Faster out card:** countdown 4s → ~2.4s.
- **Hard unstick:** 3s of held input with zero x-progress → teleport to safe spot + "Uff! Nikal aayi! 😅".
- **NaN guards:** px/py and camera position — any NaN resets to safe spot.
- Verified: all 9 missions traverse with 0 errors, 0 NaN, no false unstick triggers; safe-spot respawn confirmed in headless playtest.
