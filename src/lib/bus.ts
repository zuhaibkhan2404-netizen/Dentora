/**
 * Shared, framework-agnostic state between the HTML layer and the WebGL scene.
 *
 * The scene reads these values every frame; React and ScrollTrigger write them.
 * Discrete events (selection, section entrances) go through the tiny emitter.
 */
import { gsap } from 'gsap';
import { motion } from '../config/motion';

type Handler = (payload?: unknown) => void;

export const bus = {
  /** Scroll transition progress: hero→reassure, reassure→treatments, treatments→care, clinic→booking. */
  t: [0, 0, 0, 0] as number[],
  /** 0 = collection, 1 = treatment detail. Tweened, never stepped. */
  detail: { v: 0 },
  selected: 0,
  flags: { treatmentsIn: false, careIn: false },
  pointer: { x: 0, y: 0, active: false },
  reduced: false,
  finePointer: false,
  mobile: false,

  _h: new Map<string, Set<Handler>>(),
  on(evt: string, fn: Handler) {
    if (!this._h.has(evt)) this._h.set(evt, new Set());
    this._h.get(evt)!.add(fn);
    return () => this._h.get(evt)!.delete(fn);
  },
  emit(evt: string, payload?: unknown) {
    this._h.get(evt)?.forEach((fn) => fn(payload));
  },
};

export function setSelected(i: number) {
  if (bus.selected === i) return;
  bus.selected = i;
  bus.emit('select', i);
}

export function animateDetail(open: boolean) {
  gsap.killTweensOf(bus.detail);
  if (bus.reduced) {
    bus.detail.v = open ? 1 : 0;
    return;
  }
  gsap.to(bus.detail, {
    v: open ? 1 : 0,
    duration: motion.detail.duration,
    ease: 'power3.inOut',
  });
}

export function initEnvironmentFlags() {
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const mob = window.matchMedia('(max-width: 860px)');
  const sync = () => {
    bus.reduced = rm.matches;
    bus.finePointer = fine.matches;
    bus.mobile = mob.matches;
    document.documentElement.toggleAttribute('data-reduced-motion', rm.matches);
    bus.emit('env');
  };
  sync();
  rm.addEventListener('change', sync);
  fine.addEventListener('change', sync);
  mob.addEventListener('change', sync);
  return () => {
    rm.removeEventListener('change', sync);
    fine.removeEventListener('change', sync);
    mob.removeEventListener('change', sync);
  };
}
