#!/bin/bash

# ============================================================================
# Script de Instalação Automática - Sistema SOFIS
# ============================================================================
# Este script instala e configura automaticamente o Sistema SOFIS em um
# servidor Linux com Apache, PostgreSQL e PHP.
# ============================================================================

set -e  # Para em caso de erro

echo "============================================================================"
echo "  INSTALAÇÃO AUTOMÁTICA - SISTEMA SOFIS"
echo "============================================================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para exibir mensagens
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    print_error "Este script precisa ser executado como root (use sudo)"
    exit 1
fi

print_info "Iniciando instalação do Sistema SOFIS..."
echo ""

# Determinar diretório raiz do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

# ============================================================================
# 1. ATUALIZAR SISTEMA
# ============================================================================
print_info "Atualizando sistema..."
apt-get update -qq
apt-get upgrade -y -qq

# ============================================================================
# 2. INSTALAR DEPENDÊNCIAS
# ============================================================================
print_info "Instalando dependências (Apache, PostgreSQL, PHP)..."

# Apache
apt-get install -y -qq apache2

# PostgreSQL
apt-get install -y -qq postgresql postgresql-contrib

# PHP e extensões necessárias
apt-get install -y -qq php libapache2-mod-php php-pgsql php-mbstring php-xml php-curl php-json

# Ferramentas adicionais
apt-get install -y -qq git unzip curl

print_info "Dependências instaladas com sucesso!"

# ============================================================================
# 3. CONFIGURAR POSTGRESQL
# ============================================================================
print_info "Configurando PostgreSQL..."

# Solicitar informações do banco de dados
read -p "Nome do banco de dados [sofis_db]: " DB_NAME
DB_NAME=${DB_NAME:-sofis_db}

read -p "Usuário do banco de dados [sofis_user]: " DB_USER
DB_USER=${DB_USER:-sofis_user}

read -sp "Senha do banco de dados: " DB_PASS
echo ""

if [ -z "$DB_PASS" ]; then
    print_error "Senha não pode ser vazia!"
    exit 1
fi

# Criar usuário e banco de dados
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || print_warning "Usuário já existe"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || print_warning "Banco de dados já existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

print_info "PostgreSQL configurado!"

# ============================================================================
# 4. CONFIGURAR DIRETÓRIO DO PROJETO
# ============================================================================
print_info "Configurando diretório do projeto..."

PROJECT_DIR="/var/www/sofis"
mkdir -p $PROJECT_DIR
mkdir -p $PROJECT_DIR/config

# Copiar arquivos do projeto
print_info "Copiando arquivos do projeto..."
# Copiar arquivos do projeto (da raiz)
cp -r "$SOURCE_DIR"/* $PROJECT_DIR/ 2>/dev/null || print_warning "Alguns arquivos podem não ter sido copiados"

# Configurar permissões
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

print_info "Diretório configurado em: $PROJECT_DIR"

# ============================================================================
# 5. CRIAR ARQUIVO DE CONFIGURAÇÃO DO BANCO
# ============================================================================
print_info "Criando arquivo de configuração do banco de dados..."

cat > $PROJECT_DIR/config/database.php << EOF
<?php
// Configuração do Banco de Dados - Sistema SOFIS
// Gerado automaticamente pelo script de instalação

define('DB_HOST', 'localhost');
define('DB_NAME', '$DB_NAME');
define('DB_USER', '$DB_USER');
define('DB_PASS', '$DB_PASS');
define('DB_PORT', '5432');

// String de conexão PDO
define('DB_DSN', 'pgsql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME);

// Função para obter conexão
function getDBConnection() {
    try {
        \$pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
        \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        \$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return \$pdo;
    } catch (PDOException \$e) {
        error_log("Erro de conexão: " . \$e->getMessage());
        die("Erro ao conectar ao banco de dados");
    }
}
?>
EOF

chmod 640 $PROJECT_DIR/config/database.php
chown www-data:www-data $PROJECT_DIR/config/database.php

print_info "Arquivo de configuração criado!"

# ============================================================================
# 6. IMPORTAR SCHEMA DO BANCO DE DADOS
# ============================================================================
print_info "Importando schema do banco de dados..."

if [ -f "$PROJECT_DIR/database/schema.sql" ]; then
    PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME -f $PROJECT_DIR/database/schema.sql
    print_info "Schema importado com sucesso!"
else
    print_warning "Arquivo schema.sql não encontrado. Você precisará importar manualmente."
fi

# ============================================================================
# 8. CONFIGURAR APACHE
# ============================================================================
print_info "Configurando Apache..."

# Gerar chave de criptografia
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Criar VirtualHost
cat > /etc/apache2/sites-available/sofis.conf << EOF
<VirtualHost *:80>
    ServerName sofis.local
    ServerAdmin admin@sofis.local
    DocumentRoot $PROJECT_DIR

    # Variáveis de Ambiente
    SetEnv SOFIS_ENCRYPTION_KEY "$ENCRYPTION_KEY"

    <Directory $PROJECT_DIR>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Rewrite para URLs limpas (SPA)
        RewriteEngine On
        RewriteBase /
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.html [QSA,L]
    </Directory>

    # Logs
    ErrorLog \${APACHE_LOG_DIR}/sofis_error.log
    CustomLog \${APACHE_LOG_DIR}/sofis_access.log combined

    # Segurança
    <FilesMatch "\.(sql|md|json|lock)$">
        Require all denied
    </FilesMatch>
</VirtualHost>
EOF

# Habilitar módulos necessários
a2enmod rewrite
a2enmod php8.1 2>/dev/null || a2enmod php8.2 2>/dev/null || a2enmod php

# Habilitar site
a2dissite 000-default.conf
a2ensite sofis.conf

# Reiniciar Apache
systemctl restart apache2

print_info "Apache configurado!"

# ============================================================================
# 8. CONFIGURAR PHP
# ============================================================================
print_info "Configurando PHP..."

# Ajustar configurações do PHP
PHP_INI=$(php -i | grep "Loaded Configuration File" | awk '{print $5}')

if [ -f "$PHP_INI" ]; then
    sed -i 's/upload_max_filesize = .*/upload_max_filesize = 50M/' $PHP_INI
    sed -i 's/post_max_size = .*/post_max_size = 50M/' $PHP_INI
    sed -i 's/max_execution_time = .*/max_execution_time = 300/' $PHP_INI
    sed -i 's/memory_limit = .*/memory_limit = 256M/' $PHP_INI
    
    systemctl restart apache2
    print_info "PHP configurado!"
