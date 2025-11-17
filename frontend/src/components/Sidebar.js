import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const Sidebar = ({ logout, isOpen = true, onNavigate, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const baseMenuItems = [
    { path: '/', name: 'Dashboard', icon: '📊' },
    { path: '/lancer-achat', name: 'Lancer Achat', icon: '🛒' },
    { path: '/clients', name: 'Clients', icon: '👥' },
    { path: '/products', name: 'Products', icon: '📦' },
    { path: '/achats', name: 'Historique d\'Achats', icon: '📋' },
    { path: '/retours', name: 'Retours', icon: '↩️' },
  ];

  const adminMenuItems = [
    { path: '/inventaire', name: 'Inventaire', icon: ' 🗂️ ' },
    { path: '/categories', name: 'Categories', icon: '📝' },
    { path: '/marques', name: 'Brands', icon: '🏷️' },
    { path: '/statistics', name: 'Statistics', icon: '📈' },
  ];

  const menuItems = user?.role === 'ADMIN' 
    ? [...baseMenuItems, ...adminMenuItems]
    : baseMenuItems;

  const isActive = (path) => location.pathname === path;

  const handleMenuItemClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const handleLogoutClick = () => {
    if (onClose) {
      onClose();
    }
    logout();
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🖌️</span>
          <span className="logo-text">Palazzo d'Arte</span>
        </div>
        {onClose && (
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>

      {/* User Profile */}
      {/* <div className="sidebar-profile">
        <div className="avatar">{getInitials()}</div>
        <div className="profile-info">
          <div className="profile-name">{user?.nom} {user?.prenom}</div>
          <div className="profile-email">{user?.email}</div>
          <div className="profile-role">{user?.role}</div>
        </div>
      </div> */}

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={handleMenuItemClick}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button onClick={handleLogoutClick} className="logout-btn">
          <span className="logout-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

