import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '@/components/home/home-page';

const EditorPage = lazy(() => import('@/components/resume-editor/editor-page'));

function EditorRoute() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-svh place-items-center bg-muted text-sm text-muted-foreground">
          Opening the studio…
        </div>
      }
    >
      <EditorPage />
    </Suspense>
  );
}

export const router = createBrowserRouter(
  [
    { path: '/', element: <HomePage /> },
    { path: '/editor', element: <EditorRoute /> },
  ],
  { basename: import.meta.env.BASE_URL },
);
