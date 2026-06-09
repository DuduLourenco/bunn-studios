'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Briefcase, LogOut, User, Sparkles, Users, Lock } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Não renderiza Navbar se o usuário não estiver autenticado (ou se for a tela de login)
  if (!user || pathname === '/') return null;

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* LOGO */}
        <Link href="/dashboard" className="navbar-logo hover-scale">
          <img src="https://bunnprocess.com/LOGOCOMCOELHOBRANCA.png" alt="Bunn Process Logo" style={{ height: '24px', width: 'auto' }} />
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="navbar-nav">
          <Link
            href="/dashboard"
            className={`navbar-link ${pathname === '/dashboard' ? 'navbar-link-active' : ''}`}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <LayoutDashboard size={16} />
              Dashboard
            </span>
          </Link>
          <Link
            href="/atendimentos"
            className={`navbar-link ${pathname.startsWith('/atendimentos') ? 'navbar-link-active' : ''}`}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Briefcase size={16} />
              Atendimentos
            </span>
          </Link>
          {user.role === 'admin' && (
            <Link
              href="/funcionarios"
              className={`navbar-link ${pathname.startsWith('/funcionarios') ? 'navbar-link-active' : ''}`}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={16} />
                Equipe
              </span>
            </Link>
          )}
        </nav>

        {/* PROFILE & LOGOUT */}
        <div className="navbar-profile">
          <div className="user-badge">
            <span className="user-email">{user.email}</span>
            <span className={`user-role-badge ${user.role === 'admin' ? 'admin' : ''}`}>
              {user.role === 'admin' ? 'Administrador' : 'Funcionário'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              href="/mudar-senha"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.75rem' }}
              title="Mudar Senha"
            >
              <Lock size={15} />
              <span className="hide-on-mobile">Senha</span>
            </Link>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.75rem' }}
              title="Sair do sistema"
            >
              <LogOut size={15} />
              <span className="hide-on-mobile">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
