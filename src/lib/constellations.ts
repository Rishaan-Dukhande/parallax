/**
 * Constellation layouts for the Parallax galaxy view.
 *
 * Keyed by numeric unit ID to match UNITS in galaxy/page.tsx.
 * lessonId values are the numeric lesson IDs used in subUnits[].id.
 *
 * Coordinates are 0–100, centered on (50,50) to match the SVG viewBox.
 * All coordinates are pre-scaled to 0.75× so that no node's outer edge
 * (center + 4.5 node radius) exceeds the BOSS_RING_RADIUS of 38.
 *
 * Units without an entry fall back to the getStarPositions() hub-and-spoke
 * auto-layout (currently: unit 7 E&M Fields, unit 8 Rotation).
 */

export interface ConstellationStar {
  lessonId: number
  x: number // 0–100
  y: number // 0–100
}

export interface ConstellationEdge {
  from: number // lessonId
  to: number   // lessonId
}

export interface ConstellationDef {
  unitId: number
  shapeName: string
  meaning: string
  stars: ConstellationStar[]
  edges: ConstellationEdge[]
}

export const UNIT_CONSTELLATIONS: Record<number, ConstellationDef> = {

  // ── Unit 1: Kinematics ── Arrow ───────────────────────────────────────────
  // Shaft: Motion → Velocity → Acceleration.
  // Arrowhead: Acceleration forks to Kinematic Equations (lower flare) and
  //            Projectile Motion (tip). Motion has direction.
  1: {
    unitId: 1,
    shapeName: 'Arrow',
    meaning: 'Motion has direction',
    stars: [
      { lessonId: 101, x: 28, y: 65 }, // What is Motion? — tail
      { lessonId: 102, x: 46, y: 54 }, // Velocity vs Speed — shaft
      { lessonId: 103, x: 65, y: 43 }, // Acceleration — pivot
      { lessonId: 104, x: 76, y: 54 }, // Kinematic Equations — lower flare
      { lessonId: 105, x: 76, y: 31 }, // Projectile Motion — tip
    ],
    edges: [
      { from: 101, to: 102 },
      { from: 102, to: 103 },
      { from: 103, to: 104 }, // lower flare
      { from: 103, to: 105 }, // tip
    ],
  },

  // ── Unit 2: Newton's Laws ── Triangle ────────────────────────────────────
  // The three laws form the triangle vertices.
  // Friction/Normal Forces (206) sits at center — the most common
  // real-world surface connecting all three laws.
  2: {
    unitId: 2,
    shapeName: 'Triangle',
    meaning: 'Forces in balance',
    stars: [
      { lessonId: 203, x: 50, y: 26 }, // Newton's 1st Law — apex
      { lessonId: 204, x: 29, y: 67 }, // Newton's 2nd Law — bottom-left
      { lessonId: 205, x: 71, y: 67 }, // Newton's 3rd Law — bottom-right
      { lessonId: 206, x: 50, y: 50 }, // Friction & Normal Forces — center bridge
    ],
    edges: [
      { from: 203, to: 204 }, // apex → bottom-left
      { from: 204, to: 205 }, // base
      { from: 205, to: 203 }, // bottom-right → apex
      { from: 206, to: 203 }, // friction ties into 1st law (inertia vs friction)
      { from: 206, to: 204 }, // friction ties into 2nd law (F=ma with friction)
    ],
  },

  // ── Unit 3: Work & Energy ── Arc ──────────────────────────────────────────
  // Five lessons trace a pendulum swing: left-high (Work) → low (KE/PE) →
  // right-high (Work-Energy Theorem). Energy arcs through a transfer.
  3: {
    unitId: 3,
    shapeName: 'Arc',
    meaning: 'Energy swinging through a transfer',
    stars: [
      { lessonId: 301, x: 24, y: 35 }, // What is Work? — left peak
      { lessonId: 302, x: 39, y: 58 }, // Kinetic Energy — descending
      { lessonId: 303, x: 50, y: 65 }, // Potential Energy — nadir
      { lessonId: 304, x: 61, y: 58 }, // Conservation of Energy — ascending
      { lessonId: 305, x: 76, y: 35 }, // Work-Energy Theorem — right peak
    ],
    edges: [
      { from: 301, to: 302 },
      { from: 302, to: 303 },
      { from: 303, to: 304 },
      { from: 304, to: 305 },
    ],
  },

  // ── Unit 4: Momentum ── Collision ─────────────────────────────────────────
  // Two objects converge from opposite top corners and meet at the impact
  // point (Conservation Law). Center of Mass branches below as post-impact
  // analysis.
  4: {
    unitId: 4,
    shapeName: 'Collision',
    meaning: 'Two paths meeting at impact',
    stars: [
      { lessonId: 401, x: 24, y: 31 }, // What is Momentum? — left incoming
      { lessonId: 402, x: 39, y: 46 }, // Impulse — converging
      { lessonId: 403, x: 54, y: 54 }, // Collisions / Conservation Law — impact
      { lessonId: 404, x: 76, y: 31 }, // Elastic Collisions — right incoming
      { lessonId: 405, x: 63, y: 69 }, // Center of Mass — post-impact analysis
    ],
    edges: [
      { from: 401, to: 402 },
      { from: 402, to: 403 },
      { from: 404, to: 403 }, // right object converges to impact
      { from: 403, to: 405 }, // after impact: analyze center of mass
    ],
  },

  // ── Unit 5: Universal Gravity ── Spiral ───────────────────────────────────
  // Four points wind inward from the outer rim: Newton's Law of Gravity
  // starts at the top, winding through Fields → Orbital Motion →
  // Escape Velocity at the convergence center.
  5: {
    unitId: 5,
    shapeName: 'Spiral',
    meaning: 'Orbital motion winding inward',
    stars: [
      { lessonId: 501, x: 50, y: 24 }, // Newton's Law of Gravity — outer rim, top
      { lessonId: 502, x: 74, y: 43 }, // Gravitational Fields — outer rim, right
      { lessonId: 503, x: 58, y: 64 }, // Orbital Motion — mid-spiral
      { lessonId: 504, x: 39, y: 54 }, // Escape Velocity — center convergence
    ],
    edges: [
      { from: 501, to: 502 },
      { from: 502, to: 503 },
      { from: 503, to: 504 },
    ],
  },

  // ── Unit 6: Oscillations ── Sine Wave ─────────────────────────────────────
  // Five lessons trace one full sine wave left to right:
  // zero → peak → trough → peak → zero.
  // The shape IS the waveform.
  6: {
    unitId: 6,
    shapeName: 'Sine Wave',
    meaning: 'Shape matches the waveform directly',
    stars: [
      { lessonId: 601, x: 20, y: 50 }, // Simple Harmonic Motion — left zero crossing
      { lessonId: 602, x: 35, y: 29 }, // Spring Forces — first peak
      { lessonId: 603, x: 50, y: 71 }, // Pendulums — trough
      { lessonId: 604, x: 65, y: 29 }, // Resonance — second peak
      { lessonId: 605, x: 80, y: 50 }, // Damped Oscillations — right zero crossing
    ],
    edges: [
      { from: 601, to: 602 },
      { from: 602, to: 603 },
      { from: 603, to: 604 },
      { from: 604, to: 605 },
    ],
  },

  // Units 7 (E&M Fields) and 8 (Rotation) have no entry:
  // they fall back to getStarPositions() hub-and-spoke auto-layout.
}
