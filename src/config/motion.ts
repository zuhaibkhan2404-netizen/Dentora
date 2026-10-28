/**
 * Animation configuration. Durations are seconds, angles are degrees.
 * Tweak here — the scene and UI read every value from this file.
 */
export const motion = {
  heroEntrance: {
    chairFade: 0.45,
    duration: 1.05,
    rise: 40, // px of upward travel in screen space
    scaleFrom: 0.86,
    scalePeak: 1.04,
    turnFrom: -18,
    settleTilt: 3,
  },
  pointer: {
    maxYaw: 5,
    maxPitch: 3,
    damping: 4.5, // higher = snappier
  },
  scroll: {
    heroToReassureTurn: 26,
    damping: 9,
  },
  selection: {
    lift: 0.16, // world units
    peakScale: 1.07,
    settleScale: 1.03,
    turn: 10,
    upDuration: 0.3,
    settleDuration: 0.3,
    neighbourScale: 0.8,
    neighbourOpacity: 0.5,
  },
  props: {
    duration: 0.7,
    scaleFrom: 0.8,
    stagger: 0.1,
  },
  cards: {
    rise: 24,
    scaleFrom: 0.97,
    stagger: 0.1,
    duration: 0.6,
  },
  detail: {
    duration: 0.95,
    cameraDolly: 0.08, // fraction of camera distance
  },
  ui: 0.2,
};

export const deg = (d: number) => (d * Math.PI) / 180;
