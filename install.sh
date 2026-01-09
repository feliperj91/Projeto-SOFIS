#!/bin/bash
# SOFIS Project - Automated Installation Script for Lubuntu/Ubuntu 24.04
# This script installs and configures all dependencies for the SOFIS project

set -e  # Exit on any error

echo "=========================================="
echo "SOFIS Project - Linux Installation Script"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script requires sudo privileges."
    echo "Please run with: sudo ./install.sh"
    exit 1
fi

# Get the actual user (not root when using sudo)
ACTUAL_USER=${SUDO_USER:-$USER}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📦 Step 1/6: Updating package lists..."
apt update

echo ""
echo "📦 Step 2/6: Installing Apache2, PostgreSQL, and PHP..."
apt install -y apache2 postgresql postgresql-contrib php libapache2-mod-php php-pgsql

echo ""
echo "🗄️  Step 3/6: Configuring PostgreSQL database..."

# Start PostgreSQL if not running
systemctl start postgresql
systemctl enable postgresql

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
echo "📊 Step 4/6: Importing database schema..."

# Import all schema files in order
sudo -u postgres psql -d sofis_db -f "$SCRIPT_DIR/database/schema.sql"
sudo -u postgres psql -d sofis_db -f "$SCRIPT_DIR/database/auth_schema.sql"
sudo -u postgres psql -d sofis_db -f "$SCRIPT_DIR/database/management_schema.sql"
sudo -u postgres psql -d sofis_db -f "$SCRIPT_DIR/database/version_control_schema.sql"
sudo -u postgres psql -d sofis_db -f "$SCRIPT_DIR/database/migration_favorites.sql"

echo ""
echo "🌐 Step 5/6: Configuring Apache..."

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
</VirtualHost>
VHOST

# Enable the site and disable default
a2ensite sofis.conf
a2dissite 000-default.conf

echo ""
echo "🔄 Step 6/6: Restarting services..."
systemctl restart apache2
systemctl restart postgresql

echo ""
echo "✅ Installation completed successfully!"
echo ""
echo "=========================================="
echo "📋 Next Steps:"
echo "=========================================="
echo "1. Update database credentials in: /var/www/html/sofis/api/db.php"
echo "   Current password: 'sofis_password_secure'"
echo ""
echo "2. Access the application at: http://localhost/sofis/login.html"
echo "   or http://YOUR_SERVER_IP/sofis/login.html"
echo ""
echo "3. Default admin credentials need to be created manually in the database"
echo "   or through the application's first-run setup."
echo ""
echo "=========================================="
echo "📝 Important Files:"
echo "=========================================="
echo "- Web root: /var/www/html/sofis/"
echo "- Apache config: /etc/apache2/sites-available/sofis.conf"
echo "- Apache logs: /var/log/apache2/sofis_*.log"
echo "- Database: sofis_db (PostgreSQL)"
echo "=========================================="
