/**
 * Procedural models for the Dentora scene.
 *
 * All coordinates are in "tooth units": the mascot's crown is centred on the
 * origin, crown top ≈ +0.66, root tips ≈ −1.55. Every builder creates its own
 * materials so rigs can fade independently.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { theme } from '../config/theme';

export const TOOTH = { top: 0.66, bottom: -1.55, width: 1.62 };
export const TOOTH_H = TOOTH.top - TOOTH.bottom; // 2.21
export const TOOTH_CENTER = (TOOTH.top + TOOTH.bottom) / 2; // -0.445

const C = (hex: string) => new THREE.Color(hex);

/* ---------------------------------------------------------------- materials */

export const materials = {
  enamel: () =>
    new THREE.MeshPhysicalMaterial({
      color: C(theme.enamel),
      roughness: 0.36,
      clearcoat: 0.6,
      clearcoatRoughness: 0.32,
      sheen: 0.35,
      sheenRoughness: 0.6,
      sheenColor: C('#fff1dc'),
    }),
  root: () =>
    new THREE.MeshPhysicalMaterial({ color: C(theme.root), roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
  soft: (hex: string, rough = 0.62) =>
    new THREE.MeshPhysicalMaterial({ color: C(hex), roughness: rough, sheen: 0.5, sheenRoughness: 0.8, sheenColor: C('#ffffff') }),
  steel: () => new THREE.MeshStandardMaterial({ color: C('#d4a84f'), metalness: 1, roughness: 0.24 }),
  mirror: () => new THREE.MeshStandardMaterial({ color: C('#e6eef0'), metalness: 1, roughness: 0.05 }),
  ink: () => new THREE.MeshStandardMaterial({ color: C('#1e2224'), roughness: 0.32 }),
};

/* ---------------------------------------------------------------- geometry */

const sq = (a: number, e: number) => Math.sign(a) * Math.pow(Math.abs(a), e);

/** Crown: a softened superellipsoid with an occlusal dip between two cusps and a gentle neck. */
export function crownGeometry(seg = 96) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let x = sq(v.x, 0.72) * 0.81;
    let y = sq(v.y, 0.8) * 0.66;
    let z = sq(v.z, 0.76) * 0.63;
    if (y > 0) {
      const top = THREE.MathUtils.smoothstep(y, 0.22, 0.66);
      y -= 0.12 * Math.exp(-(x * x) / 0.05) * top;
      y += 0.02 * Math.exp(-((Math.abs(x) - 0.42) ** 2) / 0.03) * top; // cusp fullness
    } else {
      const n = Math.min(1, -y / 0.66);
      const k = 1 - 0.17 * n * n;
      x *= k;
      z *= k;
    }
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/** Root: a tapered lathe that is bent slightly outward and back in. */
export function rootGeometry(seg = 36) {
  const pts = [
    [0.0, 0.14],
    [0.22, 0.08],
    [0.27, -0.12],
    [0.255, -0.45],
    [0.21, -0.8],
    [0.14, -1.03],
    [0.065, -1.15],
    [0.0, -1.19],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const curve = new THREE.SplineCurve(pts);
  const g = new THREE.LatheGeometry(curve.getPoints(48), seg);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const t = Math.min(1, Math.max(0, -y / 1.19));
    p.setX(i, p.getX(i) + 0.07 * Math.sin(t * Math.PI) - 0.02 * t);
  }
  g.computeVertexNormals();
  return g;
}

function rbox(w: number, h: number, d: number, r: number, seg = 5) {
  return new RoundedBoxGeometry(w, h, d, seg, r);
}

/* ---------------------------------------------------------------- shadow */

let shadowTex: THREE.Texture | null = null;
function getShadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(20,30,26,0.55)');
  g.addColorStop(0.45, 'rgba(20,30,26,0.25)');
  g.addColorStop(1, 'rgba(20,30,26,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}

/** A soft ground shadow facing the camera, squashed into an ellipse. */
export function makeShadow() {
  const m = new THREE.MeshBasicMaterial({ map: getShadowTexture(), transparent: true, depthWrite: false });
  m.userData.alwaysTransparent = true;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
  mesh.renderOrder = -1;
  return mesh;
}

/* ---------------------------------------------------------------- mascot */

export interface Expression {
  lid: number; // 0 open → 1 closed
  smile: number; // −1 frown → 1 big smile
  brow: number; // −1 worried → 1 lifted
  lookX: number; // −1 … 1
  lookY: number;
}

export const expressions: Record<string, Expression> = {
  hero: { lid: 0.05, smile: 0.75, brow: 0.25, lookX: 0, lookY: 0 },
  breathe: { lid: 0.88, smile: 0.55, brow: 0.1, lookX: 0, lookY: 0 },
  curious: { lid: 0.1, smile: 0.6, brow: 0.6, lookX: -0.7, lookY: -0.5 },
  relaxed: { lid: 0.5, smile: 0.55, brow: 0.0, lookX: 0.2, lookY: 0.1 },
  happy: { lid: 0.0, smile: 1, brow: 0.5, lookX: 0.3, lookY: 0 },
};

export interface ToothRig {
  placement: THREE.Group;
  entrance: THREE.Group;
  turn: THREE.Group;
  pointer: THREE.Group;
  body: THREE.Group;
  shadow: THREE.Mesh;
  eyes: THREE.Group[];
  eyeBase: THREE.Vector3[];
  brows: THREE.Mesh[];
  mouth: THREE.Group;
  setExpression: (e: Expression, blink: number) => void;
}

export function buildTooth(quality: 'high' | 'low', withFace = true): ToothRig {
  const seg = quality === 'high' ? 96 : 64;
  const placement = new THREE.Group();
  const entrance = new THREE.Group();
  const turn = new THREE.Group();
  const pointer = new THREE.Group();
  const body = new THREE.Group();
  placement.add(entrance);
  entrance.add(turn);
  turn.add(pointer);
  pointer.add(body);
  body.position.y = -TOOTH_CENTER; // rig origin = visual centre of the character

  const enamel = materials.enamel();
  const crown = new THREE.Mesh(crownGeometry(seg), enamel);
  body.add(crown);

  const rootMat = materials.root();
  const rg = rootGeometry(quality === 'high' ? 36 : 24);
  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(rg, rootMat);
    r.position.set(0.33 * s, -0.36, -0.02);
    r.rotation.z = 0.05 * s;
    if (s < 0) r.scale.x = -1;
    body.add(r);
  }

  const shadow = makeShadow();
  placement.add(shadow);

  const eyes: THREE.Group[] = [];
  const eyeBase: THREE.Vector3[] = [];
  const brows: THREE.Mesh[] = [];
  const mouth = new THREE.Group();

  if (withFace) {
    crown.updateMatrixWorld(true);
    const ray = new THREE.Raycaster();
    const surface = (x: number, y: number) => {
      ray.set(new THREE.Vector3(x, y, 5), new THREE.Vector3(0, 0, -1));
      const hit = ray.intersectObject(crown, false)[0];
      const n = hit.face!.normal.clone();
      return { p: hit.point.clone(), n };
    };
    const place = (o: THREE.Object3D, x: number, y: number, lift = 0.0) => {
      const { p, n } = surface(x, y);
      o.position.copy(p).addScaledVector(n, lift);
      o.lookAt(p.clone().add(n));
      body.add(o);
      return o;
    };

    const ink = materials.ink();
    const white = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    for (const s of [-1, 1]) {
      const eye = new THREE.Group();
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.085, 32, 24), ink);
      ball.scale.set(0.82, 1.12, 0.42);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), white);
      glint.position.set(0.024, 0.042, 0.03);
      const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), white);
      glint2.position.set(-0.02, -0.03, 0.03);
      eye.add(ball, glint, glint2);
      place(eye, 0.27 * s, 0.13, 0.005);
      eyes.push(eye);
      eyeBase.push(eye.position.clone());

      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.085, 4, 10), materials.ink());
      (brow.material as THREE.MeshStandardMaterial).color.set('#4a403a');
      const bh = new THREE.Group();
      place(bh, 0.27 * s, 0.3, 0.012);
      brow.rotation.z = Math.PI / 2;
      bh.add(brow);
      bh.userData.side = s;
      brows.push(brow);

      const cheek = new THREE.Mesh(
        new THREE.CircleGeometry(0.075, 28),
        new THREE.MeshBasicMaterial({ color: theme.peach, transparent: true, opacity: 0.42, depthWrite: false }),
      );
      cheek.material.userData.alwaysTransparent = true;
      cheek.scale.set(1.25, 0.8, 1);
      place(cheek, 0.45 * s, -0.04, 0.006);
    }

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.115, 0, 0),
      new THREE.Vector3(0, -0.085, 0),
      new THREE.Vector3(0.115, 0, 0),
    );
    const lip = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.0165, 10, false), ink);
    const capG = new THREE.SphereGeometry(0.0165, 10, 8);
    const c1 = new THREE.Mesh(capG, ink);
    c1.position.set(-0.115, 0, 0);
    const c2 = new THREE.Mesh(capG, ink);
    c2.position.set(0.115, 0, 0);
    const smileG = new THREE.Group();
    smileG.add(lip, c1, c2);
    smileG.position.y = 0.03;
    mouth.add(smileG);
    place(mouth, 0, -0.12, 0.012);
  }

  const setExpression = (e: Expression, blink: number) => {
    const lid = Math.min(1, Math.max(e.lid, blink));
    eyes.forEach((eye, i) => {
      eye.scale.set(1 + lid * 0.12, Math.max(0.13, 1 - lid * 0.9), 1);
      const b = eyeBase[i];
      eye.position.set(b.x + e.lookX * 0.022, b.y + e.lookY * 0.018 - lid * 0.012, b.z);
    });
    brows.forEach((brow) => {
      const s = (brow.parent!.userData.side as number) || 1;
      brow.parent!.rotation.z = -s * e.brow * 0.18 + s * 0.04;
      brow.position.y = e.brow * 0.012;
    });
    mouth.scale.set(1 + e.smile * 0.1, Math.max(-0.7, e.smile), 1);
  };

  return { placement, entrance, turn, pointer, body, shadow, eyes, eyeBase, brows, mouth, setExpression };
}

