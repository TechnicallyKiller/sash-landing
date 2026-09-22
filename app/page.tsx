import Image from 'next/image';
import { AskingProvider } from '@/components/AskingContext';
import Hero from '@/components/Hero';
import Mission from '@/components/Mission';
import InventoryRail from '@/components/InventoryRail';
import AccessForm from '@/components/AccessForm';
import { STEPS } from '@/lib/inventory';

export default function Page() {
  return (
    <AskingProvider>
      <a className="skip" href="#inventory">Skip to inventory</a>

      <header className="bar">
        <a className="logo" href="#top" aria-label="Sash, home">
          <Image src="/sash-logo.png" alt="Sash" width={703} height={385} priority style={{ height: 26, width: 'auto' }} />
        </a>
        <nav>
          <a href="#inventory">Inventory</a>
          <a href="#how">How it works</a>
          <a className="nav-tag" href="/founders">
            Founders
            <span className="nav-tag-dot" aria-hidden="true" />
          </a>
          <a className="btn btn-solid" href="#access">Get early access</a>
        </nav>
      </header>

      <main id="top">
        <Hero />
        <Mission />
        <InventoryRail />

        <section id="how" className="how">
          <h2>Money moves last.</h2>
          <div className="steps">
            {STEPS.map((s) => (
              <div className="step" key={s.n}>
                <div className="step-n">{s.n}</div>
                <div className="step-h">{s.head}</div>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <AccessForm />
      </main>

      <footer className="foot">
        <a className="logo" href="#top" aria-label="Sash, home">
          <Image src="/sash-logo.png" alt="Sash" width={703} height={385} style={{ height: 26, width: 'auto' }} />
        </a>
        <span>The slot in our own logo is for sale too.</span>
      </footer>
    </AskingProvider>
  );
}
