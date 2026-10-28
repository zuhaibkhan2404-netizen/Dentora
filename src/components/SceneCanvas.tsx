import { useEffect, useRef } from 'react';
import { bus } from '../lib/bus';

export type SceneStatus = 'loading' | 'ready' | 'failed';

function webglAvailable() {
  try {
    if (new URLSearchParams(window.location.search).has('nowebgl')) return false;
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

/** Lazy-loads the 3D scene after first paint; falls back to static posters on any failure. */
export function SceneCanvas({ onStatus }: { onStatus: (s: SceneStatus) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let disposed = false;
    let scene: { start(): void; dispose(): void } | null = null;
    if (!webglAvailable()) {
      onStatus('failed');
      return;
    }
    const load = () =>
      import('../scene/DentoraScene')
        .then(({ DentoraScene }) => {
          if (disposed || !ref.current) return;
          scene = new DentoraScene(ref.current, { mobile: bus.mobile, onContextLost: () => onStatus('failed') });
          scene.start();
          if (window.location.search.includes('debug')) (window as any).__dentoraScene = scene;
          onStatus('ready');
        })
        .catch((err) => {
          console.warn('[Dentora] 3D scene unavailable, showing static artwork.', err);
          onStatus('failed');
        });
    // Let HTML, fonts and the poster paint first.
    const idle = (window as any).requestIdleCallback as undefined | ((cb: () => void, o?: object) => number);
    const handle = idle ? idle(load, { timeout: 600 }) : window.setTimeout(load, 120);
    return () => {
      disposed = true;
      if (!idle) clearTimeout(handle);
      scene?.dispose();
    };
  }, [onStatus]);

  return <canvas ref={ref} className="scene-canvas" aria-hidden="true" tabIndex={-1} />;
}
