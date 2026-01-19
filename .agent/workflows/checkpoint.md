---
description: Cria um ponto de restauração seguro (Git Tag) e gera o comando de backup para o banco de dados na VM.
---

Este workflow auxilia na criação de um checkpoint de segurança antes de grandes alterações.

### 1. Criar Ponto de Restauração (Git)
Execute os comandos abaixo para salvar o estado atual do código:

// turbo
```powershell
git add .
$date = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "Checkpoint de Segurança: $date"
git push origin main
```

### 2. Criar Tag de Versão
Escolha uma versão (ex: v2.1.0) e execute:

```powershell
$version = "v2.1.0" # Altere aqui para a versão atual
git tag -a $version -m "Ponto de restauração seguro: $version"
git push origin $version
```

### 3. Backup do Banco de Dados na VM
Execute este comando na sua **VM Linux** para gerar o backup na pasta do projeto:

```bash
# Criar pasta se não existir e gerar backup
mkdir -p ~/Projeto-Sofis/backups && sudo -u postgres pg_dump -d sofis_db -F c | sudo tee ~/Projeto-Sofis/backups/sofis_db_$(date +%Y%m%d_%H%M).backup > /dev/null && sudo chown -R $(whoami):$(whoami) ~/Projeto-Sofis/backups/
```

### 4. Verificar Backup
Após rodar o comando na VM, verifique se o arquivo foi criado:

```bash
ls -lh ~/Projeto-Sofis/backups/sofis_db_*.backup
```
