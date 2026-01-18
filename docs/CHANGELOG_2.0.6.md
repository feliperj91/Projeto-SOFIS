# Build 2.0.6 - Correções de Permissões e Refinamentos de Interface
**Data:** 2026-01-17 00:46
**Tipo:** Hotfix & Enhancement

## 🎯 Resumo
Esta versão foca na estabilização do sistema de permissões (especialmente módulos Logs e Produtos), correções críticas na edição de histórico e melhorias de UI/UX padrão.

---

## ✨ Novas Funcionalidades e Correções

### 1. Refinamento de Histórico de Versões
- **API de Edição/Exclusão Corrigida:** Caminhos absolutos substituídos por relativos e blindagem contra erros HTML (JSON-safe).
- **Interface Padronizada:** Botão "Cancelar" e "Salvar" ajustados para o padrão visual do sistema (cinza/laranja).
- **Edição Completa:** Agora permite editar Produto, Ambiente, Data e Notas.
- **Máscara Inteligente:** Ao alterar o produto na edição, a máscara do campo "Versão" se adapta automaticamente (Build vs Pacote).

### 2. Correções de Permissões (Crítica)
- **Módulo "Produtos":** Script de migração executado para remover duplicatas e corrigir permissões de 'Controle de Versões - Produtos'.
- **Módulo "Logs de Auditoria":**
  - Corrigida a visualização indevida da aba "Logs" para usuários sem permissão (agora verifica 'Logs de Auditoria' corretamente).
  - Corrigido o botão de **Impressão de PDF** que não aparecia mesmo para quem tinha acesso (agora vinculado à permissão `can_view`).

### 3. Melhorias de UX
- **Feedback de Erro:** Melhor tratamento de erros de API no frontend, exibindo mensagens claras caso o backend falhe.
- **Botões de Ação:** Padronização visual dos botões de ação nos modais.

---

## 🛠️ Detalhes Técnicos

### Backend (`api/`)
- `version-history.php`: Adicionado supressão de erros HTML (`error_reporting(0)`) e tratamento robusto de exceções com resposta JSON garantida.
- `api/db.php`: Verificado integridade.

### Frontend (`js/`)
- `version-control.js`:
  - Atualização de URLs de fetch para uso relativo (`api/...`).
  - Tratamento de resposta `text()` caso `json()` falhe.
- `user-management.js`:
  - Correção na verificação de permissão da aba Logs (`Logs de Auditoria`).
  - Lógica de visibilidade do botão PDF movida para `checkUserManagementAccess`, garantindo atualização em tempo real.
  - Permissão de impressão alterada para usar `can_view` (Visualizar) em vez da inexistente `can_export_pdf`.

---

## 📝 Instruções de Atualização

### 1. Atualizar Arquivos
Baixar a última versão do `branch` `main` ou `producao`.

### 2. Limpeza de Cache (Obrigatório)
Devido às mudanças em arquivos JS core (`version-control.js`, `user-management.js`):
1. Fazer **Logout**.
2. Pressionar `Ctrl + Shift + R` (Hard Refresh).
3. Fazer **Login** novamente.

### 3. Verificar Permissões
- Administradores devem verificar se usuários do grupo **TECNICO** não estão visualizando a aba de Logs indevidamente.
- Verificar se administradores conseguem ver o botão de Impressão na aba de Logs.

---

**Status:** ✅ Pronto para Produção
