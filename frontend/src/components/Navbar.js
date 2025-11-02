import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>🖌️ Paint Store</h2>
      </div>
      <ul className="navbar-menu">
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/clients">Clients</Link></li>
        <li><Link to="/products">Products</Link></li>
        <li><Link to="/achats">Achats</Link></li>
        <li><Link to="/retours">Retours</Link></li>
      </ul>
      <div className="navbar-user">
        <span className="user-info">
          👤 {user?.nom} {user?.prenom} ({user?.role})
        </span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;

