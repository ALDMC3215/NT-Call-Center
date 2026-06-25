import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppProvider } from './hooks/useAppContext.tsx';
import { Chart as ChartJS } from 'chart.js';
import { LocaleProvider } from './hooks/useLocale.tsx';

ChartJS.defaults.font.family = localStorage.getItem('novintech_language') === 'en' ? 'NovinQuicksand, sans-serif' : 'NovinYekanBakh, sans-serif';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </LocaleProvider>
  </StrictMode>,
);
