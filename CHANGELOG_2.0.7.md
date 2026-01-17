# Build 2.0.7 - Refinamento de Auditoria e Segurança
**Data:** 2026-01-17 01:06
**Tipo:** Security Enhancement

## 🎯 Resumo
Esta build foca no fechamento de lacunas de auditoria identificadas na versão anterior, garantindo que operações críticas no controle de versões e gestão de usuários sejam devidamente registradas.

---

## 🔒 Segurança e Auditoria

### 1. Logs de Histórico de Versões
- **Módulo:** `version-control.js`
- **Novidade:** Agora ações de **Edição** e **Exclusão** de registros de histórico de versão geram logs de auditoria detalhados.
  - *Edição:* Registra Produto, Nova Versão e Ambiente.
  - *Exclusão:* Registra qual registro foi removido.

### 2. Logs de Gestão de Usuários
- **Módulo:** `user-management.js`
- **Melhoria:** O diff gerado no log de alteração de usuário agora detecta:
  - **Reset de Senha:** Identifica quando a senha foi alterada ou solicitada redefinição forçada.
  - **Status da Conta:** Registra explicitamente "Conta Reativada" ou "Conta Desativada".

---

## 🛠️ Arquivos Modificados
- `version-control.js`: Adicionado chamadas `window.registerAuditLog` em `submitEditHistory` e `deleteVersionHistory`.
- `user-management.js`: Atualizada lógica de diff na função `saveUser` para incluir campos `password`, `is_active` e `force_password_reset`.
- `changelog.js`: Atualizado histórico de versões.
- `build-config.js`: Bump de versão para 2.0.7.

---
**Status:** ✅ Produção
