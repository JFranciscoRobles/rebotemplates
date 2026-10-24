// The demo alone, in a frame like the landing's. `?claude=0` leaves Claude out.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Demo } from './Demo';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{ maxWidth: 1180, margin: '32px auto', padding: 14, borderRadius: 24, background: '#f7f6f3', border: '1px solid #eae8e3', overflowX: 'auto' }}>
      <Demo claudeActivity={new URLSearchParams(location.search).get('claude') !== '0'} />
    </div>
  </StrictMode>,
);
