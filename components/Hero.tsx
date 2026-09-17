'use client';

import dynamic from 'next/dynamic';

/* WebGL only makes sense in the browser, so the viewer never renders on the server. */
const GarmentViewer = dynamic(() => import('./GarmentViewer'), {
  ssr: false,
  loading: () => <div className="viewer"><div className="viewer-load">Loading the hoodie…</div></div>,
});

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <h1 className="in">Be there without being there.</h1>
        <p className="in d1">
          Hire credible people at events you cannot attend. They wear your brand, take the meetings, and bring back
          proof.
        </p>
        <div className="row in d2">
          <a className="btn btn-solid btn-lg" href="#access">Get early access</a>
          <a className="btn btn-ghost btn-lg" href="#inventory">See the inventory</a>
        </div>
        <p className="fine in d2">Three garments on the right. Every dashed rectangle is a slot you can buy.</p>
      </div>
      <div className="hero-viewer">
        <GarmentViewer />
      </div>
    </section>
  );
}
