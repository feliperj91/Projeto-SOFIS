---
description: Deploy do projeto para a VM Linux (Servidor Apache)
---

Este workflow descreve os passos exatos para enviar as alterações do código local (Windows) para o servidor de produção na VM Linux.

### Passos de Deploy

#### Fase 1: Salvar Alterações (No Windows)

1. **Subir as alterações para o repositório:**
   ```powershell
   git add .
   git commit -m "Relatório das alterações aqui"
   git push origin main
   ```

#### Fase 2: Atualizar a VM (No Linux)

2. **Acessar a pasta do projeto na VM:**
   ```bash
   cd ~/Projeto-Sofis
   ```

3. **Baixar as últimas alterações do Git:**
   ```bash
   git pull
   ```

3. **Copiar os arquivos para a pasta CORRETA do servidor:**
   *Atenção: O site roda em uma subpasta chamada 'sofis', não na raiz.*
   ```bash
   sudo cp -r ~/Projeto-Sofis/* /var/www/html/sofis/
   ```

4. **Executar Migrações de Banco de Dados (Se houver):**
   Se você adicionou novos arquivos `.sql` na pasta `database/`, execute-os:
   ```bash
   psql -h localhost -U sofis_user -d sofis_db -f /var/www/html/sofis/database/nome_da_migracao.sql
   ```

5. **(Opcional) Se houver problemas de permissão:**
   ```bash
   sudo chmod -R 755 /var/www/html/sofis/
   sudo chown -R www-data:www-data /var/www/html/sofis/
   ```

6. **(Opcional) Se houver problemas de cache teimoso, reinicie o Apache:**
   ```bash
   sudo systemctl restart apache2
   ```

### Verificação
- Acessar `http://localhost:8080/index.html`
- Verificar se o número do Build no rodapé/topo foi atualizado.