else
    print_warning "Arquivo php.ini não encontrado. Configure manualmente se necessário."
fi

# ============================================================================
# 9. CONFIGURAR FIREWALL (UFW)
# ============================================================================
print_info "Configurando firewall..."

if command -v ufw &> /dev/null; then
    ufw allow 'Apache Full'
    print_info "Firewall configurado!"
else
    print_warning "UFW não instalado. Configure o firewall manualmente."
fi

# ============================================================================
# 10. CRIAR USUÁRIO ADMIN PADRÃO
# ============================================================================
print_info "Criando usuário administrador padrão..."

ADMIN_PASS=$(openssl rand -base64 12)
# Gerar hash BCRYPT compatível com PHP
ADMIN_HASH=$(php -r "echo password_hash('$ADMIN_PASS', PASSWORD_BCRYPT);")

# Obter permissões do administrador (JSON)
PERMS_JSON=$(PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME -t -c "SELECT jsonb_object_agg(module, jsonb_build_object('can_view', can_view, 'can_create', can_create, 'can_edit', can_edit, 'can_delete', can_delete)) FROM role_permissions WHERE role_name = 'ADMINISTRADOR';")

PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME << EOF
INSERT INTO users (username, password_hash, email, full_name, role, permissions, created_at)
VALUES ('admin', '$ADMIN_HASH', 'admin@sofis.local', 'Administrador Sistema', 'ADMINISTRADOR', '$PERMS_JSON', NOW())
ON CONFLICT (username) DO UPDATE 
SET password_hash = '$ADMIN_HASH', permissions = '$PERMS_JSON';
EOF

print_info "Usuário admin criado/atualizado!"

# ============================================================================
# FINALIZAÇÃO
# ============================================================================
echo ""
echo "============================================================================"
echo -e "${GREEN}  INSTALAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
echo "============================================================================"
echo ""
echo "Informações do Sistema:"
echo "  - URL: http://$(hostname -I | awk '{print $1}')"
echo "  - Diretório: $PROJECT_DIR"
echo "  - Banco de dados: $DB_NAME"
echo "  - Usuário DB: $DB_USER"
echo ""
echo "Credenciais de Acesso:"
echo "  - Usuário: admin"
echo "  - Senha: $ADMIN_PASS"
echo ""
echo -e "${YELLOW}IMPORTANTE: Anote a senha acima! Ela não será exibida novamente.${NC}"
echo ""
echo "Logs do Apache:"
echo "  - Erros: /var/log/apache2/sofis_error.log"
echo "  - Acesso: /var/log/apache2/sofis_access.log"
echo ""
echo "Para acessar o sistema, abra um navegador e acesse:"
echo "  http://$(hostname -I | awk '{print $1}')"
echo ""
echo "============================================================================"
