# 🛡️ Guia de Segurança e Configuração na VM

Este guia descreve como configurar as variáveis de ambiente de segurança no servidor de produção (Linux/Apache).

## 1. Configurar Chave de Criptografia

Para garantir a segurança dos dados sensíveis (senhas de servidores, VPNs), você deve definir a chave de criptografia no ambiente do Apache.

### Passo 1: Obter a Chave Atual
Atualmente, o sistema está utilizando a chave padrão hardcoded. Para evitar perda de dados, você deve configurar **exatamente esta chave** no ambiente inicialmente.

Chave Atual: `sofis_secret_system_key_2025_change_me_in_production`

### Passo 2: Editar Configuração do Apache

No terminal da VM:

1. Abra o arquivo de variáveis de ambiente do Apache:
   ```bash
   sudo nano /etc/apache2/envvars
   ```

2. Adicione a seguinte linha no final do arquivo:
   ```bash
   export SOFIS_ENCRYPTION_KEY='sofis_secret_system_key_2025_change_me_in_production'
   ```
   *(Nota: Se você decidir mudar essa chave no futuro, precisará rodar um script de migração para descriptografar e recriptografar todos os dados do banco antes).*

3. Salve o arquivo (`Ctrl+O`, `Enter`) e saia (`Ctrl+X`).

4. Reinicie o Apache para aplicar:
   ```bash
   sudo systemctl restart apache2
   ```

## 2. Verificar Logs de Segurança

O sistema agora loga avisos críticos em `api/debug_error.log` ou no log de erros do Apache.

Para monitorar tentativas de uso sem chave configurada:
```bash
tail -f /var/log/apache2/error.log
```

Se a configuração estiver correta, você **NÃO** deve ver a mensagem: `SECURITY CRITICAL: SOFIS_ENCRYPTION_KEY not set`.
