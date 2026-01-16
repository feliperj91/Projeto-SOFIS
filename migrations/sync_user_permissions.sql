-- ================================================================
-- Sincronizar permissões dos usuários com role_permissions
-- ================================================================

BEGIN;

UPDATE users
SET permissions = (
    SELECT json_object_agg(module, perms)
    FROM (
        SELECT 
            module,
            json_build_object(
                'can_view', can_view,
                'can_create', can_create,
                'can_edit', can_edit,
                'can_delete', can_delete
            ) as perms
        FROM role_permissions
        WHERE role_name = users.role
    ) AS module_perms
)::text;

COMMIT;
