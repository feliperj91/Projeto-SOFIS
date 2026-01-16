-- ================================================================
-- MIGRATION: Separar "Gestão de Usuários" em 3 módulos
-- Data: 2026-01-16
-- Descrição: 
--   - Divide "Gestão de Usuários" em: Usuários, Permissões, Logs de Auditoria
--   - Cria módulo separado "Servidores" (anteriormente usava SQL)
-- ================================================================

BEGIN;

-- ================================================================
-- PARTE 1: Migração de "Gestão de Usuários"
-- ================================================================

-- Verifica se a migração já foi executada
DO $$
BEGIN
    -- Se "Usuários" já existe, pula esta migração
    IF EXISTS (SELECT 1 FROM permissions WHERE module = 'Usuários' LIMIT 1) THEN
        RAISE NOTICE 'Migração já executada: módulo "Usuários" já existe.';
    ELSE
        RAISE NOTICE 'Iniciando migração de "Gestão de Usuários"...';
        
        -- 1.1 Criar módulo "Usuários" (CRUD completo)
        INSERT INTO permissions (role_name, module, can_view, can_create, can_edit, can_delete)
        SELECT 
            role_name, 
            'Usuários' as module,
            can_view,
            can_create,
            can_edit,
            can_delete
        FROM permissions 
        WHERE module = 'Gestão de Usuários';

        RAISE NOTICE 'Criado módulo "Usuários" (% registros)', 
            (SELECT COUNT(*) FROM permissions WHERE module = 'Usuários');

        -- 1.2 Criar módulo "Permissões" (apenas view + edit)
        INSERT INTO permissions (role_name, module, can_view, can_create, can_edit, can_delete)
        SELECT 
            role_name, 
            'Permissões' as module,
            can_view,
            FALSE as can_create,  -- Permissões não tem create
            can_edit,
            FALSE as can_delete   -- Permissões não tem delete
        FROM permissions 
        WHERE module = 'Gestão de Usuários';

        RAISE NOTICE 'Criado módulo "Permissões" (% registros)', 
            (SELECT COUNT(*) FROM permissions WHERE module = 'Permissões');

        -- 1.3 Criar módulo "Logs de Auditoria" (apenas view + export_pdf)
        -- Nota: can_create será usado para can_export_pdf
        INSERT INTO permissions (role_name, module, can_view, can_create, can_edit, can_delete)
        SELECT 
            role_name, 
            'Logs de Auditoria' as module,
            can_view,
            can_view as can_create,  -- can_create = can_export_pdf (se pode ver, pode exportar por padrão)
            FALSE as can_edit,       -- Logs não tem edit
            FALSE as can_delete      -- Logs não tem delete
        FROM permissions 
        WHERE module = 'Gestão de Usuários';

        RAISE NOTICE 'Criado módulo "Logs de Auditoria" (% registros)', 
            (SELECT COUNT(*) FROM permissions WHERE module = 'Logs de Auditoria');

        -- 1.4 Deletar o módulo antigo "Gestão de Usuários"
        DELETE FROM permissions WHERE module = 'Gestão de Usuários';

        RAISE NOTICE 'Módulo antigo "Gestão de Usuários" removido.';
    END IF;
END $$;

-- ================================================================
-- PARTE 2: Criar módulo "Servidores" separado
-- ================================================================

DO $$
BEGIN
    -- Se "Servidores" já existe, pula esta parte
    IF EXISTS (SELECT 1 FROM permissions WHERE module = 'Servidores' LIMIT 1) THEN
        RAISE NOTICE 'Módulo "Servidores" já existe.';
    ELSE
        RAISE NOTICE 'Criando módulo "Servidores"...';
        
        -- Criar "Servidores" copiando as permissões de "Dados de Acesso (SQL)"
        -- Isso garante que quem tinha acesso a SQL também tem acesso a Servidores
        INSERT INTO permissions (role_name, module, can_view, can_create, can_edit, can_delete)
        SELECT 
            role_name, 
            'Servidores' as module,
            can_view,
            can_create,
            can_edit,
            can_delete
        FROM permissions 
        WHERE module = 'Dados de Acesso (SQL)';

        RAISE NOTICE 'Criado módulo "Servidores" (% registros)', 
            (SELECT COUNT(*) FROM permissions WHERE module = 'Servidores');
    END IF;
END $$;

-- ================================================================
-- VERIFICAÇÃO FINAL
-- ================================================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'VERIFICAÇÃO FINAL DA MIGRAÇÃO';
    RAISE NOTICE '================================================';
    
    SELECT COUNT(DISTINCT module) INTO v_count FROM permissions;
    RAISE NOTICE 'Total de módulos no sistema: %', v_count;
    
    -- Lista todos os módulos
    RAISE NOTICE 'Módulos existentes:';
    FOR v_count IN 
        SELECT DISTINCT module FROM permissions ORDER BY module
    LOOP
        RAISE NOTICE '  - %', v_count;
    END LOOP;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '================================================';
END $$;

COMMIT;

-- ================================================================
-- ROLLBACK (caso necessário - executar manualmente)
-- ================================================================
-- Para reverter esta migração, execute:
--
-- BEGIN;
-- 
-- -- Recriar "Gestão de Usuários" 
-- INSERT INTO permissions (role_name, module, can_view, can_create, can_edit, can_delete)
-- SELECT role_name, 'Gestão de Usuários', can_view, can_create, can_edit, can_delete
-- FROM permissions WHERE module = 'Usuários';
-- 
-- -- Deletar os novos módulos
-- DELETE FROM permissions WHERE module IN ('Usuários', 'Permissões', 'Logs de Auditoria', 'Servidores');
-- 
-- COMMIT;
