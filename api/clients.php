<?php
// api/clients.php
// Enable error reporting for debugging
// Disable error display to prevent HTML in JSON response
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

$method = $_SERVER['REQUEST_METHOD'];

try {
    require 'db.php';
    require_once 'security.php';

    // Auto-migration removed due to permission restrictions.
    // If 'hosts' column is missing, please run:
    // ALTER TABLE clients ADD COLUMN IF NOT EXISTS hosts JSONB DEFAULT '[]';
    // error_log("Method: $method POST/PUT Input: " . file_get_contents('php://input'));

    switch ($method) {
        case 'GET':
            $stmt = $pdo->query('SELECT * FROM clients ORDER BY name ASC');
            $clients = $stmt->fetchAll();
            foreach ($clients as &$c) {
                $c['contacts'] = json_decode($c['contacts'] ?? '[]');
                $c['servers'] = json_decode($c['servers'] ?? '[]');
                $c['vpns'] = json_decode($c['vpns'] ?? '[]');
                $c['urls'] = json_decode($c['urls'] ?? '[]');
                $c['web_laudo'] = json_decode($c['web_laudo'] ?? 'null');
                $c['inactive_contract'] = json_decode($c['inactive_contract'] ?? 'null');
                $c['collection_points'] = json_decode($c['collection_points'] ?? '[]');


                // Decrypt contact data
                if (is_array($c['contacts'])) {
                    foreach ($c['contacts'] as &$contact) {
                        if (isset($contact->phones)) {
                            $contact->phones = SecurityUtil::decryptPhones($contact->phones);
                        }
                        if (isset($contact->emails)) {
                            $contact->emails = SecurityUtil::decryptEmails($contact->emails);
                        }
                    }
                }

                // Decrypt servers data (passwords and credentials)
                if (is_array($c['servers'])) {
                    $c['servers'] = SecurityUtil::decryptServers($c['servers']);
                }

                // Decrypt VPNs data (passwords)
                if (is_array($c['vpns'])) {
                    $c['vpns'] = SecurityUtil::decryptVpns($c['vpns']);
                }

                // Decrypt URLs data (if any passwords)
                if (is_array($c['urls'])) {
                    $c['urls'] = SecurityUtil::decryptUrls($c['urls']);
                }

                // Decrypt Hosts data
                $c['hosts'] = json_decode($c['hosts'] ?? '[]');
                if (is_array($c['hosts'])) {
                    $c['hosts'] = SecurityUtil::decryptHosts($c['hosts']);
                }

                // Decrypt WebLaudo data
                if (isset($c['web_laudo'])) {
                    $c['web_laudo'] = SecurityUtil::decryptWebLaudo($c['web_laudo']);
                }

            }
            $json = json_encode($clients);
            if ($json === false) {
                throw new Exception('JSON Encode Error: ' . json_last_error_msg());
            }
            echo $json;
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);

            // Encrypt contact data before saving
            if (isset($input['contacts']) && is_array($input['contacts'])) {
                foreach ($input['contacts'] as &$contact) {
                    if (isset($contact['phones'])) {
                        $contact['phones'] = SecurityUtil::encryptPhones($contact['phones']);
                    }
                    if (isset($contact['emails'])) {
                        $contact['emails'] = SecurityUtil::encryptEmails($contact['emails']);
                    }
                }
            }

            // Encrypt servers data (passwords and credentials)
            if (isset($input['servers']) && is_array($input['servers'])) {
                $input['servers'] = SecurityUtil::encryptServers($input['servers']);
            }

            // Encrypt VPNs data (passwords)
            if (isset($input['vpns']) && is_array($input['vpns'])) {
                $input['vpns'] = SecurityUtil::encryptVpns($input['vpns']);
            }

            // Encrypt URLs data (if any passwords)
            if (isset($input['urls']) && is_array($input['urls'])) {
                $input['urls'] = SecurityUtil::encryptUrls($input['urls']);
            }

            // Encrypt Hosts data
            if (isset($input['hosts']) && is_array($input['hosts'])) {
                $input['hosts'] = SecurityUtil::encryptHosts($input['hosts']);
            }

            // Encrypt WebLaudo data
            if (isset($input['web_laudo'])) {
                $input['web_laudo'] = SecurityUtil::encryptWebLaudo($input['web_laudo']);
            }

            $sql = "INSERT INTO clients (name, document, contacts, servers, vpns, hosts, urls, notes, web_laudo, inactive_contract, isbt_code, has_collection_point, collection_points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['name'],
                $input['document'] ?? null,
                json_encode($input['contacts'] ?? []),
                json_encode($input['servers'] ?? []),
                json_encode($input['vpns'] ?? []),
                json_encode($input['hosts'] ?? []),
                json_encode($input['urls'] ?? []),
                $input['notes'] ?? null,
                json_encode($input['web_laudo'] ?? null),
                json_encode($input['inactive_contract'] ?? null),
                $input['isbt_code'] ?? null,
                isset($input['has_collection_point']) ? ($input['has_collection_point'] ? 'true' : 'false') : 'false',
                json_encode($input['collection_points'] ?? [])
            ]);

            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;

        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID missing']);
                exit;
            }

            // Encrypt contact data before saving
            if (isset($input['contacts']) && is_array($input['contacts'])) {
                foreach ($input['contacts'] as &$contact) {
                    if (isset($contact['phones'])) {
                        $contact['phones'] = SecurityUtil::encryptPhones($contact['phones']);
                    }
                    if (isset($contact['emails'])) {
                        $contact['emails'] = SecurityUtil::encryptEmails($contact['emails']);
                    }
                }
            }

            // Encrypt servers data (passwords and credentials)
            if (isset($input['servers']) && is_array($input['servers'])) {
                $input['servers'] = SecurityUtil::encryptServers($input['servers']);
            }

            // Encrypt VPNs data (passwords)
            if (isset($input['vpns']) && is_array($input['vpns'])) {
                $input['vpns'] = SecurityUtil::encryptVpns($input['vpns']);
            }

            // Encrypt URLs data (if any passwords)
            if (isset($input['urls']) && is_array($input['urls'])) {
                $input['urls'] = SecurityUtil::encryptUrls($input['urls']);
            }

            // Encrypt Hosts data
            if (isset($input['hosts']) && is_array($input['hosts'])) {
                $input['hosts'] = SecurityUtil::encryptHosts($input['hosts']);
            }

            // Encrypt WebLaudo data
            if (isset($input['web_laudo'])) {
                $input['web_laudo'] = SecurityUtil::encryptWebLaudo($input['web_laudo']);
            }

            $sql = "UPDATE clients SET name = ?, document = ?, contacts = ?, servers = ?, vpns = ?, hosts = ?, urls = ?, notes = ?, web_laudo = ?, inactive_contract = ?, isbt_code = ?, has_collection_point = ?, collection_points = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['name'],
                $input['document'] ?? null,
                json_encode($input['contacts'] ?? []),
                json_encode($input['servers'] ?? []),
                json_encode($input['vpns'] ?? []),
                json_encode($input['hosts'] ?? []),
                json_encode($input['urls'] ?? []),
                $input['notes'] ?? null,
                json_encode($input['web_laudo'] ?? null),
                json_encode($input['inactive_contract'] ?? null),
                $input['isbt_code'] ?? null,
                isset($input['has_collection_point']) ? ($input['has_collection_point'] ? 'true' : 'false') : 'false',
                json_encode($input['collection_points'] ?? []),
                $_GET['id']
            ]);

            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID missing']);
                exit;
            }
            $stmt = $pdo->prepare("DELETE FROM clients WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(['success' => true]);
            break;
    }
} catch (Throwable $e) {
    // Log the error to disk in case display_errors is off
    file_put_contents('debug_error.log', date('[Y-m-d H:i:s] ') . "CRITICAL EXCEPTION: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine() . "\n" . $e->getTraceAsString() . "\n", FILE_APPEND);

    http_response_code(500);
    // Force specific headers to ensure it is treated as JSON
    header('Content-Type: application/json');
    // Security: Do not expose internal details to client
    echo json_encode(['error' => 'Erro interno do servidor. Por favor, contate o administrador.']);
}
?>