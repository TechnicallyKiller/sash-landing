import type { Metadata } from 'next';
import { AskingProvider } from '@/components/AskingContext';
import FoundersPage from '@/components/FoundersPage';

export const metadata: Metadata = {
  title: 'Sash — Founders edition. Every surface, once, forever.',
  description:
    'Buy a permanent position on the founders hoodie and tee. One payment, printed on every unit of every run, for as long as the line exists.',
  openGraph: {
    title: 'Sash — Founders edition',
    description: 'Every surface, once, forever.',
  },
};

export default function Page() {
  /* The viewer still expects the asking context from the landing page, even
     though this page routes its own selections into the enquiry form. */
  return (
    <AskingProvider>
      <FoundersPage />
    </AskingProvider>
  );
}
