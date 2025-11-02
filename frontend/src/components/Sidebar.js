import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const Sidebar = ({ logout }) => {
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
    { path: '/categories', name: 'Categories', icon: '📝' },
    { path: '/marques', name: 'Brands', icon: '🏷️' },
    { path: '/statistics', name: 'Statistics', icon: '📈' },
  ];

  const menuItems = user?.role === 'ADMIN' 
    ? [...baseMenuItems, ...adminMenuItems]
    : baseMenuItems;

  const isActive = (path) => location.pathname === path;

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.nom && user?.prenom) {
      return `${user.nom.charAt(0)}${user.prenom.charAt(0)}`.toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🖌️</span>
          <span className="logo-text">Palazzo d'Arte</span>
        </div>
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
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn">
          <span className="logout-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

