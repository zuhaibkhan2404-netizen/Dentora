/**
 * Dentora — cinematic scroll-driven scene.
 *
 * One continuous 3D world: a sunlit chalk coast with a molar-shaped sea arch,
 * a glowing portal between its roots, then a deep navy space of gold and
 * graphite shards with a fan of gold instruments and a dental chair.
 *
 * Scroll position → `station` (one per HTML section marked data-station) →
 * a Catmull-Rom camera path. The camera eases toward its target, so motion
 * stays fluid and reverses cleanly when scrolling up.
 *
 * Screen-anchored objects (treatment objects, mascot) live in a HUD group
 * attached to the camera and are fitted to HTML `data-slot` elements.
 * Their transforms are layered: placement → pop/entrance → turn → pointer → body.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { gsap } from 'gsap';
import { bus } from '../lib/bus';
import { motion, deg } from '../config/motion';
import {
  TOOTH,
  buildTooth,
  buildGeneralObject,
  buildWhiteningObject,
  buildAlignerObject,
  buildBookingPedestal,
  expressions,
  type ToothRig,
} from './models';
import { buildSky, buildSea, buildCoast, buildClouds, buildShards, buildInstrumentFan, buildDentalChair, ARCH } from './world';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = THREE.MathUtils.lerp;
const damp = THREE.MathUtils.damp;

/** Camera stations, one per page section (data-station 0…7). */
const STATIONS = [
  { pos: V(20, 8, 44), look: V(-30, 22, -60) }, // 0 hero — the coast (arch sits right of the headline)
  { pos: V(-22, 6, 6), look: V(6, 20, -60) }, // 1 reassure — circle toward the arch
  { pos: V(0, 7, -34), look: V(0, 6.5, -95) }, // 2 portal — between the roots
  { pos: V(-2, 3, -150), look: V(5, 1, -186) }, // 3 care — instrument fan
  { pos: V(0, 2.5, -236), look: V(0, 1.5, -300) }, // 4 treatments
  { pos: V(-6, 1.5, -324), look: V(7, -1.5, -352) }, // 5 approach — dental chair
  { pos: V(2, 2, -402), look: V(-3, 0, -462) }, // 6 clinic
  { pos: V(0, 1, -466), look: V(0, 0, -530) }, // 7 booking
];

const HUD_D = 12;

function setOpacity(obj: THREE.Object3D, a: number) {
  obj.visible = a > 0.004;
  if (!obj.visible) return;
  obj.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (!m) return;
    if (m.userData.base === undefined) m.userData.base = m.opacity;
    m.opacity = m.userData.base * a;
    const tr = a < 0.999 || !!m.userData.alwaysTransparent;
    if (m.transparent !== tr) {
      m.transparent = tr;
      m.needsUpdate = true;
    }
  });
}

interface Item {
  root: THREE.Group;
  pop: THREE.Group;
  spin: THREE.Group;
  state: { lift: number; scale: number; turn: number; opacity: number };
  appear: { v: number };
  x: number;
  z: number;
}

export interface SceneOptions {
  mobile: boolean;
  onContextLost?: () => void;
}

export class DentoraScene {
  private renderer: THREE.WebGLRenderer;
  private composer?: EffectComposer;
  private bloom?: UnrealBloomPass;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private hud = new THREE.Group();
  private clock = new THREE.Clock();
  private raf = 0;
  private running = false;
  private cleanups: (() => void)[] = [];
  private time = 0;

  private posCurve: THREE.CatmullRomCurve3;
  private lookCurve: THREE.CatmullRomCurve3;
  private camPos = new THREE.Vector3();
  private camLook = new THREE.Vector3();
  private intro = { t: 1 };
  private ptr = { x: 0, y: 0 };

  private sky: ReturnType<typeof buildSky>;
  private sea: ReturnType<typeof buildSea>;
  private coast: ReturnType<typeof buildCoast>;
  private clouds: ReturnType<typeof buildClouds>;
  private shards: ReturnType<typeof buildShards>;
  private fan: ReturnType<typeof buildInstrumentFan>;
  private chair: THREE.Group;
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private spaceKey: THREE.DirectionalLight;
  private fog: THREE.Fog;

