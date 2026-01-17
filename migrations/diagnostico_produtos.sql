-- Diagnóstico de Permissões do Módulo Produtos
-- Execute este script para verificar o estado atual

-- 1. Verificar módulos existentes com 'Produto' no nome
SELECT 'Módulos com Produto/Versão:' as check_type;
SELECT role_name, module, can_view, can_create, can_edit, can_delete 
FROM role_permissions 
WHERE module LIKE '%Produto%' OR module LIKE '%Versõ%'
ORDER BY module, role_name;

-- 2. Verificar se algum usuário tem o módulo antigo nas permissões
SELECT 'Usuários com módulo antigo no JSON:' as check_type;
SELECT username, role, 
       CASE 
           WHEN permissions::text LIKE '%Controle de Versões - Produtos%' THEN 'SIM - precisa sincronizar'
           ELSE 'OK'
       END as status_antigo,
       CASE 
           WHEN permissions::text LIKE '%Produtos%' THEN 'SIM'
           ELSE 'NÃO - precisa sincronizar'
       END as tem_produtos
FROM users
WHERE role IS NOT NULL;

-- 3. Forçar sincronização imediata de todos os usuários
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

-- 4. Verificar resultado final
SELECT 'Resultado após sincronização:' as check_type;
SELECT username, role,
       CASE 
           WHEN permissions::text LIKE '%"Produtos"%' THEN '✓ Produtos'
           ELSE '✗ Sem Produtos'
       END as status
FROM users
WHERE role IS NOT NULL;
