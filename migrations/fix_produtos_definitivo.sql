-- ================================================================
-- FIX DEFINITIVO: Permissões do Módulo "Produtos"
-- Este script garante que tudo está correto
-- ================================================================

BEGIN;

-- 1. LIMPAR qualquer módulo antigo
DELETE FROM role_permissions 
WHERE module = 'Controle de Versões - Produtos';

-- 2. GARANTIR que o módulo "Produtos" existe para todas as roles
INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete)
VALUES 
    ('ADMIN', 'Produtos', TRUE, TRUE, TRUE, TRUE),
    ('TECNICO', 'Produtos', TRUE, TRUE, TRUE, TRUE),
    ('VISUALIZADOR', 'Produtos', TRUE, FALSE, FALSE, FALSE)
ON CONFLICT (role_name, module) 
DO UPDATE SET 
    can_view = EXCLUDED.can_view,
    can_create = EXCLUDED.can_create,
    can_edit = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete;

-- 3. GARANTIR que o módulo "Dashboard" existe
INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete)
VALUES 
    ('ADMIN', 'Dashboard', TRUE, FALSE, FALSE, FALSE),
    ('TECNICO', 'Dashboard', TRUE, FALSE, FALSE, FALSE),
    ('VISUALIZADOR', 'Dashboard', TRUE, FALSE, FALSE, FALSE)
ON CONFLICT (role_name, module) 
DO UPDATE SET can_view = EXCLUDED.can_view;

-- 4. FORÇAR sincronização de TODOS os usuários
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
)
WHERE role IS NOT NULL AND role != '';

COMMIT;

-- Verificação Final
SELECT '=== VERIFICAÇÃO FINAL ===' as status;
SELECT role_name, module, can_view, can_create, can_edit, can_delete 
FROM role_permissions 
WHERE module IN ('Produtos', 'Dashboard')
ORDER BY module, role_name;

SELECT '=== USUÁRIOS SINCRONIZADOS ===' as status;
SELECT username, role,
       CASE 
           WHEN permissions::text LIKE '%"Produtos"%' THEN '✓'
           ELSE '✗ ERRO'
       END as tem_produtos,
       CASE 
           WHEN permissions::text LIKE '%"Dashboard"%' THEN '✓'
           ELSE '✗ ERRO'
       END as tem_dashboard
FROM users
WHERE role IS NOT NULL
ORDER BY username;
