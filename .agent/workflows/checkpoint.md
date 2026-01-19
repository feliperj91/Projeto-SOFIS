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
Copie e cole o comando abaixo no terminal da sua **VM Linux** para gerar o backup:

```bash
# Comando para rodar na VM
PGPASSWORD='sofis123' pg_dump -U sofis_user -d sofis_db -F c -f ~/sofis_db_$(date +%Y%m%d_%H%M).backup
```

### 4. Verificar Backup
Após rodar o comando na VM, verifique se o arquivo foi criado:

```bash
ls -lh ~/sofis_db_*.backup
```
