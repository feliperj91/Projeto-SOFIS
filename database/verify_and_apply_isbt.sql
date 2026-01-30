-- ================================================
-- Script de Verificação e Aplicação da Migração ISBT
-- Data: 29/01/2026
-- ================================================

-- 1. Verificar se as colunas já existem
SELECT 
    'Verificando colunas existentes...' AS status;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN ('isbt_code', 'has_collection_point', 'collection_points')
ORDER BY column_name;

-- 2. Aplicar a migração (IF NOT EXISTS garante que não haverá erro se já existir)
SELECT 'Aplicando migração ISBT...' AS status;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS isbt_code TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_collection_point BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS collection_points JSONB DEFAULT '[]'::jsonb;

-- 3. Verificar novamente após a migração
SELECT 'Verificando resultado da migração...' AS status;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN ('isbt_code', 'has_collection_point', 'collection_points')
ORDER BY column_name;

-- 4. Contar quantos clientes já têm dados ISBT
SELECT 'Estatísticas de dados ISBT...' AS status;

SELECT 
    COUNT(*) AS total_clientes,
    COUNT(isbt_code) AS clientes_com_isbt_code,
    COUNT(CASE WHEN has_collection_point = TRUE THEN 1 END) AS clientes_com_posto_coleta,
    COUNT(CASE WHEN collection_points IS NOT NULL AND collection_points != '[]'::jsonb THEN 1 END) AS clientes_com_pontos_cadastrados
FROM clients;

-- 5. Mensagem final
SELECT '✅ Migração ISBT concluída com sucesso!' AS resultado;
