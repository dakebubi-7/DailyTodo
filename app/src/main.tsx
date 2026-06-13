import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TaskMenuPopup } from './components/TaskMenuPopup';
import './styles/globals.css';
import './styles/context-menu.css';

const params = new URLSearchParams(window.location.search);
const view = params.get('view') || 'main';

const root = ReactDOM.createRoot(document.getElementById('root')!);

if (view === 'task-menu') {
  root.render(
    <React.StrictMode>
      <TaskMenuPopup />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
