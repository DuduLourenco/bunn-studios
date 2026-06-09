'use client';

import React, { useEffect, useState } from 'react';
import { atendimentoService, Atendimento } from '@/lib/services';
import { useAuth } from '@/context/AuthContext';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Layers,
  ArrowUpRight,
  Percent,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await atendimentoService.list();
        setAtendimentos(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar atendimentos.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div className="text-gradient-purple" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          Carregando indicadores...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <main className="main-content">
        <div className="card glass" style={{ borderColor: 'var(--status-atrasado-border)', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--status-atrasado-text)', marginBottom: '1rem' }}>Erro ao carregar dashboard</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  // 1. CÁLCULO DOS INDICADORES E REGRAS DE NEGÓCIO
  
  // Data atual local (formato YYYY-MM-DD)
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayDateString();

  // Em andamento
  const emAndamento = atendimentos.filter(a => a.status === 'em_andamento');
  
  // Concluídos
  const concluidos = atendimentos.filter(a => a.status === 'concluido');
  
  // Atrasados: data prevista de entrega anterior à data atual E status NÃO concluído
  const atrasados = atendimentos.filter(a => {
    return a.status !== 'concluido' && a.data_prevista_entrega < todayStr;
  });

  // Faturamento total (soma dos valores cobrados)
  const faturamentoTotal = atendimentos.reduce((sum, a) => sum + a.valor_cobrado, 0);

  // Custos totais (soma dos custos envolvidos)
  const custosTotais = atendimentos.reduce((sum, a) => sum + a.custos_envolvidos, 0);

  // Lucro Líquido
  const lucroLiquido = faturamentoTotal - custosTotais;

  // Percentual de serviços concluídos no prazo:
  // Compara data_conclusao com data_prevista_entrega para os concluídos
  const concluidosNoPrazo = concluidos.filter(a => {
    if (!a.data_conclusao) return false;
    return a.data_conclusao <= a.data_prevista_entrega;
  });
  
  const percentualNoPrazo = concluidos.length > 0
    ? Math.round((concluidosNoPrazo.length / concluidos.length) * 100)
    : 0;

  // 2. DADOS PARA O GRÁFICO DONUT (Serviços por Tipo)
  const tiposMap: { [tipo: string]: number } = {};
  atendimentos.forEach(a => {
    const tipo = a.tipo_servico || 'Outros';
    tiposMap[tipo] = (tiposMap[tipo] || 0) + 1;
  });

  const tiposData = Object.entries(tiposMap).map(([tipo, count]) => ({
    name: tipo,
    value: count,
  })).sort((a, b) => b.value - a.value);

  const totalServicos = atendimentos.length;

  // Paleta de cores para o Donut
  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  // 3. DADOS PARA O GRÁFICO DE EVOLUÇÃO MENSAL
  // Vamos agrupar por Ano-Mês de data_inicio nos últimos 6 meses
  const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Obter últimos 6 meses ordenados cronologicamente
  const getUltimosMeses = () => {
    const list = [];
    const date = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      list.push({
        key,
        name: `${mesesNomes[d.getMonth()]}/${String(d.getFullYear()).substring(2)}`,
        count: 0,
      });
    }
    return list;
  };

  const ultimosMeses = getUltimosMeses();
  atendimentos.forEach(a => {
    if (!a.data_inicio) return;
    const [year, month] = a.data_inicio.split('-');
    const key = `${year}-${month}`;
    const mesObj = ultimosMeses.find(m => m.key === key);
    if (mesObj) {
      mesObj.count += 1;
    }
  });

  // Desenhar SVG para o Donut
  const renderDonutChart = () => {
    if (totalServicos === 0) {
      return <div style={noDataStyle}>Nenhum serviço registrado</div>;
    }

    const radius = 50;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius; // ~314.16
    let accumulatedPercent = 0;

    return (
      <div style={donutWrapperStyle}>
        <svg width="200" height="200" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          {/* Círculo de background */}
          <circle 
            cx="70" 
            cy="70" 
            r={radius} 
            fill="transparent" 
            stroke="var(--bg-tertiary)" 
            strokeWidth={strokeWidth} 
          />
          
          {tiposData.map((item, idx) => {
            const percent = (item.value / totalServicos) * 100;
            const strokeDasharray = `${(percent * circumference) / 100} ${circumference}`;
            const strokeDashoffset = `${-(accumulatedPercent * circumference) / 100}`;
            accumulatedPercent += percent;
            const color = COLORS[idx % COLORS.length];

            return (
              <circle
                key={item.name}
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
              />
            );
          })}
        </svg>

        {/* Legendas */}
        <div style={legendContainerStyle}>
          {tiposData.map((item, idx) => {
            const percent = Math.round((item.value / totalServicos) * 100);
            const color = COLORS[idx % COLORS.length];
            return (
              <div key={item.name} style={legendItemStyle}>
                <span style={{ ...legendDotStyle, backgroundColor: color }} />
                <span style={legendNameStyle}>{item.name}</span>
                <span style={legendValStyle}>{item.value} ({percent}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Desenhar SVG para o Gráfico de Área (Evolução Mensal)
  const renderAreaChart = () => {
    const width = 500;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxVal = Math.max(...ultimosMeses.map(m => m.count), 3); // Mínimo de 3 para escala visual

    // Gerar pontos (X, Y)
    const points = ultimosMeses.map((m, idx) => {
      const x = paddingLeft + (idx / (ultimosMeses.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (m.count / maxVal) * chartHeight;
      return { x, y, name: m.name, count: m.count };
    });

    // Construir caminhos SVG
    const linePath = points.reduce((path, pt, idx) => {
      return path + `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y} `;
    }, '');

    const areaPath = points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : '';

    return (
      <div style={{ position: 'relative', width: '100%' }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          {/* Definições de Gradientes */}
          <defs>
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade de Fundo (Horizontais) */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = paddingTop + chartHeight * ratio;
            const val = Math.round(maxVal * (1 - ratio));
            return (
              <g key={idx}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="var(--border-color)" 
                  strokeWidth="1" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={paddingLeft - 10} 
                  y={y + 4} 
                  fill="var(--text-muted)" 
                  fontSize="10" 
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Desenho da Área com Gradiente */}
          {areaPath && (
            <path d={areaPath} fill="url(#chart-area-grad)" />
          )}

          {/* Desenho da Linha */}
          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              stroke="var(--primary)" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Pontos de dados e rótulos */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle 
                cx={pt.x} 
                cy={pt.y} 
                r="4" 
                fill="var(--bg-secondary)" 
                stroke="var(--primary)" 
                strokeWidth="2" 
              />
              <circle 
                cx={pt.x} 
                cy={pt.y} 
                r="8" 
                fill="var(--primary)" 
                opacity="0" 
                style={{ cursor: 'pointer' }}
                className="hover-point"
              >
                <title>{`${pt.count} atendimentos`}</title>
              </circle>
              {/* Rótulo de Eixo X */}
              <text 
                x={pt.x} 
                y={paddingTop + chartHeight + 20} 
                fill="var(--text-secondary)" 
                fontSize="11" 
                textAnchor="middle"
              >
                {pt.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <main className="main-content">
      {/* HEADER DO DASHBOARD */}
      <div style={headerWrapperStyle}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Painel <span className="text-gradient-purple">Gerencial</span>
          </h1>
          <p>Visão geral de desempenho, finanças e prazos da Bunn Studios.</p>
        </div>
        <Link href="/atendimentos/novo" className="btn btn-primary">
          Cadastrar Atendimento
          <ArrowUpRight size={16} />
        </Link>
      </div>

      {/* GRADE DE METRICAS PRINCIPAIS */}
      <div className="grid-metrics">
        {/* EM ANDAMENTO */}
        <div className="card" style={metricCardStyle}>
          <div style={metricHeaderStyle}>
            <span style={metricTitleStyle}>Em Andamento</span>
            <div style={{ ...iconWrapperStyle, color: 'var(--status-andamento-text)', backgroundColor: 'var(--status-andamento-bg)' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={metricValueStyle}>{emAndamento.length}</div>
          <div style={metricSubtextStyle}>Serviços ativos na agência</div>
        </div>

        {/* CONCLUIDOS */}
        <div className="card" style={metricCardStyle}>
          <div style={metricHeaderStyle}>
            <span style={metricTitleStyle}>Concluídos</span>
            <div style={{ ...iconWrapperStyle, color: 'var(--status-concluido-text)', backgroundColor: 'var(--status-concluido-bg)' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={metricValueStyle}>{concluidos.length}</div>
          <div style={metricSubtextStyle}>Total de entregas feitas</div>
        </div>

        {/* ATRASADOS */}
        <div className="card" style={{ 
          ...metricCardStyle, 
          borderColor: atrasados.length > 0 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)',
          boxShadow: atrasados.length > 0 ? '0 10px 30px -10px rgba(239, 68, 68, 0.15)' : 'var(--card-shadow)'
        }}>
          <div style={metricHeaderStyle}>
            <span style={metricTitleStyle}>Atrasados</span>
            <div style={{ 
              ...iconWrapperStyle, 
              color: 'var(--status-atrasado-text)', 
              backgroundColor: 'var(--status-atrasado-bg)' 
            }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ 
            ...metricValueStyle, 
            color: atrasados.length > 0 ? 'var(--status-atrasado-text)' : 'var(--text-primary)' 
          }}>{atrasados.length}</div>
          <div style={metricSubtextStyle}>Prazo de entrega expirado</div>
        </div>

        {/* PERCENTUAL NO PRAZO */}
        <div className="card" style={metricCardStyle}>
          <div style={metricHeaderStyle}>
            <span style={metricTitleStyle}>No Prazo %</span>
            <div style={{ ...iconWrapperStyle, color: 'var(--accent)', backgroundColor: 'rgba(6, 182, 212, 0.15)' }}>
              <Percent size={20} />
            </div>
          </div>
          <div style={metricValueStyle}>{percentualNoPrazo}%</div>
          <div style={metricSubtextStyle}>Taxa de entregas no prazo</div>
        </div>
      </div>

      {/* GRADE DE METRICAS FINANCEIRAS */}
      <div className="grid-metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '2rem' }}>
        {/* FATURAMENTO TOTAL */}
        <div className="card" style={financialCardStyle}>
          <div style={metricHeaderStyle}>
            <div>
              <span style={metricTitleStyle}>Faturamento Bruto</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Soma dos valores cobrados</p>
            </div>
            <div style={{ ...iconWrapperStyle, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={financialValueStyle}>
            {faturamentoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>

        {/* CUSTOS TOTAIS */}
        <div className="card" style={financialCardStyle}>
          <div style={metricHeaderStyle}>
            <div>
              <span style={metricTitleStyle}>Custos Envolvidos</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Soma de investimentos/custos</p>
            </div>
            <div style={{ ...iconWrapperStyle, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <TrendingUp size={20} style={{ transform: 'rotate(90deg)' }} />
            </div>
          </div>
          <div style={{ ...financialValueStyle, color: '#f87171' }}>
            {custosTotais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>

        {/* LUCRO LIQUIDO */}
        <div className="card" style={{ ...financialCardStyle, background: 'linear-gradient(135deg, rgba(25, 25, 44, 0.6) 0%, rgba(139, 92, 246, 0.1) 100%)' }}>
          <div style={metricHeaderStyle}>
            <div>
              <span style={metricTitleStyle}>Margem de Lucro</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Faturamento menos custos</p>
            </div>
            <div style={{ ...iconWrapperStyle, color: 'var(--primary)', backgroundColor: 'var(--primary-glow)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ ...financialValueStyle, color: 'var(--text-primary)' }}>
            {lucroLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
      </div>

      {/* GRADE DE GRAFICOS */}
      <div className="grid-charts">
        {/* GRAFICO 1: SERVIÇOS POR TIPO */}
        <div className="card" style={chartCardStyle}>
          <div style={chartHeaderStyle}>
            <Layers size={18} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.15rem' }}>Serviços por Tipo</h2>
          </div>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Distribuição de projetos e contratos ativos na agência por categoria.</p>
          {renderDonutChart()}
        </div>

        {/* GRAFICO 2: EVOLUÇÃO MENSAL */}
        <div className="card" style={chartCardStyle}>
          <div style={chartHeaderStyle}>
            <Calendar size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '1.15rem' }}>Evolução Mensal</h2>
          </div>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Número de atendimentos iniciados a cada mês (últimos 6 meses).</p>
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {renderAreaChart()}
          </div>
        </div>
      </div>
    </main>
  );
}

// ESTILOS INLINE AUXILIARES
const loadingContainerStyle: React.CSSProperties = {
  minHeight: '80vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const headerWrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  gap: '1.5rem',
  flexWrap: 'wrap',
};

const metricCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '1.5rem',
};

const metricHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem',
};

const metricTitleStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const iconWrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '38px',
  height: '38px',
  borderRadius: '10px',
};

const metricValueStyle: React.CSSProperties = {
  fontSize: '2.2rem',
  fontWeight: 700,
  lineHeight: '1',
  marginBottom: '0.5rem',
};

const metricSubtextStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
};

const financialCardStyle: React.CSSProperties = {
  padding: '1.5rem',
};

const financialValueStyle: React.CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: 700,
  marginTop: '0.5rem',
};

const chartCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '1.5rem 2rem',
};

const chartHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.5rem',
};

const donutWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  flexWrap: 'wrap',
  gap: '2rem',
  marginTop: '1rem',
};

const legendContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  flex: 1,
  minWidth: '180px',
};

const legendItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.85rem',
};

const legendDotStyle: React.CSSProperties = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  flexShrink: 0,
};

const legendNameStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const legendValStyle: React.CSSProperties = {
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const noDataStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '200px',
  color: 'var(--text-muted)',
  fontSize: '0.9rem',
};
