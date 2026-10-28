/**
 * Cinematic world builders: coast, chalk cliff, the molar sea-arch portal,
 * the shard tunnel, gold instruments, dental chair and atmosphere.
 * World axis: the camera travels from +z (sea) toward −z (deep space).
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { crownGeometry, rootGeometry } from './models';

/* ---------------------------------------------------------------- noise */

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, y: number, o = 4) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < o; i++) {
    s += a * vnoise(x * f, y * f);
    f *= 2;
    a *= 0.5;
  }
  return s;
}

let seed = 7;
export const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/* ---------------------------------------------------------------- textures */

function chalkTexture(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm((x / size) * 8, (y / size) * 8, 4);
      const strata = 0.5 + 0.5 * Math.sin((y / size) * 46 + n * 5);
      let v = 0.86 + n * 0.12 - strata * 0.05;
      if (hash(x * 0.37, y * 0.91) > 0.9985) v -= 0.45; // flint specks
      const i = (y * size + x) * 4;
      img.data[i] = Math.min(255, v * 252);
      img.data[i + 1] = Math.min(255, v * 248);
      img.data[i + 2] = Math.min(255, v * 238);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function cloudTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  for (let i = 0; i < 26; i++) {
    const x = 40 + rand() * 176;
    const y = 50 + rand() * 40 - (Math.abs(x - 128) / 128) * 10;
    const r = 18 + rand() * 30;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.6, 'rgba(250,246,240,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glowTexture(inner: string, outer: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, outer);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------------------------------------------------------- materials */

export const GOLD = '#d4a84f';
export const gold = (rough = 0.28) => new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: rough });
const glowGold = (k = 2.2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0 * k, 0.78 * k, 0.42 * k), toneMapped: false });

/* ---------------------------------------------------------------- sky */

export function buildSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { uMix: { value: 0 }, uSun: { value: new THREE.Vector3(-0.35, 0.32, -1).normalize() } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uMix; uniform vec3 uSun;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 zen = vec3(0.16, 0.38, 0.70);
        vec3 hor = vec3(0.74, 0.84, 0.92);
        vec3 col = mix(hor, zen, pow(clamp(h, 0.0, 1.0), 0.5));
        col = mix(col, vec3(0.55, 0.72, 0.82), smoothstep(0.0, -0.2, h));
        col += vec3(0.25, 0.14, 0.02) * pow(max(dot(normalize(vec3(d.x, 0.0, d.z) + 1e-4), normalize(vec3(uSun.x, 0.0, uSun.z))), 0.0), 4.0) * (1.0 - clamp(h * 3.0, 0.0, 1.0));
        float s = max(dot(d, uSun), 0.0);
        col += vec3(1.0, 0.86, 0.62) * (pow(s, 300.0) * 1.6 + pow(s, 12.0) * 0.25);
        vec3 navy = vec3(0.030, 0.040, 0.095) + vec3(0.03, 0.035, 0.08) * (1.0 - abs(h));
        col = mix(pow(col, vec3(2.2)), pow(navy, vec3(2.2)), uMix);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return { mesh, mat };
}

/* ---------------------------------------------------------------- sea */

