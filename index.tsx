import React from 'react';
import { createRoot } from 'react-dom/client';
// In a standard Next.js App Router setup, this file is not the entry point.
// The entry point is src/app/layout.tsx.
// This file is kept here for compatibility with specific runners that might look for it.

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>LMS Application</h1>
      <p>Please run <code>npm run dev</code> to start the Next.js application.</p>
    </div>
  );
}
