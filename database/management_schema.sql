-- SQL Executado com Sucesso para ativar a gestão de usuários e permissões

-- 1. Atualizar tabela de usuários com coluna de cargos
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'TECNICO';
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT;
UPDATE users SET role = 'ADMINISTRADOR' WHERE username = 'admin';

-- 2. Criar/Resetar tabela de permissões por cargo
DROP TABLE IF EXISTS role_permissions;
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT NOT NULL,
    module TEXT NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    UNIQUE(role_name, module)
);

-- 3. Inserir permissões Padrão (Administrador)
INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete)
VALUES 
('ADMINISTRADOR', 'Logs e Atividades', true, true, true, true),
('ADMINISTRADOR', 'Clientes e Contatos', true, true, true, true),
('ADMINISTRADOR', 'Infraestruturas', true, true, true, true),
('ADMINISTRADOR', 'Gestão de Usuários', true, true, true, true),
('ADMINISTRADOR', 'Controle de Versões', true, true, true, true);

-- 4. Inserir permissões Padrão (Técnico)
INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete)
VALUES 
('TECNICO', 'Logs e Atividades', true, false, false, false),
('TECNICO', 'Clientes e Contatos', true, true, true, false),
('TECNICO', 'Infraestruturas', true, true, true, false),
('TECNICO', 'Gestão de Usuários', false, false, false, false),
('TECNICO', 'Controle de Versões', true, true, true, false);

-- 5. Inserir permissões Padrão (Analista)
INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete)
VALUES 
('ANALISTA', 'Logs e Atividades', true, true, false, false),
('ANALISTA', 'Clientes e Contatos', true, true, true, false),
('ANALISTA', 'Infraestruturas', true, false, false, false),
('ANALISTA', 'Gestão de Usuários', false, false, false, false),
('ANALISTA', 'Controle de Versões', true, true, true, false);
-- 6. Habilitar RLS e Políticas de Acesso
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for users" ON users;
CREATE POLICY "Enable all access for users" ON users FOR ALL USING (true);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for roles" ON role_permissions;
CREATE POLICY "Enable all access for roles" ON role_permissions FOR ALL USING (true);
