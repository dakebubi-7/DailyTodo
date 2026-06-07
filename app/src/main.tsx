import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WidgetApp } from './WidgetApp';
import { resolveRendererView } from '../shared/rendererRoute';
import './styles/globals.css';

const view = resolveRendererView(window.location.href);
const Root = view === 'widget' ? WidgetApp : App;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
