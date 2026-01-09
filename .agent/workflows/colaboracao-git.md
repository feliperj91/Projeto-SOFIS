---
description: Guia de colaboração Git entre Felipe (mantenedor) e Jhon (contribuidor)
---

# Guia de Colaboração - Projeto SOFIS

Este documento define o fluxo de trabalho para colaboração no Projeto SOFIS, onde:
- **Felipe** mantém a versão oficial (Linux) em `feliperj91/Projeto-SOFIS`
- **Jhon** contribui com melhorias através de Pull Requests

---

## 📋 Estrutura dos Repositórios

```
feliperj91/Projeto-SOFIS  ← REPOSITÓRIO OFICIAL (Versão Linux)
    ↑
    │ Pull Requests
    │
jhoonmota/Projeto-SOFIS   ← REPOSITÓRIO DE CONTRIBUIÇÃO
```

---

# 🔵 PARTE DO FELIPE (Mantenedor)

## Setup Inicial (Fazer UMA VEZ)

### 1. Adicionar o repositório do Jhon como remote

```bash
cd /caminho/do/projeto
git remote add jhon https://github.com/jhoonmota/Projeto-SOFIS.git
git fetch jhon
```

### 2. Verificar remotes configurados

```bash
git remote -v
```

**Resultado esperado:**
```
origin    https://github.com/feliperj91/Projeto-SOFIS.git (fetch)
origin    https://github.com/feliperj91/Projeto-SOFIS.git (push)
jhon      https://github.com/jhoonmota/Projeto-SOFIS.git (fetch)
jhon      https://github.com/jhoonmota/Projeto-SOFIS.git (push)
```

---

## Workflow Regular - Receber Contribuições do Jhon

### Opção A: Revisar Pull Request no GitHub (RECOMENDADO)

1. **Jhon abrirá um Pull Request** no GitHub
2. Você acessa: https://github.com/feliperj91/Projeto-SOFIS/pulls
3. Revisa as mudanças na interface do GitHub
4. Se aprovar, clica em **"Merge Pull Request"**
5. Puxa as mudanças para sua máquina local:
```bash
git checkout main
git pull origin main
```

### Opção B: Revisar Localmente (Controle Total)

Quando o Jhon avisar que fez mudanças:

```bash
# 1. Buscar as últimas mudanças dele
git fetch jhon

# 2. Ver quais branches ele tem
git branch -r | grep jhon

# 3. Criar uma branch local para revisar
git checkout -b review-jhon-changes
git merge jhon/nome-da-branch-dele

# 4. TESTAR NA VM LINUX
# Rodar o servidor, testar funcionalidades, verificar bugs

# 5. Se estiver tudo OK, fazer merge na main
git checkout main
git merge review-jhon-changes

# 6. Enviar para o repositório oficial
git push origin main

# 7. Limpar a branch de revisão
git branch -d review-jhon-changes
```

---

## Comandos Úteis para Felipe

### Ver mudanças do Jhon antes de incorporar

```bash
# Ver commits novos dele
git fetch jhon
git log main..jhon/main --oneline

# Ver diferenças de código
git diff main..jhon/main

# Ver arquivos modificados
git diff main..jhon/main --name-only
```

### Incorporar commits específicos (Cherry-pick)

Se você quiser pegar apenas alguns commits específicos do Jhon:

```bash
# Ver commits dele
git log jhon/main --oneline -10

# Pegar commit específico
git cherry-pick <hash-do-commit>

# Enviar para o repositório oficial
git push origin main
```

### Resolver Conflitos

Se houver conflitos durante o merge:

```bash
# Git mostrará os arquivos com conflito
git status

# Editar os arquivos manualmente
# Procurar por <<<<<<< HEAD e resolver

# Após resolver
git add .
git commit -m "Merge: Incorporadas mudanças do Jhon"
git push origin main
```

---

# 🟢 PARTE DO JHON (Contribuidor)

## Setup Inicial (Fazer UMA VEZ)

### 1. Configurar o repositório oficial do Felipe como upstream

```bash
cd /caminho/do/seu/projeto
git remote add upstream https://github.com/feliperj91/Projeto-SOFIS.git
git fetch upstream
```

### 2. Verificar remotes configurados

```bash
git remote -v
```

**Resultado esperado:**
```
origin      https://github.com/jhoonmota/Projeto-SOFIS.git (fetch)
origin      https://github.com/jhoonmota/Projeto-SOFIS.git (push)
upstream    https://github.com/feliperj91/Projeto-SOFIS.git (fetch)
upstream    https://github.com/feliperj91/Projeto-SOFIS.git (push)
```

---

## Workflow Regular - Contribuir com Mudanças

### 1. SEMPRE Sincronizar com a Versão Oficial Antes de Começar

```bash
# Ir para a branch principal
git checkout main

# Buscar mudanças do Felipe
git fetch upstream

# Atualizar sua branch main com a versão oficial
git merge upstream/main

# Enviar para seu repositório
git push origin main
```

