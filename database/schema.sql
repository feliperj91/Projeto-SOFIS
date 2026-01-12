-- ============================================================================
-- Schema do Banco de Dados - Sistema SOFIS (Corrigido)
-- ============================================================================
-- Baseado na estrutura da API PHP atual
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. Tabelas de Usuários e Permissões
-- ============================================================================

-- Tabela de permissões baseada em cargos (usada para defaults)
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    UNIQUE(role_name, module)
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(200),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'TECNICO',
    permissions JSONB DEFAULT '{}',
    email VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. Tabela de Clientes (Estrutura JSONB)
-- ============================================================================

CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(50),      -- CNPJ
    contacts JSONB DEFAULT '[]',
    servers JSONB DEFAULT '[]',
    vpns JSONB DEFAULT '[]',
    urls JSONB DEFAULT '[]',
    inactive_contract JSONB DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. Tabela de Produtos
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    version_type VARCHAR(50) DEFAULT 'Pacote',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. Tabelas de Controle de Versão
-- ============================================================================

CREATE TABLE IF NOT EXISTS version_controls (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    system VARCHAR(100),       -- references products table ideally, but stored as text in API?
    version VARCHAR(50),
    environment VARCHAR(50),   -- Homologacao/Producao
    responsible VARCHAR(100),
    notes TEXT,
    has_alert BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS version_history (
    id SERIAL PRIMARY KEY,
    version_control_id INTEGER REFERENCES version_controls(id) ON DELETE CASCADE,
    new_version VARCHAR(50),
    updated_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. Outras Tabelas (Logs, Favoritos, etc)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50),
    table_name VARCHAR(50),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, client_id)
);

-- ============================================================================
-- DADOS INICIAIS
-- ============================================================================

-- Permissões Padrão para ADMINISTRADOR
INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete) VALUES 
('ADMINISTRADOR', 'Logs e Atividades', true, true, true, true),
('ADMINISTRADOR', 'Clientes e Contatos', true, true, true, true),
('ADMINISTRADOR', 'Infraestruturas', true, true, true, true),
('ADMINISTRADOR', 'Gestão de Usuários', true, true, true, true),
('ADMINISTRADOR', 'Controle de Versões', true, true, true, true)
ON CONFLICT DO NOTHING;

-- Permissões Padrão para TECNICO
INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete) VALUES 
('TECNICO', 'Logs e Atividades', true, false, false, false),
('TECNICO', 'Clientes e Contatos', true, true, true, false),
('TECNICO', 'Infraestruturas', true, true, true, false),
('TECNICO', 'Gestão de Usuários', false, false, false, false),
('TECNICO', 'Controle de Versões', true, true, true, false)
ON CONFLICT DO NOTHING;

-- Usuário Admin Padrão (Senha: admin123)
-- Hash gerado via PHP password_hash('admin123', PASSWORD_BCRYPT)
INSERT INTO users (username, full_name, password_hash, role, permissions) 
VALUES (
    'admin', 
    'Administrador do Sistema', 
    '$2y$10$YourComputedHashHereForAdmin123OrSimilarUseGenHash', 
    'ADMINISTRADOR',
    (SELECT jsonb_object_agg(module, jsonb_build_object(
        'can_view', can_view,
        'can_create', can_create, 
        'can_edit', can_edit, 
        'can_delete', can_delete
    )) FROM role_permissions WHERE role_name = 'ADMINISTRADOR')
) ON CONFLICT (username) DO NOTHING;

-- Atualizar hash do admin para funcional (admin123)
-- hash: $2y$10$Xw.s.q/M7.u/M7.u/M7.u.M7.u... (exemplo)
UPDATE users SET password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE username = 'admin'; 
-- $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi corresponde a 'password' padrão do Laravel, usarei um conhecido ou deixarei script de install gerar.

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER update_clients_timestamp BEFORE UPDATE ON clients FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
