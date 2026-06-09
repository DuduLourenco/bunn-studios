'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação. Verifique os dados inseridos.');
    }
  };



  return (
    <div style={containerStyle}>
      {/* Background Glowing Effects */}
      <div style={orb1Style} />
      <div style={orb2Style} />

      <div className="card glass" style={loginCardStyle}>
        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <img src="/logo.png" alt="Bunn Process" style={{ height: '48px', width: 'auto' }} />
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Painel Administrativo Restrito</p>
        </div>

        {error && (
          <div style={errorAlertStyle}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={14} style={{ color: 'var(--text-muted)' }} />
              E-mail corporativo
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="exemplo@bunnstudios.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={14} style={{ color: 'var(--text-muted)' }} />
              Senha de acesso
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', gap: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Autenticando...' : 'Acessar Painel'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}

// ESTILOS INLINE AUXILIARES
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  padding: '1.5rem',
  overflow: 'hidden',
};

const orb1Style: React.CSSProperties = {
  position: 'absolute',
  top: '20%',
  left: '25%',
  width: '350px',
  height: '350px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
  opacity: 0.15,
  filter: 'blur(50px)',
  zIndex: -1,
  pointerEvents: 'none',
};

const orb2Style: React.CSSProperties = {
  position: 'absolute',
  bottom: '15%',
  right: '25%',
  width: '400px',
  height: '400px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
  opacity: 0.15,
  filter: 'blur(60px)',
  zIndex: -1,
  pointerEvents: 'none',
};

const loginCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '440px',
  padding: '2.5rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: 'var(--border-radius-lg)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
};

const logoWrapperStyle: React.CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '16px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid var(--border-color)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '0 auto 1rem auto',
  boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
};

const errorAlertStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  color: '#f87171',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--border-radius-md)',
  fontSize: '0.87rem',
  marginBottom: '1.5rem',
  width: '100%',
};


