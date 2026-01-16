-- ================================================================
-- FORÇAR criação dos novos módulos (SEM verificações)
-- ================================================================

BEGIN;

-- 1. Criar módulo "Usuários" para cada role existente
INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete)
SELECT 
    role_name, 
    'Usuários' as module,
    can_view,
    can_create,
    can_edit,
    can_delete
FROM role_permissions 
WHERE module = 'Gestão de Usuários';

-- 2. Criar módulo "Permissões" para cada role
INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete)
SELECT 
    role_name, 
    'Permissões' as module,
    can_view,
    FALSE as can_create,
    can_edit,
    FALSE as can_delete
FROM role_permissions 
WHERE module = 'Gestão de Usuários';

-- 3. Criar módulo "Logs de Auditoria" para cada role
INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete)
SELECT 
    role_name, 
    'Logs de Auditoria' as module,
    can_view,
    can_view as can_create,  -- can_create = can_export_pdf
    FALSE as can_edit,
    FALSE as can_delete
FROM role_permissions 
WHERE module = 'Gestão de Usuários';

-- 4. Criar módulo "Servidores" copiando de SQL
INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete)
SELECT 
    role_name, 
    'Servidores' as module,
    can_view,
    can_create,
    can_edit,
    can_delete
FROM role_permissions 
WHERE module = 'Dados de Acesso (SQL)';

-- 5. Deletar o módulo antigo "Gestão de Usuários"
DELETE FROM role_permissions WHERE module = 'Gestão de Usuários';

COMMIT;

-- Verificar
SELECT 'Novos módulos criados:' as status;
SELECT DISTINCT module FROM role_permissions WHERE module IN ('Usuários', 'Permissões', 'Logs de Auditoria', 'Servidores');
