# Build 2.1.0 - Credenciais Individuais e Refinamento de Permissões
**Data:** 2026-01-19 00:16
**Tipo:** Feature & Security Update

## 🎯 Resumo
Esta build introduz o sistema de **Credenciais Individuais** (Privadas) para VPNs e URLs, permitindo que cada técnico armazene seus próprios dados de acesso com privacidade. Além disso, foram feitos ajustes críticos de segurança para administradores e refinamentos visuais na interface.

---

## 🚀 Novas Funcionalidades

### 1. Credenciais Individuais (Privacidade)
- **Novidade:** Agora é possível marcar credenciais de VPN ou URL como "Privadas".
- **Privacidade Real:** Registros privados são visíveis **apenas** para o dono que os criou.
- **Badge Inteligente:** O contador de registros (badges) nos cards de clientes agora reflete apenas o que o usuário logado tem permissão para ver (Públicos + Seus próprios privados).
- **Arquivos:** `assets/js/app.js`, `index.html`

---

## 🛡️ Segurança e Permissões

### 1. Gestão de Histórico de Versões (Admin)
- **Correção:** Administradores agora podem excluir ou editar registros de histórico criados por qualquer usuário (anteriormente restrito ao dono).
- **Validação no Servidor:** Ajustada a API para reconhecer o papel de administrador e ignorar a trava de propriedade.
- **Arquivo:** `api/version-history.php`

### 2. Otimização de Auditoria
- **Correção:** Resolvido problema de logs duplicados ao ativar/inativar usuários.
- **Tratamento de Dados:** Filtro de segurança mantido para mascarar senhas nos detalhes dos logs.
- **Arquivo:** `assets/js/user-management.js`

---

## 🎨 Interface do Usuário (UI/UX)

### 1. Refinamento de Labels e Divisores
- **Padronização:** Labels atualizados para maior clareza:
  - "Bridge data_access" ➔ **Bridge (_data_access)**
  - "Bootstrap" ➔ **BootStrap (WebUpdate)**
  - "Atualização de Executáveis" ➔ **Atualização de Executáveis (Link de Download)**
- **Organização:** Adicionados divisores visuais (`<hr>`) com opacidade suave para separar seções nos modais de URLs.
- **Botão de Reset:** Ajustada a altura do botão "Resetar Senha" para 24px, alinhando-o perfeitamente com o switch de "Conta Ativa".

---

## 🛠️ Arquivos Modificados
- `assets/js/build-config.js`: Upgrade para v2.1.0
- `api/version-history.php`: Liberação de exclusão/edição para Admins
- `assets/js/app.js`: Lógica de badges privados e labels de URL
- `assets/js/user-management.js`: Remoção de logs duplicados
- `index.html`: Ajustes visuais de botões e divisores

---

## 🎯 Impacto
- ✅ **Privacidade:** Técnicos podem salvar senhas pessoais com segurança.
- ✅ **Autonomia Admin:** Administradores recuperam controle total sobre o histórico.
- ✅ **Consistência Visual:** Interface mais organizada e botões alinhados.
- ✅ **Auditoria Limpa:** Logs sem redundância.

---

**Status:** ✅ Produção
