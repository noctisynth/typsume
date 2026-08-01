import { CircleAlert, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { renderArtifact } from '@/lib/renderer-runtime';

interface TypstPreviewDocumentProps {
  artifact: Uint8Array;
  fill: string;
}

export function TypstPreviewDocument({ artifact, fill }: TypstPreviewDocumentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let active = true;
    const staging = document.createElement('div');

    setError(null);
    setRendering(true);
    void renderArtifact(artifact, staging)
      .then(() => {
        if (!active || !containerRef.current) return;
        containerRef.current.replaceChildren(...staging.childNodes);
        setRendering(false);
      })
      .catch((cause) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : String(cause));
        setRendering(false);
      });

    return () => {
      active = false;
    };
  }, [artifact]);

  return (
    <div className="relative min-h-48" style={{ backgroundColor: fill }}>
      <div className="[&_svg]:block [&_svg]:h-auto [&_svg]:w-full" ref={containerRef} />
      {rendering ? (
        <div className="absolute inset-0 grid place-items-center bg-white/70 text-sm text-muted-foreground backdrop-blur-sm">
          <span className="flex items-center gap-2">
            <LoaderCircle className="size-4 animate-spin" />
            Rendering preview
          </span>
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-0 grid place-items-center bg-background/95 p-6 text-sm text-destructive">
          <span className="flex max-w-md items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            Preview rendering failed: {error}
          </span>
        </div>
      ) : null}
    </div>
  );
}
