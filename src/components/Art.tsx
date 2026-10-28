/**
 * Static SVG artwork. Used as the hero poster while WebGL loads and as the
 * polished fallback when WebGL is unavailable.
 */
import { useId } from 'react';
import type { TreatmentId } from '../config/site';

const TOOTH_PATH =
  'M100 30 C80 13 40 13 33 52 C27 88 43 112 51 128 C57 150 55 190 65 214 C71 229 86 227 88 210 C91 186 92 166 100 160 C108 166 109 186 112 210 C114 227 129 229 135 214 C145 190 143 150 149 128 C157 112 173 88 167 52 C160 13 120 13 100 30 Z';

export function ToothFigure({ mood = 'happy', x = 0, y = 0, scale = 1 }: { mood?: 'happy' | 'calm'; x?: number; y?: number; scale?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <radialGradient id={`en${id}`} cx="38%" cy="28%" r="78%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f8f1e4" />
          <stop offset="1" stopColor="#e7d9c1" />
        </radialGradient>
      </defs>
      <path d={TOOTH_PATH} fill={`url(#en${id})`} stroke="#e4d5bb" strokeWidth="1.2" />
      <ellipse cx="66" cy="66" rx="16" ry="9" fill="#fff" opacity="0.7" transform="rotate(-25 66 66)" />
      {mood === 'happy' ? (
        <>
          <ellipse cx="80" cy="76" rx="6.5" ry="9" fill="#1e2224" />
          <ellipse cx="120" cy="76" rx="6.5" ry="9" fill="#1e2224" />
          <circle cx="82.5" cy="72" r="2.2" fill="#fff" />
          <circle cx="122.5" cy="72" r="2.2" fill="#fff" />
        </>
      ) : (
        <>
          <path d="M73 78 Q80 83 87 78" stroke="#1e2224" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <path d="M113 78 Q120 83 127 78" stroke="#1e2224" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        </>
      )}
      <ellipse cx="64" cy="95" rx="9" ry="5" fill="#f1b79f" opacity="0.45" />
      <ellipse cx="136" cy="95" rx="9" ry="5" fill="#f1b79f" opacity="0.45" />
      <path d="M89 98 Q100 109 111 98" stroke="#1e2224" strokeWidth="3.4" fill="none" strokeLinecap="round" />
    </g>
  );
}

export function HeroPoster() {
  return (
    <svg viewBox="0 0 320 300" role="img" aria-label="Illustration of the Dentora tooth character sitting in a mint armchair" className="art">
      <ellipse cx="160" cy="286" rx="132" ry="9" fill="#1d3a30" opacity="0.12" />
      <rect x="62" y="84" width="196" height="150" rx="34" fill="#8fcdb9" />
      <rect x="34" y="150" width="54" height="118" rx="24" fill="#86c6b1" />
      <rect x="232" y="150" width="54" height="118" rx="24" fill="#86c6b1" />
      <ToothFigure x={92} y={16} scale={0.68} />
      <rect x="66" y="196" width="188" height="52" rx="22" fill="#9ad4c1" />
      <rect x="40" y="236" width="240" height="40" rx="16" fill="#5fae98" />
      <rect x="62" y="274" width="8" height="12" rx="3" fill="#d9c7a8" />
      <rect x="250" y="274" width="8" height="12" rx="3" fill="#d9c7a8" />
    </svg>
  );
}

export function CalmPoster() {
  return (
    <svg viewBox="0 0 220 280" role="img" aria-label="Illustration of the tooth character with eyes closed, taking a calm breath" className="art">
      <ellipse cx="110" cy="266" rx="70" ry="7" fill="#1d3a30" opacity="0.1" />
      <ToothFigure mood="calm" x={10} y={18} scale={1} />
    </svg>
  );
}

