-- ================================================================
-- FIX URGENTE: Renomear Produtos no Banco de Dados
-- COPIE E COLE ESTE SQL NO pgAdmin
-- ================================================================

-- 1. Renomear o módulo
UPDATE role_permissions 
SET module = 'Produtos' 
WHERE module = 'Controle de Versões - Produtos';

-- 2. Sincronizar TODOS os usuários (forçado)
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
WHERE role IS NOT NULL;

-- 3. Verificar
SELECT 'Verificação:' as status;
SELECT username, 
       CASE 
           WHEN permissions::text LIKE '%"Produtos"%' THEN '✓ OK'
           ELSE '✗ ERRO - faça logout/login'
       END as tem_produtos
FROM users
WHERE role = 'TECNICO';
