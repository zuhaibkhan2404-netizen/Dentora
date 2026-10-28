import { useCallback, useEffect, useRef, useState } from 'react';
import { assets, brand, clinic, copy, nav } from './config/site';
import { initEnvironmentFlags } from './lib/bus';
import { initReveals } from './lib/story';
import { SceneCanvas, type SceneStatus } from './components/SceneCanvas';
import { Treatments } from './components/Treatments';
import { Booking } from './components/Booking';
import { ApproachIcon, Wordmark } from './components/Art';

function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="nav-inner">
        <a href="#top" className="nav-brand" aria-label={`${brand.name} — home`}>
          <Wordmark />
        </a>
        <nav aria-label="Primary" className="nav-links">
          {nav.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <a href="#booking" className="btn btn-gold btn-sm nav-cta">
          Book an Appointment
        </a>
        <button ref={btnRef} type="button" className="nav-toggle" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}>
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <span className="burger" aria-hidden="true" />
        </button>
      </div>
      <div id="mobile-menu" ref={panelRef} className="mobile-menu" hidden={!open}>
        <nav aria-label="Mobile">
          {nav.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="#booking" className="btn btn-gold" onClick={() => setOpen(false)}>
            Book an Appointment
          </a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const h = copy.hero;
  return (
    <section id="top" className="section hero" data-station="0" aria-labelledby="hero-title">
      <div className="container hero-inner">
        <p className="eyebrow">{h.eyebrow}</p>
        <h1 id="hero-title" className="display-1">
          <span className="line">{h.titleA}</span>
          <span className="line">
            <em>{h.titleB}</em>
          </span>
        </h1>
        <p className="lede">{h.body}</p>
        <div className="cta-row">
          <a href="#booking" className="btn btn-primary">
            {h.primary}
          </a>
          <a href="#treatments" className="btn btn-ghost">
            {h.secondary}
          </a>
        </div>
        <p className="demo-chip">Demonstration brand · sample content</p>
      </div>
      <a href="#reassure" className="scroll-cue">
        <span>Scroll to step inside</span>
        <span aria-hidden="true" className="scroll-cue-line" />
      </a>
    </section>
  );
}

