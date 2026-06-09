'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { atendimentoService } from '@/lib/services';
import { ArrowLeft, Save, Briefcase, FileText, Calendar, DollarSign, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function NovoAtendimentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    try {
      await atendimentoService.create({
        cliente_nome: clienteNome,
        cliente_empresa: clienteEmpresa,
        tipo_servico: tipoServico,
        descricao,
        valor_cobrado: valorCobrado ? Number(valorCobrado) : 0,
        custos_envolvidos: custosEnvolvidos ? Number(custosEnvolvidos) : 0,
        data_inicio: dataInicio,
        data_prevista_entrega: dataPrevistaEntrega,
        data_conclusao: status === 'concluido' ? dataConclusao : undefined,
        status,
        observacoes,
      });

      alert('Atendimento cadastrado com sucesso!');
      router.push('/atendimentos');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar o atendimento.');
    } finally {
      setLoading(false);
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
        <h1>Cadastrar <span className="text-gradient-purple">Atendimento</span></h1>
        <p>Preencha os dados abaixo para registrar um novo serviço prestado ou agendado.</p>
      </div>

      {error && (
        <div style={errorAlertStyle}>
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
                placeholder="Ex: Roberto Carlos"
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
                placeholder="Ex: Padaria Bella Vista"
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
                placeholder="Descreva detalhadamente o escopo do serviço a ser prestado..."
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
                  placeholder="0.00"
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
                  placeholder="0.00"
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
                placeholder="Notas internas, contatos adicionais do cliente ou pendências..."
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
            disabled={loading}
          >
            <Save size={16} />
            {loading ? 'Salvando...' : 'Salvar Serviço'}
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
