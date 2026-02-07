import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import '@/styles/globals.css';

/**
 * Validates the persisted token on app mount.
 * If the server restarted (new JWT secret) or the token expired,
 * apiFetch will catch the 401 and trigger logout + redirect automatically.
 */
function useSessionValidator() {
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Light-weight authenticated call — just to check if the token is still valid
    apiFetch('/vault/items').catch(() => {
      // 401 already handled inside apiFetch (logout + redirect)
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

function App() {
  const { isAuthenticated } = useAuth();
  useSessionValidator();


  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />}
        />

        {/* Default Route */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