function Reassure() {
  const r = copy.reassure;
  return (
    <section id="reassure" className="section reassure" data-station="1" aria-labelledby="reassure-title">
      <div className="container sticky-wrap">
        <div className="panel panel-light" data-reveal-group>
          <p className="eyebrow" data-reveal>
            {r.eyebrow}
          </p>
          <h2 id="reassure-title" className="display-2" data-reveal>
            {r.titleA}
            <br />
            <em>{r.titleB}</em>
          </h2>
          <p className="lede" data-reveal>
            {r.body}
          </p>
          <ul className="points">
            {r.points.map((p) => (
              <li key={p.title} data-reveal>
                <strong>{p.title}</strong>
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
          <p className="fine-print" data-reveal>
            {r.demoTag}
          </p>
        </div>
      </div>
    </section>
  );
}

function Portal() {
  return (
    <section id="portal" className="section portal" data-station="2" aria-label="Step inside">
      <div className="sticky-wrap portal-inner">
        <p className="portal-kicker">The molar arch · Dentora</p>
        <p className="portal-title">
          Step <em>inside.</em>
        </p>
      </div>
    </section>
  );
}

function Care() {
  const c = copy.care;
  return (
    <section id="care" className="section care" data-station="3" aria-labelledby="care-title">
      <div className="container sticky-wrap">
        <div className="care-copy" data-reveal-group>
          <p className="eyebrow" data-reveal>
            {c.eyebrow}
          </p>
          <h2 id="care-title" className="display-2" data-reveal>
            {c.titleA}
            <br />
            <em>{c.titleB}</em>
          </h2>
          <p className="lede" data-reveal>
            {c.body}
          </p>
          <a href="#booking" className="btn btn-gold" data-reveal>
            Book an Appointment
          </a>
          <p className="fine-print" data-reveal>
            {c.note}
          </p>
        </div>
      </div>
    </section>
  );
}

function Approach() {
  const a = copy.approach;
  return (
    <section id="approach" className="section approach" data-station="5" aria-labelledby="approach-title">
      <div className="container">
        <div className="approach-head" data-reveal-group>
          <p className="eyebrow" data-reveal>
            {a.eyebrow}
          </p>
          <h2 id="approach-title" className="display-2" data-reveal>
            {a.title}
          </h2>
        </div>
        <ol className="approach-list" data-reveal-group="cards">
          {a.blocks.map((b, i) => (
            <li key={b.title} className="glass-card" data-reveal>
              <ApproachIcon i={i} />
              <span className="approach-num">Step {i + 1}</span>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Clinic() {
  const c = copy.clinic;
  const facts = [
    { label: 'Address', value: clinic.address },
    { label: 'Opening hours', value: clinic.hours },
    { label: 'Phone', value: clinic.phone },
    { label: 'Email', value: clinic.email },
  ].filter((f) => f.value);
  return (
    <section id="clinic" className="section clinic" data-station="6" aria-labelledby="clinic-title">
      <div className="container clinic-grid">
        <div className="clinic-copy" data-reveal-group>
          <p className="eyebrow" data-reveal>
            {c.eyebrow}
          </p>
          <h2 id="clinic-title" className="display-2" data-reveal>
            {c.title}
          </h2>
          <p className="lede" data-reveal>
            {c.body}
          </p>
          {facts.length > 0 ? (
            <dl className="facts" data-reveal>
              {facts.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="fine-print" data-reveal>
              Address, opening hours and contact details will appear here once verified.
            </p>
          )}
        </div>
        <div className="clinic-images" data-reveal-group="cards">
          {assets.clinicImages.map((img, i) => (
            <figure key={img.src} className={`clinic-fig clinic-fig--${i}`} data-reveal>
              <img src={img.src} alt={img.alt} loading="lazy" decoding="async" />
              <figcaption>{c.imageLabel}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Wordmark />
          <p className="footer-tag">{brand.tagline}</p>
        </div>
        <nav aria-label="Footer">
          {nav.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
          <a href="#booking">Book an Appointment</a>
          {clinic.privacyPolicyUrl && <a href={clinic.privacyPolicyUrl}>Privacy policy</a>}
        </nav>
      </div>
      <div className="container footer-bottom">
        <p>{brand.demoNotice}</p>
        <p>
          © {new Date().getFullYear()} {brand.name} (demonstration)
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  const [status, setStatus] = useState<SceneStatus>('loading');
  const [selected, setSelected] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [bookingTreatment, setBookingTreatment] = useState('');
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const offEnv = initEnvironmentFlags();
    const offReveal = mainRef.current ? initReveals(mainRef.current) : () => {};
    document.documentElement.dataset.world = 'coast';
    return () => {
      offReveal();
      offEnv();
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.webgl = status;
    // Without WebGL the page uses its dark navy look throughout.
    if (status === 'failed') document.documentElement.dataset.world = 'space';
  }, [status]);

  const onStatus = useCallback((s: SceneStatus) => setStatus(s), []);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="fallback-bg" aria-hidden="true" />
      <SceneCanvas onStatus={onStatus} />
      <div className="vignette" aria-hidden="true" />
      <div className="flash" aria-hidden="true" />
      <Nav />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Hero />
        <Reassure />
        <Portal />
        <Care />
        <Treatments selected={selected} onSelect={setSelected} detailOpen={detailOpen} onDetail={setDetailOpen} onBook={(id) => setBookingTreatment(id)} />
        <Approach />
        <Clinic />
        <Booking treatment={bookingTreatment} onTreatment={setBookingTreatment} />
      </main>
      <Footer />
      {status === 'failed' && <p className="sr-only">Interactive 3D is unavailable; a static background is shown instead.</p>}
    </>
  );
}
