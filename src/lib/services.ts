import { supabase, isSupabaseConfigured } from './db';

// TYPES
export type UserRole = 'admin' | 'employee';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  precisa_trocar_senha?: boolean;
}

export interface Atendimento {
  id: string;
  cliente_nome: string;
  cliente_empresa: string;
  tipo_servico: string;
  descricao: string;
  valor_cobrado: number;
  custos_envolvidos: number;
  data_inicio: string; // Formato YYYY-MM-DD
  data_prevista_entrega: string; // Formato YYYY-MM-DD
  data_conclusao?: string; // Formato YYYY-MM-DD ou vazio
  status: 'agendado' | 'em_andamento' | 'concluido';
  observacoes: string;
  criado_por?: string;
  criado_em?: string;
  atualizado_em?: string;
}

// MOCK DATA PARA LOCALSTORAGE FALLBACK
const MOCK_USERS: { [email: string]: { id: string; email: string; role: UserRole; password: string; precisa_trocar_senha?: boolean } } = {
  'admin@bunn.com': { id: 'admin-uuid-1111', email: 'admin@bunn.com', role: 'admin', password: 'admin123', precisa_trocar_senha: false },
  'func@bunn.com': { id: 'employee-uuid-2222', email: 'func@bunn.com', role: 'employee', password: 'func123', precisa_trocar_senha: true },
};

const INITIAL_MOCK_SERVICES: Atendimento[] = [
  {
    id: 'srv-1',
    cliente_nome: 'Roberto Santos',
    cliente_empresa: 'Padaria Bella Vista',
    tipo_servico: 'Gestão de Redes Sociais',
    descricao: 'Planejamento e publicação de 12 posts mensais no Instagram e Facebook, além de gestão de tráfego pago básico.',
    valor_cobrado: 1500.00,
    custos_envolvidos: 450.00,
    data_inicio: '2026-05-10',
    data_prevista_entrega: '2026-06-10', // Em andamento, no prazo
    status: 'em_andamento',
    observacoes: 'Cliente enviou as fotos dos produtos. Foco em engajamento local.',
    criado_por: 'admin-uuid-1111',
    criado_em: '2026-05-10T12:00:00Z',
    atualizado_em: '2026-05-10T12:00:00Z',
  },
  {
    id: 'srv-2',
    cliente_nome: 'Juliana Costa',
    cliente_empresa: 'Clínica Sorriso Clean',
    tipo_servico: 'Desenvolvimento de Site',
    descricao: 'Criação de landing page profissional em React/Next.js para agendamento de consultas odontológicas.',
    valor_cobrado: 5200.00,
    custos_envolvidos: 1800.00,
    data_inicio: '2026-04-15',
    data_prevista_entrega: '2026-05-20',
    data_conclusao: '2026-05-18', // Concluído no prazo!
    status: 'concluido',
    observacoes: 'Site publicado no Vercel. Integração com Whatsapp funcionando perfeitamente.',
    criado_por: 'admin-uuid-1111',
    criado_em: '2026-04-15T09:00:00Z',
    atualizado_em: '2026-05-18T18:30:00Z',
  },
  {
    id: 'srv-3',
    cliente_nome: 'Marcos Almeida',
    cliente_empresa: 'Oficina Turbo Car',
    tipo_servico: 'Gestão de Redes Sociais',
    descricao: 'Gestão de anúncios no Google Maps e Facebook Ads para atração de serviços de funilaria e pintura.',
    valor_cobrado: 1800.00,
    custos_envolvidos: 600.00,
    data_inicio: '2026-05-01',
    data_prevista_entrega: '2026-06-01', // Atrasado (hoje é 2026-06-08 e não está concluído)
    status: 'em_andamento',
    observacoes: 'Atrasado aguardando aprovação do criativo do anúncio pelo cliente.',
    criado_por: 'employee-uuid-2222',
    criado_em: '2026-05-01T14:20:00Z',
    atualizado_em: '2026-05-01T14:20:00Z',
  },
  {
    id: 'srv-4',
    cliente_nome: 'Amanda Lima',
    cliente_empresa: 'Moda Elegance',
    tipo_servico: 'Identidade Visual',
    descricao: 'Redesign de logotipo, paleta de cores, tipografia e criação de manual da marca.',
    valor_cobrado: 3200.00,
    custos_envolvidos: 400.00,
    data_inicio: '2026-06-05',
    data_prevista_entrega: '2026-06-25', // Agendado
    status: 'agendado',
    observacoes: 'Reunião de briefing agendada para início do projeto visual.',
    criado_por: 'admin-uuid-1111',
    criado_em: '2026-06-05T10:00:00Z',
    atualizado_em: '2026-06-05T10:00:00Z',
  },
  {
    id: 'srv-5',
    cliente_nome: 'Carlos Eduardo',
    cliente_empresa: 'Academia FitLife',
    tipo_servico: 'Desenvolvimento de Site',
    descricao: 'Desenvolvimento de portal institucional com área de membros e planos de assinatura.',
    valor_cobrado: 8500.00,
    custos_envolvidos: 2500.00,
    data_inicio: '2026-03-01',
    data_prevista_entrega: '2026-04-15',
    data_conclusao: '2026-04-20', // Concluído fora do prazo (Atrasado na entrega)
    status: 'concluido',
    observacoes: 'Integração de pagamento com API externa causou atraso de 5 dias na entrega.',
    criado_por: 'employee-uuid-2222',
    criado_em: '2026-03-01T08:00:00Z',
    atualizado_em: '2026-04-20T17:00:00Z',
  }
];

