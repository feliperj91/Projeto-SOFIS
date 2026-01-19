---
description: Atualização de build (versão) e histórico de alterações (Changelog)
---

Este workflow automatiza a atualização da versão do sistema e registra as alterações no histórico unificado, evitando a criação de novos arquivos `.md` a cada build.

### 📝 Passo a Passo

1. **Definição da Versão e Alterações**
   - Identifique o novo número da versão (ex: `2.1.1`).
   - Liste as principais alterações realizadas (Features, Fixes, UI/UX).

2. **Atualização da Configuração de Build**
   // turbo
   - Atualize `assets/js/build-config.js` com a nova versão, data e hora atual.

3. **Atualização da Interface (Changelog JS)**
   // turbo
   - Adicione o novo objeto de versão no TOPO do array `window.SOFIS_CHANGELOG` em `assets/js/changelog.js`.

4. **Registro no Histórico Documental (Markdown)**
   // turbo
   - Adicione as notas de atualização no TOPO do arquivo `docs/HISTORY.md`, logo abaixo do título principal.

5. **Limpeza de Arquivos Antigos**
   - Como agora usamos o `HISTORY.md` unificado, não crie novos arquivos `CHANGELOG_X.X.X.md`.

---

**Comando Sugerido para o Antigravity:**
> "Atualize a build para a versão X.X.X com as seguintes alterações: [lista de alterações]. Use o arquivo HISTORY.md para o registro."
