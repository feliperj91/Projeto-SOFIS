# 🗄️ Database Schemas - SOFIS (VM/Linux)

Esta pasta contém os schemas SQL utilizados para configurar o banco de dados PostgreSQL na VM Linux.

## 📋 Arquivos Principais

### `schema.sql`
Schema mestre do sistema.
- Executado pelo script de instalação na VM.
- Contém todas as tabelas: `users`, `clients`, `role_permissions`, `audit_log`, `version_controls`, etc.
- Utiliza chaves primárias inteiras (`SERIAL`) e armazenamento JSONB para contatos/hosts.

### `setup_guide.md`
Guia de configuração do ambiente Linux (Apache/PHP/Postgres).

## 🚀 Como Usar

Para resetar ou instalar o banco de dados na VM:

```bash
# Acessar postgres
sudo -u postgres psql

# Criar banco (se não existir)
CREATE DATABASE sofis_db;
CREATE USER sofis_user WITH ENCRYPTED PASSWORD 'sofis123';
GRANT ALL PRIVILEGES ON DATABASE sofis_db TO sofis_user;

# Importar Schema
psql -U sofis_user -d sofis_db -h localhost -f database/schema.sql
```

## ⚠️ Importante

O arquivo `schema.sql` é a fonte da verdade para a estrutura do banco de dados na VM.
