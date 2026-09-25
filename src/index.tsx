import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { JarvisBootBoundary } from './JarvisBootBoundary';
import './styles.css';
import './mission-control.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Jarvis root element unavailable');
}

createRoot(root).render(
  <React.StrictMode>
    <JarvisBootBoundary>
      <App />
    </JarvisBootBoundary>
  </React.StrictMode>
);
