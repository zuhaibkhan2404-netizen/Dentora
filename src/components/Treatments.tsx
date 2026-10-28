import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { copy, treatments, brand } from '../config/site';
import { setSelected, animateDetail, bus } from '../lib/bus';
import { refreshStory } from '../lib/story';
import { TreatmentArt } from './Art';

interface Props {
  selected: number;
  onSelect: (i: number) => void;
  detailOpen: boolean;
  onDetail: (open: boolean) => void;
  onBook: (treatmentId: string) => void;
}

export function Treatments({ selected, onSelect, detailOpen, onDetail, onBook }: Props) {
  const n = treatments.length;
  const t = treatments[selected];
  const exploreRef = useRef<HTMLButtonElement>(null);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const [announce, setAnnounce] = useState('');
  const first = useRef(true);

  const select = (i: number) => {
    const next = ((i % n) + n) % n;
    onSelect(next);
    setSelected(next);
    setAnnounce(`${treatments[next].name}, ${next + 1} of ${n}`);
  };

  const open = () => {
    onDetail(true);
    animateDetail(true);
    const el = sectionRef.current;
    if (el) {
      const top = el.getBoundingClientRect().top;
      if (top < -40 || top > 160) window.scrollTo({ top: window.scrollY + top - 8, behavior: bus.reduced ? 'auto' : 'smooth' });
    }
  };
  const close = () => {
    onDetail(false);
    animateDetail(false);
  };

  // Focus management when entering / leaving the detail view.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Retry briefly: the target view becomes focusable once it is no longer inert/hidden.
    let tries = 0;
    let id = 0;
    const attempt = () => {
      const el = detailOpen ? detailHeadingRef.current : exploreRef.current;
      el?.focus({ preventScroll: true });
      if (document.activeElement !== el && tries++ < 20) id = window.setTimeout(attempt, 40);
      else refreshStory();
    };
    id = window.setTimeout(attempt, detailOpen && !bus.reduced ? 500 : 30);
    return () => clearTimeout(id);
  }, [detailOpen]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && detailOpen) close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onStageKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') select(selected + 1);
    else if (e.key === 'ArrowLeft') select(selected - 1);
    else if (e.key === 'Home') select(0);
    else if (e.key === 'End') select(n - 1);
    else if (e.key === 'Enter') open();
    else return;
    e.preventDefault();
  };

  // Swipe / drag: horizontal gestures only — vertical scrolling stays native (touch-action: pan-y).
  const onDown = (e: PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onUp = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) select(selected + (dx < 0 ? 1 : -1));
  };

  return (
    <section id="treatments" ref={sectionRef} className="section treatments" data-station="4" aria-labelledby="treatments-title">
      <div className="views">
        {/* ---------------- collection ---------------- */}
        <div className="view view-collection" aria-hidden={detailOpen} inert={detailOpen || undefined}>
          <div className="container treat-head" data-reveal-group>
            <div className="treat-head-text">
              <p className="eyebrow" data-reveal>
                {copy.treatments.eyebrow}
              </p>
              <h2 id="treatments-title" className="display-2" data-reveal>
                {copy.treatments.titleA} <em>{copy.treatments.titleB}</em>
              </h2>
              <p className="lede" data-reveal>
                {copy.treatments.body}
              </p>
            </div>
          </div>

          <div
            className="carousel container"
            role="region"
            aria-roledescription="carousel"
            aria-label="Treatment collection"
          >
            <div
              className="stage"
              tabIndex={0}
              aria-label={`Treatment stage. ${t.name} selected. Use left and right arrow keys to browse, Enter to explore.`}
              onKeyDown={onStageKey}
              onPointerDown={onDown}
              onPointerUp={onUp}
              onPointerCancel={() => (drag.current = null)}
            >
              <div className="slot slot-stage" data-slot="treat-stage" aria-hidden="true">
                <div className="stage-fallback">
                  {treatments.map((tr, i) => (
                    <div key={tr.id} className={`stage-fallback-item${i === selected ? ' is-selected' : ''}`}>
                      <TreatmentArt id={tr.id} />
                    </div>
                  ))}
                </div>
              </div>
              <button type="button" className="round-btn stage-prev" onClick={() => select(selected - 1)} aria-label="Previous treatment">
                <span aria-hidden="true">←</span>
              </button>
              <button type="button" className="round-btn stage-next" onClick={() => select(selected + 1)} aria-label="Next treatment">
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="t-cards" data-reveal-group="cards" role="group" aria-label="Choose a treatment">
              {treatments.map((tr, i) => (
                <div className="t-card-wrap" data-reveal key={tr.id}>
                  <button
                    type="button"
                    className={`t-card${i === selected ? ' is-selected' : ''}`}
                    aria-pressed={i === selected}
                    onClick={() => select(i)}
                  >
                    <span className="t-card-num">{tr.number}</span>
                    <span className="t-card-name">{tr.name}</span>
                    <span className="t-card-short">{tr.short}</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="treat-actions">
              <p className="treat-selected" aria-hidden="true">
                <span className="dot" /> {t.name}
              </p>
              <button ref={exploreRef} type="button" className="btn btn-primary" onClick={open}>
                Explore Treatment <span aria-hidden="true">→</span>
                <span className="sr-only">: {t.name}</span>
              </button>
            </div>
            <p className="fine-print">{copy.treatments.note}</p>
            <p className="sr-only" aria-live="polite">
              {announce}
            </p>
          </div>
        </div>

        {/* ---------------- detail ---------------- */}
        <div className="view view-detail" aria-hidden={!detailOpen} inert={!detailOpen || undefined}>
          <div className="container detail-grid">
            <div className="detail-copy">
              <button type="button" className="back-link" onClick={close}>
                <span aria-hidden="true">←</span> Back to Treatments
              </button>
              <p className="eyebrow">
                Treatment {t.number} / 0{n}
              </p>
              <h2 className="display-2" tabIndex={-1} ref={detailHeadingRef}>
                {t.name}
              </h2>
              <p className="lede">{t.overview}</p>
              <div className="detail-cols">
                <div>
                  <h3 className="detail-h">What a consultation covers</h3>
                  <ul className="tick-list">
                    {t.consultation.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="detail-h">Questions to discuss with your dentist</h3>
                  <ul className="q-list">
                    {t.questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="detail-actions">
                <a
                  href="#booking"
                  className="btn btn-primary"
                  onClick={() => {
                    onBook(t.id);
                  }}
                >
                  Book an Appointment
                </a>
                <button type="button" className="btn btn-ghost" onClick={close}>
                  Back to Treatments
                </button>
              </div>
              <p className="fine-print">{brand.demoNotice}</p>
            </div>
            <figure className="detail-visual">
              <div className="slot slot-detail" data-slot="treat-detail">
                <div className="detail-fallback">
                  <TreatmentArt id={t.id} />
                </div>
              </div>
              <figcaption>
                Illustrative treatment visual<span className="sr-only">: {t.visualAlt}</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
