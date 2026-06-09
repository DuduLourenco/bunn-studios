'use client';

import React, { useEffect, useState } from 'react';
import { atendimentoService, Atendimento } from '@/lib/services';
import { useAuth } from '@/context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  User, 
  Briefcase, 
  DollarSign, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function AtendimentosListPage() {
  const { user } = useAuth();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [filteredAtendimentos, setFilteredAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Listas para dropdowns de filtros
  const [clientesUnicos, setClientesUnicos] = useState<string[]>([]);
  const [tiposUnicos, setTiposUnicos] = useState<string[]>([]);

  // Carregar dados
  const fetchAtendimentos = async () => {
    try {
      setLoading(true);
      const data = await atendimentoService.list();
      setAtendimentos(data);
      
      // Extrair clientes e tipos únicos para filtros
      const clientes = Array.from(new Set(data.map(item => item.cliente_nome))).sort();
      const tipos = Array.from(new Set(data.map(item => item.tipo_servico))).sort();
      setClientesUnicos(clientes);
      setTiposUnicos(tipos);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar atendimentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtendimentos();
  }, []);

  // Regra de Data Atual
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayDateString();

  // Filtragem Dinâmica
  useEffect(() => {
    let result = [...atendimentos];

    // 1. Busca Textual (Nome, Empresa, Descrição ou Observações)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.cliente_nome.toLowerCase().includes(term) ||
        item.cliente_empresa.toLowerCase().includes(term) ||
        item.tipo_servico.toLowerCase().includes(term) ||
        (item.descricao && item.descricao.toLowerCase().includes(term)) ||
        (item.observacoes && item.observacoes.toLowerCase().includes(term))
      );
    }

    // 2. Filtro por Cliente
    if (selectedCliente !== '') {
      result = result.filter(item => item.cliente_nome === selectedCliente);
    }

    // 3. Filtro por Tipo de Serviço
    if (selectedTipo !== '') {
      result = result.filter(item => item.tipo_servico === selectedTipo);
    }

    // 4. Filtro por Status
    if (selectedStatus !== '') {
      if (selectedStatus === 'atrasado') {
        result = result.filter(item => item.status !== 'concluido' && item.data_prevista_entrega < todayStr);
      } else {
        result = result.filter(item => item.status === selectedStatus);
      }
    }

    setFilteredAtendimentos(result);
  }, [searchTerm, selectedCliente, selectedTipo, selectedStatus, atendimentos, todayStr]);

  // Função para deletar atendimento (apenas Admin)
  const handleDelete = async (id: string, cliente: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o atendimento do cliente "${cliente}"?`)) {
      return;
    }
    
    try {
      await atendimentoService.delete(id);
      alert('Atendimento excluído com sucesso!');
      fetchAtendimentos(); // Recarrega
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir atendimento.');
    }
  };

  // Função para limpar todos os filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCliente('');
    setSelectedTipo('');
    setSelectedStatus('');
  };

  // Tradução amigável de status para exibição
  const formatStatus = (status: string) => {
    switch (status) {
      case 'agendado': return 'Agendado';
      case 'em_andamento': return 'Em Andamento';
      case 'concluido': return 'Concluído';
      default: return status;
    }
  };

  // Verifica se o item está atrasado
  const isAtrasado = (item: Atendimento) => {
    return item.status !== 'concluido' && item.data_prevista_entrega < todayStr;
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '-';
    const [year, month, day] = dataStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <main className="main-content">
      {/* HEADER DA PÁGINA */}
      <div style={headerStyle}>
        <div>
          <h1>Atendimentos e <span className="text-gradient-purple">Serviços</span></h1>
          <p>Gerencie todos os projetos ativos e entregas da Bunn Studios.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={fetchAtendimentos} 
            className="btn btn-secondary" 
            style={{ padding: '0.75rem' }}
            title="Atualizar lista"
          >
            <RefreshCw size={18} className={loading ? 'spin-animation' : ''} />
          </button>
          <Link href="/atendimentos/novo" className="btn btn-primary">
            <Plus size={18} />
            Novo Atendimento
          </Link>
        </div>
      </div>

      {/* PAINEL DE FILTROS E BUSCA */}
      <div className="card" style={filterPanelStyle}>
        <div style={searchWrapperStyle}>
          <Search size={18} style={searchIconStyle} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por cliente, empresa, serviço ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={filtersGridStyle}>
          {/* FILTRO DE CLIENTE */}
          <div className="form-group" style={{ margin: 0 }}>
            <select
              className="form-select"
              value={selectedCliente}
              onChange={(e) => setSelectedCliente(e.target.value)}
            >
              <option value="">Todos os Clientes</option>
              {clientesUnicos.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* FILTRO DE TIPO DE SERVIÇO */}
          <div className="form-group" style={{ margin: 0 }}>
            <select
              className="form-select"
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
            >
              <option value="">Todos os Tipos de Serviço</option>
              {tiposUnicos.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* FILTRO DE STATUS */}
          <div className="form-group" style={{ margin: 0 }}>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Todos os Status</option>
              <option value="agendado">Agendado</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
              <option value="atrasado">Atrasados (Prazo Vencido)</option>
            </select>
          </div>

          {/* BOTAO LIMPAR FILTROS */}
          {(searchTerm || selectedCliente || selectedTipo || selectedStatus) && (
            <button
              onClick={handleClearFilters}
              className="btn btn-secondary btn-sm"
              style={{ height: '100%', fontSize: '0.85rem' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* CONTADOR DE RESULTADOS */}
      <div style={resultsCountStyle}>
        Exibindo {filteredAtendimentos.length} de {atendimentos.length} atendimentos
      </div>

      {/* LISTAGEM EM FORMATO DE CARDS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando atendimentos...</div>
      ) : filteredAtendimentos.length === 0 ? (
        <div className="card glass" style={emptyStateCardStyle}>
          <h2>Nenhum atendimento encontrado</h2>
          <p style={{ marginTop: '0.5rem' }}>Experimente mudar os termos de busca ou limpar os filtros aplicados.</p>
          <button onClick={handleClearFilters} className="btn btn-secondary btn-sm" style={{ marginTop: '1.25rem' }}>
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div style={cardsGridStyle}>
          {filteredAtendimentos.map((item) => {
            const delayFlag = isAtrasado(item);
            return (
              <div 
                key={item.id} 
                className="card" 
                style={{ 
                  ...cardStyle, 
                  borderColor: delayFlag ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)',
                  boxShadow: delayFlag ? '0 10px 30px -10px rgba(239, 68, 68, 0.1)' : 'var(--card-shadow)'
                }}
              >
                {/* Header do Card */}
                <div style={cardHeaderStyle}>
                  <div style={badgeContainerStyle}>
                    <span className={`badge badge-${item.status}`}>
                      {formatStatus(item.status)}
                    </span>
                    {delayFlag && (
                      <span className="badge badge-atrasado" style={{ gap: '0.25rem' }}>
                        <AlertTriangle size={12} />
                        Atrasado
                      </span>
                    )}
                  </div>
                  
                  {/* AÇÕES CONDICIONAIS PELO PERFIL */}
                  {user?.role === 'admin' && (
                    <div style={actionsContainerStyle}>
                      <Link 
                        href={`/atendimentos/editar/${item.id}`} 
                        className="btn btn-secondary btn-sm" 
                        style={actionButtonStyle}
                        title="Editar Atendimento"
                      >
                        <Edit3 size={14} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(item.id, item.cliente_nome)} 
                        className="btn btn-danger btn-sm" 
                        style={actionButtonStyle}
                        title="Excluir Atendimento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Tipo de Serviço */}
                <h3 style={cardTitleStyle}>
                  {item.tipo_servico}
                </h3>

                {/* Cliente / Empresa */}
                <div style={cardRowStyle}>
                  <User size={15} style={rowIconStyle} />
                  <span style={rowTextStyle}>
                    {item.cliente_nome}
                  </span>
                </div>
                <div style={cardRowStyle}>
                  <Building2 size={15} style={rowIconStyle} />
                  <span style={{ ...rowTextStyle, color: 'var(--text-secondary)' }}>
                    {item.cliente_empresa}
                  </span>
                </div>

                {/* Descrição Curta */}
                {item.descricao && (
                  <p style={cardDescStyle}>
                    {item.descricao.length > 90 
                      ? `${item.descricao.substring(0, 90)}...` 
                      : item.descricao}
                  </p>
                )}

                {/* Divisor */}
                <div style={cardDividerStyle} />

                {/* Prazos */}
                <div style={cardTimelineStyle}>
                  <div style={dateBoxStyle}>
                    <span style={dateLabelStyle}>Início</span>
                    <span style={dateValStyle}>{formatarData(item.data_inicio)}</span>
                  </div>
                  <div style={dateBoxStyle}>
                    <span style={dateLabelStyle}>Prazo de Entrega</span>
                    <span style={{ 
                      ...dateValStyle, 
                      color: delayFlag ? 'var(--status-atrasado-text)' : 'var(--text-primary)' 
                    }}>
                      {formatarData(item.data_prevista_entrega)}
                    </span>
                  </div>
                  {item.status === 'concluido' && item.data_conclusao && (
                    <div style={dateBoxStyle}>
                      <span style={dateLabelStyle}>Conclusão</span>
                      <span style={{ ...dateValStyle, color: 'var(--status-concluido-text)' }}>
                        {formatarData(item.data_conclusao)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Valores Financeiros */}
                <div style={cardFinanceStyle}>
                  <div>
                    <span style={financeLabelStyle}>Faturamento</span>
                    <span style={financeValStyle}>
                      {item.valor_cobrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={financeLabelStyle}>Custo Operacional</span>
                    <span style={costValStyle}>
                      {item.custos_envolvidos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Adicionar CSS dinâmico para animação de spin do botão de recarga */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
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

const filterPanelStyle: React.CSSProperties = {
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginBottom: '1rem',
  boxShadow: 'none',
};

const searchWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
};

const searchIconStyle: React.CSSProperties = {
  position: 'absolute',
  left: '1rem',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-muted)',
  pointerEvents: 'none',
};

const filtersGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  alignItems: 'center',
};

const resultsCountStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--text-muted)',
  marginBottom: '1.5rem',
};

const emptyStateCardStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '4rem 2rem',
};

const cardsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.5rem',
  marginBottom: '3rem',
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '1.5rem',
  height: '100%',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  gap: '1rem',
};

const badgeContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const actionsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
};

const actionButtonStyle: React.CSSProperties = {
  padding: '0.4rem',
  borderRadius: '8px',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: '700',
  marginBottom: '0.75rem',
  color: 'var(--text-primary)',
};

const cardRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.5rem',
};

const rowIconStyle: React.CSSProperties = {
  color: 'var(--primary)',
  flexShrink: 0,
};

const rowTextStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 500,
};

const cardDescStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  marginTop: '0.5rem',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minHeight: '2.5rem',
};

const cardDividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'var(--border-color)',
  margin: '1.25rem 0',
};

const cardTimelineStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '0.75rem',
  marginBottom: '1.25rem',
  flexWrap: 'wrap',
};

const dateBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: '70px',
};

const dateLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  marginBottom: '0.15rem',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
};

const dateValStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
};

const cardFinanceStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  backgroundColor: 'var(--bg-tertiary)',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--border-radius-md)',
  border: '1px solid var(--border-color)',
  marginTop: 'auto',
};

const financeLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: 'var(--text-secondary)',
  display: 'block',
};

const financeValStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 700,
  color: '#34d399',
};

const costValStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 700,
  color: '#f87171',
};