/* ---------------------------------------------------------------- props */

/** Mint armchair in crown-origin coordinates (the tooth sits in it). */
export function buildChair() {
  const g = new THREE.Group();
  const fabric = materials.soft(theme.chair, 0.7);
  const deep = materials.soft(theme.chairDeep, 0.7);
  const seat = new THREE.Mesh(rbox(2.25, 0.5, 1.5, 0.22), fabric);
  seat.position.set(0, -1.2, 0.25);
  const back = new THREE.Mesh(rbox(2.25, 1.75, 0.5, 0.24), fabric);
  back.position.set(0, -0.48, -0.62);
  back.rotation.x = -0.06;
  const armG = rbox(0.48, 0.95, 1.85, 0.22);
  const armL = new THREE.Mesh(armG, fabric);
  armL.position.set(-1.28, -0.95, 0.05);
  const armR = armL.clone();
  armR.position.x = 1.28;
  const skirt = new THREE.Mesh(rbox(2.95, 0.42, 1.85, 0.18), deep);
  skirt.position.set(0, -1.62, 0.05);
  const legMat = materials.soft('#d9c7a8', 0.5);
  const legG = new THREE.CylinderGeometry(0.06, 0.045, 0.32, 16);
  for (const x of [-1.2, 1.2])
    for (const z of [-0.6, 0.7]) {
      const leg = new THREE.Mesh(legG, legMat);
      leg.position.set(x, -1.98, z);
      g.add(leg);
    }
  g.add(seat, back, armL, armR, skirt);
  return g;
}

