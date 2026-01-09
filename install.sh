#!/bin/bash
# Projeto SOFIS - Script de Instalação Automatizada para Lubuntu/Ubuntu 24.04
# Este script instala e configura todas as dependências do projeto SOFIS
# Inclui todas as correções descobertas durante troubleshooting

set -e  # Sair em caso de erro

echo "=========================================="
echo "Projeto SOFIS - Script de Instalação Linux"
echo "=========================================="
echo ""

# Verificar se está executando como root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Este script requer privilégios sudo."
    echo "Execute com: sudo ./install.sh"
    exit 1
fi

# Obter o usuário real (não root quando usando sudo)
ACTUAL_USER=${SUDO_USER:-$USER}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📦 Passo 1/7: Atualizando lista de pacotes..."
apt update

echo ""
echo "📦 Passo 2/7: Instalando Apache2, PostgreSQL e PHP..."
apt install -y apache2 postgresql postgresql-contrib php libapache2-mod-php php-pgsql

echo ""
echo "🗄️  Step 3/7: Configuring PostgreSQL database..."

# Start PostgreSQL if not running
systemctl start postgresql 2>/dev/null || service postgresql start
systemctl enable postgresql 2>/dev/null || true

# Fix permissions for schema files
chmod +r "$SCRIPT_DIR/database"/*.sql 2>/dev/null || true
chmod +x "$SCRIPT_DIR"
chmod +x "$SCRIPT_DIR/database"

# Create database and user
sudo -u postgres psql <<EOF
-- Drop existing database and user if they exist (for clean install)
DROP DATABASE IF EXISTS sofis_db;
DROP USER IF EXISTS sofis_user;

-- Create new database and user
CREATE DATABASE sofis_db;
CREATE USER sofis_user WITH ENCRYPTED PASSWORD 'sofis_password_secure';
GRANT ALL PRIVILEGES ON DATABASE sofis_db TO sofis_user;

-- Connect to database and grant schema permissions
\c sofis_db
GRANT ALL ON SCHEMA public TO sofis_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sofis_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sofis_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sofis_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sofis_user;
EOF

echo ""
echo "📊 Step 4/7: Importing database schema..."

# Import all schema files in order
sudo -u postgres psql -d sofis_db -f "$SCRIPT_DIR/database/schema.sql"
sudo -u postgres psql -d sofis_db -f "$SCRIPT_DIR/database/auth_schema.sql"
sudo -u postgres psql -d sofis_db -f "$SCRIPT_DIR/database/management_schema.sql"
sudo -u postgres psql -d sofis_db -f "$SCRIPT_DIR/database/version_control_schema.sql"
sudo -u postgres psql -d sofis_db -f "$SCRIPT_DIR/database/migration_favorites.sql"

echo ""
echo "🌐 Step 5/7: Configuring Apache..."

# Enable PHP module (try multiple versions)
a2enmod php8.3 2>/dev/null || a2enmod php8.2 2>/dev/null || a2enmod php8.1 2>/dev/null || a2enmod php 2>/dev/null || true

# Enable mod_rewrite
a2enmod rewrite

# Copy project files to web root
echo "Copying project files to /var/www/html/sofis..."
mkdir -p /var/www/html/sofis
cp -r "$SCRIPT_DIR"/* /var/www/html/sofis/
chown -R www-data:www-data /var/www/html/sofis

# Create Apache virtual host configuration
cat > /etc/apache2/sites-available/sofis.conf <<'VHOST'
<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html/sofis

    <Directory /var/www/html/sofis>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/sofis_error.log
    CustomLog ${APACHE_LOG_DIR}/sofis_access.log combined

    # PHP Configuration
    <FilesMatch \.php$>
        SetHandler application/x-httpd-php
    </FilesMatch>
</VirtualHost>
VHOST

echo ""
echo "🔧 Step 6/7: Enabling SOFIS site and disabling default..."

# Enable the site and disable default
a2ensite sofis.conf
a2dissite 000-default.conf 2>/dev/null || true

echo ""
echo "🔄 Step 7/7: Restarting services..."
systemctl restart apache2 2>/dev/null || service apache2 restart
systemctl restart postgresql 2>/dev/null || service postgresql restart

echo ""
echo "✅ Installation completed successfully!"
echo ""
echo "=========================================="
echo "📋 Next Steps:"
echo "=========================================="
echo "1. Update database credentials in: /var/www/html/sofis/api/db.php"
echo "   Current password: 'sofis_password_secure'"
echo ""
echo "2. Access the application at: http://localhost/login.html"
echo "   or http://YOUR_SERVER_IP/login.html"
echo ""
echo "3. Create admin user with:"
echo "   sudo -u postgres psql -d sofis_db"
echo "   INSERT INTO users (username, password, role)"
echo "   VALUES ('admin', '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN');"
echo "   (Default password: 'password' - CHANGE THIS AFTER FIRST LOGIN!)"
echo ""
echo "=========================================="
echo "📝 Important Files:"
echo "=========================================="
echo "- Web root: /var/www/html/sofis/"
echo "- Apache config: /etc/apache2/sites-available/sofis.conf"
echo "- Apache logs: /var/log/apache2/sofis_*.log"
echo "- Database: sofis_db (PostgreSQL)"
echo "=========================================="
