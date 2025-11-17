import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import '../styles/MainLayout.css';
import '../styles/PageLayout.css';

const MainLayout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(max-width: 768px)').matches;
    }
    return false;
  });

  const [isSidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return !window.matchMedia('(max-width: 768px)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleMediaChange = (event) => {
      setIsMobile(event.matches);
      setSidebarOpen(!event.matches);
    };

    setIsMobile(mediaQuery.matches);
    setSidebarOpen(!mediaQuery.matches);

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const sidebarVisible = isMobile ? isSidebarOpen : true;
  const shouldRenderOverlay = isMobile && sidebarVisible;

  return (
    <div className={`main-layout ${shouldRenderOverlay ? 'sidebar-open' : ''}`}>
      <Sidebar
        logout={handleLogout}
        isOpen={sidebarVisible}
        onNavigate={isMobile ? closeSidebar : undefined}
        onClose={isMobile ? closeSidebar : undefined}
      />
      {shouldRenderOverlay && (
        <div className="sidebar-backdrop" onClick={closeSidebar} />
      )}
      <main className="main-content">
        <TopNavbar
          onToggleSidebar={isMobile ? toggleSidebar : undefined}
          isMobile={isMobile}
          isSidebarOpen={sidebarVisible && isMobile}
        />
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