// Funções utilitárias auxiliares para LocalStorage
const getLocalStorageData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Erro ao ler do localStorage', error);
    return defaultValue;
  }
};

const setLocalStorageData = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Erro ao salvar no localStorage', error);
  }
};

// Inicializa dados de simulação
const initMockDatabase = () => {
  if (typeof window === 'undefined') return;
  const existing = localStorage.getItem('bunn_atendimentos');
  if (!existing) {
    localStorage.setItem('bunn_atendimentos', JSON.stringify(INITIAL_MOCK_SERVICES));
  }
};

// INTERFACES DO SERVIÇO
export const authService = {
  async login(email: string, password: string): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Falha ao autenticar no Supabase.');
      }

      // Buscar perfil associado
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        throw new Error(profileError?.message || 'Perfil do usuário não encontrado.');
      }

      const user: UserProfile = {
        id: profileData.id,
        email: profileData.email,
        role: profileData.role as UserRole,
        precisa_trocar_senha: profileData.precisa_trocar_senha,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('bunn_current_user', JSON.stringify(user));
      }
      return user;
    } else {
      // Simulação Local Storage
      const user = MOCK_USERS[email.trim().toLowerCase()];
      if (!user || user.password !== password) {
        throw new Error('Usuário ou senha incorretos (Simulador local). Use admin@bunn.com (senha: admin123) ou func@bunn.com (senha: func123).');
      }
      
      const profile: UserProfile = {
        id: user.id,
        email: user.email,
        role: user.role,
        precisa_trocar_senha: user.precisa_trocar_senha,
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('bunn_current_user', JSON.stringify(profile));
      }
      return profile;
    }
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bunn_current_user');
    }
  },

  async listEmployees(): Promise<UserProfile[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) throw new Error(error.message);
      return data as UserProfile[];
    } else {
      return Object.values(MOCK_USERS);
    }
  },

  async adminCreateUser(email: string, password: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Você precisa estar logado.");

      const response = await fetch('/api/funcionarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar funcionário');
      }
    } else {
      if (!MOCK_USERS[email]) {
        MOCK_USERS[email] = {
          id: 'mock-' + Math.random().toString(36).substr(2, 9),
          email,
          role: 'employee',
          password,
          precisa_trocar_senha: true
        };
      }
    }
  },

  async updatePassword(newPassword: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Usuário não autenticado.");

    if (isSupabaseConfigured && supabase) {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw new Error(updateError.message);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ precisa_trocar_senha: false })
        .eq('id', currentUser.id);

      if (profileError) throw new Error(profileError.message);

      currentUser.precisa_trocar_senha = false;
      if (typeof window !== 'undefined') {
        localStorage.setItem('bunn_current_user', JSON.stringify(currentUser));
      }
    } else {
      // Simulação Local Storage
      const mockUserKey = Object.keys(MOCK_USERS).find(
        key => MOCK_USERS[key].email.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (mockUserKey) {
        MOCK_USERS[mockUserKey].password = newPassword;
        MOCK_USERS[mockUserKey].precisa_trocar_senha = false;
      }
      
      currentUser.precisa_trocar_senha = false;
      if (typeof window !== 'undefined') {
        localStorage.setItem('bunn_current_user', JSON.stringify(currentUser));
      }
    }
  },

  getCurrentUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('bunn_current_user');
    return user ? JSON.parse(user) : null;
  }
};

