# 🚀 Guia de Instalação - Sistema SOFIS

## 📋 Requisitos do Servidor

### Sistema Operacional
- Ubuntu 20.04 LTS ou superior
- Debian 10 ou superior
- CentOS 8 ou superior (com adaptações)

### Recursos Mínimos
- **CPU**: 2 cores
- **RAM**: 2 GB
- **Disco**: 10 GB de espaço livre
- **Rede**: Conexão com internet para instalação

---

## 🎯 Instalação Automática (Recomendado)

### Passo 1: Preparar o Servidor

```bash
# Conectar ao servidor via SSH
ssh usuario@seu-servidor

# Atualizar sistema
sudo apt update && sudo apt upgrade -y
```

### Passo 2: Fazer Upload dos Arquivos

Você pode usar SCP, SFTP ou Git:

**Opção A - Via SCP:**
```bash
# Do seu computador local
scp -r /caminho/para/Projeto-SOFIS-1 usuario@seu-servidor:/tmp/sofis
```

**Opção B - Via Git:**
```bash
# No servidor
cd /tmp
git clone https://github.com/seu-usuario/Projeto-SOFIS.git sofis
```

### Passo 3: Executar o Script de Instalação

```bash
# Entrar no diretório
cd /tmp/sofis

# Dar permissão de execução
chmod +x install.sh

# Executar instalação
sudo ./install.sh
```

### Passo 4: Seguir as Instruções

O script irá solicitar:
- Nome do banco de dados (padrão: `sofis_db`)
- Usuário do banco (padrão: `sofis_user`)
- Senha do banco de dados

**IMPORTANTE**: Anote as credenciais exibidas ao final da instalação!

---

## ⚙️ Instalação Manual

Se preferir instalar manualmente, siga os passos abaixo:

### 1. Instalar Apache

```bash
sudo apt install apache2 -y
sudo systemctl enable apache2
sudo systemctl start apache2
```

### 2. Instalar PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 3. Instalar PHP

```bash
sudo apt install php libapache2-mod-php php-pgsql php-mbstring php-xml php-curl php-json -y
```

### 4. Configurar Banco de Dados

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar banco e usuário
CREATE DATABASE sofis_db;
CREATE USER sofis_user WITH PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE sofis_db TO sofis_user;
\q
```

### 5. Importar Schema

```bash
# Importar estrutura do banco
psql -h localhost -U sofis_user -d sofis_db -f database/schema.sql
```

### 6. Configurar Projeto

```bash
# Criar diretório
sudo mkdir -p /var/www/sofis

# Copiar arquivos
sudo cp -r * /var/www/sofis/

# Ajustar permissões
sudo chown -R www-data:www-data /var/www/sofis
sudo chmod -R 755 /var/www/sofis
```

### 7. Criar Arquivo de Configuração

```bash
# Editar arquivo de configuração
sudo nano /var/www/sofis/config/database.php
```

Cole o seguinte conteúdo:

```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'sofis_db');
define('DB_USER', 'sofis_user');
define('DB_PASS', 'sua_senha_aqui');
define('DB_PORT', '5432');

define('DB_DSN', 'pgsql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME);

function getDBConnection() {
    try {
        $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        error_log("Erro de conexão: " . $e->getMessage());
        die("Erro ao conectar ao banco de dados");
    }
}
?>
```

### 8. Configurar Apache VirtualHost

```bash
sudo nano /etc/apache2/sites-available/sofis.conf
```

Cole o seguinte conteúdo:

```apache
<VirtualHost *:80>
    ServerName seu-dominio.com
    DocumentRoot /var/www/sofis

    <Directory /var/www/sofis>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.html [QSA,L]
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/sofis_error.log
    CustomLog ${APACHE_LOG_DIR}/sofis_access.log combined
</VirtualHost>
```

### 9. Ativar Site e Módulos

```bash
# Ativar módulos
sudo a2enmod rewrite
sudo a2enmod php

# Desativar site padrão
sudo a2dissite 000-default.conf

# Ativar site SOFIS
sudo a2ensite sofis.conf

# Reiniciar Apache
sudo systemctl restart apache2
```

### 10. Configurar Firewall

```bash
sudo ufw allow 'Apache Full'
sudo ufw enable
```

---

## 🔐 Segurança

### Alterar Senha do Admin

Após o primeiro login, altere a senha padrão:

1. Acesse o sistema
2. Vá em **Gestão de Usuários**
3. Edite o usuário **admin**
4. Defina uma nova senha forte

### Configurar HTTPS (Recomendado)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-apache -y

# Obter certificado SSL
sudo certbot --apache -d seu-dominio.com

# Renovação automática
sudo certbot renew --dry-run
```

### Backup do Banco de Dados

```bash
# Criar backup
pg_dump -h localhost -U sofis_user sofis_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -h localhost -U sofis_user -d sofis_db < backup_20260112.sql
```

---

## 🐛 Solução de Problemas

### Apache não inicia

```bash
# Verificar erros
sudo systemctl status apache2
sudo tail -f /var/log/apache2/error.log

# Testar configuração
sudo apache2ctl configtest
```

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql -h localhost -U sofis_user -d sofis_db
```

### Permissões incorretas

```bash
# Corrigir permissões
sudo chown -R www-data:www-data /var/www/sofis
sudo chmod -R 755 /var/www/sofis
```

### Página em branco

```bash
# Verificar logs do PHP
sudo tail -f /var/log/apache2/sofis_error.log

# Habilitar exibição de erros (apenas desenvolvimento)
sudo nano /etc/php/8.1/apache2/php.ini
# Alterar: display_errors = On
sudo systemctl restart apache2
```

---

## 📊 Monitoramento

### Verificar Status dos Serviços

```bash
# Apache
sudo systemctl status apache2

# PostgreSQL
sudo systemctl status postgresql

# Ver logs em tempo real
sudo tail -f /var/log/apache2/sofis_error.log
```

### Verificar Uso de Recursos

```bash
# CPU e Memória
htop

# Espaço em disco
df -h

# Conexões do banco
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🔄 Atualização do Sistema

### Atualizar Código

```bash
# Fazer backup
sudo cp -r /var/www/sofis /var/www/sofis_backup_$(date +%Y%m%d)

# Atualizar via Git
cd /var/www/sofis
sudo git pull origin main

# Ajustar permissões
sudo chown -R www-data:www-data /var/www/sofis
```

### Atualizar Schema do Banco

```bash
# Aplicar migrations
psql -h localhost -U sofis_user -d sofis_db -f database/migrations/nova_migration.sql
```

---

## 📞 Suporte

Para problemas ou dúvidas:
- **Email**: suporte@sofis.local
- **Documentação**: https://docs.sofis.local
- **Issues**: https://github.com/seu-usuario/Projeto-SOFIS/issues

---

## 📝 Licença

Sistema SOFIS - Controle de Versões  
© 2026 - Todos os direitos reservados
