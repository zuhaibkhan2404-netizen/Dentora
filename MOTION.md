# Animation configuration (`src/config/motion.ts`)

- **heroEntrance**: rises 40px, scales 0.86 → 1.04 → 1, turns from −18°, tilts up to 3° and settles. About 1.1s, starting once the scene is ready.
- **pointer**: up to ±5° yaw and ±3° pitch with damped follow. Only on desktop with a fine pointer, and off in reduced motion.
- **scroll**: hero → reassurance turn of 26°. Scale and position follow the HTML slots and the chair fades out. The background shifts from mint to ivory.
- **selection**: lift, 1.07 peak, settle at 1.03, 10° turn toward the viewer. Neighbours go to 0.8 scale and 0.5 opacity. About 0.6s, with a single overshoot.
- **props**: dark-scene mirror (from the right) and toothbrush (from the left) scale 0.8 → 1 with a small rotation, staggered 100ms. Sparkles follow. One short brushing gesture.
- **cards**: 24px rise, 0.97 → 1 scale, 100ms stagger. Hover and focus raise a card 5px.
- **detail**: 0.95s camera dolly toward the object, object turns to three-quarter view, neighbours and mascot fade.

Reduced motion: no travel, turning, overshoot, dolly, blink or pointer tracking. Compositions are static, and the change between sections is a brief opacity fade.