export const atendimentoService = {
  async list(): Promise<Atendimento[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .order('criado_em', { ascending: false });
        
      if (error) {
        throw new Error(error.message);
      }
      
      return (data || []).map(item => ({
        id: item.id,
        cliente_nome: item.cliente_nome,
        cliente_empresa: item.cliente_empresa,
        tipo_servico: item.tipo_servico,
        descricao: item.descricao || '',
        valor_cobrado: Number(item.valor_cobrado),
        custos_envolvidos: Number(item.custos_envolvidos),
        data_inicio: item.data_inicio,
        data_prevista_entrega: item.data_prevista_entrega,
        data_conclusao: item.data_conclusao || undefined,
        status: item.status as Atendimento['status'],
        observacoes: item.observacoes || '',
        criado_por: item.criado_por,
        criado_em: item.criado_em,
        atualizado_em: item.atualizado_em,
      }));
    } else {
      // Simulação Local Storage
      initMockDatabase();
      return getLocalStorageData<Atendimento[]>('bunn_atendimentos', INITIAL_MOCK_SERVICES);
    }
  },

  async getById(id: string): Promise<Atendimento | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') return null; // Não encontrado
        throw new Error(error.message);
      }
      
      return {
        id: data.id,
        cliente_nome: data.cliente_nome,
        cliente_empresa: data.cliente_empresa,
        tipo_servico: data.tipo_servico,
        descricao: data.descricao || '',
        valor_cobrado: Number(data.valor_cobrado),
        custos_envolvidos: Number(data.custos_envolvidos),
        data_inicio: data.data_inicio,
        data_prevista_entrega: data.data_prevista_entrega,
        data_conclusao: data.data_conclusao || undefined,
        status: data.status as Atendimento['status'],
        observacoes: data.observacoes || '',
        criado_por: data.criado_por,
        criado_em: data.criado_em,
        atualizado_em: data.atualizado_em,
      };
    } else {
      // Simulação Local Storage
      initMockDatabase();
      const list = getLocalStorageData<Atendimento[]>('bunn_atendimentos', INITIAL_MOCK_SERVICES);
      return list.find(item => item.id === id) || null;
    }
  },

  async create(data: Omit<Atendimento, 'id' | 'criado_em' | 'atualizado_em' | 'criado_por'>): Promise<Atendimento> {
    const currentUser = authService.getCurrentUser();
    
    if (isSupabaseConfigured && supabase) {
      const payload = {
        cliente_nome: data.cliente_nome,
        cliente_empresa: data.cliente_empresa,
        tipo_servico: data.tipo_servico,
        descricao: data.descricao,
        valor_cobrado: Number(data.valor_cobrado),
        custos_envolvidos: Number(data.custos_envolvidos),
        data_inicio: data.data_inicio,
        data_prevista_entrega: data.data_prevista_entrega,
        data_conclusao: data.data_conclusao || null,
        status: data.status,
        observacoes: data.observacoes,
        criado_por: currentUser?.id || null
      };

      const { data: result, error } = await supabase
        .from('atendimentos')
        .insert([payload])
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return {
        ...result,
        valor_cobrado: Number(result.valor_cobrado),
        custos_envolvidos: Number(result.custos_envolvidos),
      };
    } else {
      // Simulação Local Storage
      initMockDatabase();
      const list = getLocalStorageData<Atendimento[]>('bunn_atendimentos', INITIAL_MOCK_SERVICES);
      
      const newAtendimento: Atendimento = {
        ...data,
        id: 'srv-' + Math.random().toString(36).substr(2, 9),
        criado_por: currentUser?.id || 'admin-uuid-1111',
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };
      
      list.unshift(newAtendimento);
      setLocalStorageData('bunn_atendimentos', list);
      return newAtendimento;
    }
  },

  async update(id: string, data: Partial<Atendimento>): Promise<Atendimento> {
    const currentUser = authService.getCurrentUser();
    // Proteção de Perfil no frontend/backend: apenas admin pode editar
    if (currentUser && currentUser.role !== 'admin') {
      throw new Error('Apenas usuários com perfil Administrador podem editar atendimentos.');
    }

    if (isSupabaseConfigured && supabase) {
      const payload: Record<string, any> = {};
      if (data.cliente_nome !== undefined) payload.cliente_nome = data.cliente_nome;
      if (data.cliente_empresa !== undefined) payload.cliente_empresa = data.cliente_empresa;
      if (data.tipo_servico !== undefined) payload.tipo_servico = data.tipo_servico;
      if (data.descricao !== undefined) payload.descricao = data.descricao;
      if (data.valor_cobrado !== undefined) payload.valor_cobrado = Number(data.valor_cobrado);
      if (data.custos_envolvidos !== undefined) payload.custos_envolvidos = Number(data.custos_envolvidos);
      if (data.data_inicio !== undefined) payload.data_inicio = data.data_inicio;
      if (data.data_prevista_entrega !== undefined) payload.data_prevista_entrega = data.data_prevista_entrega;
      payload.data_conclusao = data.data_conclusao || null;
      if (data.status !== undefined) payload.status = data.status;
      if (data.observacoes !== undefined) payload.observacoes = data.observacoes;

      const { data: result, error } = await supabase
        .from('atendimentos')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return {
        ...result,
        valor_cobrado: Number(result.valor_cobrado),
        custos_envolvidos: Number(result.custos_envolvidos),
      };
    } else {
      // Simulação Local Storage
      initMockDatabase();
      const list = getLocalStorageData<Atendimento[]>('bunn_atendimentos', INITIAL_MOCK_SERVICES);
      const idx = list.findIndex(item => item.id === id);
      if (idx === -1) {
        throw new Error('Atendimento não encontrado.');
      }
      
      const updatedItem: Atendimento = {
        ...list[idx],
        ...data,
        valor_cobrado: data.valor_cobrado !== undefined ? Number(data.valor_cobrado) : list[idx].valor_cobrado,
        custos_envolvidos: data.custos_envolvidos !== undefined ? Number(data.custos_envolvidos) : list[idx].custos_envolvidos,
        data_conclusao: data.status === 'concluido' ? (data.data_conclusao || new Date().toISOString().split('T')[0]) : undefined,
        atualizado_em: new Date().toISOString(),
      };

      // Se mudar o status de Concluído para outro, limpa a data de conclusão
      if (data.status && data.status !== 'concluido') {
        delete updatedItem.data_conclusao;
      }
      
      list[idx] = updatedItem;
      setLocalStorageData('bunn_atendimentos', list);
      return updatedItem;
    }
  },

  async delete(id: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    // Proteção de Perfil no frontend/backend: apenas admin pode excluir
    if (currentUser && currentUser.role !== 'admin') {
      throw new Error('Apenas usuários com perfil Administrador podem excluir atendimentos.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('atendimentos')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw new Error(error.message);
      }
    } else {
      // Simulação Local Storage
      initMockDatabase();
      const list = getLocalStorageData<Atendimento[]>('bunn_atendimentos', INITIAL_MOCK_SERVICES);
      const filtered = list.filter(item => item.id !== id);
      setLocalStorageData('bunn_atendimentos', filtered);
    }
  }
};
