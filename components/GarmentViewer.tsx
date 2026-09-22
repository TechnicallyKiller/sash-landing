'use client';

/* Loads a .glb garment from /public, reads its slot map, and draws every
   buyable slot as a dashed rectangle you can click, mark and take. */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  GARMENTS,
  GARMENT_ORDER,
  LISTINGS,
  type GarmentId,
  type Listing,
  type SlotDoc,
} from '@/lib/inventory';
import { useAsking } from './AskingContext';

const ORANGE = '#FF4D00';
const ACID = '#E4FF00';
const INK = '#111111';

const COLORS = [
  { hex: '#f2f2f2', name: 'Bone' },
  { hex: '#1b1b1b', name: 'Black' },
  { hex: '#E4FF00', name: 'Acid' },
  { hex: '#FF4D00', name: 'Orange' },
];

type PlateState = 'idle' | 'hover' | 'selected';

type SlotData = {
  slotId: string;
  label: string;
  listing: Listing;
  aspect: number;
  mark: string;
  map: THREE.CanvasTexture | null;
  state: PlateState;
};

type SlotMesh = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> & { userData: SlotData };

type CardInfo = {
  slotId: string;
  label: string;
  cat: string;
  price: string;
  why: string;
  buyer?: string;
  mark: string;
};

/* Artwork already printed on a slot (the Sash logo on the tee chest, say).
   Cached per source so switching garments never refetches it. */
const artCache = new Map<string, HTMLImageElement>();

function loadArt(src: string): Promise<HTMLImageElement | null> {
  const cached = artCache.get(src);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      artCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => resolve(null); // a missing print should not break the garment
    img.src = src;
  });
}

/* Draws one slot plate onto a canvas: a printed panel when the slot is taken,
   a dashed frame when it is open, plus a highlight while hovered or selected. */
