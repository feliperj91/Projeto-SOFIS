#!/bin/bash
# linux_admin_patch.sh
# Script para atualizar o schema do banco de dados na VM Linux com permissões de administrador (postgres)
# Execute este script na VM: ./linux_admin_patch.sh

echo "=========================================="
echo " SOFIS - Atualização de Schema (Admin)"
echo "=========================================="

# Verifica se o psql está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ Erro: psql não encontrado."
    exit 1
fi

echo "🔄 Executando comandos SQL como usuário 'postgres'..."

# Executa o SQL diretamente via sudo -u postgres psql
# Assume que o nome do banco é 'sofis_db'. Se for diferente, ajuste abaixo.
DB_NAME="sofis_db"

sudo -u postgres psql -d $DB_NAME -c "
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_reset BOOLEAN DEFAULT FALSE;
UPDATE users SET is_active = TRUE, force_password_reset = FALSE WHERE is_active IS NULL;
"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "=========================================="
    echo "✅ Atualização concluída com sucesso!"
    echo "=========================================="
else
    echo "=========================================="
    echo "❌ Falha na atualização. Verifique se o nome do banco de dados '$DB_NAME' está correto."
    echo "=========================================="
fi

exit $EXIT_CODE