/** Dental mirror; origin at the middle of the instrument, head pointing +y, glass facing +z. */
export function buildMirror() {
  const g = new THREE.Group();
  const steel = materials.steel();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.25, 28), steel);
  handle.position.y = -0.45;
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.009, 8, 28), steel);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.85 + i * 0.07;
    g.add(ring);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.045, 0.42, 16), steel);
  neck.position.y = 0.38;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.032, 16, 56), steel);
  rim.position.set(0, 0.82, 0);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.248, 56), materials.mirror());
  glass.position.set(0, 0.82, 0.004);
  const back = new THREE.Mesh(new THREE.CircleGeometry(0.25, 56), steel);
  back.position.set(0, 0.82, -0.004);
  back.rotation.y = Math.PI;
  g.add(handle, neck, rim, glass, back);
  return g;
}

/** Toothbrush; origin at centre, head at +y, bristles facing +z. */
export function buildToothbrush() {
  const g = new THREE.Group();
  const handleMat = materials.soft(theme.peach, 0.45);
  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 1.15, 8, 24), handleMat);
  handle.position.y = -0.35;
  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.4, 6, 16), handleMat);
  neck.position.y = 0.42;
  const head = new THREE.Mesh(rbox(0.2, 0.46, 0.1, 0.045), materials.soft('#fff8f1', 0.4));
  head.position.set(0, 0.8, 0);
  const bristleMat = materials.soft('#bfe5d5', 0.8);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 2; c++) {
      const tuft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 10), bristleMat);
      tuft.rotation.x = Math.PI / 2;
      tuft.position.set(-0.045 + c * 0.09, 0.64 + r * 0.105, 0.12);
      g.add(tuft);
    }
  g.add(handle, neck, head);
  return g;
}

