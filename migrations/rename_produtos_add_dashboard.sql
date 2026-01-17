-- ================================================================
-- Renomear "Controle de Versões - Produtos" para "Produtos"
-- Criar novo módulo "Dashboard"
-- ================================================================

BEGIN;

-- 1. Renomear módulo existente
UPDATE role_permissions 
SET module = 'Produtos' 
WHERE module = 'Controle de Versões - Produtos';

-- 2. Criar módulo "Dashboard" copiando permissões de "Controle de Versões"
INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete)
SELECT 
    role_name, 
    'Dashboard' as module,
    can_view,
    FALSE as can_create,
    FALSE as can_edit,
    FALSE as can_delete
FROM role_permissions 
WHERE module = 'Controle de Versões'
ON CONFLICT (role_name, module) DO NOTHING;

-- 3. Sincronizar permissões de todos os usuários
UPDATE users 
SET permissions = (
    SELECT json_object_agg(
        module,
        json_build_object(
            'can_view', can_view,
            'can_create', can_create,
            'can_edit', can_edit,
            'can_delete', can_delete
        )
    )::text
    FROM role_permissions
    WHERE role_name = users.role
);

COMMIT;

-- Verificar
SELECT 'Módulos atualizados:' as status;
SELECT DISTINCT module FROM role_permissions WHERE module IN ('Produtos', 'Dashboard') ORDER BY module;
