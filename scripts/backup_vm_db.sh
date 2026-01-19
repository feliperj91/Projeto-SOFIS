#!/bin/bash
# Script de backup do banco de dados SOFIS
# Uso: ./backup_db.sh [nome_do_arquivo]

# Configurações
DB_NAME="sofis_db"
DB_USER="sofis_user"
BACKUP_DIR="${HOME}/Projeto-Sofis/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME=${1:-"backup_sofis_${TIMESTAMP}.sql"}

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

echo " iniciando backup do banco de dados: $DB_NAME..."
echo " salvando em: $BACKUP_DIR/$FILENAME"

# Executar pg_dump
pg_dump -h localhost -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/$FILENAME"

if [ $? -eq 0 ]; then
    echo "✅ Backup concluído com sucesso!"
    echo "Arquivo: $BACKUP_DIR/$FILENAME"
else
    echo "❌ Erro ao realizar backup. Verifique as credenciais e se o banco está rodando."
    exit 1
fi
