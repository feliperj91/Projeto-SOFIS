// Project Changelog Data
// Add new versions at the TOP of the array

window.SOFIS_CHANGELOG = [
    {
        version: '2.0.9',
        date: '2026-01-18',
        title: 'Correção de Interface e Melhorias de UX',
        changes: [
            { type: 'fix', text: 'Correção crítica de estilos na página de Gerenciamento de Usuários (remoção de estilos inline).' },
            { type: 'feat', text: 'Checkboxes de permissões não funcionais agora exibem indicador visual de desabilitado (ícone 🚫).' },
            { type: 'feat', text: 'Adicionados botões de Buscar e Imprimir na interface de Logs (apenas ícones, design limpo).' },
            { type: 'imp', text: 'Reorganização da estrutura HTML da toolbar de usuários para layout correto.' },
            { type: 'style', text: 'Melhorias visuais em checkboxes desabilitados (Dashboard, Permissões, Logs, Reset de Senha).' }
        ]
    },
    {
        version: '2.0.8',
        date: '2026-01-18',
        title: 'Manutenção e Limpeza',
        changes: [
            { type: 'refactor', text: 'Reversão de funcionalidade experimental de Perfis Dinâmicos.' },
            { type: 'style', text: 'Correção de estilos para badges de Segurança (SEC) e Documentação (DOC).' },
            { type: 'imp', text: 'Limpeza de código e otimização de scripts de migração.' }
        ]
    },
    {
        version: '2.0.7',
        date: '2026-01-17',
        title: 'Refinamento de Auditoria e Segurança',
        changes: [
            { type: 'sec', text: 'Implementação de logs de auditoria para operações de Histórico de Versões (Edição/Exclusão).' },
            { type: 'sec', text: 'Detalhamento aprimorado em logs de usuários (detecção de reset de senha e mudança de status).' },
            { type: 'doc', text: 'Auditoria completa de cobertura de logs do sistema.' }
        ]
    },
    {
        version: '2.0.6',
        date: '2026-01-17',
        title: 'Estabilização de Permissões',
        changes: [
            { type: 'fix', text: 'Correção crítica na permissão de visualização e exportação de Logs.' },
            { type: 'fix', text: 'Correção de busca de logs (Case insensitive e filtro por Ação).' },
            { type: 'fix', text: 'Correção do modal de edição de histórico de versões.' },
            { type: 'imp', text: 'Padronização visual (botões) e usabilidade de máscaras.' }
        ]
    },
    {
        version: '2.0.5',
        date: '2026-01-16',
        title: 'Sistema de Permissões Granular',
        changes: [
            { type: 'feat', text: 'Implementação de controle de acesso granular por módulo.' },
            { type: 'feat', text: 'Separação de permissões para Servidores, Usuários, Permissões e Logs.' },
            { type: 'sec', text: 'Reforço de segurança no backend para validação de ações.' }
        ]
    },
    {
        version: '2.0.4',
        date: '2026-01-15',
        title: 'Gestão Avançada de WebLaudo',
        changes: [
            { type: 'feat', text: 'Novo layout em blocos para visualização de credenciais (URL, Usuário e Senha).' },
            { type: 'feat', text: 'Botões individuais de cópia e visualização direta de senha no card.' },
            { type: 'fix', text: 'Correção crítica na renderização de clientes após migração de banco.' },
            { type: 'imp', text: 'Botão de cancelar edição e padronização visual premium.' }
        ]
    },
    {
        version: '2.0.3',
        date: '2026-01-14',
        title: 'Módulo de Servidores',
        changes: [
            { type: 'feat', text: 'Novo módulo "Servidores" dedicado: gestão de hosts, IPs e credenciais de acesso.' },
            { type: 'refactor', text: 'Migração completa de estruturas dinâmicas para tabelas dedicadas.' },
            { type: 'sec', text: 'Implementação de criptografia para credenciais de servidores.' }
        ]
    },
    {
        version: '2.0.2',
        date: '2026-01-14',
        title: 'Modernização Visual de Modais',
        changes: [
            { type: 'style', text: 'Redesign completo do modal de "Contrato Inativo" com estilo premium (alertas destacados, botões transparentes e coloridos).' },
            { type: 'fix', text: 'Padronização visual do botão de inativação para alinhar com a versão de produção (Vercel).' }
        ]
    },
    {
        version: '2.0.0',
        date: '2026-01-14',
        title: 'Gestão de Contratos Inativos',
        changes: [
            { type: 'feat', text: 'Implementação de status visual "Cliente Inativo" (linha vermelha e ícone de alerta).' },
            { type: 'style', text: 'Novo design para modal de interações do cliente.' },
            { type: 'fix', text: 'Correção na persistência do status inativo após atualizações.' }
        ]
    },
    {
        version: '1.9.97',
        date: '2026-01-07',
        title: 'Correção de UX na Impressão',
        changes: [
            { type: 'fix', text: 'Impressão assíncrona para evitar travamentos.' },
            { type: 'perf', text: 'Otimização na geração de relatórios.' }
        ]
    },
    {
        version: '1.9.96',
        date: '2026-01-07',
        title: 'Polimento de Impressão',
        changes: [
            { type: 'fix', text: 'Numeração de páginas nativa restaurada na impressão.' },
            { type: 'style', text: 'Redução de margens para economia de papel.' }
        ]
    },
    {
        version: '1.9.95',
        date: '2026-01-06',
        title: 'Refinamento de Relatório',
        changes: [
            { type: 'style', text: 'Limpeza de textos redundantes no cabeçalho.' },
            { type: 'fix', text: 'Ajustes finos no layout de impressão.' }
        ]
    },
    {
        version: '1.9.94',
        date: '2026-01-06',
        title: 'Ajuste em Relatórios',
        changes: [
            { type: 'fix', text: 'Correção de fuso horário nas datas.' },
            { type: 'style', text: 'Remoção de rodapés padrão do navegador.' },
            { type: 'feat', text: 'Resumo de filtros no cabeçalho.' }
        ]
    },
    {
        version: '1.9.93',
        date: '2026-01-06',
        title: 'Relatórios Completos',
        changes: [
            { type: 'feat', text: 'Impressão de todos os registros filtrados.' },
            { type: 'style', text: 'Badge laranja para melhorias.' }
        ]
    },
    {
        version: '1.9.92',
        date: '2026-01-06',
        title: 'Refinamento de Texto',
        changes: [
            { type: 'style', text: 'Ajuste de terminologia em logs.' }
        ]
    },
    {
        version: '1.9.91',
        date: '2026-01-06',
        title: 'Polimento de UI e Logs',
        changes: [
            { type: 'style', text: 'Padronização da barra de pesquisa.' },
            { type: 'feat', text: 'Logs detalham campos alterados exatos.' }
        ]
    },
    {
        version: '1.9.90',
        date: '2026-01-06',
        title: 'Auditoria e Correções',
        changes: [
            { type: 'feat', text: 'Novo módulo de Logs e Auditoria.' },
            { type: 'fix', text: 'Correção crítica na exclusão de clientes.' }
        ]
    }
];