export function CarePoster() {
  return (
    <svg viewBox="0 0 360 300" role="img" aria-label="Illustration of the tooth character between a toothbrush and a dental mirror" className="art">
      <g transform="rotate(-20 60 170)">
        <rect x="52" y="120" width="14" height="170" rx="7" fill="#f1b79f" />
        <rect x="48" y="70" width="22" height="58" rx="8" fill="#fff8f1" />
        <rect x="68" y="76" width="10" height="46" rx="4" fill="#bfe5d5" />
      </g>
      <ToothFigure mood="calm" x={80} y={20} scale={1} />
      <g transform="rotate(22 300 170)">
        <rect x="296" y="120" width="9" height="170" rx="4.5" fill="#c8cdd1" />
        <circle cx="300" cy="96" r="28" fill="#e6eef0" stroke="#c8cdd1" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function BookingPoster() {
  return (
    <svg viewBox="0 0 240 320" role="img" aria-label="Illustration of the tooth character smiling on a mint pedestal" className="art">
      <ellipse cx="120" cy="306" rx="96" ry="8" fill="#1d3a30" opacity="0.12" />
      <rect x="28" y="256" width="184" height="46" rx="16" fill="#cfe9de" />
      <rect x="28" y="252" width="184" height="10" rx="5" fill="#fffaf2" />
      <ToothFigure x={20} y={12} scale={1} />
    </svg>
  );
}

export function TreatmentArt({ id }: { id: TreatmentId }) {
  return (
    <svg viewBox="0 0 200 200" className="art" aria-hidden="true">
      <ellipse cx="100" cy="186" rx="70" ry="6" fill="#1d3a30" opacity="0.1" />
      <rect
        x="30"
        y="150"
        width="140"
        height="32"
        rx="12"
        fill={id === 'general' ? '#cfe9de' : id === 'whitening' ? '#f6dccd' : '#d7e7ef'}
      />
      {id === 'general' && (
        <g>
          <g transform="rotate(-14 90 100)">
            <rect x="86" y="70" width="8" height="78" rx="4" fill="#c8cdd1" />
            <circle cx="90" cy="52" r="22" fill="#e6eef0" stroke="#c8cdd1" strokeWidth="5" />
          </g>
          <g transform="rotate(16 120 100)">
            <rect x="116" y="96" width="9" height="52" rx="4" fill="#a8d8c6" />
            <path d="M120 96 V50 Q120 40 130 40" stroke="#c8cdd1" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        </g>
      )}
      {id === 'whitening' && (
        <g>
          <ToothFigure x={58} y={30} scale={0.42} />
          <path d="M150 40 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" fill="#f2cf9c" />
          <path d="M44 70 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#f2cf9c" />
        </g>
      )}
      {id === 'aligners' && (
        <g>
          <path d="M48 120 Q48 56 100 56 Q152 56 152 120" stroke="#cfe6ef" strokeWidth="26" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M48 120 Q48 56 100 56 Q152 56 152 120" stroke="#fbf6ec" strokeWidth="12" strokeDasharray="14 5" fill="none" />
        </g>
      )}
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <svg viewBox="0 0 200 240" aria-hidden="true" className="wordmark-glyph">
        <path d={TOOTH_PATH} fill="currentColor" />
      </svg>
      <span>Dentora</span>
    </span>
  );
}

export function ApproachIcon({ i }: { i: number }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 64 64" className="approach-icon" aria-hidden="true">
      {i === 0 && (
        <>
          <path {...common} d="M24 44c-6-4-8-10-8-16a16 16 0 0 1 32 0c0 8-8 9-8 16a6 6 0 0 1-10 4" />
          <path {...common} d="M44 22c4 2 6 6 6 10M50 16c6 4 9 10 9 16" opacity="0.5" />
        </>
      )}
      {i === 1 && (
        <>
          <path {...common} d="M12 14h40a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H30l-10 9v-9h-8a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z" />
          <path {...common} d="M20 25h24M20 32h16" opacity="0.5" />
        </>
      )}
      {i === 2 && (
        <>
          <circle {...common} cx="14" cy="46" r="5" />
          <circle {...common} cx="32" cy="24" r="5" />
          <circle {...common} cx="50" cy="40" r="5" />
          <path {...common} d="M18 42l10-14M36 27l10 10" strokeDasharray="3 4" />
        </>
      )}
    </svg>
  );
}
