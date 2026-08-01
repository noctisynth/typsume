import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <main className="grid min-h-svh place-items-center bg-background text-foreground">
      <div className="space-y-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">Private by design</p>
        <h1 className="text-5xl font-semibold tracking-tight">Typsume</h1>
        <Link className="text-sm font-medium underline underline-offset-4" to="/editor">
          Open studio
        </Link>
      </div>
    </main>
  );
}
