import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginPage.css';

const initialLoginValues = { email: '', password: '' };

const LoginPage = () => {
  const [loginValues, setLoginValues] = useState(initialLoginValues);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(
      loginValues.email.trim(),
      loginValues.password
    );
    setLoading(false);

    if (result.success) {
      navigate('/');
      return;
    }

    setError(result.message);
  };

  return (
    <div className="login-container">
      <div className="login-content single-card">
        <div className="login-card" aria-live="polite">
          <h2>Welcome back</h2>
          <p className="card-subtitle">
            Sign in to access your workspace and analytics.
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="login-email">
                Email *
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={loginValues.email}
                onChange={handleLoginChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">
                Password *
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={loginValues.password}
                onChange={handleLoginChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                minLength={6}
              />
            </div>

            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Just a moment...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

