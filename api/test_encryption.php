<?php
/**
 * Script de Teste - Validar Criptografia
 * Verifica se os dados estão corretamente criptografados
 */

require 'db.php';
require 'security.php';

echo "🔍 TESTE DE CRIPTOGRAFIA\n";
echo "========================\n\n";

try {
    // Buscar amostra de clientes
    $stmt = $pdo->query('SELECT * FROM clients ORDER BY id DESC LIMIT 5');
    $clients = $stmt->fetchAll();
    
    if (count($clients) === 0) {
        echo "⚠️  Nenhum cliente encontrado no banco.\n";
        exit(0);
    }
    
    echo "📊 Analisando últimos " . count($clients) . " clientes...\n\n";
    
    $total_encrypted = 0;
    $total_plain = 0;
    
    foreach ($clients as $client) {
        echo "Cliente: {$client['name']} (ID: {$client['id']})\n";
        echo str_repeat('-', 50) . "\n";
        
        $contacts = json_decode($client['contacts'] ?? '[]', true);
        $servers = json_decode($client['servers'] ?? '[]', true);
        $vpns = json_decode($client['vpns'] ?? '[]', true);
        
        // Verificar CONTATOS
        if (is_array($contacts) && count($contacts) > 0) {
            foreach ($contacts as $contact) {
                // Telefones
                if (isset($contact['phones']) && is_array($contact['phones'])) {
                    foreach ($contact['phones'] as $phone) {
                        if (SecurityUtil::isEncrypted($phone)) {
                            echo "  ✓ Telefone: [CRIPTOGRAFADO] " . substr($phone, 0, 20) . "...\n";
                            $total_encrypted++;
                        } else {
                            echo "  ✗ Telefone: [TEXTO PURO] $phone\n";
                            $total_plain++;
                        }
                    }
                }
                
                // Emails
                if (isset($contact['emails']) && is_array($contact['emails'])) {
                    foreach ($contact['emails'] as $email) {
                        if (SecurityUtil::isEncrypted($email)) {
                            echo "  ✓ Email: [CRIPTOGRAFADO] " . substr($email, 0, 20) . "...\n";
                            $total_encrypted++;
                        } else {
                            echo "  ✗ Email: [TEXTO PURO] $email\n";
                            $total_plain++;
                        }
                    }
                }
            }
        }
        
        // Verificar SERVIDORES
        if (is_array($servers) && count($servers) > 0) {
            foreach ($servers as $server) {
                // Senha do servidor
                if (isset($server['password'])) {
                    if (SecurityUtil::isEncrypted($server['password'])) {
                        echo "  ✓ Senha SQL: [CRIPTOGRAFADO] " . substr($server['password'], 0, 20) . "...\n";
                        $total_encrypted++;
                    } else {
                        echo "  ✗ Senha SQL: [TEXTO PURO] {$server['password']}\n";
                        $total_plain++;
                    }
                }
                
                // Credenciais
                if (isset($server['credentials']) && is_array($server['credentials'])) {
                    foreach ($server['credentials'] as $cred) {
                        if (isset($cred['password'])) {
                            if (SecurityUtil::isEncrypted($cred['password'])) {
                                echo "  ✓ Credencial: [CRIPTOGRAFADO] " . substr($cred['password'], 0, 20) . "...\n";
                                $total_encrypted++;
                            } else {
                                echo "  ✗ Credencial: [TEXTO PURO] {$cred['password']}\n";
                                $total_plain++;
                            }
                        }
                    }
                }
            }
        }
        
        // Verificar VPNs
        if (is_array($vpns) && count($vpns) > 0) {
            foreach ($vpns as $vpn) {
                if (isset($vpn['password'])) {
                    if (SecurityUtil::isEncrypted($vpn['password'])) {
                        echo "  ✓ Senha VPN: [CRIPTOGRAFADO] " . substr($vpn['password'], 0, 20) . "...\n";
                        $total_encrypted++;
                    } else {
                        echo "  ✗ Senha VPN: [TEXTO PURO] {$vpn['password']}\n";
                        $total_plain++;
                    }
                }
            }
        }
        
        echo "\n";
    }
    
    echo "========================\n";
    echo "📊 RESUMO\n";
    echo "========================\n";
    echo "✓ Dados criptografados: $total_encrypted\n";
    echo "✗ Dados em texto puro: $total_plain\n";
    
    if ($total_plain > 0) {
        echo "\n⚠️  ATENÇÃO: Ainda há dados em texto puro!\n";
        echo "Execute: php api/migrate_encrypt_data.php\n";
    } else {
        echo "\n✅ Todos os dados sensíveis estão criptografados!\n";
    }
    
    echo "\n";
    
} catch (Exception $e) {
    echo "\n❌ ERRO: " . $e->getMessage() . "\n";
    exit(1);
}
