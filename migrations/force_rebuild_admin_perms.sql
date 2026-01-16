-- ================================================================
-- FORÇAR atualização completa das permissões do admin
-- ================================================================

BEGIN;

-- Deletar TODAS as permissões do usuário admin primeiro
UPDATE users 
SET permissions = '{}'::text 
WHERE username = 'admin';

-- Agora reconstruir CORRETAMENTE do zero
UPDATE users 
SET permissions = (
    SELECT json_object_agg(
        rp.module,
        json_build_object(
            'can_view', rp.can_view,
            'can_create', rp.can_create,
            'can_edit', rp.can_edit,
            'can_delete', rp.can_delete
        )
    )::text
    FROM role_permissions rp
    WHERE rp.role_name = (SELECT role FROM users WHERE username = 'admin')
)
WHERE username = 'admin';

COMMIT;

-- Verificar resultado - listar TODOS os módulos
SELECT 'Módulos nas permissões do admin:' as info;
SELECT json_object_keys(permissions::json) as modulo 
FROM users 
WHERE username = 'admin'
ORDER BY modulo;