  private items: Item[] = [];
  private mascot: ToothRig;
  private mascotIn = { v: 0 };
  private pedestal: THREE.Group;
  private blink = { v: 0, next: 3 };
  private mTurn = 0;

  private sections: HTMLElement[] = [];
  private slotEls: Record<string, Element | null> = {};
  private flashEl: HTMLElement | null;
  private lastWorld = '';
  private flags = { treat: false, book: false };

  constructor(private canvas: HTMLCanvasElement, private opts: SceneOptions) {
    const mobile = opts.mobile;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
    this.scene.add(this.camera);
    this.camera.add(this.hud);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.6;
    pmrem.dispose();

    this.fog = new THREE.Fog('#c5d7e4', 260, 1100);
    this.scene.fog = this.fog;

    // Lights
    this.hemi = new THREE.HemisphereLight('#cfe0f2', '#b9a27a', 0.55);
    this.sun = new THREE.DirectionalLight('#ffe6c2', 3.4);
    this.sun.position.set(-90, 55, 40);
    this.sun.target.position.set(0, 15, -60);
    this.scene.add(this.sun.target);
    if (!mobile) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(2048, 2048);
      const sc = this.sun.shadow.camera;
      sc.left = -90;
      sc.right = 90;
      sc.top = 70;
      sc.bottom = -40;
      sc.near = 10;
      sc.far = 300;
      this.sun.shadow.bias = -0.0008;
      this.sun.shadow.normalBias = 0.6;
    }
    this.spaceKey = new THREE.DirectionalLight('#ffe1a8', 0);
    this.spaceKey.position.set(20, 30, -200);
    this.spaceKey.target.position.set(0, 0, -320);
    this.scene.add(this.hemi, this.sun, this.spaceKey, this.spaceKey.target);
    const hudKey = new THREE.DirectionalLight('#fff3df', 0.8);
    hudKey.position.set(4, 5, 2);
    const hudTarget = new THREE.Object3D();
    hudTarget.position.set(0, 0, -HUD_D);
    hudKey.target = hudTarget;
    const hudRim = new THREE.DirectionalLight('#9fb4ff', 0.9);
    hudRim.position.set(-5, 2, -18);
    hudRim.target = hudTarget;
    this.camera.add(hudKey, hudTarget, hudRim);

    // World
    this.sky = buildSky();
    this.sea = buildSea(mobile);
    this.coast = buildCoast(mobile);
    this.clouds = buildClouds();
    this.shards = buildShards(mobile);
    this.fan = buildInstrumentFan();
    this.fan.group.position.set(6.5, -4.5, -188);
    this.chair = buildDentalChair();
    this.chair.position.set(8, -4.8, -352);
    this.chair.scale.setScalar(1.35);
    this.scene.add(this.sky.mesh, this.sea.mesh, this.coast.group, this.clouds.group, this.shards.group, this.fan.group, this.chair);

    this.posCurve = new THREE.CatmullRomCurve3(STATIONS.map((s) => s.pos), false, 'centripetal');
    this.lookCurve = new THREE.CatmullRomCurve3(STATIONS.map((s) => s.look), false, 'centripetal');

    // HUD: treatment objects
    [buildGeneralObject(), buildWhiteningObject(), buildAlignerObject()].forEach((obj) => {
      const root = new THREE.Group();
      const pop = new THREE.Group();
      const spin = new THREE.Group();
      root.add(pop);
      pop.add(spin);
      spin.add(obj);
      this.hud.add(root);
      this.items.push({ root, pop, spin, state: { lift: 0, scale: 0.8, turn: 0, opacity: 0.5 }, appear: { v: 0 }, x: 0, z: 0 });
    });
    // HUD: mascot on a pedestal beside the booking form
    this.mascot = buildTooth(mobile ? 'low' : 'high');
    this.mascot.shadow.visible = false;
    this.hud.add(this.mascot.placement);
    this.pedestal = buildBookingPedestal();
    this.hud.add(this.pedestal);

    this.flashEl = document.querySelector('.flash');
    this.applySelection(bus.selected, true);
    this.cleanups.push(bus.on('select', (i) => this.applySelection(i as number, false)));

