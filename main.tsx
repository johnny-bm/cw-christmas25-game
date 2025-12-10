import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './globals.css';

// Only use basename in production (when deployed to /game/Christmas25)
// In development (localhost), don't use basename
const basename = import.meta.env.PROD ? '/game/Christmas25' : undefined;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
);

