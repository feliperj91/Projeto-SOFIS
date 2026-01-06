// Project Changelog Data
// Add new versions at the TOP of the array

window.SOFIS_CHANGELOG = [
    {
        version: '1.9.82',
        date: '2026-01-06',
        title: 'Ajustes de Identificação e Localização',
        changes: [
            { type: 'fix', text: 'Correção: O campo de responsável no histórico agora exibe obrigatoriamente o Nome Completo do usuário.' },
            { type: 'style', text: 'Tradução das etiquetas do histórico (Badges) para termos em Português-BR (NOVIDADE, CORREÇÃO, DESIGN).' },
            { type: 'fix', text: 'Consistência técnica: Retorno do uso de logins como identificadores internos para garantir seleção automática correta em formulários.' }
        ]
    },
    {
        version: '1.9.81',
        date: '2026-01-06',
        title: 'Humanização e Localização de Histórico',
        changes: [
            { type: 'style', text: 'Localização dos nomes de ambientes para Português-BR com acentuação correta (Produção/Homologação).' },
            { type: 'style', text: 'Substituição de termos técnicos por descrições amigáveis no histórico de versões.' },
            { type: 'feat', text: 'Ajuste de labels internos para maior clareza, como "Identificação da Versão" e "Responsável".' }
        ]
    },
    {
        version: '1.9.80',
        date: '2026-01-06',
        title: 'Refinação de Histórico e Responsáveis',
        changes: [
            { type: 'style', text: 'Atualização dos rótulos de filtros no histórico para "Filtrar Produtos" e "Todos os Produtos".' },
            { type: 'feat', text: 'Inclusão de filtro de ambiente (Produção/Homologação) na consulta de histórico.' },
            { type: 'fix', text: 'Correção: O campo "Atualizado por" agora exibe o nome completo do usuário em vez do login.' },
            { type: 'feat', text: 'Implementação de registro automático no histórico ao editar versões existentes.' }
        ]
    },
    {
        version: '1.9.79',
        date: '2026-01-06',
        title: 'Reforço de Segurança e Permissões',
        changes: [
            { type: 'fix', text: 'Remoção do bypass de superusuário para o cargo ADMINISTRADOR, garantindo que todas as ações respeitem as permissões configuradas.' },
            { type: 'fix', text: 'Implementação de controle granular de visibilidade para o módulo de gerenciamento de produtos.' },
            { type: 'fix', text: 'Sincronização global do sistema de permissões com os módulos dinâmicos de versão.' }
        ]
    },
    {
        version: '1.9.78',
        date: '2026-01-06',
        title: 'Correção de Persistência de Dados',
        changes: [
            { type: 'fix', text: 'Remoção de restrição legada (CHECK constraint) que impedia o registro de novos produtos no controle de versões.' },
            { type: 'fix', text: 'Sincronização de validações do banco de dados com o novo sistema de produtos dinâmicos.' }
        ]
    },
    {
        version: '1.9.77',
        date: '2026-01-06',
        title: 'Modernização Estética de Produtos',
        changes: [
            { type: 'style', text: 'Refinação completa do visual dos campos de produtos (input/select) com design moderno e premium.' },
            { type: 'style', text: 'Melhoria na interatividade do botão de salvamento com efeitos de glow e estados dinâmicos.' },
            { type: 'style', text: 'Ajuste de espaçamentos e alinhamento no cabeçalho do modal de produtos.' }
        ]
    },
    {
        version: '1.9.76',
        date: '2026-01-06',
        title: 'Estabilização de Máscaras e UI',
        changes: [
            { type: 'fix', text: 'Remoção de máscara legada que impedia a digitação correta em produtos do tipo Build.' },
            { type: 'style', text: 'Reorganização da sequência de ícones nos cards: Filtro, Histórico, Produto e Registro.' },
            { type: 'fix', text: 'Ajuste na validação de comprimento de versão para aceitar Builds numéricas longas.' }
        ]
    },
    {
        version: '1.9.75',
        date: '2026-01-06',
        title: 'Otimização e Segurança de Produtos',
        changes: [
            { type: 'style', text: 'Formulário de produtos simplificado para linha única e interface compacta.' },
            { type: 'feat', text: 'Botão de salvamento dinâmico (ativa apenas após alterações detectadas).' },
            { type: 'fix', text: 'Bloqueio rigoroso de permissões e ocultação automática do formulário para usuários sem acesso.' },
            { type: 'feat', text: 'Novo atalho de Gerenciamento de Produtos diretamente nos cards de controle de versões.' }
        ]
    },
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
