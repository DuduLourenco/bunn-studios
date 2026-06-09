'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { atendimentoService, Atendimento } from '@/lib/services';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Save, Briefcase, Calendar, Lock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface EditarPageProps {
  params: {
    id: string;
  };
}

export default function EditarAtendimentoPage({ params }: EditarPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [clienteNome, setClienteNome] = useState('');
  const [clienteEmpresa, setClienteEmpresa] = useState('');
  const [tipoServico, setTipoServico] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorCobrado, setValorCobrado] = useState('');
  const [custosEnvolvidos, setCustosEnvolvidos] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataPrevistaEntrega, setDataPrevistaEntrega] = useState('');
  const [dataConclusao, setDataConclusao] = useState('');
  const [status, setStatus] = useState<'agendado' | 'em_andamento' | 'concluido'>('agendado');
  const [observacoes, setObservacoes] = useState('');

  // Carregar dados existentes
  useEffect(() => {
    async function loadAtendimento() {
      try {
        setLoading(true);
        const data = await atendimentoService.getById(id);
        if (!data) {
          setError('Atendimento não encontrado.');
          return;
        }

        setClienteNome(data.cliente_nome);
        setClienteEmpresa(data.cliente_empresa);
        setTipoServico(data.tipo_servico);
        setDescricao(data.descricao || '');
        setValorCobrado(data.valor_cobrado.toString());
        setCustosEnvolvidos(data.custos_envolvidos.toString());
        setDataInicio(data.data_inicio);
        setDataPrevistaEntrega(data.data_prevista_entrega);
        setDataConclusao(data.data_conclusao || '');
        setStatus(data.status);
        setObservacoes(data.observacoes || '');
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados do atendimento.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadAtendimento();
    }
  }, [id, user]);

  // PROTEÇÃO DE ROTA: Apenas Administrador pode editar
  if (user && user.role !== 'admin') {
    return (
      <main className="main-content">
        <div className="card glass" style={errorCardStyle}>
          <div style={lockIconWrapperStyle}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--status-atrasado-text)' }}>
            Acesso Restrito
          </h2>
          <p style={{ maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
            Desculpe, o seu perfil corporativo (Funcionário) não tem permissões para editar ou excluir atendimentos.
          </p>
          <Link href="/atendimentos" className="btn btn-secondary">
            <ArrowLeft size={16} />
            Voltar para Atendimentos
          </Link>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações básicas
    if (!clienteNome || !clienteEmpresa || !tipoServico || !dataInicio || !dataPrevistaEntrega) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (new Date(dataPrevistaEntrega) < new Date(dataInicio)) {
      setError('A data prevista de entrega não pode ser anterior à data de início.');
      return;
    }

    if (status === 'concluido' && !dataConclusao) {
      setError('Para atendimentos com status "Concluído", a data de conclusão é obrigatória.');
      return;
    }

    if (dataConclusao && new Date(dataConclusao) < new Date(dataInicio)) {
      setError('A data de conclusão não pode ser anterior à data de início.');
      return;
    }

    setSaving(true);
    try {
      await atendimentoService.update(id, {
        cliente_nome: clienteNome,
        cliente_empresa: clienteEmpresa,
        tipo_servico: tipoServico,
        descricao,
        valor_cobrado: Number(valorCobrado),
        custos_envolvidos: Number(custosEnvolvidos),
        data_inicio: dataInicio,
        data_prevista_entrega: dataPrevistaEntrega,
        data_conclusao: status === 'concluido' ? dataConclusao : undefined,
        status,
        observacoes,
      });

      alert('Atendimento atualizado com sucesso!');
      router.push('/atendimentos');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar o atendimento.');
    } finally {
      setSaving(false);
    }
  };

  // Preenche a data de conclusão automática ao mudar status para Concluído
  const handleStatusChange = (newStatus: 'agendado' | 'em_andamento' | 'concluido') => {
    setStatus(newStatus);
    if (newStatus === 'concluido' && !dataConclusao) {
      const today = new Date().toISOString().split('T')[0];
      setDataConclusao(today);
    } else if (newStatus !== 'concluido') {
      setDataConclusao('');
    }
  };

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div className="text-gradient-purple" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          Carregando dados do atendimento...
        </div>
      </div>
    );
  }

  return (
    <main className="main-content">
      {/* VOLTAR */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/atendimentos" style={backLinkStyle}>
          <ArrowLeft size={16} />
          Voltar para listagem
        </Link>
      </div>

      {/* TITULO */}
      <div style={{ marginBottom: '2rem' }}>
        <h1>Editar <span className="text-gradient-purple">Atendimento</span></h1>
        <p>Altere os dados necessários do atendimento selecionado.</p>
      </div>

      {error && (
        <div style={errorAlertStyle}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* FORMULÁRIO */}
      <form onSubmit={handleSubmit} className="card glass" style={{ padding: '2.5rem' }}>
        <div className="form-grid">
          {/* DADOS DO CLIENTE */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              <Briefcase size={18} style={{ color: 'var(--primary)' }} />
              Informações do Cliente e Serviço
            </h2>
            
            <div className="form-group">
              <label className="form-label">Nome do Cliente *</label>
              <input
                type="text"
                className="form-input"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Empresa do Cliente *</label>
              <input
                type="text"
                className="form-input"
                value={clienteEmpresa}
                onChange={(e) => setClienteEmpresa(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Serviço *</label>
              <select
                className="form-select"
                value={tipoServico}
                onChange={(e) => setTipoServico(e.target.value)}
                required
              >
                <option value="">Selecione uma categoria...</option>
                <option value="Gestão de Redes Sociais">Gestão de Redes Sociais</option>
                <option value="Desenvolvimento de Site">Desenvolvimento de Site</option>
                <option value="Identidade Visual">Identidade Visual</option>
                <option value="Campanha de Tráfego Pago">Campanha de Tráfego Pago</option>
                <option value="Consultoria de Marketing">Consultoria de Marketing</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Descrição do Serviço</label>
              <textarea
                className="form-textarea"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </div>

          {/* DADOS FINANCEIROS E PRAZOS */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              <Calendar size={18} style={{ color: 'var(--accent)' }} />
              Prazos, Finanças e Status
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Data de Início *</label>
                <input
                  type="date"
                  className="form-input"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Previsão de Entrega *</label>
                <input
                  type="date"
                  className="form-input"
                  value={dataPrevistaEntrega}
                  onChange={(e) => setDataPrevistaEntrega(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Valor Cobrado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={valorCobrado}
                  onChange={(e) => setValorCobrado(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Custos Envolvidos (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={custosEnvolvidos}
                  onChange={(e) => setCustosEnvolvidos(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Status Atual *</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  required
                >
                  <option value="agendado">Agendado</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Data de Conclusão 
                  {status !== 'concluido' && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> (Opcional)</span>}
                  {status === 'concluido' && <span style={{ color: 'var(--status-atrasado-text)' }}> *</span>}
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={dataConclusao}
                  onChange={(e) => setDataConclusao(e.target.value)}
                  disabled={status !== 'concluido'}
                  required={status === 'concluido'}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Observações Gerais</label>
              <textarea
                className="form-textarea"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                style={{ minHeight: '90px' }}
              />
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '2rem 0 1.5rem 0' }} />

        {/* Ações do Formulário */}
        <div style={formActionsStyle}>
          <Link href="/atendimentos" className="btn btn-secondary">
            Cancelar
          </Link>
          
          <button
            type="submit"
            className="btn btn-primary"
            style={{ minWidth: '150px' }}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </main>
  );
}

// ESTILOS INLINE AUXILIARES
const backLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.9rem',
  color: 'var(--text-secondary)',
  transition: 'color var(--transition-fast)',
};

const errorAlertStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  color: '#f87171',
  padding: '1rem',
  borderRadius: 'var(--border-radius-md)',
  fontSize: '0.9rem',
  marginBottom: '1.5rem',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const sectionTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '1.2rem',
  fontWeight: '600',
  marginBottom: '1.5rem',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '0.5rem',
};

const formActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
};

const loadingContainerStyle: React.CSSProperties = {
  minHeight: '80vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const errorCardStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '3rem 2rem',
  maxWidth: '600px',
  margin: '3rem auto 0 auto',
};

const lockIconWrapperStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: 'var(--status-atrasado-bg)',
  color: 'var(--status-atrasado-text)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '0 auto 1.5rem auto',
};
