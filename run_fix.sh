#!/bin/bash

# Configurações do Banco
DB_NAME="sofis_db"
DB_USER="postgres"

echo "================================================"
echo "🛠️  Iniciando Correção de Permissões..."
echo "================================================"
echo "📝 Banco de Dados: $DB_NAME"
echo ""

# Executando o SQL
sudo -u $DB_USER psql -d $DB_NAME -c "
BEGIN;

-- 1. Renomear módulo
UPDATE role_permissions 
SET module = 'Produtos' 
WHERE module = 'Controle de Versões - Produtos';

-- 2. Sincronizar usuários
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
    echo "✅ SUCESSO! Módulos renomeados e permissões sincronizadas."
    echo "👉 Agora faça LOGOUT e LOGIN no sistema."
else
    echo ""
    echo "❌ ERRO! Não foi possível executar o script."
    echo "Verifique se o nome do banco '$DB_NAME' está correto."
fi
echo "================================================"
