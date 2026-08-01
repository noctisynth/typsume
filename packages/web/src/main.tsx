import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import '@/app/i18n';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/index.css';

const root = document.getElementById('root');

if (!root) throw new Error('Unable to find the application root.');

createRoot(root).render(
  <StrictMode>
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>
  </StrictMode>,
);
