/* The founders garments: every surface on them is for sale, once, forever. */

import type { GarmentId, Listing } from './inventory';

export const FOUNDERS_GARMENTS: GarmentId[] = ['hoodie', 'tee'];

export const FOUNDERS_SLOT_SOURCES: Partial<Record<GarmentId, string>> = {
  hoodie: '/hoodie-founders-slots.json',
  tee: '/tshirt-founders-slots.json',
};

/** Slots already spoken for. Key is `${garment}:${slotId}`, value is the holder. */
export const TAKEN: Record<string, string> = {
  'tee:front-chest': 'Sash',
  'hoodie:front-chest': 'Sash',
};

export type FoundersSlot = {
  id: string;
  label: string;
  position: [number, number, number];
  normal: [number, number, number];
  size: [number, number];
  why: string;
};

export type FoundersSlotDoc = { garment: string; slots: FoundersSlot[] };

/* The viewer wants a LISTINGS-shaped object. The founders page prints no prices,
   so every entry carries 'Ask' and leans on the slot's own copy. */
export function listingsFrom(
  garment: GarmentId,
  doc: FoundersSlotDoc,
): Record<string, Listing> {
  const out: Record<string, Listing> = {};
  for (const slot of doc.slots) {
    const holder = TAKEN[`${garment}:${slot.id}`];
    out[slot.id] = {
      cat: garment === 'hoodie' ? 'Founders hoodie' : 'Founders tee',
      price: 'Ask',
      why: slot.why,
      buyer: holder,
      art: holder === 'Sash' ? '/sash-logo.png' : undefined,
    };
  }
  return out;
}

export const FOUNDERS_FACTS = [
  {
    n: '01',
    head: 'One payment.',
    body: 'You buy the position once. No renewal, no per-event rate, no invoice next season. The slot is yours for as long as the line exists.',
  },
  {
    n: '02',
    head: 'Printed on every run.',
    body: 'Every unit of every production run carries it. We do not reprint the garment without you on it.',
  },
  {
    n: '03',
    head: 'Worn where it counts.',
    body: 'These are the garments Sash puts on people at the events it runs. Your slot goes wherever they go.',
  },
];

export const MARQUEE = [
  'FOUNDERS HOODIE',
  '23 SURFACES',
  'FOUNDERS TEE',
  '19 SURFACES',
  'PRINTED ON EVERY RUN',
  'ONE PAYMENT',
  'YOURS FOR THE LIFE OF THE LINE',
];
