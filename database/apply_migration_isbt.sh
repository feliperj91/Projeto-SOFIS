#!/bin/bash

# Script para aplicar a migração ISBT no banco de dados SOFIS
# Autor: Sistema SOFIS
# Data: 29/01/2026

echo "=================================================="
echo "  🔧 Aplicando Migração ISBT no Banco de Dados"
echo "=================================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações do banco de dados
DB_NAME="sofis_db"
DB_USER="sofis_user"
MIGRATION_FILE="database/migration_isbt.sql"

# Verificar se o arquivo de migração existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Erro: Arquivo de migração não encontrado em $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Informações da Migração:${NC}"
echo "   - Banco de Dados: $DB_NAME"
echo "   - Usuário: $DB_USER"
echo "   - Arquivo: $MIGRATION_FILE"
echo ""

# Perguntar confirmação
read -p "Deseja continuar com a migração? (s/N): " confirm
if [[ ! $confirm =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Migração cancelada pelo usuário.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Executando migração...${NC}"

# Executar a migração
sudo -u postgres psql -d "$DB_NAME" -f "$MIGRATION_FILE"

# Verificar se a migração foi bem-sucedida
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migração executada com sucesso!${NC}"
    echo ""
    
    # Verificar as colunas criadas
    echo -e "${YELLOW}🔍 Verificando colunas criadas...${NC}"
    sudo -u postgres psql -d "$DB_NAME" -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'clients' AND column_name IN ('isbt_code', 'has_collection_point', 'collection_points');"
    
    echo ""
    echo -e "${GREEN}=================================================="
    echo "  ✅ Migração ISBT Concluída com Sucesso!"
    echo "==================================================${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Recarregue a página da aplicação (F5)"
    echo "2. Tente salvar o ISBT novamente"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Erro ao executar a migração!${NC}"
    echo ""
    echo "Possíveis causas:"
    echo "- Permissões insuficientes"
    echo "- Banco de dados não está rodando"
    echo "- Colunas já existem (neste caso, não há problema)"
    echo ""
    exit 1
fi
