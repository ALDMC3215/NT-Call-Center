import { StrictMode, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppProvider, useAppContext } from './hooks/useAppContext.tsx';
import { AuthProvider } from './hooks/useAuth.tsx';
import { Chart as ChartJS } from 'chart.js';
import { LocaleProvider } from './hooks/useLocale.tsx';
import { Profile } from './types.ts';

ChartJS.defaults.font.family =
  localStorage.getItem('novintech_language') === 'en'
    ? 'NovinQuicksand, sans-serif'
    : 'NovinYekanBakh, sans-serif';

// ---------------------------------------------------------------------------
// AuthBridge — lives inside AppProvider so it can call setProfile / logout
// from useAppContext, and provides those callbacks to AuthProvider.
// ---------------------------------------------------------------------------
const AuthBridge = ({ children }: { children: React.ReactNode }) => {
  const { setProfile, logout } = useAppContext();

  const handleAuthenticated = useCallback(
    (mappedProfile: Profile) => {
      setProfile(mappedProfile);
    },
    [setProfile],
  );

  const handleSignedOut = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <AuthProvider onAuthenticated={handleAuthenticated} onSignedOut={handleSignedOut}>
      {children}
    </AuthProvider>
  );
};

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <AppProvider>
        <AuthBridge>
          <App />
        </AuthBridge>
      </AppProvider>
    </LocaleProvider>
  </StrictMode>,
);