function plateTexture(opts: {
  base: 'open' | 'sold' | 'marked' | 'art';
  state: PlateState;
  text: string;
  art: HTMLImageElement | null;
  aspect: number;
}) {
  const { base, state, text, art, aspect } = opts;
  const long = 512;
  const w = aspect >= 1 ? long : Math.round(long * aspect);
  const h = aspect >= 1 ? Math.round(long / aspect) : long;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, w, h);

  const pad = Math.round(Math.min(w, h) * 0.06);
  const lw = Math.max(6, Math.round(Math.min(w, h) * 0.045));
  const inner = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 };

  if (base === 'art' && art) {
    // A real print: a paper-white panel cut to the artwork's own shape, so a wide
    // logo does not sit in a square of blank white, and it reads on any colourway.
    const margin = Math.min(inner.w, inner.h) * 0.08;
    const scale = Math.min((inner.w - margin * 2) / art.width, (inner.h - margin * 2) / art.height);
    const dw = art.width * scale;
    const dh = art.height * scale;
    const bleed = Math.min(dw, dh) * 0.14;
    const panel = {
      x: inner.x + (inner.w - dw) / 2 - bleed,
      y: inner.y + (inner.h - dh) / 2 - bleed,
      w: dw + bleed * 2,
      h: dh + bleed * 2,
    };

    g.fillStyle = '#ffffff';
    g.fillRect(panel.x, panel.y, panel.w, panel.h);
    g.drawImage(art, inner.x + (inner.w - dw) / 2, inner.y + (inner.h - dh) / 2, dw, dh);
    g.strokeStyle = INK;
    g.lineWidth = Math.max(3, lw * 0.35);
    g.strokeRect(panel.x, panel.y, panel.w, panel.h);
  } else if (base === 'sold' || base === 'marked' || base === 'art') {
    g.fillStyle = base === 'marked' ? ACID : INK;
    g.fillRect(inner.x, inner.y, inner.w, inner.h);
    g.fillStyle = base === 'marked' ? INK : '#ffffff';
    const size = Math.round(Math.min(w, h) * (text.length > 2 ? 0.34 : 0.52));
    g.font = `900 ${size}px Archivo, "Arial Black", sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + size * 0.04);
  } else {
    if (state !== 'idle') {
      g.fillStyle = state === 'selected' ? 'rgba(255,77,0,0.26)' : 'rgba(228,255,0,0.30)';
      g.fillRect(inner.x, inner.y, inner.w, inner.h);
    }
    g.strokeStyle = ORANGE;
    g.lineWidth = lw;
    g.setLineDash([lw * 2.4, lw * 1.6]);
    g.strokeRect(pad + lw / 2, pad + lw / 2, inner.w - lw, inner.h - lw);
  }

  // Taken slots get a solid ring instead of a tint, so the print stays readable.
  if (base !== 'open' && state !== 'idle') {
    g.setLineDash([]);
    g.strokeStyle = ORANGE;
    g.lineWidth = lw;
    g.strokeRect(pad + lw / 2, pad + lw / 2, inner.w - lw, inner.h - lw);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function paint(mesh: SlotMesh, state: PlateState) {
  const d = mesh.userData;
  const art = d.listing.art ? artCache.get(d.listing.art) ?? null : null;
  const base: 'open' | 'sold' | 'marked' | 'art' = d.mark
    ? 'marked'
    : art
      ? 'art'
      : d.listing.buyer
        ? 'sold'
        : 'open';

  d.map?.dispose();
  d.map = plateTexture({
    base,
    state,
    text: d.mark || d.listing.buyer?.charAt(0) || '',
    art,
    aspect: d.aspect,
  });
  mesh.material.map = d.map;
  mesh.material.needsUpdate = true;
  mesh.scale.setScalar(state === 'idle' ? 1 : 1.07);
  d.state = state;
}

/* Distance at which a sphere of `radius` fits the frame, honouring BOTH axes.
   On a narrow portrait viewport the horizontal field of view is the tighter of
   the two, so fitting to the vertical one alone clips a wide garment. */
function fitDistance(camera: THREE.PerspectiveCamera, radius: number) {
  const vFov = (camera.fov * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  return Math.max(radius / Math.sin(vFov / 2), radius / Math.sin(hFov / 2)) * 1.12;
}

export type ViewerProps = {
  /** Which garments to offer as tabs. Defaults to all three. */
  garments?: GarmentId[];
  /** Override the slot map per garment, e.g. the founders maps with every slot on them. */
  slotSources?: Partial<Record<GarmentId, string>>;
  /** Override the per-slot copy. Falls back to LISTINGS. */
  listings?: Partial<Record<GarmentId, Record<string, Listing>>>;
  /** 'price' prints the number, 'ask' replaces it with a call to enquire. */
  priceMode?: 'price' | 'ask';
  /** Label on the card's primary button. */
  ctaLabel?: string;
  /** Start on this colourway. */
  initialColor?: string;
  /** Called instead of the default early-access hand-off. */
  onTake?: (detail: { garment: GarmentId; slotId: string; label: string; price: string }) => void;
};

export default function GarmentViewer({
  garments: garmentIds = GARMENT_ORDER,
  slotSources,
  listings: listingOverrides,
  priceMode = 'price',
  ctaLabel,
  initialColor = '#1b1b1b',
  onTake,
}: ViewerProps = {}) {
  const { setAsking, goToAccess } = useAsking();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [garment, setGarment] = useState<GarmentId>(garmentIds[0]);
  const [color, setColor] = useState(initialColor);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState(`Loading the ${GARMENTS[garmentIds[0]].label.toLowerCase()}…`);
  const [card, setCard] = useState<CardInfo | null>(null);
  const [markDraft, setMarkDraft] = useState('');

  const api = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    garmentRoot: THREE.Group;
    markerRoot: THREE.Group;
    selected: SlotMesh | null;
    hovered: SlotMesh | null;
    pointerInside: boolean;
    fit: { center: THREE.Vector3; radius: number; lift: number } | null;
  } | null>(null);

  /* ---- scene, built once ------------------------------------------------ */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.75 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
    camera.position.set(0, 0.6, 2);

    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(1.4, 2.2, 2.4);
    const fill = new THREE.DirectionalLight(0xffffff, 0.7);
    fill.position.set(-2, 1, -1.6);
    scene.add(key, fill, new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 0.5));

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = false; // the page keeps the wheel
    controls.minPolarAngle = 0.45;
    controls.maxPolarAngle = Math.PI - 0.55;
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 0.7;
    controls.addEventListener('start', () => {
      controls.autoRotate = false;
    });

    const garmentRoot = new THREE.Group();
    const markerRoot = new THREE.Group();
    scene.add(garmentRoot, markerRoot);

    api.current = {
      scene, camera, renderer, controls, garmentRoot, markerRoot,
      selected: null, hovered: null, pointerInside: false, fit: null,
    };

    const resize = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      // Keep the garment framed when the viewport changes shape (phone rotation,
      // browser chrome sliding away), without throwing away the user's orbit.
      const fit = api.current?.fit;
      if (fit) {
        const dir = camera.position.clone().sub(controls.target).normalize();
        controls.target.copy(fit.center);
        camera.position.copy(fit.center).addScaledVector(dir, fitDistance(camera, fit.radius));
        camera.position.y += fit.lift;
        camera.updateProjectionMatrix();
        controls.update();
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    let visible = true;
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    }, { threshold: 0 });
    io.observe(wrap);

    renderer.setAnimationLoop(() => {
      if (!visible) return;
      const s = api.current!;
      controls.autoRotate = controls.autoRotate && !s.pointerInside && !s.selected;
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      pmrem.dispose();
      renderer.dispose();
      api.current = null;
    };
  }, []);

  /* ---- load the chosen garment ----------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    const g = GARMENTS[garment];
    setStatus('loading');
    setMessage(`Loading the ${g.label.toLowerCase()}…`);
    setCard(null);

    const run = async () => {
      try {
        const [slotDoc, gltf] = await Promise.all([
          fetch(slotSources?.[garment] ?? g.slots).then((r) => {
            if (!r.ok) throw new Error(`${r.status} on ${slotSources?.[garment] ?? g.slots}`);
            return r.json() as Promise<SlotDoc>;
          }),
          new GLTFLoader().loadAsync(g.model),
        ]);
        if (cancelled || !api.current) return;

        // Pull in any artwork already printed on this garment's slots.
        const listings = listingOverrides?.[garment] ?? LISTINGS[garment];
        await Promise.all(
          [...new Set(Object.values(listings).map((l) => l.art).filter(Boolean) as string[])].map(loadArt),
        );
        if (cancelled || !api.current) return;

        const s = api.current;
        s.selected = null;
        s.hovered = null;
        s.garmentRoot.clear();
        s.markerRoot.clear();
        s.garmentRoot.add(gltf.scene);

        // slot plates
        for (const slot of slotDoc.slots) {
          const listing: Listing = listings[slot.id] ?? {
            cat: 'Surface',
            price: 'Ask',
            why: 'A defined thing, for a defined window, with defined proof.',
          };
          const [sw, sh] = slot.size ?? [0.1, 0.1];
          const material = new THREE.MeshBasicMaterial({
            transparent: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
            toneMapped: false,
          });
          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), material) as SlotMesh;

          const n = new THREE.Vector3().fromArray(slot.normal ?? [0, 0, 1]).normalize();
          mesh.position.fromArray(slot.position).addScaledVector(n, Math.max(0.004, Math.min(sw, sh) * 0.05));
          // A plate faces +Z, so aim +Z straight down its own normal.
          mesh.up.set(0, 1, 0);
          if (Math.abs(n.y) > 0.95) mesh.up.set(0, 0, 1);
          mesh.lookAt(mesh.position.clone().addScaledVector(n, 1));

          mesh.userData = {
            slotId: slot.id,
            label: slot.label ?? slot.id.replace(/-/g, ' ').replace(/^./, (m) => m.toUpperCase()),
            listing,
            aspect: sw / sh,
            mark: '',
            map: null,
            state: 'idle',
          };
          paint(mesh, 'idle');
          s.markerRoot.add(mesh);
        }

        // frame it
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const radius = Math.max(size.x, size.y, size.z) * 0.5;
        const lift = size.y * 0.06;
        s.fit = { center: center.clone(), radius, lift };
        const dist = fitDistance(s.camera, radius);
        s.controls.target.copy(center);
        s.camera.position.set(center.x, center.y + lift, center.z + dist);
        s.camera.near = Math.max(0.01, dist - radius * 3);
        s.camera.far = dist + radius * 8;
        s.camera.updateProjectionMatrix();
        s.controls.update();

        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setMessage(`Could not load the ${g.label.toLowerCase()}. ${(err as Error).message}`);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [garment]);

  /* ---- colour ----------------------------------------------------------- */
  useEffect(() => {
    if (!api.current || status !== 'ready') return;
    const col = new THREE.Color(color).convertSRGBToLinear();
    api.current.garmentRoot.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const mat = m as THREE.MeshStandardMaterial;
        if (!mat.color) continue;
        mat.color.copy(col);
        if ('roughness' in mat) mat.roughness = 0.82;
        if ('metalness' in mat) mat.metalness = 0;
        mat.needsUpdate = true;
      }
    });
  }, [color, status, garment]);

  /* ---- picking ---------------------------------------------------------- */
  const show = useCallback((mesh: SlotMesh | null) => {
    const s = api.current;
    if (!s) return;
    if (s.selected && s.selected !== mesh) paint(s.selected, 'idle');
    s.selected = mesh;
    if (!mesh) {
      setCard(null);
      return;
    }
    paint(mesh, 'selected');
    const d = mesh.userData;
    setMarkDraft(d.mark);
    setCard({
      slotId: d.slotId,
      label: d.label,
      cat: d.listing.cat,
      price: d.listing.price,
      why: d.listing.why,
      buyer: d.listing.buyer,
      mark: d.mark,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downAt: { x: number; y: number } | null = null;

    const pick = (ev: PointerEvent): SlotMesh | null => {
      const s = api.current;
      if (!s) return null;
      const r = canvas.getBoundingClientRect();
      pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(pointer, s.camera);
      const hits = ray.intersectObjects(s.markerRoot.children, false);
      return hits.length ? (hits[0].object as SlotMesh) : null;
    };

    const onMove = (ev: PointerEvent) => {
      const s = api.current;
      if (!s) return;
      s.pointerInside = true;
      const hit = pick(ev);
      if (hit === s.hovered) return;
      if (s.hovered && s.hovered !== s.selected) paint(s.hovered, 'idle');
      s.hovered = hit;
      if (hit && hit !== s.selected) paint(hit, 'hover');
      canvas.style.cursor = hit ? 'pointer' : 'grab';
    };

    const onLeave = () => {
      const s = api.current;
      if (!s) return;
      s.pointerInside = false;
      if (s.hovered && s.hovered !== s.selected) paint(s.hovered, 'idle');
      s.hovered = null;
    };

    const onDown = (ev: PointerEvent) => {
      downAt = { x: ev.clientX, y: ev.clientY };
    };

    const onUp = (ev: PointerEvent) => {
      if (!downAt) return;
      const moved = Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y);
      downAt = null;
      if (moved > 6) return; // that was a drag, not a click
      show(pick(ev));
    };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
    };
  }, [show]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') show(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show]);

  /* ---- card actions ------------------------------------------------------ */
  const take = () => {
    if (!card) return;
    if (onTake) {
      onTake({ garment, slotId: card.slotId, label: card.label, price: card.price });
      return;
    }
    setAsking(`${GARMENTS[garment].label}, ${card.label.toLowerCase()}, ${card.price}`);
    goToAccess();
  };

  const stamp = (ev: React.FormEvent) => {
    ev.preventDefault();
    const s = api.current;
    if (!s?.selected) return;
    const text = markDraft.trim().toUpperCase().slice(0, 4);
    s.selected.userData.mark = text;
    paint(s.selected, 'selected');
    setCard((c) => (c ? { ...c, mark: text } : c));
    if (text) {
      setAsking(`${GARMENTS[garment].label}, ${s.selected.userData.label.toLowerCase()}, ${s.selected.userData.listing.price}, your mark already on it`);
    }
  };

  return (
    <div className="viewer" ref={wrapRef}>
      <div className="viewer-tabs" role="tablist" aria-label="Garment">
        {garmentIds.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={garment === id}
            className={`gbtn${garment === id ? ' is-on' : ''}`}
            onClick={() => setGarment(id)}
          >
            {GARMENTS[id].label}
          </button>
        ))}
      </div>

      <div className="viewer-swatches" aria-label="Garment colour">
        {COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            aria-label={c.name}
            aria-pressed={color === c.hex}
            className={`sw${color === c.hex ? ' is-on' : ''}`}
            style={{ background: c.hex }}
            onClick={() => setColor(c.hex)}
          />
        ))}
      </div>

      <canvas ref={canvasRef} aria-label="3D garment with buyable slots" />

      {!card && status === 'ready' && <div className="viewer-hint">Drag to turn it. Tap a dashed slot.</div>}

      {card && (
        <div className="slotcard">
          <button className="slotcard-x" type="button" aria-label="Close slot" onClick={() => show(null)}>
            ×
          </button>
          <div className="slotcard-cat">{card.cat}</div>
          <div className="slotcard-name">{card.label}</div>
          <div className="slotcard-price">{priceMode === 'ask' ? 'Ask' : card.price}</div>
          <div className={`slotcard-status${card.buyer ? ' sold' : ''}`}>
            {card.buyer ? `Sold to ${card.buyer}` : 'Open'}
          </div>
          <p className="slotcard-why">{card.why}</p>

          {!card.buyer && (
            <form className="slotcard-mark" onSubmit={stamp}>
              <label htmlFor="markin">Put your mark on it</label>
              <div className="row tight">
                <input
                  id="markin"
                  type="text"
                  maxLength={4}
                  placeholder="ABC"
                  autoComplete="off"
                  value={markDraft}
                  onChange={(e) => setMarkDraft(e.target.value)}
                />
                <button className="btn btn-ghost" type="submit">
                  Print
                </button>
              </div>
            </form>
          )}

          <button className="btn btn-solid full" type="button" onClick={take}>
            {card.buyer ? 'Ask when it frees up' : (ctaLabel ?? 'Take this slot')}
          </button>
        </div>
      )}

      {status !== 'ready' && <div className={`viewer-load${status === 'error' ? ' err' : ''}`}>{message}</div>}
    </div>
  );
}
