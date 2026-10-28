/**
 * HTML reveals. The 3D camera path itself is driven directly from section
 * positions inside the scene (see DentoraScene.station()), so scrolling up
 * reverses everything exactly. Reduced motion → opacity only.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bus } from './bus';
import { motion } from '../config/motion';

gsap.registerPlugin(ScrollTrigger);
// Keep animation time honest on slow frames so reveals never stall half-way.
gsap.ticker.lagSmoothing(0);

export function initReveals(root: HTMLElement): () => void {
  const ctx = gsap.context(() => {
    const reduced = bus.reduced;
    gsap.utils.toArray<HTMLElement>('[data-reveal-group]').forEach((group) => {
      const items = group.querySelectorAll<HTMLElement>('[data-reveal]');
      const cards = group.dataset.revealGroup === 'cards';
      gsap.from(items, {
        opacity: 0,
        y: reduced ? 0 : cards ? motion.cards.rise : 40,
        scale: reduced ? 1 : cards ? motion.cards.scaleFrom : 1,
        filter: reduced ? 'none' : 'blur(8px)',
        duration: reduced ? 0.3 : cards ? motion.cards.duration : 0.9,
        stagger: reduced ? 0 : cards ? motion.cards.stagger : 0.09,
        ease: 'power3.out',
        clearProps: 'transform,opacity,filter',
        scrollTrigger: { trigger: group, start: 'top 85%', once: true },
      });
    });
    // Hero title lines rise in once (the CTA stays usable immediately).
    if (!reduced) {
      gsap.from('.hero .line', { yPercent: 110, opacity: 0, duration: 1.2, stagger: 0.12, ease: 'power4.out', delay: 0.2, clearProps: 'all' });
      gsap.from('.portal-title', {
        scale: 0.7,
        opacity: 0,
        letterSpacing: '0.4em',
        ease: 'none',
        scrollTrigger: { trigger: '.portal', start: 'top 70%', end: 'center center', scrub: true },
      });
      gsap.to('.portal-inner', {
        opacity: 0,
        scale: 1.6,
        ease: 'power1.in',
        scrollTrigger: { trigger: '.portal', start: 'center center', end: 'bottom 40%', scrub: true },
      });
    }
  }, root);
  return () => ctx.revert();
}

export function refreshStory() {
  ScrollTrigger.refresh();
}