    if (!mobile) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.25, 0.5, 0.95);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    }

    this.bindEvents();
    this.resize();
    this.update(0, true);
    if (!bus.reduced && window.scrollY < 40) gsap.to(this.intro, { t: 0, duration: 3.2, ease: 'power3.inOut', delay: 0.15 });
    else this.intro.t = 0;
  }

  /* ----------------------------------------------------------- lifecycle */

  private bindEvents() {
    const onResize = () => this.resize();
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      bus.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      bus.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      bus.pointer.active = true;
    };
    const onLeave = () => (bus.pointer.active = false);
    const onVis = () => (document.hidden ? this.stop() : this.start());
    const onLost = (e: Event) => {
      e.preventDefault();
      this.stop();
      this.opts.onContextLost?.();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    document.addEventListener('visibilitychange', onVis);
    this.canvas.addEventListener('webglcontextlost', onLost);
    this.cleanups.push(() => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      document.removeEventListener('visibilitychange', onVis);
      this.canvas.removeEventListener('webglcontextlost', onLost);
    });
  }

  private resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer?.setPixelRatio(this.renderer.getPixelRatio());
    this.composer?.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.8 ? 58 : 45;
    this.camera.updateProjectionMatrix();
  }

  start() {
    if (this.running || document.hidden) return;
    this.running = true;
    this.clock.getDelta();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.stop();
    this.cleanups.forEach((c) => c());
    gsap.killTweensOf([this.intro, this.mascotIn, this.blink, ...this.items.map((i) => i.state), ...this.items.map((i) => i.appear)]);
    this.composer?.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
    document.documentElement.dataset.world = 'coast';
  }

  /* ----------------------------------------------------------- animation triggers */

  private applySelection(sel: number, instant: boolean) {
    const m = motion.selection;
    this.items.forEach((it, i) => {
      gsap.killTweensOf(it.state);
      const isSel = i === sel;
      if (instant || bus.reduced) {
        Object.assign(it.state, isSel ? { lift: m.lift * 0.6, scale: m.settleScale, turn: deg(m.turn), opacity: 1 } : { lift: 0, scale: m.neighbourScale, turn: 0, opacity: m.neighbourOpacity });
        return;
      }
      if (isSel) {
        gsap
          .timeline()
          .to(it.state, { lift: m.lift, scale: m.peakScale, turn: deg(m.turn), opacity: 1, duration: m.upDuration, ease: 'power2.out' })
          .to(it.state, { lift: m.lift * 0.6, scale: m.settleScale, duration: m.settleDuration, ease: 'power1.inOut' });
      } else {
        gsap.to(it.state, { lift: 0, scale: m.neighbourScale, turn: 0, opacity: m.neighbourOpacity, duration: 0.45, ease: 'power2.out' });
      }
    });
  }

  private setTreatmentsIn(on: boolean) {
    this.items.forEach((it, i) => {
      gsap.killTweensOf(it.appear);
      if (bus.reduced) it.appear.v = on ? 1 : 0;
      else gsap.to(it.appear, { v: on ? 1 : 0, duration: on ? 0.8 : 0.35, delay: on ? i * 0.1 : 0, ease: on ? 'back.out(1.4)' : 'power1.in' });
    });
  }

  private setBookingIn(on: boolean) {
    gsap.killTweensOf(this.mascotIn);
    if (bus.reduced) this.mascotIn.v = on ? 1 : 0;
    else gsap.to(this.mascotIn, { v: on ? 1 : 0, duration: on ? motion.heroEntrance.duration : 0.35, ease: on ? 'power3.out' : 'power1.in' });
  }

  /* ----------------------------------------------------------- scroll → station */

  private station() {
    if (!this.sections.length || !this.sections[0].isConnected) this.sections = Array.from(document.querySelectorAll<HTMLElement>('[data-station]'));
    let s = 0;
    for (let i = 0; i < this.sections.length; i++) {
      const r = this.sections[i].getBoundingClientRect();
      if (r.top <= 1) s = i + clamp01(-r.top / Math.max(1, r.height));
      else break;
    }
    return Math.min(s, STATIONS.length - 1);
  }

  /* ----------------------------------------------------------- HUD fitting */

  private rect(name: string): DOMRect | null {
    let el = this.slotEls[name];
    if (!el || !el.isConnected) el = this.slotEls[name] = document.querySelector(`[data-slot="${name}"]`);
    return el ? el.getBoundingClientRect() : null;
  }

  private fit(name: string, mw: number, mh: number, fill: number) {
    const r = this.rect(name);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const k = (2 * Math.tan(deg(this.camera.fov / 2)) * HUD_D) / vh;
    if (!r || !r.width || !r.height) return { x: 0, y: 0, s: 0, ok: false, k };
    return {
      x: (r.left + r.width / 2 - vw / 2) * k,
      y: -(r.top + r.height / 2 - vh / 2) * k,
      s: Math.min((r.height * fill * k) / mh, (r.width * fill * k) / mw),
      ok: r.bottom > -vh * 0.3 && r.top < vh * 1.3,
      k,
    };
  }

  /* ----------------------------------------------------------- frame */

  private frame = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt, false);
    if (this.composer) this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);
  };

  private update(dt: number, snap: boolean) {
    const reduced = bus.reduced;
    if (!reduced) this.time += dt;
    const t = this.time;
    const s = this.station();
    const N = STATIONS.length - 1;

    /* ---- camera along the path ---- */
    const u = reduced ? Math.round(s) / N : s / N;
    const target = this.posCurve.getPoint(u);
    const look = this.lookCurve.getPoint(u);
    // Portrait screens: frame the arch more centrally on the opening shot.
    if (this.camera.aspect < 0.8) {
      const w = clamp01(1 - s);
      target.add(V(-14 * w, -2 * w, 18 * w));
      look.add(V(26 * w, 4 * w, 0));
    }
    const it = smooth(this.intro.t);
    target.add(V(0, 40 * it, 170 * it));
    look.add(V(0, 12 * it, 0));
    const usePtr = bus.finePointer && !reduced && bus.pointer.active;
    this.ptr.x = damp(this.ptr.x, usePtr ? bus.pointer.x : 0, 2.5, dt);
    this.ptr.y = damp(this.ptr.y, usePtr ? bus.pointer.y : 0, 2.5, dt);
    target.add(V(this.ptr.x * 1.6, -this.ptr.y * 0.9, 0));
    if (snap || reduced) {
      this.camPos.copy(target);
      this.camLook.copy(look);
    } else {
      const l = 3.2;
      this.camPos.set(damp(this.camPos.x, target.x, l, dt), damp(this.camPos.y, target.y, l, dt), damp(this.camPos.z, target.z, l, dt));
      this.camLook.set(damp(this.camLook.x, look.x, l, dt), damp(this.camLook.y, look.y, l, dt), damp(this.camLook.z, look.z, l, dt));
    }
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    // Gentle cinematic roll while flying through the portal and tunnel
    const roll = reduced ? 0 : Math.sin(clamp01((-this.camPos.z - 40) / 140) * Math.PI) * deg(7);
    this.camera.rotateZ(roll);

    /* ---- world mood: coast → space ---- */
    const z = this.camPos.z;
    const mix = smooth(clamp01((-z - 64) / 36)); // −64 … −100
    this.sky.mesh.position.copy(this.camPos);
    this.sky.mat.uniforms.uMix.value = mix;
    this.sea.mat.uniforms.uMix.value = mix;
    this.sea.mat.uniforms.uTime.value = t;
    (this.sea.mat.uniforms.uCam.value as THREE.Vector3).copy(this.camPos);
    this.fog.color.setRGB(lerp(0.77, 0.035, mix), lerp(0.84, 0.045, mix), lerp(0.89, 0.11, mix), THREE.SRGBColorSpace);
    this.fog.near = lerp(260, 14, mix);
    this.fog.far = lerp(1100, 150, mix);
    this.hemi.color.set('#cfe0f2').lerp(new THREE.Color('#3a4680'), mix);
    this.hemi.groundColor.set('#b9a27a').lerp(new THREE.Color('#0b0e1e'), mix);
    this.hemi.intensity = lerp(0.55, 0.7, mix);
    this.sun.intensity = 3.4 * (1 - mix);
    if (this.bloom) this.bloom.strength = lerp(0.22, 0.42, mix);
    this.spaceKey.intensity = 1.8 * mix;
    this.scene.environmentIntensity = lerp(0.6, 0.55, mix);

    const world = mix > 0.5 ? 'space' : 'coast';
    if (world !== this.lastWorld) {
      this.lastWorld = world;
      document.documentElement.dataset.world = world;
    }
    if (this.flashEl) {
      const f = reduced ? 0 : Math.exp(-(((z + 97) / 7) ** 2));
      this.flashEl.style.opacity = f > 0.01 ? (f * 0.9).toFixed(3) : '0';
    }

    /* ---- coast ---- */
    const coastVis = z > -150;
    this.coast.group.visible = coastVis;
    this.sea.mesh.visible = coastVis;
    this.clouds.group.visible = mix < 0.98;
    if (coastVis) {
      this.clouds.clouds.forEach((c) => {
        c.position.x += c.userData.speed * dt;
        if (c.position.x > 480) c.position.x = -480;
        (c.material as THREE.SpriteMaterial).opacity = (1 - mix) * 0.9;
      });
      const pulse = 0.85 + Math.sin(t * 1.6) * 0.15;
      this.coast.door.scale.setScalar(1 + Math.sin(t * 1.2) * 0.04);
      (this.coast.door.material as THREE.MeshBasicMaterial).opacity = pulse;
      this.coast.rings.forEach((r, i) => {
        const w = 1 + 0.06 * Math.sin(t * 3 - i * 0.7);
        r.scale.set(w, w, 1);
      });
    }

    /* ---- space ---- */
    const spaceVis = z < -40;
    this.shards.group.visible = spaceVis;
    this.fan.group.visible = spaceVis && z > -300;
    this.chair.visible = spaceVis && z < -230;
    if (spaceVis) {
      const burst = reduced ? 1 : smooth(clamp01((-z - 70) / 45));
      const sc = lerp(0.35, 1, burst);
      this.shards.group.scale.set(sc, sc, 1);
      this.shards.layers.forEach((l, i) => (l.rotation.z += dt * (0.025 + i * 0.012) * (i % 2 ? -1 : 1)));
      this.shards.dust.rotation.z -= dt * 0.03;

      // Instrument fan opens as the care section arrives, then breathes slightly.
      const open = reduced ? 1 : smooth(clamp01((s - 2.45) / 0.6));
      const n = this.fan.items.length;
      this.fan.items.forEach((itm, i) => {
        const a = (-62 + (124 * i) / (n - 1)) * open + Math.sin(t * 0.9 + i * 0.5) * 1.5 * open;
        itm.rotation.z = deg(-a);
        itm.position.y = (1 - open) * -2;
      });
      this.fan.group.rotation.y = deg(-18) + this.ptr.x * 0.15 + Math.sin(t * 0.3) * 0.06;
      this.fan.group.rotation.x = deg(-8);

      this.chair.rotation.y = deg(-35) + t * 0.18 + s * 0.4;
    }

    /* ---- HUD ---- */
    const inTreat = s > 3.5 && s < 4.8;
    if (inTreat !== this.flags.treat) {
      this.flags.treat = inTreat;
      this.setTreatmentsIn(inTreat);
    }
    const inBook = s > 6.45;
    if (inBook !== this.flags.book) {
      this.flags.book = inBook;
      this.setBookingIn(inBook);
    }
    this.updateItems(dt);
    this.updateMascot(dt);
  }

  private updateItems(dt: number) {
    const st = this.rect('treat-stage');
    const stage = this.fit('treat-stage', 2.2, 2.35, 0.82);
    const det = this.fit('treat-detail', 2.2, 2.35, 0.86);
    const detailE = smooth(clamp01(bus.detail.v));
    const sel = bus.selected;
    const n = this.items.length;
    const spacing = st ? Math.min(st.width * (bus.mobile ? 0.44 : 0.34), st.height * 1.25) * stage.k : 0;
    const reduced = bus.reduced;

    this.items.forEach((it, i) => {
      let off = i - sel;
      if (off > n / 2) off -= n;
      if (off < -n / 2) off += n;
      const isSel = off === 0;
      const tx = stage.x + off * spacing;
      const tz = isSel ? 0 : -1.6;
      it.x = reduced ? tx : damp(it.x || tx, tx, 8, dt);
      it.z = reduced ? tz : damp(it.z, tz, 8, dt);
      let x = it.x;
      let y = stage.y;
      let sc = stage.s;
      if (isSel && det.ok) {
        x = lerp(it.x, det.x, detailE);
        y = lerp(stage.y, det.y, detailE);
        sc = lerp(stage.s, det.s, detailE);
      }
      it.root.position.set(x, y, -HUD_D + it.z * (1 - detailE * 0.5));
      it.root.scale.setScalar(Math.max(sc, 0.0001));
      const ap = it.appear.v;
      it.pop.position.y = it.state.lift;
      it.pop.scale.setScalar(it.state.scale * (reduced ? 1 : lerp(0.6, 1, ap)));
      // Selected object slowly turns to show its depth; neighbours face inward.
      const idle = reduced ? 0 : Math.sin(this.time * 0.6 + i) * deg(8);
      const restYaw = isSel ? deg(-10) + idle : deg(-off * 24);
      it.spin.rotation.y = isSel ? lerp(restYaw + it.state.turn, deg(-22) + idle, detailE) : restYaw;
      it.spin.rotation.x = isSel ? deg(4) * detailE : 0;
      const a = (stage.ok || det.ok ? 1 : 0) * clamp01(ap) * it.state.opacity * (isSel ? 1 : 1 - detailE);
      setOpacity(it.root, a);
    });
  }

  private updateMascot(dt: number) {
    const reduced = bus.reduced;
    const c = this.fit('booking', 2.3, 2.9, 0.9);
    const T = this.mascot;
    const e = this.mascotIn.v;
    const crownY = c.y + 0.67 * c.s;
    T.placement.position.set(c.x, crownY - 0.445 * c.s, -HUD_D);
    T.placement.scale.setScalar(Math.max(c.s, 0.0001));
    const m = motion.heroEntrance;
    T.entrance.position.y = reduced ? 0 : (-(1 - e) * m.rise * c.k) / Math.max(c.s, 0.0001);
    T.entrance.scale.setScalar(reduced ? 1 : lerp(m.scaleFrom, 1, e) + Math.sin(e * Math.PI) * (m.scalePeak - 1));
    T.entrance.rotation.set(0, reduced ? 0 : deg(m.turnFrom) * (1 - e), reduced ? 0 : Math.sin(e * Math.PI) * deg(m.settleTilt));
    this.mTurn = reduced ? deg(14) : damp(this.mTurn, deg(14) + Math.sin(this.time * 0.5) * deg(5), 4, dt);
    T.turn.rotation.set(0, this.mTurn, 0);
    const usePtr = bus.finePointer && !reduced && bus.pointer.active;
    T.pointer.rotation.set(
      damp(T.pointer.rotation.x, usePtr ? bus.pointer.y * deg(motion.pointer.maxPitch) : 0, motion.pointer.damping, dt),
      damp(T.pointer.rotation.y, usePtr ? bus.pointer.x * deg(motion.pointer.maxYaw) : 0, motion.pointer.damping, dt),
      0,
    );
    if (!reduced) {
      this.blink.next -= dt;
      if (this.blink.next <= 0) {
        this.blink.next = 3.5 + Math.random() * 3.5;
        gsap.fromTo(this.blink, { v: 0 }, { v: 1, duration: 0.07, yoyo: true, repeat: 1 });
      }
    }
    T.setExpression(expressions.happy, reduced ? 0 : this.blink.v);
    const a = c.ok ? clamp01(e * 1.5) : 0;
    setOpacity(T.placement, a);
    T.shadow.visible = false;
    const pedTop = crownY + TOOTH.bottom * c.s;
    this.pedestal.position.set(c.x, pedTop - 0.17 * c.s, -HUD_D - 0.1);
    this.pedestal.scale.setScalar(Math.max(c.s, 0.0001));
    this.pedestal.rotation.y = this.time * 0.2;
    setOpacity(this.pedestal, c.ok ? clamp01(e * 2) : 0);
  }
}

export { ARCH };