/** Four-point sparkle accent. */
export function buildSparkle(color = '#f3d3a6', size = 0.2) {
  const s = new THREE.Shape();
  const r = size;
  const k = size * 0.12;
  s.moveTo(0, r);
  s.quadraticCurveTo(k, k, r, 0);
  s.quadraticCurveTo(k, -k, 0, -r);
  s.quadraticCurveTo(-k, -k, -r, 0);
  s.quadraticCurveTo(-k, k, 0, r);
  const geo = new THREE.ExtrudeGeometry(s, { depth: size * 0.15, bevelEnabled: true, bevelSize: size * 0.06, bevelThickness: size * 0.06, bevelSegments: 3, curveSegments: 10 });
  geo.center();
  const m = new THREE.MeshStandardMaterial({ color, emissive: C(color), emissiveIntensity: 0.35, roughness: 0.35, metalness: 0.2 });
  return new THREE.Mesh(geo, m);
}

export function buildPedestal(color: string, radius = 0.85) {
  const g = new THREE.Group();
  // Dark lacquer plinth with a gold lip; `color` tints the lacquer slightly.
  const mat = new THREE.MeshPhysicalMaterial({ color: C('#1b2140').lerp(C(color), 0.12), roughness: 0.3, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.04, 0.34, 64), mat);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.99, 0.035, 12, 64), materials.steel());
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.17;
  g.add(base, lip);
  return g;
}

/* ---------------------------------------------------------------- treatment objects
 * Each is centred on the origin, ~2.2 units tall, resting on a pedestal.
 */

