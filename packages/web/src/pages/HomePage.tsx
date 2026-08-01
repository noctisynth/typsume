import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <main className="home-shell">
      <nav className="home-nav" aria-label="Primary navigation">
        <Link className="brand" to="/">
          <span className="brand-mark">T</span>
          <span>Typsume</span>
        </Link>
        <Link className="button button-ghost" to="/editor">
          Open studio
        </Link>
      </nav>
      <section className="hero">
        <p className="eyebrow">Private by design · Powered by Typst</p>
        <h1>
          Your experience,
          <br />
          beautifully typeset.
        </h1>
        <p className="hero-copy">
          Build a precise resume from structured data. Preview every edit in your browser and export
          a polished PDF without uploading your personal details.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/editor">
            Start building
          </Link>
          <a className="button button-secondary" href="https://github.com/noctisynth/typsume">
            View source
          </a>
        </div>
      </section>
      <section className="feature-strip" aria-label="Product highlights">
        <article>
          <span>01</span>
          <strong>Structured</strong>
          <p>One schema shared with the CLI.</p>
        </article>
        <article>
          <span>02</span>
          <strong>Local</strong>
          <p>Your resume stays in this browser.</p>
        </article>
        <article>
          <span>03</span>
          <strong>Typst</strong>
          <p>Publication-grade PDF output.</p>
        </article>
      </section>
    </main>
  );
}
