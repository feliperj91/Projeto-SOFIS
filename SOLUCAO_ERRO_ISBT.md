# 🔧 Solução para Erro ao Salvar ISBT

## 📋 Problema Identificado

A mensagem de erro **"❌ Erro ao salvar dados ISBT. Verifique se o banco de dados foi atualizado."** aparece porque a migração do banco de dados para os campos ISBT não foi executada.

## 🎯 Causa Raiz

O código JavaScript está tentando salvar os seguintes campos na tabela `clients`:
- `isbt_code` (TEXT)
- `has_collection_point` (BOOLEAN)
- `collection_points` (JSONB)

Porém, esses campos **não existem** na estrutura atual do banco de dados.

## ✅ Solução

### Opção 1: Executar a Migração no Servidor (Recomendado)

Se você está usando o servidor Linux (VM), execute os seguintes comandos:

```bash
# 1. Conectar ao banco de dados PostgreSQL
sudo -u postgres psql -d sofis_db

# 2. Executar a migração ISBT
\i /var/www/html/sofis/database/migration_isbt.sql

# 3. Verificar se as colunas foram criadas
\d clients

# 4. Sair do PostgreSQL
\q
```

### Opção 2: Executar Manualmente via SQL

Se preferir executar manualmente, copie e cole os comandos SQL abaixo no seu cliente PostgreSQL:

```sql
-- Migration to add ISBT 128 fields to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS isbt_code TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_collection_point BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS collection_points JSONB DEFAULT '[]'::jsonb;
```

### Opção 3: Usar o Painel do Supabase (Se estiver usando Supabase)

1. Acesse o painel do Supabase
2. Vá em **SQL Editor**
3. Cole o seguinte código:

```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS isbt_code TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_collection_point BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS collection_points JSONB DEFAULT '[]'::jsonb;
```

4. Clique em **Run** para executar

## 🔍 Verificação

Após executar a migração, você pode verificar se funcionou:

```sql
-- Verificar a estrutura da tabela clients
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN ('isbt_code', 'has_collection_point', 'collection_points');
```

Você deve ver algo como:

```
     column_name      |   data_type   | is_nullable 
----------------------+---------------+-------------
 isbt_code            | text          | YES
 has_collection_point | boolean       | YES
 collection_points    | jsonb         | YES
```

## 📝 Notas Importantes

- A cláusula `IF NOT EXISTS` garante que a migração pode ser executada múltiplas vezes sem erro
- Os valores padrão são:
  - `isbt_code`: NULL (vazio)
  - `has_collection_point`: FALSE
  - `collection_points`: `[]` (array JSON vazio)

## 🚀 Próximos Passos

Após executar a migração:

1. Recarregue a página da aplicação (F5)
2. Tente salvar o ISBT novamente
3. O erro não deve mais aparecer

## ❓ Ainda com Problemas?

Se o erro persistir após executar a migração:

1. Verifique os logs do navegador (F12 → Console)
2. Verifique os logs do servidor PHP/PostgreSQL
3. Confirme que está conectado ao banco de dados correto
4. Verifique se o usuário do banco tem permissões para alterar a tabela

---

**Criado em:** 29/01/2026  
**Arquivo de Migração:** `database/migration_isbt.sql`
