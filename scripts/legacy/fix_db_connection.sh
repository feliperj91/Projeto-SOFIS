#!/bin/bash
# Script de Emergência - Corrigir Conexão com Banco de Dados
# Execute com: sudo bash fix_db_connection.sh

set -e

echo "🚨 CORREÇÃO EMERGENCIAL - Conexão com Banco de Dados"
echo "=================================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configurações
DB_USER="sofis_user"
DB_PASS="sofis123"
DB_NAME="sofis_db"
WEB_ROOT="/var/www/html/sofis"

# 1. Verificar se PostgreSQL está rodando
echo -e "${YELLOW}[1/6] Verificando PostgreSQL...${NC}"
if ! systemctl is-active --quiet postgresql; then
    echo -e "${RED}PostgreSQL não está rodando! Iniciando...${NC}"
    sudo systemctl start postgresql
    sleep 2
fi
echo -e "${GREEN}✓ PostgreSQL ativo${NC}"

# 2. Redefinir senha do usuário
echo -e "${YELLOW}[2/6] Redefinindo senha do usuário...${NC}"
sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || {
    echo -e "${YELLOW}Usuário não existe. Criando...${NC}"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
}
echo -e "${GREEN}✓ Senha configurada${NC}"

# 3. Testar conexão com banco
echo -e "${YELLOW}[3/6] Testando conexão com banco...${NC}"
if PGPASSWORD=$DB_PASS psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Conexão com banco OK${NC}"
else
    echo -e "${RED}❌ Falha na conexão. Executando fix_postgres_auth.sh...${NC}"
    if [ -f "$WEB_ROOT/../fix_postgres_auth.sh" ]; then
        sudo bash "$WEB_ROOT/../fix_postgres_auth.sh"
    else
        echo -e "${RED}Script fix_postgres_auth.sh não encontrado!${NC}"
        exit 1
    fi
fi

# 4. Atualizar db.php
echo -e "${YELLOW}[4/6] Atualizando configuração do db.php...${NC}"
DB_PHP="$WEB_ROOT/api/db.php"

if [ ! -f "$DB_PHP" ]; then
    echo -e "${RED}Arquivo db.php não encontrado em $DB_PHP${NC}"
    exit 1
fi

# Backup
sudo cp "$DB_PHP" "${DB_PHP}.backup.$(date +%Y%m%d_%H%M%S)"

# Atualizar senha no arquivo
sudo sed -i "s/\$password = '.*';/\$password = '$DB_PASS';/g" "$DB_PHP"
sudo sed -i "s/\$user = '.*';/\$user = '$DB_USER';/g" "$DB_PHP"
sudo sed -i "s/\$dbname = '.*';/\$dbname = '$DB_NAME';/g" "$DB_PHP"

echo -e "${GREEN}✓ db.php atualizado${NC}"

# 5. Verificar arquivo db.php
echo -e "${YELLOW}[5/6] Verificando configuração...${NC}"
echo "Conteúdo do db.php:"
grep -E '\$(host|dbname|user|password)' "$DB_PHP" | head -4

# 6. Testar conexão PHP
echo -e "${YELLOW}[6/6] Testando conexão via PHP...${NC}"
TEST_SCRIPT="/tmp/test_db_connection.php"
cat > "$TEST_SCRIPT" << 'EOF'
<?php
require '/var/www/html/sofis/api/db.php';
try {
    $stmt = $pdo->query('SELECT COUNT(*) as total FROM users');
    $result = $stmt->fetch();
    echo "✓ Conexão OK! Total de usuários: " . $result['total'] . "\n";
} catch (Exception $e) {
    echo "✗ Erro: " . $e->getMessage() . "\n";
    exit(1);
}
EOF

php "$TEST_SCRIPT"
rm "$TEST_SCRIPT"

# 7. Reiniciar Apache
echo -e "${YELLOW}Reiniciando Apache...${NC}"
sudo systemctl restart apache2
sleep 1
echo -e "${GREEN}✓ Apache reiniciado${NC}"

# Resumo
echo ""
echo -e "${GREEN}=================================================="
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "==================================================${NC}"
echo ""
echo "📋 Credenciais configuradas:"
echo "   Usuário: $DB_USER"
echo "   Senha: $DB_PASS"
echo "   Banco: $DB_NAME"
echo ""
echo "🌐 Acesse o sistema:"
echo "   http://localhost/sofis/login.html"
echo ""
echo "🔍 Se ainda houver erro, verifique:"
echo "   sudo tail -f /var/log/apache2/error.log"
echo ""
