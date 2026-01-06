// Project Changelog Data
// Add new versions at the TOP of the array

window.SOFIS_CHANGELOG = [
    {
        version: '1.9.74',
        date: '2026-01-06',
        title: 'Refinamento e Máscaras Inteligentes',
        changes: [
            { type: 'style', text: 'Redesign completo do gerenciamento de produtos com visual premium e badges.' },
            { type: 'feat', text: 'Implementação de máscara dinâmica no campo Versão (Numérica para Build, Padrão para Pacote).' },
            { type: 'fix', text: 'Validação em tempo real para impedir caracteres inválidos conforme o tipo de produto.' }
        ]
    },
    {
        version: '1.9.73',
        date: '2026-01-06',
        title: 'Gestão Dinâmica de Produtos',
        changes: [
            { type: 'feat', text: 'Substituição do campo estático "Sistema" pelo novo módulo dinâmico "Produto".' },
            { type: 'feat', text: 'Novo modal de gerenciamento de produtos com suporte a Tipos de Versão (Pacote/Build).' },
            { type: 'feat', text: 'Implementação de permissões granulares para o módulo de Produtos.' }
        ]
    },
    {
        version: '1.9.72',
        date: '2026-01-06',
        title: 'Padronização Premium de Alertas',
        changes: [
            { type: 'feat', text: 'Substituição completa de todos os "confirm" e "alert" nativos por modais modernos.' },
            { type: 'style', text: 'Design unificado para diálogos de exclusão de clientes, contatos, SQL e VPN.' },
            { type: 'style', text: 'Melhoria na experiência de usuário com fechamento via ESC e animações suaves.' }
        ]
    },
    {
        version: '1.9.71',
        date: '2026-01-06',
        title: 'Nova Funcionalidade: Histórico de Versões',
        changes: [
            { type: 'feat', text: 'Implementação do Modal de Histórico (Changelog) clicável no rodapé.' },
            { type: 'style', text: 'Estilização da linha do tempo com badges coloridos por tipo de mudança.' }
        ]
    },
    {
        version: '1.9.70',
        date: '2026-01-06',
        title: 'Correções Críticas de UI e Dados',
        changes: [
            { type: 'fix', text: 'Correção crítica no carregamento da lista de clientes no módulo de Versão.' },
            { type: 'fix', text: 'Sincronização robusta do cache de clientes entre módulos.' },
            { type: 'style', text: 'Remoção global do botão de "revelar senha" nativo duplicado.' },
            { type: 'feat', text: 'Adição de logs de diagnóstico para rastreio de conexões Supabase.' }
        ]
    },
    {
        version: '1.9.60',
        date: '2025-12-30',
        title: 'Modernização da Gestão de Usuários',
        changes: [
            { type: 'feat', text: 'Redesign completo da tela de Gestão de Usuários e Permissões.' },
            { type: 'feat', text: 'Implementação de sistema granular de permissões por cargo.' },
            { type: 'style', text: 'Melhorias de espaçamento e layout em Grids.' }
        ]
    },
    {
        version: '1.9.50',
        date: '2025-12-24',
        title: 'Integração Supabase',
        changes: [
            { type: 'feat', text: 'Migração completa do armazenamento local para Supabase.' },
            { type: 'feat', text: 'Sistema de Login com autenticação real.' },
            { type: 'feat', text: 'Dashboard "Pulse" em tempo real.' }
        ]
    }
];