export function buildGeneralObject() {
  const g = new THREE.Group();
  const ped = buildPedestal('#cfe9de');
  ped.position.y = -0.95;
  // A soft ceramic cup holding a mirror and a probe — everyday check-up tools.
  const cupMat = materials.soft('#fbf6ec', 0.4);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.78, 48, 1, true), cupMat);
  cupMat.side = THREE.DoubleSide;
  cup.position.y = -0.4;
  const cupBase = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 48), cupMat);
  cupBase.position.y = -0.78;
  const cupLip = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 12, 48), cupMat);
  cupLip.rotation.x = Math.PI / 2;
  cupLip.position.y = -0.01;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.405, 0.385, 0.16, 48, 1, true), materials.soft('#8fc9b4', 0.6));
  band.position.y = -0.28;
  const mirror = buildMirror();
  mirror.scale.setScalar(0.92);
  mirror.position.set(-0.1, 0.3, 0.02);
  mirror.rotation.set(0.05, 0.25, 0.2);
  const steel = materials.steel();
  const probeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.6, 0),
    new THREE.Vector3(0, 0.55, 0),
    new THREE.Vector3(0.03, 0.72, 0),
    new THREE.Vector3(0.12, 0.8, 0),
    new THREE.Vector3(0.18, 0.76, 0),
  ]);
  const probe = new THREE.Mesh(new THREE.TubeGeometry(probeCurve, 64, 0.028, 12, false), steel);
  const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.7, 6, 20), materials.soft(theme.peach, 0.45));
  grip.position.y = -0.1;
  const probeG = new THREE.Group();
  probeG.add(probe, grip);
  probeG.position.set(0.16, 0.12, -0.05);
  probeG.rotation.z = -0.24;
  const sp = buildSparkle('#e2b75c', 0.12);
  sp.position.set(-0.7, 0.75, 0.1);
  g.add(ped, cup, cupBase, cupLip, band, mirror, probeG, sp);
  return g;
}

export function buildWhiteningObject() {
  const g = new THREE.Group();
  const ped = buildPedestal('#f6dccd');
  ped.position.y = -0.95;
  const mini = buildTooth('low', false);
  mini.placement.scale.setScalar(0.62);
  mini.placement.position.y = -0.1;
  mini.shadow.visible = false;
  g.add(ped, mini.placement);
  const spots: [number, number, number, number][] = [
    [0.68, 0.62, 0.25, 1],
    [-0.62, 0.38, 0.15, 0.75],
    [0.55, -0.18, 0.2, 0.55],
  ];
  spots.forEach(([x, y, z, s]) => {
    const sp = buildSparkle('#e2b75c', 0.18 * s);
    sp.position.set(x, y, z);
    sp.rotation.z = 0.2;
    g.add(sp);
  });
  return g;
}

export function buildAlignerObject() {
  const g = new THREE.Group();
  const ped = buildPedestal('#d7e7ef');
  ped.position.y = -0.95;
  const arch = new THREE.Group();
  const pts: THREE.Vector3[] = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const a = -Math.PI * 0.56 + (i / N) * Math.PI * 1.12;
    pts.push(new THREE.Vector3(0.62 * Math.sin(a), 0, 0.5 * Math.cos(a) - 0.1));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tray = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 96, 0.16, 24, false),
    new THREE.MeshPhysicalMaterial({ color: C('#e8f6fb'), roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.5, depthWrite: false }),
  );
  (tray.material as THREE.Material).userData.alwaysTransparent = true;
  tray.scale.y = 0.85;
  tray.renderOrder = 2;
  const enamel = materials.enamel();
  const toothG = rbox(0.17, 0.2, 0.15, 0.06, 3);
  for (let i = 0; i < 10; i++) {
    const u = 0.04 + (i / 9) * 0.92;
    const p = curve.getPointAt(u);
    const tan = curve.getTangentAt(u);
    const t = new THREE.Mesh(toothG, enamel);
    t.position.copy(p);
    t.rotation.y = Math.atan2(tan.x, tan.z) + Math.PI / 2;
    const front = 1 - Math.abs(u - 0.5) * 2;
    t.scale.set(0.8 + front * 0.25, 0.9, 0.9);
    arch.add(t);
  }
  arch.add(tray);
  const ends = new THREE.SphereGeometry(0.16, 20, 16);
  for (const u of [0, 1]) {
    const e = new THREE.Mesh(ends, tray.material);
    e.position.copy(curve.getPointAt(u));
    e.scale.y = 0.85;
    arch.add(e);
  }
  arch.rotation.x = 0.62;
  arch.position.y = 0.05;
  arch.scale.setScalar(1.15);
  const sp = buildSparkle('#e2b75c', 0.14);
  sp.position.set(0.72, 0.62, 0.1);
  g.add(ped, arch, sp);
  return g;
}

export function buildBookingPedestal() {
  const g = buildPedestal('#cfe9de', 0.95);
  return g;
}
