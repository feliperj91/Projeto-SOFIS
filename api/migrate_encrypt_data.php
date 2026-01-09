<?php
/**
 * Script de Migração - Criptografar Dados Existentes
 * Execute apenas UMA VEZ após implementar criptografia
 * 
 * ATENÇÃO: Faça backup do banco antes de executar!
 */

require 'db.php';
require 'security.php';

echo "🔐 MIGRAÇÃO DE CRIPTOGRAFIA - Dados Existentes\n";
echo "==============================================\n\n";

// Contador de estatísticas
$stats = [
    'clients_processed' => 0,
    'contacts_encrypted' => 0,
    'servers_encrypted' => 0,
    'vpns_encrypted' => 0,
    'urls_encrypted' => 0,
    'phones_encrypted' => 0,
    'emails_encrypted' => 0,
    'passwords_encrypted' => 0,
];

try {
    // Buscar todos os clientes
    $stmt = $pdo->query('SELECT * FROM clients ORDER BY id ASC');
    $clients = $stmt->fetchAll();
    
    echo "📊 Total de clientes encontrados: " . count($clients) . "\n\n";
    
    foreach ($clients as $client) {
        echo "Processando: {$client['name']} (ID: {$client['id']})...\n";
        
        $updated = false;
        
        // Decodificar dados JSON
        $contacts = json_decode($client['contacts'] ?? '[]', true);
        $servers = json_decode($client['servers'] ?? '[]', true);
        $vpns = json_decode($client['vpns'] ?? '[]', true);
        $urls = json_decode($client['urls'] ?? '[]', true);
        
        // 1. Criptografar CONTATOS (telefones e emails)
        if (is_array($contacts) && count($contacts) > 0) {
            foreach ($contacts as &$contact) {
                // Telefones
                if (isset($contact['phones']) && is_array($contact['phones'])) {
                    foreach ($contact['phones'] as &$phone) {
                        if (!SecurityUtil::isEncrypted($phone)) {
                            $phone = SecurityUtil::encrypt($phone);
                            $stats['phones_encrypted']++;
                            $updated = true;
                        }
                    }
                }
                
                // Emails
                if (isset($contact['emails']) && is_array($contact['emails'])) {
                    foreach ($contact['emails'] as &$email) {
                        if (!SecurityUtil::isEncrypted($email)) {
                            $email = SecurityUtil::encrypt($email);
                            $stats['emails_encrypted']++;
                            $updated = true;
                        }
                    }
                }
            }
            if ($updated) $stats['contacts_encrypted']++;
        }
        
        // 2. Criptografar SERVIDORES (senhas e credenciais)
        if (is_array($servers) && count($servers) > 0) {
            foreach ($servers as &$server) {
                // Senha do servidor
                if (isset($server['password']) && !SecurityUtil::isEncrypted($server['password'])) {
                    $server['password'] = SecurityUtil::encrypt($server['password']);
                    $stats['passwords_encrypted']++;
                    $updated = true;
                }
                
                // Credenciais do banco
                if (isset($server['credentials']) && is_array($server['credentials'])) {
                    foreach ($server['credentials'] as &$cred) {
                        if (isset($cred['password']) && !SecurityUtil::isEncrypted($cred['password'])) {
                            $cred['password'] = SecurityUtil::encrypt($cred['password']);
                            $stats['passwords_encrypted']++;
                            $updated = true;
                        }
                    }
                }
            }
            if ($updated) $stats['servers_encrypted']++;
        }
        
        // 3. Criptografar VPNs (senhas)
        if (is_array($vpns) && count($vpns) > 0) {
            foreach ($vpns as &$vpn) {
                if (isset($vpn['password']) && !SecurityUtil::isEncrypted($vpn['password'])) {
                    $vpn['password'] = SecurityUtil::encrypt($vpn['password']);
                    $stats['passwords_encrypted']++;
                    $updated = true;
                }
            }
            if ($updated) $stats['vpns_encrypted']++;
        }
        
        // 4. Criptografar URLs (se houver senhas)
        if (is_array($urls) && count($urls) > 0) {
            foreach ($urls as &$url) {
                if (isset($url['password']) && !SecurityUtil::isEncrypted($url['password'])) {
                    $url['password'] = SecurityUtil::encrypt($url['password']);
                    $stats['passwords_encrypted']++;
                    $updated = true;
                }
            }
            if ($updated) $stats['urls_encrypted']++;
        }
        
        // Atualizar no banco se houve mudanças
        if ($updated) {
            $sql = "UPDATE clients SET contacts = ?, servers = ?, vpns = ?, urls = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                json_encode($contacts),
                json_encode($servers),
                json_encode($vpns),
                json_encode($urls),
                $client['id']
            ]);
            
            $stats['clients_processed']++;
            echo "  ✓ Atualizado\n";
        } else {
            echo "  - Nenhuma alteração necessária\n";
        }
    }
    
    echo "\n";
    echo "==============================================\n";
    echo "✅ MIGRAÇÃO CONCLUÍDA!\n";
    echo "==============================================\n\n";
    echo "📊 Estatísticas:\n";
    echo "  • Clientes processados: {$stats['clients_processed']}\n";
    echo "  • Contatos criptografados: {$stats['contacts_encrypted']}\n";
    echo "  • Servidores criptografados: {$stats['servers_encrypted']}\n";
    echo "  • VPNs criptografadas: {$stats['vpns_encrypted']}\n";
    echo "  • URLs criptografadas: {$stats['urls_encrypted']}\n";
    echo "  • Telefones criptografados: {$stats['phones_encrypted']}\n";
    echo "  • Emails criptografados: {$stats['emails_encrypted']}\n";
    echo "  • Senhas criptografadas: {$stats['passwords_encrypted']}\n";
    echo "\n";
    echo "🔍 Verificação:\n";
    echo "  Execute: php api/test_encryption.php\n";
    echo "\n";
    
} catch (Exception $e) {
    echo "\n❌ ERRO: " . $e->getMessage() . "\n";
    echo "Rollback automático não disponível. Restaure do backup se necessário.\n";
    exit(1);
}
