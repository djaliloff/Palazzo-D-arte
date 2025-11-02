import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ProductsPage from './pages/ProductsPage';
import AchatsPage from './pages/AchatsPage';
import RetoursPage from './pages/RetoursPage';
import CategoriesPage from './pages/CategoriesPage';
import MarquesPage from './pages/MarquesPage';
import StatisticsPage from './pages/StatisticsPage';

// Components
import MainLayout from './components/MainLayout';

// Styles
import './styles/Loading.css';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/clients" element={
            <ProtectedRoute>
              <MainLayout>
                <ClientsPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/products" element={
            <ProtectedRoute>
              <MainLayout>
                <ProductsPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/achats" element={
            <ProtectedRoute>
              <MainLayout>
                <AchatsPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/retours" element={
            <ProtectedRoute>
              <MainLayout>
                <RetoursPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/categories" element={
            <ProtectedRoute>
              <MainLayout>
                <CategoriesPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/marques" element={
            <ProtectedRoute>
              <MainLayout>
                <MarquesPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/statistics" element={
            <ProtectedRoute>
              <MainLayout>
                <StatisticsPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;

