import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import PicturesPage from './pages/PicturesPage';
import MaterialsPage from './pages/MaterialsPage';
import IncomesPage from './pages/IncomesPage';
import ExpensesPage from './pages/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/pictures" element={<PicturesPage />} />
                <Route path="/materials" element={<MaterialsPage />} />
                <Route path="/incomes" element={<IncomesPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppRoutes />
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