export function buildSea(mobile: boolean) {
  const geo = new THREE.PlaneGeometry(900, 360, mobile ? 120 : 220, mobile ? 60 : 110);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, 140); // z from −40 … +320
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCam: { value: new THREE.Vector3() },
      uMix: { value: 0 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vW; varying float vH; varying vec3 vN;
      void main() {
        vec3 p = position;
        float a1 = p.x * 0.07 + uTime * 0.8;
        float a2 = p.z * 0.11 - uTime * 1.25;
        float a3 = (p.x * 0.6 + p.z) * 0.23 + uTime * 1.9;
        float a4 = (p.x - p.z) * 0.5 + uTime * 2.6;
        float w = sin(a1) * 0.45 + sin(a2) * 0.55 + sin(a3) * 0.2 + sin(a4) * 0.07;
        float dx = cos(a1) * 0.45 * 0.07 + cos(a3) * 0.2 * 0.6 * 0.23 + cos(a4) * 0.07 * 0.5;
        float dz = cos(a2) * 0.55 * 0.11 + cos(a3) * 0.2 * 0.23 - cos(a4) * 0.07 * 0.5;
        float damp = 1.0 - smoothstep(-20.0, -40.0, p.z) * 0.6;
        w *= damp; dx *= damp; dz *= damp;
        p.y += w; vH = w;
        vN = normalize(vec3(-dx * 2.2, 1.0, -dz * 2.2));
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCam; uniform float uTime; uniform float uMix;
      varying vec3 vW; varying float vH; varying vec3 vN;
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(uCam - vW);
        vec3 deep = vec3(0.06, 0.33, 0.45);
        vec3 shallow = vec3(0.42, 0.82, 0.80);
        float shore = smoothstep(10.0, -38.0, vW.z);
        vec3 col = mix(deep, shallow, shore);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
        col = mix(col, vec3(0.86, 0.92, 0.97), fres * 0.55);
        vec3 sunDir = normalize(vec3(-0.35, 0.32, -1.0));
        float spec = pow(max(dot(reflect(-sunDir, n), v), 0.0), 120.0);
        col += spec * vec3(1.0, 0.9, 0.7) * 1.4;
        float foamLine = smoothstep(-33.0, -39.5, vW.z) * (0.55 + 0.45 * sin(vW.x * 0.35 + uTime * 1.6 + sin(vW.x * 0.07) * 3.0));
        float crest = smoothstep(0.65, 0.95, vH);
        col = mix(col, vec3(1.0), clamp(foamLine * 0.85 + crest * 0.35, 0.0, 1.0));
        col = pow(col, vec3(2.2));
        col = mix(col, vec3(0.002, 0.003, 0.01), uMix);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  return { mesh: new THREE.Mesh(geo, mat), mat };
}

/* ---------------------------------------------------------------- coast: beach, cliff, molar arch */

export const ARCH = { z: -60, portalY: 6.5 };

export function buildCoast(mobile: boolean) {
  const g = new THREE.Group();
  const chalkTex = chalkTexture(mobile ? 256 : 512);

  // Beach
  const beachGeo = new THREE.PlaneGeometry(900, 34, mobile ? 90 : 180, 8);
  beachGeo.rotateX(-Math.PI / 2);
  const bp = beachGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i);
    const z = bp.getZ(i);
    bp.setY(i, 0.35 + fbm(x * 0.05, z * 0.1) * 0.9 + (-z / 17) * 0.8);
  }
  beachGeo.computeVertexNormals();
  const beach = new THREE.Mesh(beachGeo, new THREE.MeshStandardMaterial({ color: '#e8d3a6', roughness: 1 }));
  beach.receiveShadow = true;
  beach.position.z = -53;
  g.add(beach);

  // Cliff faces with a gap behind the arch
  const chalkMat = (rep: number) => {
    const t = chalkTex.clone();
    t.needsUpdate = true;
    t.repeat.set(rep, 1.2);
    return new THREE.MeshStandardMaterial({ map: t, color: '#d4ccbb', roughness: 0.97 });
  };
  const face = (w: number, h: number, sx: number, sy: number, sd: number) => {
    const geo = new THREE.PlaneGeometry(w, h, Math.round(w * (mobile ? 0.6 : 1.1)), Math.round(h * (mobile ? 0.6 : 1.1)));
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + sx;
      const y = p.getY(i) + h / 2;
      let z = fbm(x * 0.045 + sd, y * 0.06, 5) * 9 + Math.abs(Math.sin(x * 0.11 + sd)) * 2.5 * (y / h);
      let yy = p.getY(i);
      if (y > h - 0.5) yy += fbm(x * 0.08 + sd, 3.1) * 5 - 1.5; // jagged crest
      p.setXYZ(i, p.getX(i), yy, z);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, chalkMat(w / 46));
    m.receiveShadow = true;
    m.castShadow = true;
    m.position.set(sx, sy + h / 2 - 1.5, 0);
    return m;
  };
  const cliff = new THREE.Group();
  const left = face(150, 50, -86, 0, 1.3);
  const right = face(150, 50, 86, 0, 4.7);
  const top = face(34, 14, 0, 38, 9.1);
  top.position.z = -3;
  const farL = face(140, 46, 0, 0, 2.2);
  farL.position.set(-210, 21.5, 50);
  farL.rotation.y = 0.62;
  const farR = face(140, 46, 0, 0, 6.2);
  farR.position.set(210, 21.5, 50);
  farR.rotation.y = -0.62;
  cliff.add(left, right, top, farL, farR);
  // grassy crest
  const grassMat = new THREE.MeshStandardMaterial({ color: '#8eaa68', roughness: 1 });
  [left, right, farL, farR].forEach((f) => {
    const gw = (f.geometry as THREE.PlaneGeometry).parameters.width;
    const grass = new THREE.Mesh(new THREE.BoxGeometry(gw, 1.6, 26), grassMat);
    grass.position.set(f.position.x, f.position.y + 25.6, f.position.z - 12);
    grass.rotation.y = f.rotation.y;
    cliff.add(grass);
  });
  cliff.position.z = ARCH.z - 4;
  g.add(cliff);

  // Molar arch
  const arch = new THREE.Group();
  const archMat = new THREE.MeshPhysicalMaterial({ map: chalkTex, color: '#fbf6ec', roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.4 });
  const crown = new THREE.Mesh(crownGeometry(mobile ? 64 : 96), archMat);
  crown.scale.set(26, 19, 15);
  crown.position.y = 32;
  arch.add(crown);
  const rg = rootGeometry(mobile ? 24 : 36);
  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(rg, archMat);
    r.scale.set(24 * s, 22, 17);
    r.position.set(12.5 * s, 32 - 0.36 * 19, -1);
    arch.add(r);
  }
  // Gold inlays studding the crown (catch the light, bloom in the sun)
  crown.updateMatrixWorld(true);
  arch.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const studGeo = new THREE.OctahedronGeometry(0.55, 0);
  const studMat = new THREE.MeshStandardMaterial({ color: '#e2b75c', metalness: 1, roughness: 0.18, emissive: '#6b4a12', emissiveIntensity: 0.6 });
  const studs = new THREE.InstancedMesh(studGeo, studMat, 46);
  const m4 = new THREE.Matrix4();
  let n = 0;
  for (let i = 0; i < 400 && n < 46; i++) {
    const x = (rand() - 0.5) * 38;
    const y = 22 + rand() * 20;
    ray.set(new THREE.Vector3(x, y, 40), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObject(crown, false)[0];
    if (!hit || hit.face!.normal.z < 0.3) continue;
    const sc = 0.5 + rand() * 0.9;
    m4.compose(hit.point.clone().add(new THREE.Vector3(0, 0, 0.1)), new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, rand() * 3)), new THREE.Vector3(sc, sc, sc));
    studs.setMatrixAt(n++, m4);
  }
  studs.count = n;
  arch.add(studs);
  // A gold band where crown meets roots
  const band = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 10, 80), gold(0.22));
  band.scale.set(18.5, 11.5, 1);
  band.rotation.x = Math.PI / 2;
  band.position.y = 20.6;
  arch.add(band);
  arch.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  arch.position.z = ARCH.z;
  g.add(arch);

  // Portal: glowing doorway + tunnel of gold rings
  const portal = new THREE.Group();
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshBasicMaterial({ map: glowTexture('rgba(255,236,190,1)', 'rgba(230,170,70,0.55)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
  );
  door.position.set(0, ARCH.portalY, ARCH.z - 9);
  portal.add(door);
  const tunnel = new THREE.Mesh(
    new THREE.CylinderGeometry(6, 6, 46, 40, 1, true),
    new THREE.MeshStandardMaterial({ color: '#141a33', roughness: 0.6, metalness: 0.4, side: THREE.BackSide }),
  );
  tunnel.rotation.x = Math.PI / 2;
  tunnel.position.set(0, ARCH.portalY, ARCH.z - 30);
  portal.add(tunnel);
  const ringMat = glowGold(2.4);
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 9; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.06, 8, 72), ringMat);
    ring.position.set(0, ARCH.portalY, ARCH.z - 10 - i * 4.6);
    portal.add(ring);
    rings.push(ring);
  }
  g.add(portal);

  // Rocks on the beach
  const rockMat = new THREE.MeshStandardMaterial({ color: '#d9d4c8', roughness: 0.95, flatShading: true });
  for (let i = 0; i < 14; i++) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + rand() * 2.4, 0), rockMat);
    const side = rand() < 0.5 ? -1 : 1;
    r.position.set(side * (22 + rand() * 90), 0.6, -44 - rand() * 12);
    r.scale.y = 0.55;
    r.rotation.set(rand(), rand() * 3, rand());
    g.add(r);
  }

  return { group: g, arch, door, rings, studs };
}

