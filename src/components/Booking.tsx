import { useRef, useState, type FormEvent } from 'react';
import { booking, copy, treatments } from '../config/site';
import { BookingPoster } from './Art';

type Errors = Partial<Record<'name' | 'email' | 'treatment' | 'date', string>>;

/** Today's date in the visitor's local time zone, formatted YYYY-MM-DD. */
function localToday() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Booking({ treatment, onTreatment }: { treatment: string; onTreatment: (v: string) => void }) {
  const demo = !booking.endpoint;
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<{ kind: 'idle' | 'sending' | 'demo' | 'sent' | 'error' | 'invalid'; msg: string }>({ kind: 'idle', msg: '' });
  const today = localToday();

  const validate = (fd: FormData): Errors => {
    const e: Errors = {};
    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const date = String(fd.get('date') || '');
    if (!name) e.name = 'Please enter your name.';
    if (!email) e.email = 'Please enter your email address.';
    else if (!EMAIL.test(email)) e.email = 'Please enter a valid email address, like name@example.com.';
    if (!fd.get('treatment')) e.treatment = 'Please choose a treatment, or “Not sure yet”.';
    if (!date) e.date = 'Please choose a preferred date.';
    else if (date < today) e.date = 'Please choose today or a future date.';
    return e;
  };

  const onSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const fd = new FormData(form);
    const e = validate(fd);
    setErrors(e);
    const keys = Object.keys(e);
    if (keys.length) {
      setStatus({ kind: 'invalid', msg: `Please check ${keys.length === 1 ? '1 field' : `${keys.length} fields`} highlighted below.` });
      form.querySelector<HTMLElement>(`[name="${keys[0]}"]`)?.focus();
      return;
    }
    if (demo) {
      setStatus({ kind: 'demo', msg: copy.booking.demoSuccess });
      return;
    }
    try {
      setStatus({ kind: 'sending', msg: 'Sending your request…' });
      const res = await fetch(booking.endpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus({ kind: 'sent', msg: 'Request received. The clinic will contact you to arrange a time — this is not yet a confirmed appointment.' });
      form.reset();
    } catch {
      setStatus({ kind: 'error', msg: 'Sorry, your request could not be sent. Please try again later.' });
    }
  };

  const field = (name: keyof Errors) => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
    onInput: () => errors[name] && setErrors((x) => ({ ...x, [name]: undefined })),
  });

  return (
    <section id="booking" className="section booking" data-station="7" aria-labelledby="booking-title">
      <div className="container booking-grid">
        <div className="booking-visual">
          <div className="slot slot-booking" data-slot="booking" aria-hidden="true">
            <div className="slot-art">
              <BookingPoster />
            </div>
          </div>
        </div>
        <div className="booking-panel glass-dark" data-reveal-group>
          <p className="eyebrow" data-reveal>
            {copy.booking.eyebrow}
          </p>
          <h2 id="booking-title" className="display-2" data-reveal>
            {copy.booking.titleA} <em>{copy.booking.titleB}</em>
          </h2>
          <p className="lede" data-reveal>
            {copy.booking.body}
          </p>

          {demo && (
            <p className="demo-banner" data-reveal>
              <span aria-hidden="true">◌</span> {copy.booking.demoBanner}
            </p>
          )}

          <form ref={formRef} className="form" noValidate onSubmit={onSubmit} data-reveal>
            <div className="form-row">
              <div className="field">
                <label htmlFor="f-name">
                  Name <span className="req">(required)</span>
                </label>
                <input id="f-name" name="name" autoComplete="name" required {...field('name')} />
                {errors.name && (
                  <p className="err" id="name-error">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="field">
                <label htmlFor="f-email">
                  Email <span className="req">(required)</span>
                </label>
                <input id="f-email" name="email" type="email" autoComplete="email" required {...field('email')} />
                {errors.email && (
                  <p className="err" id="email-error">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="f-phone">
                  Phone <span className="opt">(optional)</span>
                </label>
                <input id="f-phone" name="phone" type="tel" autoComplete="tel" />
              </div>
              <div className="field">
                <label htmlFor="f-treatment">
                  Treatment <span className="req">(required)</span>
                </label>
                <select
                  id="f-treatment"
                  name="treatment"
                  required
                  value={treatment}
                  onChange={(e) => {
                    onTreatment(e.target.value);
                    errors.treatment && setErrors((x) => ({ ...x, treatment: undefined }));
                  }}
                  {...field('treatment')}
                >
                  <option value="">Select a treatment</option>
                  {treatments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                  <option value="not-sure">Not sure yet</option>
                </select>
                {errors.treatment && (
                  <p className="err" id="treatment-error">
                    {errors.treatment}
                  </p>
                )}
              </div>
            </div>
            <div className="field">
              <label htmlFor="f-date">
                Preferred appointment date <span className="req">(required)</span>
              </label>
              <input id="f-date" name="date" type="date" min={today} required {...field('date')} aria-describedby={errors.date ? 'date-error date-note' : 'date-note'} />
              <p className="hint" id="date-note">
                {copy.booking.dateNote}
              </p>
              {errors.date && (
                <p className="err" id="date-error">
                  {errors.date}
                </p>
              )}
            </div>
            <div className="field">
              <label htmlFor="f-msg">
                Message <span className="opt">(optional)</span>
              </label>
              <textarea id="f-msg" name="message" rows={3} />
            </div>
            <div className="form-foot">
              <button type="submit" className="btn btn-primary" disabled={status.kind === 'sending'}>
                {demo ? 'Request appointment (demo)' : 'Request appointment'}
              </button>
            </div>
            <div className={`form-status is-${status.kind}`} role={status.kind === 'invalid' || status.kind === 'error' ? 'alert' : 'status'} aria-live="polite">
              {status.msg}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
