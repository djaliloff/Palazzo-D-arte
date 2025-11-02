import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/TopNavbar.css';

const TopNavbar = () => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const getInitials = () => {
    if (user?.nom && user?.prenom) {
      return `${user.nom.charAt(0)}${user.prenom.charAt(0)}`.toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className="top-navbar">
      <div className="top-navbar-left">
      
      </div>

      <div className="top-navbar-right">
        {/* Notifications */}
        <div className="icon-button" onClick={() => setShowNotifications(!showNotifications)}>
          <span className="icon">🔔</span>
          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notification-header">Notifications</div>
              <div className="notification-item">
                <p>No new notifications</p>
              </div>
            </div>
          )}
        </div>


        {/* User Profile */}
        <div className="user-profile">
          <div className="user-avatar">{getInitials()}</div>
          <div className="user-details">
            <span className="user-name">{user?.nom} {user?.prenom}</span>
            <span className="user-email">{user?.email}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;

