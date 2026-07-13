import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { resolveRendererView } from '../shared/rendererRoute';

const App = lazy(() => import('./App'));
const TaskMenuPopup = lazy(() => import('./taskMenuView'));

const view = resolveRendererView(window.location.search || 'main');

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <Suspense fallback={null}>
      {view === 'task-menu' ? (
      <TaskMenuPopup />
      ) : (
      <App />
      )}
    </Suspense>
  </React.StrictMode>
);
