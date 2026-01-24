# Guia de Colaboração com Antigravity

Este documento serve como contexto para Agentes de IA (Antigravity) e desenvolvedores que colaboram neste projeto.

## 🤖 Workflows Disponíveis
O projeto possui workflows definidos na pasta `.agent/workflows`. Ambos os colaboradores devem usar estes comandos para manter consistência.

- **/deploy-to-vm**: 
  - **O que faz:** Guia o processo de "Push no Windows -> Pull na VM -> Cópia para Apache".
  - **Quando usar:** Sempre que quiser ver uma alteração rodando no servidor local.
  
- **/checkpoint**: 
  - **O que faz:** Cria Tag git e Backup do Banco.
  - **Quando usar:** Antes de grandes alterações ou ao finalizar uma feature importante.

- **/update-build**:
  - **O que faz:** Atualiza versão no rodapé e changelog.
  - **Quando usar:** Ao finalizar uma sessão de trabalho significativa.

## 🛠 Configuração do Ambiente (Para novos colaboradores)
1. **Clone do Repositório**: `git clone ...`
2. **Setup da VM**:
   - A VM deve ter o Apache configurado para servir `/var/www/html/sofis`.
   - As credenciais de banco devem estar em um arquivo `.env` (copiar de `.env.example`).
3. **Dependências**:
   - Este é um projeto PHP/JS Vanilla. O `package.json` é usado principalmente para ferramentas de dev (se houver).

## 🔄 Ciclo de Trabalho Sugerido
1. `git pull` (Windows)
2. **CODAR** (Windows)
3. `git push` (Windows)
4. `/deploy-to-vm` (Seguir instruções para atualizar a VM)

## 📝 Comunicação entre Agentes
Se precisar deixar contexto para o próximo desenvolvedor/agente, atualize o arquivo `docs/DEV_NOTES.md` (crie se não existir) com o status atual de tarefas complexas.
