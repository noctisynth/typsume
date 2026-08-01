import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';

const EditorPage = lazy(() => import('@/pages/EditorPage'));

function EditorRoute() {
  return (
    <Suspense fallback={<div className="route-loading">Opening the studio…</div>}>
      <EditorPage />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/editor', element: <EditorRoute /> },
]);
