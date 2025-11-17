import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginPage.css';

const initialLoginValues = { email: '', password: '' };
const initialRegisterValues = {
  nom: '',
  prenom: '',
  email: '',
  password: '',
  confirmPassword: ''
};

const LoginPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginValues, setLoginValues] = useState(initialLoginValues);
  const [registerValues, setRegisterValues] = useState(initialRegisterValues);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleModeChange = (registerMode) => {
    setIsRegistering(registerMode);
    setError('');
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (isRegistering) {
      if (registerValues.password !== registerValues.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const payload = {
        nom: registerValues.nom.trim(),
        prenom: registerValues.prenom.trim() || undefined,
        email: registerValues.email.trim(),
        password: registerValues.password
      };

      const result = await register(payload);
      setLoading(false);

      if (result.success) {
        navigate('/');
        return;
      }

      setError(result.message);
      return;
    }

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
      <div className="login-content">
        <div className="login-card" aria-live="polite">
          <div className="card-switch" role="tablist">
            <button
              type="button"
              className={`switch-btn ${!isRegistering ? 'active' : ''}`}
              onClick={() => handleModeChange(false)}
              aria-pressed={!isRegistering}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`switch-btn ${isRegistering ? 'active' : ''}`}
              onClick={() => handleModeChange(true)}
              aria-pressed={isRegistering}
            >
              Create account
            </button>
          </div>

          <h2>{isRegistering ? 'Create your account' : 'Welcome back'}</h2>
          <p className="card-subtitle">
            {isRegistering
              ? 'Join the team and start organizing your paint business.'
              : 'Sign in to access your workspace and analytics.'}
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            {isRegistering && (
              <div className="input-row">
                <div className="form-group">
                  <label htmlFor="nom">Last name *</label>
                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    value={registerValues.nom}
                    onChange={handleRegisterChange}
                    placeholder="Doe"
                    autoComplete="family-name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="prenom">First name</label>
                  <input
                    id="prenom"
                    name="prenom"
                    type="text"
                    value={registerValues.prenom}
                    onChange={handleRegisterChange}
                    placeholder="John"
                    autoComplete="given-name"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor={isRegistering ? 'register-email' : 'login-email'}>
                Email *
              </label>
              <input
                id={isRegistering ? 'register-email' : 'login-email'}
                name="email"
                type="email"
                value={
                  isRegistering ? registerValues.email : loginValues.email
                }
                onChange={
                  isRegistering ? handleRegisterChange : handleLoginChange
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label
                htmlFor={isRegistering ? 'register-password' : 'login-password'}
              >
                Password *
              </label>
              <input
                id={isRegistering ? 'register-password' : 'login-password'}
                name="password"
                type="password"
                value={
                  isRegistering ? registerValues.password : loginValues.password
                }
                onChange={
                  isRegistering ? handleRegisterChange : handleLoginChange
                }
                placeholder="Enter your password"
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                required
                minLength={6}
              />
            </div>

            {isRegistering && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm password *</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={registerValues.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
            )}

            <button type="submit" disabled={loading} className="login-button">
              {loading
                ? 'Just a moment...'
                : isRegistering
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>

          <div className="card-footer">
            <span>
              {isRegistering
                ? 'Already have an account?'
                : 'New to Paint Store?'}
            </span>
            <button
              type="button"
              className="link-button"
              onClick={() => handleModeChange(!isRegistering)}
            >
              {isRegistering ? 'Sign in' : 'Create an account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

