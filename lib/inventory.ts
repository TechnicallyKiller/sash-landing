/* Everything a person can sell, and everything the 3D garments know about themselves. */

export type RailCard = {
  kind: 'card';
  cat: string;
  slot: string;
  price: string;
  buyer?: string;
  why: string;
};

export type RailGroup = { kind: 'group'; label: string };
export type RailRow = RailCard | RailGroup;

const group = (label: string): RailGroup => ({ kind: 'group', label });
const card = (cat: string, slot: string, price: string, buyer: string, why: string): RailCard => ({
  kind: 'card',
  cat,
  slot,
  price,
  buyer: buyer || undefined,
  why,
});

export const RAIL: RailRow[] = [
  group('WORN'),
  card('Worn surface', 'Front chest', '240 USDC', '', 'Read in every hallway conversation for two days straight.'),
  card('Worn surface', 'Back panel', '310 USDC', 'Obol', 'The whole queue reads it while they wait for coffee.'),
  card('Worn surface', 'Hood', '110 USDC', '', 'Small, cheap, and in shot behind whoever is on stage.'),
  group('CARRIED'),
  card('Carried surface', 'Tote face', '420 USDC', 'Sash', 'Put down on every table in the building, then photographed.'),
  card('Carried surface', 'Laptop lid', '120 USDC', '', 'Open in every session, in the front row of other people pictures.'),
  card('Carried surface', 'Backpack front', '150 USDC', '', 'Walks the floor at eye level for the full two days.'),
  group('DIGITAL'),
  card('Digital surface', 'Profile banner', '180 USDC', '', 'Seen by everyone who checks who just spoke.'),
  card('Digital surface', 'Profile picture', '260 USDC', 'Meridian', 'Sits beside every reply they write during the week.'),
  card('Digital surface', 'One post', '340 USDC', '', 'Written by them, in their voice, to people who already listen.'),
  group('TIME'),
  card('Time', 'An hour of meetings', '500 USDC', '', 'They take the meetings you cannot get to and send back notes.'),
  card('Time', 'A day on the stand', '1,400 USDC', 'Northwind', 'Someone answers questions about you for the whole day.'),
  group('REPRESENTATION'),
  card('Representation', 'Event ambassador', '3,200 USDC', '', 'Someone credible speaks for you in a room you are not in.'),
  card('Representation', 'Hosted dinner', '2,600 USDC', '', 'Twelve seats, your topic, a host people already trust.'),
  card('Representation', 'Run of activations', '7,500 USDC', 'Halflight', 'A season of appearances instead of one afternoon.'),
];

export const STEPS = [
  {
    n: '1',
    head: 'Buy the slot.',
    body: 'Pick what you want and the window you want it for. The price is the seller’s. You agree what counts as proof before anyone starts.',
  },
  {
    n: '2',
    head: 'Escrow holds it.',
    body: 'Your payment locks before the work happens, so the seller knows it is real. Neither side can move it while it sits there.',
  },
  {
    n: '3',
    head: 'Proof releases it.',
    body: 'The seller files what they agreed to file. You look at it. Nothing arrives, nothing is paid, and the refund is automatic.',
  },
];

/* ---- 3D garments ------------------------------------------------------- */

export type GarmentId = 'hoodie' | 'tee' | 'tote';

export type Garment = {
  id: GarmentId;
  label: string;
  model: string;
  slots: string;
};

export const GARMENTS: Record<GarmentId, Garment> = {
  hoodie: { id: 'hoodie', label: 'Hoodie', model: '/hoodie-sash.glb', slots: '/hoodie-slots.json' },
  tee: { id: 'tee', label: 'T-shirt', model: '/tshirt-sash-lite.glb', slots: '/tshirt-slots.json' },
  tote: { id: 'tote', label: 'Tote', model: '/tote-sash.glb', slots: '/tote-slots.json' },
};

export const GARMENT_ORDER: GarmentId[] = ['hoodie', 'tee', 'tote'];

export type Listing = {
  cat: string;
  price: string;
  why: string;
  buyer?: string;
  /** Artwork already printed on the slot, drawn onto the garment in the viewer. */
  art?: string;
};

/* Keyed by the slot ids in the *-slots.json files shipped in /public. */
export const LISTINGS: Record<GarmentId, Record<string, Listing>> = {
  hoodie: {
    'front-chest': {
      cat: 'Worn surface',
      price: '240 USDC',
      buyer: 'Sash',
      art: '/sash-logo.png',
      why: 'Ours, for now. Read in every hallway conversation for two days straight.',
    },
    'front-full': { cat: 'Worn surface', price: '480 USDC', why: 'The whole front of the person. Nobody talks to them without reading it.' },
    'back-full': { cat: 'Worn surface', price: '310 USDC', buyer: 'Obol', why: 'The whole queue reads it while they wait for coffee.' },
    hood: { cat: 'Worn surface', price: '110 USDC', why: 'Small, cheap, and in shot behind whoever is on stage.' },
    pocket: { cat: 'Worn surface', price: '140 USDC', why: 'Hands live here. It is in every photo taken below the shoulder.' },
    'left-sleeve': { cat: 'Worn surface', price: '90 USDC', why: 'Seen by whoever they are shaking hands with.' },
    'right-sleeve': { cat: 'Worn surface', price: '90 USDC', buyer: 'Meridian', why: 'Seen by whoever they are shaking hands with.' },
  },
  tee: {
    'front-chest': {
      cat: 'Worn surface',
      price: '240 USDC',
      buyer: 'Sash',
      art: '/sash-logo.png',
      why: 'Ours, for now. This is what a bought slot looks like on the shirt.',
    },
    'front-full': { cat: 'Worn surface', price: '380 USDC', why: 'A poster that walks itself to the right rooms.' },
    'back-full': { cat: 'Worn surface', price: '300 USDC', buyer: 'Northwind', why: 'Faces the room for the whole of every session.' },
    'left-sleeve': { cat: 'Worn surface', price: '90 USDC', why: 'Small, cheap, and never off camera.' },
    'right-sleeve': { cat: 'Worn surface', price: '90 USDC', why: 'Small, cheap, and never off camera.' },
  },
  tote: {
    'tote-face': {
      cat: 'Carried surface',
      price: '420 USDC',
      buyer: 'Sash',
      art: '/sash-logo.png',
      why: 'Ours, for now. Put down on every table in the building, then photographed.',
    },
    'tote-back': { cat: 'Carried surface', price: '260 USDC', why: 'Faces everyone walking behind them all day.' },
    'tote-strap': { cat: 'Carried surface', price: '80 USDC', why: 'At shoulder height, level with every face in the room.' },
  },
};

export type SlotDoc = {
  garment: string;
  unit: string;
  slots: Array<{
    id: string;
    label?: string;
    position: [number, number, number];
    normal: [number, number, number];
    size: [number, number];
  }>;
};
