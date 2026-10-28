/**
 * DENTORA — central content configuration.
 *
 * Everything a clinic would edit lives here: brand, copy, treatments,
 * clinic facts, imagery and the booking endpoint. Leave a value as `null`
 * to hide it gracefully — the UI never invents a substitute.
 */

export type TreatmentId = 'general' | 'whitening' | 'aligners';

export interface Treatment {
  id: TreatmentId;
  number: string;
  name: string;
  short: string;
  overview: string;
  consultation: string[];
  questions: string[];
  /** Accessible description of the illustrative 3D object. */
  visualAlt: string;
}

export const brand = {
  name: 'Dentora',
  tagline: 'Contemporary dental studio',
  /** Shown discreetly in the hero, detail view and footer. */
  demoNotice:
    'Demonstration brand. Clinic details, clinicians and treatment information are illustrative until verified.',
};

export const nav = [
  { label: 'Treatments', href: '#treatments' },
  { label: 'Our Approach', href: '#approach' },
  { label: 'The Clinic', href: '#clinic' },
  { label: 'Contact', href: '#booking' },
];

export const copy = {
  hero: {
    eyebrow: 'Dentora · Dental studio',
    titleA: 'A little less worry.',
    titleB: 'A lot more smile.',
    body: 'Discover thoughtful dental care in a space designed to help you feel at ease.',
    primary: 'Book an Appointment',
    secondary: 'Explore Treatments',
  },
  reassure: {
    eyebrow: '01 — Breathe',
    titleA: 'Take a breath.',
    titleB: 'You’re in good company.',
    body: 'Feeling uneasy about the dentist is common. Our visits are built around unhurried conversation, so you always know what is happening and why.',
    points: [
      { title: 'We listen first', text: 'Tell us what worries you before anything begins.' },
      { title: 'We explain your options', text: 'Plain language, clear visuals, time for questions.' },
      { title: 'You choose the next step', text: 'Leave with a plan you understand — no pressure.' },
    ],
    demoTag: 'Demonstration copy — edit in src/config/site.ts',
  },
  treatments: {
    eyebrow: '02 — Treatments',
    titleA: 'Care, made',
    titleB: 'clear.',
    body: 'Three areas of care to explore. Select one to see what a first consultation usually covers.',
    note: 'Illustrative treatment information — not a diagnosis or a guarantee of suitability.',
  },
  care: {
    eyebrow: '03 — Craft',
    titleA: 'Care with a',
    titleB: 'gentler touch.',
    body: 'Warm light, soft instruments and a pace that never rushes you. Every step is explained before it happens.',
    note: 'Illustrative animation — not a depiction of a clinical procedure.',
  },
  approach: {
    eyebrow: '04 — Our approach',
    title: 'Three simple promises for every visit.',
    blocks: [
      { title: 'We listen.', text: 'Your concerns, history and goals come first. We start with a conversation, not a chair.' },
      { title: 'We explain.', text: 'We walk through what we see and what your options are, in words that make sense.' },
      { title: 'We plan together.', text: 'You decide what happens next, at a pace that feels right to you.' },
    ],
  },
  clinic: {
    eyebrow: '05 — The clinic',
    title: 'A calm space, by design.',
    body: 'Soft materials, warm light and quiet corners — a studio planned to feel more like a lounge than a waiting room.',
    imageLabel: 'Concept clinic imagery',
  },
  booking: {
    eyebrow: '06 — Appointments',
    titleA: 'Ready when',
    titleB: 'you are.',
    body: 'Share a few details and a preferred date. The clinic will contact you to arrange a time that suits you.',
    dateNote: 'A preferred date is an appointment request, not a confirmed booking.',
    demoBanner: 'Demo form — no appointment request will be sent.',
    demoSuccess: 'Demo complete. Your details were not sent and no appointment has been booked.',
  },
};

export const treatments: Treatment[] = [
  {
    id: 'general',
    number: '01',
    name: 'General Dentistry',
    short: 'Check-ups, cleaning and everyday care.',
    overview:
      'Routine visits help you and your dentist keep an eye on the health of your teeth and gums over time, and catch questions early.',
    consultation: [
      'A conversation about your dental history and any concerns',
      'An examination of teeth and gums',
      'An explanation of anything noticed, with options where relevant',
    ],
    questions: [
      'How often should I have a check-up?',
      'Is there anything in my routine I should change?',
      'What would you recommend I keep an eye on?',
    ],
    visualAlt: 'Illustration of a dental mirror and probe standing in a ceramic cup on a soft mint pedestal.',
  },
  {
    id: 'whitening',
    number: '02',
    name: 'Teeth Whitening',
    short: 'Brightening options discussed with care.',
    overview:
      'Whitening may be an option for some people. A dentist can assess whether it suits your teeth and explain the approaches available.',
    consultation: [
      'A check that teeth and gums are healthy enough to consider whitening',
      'A discussion of realistic expectations',
      'An overview of in-clinic and take-home approaches',
    ],
    questions: [
      'Is whitening suitable for me?',
      'Will it affect sensitivity?',
      'How should I care for my teeth afterwards?',
    ],
    visualAlt: 'Illustration of a small tooth surrounded by soft sparkle accents.',
  },
  {
    id: 'aligners',
    number: '03',
    name: 'Clear Aligners',
    short: 'Discreet straightening, explained step by step.',
    overview:
      'Clear aligners are removable trays that may help to move teeth gradually. Whether they are right for you depends on an assessment.',
    consultation: [
      'An assessment of your bite and tooth alignment',
      'A discussion of what aligners can and cannot address',
      'An outline of how ongoing reviews would work',
    ],
    questions: [
      'Am I a candidate for clear aligners?',
      'How many hours a day would I wear them?',
      'What happens after treatment finishes?',
    ],
    visualAlt: 'Illustration of a translucent clear aligner tray on a pale blue pedestal.',
  },
];

/**
 * Clinic facts. Every field is optional: unverified values stay `null`
 * and their rows are hidden. Do not fill these with placeholders.
 */
export const clinic: {
  address: string | null;
  phone: string | null;
  email: string | null;
  hours: string | null;
  privacyPolicyUrl: string | null;
} = {
  address: null,
  phone: null,
  email: null,
  hours: null,
  privacyPolicyUrl: null,
};

/** Image paths are relative to /public. Replace with real clinic photography. */
export const assets = {
  clinicImages: [
    { src: 'clinic-lounge.jpg', alt: 'Concept render of a calm lounge with a curved grey sofa and soft window light.' },
    { src: 'clinic-treatment-room.jpg', alt: 'Concept render of a treatment room with warm cabinetry and a glowing tooth outline on the wall.' },
  ],
  /** Optional GLB to replace the procedural mascot — see ASSETS.md. */
  toothModelUrl: null as string | null,
};

/**
 * Booking integration. `null` keeps the form in honest demo mode.
 * Set to a POST endpoint (e.g. Formspree / your API) to send requests.
 */
export const booking = {
  endpoint: null as string | null,
};
