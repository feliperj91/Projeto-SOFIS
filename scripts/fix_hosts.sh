#!/bin/bash
# Script para corrigir o banco de dados (Adicionar coluna hosts)
# Execute este script no servidor Linux

echo "Tentando aplicar a correção no banco de dados 'sofis_db'..."

# Tenta rodar como usuário 'postgres' (padrão em muitas instalações)
if command -v sudo >/dev/null 2>&1; then
    sudo -u postgres psql -d sofis_db -c "ALTER TABLE clients ADD COLUMN IF NOT EXISTS hosts JSONB DEFAULT '[]';"
else
    # Se não tiver sudo, tenta rodar direto (assumindo que o usuário atual tem acesso)
    psql -d sofis_db -c "ALTER TABLE clients ADD COLUMN IF NOT EXISTS hosts JSONB DEFAULT '[]';"
fi

if [ $? -eq 0 ]; then
    echo "✅ Sucesso! Coluna 'hosts' verificada/criada."
else
    echo "❌ Erro ao tentar corrigir. Verifique se o banco 'sofis_db' existe e se você tem permissão."
fi
