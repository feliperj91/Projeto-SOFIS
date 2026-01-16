-- ================================================================
-- Forçar sincronização manual de permissões
-- ================================================================

-- Primeiro, vamos ver qual é o usuário admin
DO $$
DECLARE
    admin_role TEXT;
    admin_id INT;
BEGIN
    -- Pegar o usuário admin
    SELECT id, role INTO admin_id, admin_role FROM users WHERE username = 'admin';
    
    RAISE NOTICE 'Admin ID: %, Role: %', admin_id, admin_role;
    
    -- Forçar atualização das permissões do admin diretamente
    UPDATE users 
    SET permissions = (
        SELECT json_object_agg(module, 
            json_build_object(
                'can_view', can_view,
                'can_create', can_create, 
                'can_edit', can_edit,
                'can_delete', can_delete
            )
        )::text
        FROM role_permissions
        WHERE role_name = admin_role
    )
    WHERE id = admin_id;
    
    RAISE NOTICE 'Permissões atualizadas para admin!';
END $$;

-- Verificar resultado
SELECT username, role, LEFT(permissions, 100) as perms_preview 
FROM users 
WHERE username = 'admin';
