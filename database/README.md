# 🗄️ Database Schemas - SOFIS

Esta pasta contém os schemas SQL utilizados para configurar o banco de dados Supabase do projeto SOFIS.

## 📋 Arquivos

### `auth_schema.sql`
Schema de autenticação e usuários do sistema.
- Tabela `users` com credenciais criptografadas
- Controle de roles (ADMINISTRADOR, ANALISTA, TÉCNICO)

### `management_schema.sql`
Schema de gerenciamento de permissões.
- Tabela `permissions` para controle granular de acesso
- Relacionamento com roles de usuários

### `supabase_schema.sql`
Schema principal do sistema.
- Tabela `clients` - Cadastro de clientes
- Tabela `contacts` - Contatos dos clientes
- Tabela `servers` - Dados de acesso SQL
- Tabela `vpns` - Credenciais VPN
- Tabela `urls` - URLs de sistemas

### `version_control_schema.sql`
Schema de controle de versões.
- Tabela `versions` - Histórico de atualizações
- Relacionamento com clientes e sistemas

### `migration_favorites.sql`
Migração para adicionar sistema de favoritos.
- Adiciona campo `is_favorite` na tabela `clients`

## 🚀 Como Usar

Estes schemas já foram aplicados no Supabase em produção. Mantenha-os aqui apenas como:
- 📚 Referência de estrutura
- 🔄 Backup da configuração
- 📖 Documentação do banco

## ⚠️ Importante

**NÃO execute estes scripts diretamente no banco de produção!**  
Eles são apenas para referência. Qualquer alteração no schema deve ser feita através do painel do Supabase ou com muito cuidado.

---

**Última atualização:** Janeiro 2026