export function buildClouds() {
  const tex = cloudTexture();
  const g = new THREE.Group();
  const clouds: THREE.Sprite[] = [];
  for (let i = 0; i < 26; i++) {
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, opacity: 0.5 + rand() * 0.3 });
    const s = new THREE.Sprite(m);
    const w = 70 + rand() * 120;
    s.scale.set(w, w * 0.42, 1);
    s.position.set((rand() - 0.5) * 900, 70 + rand() * 110, -160 - rand() * 380);
    s.userData.speed = 0.6 + rand() * 1.4;
    g.add(s);
    clouds.push(s);
  }
  return { group: g, clouds };
}

/* ---------------------------------------------------------------- shard tunnel */

export const SPACE = { start: -92, end: -560, axisY: 2.5 };

export function buildShards(mobile: boolean) {
  const count = mobile ? 1100 : 2800;
  const geo = new THREE.IcosahedronGeometry(1, 0).toNonIndexed();
  geo.computeVertexNormals();
  const goldMat = new THREE.MeshStandardMaterial({ color: '#cfa354', metalness: 1, roughness: 0.32, flatShading: true });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#3a4066', metalness: 0.75, roughness: 0.38, flatShading: true });
  const goldN = Math.round(count * 0.42);
  const layers = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
  const per = [goldN, count - goldN];
  const meshes: THREE.InstancedMesh[] = [];
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  layers.forEach((layer, li) => {
    [goldMat, darkMat].forEach((mat, mi) => {
      const n = Math.round(per[mi] / layers.length);
      const im = new THREE.InstancedMesh(geo, mat, n);
      for (let i = 0; i < n; i++) {
        const z = SPACE.start - rand() * (SPACE.start - SPACE.end);
        const a = rand() * Math.PI * 2;
        const r = (li === 0 ? 8 : 10) + Math.pow(rand(), 0.8) * (li === 0 ? 12 : li === 1 ? 24 : 40);
        v.set(Math.cos(a) * r, Math.sin(a) * r, z);
        const s = (0.2 + Math.pow(rand(), 2.4) * 1.6) * (li === 2 ? 1.6 : li === 0 ? 0.7 : 1);
        sc.set(s, s * (0.08 + rand() * 0.18), s * (0.5 + rand() * 0.9));
        e.set(rand() * 6.28, rand() * 6.28, rand() * 6.28);
        q.setFromEuler(e);
        m4.compose(v, q, sc);
        im.setMatrixAt(i, m4);
      }
      im.frustumCulled = false;
      layer.add(im);
      meshes.push(im);
    });
  });
  const group = new THREE.Group();
  group.position.y = SPACE.axisY;
  layers.forEach((l) => group.add(l));

  // Gold dust
  const dustN = mobile ? 600 : 1600;
  const pos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    const a = rand() * Math.PI * 2;
    const r = 2 + rand() * 30;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.sin(a) * r;
    pos[i * 3 + 2] = SPACE.start - rand() * (SPACE.start - SPACE.end);
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(
    dg,
    new THREE.PointsMaterial({ size: 0.16, map: glowTexture('rgba(255,240,200,1)', 'rgba(255,200,100,0.5)'), color: new THREE.Color(2.2, 1.7, 1.0), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false }),
  );
  dust.frustumCulled = false;
  group.add(dust);

  return { group, layers, dust };
}

