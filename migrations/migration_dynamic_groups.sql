-- Migration: Transição para Grupos Dinâmicos
-- Objetivo: Permitir criação e exclusão de grupos de acesso

-- 1. Criar tabela de grupos/roles se não existir
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Migrar grupos existentes para a nova tabela
INSERT INTO user_roles (name, description) VALUES 
('ADMINISTRADOR', 'Acesso total ao sistema'),
('TECNICO', 'Acesso operacional padrão'),
('ANALISTA', 'Acesso a relatórios e visualização')
ON CONFLICT (name) DO NOTHING;

-- 3. Garantir que as permissões existentes estão sincronizadas
-- (Já existem no banco, mas podemos reforçar)

-- 4. Adicionar FK opcional na tabela users (mantendo compatibilidade com o texto atual)
-- Note: Manteremos a coluna 'role' como VARCHAR por enquanto para não quebrar o código PHP legado,
-- mas a interface passará a ler da tabela user_roles.
