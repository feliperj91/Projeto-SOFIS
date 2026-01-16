# Migrações do Banco de Dados - SOFIS

## Como Executar Migrações

### No PostgreSQL:

```bash
psql -U seu_usuario -d nome_banco -f split_user_management_permissions.sql
```

**OU** via psql interativo:

```sql
\i split_user_management_permissions.sql
```

---

## Migração: `split_user_management_permissions.sql`

**Data:** 2026-01-16  
**Descrição:** Separação de módulos de permissões

### O que esta migração faz:

1. **Divide "Gestão de Usuários" em 3 módulos:**
   - `Usuários` (CRUD completo)
   - `Permissões` (view + edit)
   - `Logs de Auditoria` (view + export_pdf)

2. **Cria módulo "Servidores":**
   - Separado de "Dados de Acesso (SQL)"
   - Mantém as mesmas permissões que SQL tinha

### ✅ Segurança:

- ✅ Usa transações (BEGIN/COMMIT)
- ✅ Verifica se já foi executada (idempotente)
- ✅ Exibe mensagens de progresso
- ✅ Inclui script de ROLLBACK comentado

### 📋 Pré-requisitos:

- Backup do banco de dados
- Acesso ao PostgreSQL
- Permissões de INSERT/DELETE na tabela `permissions`

### ⚠️ IMPORTANTE:

Execute esta migração **antes** de usar o código atualizado, caso contrário perderá acesso à gestão de usuários.

---

## Verificar se Precisa Executar:

Execute este comando para verificar:

```sql
SELECT DISTINCT module FROM permissions ORDER BY module;
```

**Se aparecer** "Gestão de Usuários" → **Precisa executar a migração**  
**Se aparecer** "Usuários", "Permissões", "Logs de Auditoria" → **Já foi executada**
