#!/bin/bash

# Configurações do Banco
DB_NAME="sofis_db"
DB_USER="postgres"

echo "================================================"
echo "🛠️  Corrigindo Conflitos de Permissões..."
echo "================================================"

# Executando o SQL
sudo -u $DB_USER psql -d $DB_NAME -c "
BEGIN;

-- 1. Primeiro, removemos as permissões antigas duplicadas para evitar o erro
DELETE FROM role_permissions 
WHERE module = 'Controle de Versões - Produtos';

-- 2. Garantimos que 'Produtos' existe e está correto para todas as roles
-- Usamos UPSERT (INSERT ON CONFLICT) para atualizar se já existir
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

-- 3. Sincronizar permissões de TODOS os usuários
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

COMMIT;
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCESSO! Permissões corrigidas sem conflitos."
    echo "👉 Agora faça LOGOUT e LOGIN no sistema."
else
    echo ""
    echo "❌ ERRO! Algo deu errado."
fi
echo "================================================"
