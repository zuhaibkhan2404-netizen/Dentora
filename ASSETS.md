# Asset replacement guide

The mascot and props are procedural (built in code in `src/scene/models.ts`), so the site has no
external model files to load or lose. To use a sculpted character instead:

## 1. Commission or generate the mascot

Brief for a 3D artist or a generation tool (Meshy, Spline, Blender):

> Friendly stylised molar mascot, ivory enamel (#FBF6EC), softly rounded crown with two gentle cusps,
> two slightly tapered roots (#F1E4CD), small glossy black oval eyes with white highlights, thin
> subtle smile, faint peach cheeks. Approachable and calm, not childish or uncanny. No arms.
> Satin ceramic material: roughness ~0.35 with a light clearcoat. Clean quad topology, under 40k
> triangles, origin at the visual centre, facing +Z, Y-up, about 2.2 units tall
> (crown top +0.66, root tips -1.55). Separate meshes or shape keys for: eyelids (open→closed),
> mouth (frown→smile), brows. Export as GLB with Draco compression, textures 1k max.

Props, same material language: mint armchair (#A6D3C2); dental mirror (brushed steel + mirror glass);
toothbrush (peach handle, mint bristles); clear aligner tray (translucent, slight blue tint);
ceramic instrument cup; low cylindrical pedestals in mint, peach and pale blue.

## 2. Swap it in

1. Put `dentora-tooth.glb` in `public/`, and set `assets.toothModelUrl = 'dentora-tooth.glb'` in `src/config/site.ts`.
2. In `buildTooth()` (`models.ts`), load it with `GLTFLoader` from `three/examples/jsm/loaders/GLTFLoader.js` and add it to `body` in place of the crown and roots. Keep the `placement → entrance → turn → pointer → body` groups unchanged.
3. Map `setExpression()` to the model's morph targets (`mesh.morphTargetInfluences`), e.g. `lid`, `smile`, `brow`.
4. Keep the procedural tooth as the fallback if loading fails. The HTML/SVG posters in `src/components/Art.tsx` already cover the no-WebGL case.

## 3. Clinic photography

Replace `public/clinic-lounge.jpg` and `public/clinic-treatment-room.jpg` (3:4 portrait, ~1200px tall, under 250 KB each), then update the `alt` text in `assets.clinicImages`. If the photos are real, change `copy.clinic.imageLabel` from "Concept clinic imagery".
