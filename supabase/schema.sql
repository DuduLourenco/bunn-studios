-- 
-- SCHEMA SQL PARA APLICAÇÃO BUNN STUDIOS
-- 

-- Limpar banco de dados (se necessário recriar)
DROP TABLE IF EXISTS public.atendimentos CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- Habilitar extensão UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PERFIS DE USUÁRIOS
-- Relacionada com a tabela auth.users do Supabase Auth
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
    precisa_trocar_senha BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS nos perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para perfis
CREATE POLICY "Qualquer usuário autenticado pode ler perfis" 
    ON public.profiles FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas administradores podem atualizar perfis" 
    ON public.profiles FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. TABELA DE ATENDIMENTOS / SERVIÇOS
CREATE TABLE public.atendimentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_nome TEXT NOT NULL,
    cliente_empresa TEXT NOT NULL,
    tipo_servico TEXT NOT NULL,
    descricao TEXT,
    valor_cobrado NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    custos_envolvidos NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    data_inicio DATE NOT NULL,
    data_prevista_entrega DATE NOT NULL,
    data_conclusao DATE,
    status TEXT NOT NULL CHECK (status IN ('agendado', 'em_andamento', 'concluido')) DEFAULT 'agendado',
    observacoes TEXT,
    criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em atendimentos
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para atendimentos
CREATE POLICY "Funcionários e admins podem ver todos os atendimentos" 
    ON public.atendimentos FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Funcionários e admins podem criar atendimentos" 
    ON public.atendimentos FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Apenas administradores podem editar atendimentos" 
    ON public.atendimentos FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Apenas administradores podem excluir atendimentos" 
    ON public.atendimentos FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. TRIGGERS E FUNÇÕES AUTOMÁTICAS

-- Função para atualizar o timestamp 'atualizado_em' automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para perfis
CREATE TRIGGER trigger_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para atendimentos
CREATE TRIGGER trigger_updated_at_atendimentos
    BEFORE UPDATE ON public.atendimentos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Função para criar automaticamente um perfil ao criar um novo usuário no Auth do Supabase
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role TEXT := 'employee';
    force_password_change BOOLEAN := true;
BEGIN
    -- Se for o primeiro usuário a se registrar, podemos promovê-lo a admin e ele não precisa trocar a senha inicial
    IF NOT EXISTS (SELECT 1 FROM public.profiles) THEN
        default_role := 'admin';
        force_password_change := false;
    END IF;

    INSERT INTO public.profiles (id, email, role, precisa_trocar_senha)
    VALUES (NEW.id, NEW.email, default_role, force_password_change);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger na tabela auth.users do Supabase
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. INSERÇÃO DE DADOS DE EXEMPLO (OPCIONAL)
-- Nota: Para testar no Supabase local, você precisará ter usuários criados para referenciar no campo criado_por.
-- Caso use dados de exemplo locais sem Supabase, a aplicação cuidará de inicializar o LocalStorage com exemplos.
