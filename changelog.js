// Project Changelog Data
// Add new versions at the TOP of the array

window.SOFIS_CHANGELOG = [
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
