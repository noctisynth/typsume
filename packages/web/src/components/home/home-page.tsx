import { ArrowRight, Code2, LockKeyhole, PanelsTopLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function HomePage() {
  return (
    <main className="min-h-svh overflow-hidden bg-background text-foreground">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link className="flex items-center gap-2 font-semibold tracking-tight" to="/">
          <BrandLogo />
          Typsume
        </Link>
        <Button asChild variant="ghost">
          <Link to="/editor">Open studio</Link>
        </Button>
      </nav>
      <section className="mx-auto grid max-w-7xl grid-cols-[1.1fr_0.9fr] items-center gap-16 px-6 py-24">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <LockKeyhole className="size-3.5 text-emerald-600" />
            Private by design · Powered by Typst
          </div>
          <h1 className="max-w-3xl font-heading text-7xl leading-[0.95] font-semibold tracking-[-0.055em]">
            Your experience, beautifully typeset.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
            Build a precise resume from structured data. Preview every edit locally and export a
            publication-grade PDF without uploading personal details.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg">
              <Link to="/editor">
                Start building
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="https://github.com/noctisynth/typsume">
                <Code2 data-icon="inline-start" />
                View source
              </a>
            </Button>
          </div>
        </div>
        <Card className="relative rotate-2 overflow-hidden rounded-2xl border-0 bg-muted shadow-2xl">
          <CardContent className="p-5">
            <div className="aspect-[210/297] rounded-sm bg-background p-10 shadow-lg">
              <div className="h-3 w-28 rounded-full bg-primary/80" />
              <div className="mt-3 h-2 w-44 rounded-full bg-muted" />
              <div className="mt-10 grid grid-cols-[1fr_0.38fr] gap-8">
                <div className="space-y-8">
                  {[1, 2, 3].map((item) => (
                    <div className="space-y-2" key={item}>
                      <div className="h-2 w-24 rounded-full bg-foreground/70" />
                      <div className="h-px bg-border" />
                      <div className="h-1.5 w-full rounded-full bg-muted" />
                      <div className="h-1.5 w-4/5 rounded-full bg-muted" />
                    </div>
                  ))}
                </div>
                <div className="space-y-5 rounded-lg bg-muted/60 p-4">
                  <div className="mx-auto size-14 rounded-full bg-primary/10" />
                  <div className="h-1.5 rounded-full bg-foreground/50" />
                  <div className="h-1.5 rounded-full bg-foreground/30" />
                  <div className="h-1.5 w-4/5 rounded-full bg-foreground/30" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="mx-auto grid max-w-7xl grid-cols-3 border-t px-6 py-8">
        {[
          { icon: PanelsTopLeft, title: 'Structured', copy: 'One schema shared with the CLI.' },
          { icon: LockKeyhole, title: 'Local', copy: 'Your resume stays in this browser.' },
          { icon: Sparkles, title: 'Typst', copy: 'Publication-grade PDF output.' },
        ].map(({ icon: Icon, title, copy }) => (
          <div className="flex gap-4 pr-8" key={title}>
            <Icon className="size-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
