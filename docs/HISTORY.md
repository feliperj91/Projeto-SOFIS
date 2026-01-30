# Histórico de Versões - SOFIS

Este arquivo contém o histórico consolidado de todas as alterações realizadas no sistema.

---

# Build 2.2.2 - Estabilização de UI e Ajustes de ISBT
**Data:** 2026-01-30 00:43
**Tipo:** Feature, Fix & UI Enhancement

## 🎯 Resumo
Esta build foca na estabilização de elementos da interface que apresentavam comportamentos inconsistentes, além de uma reformulação técnica do módulo ISBT 128 e simplificação do gerenciamento de WebLaudo.

## 🚀 Melhorias e Correções
### 1. Sistema de Notificações (Sino)
- **Correção:** O ícone de notificação (sino) agora responde no primeiro clique.
- **UI/UX:** Removida a escala de zoom no hover que causava sobreposição com ícones vizinhos. Adicionada animação de toque (vibração) acelerada ao passar o mouse para feedback tátil.
- **Estabilidade:** Ícone encapsulado em botão para garantir área de clique estável.

### 2. Módulo ISBT 128
- **Validação:** Implementada máscara estrita que exige o formato `B + 4 números` (ex: B3325).
- **Interface:** Layout do label ajustado para maior clareza, com texto em branco e alinhamento otimizado.
- **Filtro:** Adicionada barra de pesquisa para postos de coleta dentro do modal, facilitando a gestão em clientes com muitas unidades.

### 3. WebLaudo e Credenciais
- **Simplificação:** Removidos campos de Usuário e Senha do WebLaudo (redundantes no fluxo atual), mantendo apenas a URL.
- **Padronização:** Design de campos de credenciais unificado em todos os modais para um visual mais premium e consistente.

## 🛠️ Arquivos Modificados
- `assets/js/app.js`
- `assets/css/style.css`
- `assets/css/credential-styles.css`
- `index.html`
- `assets/js/build-config.js`
- `assets/js/changelog.js`


# Build 2.2.1 - Suporte a Múltiplos Grupos no Frontend
**Data:** 2026-01-20 20:53
**Tipo:** Feature & Fix

## 🎯 Resumo
Esta build foca em corrigir e melhorar a experiência de usuários que possuem múltiplos grupos de acesso. O cabeçalho agora exibe um resumo inteligente e permite visualizar todos os grupos com um clique.

## 🚀 Melhorias
- **Visualização de Papéis:** O cabeçalho agora mostra `[X Grupos]` em vez de apenas o primeiro, quando aplicável.
- **Detalhamento:** Ao clicar no nome do usuário/grupo no topo, um modal lista todos os acessos ativos.
- **Correção:** Eliminado o bug que exibia `[undefined]` antes do carregamento total das permissões.

## 🛠️ Arquivos Modificados
- `assets/js/app.js`
- `assets/js/build-config.js`
- `assets/js/changelog.js`

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
