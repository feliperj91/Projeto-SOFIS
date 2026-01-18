# Guia de Deploy - Linux (VM)

## Pré-requisitos
- PostgreSQL instalado e rodando
- Apache2 com PHP e extensão pdo_pgsql
- Git configurado

## 1. Preparação do Banco de Dados

```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Criar banco e usuário
CREATE DATABASE sofis_db;
CREATE USER sofis_user WITH PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE sofis_db TO sofis_user;
\q
```

## 2. Executar Schemas

```bash
cd ~/Projeto-Sofis/database

# Ordem correta de execução:
psql -U sofis_user -d sofis_db -f schema.sql
psql -U sofis_user -d sofis_db -f auth_schema.sql
psql -U sofis_user -d sofis_db -f management_schema.sql
psql -U sofis_user -d sofis_db -f version_control_schema.sql
```

## 3. Configurar Conexão

Editar `api/db.php` com as credenciais corretas:
```php
$host = 'localhost';
$dbname = 'sofis_db';
$user = 'sofis_user';
$password = 'sua_senha_aqui';
```

## 4. Popular Permissões

```bash
cd ~/Projeto-Sofis
php api/seed_permissions.php
```

**Saída esperada:** `Permissions seeded successfully (Granular Schema).`

## 5. Criar Usuário Admin

```bash
# Via psql
psql -U sofis_user -d sofis_db

INSERT INTO users (username, password, full_name, role, permissions, created_at)
VALUES (
    'admin',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
    'Administrador',
    'ADMINISTRADOR',
    '{}',
    NOW()
);
\q
```

## 6. Deploy dos Arquivos

```bash
cd ~/Projeto-Sofis
git pull

# Copiar para webroot
sudo cp -r * /var/www/html/sofis/

# Ajustar permissões
sudo chown -R www-data:www-data /var/www/html/sofis/
sudo chmod -R 755 /var/www/html/sofis/
```

## 7. Configurar Apache

```bash
# Copiar configuração
sudo cp sofis.conf /etc/apache2/sites-available/

# Habilitar site e módulos
sudo a2ensite sofis.conf
sudo a2enmod rewrite
sudo systemctl restart apache2
```

## 8. Validação Pós-Deploy

### Teste de Conexão
```bash
php /var/www/html/sofis/api/test_db_read.php
```

### Checklist de Testes
- [ ] Acessar `http://seu-ip/sofis/login.html`
- [ ] Login com admin/password
- [ ] Criar cliente de teste
- [ ] Testar modais (SQL, VPN, URL)
- [ ] Testar filtros de ambiente
- [ ] Criar produto de teste
- [ ] Registrar versão
- [ ] Verificar histórico de versões
- [ ] Testar permissões (criar usuário TECNICO)
- [ ] Verificar logs de auditoria

## 9. Sincronizar Usuários Existentes (Se Aplicável)

```bash
php /var/www/html/sofis/api/sync_users_permissions.php
```

## 10. Troubleshooting

### Erro de Conexão ao Banco
```bash
# Verificar status do PostgreSQL
sudo systemctl status postgresql

# Verificar logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Erro 500 no Apache
```bash
# Verificar logs do Apache
sudo tail -f /var/log/apache2/error.log

# Verificar permissões
ls -la /var/www/html/sofis/
```

### Permissões não funcionam
```bash
# Re-executar seed
php /var/www/html/sofis/api/seed_permissions.php

# Verificar tabela
psql -U sofis_user -d sofis_db -c "SELECT * FROM role_permissions WHERE role_name='ADMINISTRADOR';"
```

## Notas Importantes

1. **Senha Padrão**: Altere a senha do admin após primeiro login
2. **Backup**: Faça backup do banco antes de qualquer migração
3. **Logs**: Monitore logs durante as primeiras horas
4. **Performance**: Ajuste `max_connections` no PostgreSQL se necessário

## Comandos Úteis

```bash
# Ver usuários cadastrados
psql -U sofis_user -d sofis_db -c "SELECT username, role FROM users;"

# Ver produtos cadastrados
psql -U sofis_user -d sofis_db -c "SELECT * FROM products;"

# Ver últimos logs
psql -U sofis_user -d sofis_db -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;"

# Limpar cache do navegador
# Ctrl + Shift + R (hard refresh)
```