/* ---------------------------------------------------------------- gold instruments fan */

function instrument(kind: number) {
  const g = new THREE.Group();
  const mat = gold(0.22);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 6.2, 16), mat);
  handle.position.y = 3.1;
  g.add(handle);
  for (let i = 0; i < 5; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 6, 18), mat);
    r.rotation.x = Math.PI / 2;
    r.position.y = 1.4 + i * 0.22;
    g.add(r);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 1.2, 12), mat);
  neck.position.y = 6.8;
  g.add(neck);
  const tipY = 7.4;
  if (kind === 0) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 10, 36), mat);
    rim.position.y = tipY + 0.4;
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.41, 36), new THREE.MeshStandardMaterial({ color: '#f3ead6', metalness: 1, roughness: 0.04 }));
    glass.position.y = tipY + 0.4;
    g.add(rim, glass);
  } else {
    const pts =
      kind === 1
        ? [new THREE.Vector3(0, tipY - 0.2, 0), new THREE.Vector3(0, tipY + 0.6, 0), new THREE.Vector3(0.18, tipY + 0.9, 0), new THREE.Vector3(0.34, tipY + 0.8, 0)]
        : kind === 2
          ? [new THREE.Vector3(0, tipY - 0.2, 0), new THREE.Vector3(-0.1, tipY + 0.7, 0), new THREE.Vector3(-0.42, tipY + 1.0, 0), new THREE.Vector3(-0.52, tipY + 0.7, 0)]
          : [new THREE.Vector3(0, tipY - 0.2, 0), new THREE.Vector3(0.05, tipY + 1.1, 0)];
    const tip = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.035, 8), mat);
    g.add(tip);
    if (kind === 3) {
      const spoon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat);
      spoon.scale.set(1, 0.5, 1);
      spoon.position.y = tipY + 1.15;
      g.add(spoon);
    }
  }
  return g;
}

