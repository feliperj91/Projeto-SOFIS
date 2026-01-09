#!/bin/bash
# Script de Configuração de Autenticação PostgreSQL para SOFIS
# Execute com: sudo bash fix_postgres_auth.sh

set -e  # Para em caso de erro

echo "🔧 Configurando autenticação PostgreSQL para SOFIS..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Redefinir senha do usuário
echo -e "${YELLOW}[1/5] Redefinindo senha do usuário sofis_user...${NC}"
sudo -u postgres psql -c "ALTER USER sofis_user WITH PASSWORD 'sofis123';" 2>/dev/null || {
    echo -e "${RED}Erro ao redefinir senha. Criando usuário...${NC}"
    sudo -u postgres psql -c "CREATE USER sofis_user WITH PASSWORD 'sofis123';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sofis_db TO sofis_user;"
}
echo -e "${GREEN}✓ Senha configurada${NC}"

# 2. Detectar versão do PostgreSQL
echo -e "${YELLOW}[2/5] Detectando versão do PostgreSQL...${NC}"
PG_VERSION=$(ls /etc/postgresql/ | head -n 1)
PG_HBA_FILE="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
echo -e "${GREEN}✓ Versão detectada: $PG_VERSION${NC}"

# 3. Backup do arquivo original
echo -e "${YELLOW}[3/5] Criando backup de pg_hba.conf...${NC}"
sudo cp "$PG_HBA_FILE" "${PG_HBA_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✓ Backup criado${NC}"

# 4. Configurar pg_hba.conf
echo -e "${YELLOW}[4/5] Configurando pg_hba.conf...${NC}"

# Verificar se já existe configuração
if grep -q "# Sofis database access" "$PG_HBA_FILE"; then
    echo -e "${YELLOW}Configuração já existe, pulando...${NC}"
else
    # Adicionar configuração antes da linha "local   all             postgres"
    sudo sed -i '/^local.*all.*postgres/i # Sofis database access\nlocal   sofis_db        sofis_user                              md5\nhost    sofis_db        sofis_user      127.0.0.1/32            md5\n' "$PG_HBA_FILE"
    echo -e "${GREEN}✓ Configuração adicionada${NC}"
fi

# 5. Reiniciar PostgreSQL
echo -e "${YELLOW}[5/5] Reiniciando PostgreSQL...${NC}"
sudo systemctl restart postgresql
sleep 2
echo -e "${GREEN}✓ PostgreSQL reiniciado${NC}"

# Teste de conexão
echo ""
echo -e "${YELLOW}🧪 Testando conexão...${NC}"
if PGPASSWORD=sofis123 psql -U sofis_user -d sofis_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ SUCESSO! Conexão estabelecida com sucesso!${NC}"
    echo ""
    echo "📋 Credenciais configuradas:"
    echo "   Usuário: sofis_user"
    echo "   Senha: sofis123"
    echo "   Banco: sofis_db"
    echo ""
    echo "🔍 Teste de consulta:"
    PGPASSWORD=sofis123 psql -U sofis_user -d sofis_db -c "SELECT COUNT(*) as total_clientes FROM clients;"
else
    echo -e "${RED}❌ Falha na conexão. Verifique os logs:${NC}"
    echo "   sudo tail -n 20 /var/log/postgresql/postgresql-$PG_VERSION-main.log"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Configuração concluída!${NC}"
echo ""
echo "Agora você pode usar:"
echo "  PGPASSWORD=sofis123 psql -U sofis_user -d sofis_db -c \"SELECT * FROM clients LIMIT 1;\""
echo ""
echo "Ou criar arquivo ~/.pgpass para não precisar digitar senha:"
echo "  echo 'localhost:5432:sofis_db:sofis_user:sofis123' >> ~/.pgpass"
echo "  chmod 600 ~/.pgpass"
