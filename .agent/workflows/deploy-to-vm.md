---
description: Deploy do projeto para a VM Linux (Servidor Apache)
---

Este workflow descreve os passos exatos para enviar as alterações do código local (Windows) para o servidor de produção na VM Linux.

### Pré-requisitos
- Commit e Push das alterações no Windows.
- Acesso à máquina virtual via terminal.

### Passos de Deploy

1. **Acessar a pasta do projeto na VM:**
   ```bash
   cd ~/Projeto-Sofis
   ```

2. **Baixar as últimas alterações do Git:**
   ```bash
   git pull
   ```

3. **Copiar os arquivos para a pasta CORRETA do servidor:**
   *Atenção: O site roda em uma subpasta chamada 'sofis', não na raiz.*
   ```bash
   sudo cp -r ~/Projeto-Sofis/* /var/www/html/sofis/
   ```

4. **(Opcional) Se houver problemas de permissão:**
   ```bash
   sudo chmod -R 777 /var/www/html/sofis/
   ```

5. **(Opcional) Se houver problemas de cache teimoso, reinicie o Apache:**
   ```bash
   sudo systemctl restart apache2
   ```

### Verificação
- Acessar `http://localhost:8080/index.html`
- Verificar se o número do Build no rodapé/topo foi atualizado.
