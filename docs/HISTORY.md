# Histórico de Versões - SOFIS

Este arquivo contém o histórico consolidado de todas as alterações realizadas no sistema.

---

# Build 2.1.0 - Credenciais Individuais e Refinamento de Permissões
**Data:** 2026-01-19 00:16
**Tipo:** Feature & Security Update

## 🎯 Resumo
Esta build introduz o sistema de **Credenciais Individuais** (Privadas) para VPNs e URLs, permitindo que cada técnico armazene seus próprios dados de acesso com privacidade. Além disso, foram feitos ajustes críticos de segurança para administradores e refinamentos visuais na interface.

## 🚀 Novas Funcionalidades
### 1. Credenciais Individuais (Privacidade)
- **Novidade:** Agora é possível marcar credenciais de VPN ou URL como "Privadas".
- **Privacidade Real:** Registros privados são visíveis **apenas** para o dono que os criou.
- **Badge Inteligente:** O contador de registros (badges) nos cards de clientes agora reflete apenas o que o usuário logado tem permissão para ver (Públicos + Seus próprios privados).

## 🛡️ Segurança e Permissões
### 1. Gestão de Histórico de Versões (Admin)
- **Correção:** Administradores agora podem excluir ou editar registros de histórico criados por qualquer usuário (anteriormente restrito ao dono).
- **Validação no Servidor:** Ajustada a API para reconhecer o papel de administrador e ignorar a trava de propriedade.

### 2. Otimização de Auditoria
- **Correção:** Resolvido problema de logs duplicados ao ativar/inativar usuários.
- **Tratamento de Dados:** Filtro de segurança mantido para mascarar senhas nos detalhes dos logs.

## 🎨 Interface do Usuário (UI/UX)
### 1. Refinamento de Labels e Divisores
- **Padronização:** Labels atualizados para maior clareza (Bridge, Bootstrap, Executáveis).
- **Organização:** Adicionados divisores visuais (`<hr>`) nos modais de URLs.
- **Botão de Reset:** Ajustado alinhamento do botão "Resetar Senha" para 24px.

## 🛠️ Arquivos Modificados
- `assets/js/build-config.js`
- `api/version-history.php`
- `assets/js/app.js`
- `assets/js/user-management.js`
- `index.html`

---

# Build 2.0.9 - Correção de Interface e Melhorias de UX
**Data:** 2026-01-18 15:17
**Tipo:** UI/UX Enhancement

## 🎯 Resumo
Esta build corrige problemas críticos de estilo na página de Gerenciamento de Usuários e implementa melhorias significativas na interface de permissões e logs.

## 🎨 Interface do Usuário
- **Gerenciamento de Usuários:** Removidos estilos inline e reorganizada a estrutura HTML.
- **Checkboxes de Permissões:** Adicionados indicadores visuais para permissões não funcionais (🚫).
- **Interface de Logs:** Adicionados botões de ação (Lupa/Impressora) com tooltips.

---

# Build 2.0.7 - Refinamento de Auditoria e Segurança
**Data:** 2026-01-17 01:06
**Tipo:** Security Enhancement

## 🎯 Resumo
Esta build foca no fechamento de lacunas de auditoria identificadas, garantindo o registro de operações críticas.

## 🔒 Segurança e Auditoria
- **Histórico de Versões:** Adicionada auditoria para Edição e Exclusão.
- **Gestão de Usuários:** Melhorada a detecção de diffs para Reset de Senha e Status da Conta.

---

# Build 2.0.6 - Correções de Permissões e Refinamentos de Interface
**Data:** 2026-01-17 00:46
**Tipo:** Hotfix & Enhancement

## 🎯 Resumo
Estabilização do sistema de permissões, correções na edição de histórico e melhorias de UX.

## ✨ Novas Funcionalidades e Correções
- **Histórico de Versões:** Correção de caminhos de API e padronização visual de botões.
- **Módulo Produtos:** Correção de permissões duplicadas.
- **Módulo Logs:** Restrição de visualização baseada em permissão real.

---

# Build 2.0.5 - Sistema de Permissões Granular
**Data:** 2026-01-16 18:24
**Tipo:** Feature

## 🎯 Resumo
Implementação completa de sistema de permissões granular, separando módulos para controle de acesso mais específico e seguro.

## ✨ Novas Funcionalidades
- **Módulo Servidores:** Independente de Dados de Acesso SQL.
- **Submódulos de Usuários:** Divisão em Usuários, Permissões e Logs de Auditoria.
- **Verificações:** Mais de 25 pontos de controle críticos implementados.
