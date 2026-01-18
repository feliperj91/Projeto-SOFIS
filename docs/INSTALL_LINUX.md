# 🐧 SOFIS - Instalação no Linux (Lubuntu 24.04)

Este guia fornece instruções para instalar e configurar o sistema SOFIS em um servidor Lubuntu/Ubuntu 24.04.

## 📋 Pré-requisitos

- Lubuntu/Ubuntu 24.04 ou superior
- Acesso root/sudo
- Conexão com a internet

## ⚡ Instalação Rápida (Recomendado)

### 1. Clone ou copie o projeto para o servidor

```bash
# Se usando Git
git clone https://github.com/feliperj91/Projeto-SOFIS.git
cd Projeto-SOFIS

# Ou copie os arquivos manualmente via SCP/FTP
```

### 2. Execute o script de instalação

```bash
# Torne o script executável
chmod +x install.sh

# Execute com privilégios de administrador
sudo ./install.sh
```

O script irá automaticamente:
- ✅ Atualizar repositórios do sistema
- ✅ Instalar Apache2, PostgreSQL e PHP
- ✅ Criar banco de dados e usuário
- ✅ Importar schemas do banco
- ✅ Configurar Apache com permissões corretas
- ✅ Copiar arquivos para `/var/www/html/sofis/`

### 3. Acesse o sistema

Após a instalação, acesse:
- **Local**: http://localhost/sofis/login.html
- **Rede**: http://SEU_IP_DO_SERVIDOR/sofis/login.html

## 🔧 Configuração Pós-Instalação

### Alterar senha do banco de dados (Recomendado)

1. Edite o arquivo de configuração:
```bash
sudo nano /var/www/html/sofis/api/db.php
```

2. Altere a linha:
```php
$pass = 'sofis_password_secure'; // ALTERE ESTA SENHA
```

3. Atualize a senha no PostgreSQL:
```bash
sudo -u postgres psql
ALTER USER sofis_user WITH PASSWORD 'sua_nova_senha_segura';
\q
```

### Criar primeiro usuário administrador

Execute no PostgreSQL:
```bash
sudo -u postgres psql -d sofis_db
```

```sql
INSERT INTO users (username, password, role, permissions)
VALUES (
    'admin',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
    'ADMIN',
    '{}'::jsonb
);
```

> ⚠️ **IMPORTANTE**: Altere a senha padrão após o primeiro login!

## 📁 Estrutura de Arquivos

```
/var/www/html/sofis/          # Raiz da aplicação
├── api/                       # Backend PHP
│   ├── db.php                # Configuração do banco
│   ├── auth.php              # Autenticação
│   └── ...
├── database/                  # Schemas SQL
├── install.sh                # Script de instalação
└── login.html                # Página de login
```

## 🔍 Logs e Troubleshooting

### Verificar logs do Apache
```bash
sudo tail -f /var/log/apache2/sofis_error.log
sudo tail -f /var/log/apache2/sofis_access.log
```

### Verificar status dos serviços
```bash
sudo systemctl status apache2
sudo systemctl status postgresql
```

### Reiniciar serviços
```bash
sudo systemctl restart apache2
sudo systemctl restart postgresql
```

### Verificar conexão com banco de dados
```bash
sudo -u postgres psql -d sofis_db -c "SELECT version();"
```

## 🛠️ Instalação Manual

Se preferir instalar manualmente ou precisar customizar a instalação, consulte:
- [database/setup_guide.md](database/setup_guide.md)

## 🔒 Segurança

- [ ] Altere a senha padrão do banco de dados
- [ ] Configure firewall (UFW)
- [ ] Configure SSL/HTTPS para produção
- [ ] Altere credenciais padrão de usuários
- [ ] Revise permissões de arquivos

### Configurar Firewall (Opcional)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 📞 Suporte

Para problemas ou dúvidas:
- Verifique os logs em `/var/log/apache2/`
- Consulte a documentação em `README.md`
- Abra uma issue no GitHub

## 📄 Licença

Este projeto está sob a licença especificada no arquivo LICENSE.
