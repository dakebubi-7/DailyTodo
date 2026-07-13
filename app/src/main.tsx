import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';

const App = lazy(() => import('./App'));
const TaskMenuPopup = lazy(() => import('./taskMenuView'));

const params = new URLSearchParams(window.location.search);
const view = params.get('view') || 'main';

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