export function buildInstrumentFan() {
  const g = new THREE.Group();
  const items: THREE.Group[] = [];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const it = instrument(i % 4);
    it.userData.i = i;
    it.position.z = (i % 2) * 0.25;
    g.add(it);
    items.push(it);
  }
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), glowGold(1.6));
  g.add(hub);
  const light = new THREE.PointLight('#ffd08a', 60, 30, 1.6);
  light.position.set(0, 4, 3);
  g.add(light);
  return { group: g, items };
}

/* ---------------------------------------------------------------- dental chair */

export function buildDentalChair() {
  const g = new THREE.Group();
  const ivory = new THREE.MeshPhysicalMaterial({ color: '#efe7da', roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const cushion = new THREE.MeshPhysicalMaterial({ color: '#f6efe3', roughness: 0.6, sheen: 0.6, sheenColor: new THREE.Color('#ffffff') });
  const g8 = gold(0.25);
  const rb = (w: number, h: number, d: number, r: number, m: THREE.Material) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 5, r), m);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 0.35, 48), ivory);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.8, 32), g8);
  column.position.y = 1.0;
  const seat = rb(2.0, 0.45, 2.4, 0.2, cushion);
  seat.position.set(0, 2.1, 0);
  const back = rb(2.0, 0.42, 3.0, 0.2, cushion);
  back.position.set(0, 3.0, -2.2);
  back.rotation.x = -0.75;
  const head = rb(1.1, 0.35, 0.9, 0.16, cushion);
  head.position.set(0, 4.25, -3.55);
  head.rotation.x = -0.55;
  const legs = rb(1.8, 0.4, 2.6, 0.18, cushion);
  legs.position.set(0, 1.75, 2.3);
  legs.rotation.x = 0.35;
  const shell = rb(2.2, 0.25, 6.8, 0.12, ivory);
  shell.position.set(0, 1.85, 0);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.05, 8, 64), g8);
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 0.2;
  const arm = rb(0.3, 0.25, 1.8, 0.1, ivory);
  arm.position.set(1.2, 2.6, 0.3);
  // overhead light on a gold arm
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.6, 16), g8);
  pole.position.set(-1.5, 3.2, -1.2);
  const boom = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-1.5, 5.5, -1.2), new THREE.Vector3(-0.8, 6.4, 0.2), new THREE.Vector3(0.2, 6.0, 1.2)]), 32, 0.07, 10), g8);
  const lamp = rb(1.2, 0.35, 0.7, 0.15, ivory);
  lamp.position.set(0.25, 5.75, 1.35);
  lamp.rotation.x = 0.6;
  const lampFace = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), glowGold(2.0));
  lampFace.position.set(0.25, 5.58, 1.47);
  lampFace.rotation.x = Math.PI / 2 + 0.6;
  // tray arm
  const tray = rb(1.4, 0.12, 0.9, 0.06, ivory);
  tray.position.set(1.9, 3.3, 1.6);
  const trayArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 12), g8);
  trayArm.position.set(1.9, 2.0, 1.6);
  g.add(base, column, shell, seat, back, head, legs, trim, arm, pole, boom, lamp, lampFace, tray, trayArm);
  const spot = new THREE.PointLight('#ffe2b0', 40, 14, 1.5);
  spot.position.set(0.2, 5.2, 1.6);
  g.add(spot);
  return g;
}
