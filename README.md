# Dentora — interactive dental studio website (demo)

A responsive single-page site for **Dentora**, a *demonstration* dental brand: a live 3D tooth mascot,
scroll-driven storytelling, a treatment carousel with a collection-to-detail transition, and an honest
demo appointment form.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview
```

Node 18+ recommended.

Test switches: `?nowebgl` forces the static-artwork fallback; `?debug` exposes the scene as
`window.__dentoraScene`. Reduced motion follows the OS `prefers-reduced-motion` setting.

## Stack (and an honest note)

React 19 + TypeScript, **Three.js (r170)** and **GSAP 3.12 + ScrollTrigger**.

The brief asked for React Three Fiber + Drei. The build sandbox had no access to the npm registry,
so R3F/Drei could not be installed; the scene is written in plain Three.js inside one class
(`src/scene/DentoraScene.ts`) mounted by a React component. It keeps the architecture the brief asked
for: one WebGL canvas, semantic HTML for everything readable, separate transform groups and a single
state model. Porting to R3F is mechanical: each `build*()` function in `models.ts` becomes a component
and `update()` becomes `useFrame`.

`scripts/build-local.mjs` is the offline esbuild script used in that sandbox. You don't need it;
use `npm run build`.

## Where to edit things

| What | File |
|---|---|
| Copy, treatments, clinic facts, images, booking endpoint | `src/config/site.ts` |
| Animation timings, angles, scales | `src/config/motion.ts` |
| Colours (3D) | `src/config/theme.ts` (CSS colours: `:root` in `src/styles.css`) |
| 3D models | `src/scene/models.ts` |
| Scene behaviour | `src/scene/DentoraScene.ts` |
| Scroll story triggers | `src/lib/story.ts` |

## Cinematic structure (v2)

One continuous 3D world, flown through by scrolling:

1. **Coast** — sunlit sea (animated wave shader), beach, chalk cliffs, drifting clouds and a giant
   molar-shaped sea arch studded with gold. The camera glides in from the sky on load.
2. **Portal** — the camera flies between the roots, through a tunnel of glowing gold rings, with a
   light flash as it exits.
3. **Space** — a navy void with ~2,800 gold and graphite shards that burst outward. Gold dust,
   a fan of gold dental instruments that opens as you scroll, and a rotating dental chair.
4. Treatments, approach, clinic and booking sections float above the shard world as glass panels.

Camera stations live in `STATIONS` in `src/scene/DentoraScene.ts`, one per section marked
`data-station`. Scroll position picks a point on a Catmull-Rom path and the camera eases toward it,
so scrolling back up reverses the flight. Desktop gets bloom and soft sun shadows. Mobile skips
both and uses fewer shards. World builders are in `src/scene/world.ts`.

## How the scene works (HUD objects)

HTML owns the layout. Each 3D composition is fitted every frame into an element marked
`data-slot="hero" | "reassure" | "treat-mascot" | "treat-stage" | "treat-detail" | "care" | "booking"`.
ScrollTrigger only measures progress (`bus.t[0..3]`); the scene blends the mascot between slot poses,
so the animation reverses exactly when you scroll up and always matches the responsive layout.

Mascot transform groups, each written by exactly one system:
`placement` (slot + scroll) → `entrance` (hero arrival) → `turn` (scroll turning / look) →
`pointer` (damped mouse response) → `body` (expression, blink).
Treatment objects: `root` (placement) → `pop` (selection lift/scale) → `spin` (orientation).

Rendering pauses when no 3D section is on screen or the tab is hidden. Device pixel ratio is capped
(1.75 on desktop, 1.5 on mobile); mobile uses lower-poly geometry and one fewer light.

## Placeholders and integration notes

- **Demo brand.** Clinicians, reviews, prices, awards and credentials are deliberately absent.
- **Clinic facts** (`clinic` in `site.ts`) are all `null`, so they are hidden. A neutral note says they will appear once verified.
- **Booking.** `booking.endpoint = null` keeps the form in demo mode: it validates (required fields, email format, no past dates in the visitor's local time zone) and then shows *"Demo complete. Your details were not sent and no appointment has been booked."* If you set a POST endpoint (Formspree, your own API), the form sends JSON: `name, email, phone, treatment, date, message`.
- **Clinic images** (`public/`) come from the two reference renders supplied with the brief. They are labelled "Concept clinic imagery". The lounge image was cropped to remove the original designer's watermark and another clinic's name. Confirm you have rights to use these renders, or replace them with real clinic photos.
- **Treatment text** is illustrative general information. Have a dentist review it before launch.
- Fonts: Instrument Serif + Manrope via Google Fonts, with system fallbacks.

See `ASSETS.md` for how to replace the procedural 3D models.
