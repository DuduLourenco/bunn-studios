'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { authService, UserProfile } from '@/lib/services';
import { Users, UserPlus, AlertCircle, Loader2, Mail, Shield, CheckCircle2, User as UserIcon } from 'lucide-react';

export default function FuncionariosPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadEmployees();
  }, [user, router]);

  async function loadEmployees() {
    setIsLoading(true);
    try {
      const list = await authService.listEmployees();
      setEmployees(list);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsCreating(true);

    try {
      await authService.adminCreateUser(email, password);
      setSuccessMsg('Funcionário criado com sucesso!');
      setEmail('');
      setPassword('');
      await loadEmployees();
      
      // Limpa mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: any) {
      setErrorMsg(error.message || 'Erro ao criar funcionário.');
    } finally {
      setIsCreating(false);
    }
  }

  if (!user || user.role !== 'admin') {
    return <div className="loading-screen"><Loader2 className="spinner" size={48} /></div>;
  }

  return (
    <main className="main-content fade-in">
      {/* HEADER DA PÁGINA */}
      <div style={headerStyle}>
        <div>
          <h1>Gestão de <span className="text-gradient-purple">Equipe</span></h1>
          <p>Gerencie os acessos e permissões dos funcionários da Bunn Studios.</p>
        </div>
      </div>

      <div className="team-grid">
        {/* Formulário de Criação */}
        <div className="card glass" style={formCardStyle}>
          <div style={cardHeaderStyle}>
            <div style={iconContainerStyle}>
              <UserPlus size={20} className="text-gradient-purple" />
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--foreground)' }}>Novo Funcionário</h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {errorMsg && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {successMsg && (
              <div className="alert alert-success">
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail Corporativo</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="email"
                  type="email"
                  required
                  className="form-input"
                  placeholder="funcionario@bunn.com"
                  style={{ paddingLeft: '2.75rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Senha Temporária</label>
              <div style={{ position: 'relative' }}>
                <Shield size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="password"
                  type="password"
                  required
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  style={{ paddingLeft: '2.75rem' }}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                O funcionário será forçado a alterar a senha no primeiro acesso.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="spinner" size={18} />
                  Criando conta...
                </>
              ) : (
                'Cadastrar Acesso'
              )}
            </button>
          </form>
        </div>

        {/* Lista de Funcionários */}
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--foreground)' }}>
            <Users size={20} className="text-gradient-purple" />
            Membros da Equipe ({employees.length})
          </h2>

          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
              <Loader2 className="spinner" size={32} style={{ margin: '0 auto', color: 'var(--primary)' }} />
              <p style={{ marginTop: '1rem' }}>Carregando equipe...</p>
            </div>
          ) : (
            <div style={cardsGridStyle}>
              {employees.map((emp) => (
                <div key={emp.id} className="card hover-scale" style={employeeCardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={avatarStyle(emp.role)}>
                      <UserIcon size={24} />
                    </div>
                    <div>
                      <h3 style={emailTitleStyle}>{emp.email}</h3>
                      <span className={`user-role-badge ${emp.role === 'admin' ? 'admin' : ''}`} style={{ marginTop: '0.25rem', display: 'inline-block' }}>
                        {emp.role === 'admin' ? 'Administrador' : 'Funcionário'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={cardFooterStyle}>
                    <div style={statusDotStyle(emp.precisa_trocar_senha ? '#f59e0b' : '#10b981')} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {emp.precisa_trocar_senha ? 'Aguardando primeiro acesso' : 'Conta ativa e configurada'}
                    </span>
                  </div>
                </div>
              ))}
              
              {employees.length === 0 && (
                <div className="card glass" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 2rem' }}>
                  <Users size={48} style={{ color: 'var(--border-color)', margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Nenhum funcionário encontrado</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Adicione membros preenchendo o formulário ao lado.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ESTILOS INLINE AUXILIARES
const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  gap: '1.5rem',
  flexWrap: 'wrap',
};

const formCardStyle: React.CSSProperties = {
  padding: '2rem',
  position: 'sticky',
  top: '2rem',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '1.5rem',
};

const iconContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  background: 'rgba(168, 85, 247, 0.1)',
};

const cardsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1.25rem',
};

const employeeCardStyle: React.CSSProperties = {
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const avatarStyle = (role: string): React.CSSProperties => ({
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: role === 'admin' ? 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(99,102,241,0.2) 100%)' : 'var(--bg-tertiary)',
  color: role === 'admin' ? 'var(--primary)' : 'var(--text-muted)',
  flexShrink: 0,
});

const emailTitleStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  wordBreak: 'break-all',
  lineHeight: 1.2,
};

const cardFooterStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  paddingTop: '1rem',
  marginTop: '0.5rem',
  borderTop: '1px solid var(--border-color)',
};

const statusDotStyle = (color: string): React.CSSProperties => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: color,
  boxShadow: `0 0 8px ${color}`,
});
