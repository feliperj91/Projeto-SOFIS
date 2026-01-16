#!/bin/bash
# update_db_linux.sh
# Script para atualizar o schema do banco de dados na VM Linux
# Execute este script a partir da raiz do projeto: ./update_db_linux.sh

# Garante que estamos no diretório do script (ou raiz se estiver na raiz)
cd "$(dirname "$0")"

echo "=========================================="
echo " SOFIS - Atualização de Banco de Dados"
echo "=========================================="

if ! command -v php &> /dev/null; then
    echo "❌ Erro: PHP não encontrado no PATH."
    echo "Por favor, instale o PHP ou adicione ao PATH."
    exit 1
fi

echo "🔄 Executando patch de schema (api/fix_schema.php)..."

# Executa o script PHP
php api/fix_schema.php

# Captura o código de saída
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "=========================================="
    echo "✅ Atualização concluída com sucesso!"
    echo "=========================================="
else
    echo "=========================================="
    echo "❌ Falha na atualização. Verifique as mensagens de erro acima."
    echo "=========================================="
fi

exit $EXIT_CODE
