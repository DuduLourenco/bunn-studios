'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/lib/services';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function MudarSenhaPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.updatePassword(password);
      setSuccessMsg('Senha atualizada com sucesso!');
      
      // Forçar recarregamento para que o AuthContext e o cache local sejam limpos visualmente e a navegação prossiga
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);

    } catch (error: any) {
      setErrorMsg(error.message || 'Erro ao atualizar a senha.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="page-container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card glass" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--primary)', marginBottom: '1rem' }}>
            <Lock size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Atualizar Senha</h1>
          {user.precisa_trocar_senha ? (
            <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
              Este é o seu primeiro acesso. Por questões de segurança, você precisa definir uma nova senha.
            </p>
          ) : (
            <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
              Preencha os campos abaixo para atualizar sua senha de acesso.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="form-label" htmlFor="password">Nova Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="password"
                type="password"
                required
                className="form-input"
                placeholder="Mínimo 6 caracteres"
                style={{ paddingLeft: '2.75rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || !!successMsg}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirmar Nova Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="confirmPassword"
                type="password"
                required
                className="form-input"
                placeholder="Digite a senha novamente"
                style={{ paddingLeft: '2.75rem' }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || !!successMsg}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            {!user.precisa_trocar_senha && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => router.back()}
                disabled={isLoading || !!successMsg}
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={isLoading || !!successMsg}
            >
              {isLoading ? (
                <>
                  <Loader2 className="spinner" size={18} />
                  Salvando...
                </>
              ) : (
                'Salvar Nova Senha'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
