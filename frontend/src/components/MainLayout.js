import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import '../styles/MainLayout.css';

const MainLayout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="main-layout">
      <Sidebar logout={handleLogout} />
      <main className="main-content">
        <TopNavbar />
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

