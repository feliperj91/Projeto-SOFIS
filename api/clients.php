<?php
// api/clients.php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$method = $_SERVER['REQUEST_METHOD'];

try {
    require 'db.php';
    require 'security.php';
    
    // Debug logging
    file_put_contents('debug_log.txt', date('[Y-m-d H:i:s] ') . "Method: $method POST/PUT Input: " . file_get_contents('php://input') . "\n", FILE_APPEND);

    switch ($method) {
        case 'GET':
            $stmt = $pdo->query('SELECT * FROM clients ORDER BY name ASC');
            $clients = $stmt->fetchAll();
            foreach ($clients as &$c) {
                $c['contacts'] = json_decode($c['contacts'] ?? '[]');
                $c['servers'] = json_decode($c['servers'] ?? '[]');
                $c['vpns'] = json_decode($c['vpns'] ?? '[]');
                $c['urls'] = json_decode($c['urls'] ?? '[]');
                $c['inactive_contract'] = json_decode($c['inactive_contract'] ?? 'null');
                
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
            
            $sql = "INSERT INTO clients (name, document, contacts, servers, vpns, urls, notes, inactive_contract) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['name'],
                $input['document'] ?? null,
                json_encode($input['contacts'] ?? []),
                json_encode($input['servers'] ?? []),
                json_encode($input['vpns'] ?? []),
                json_encode($input['urls'] ?? []),
                $input['notes'] ?? null,
                json_encode($input['inactive_contract'] ?? null)
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
            $sql = "UPDATE clients SET name = ?, document = ?, contacts = ?, servers = ?, vpns = ?, urls = ?, notes = ?, inactive_contract = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['name'],
                $input['document'] ?? null,
                json_encode($input['contacts'] ?? []),
                json_encode($input['servers'] ?? []),
                json_encode($input['vpns'] ?? []),
                json_encode($input['urls'] ?? []),
                $input['notes'] ?? null,
                json_encode($input['inactive_contract'] ?? null),
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
    echo json_encode(['error' => 'Critical Server Error: ' . $e->getMessage(), 'details' => $e->getTraceAsString()]);
}
?>