### 2. Criar uma Branch para sua Feature/Correção

```bash
# Criar e mudar para nova branch
git checkout -b feature/nome-da-funcionalidade

# Exemplos de nomes:
# git checkout -b feature/novo-relatorio
# git checkout -b fix/correcao-login
# git checkout -b improvement/otimizacao-queries
```

### 3. Fazer as Mudanças

```bash
# Fazer suas alterações no código
# Testar localmente

# Adicionar arquivos modificados
git add .

# Fazer commit com mensagem descritiva
git commit -m "Adiciona funcionalidade X que faz Y"

# Enviar para SEU repositório
git push origin feature/nome-da-funcionalidade
```

### 4. Abrir Pull Request no GitHub

1. Acesse: https://github.com/jhoonmota/Projeto-SOFIS
2. GitHub mostrará um botão **"Compare & pull request"**
3. Clique nele
4. **IMPORTANTE:** Verifique se está enviando para:
   - **Base repository:** `feliperj91/Projeto-SOFIS`
   - **Base branch:** `main`
   - **Head repository:** `jhoonmota/Projeto-SOFIS`
   - **Compare branch:** `feature/nome-da-funcionalidade`
5. Escreva uma descrição clara do que foi feito
6. Clique em **"Create Pull Request"**
7. Avise o Felipe que o PR está pronto

### 5. Após o Felipe Fazer Merge

```bash
# Voltar para a main
git checkout main

# Buscar a versão atualizada
git fetch upstream
git merge upstream/main

# Atualizar seu repositório
git push origin main

# Deletar a branch da feature (já foi incorporada)
git branch -d feature/nome-da-funcionalidade
git push origin --delete feature/nome-da-funcionalidade
```

---

## Comandos Úteis para Jhon

### Ver diferenças entre sua versão e a oficial

```bash
git fetch upstream
git log upstream/main..main --oneline
git diff upstream/main..main
```

### Atualizar branch de feature com mudanças novas da main

Se você está trabalhando em uma feature e o Felipe atualizou a main:

```bash
git checkout main
git fetch upstream
git merge upstream/main
git checkout feature/sua-feature
git merge main
```

### Desfazer mudanças locais e voltar para versão oficial

```bash
# CUIDADO: Isso apaga todas as mudanças não commitadas
git fetch upstream
git reset --hard upstream/main
```

---

## 📝 Boas Práticas

### Para Ambos

- ✅ Fazer commits frequentes com mensagens descritivas
- ✅ Testar antes de enviar mudanças
- ✅ Comunicar mudanças grandes antes de implementar
- ✅ Manter branches de feature pequenas e focadas

### Para Jhon

- ✅ SEMPRE sincronizar com upstream antes de criar nova branch
- ✅ Criar branches descritivas (feature/fix/improvement)
- ✅ Escrever descrições claras nos Pull Requests
- ✅ Avisar o Felipe quando abrir PR

### Para Felipe

- ✅ Revisar PRs em tempo hábil
- ✅ Testar mudanças na VM Linux antes de fazer merge
- ✅ Dar feedback construtivo nos PRs
- ✅ Manter a main sempre estável

---

## 🆘 Problemas Comuns

### Jhon: "Meu fork está muito desatualizado"

```bash
git checkout main
git fetch upstream
git reset --hard upstream/main
git push origin main --force
```

### Felipe: "Quero desfazer um merge que fiz"

```bash
# Ver histórico
git log --oneline -5

# Voltar para commit anterior ao merge
git reset --hard <hash-do-commit-anterior>

# Forçar push (CUIDADO!)
git push origin main --force
```

### Conflitos durante merge

1. Git marca os arquivos com conflito
2. Abrir arquivos e procurar por `<<<<<<<`, `=======`, `>>>>>>>`
3. Escolher qual versão manter ou combinar ambas
4. Remover os marcadores de conflito
5. `git add .` e `git commit`

---

## 📞 Comunicação

- **Jhon abre PR** → Avisar Felipe (WhatsApp/Telegram/etc)
- **Felipe precisa de esclarecimento** → Comentar no PR
- **Mudanças grandes** → Discutir antes de implementar
- **Bugs urgentes** → Comunicar imediatamente

---

## 🎯 Resumo Rápido

### Jhon (Contribuidor)
```bash
git checkout main
git fetch upstream && git merge upstream/main
git checkout -b feature/minha-feature
# fazer mudanças
git add . && git commit -m "Descrição"
git push origin feature/minha-feature
# Abrir PR no GitHub
```

### Felipe (Mantenedor)
```bash
# Opção 1: Merge no GitHub (mais fácil)
# Opção 2: Localmente
git fetch jhon
git checkout -b review
git merge jhon/feature-name
# testar
git checkout main && git merge review
git push origin main
```
