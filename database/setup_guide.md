# Local Environment Setup Guide

## Quick Start (Recommended)

For **Lubuntu/Ubuntu 24.04** users, use the automated installation script:

```bash
# Make the script executable
chmod +x install.sh

# Run the installation (requires sudo)
sudo ./install.sh
```

The script will automatically:
- Install Apache2, PostgreSQL, and PHP with required extensions
- Create the database and user
- Import all schema files
- Configure Apache with proper permissions
- Set up the project in `/var/www/html/sofis/`

After installation, access the application at `http://localhost/sofis/login.html`

---

## Manual Installation

If you prefer manual setup or need to customize the installation:

## 1. Requirements
Ensure your Linux server has the following installed:
-   **Apache 2** (`sudo apt install apache2`)
-   **PostgreSQL** (`sudo apt install postgresql postgresql-contrib`)
-   **PHP 7.4+ and Drivers** (`sudo apt install php libapache2-mod-php php-pgsql`)

## 2. Database Setup
1.  Log into PostgreSQL:
    ```bash
    sudo -u postgres psql
    ```
2.  Create the database and user:
    ```sql
    CREATE DATABASE sofis_db;
    CREATE USER sofis_user WITH ENCRYPTED PASSWORD 'sofis_password_secure';
    GRANT ALL PRIVILEGES ON DATABASE sofis_db TO sofis_user;
    -- Grant schema usage for the new user
    \c sofis_db
    GRANT ALL ON SCHEMA public TO sofis_user;
    EXIT;
    ```
3.  Import the schema:
    ```bash
    psql -U sofis_user -d sofis_db -h localhost -f database/schema.sql
    ```

## 3. Apache Configuration
1.  Enable `mod_rewrite` for clean URLs:
    ```bash
    sudo a2enmod rewrite
    ```
2.  Configure your VirtualHost to allow `.htaccess` overrides in your web root `/var/www/html`:
    ```apache
    <Directory /var/www/html>
        AllowOverride All
    </Directory>
    ```
3.  Restart Apache:
    ```bash
    sudo systemctl restart apache2
    ```

## 4. Deploy Code
Copy all files from this project to `/var/www/html/` (or your configured web root).
