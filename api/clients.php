<?php
// api/clients.php
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query('SELECT * FROM clients ORDER BY name ASC');
            $clients = $stmt->fetchAll();
            foreach ($clients as &$c) {
                $c['contacts'] = json_decode($c['contacts'] ?? '[]');
                $c['servers'] = json_decode($c['servers'] ?? '[]');
                $c['vpns'] = json_decode($c['vpns'] ?? '[]');
                $c['urls'] = json_decode($c['urls'] ?? '[]');
            }
            echo json_encode($clients);
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $sql = "INSERT INTO clients (name, document, contacts, servers, vpns, urls, notes) VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['name'],
                $input['document'] ?? null,
                json_encode($input['contacts'] ?? []),
                json_encode($input['servers'] ?? []),
                json_encode($input['vpns'] ?? []),
                json_encode($input['urls'] ?? []),
                $input['notes'] ?? null
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
            $sql = "UPDATE clients SET name = ?, document = ?, contacts = ?, servers = ?, vpns = ?, urls = ?, notes = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['name'],
                $input['document'] ?? null,
                json_encode($input['contacts'] ?? []),
                json_encode($input['servers'] ?? []),
                json_encode($input['vpns'] ?? []),
                json_encode($input['urls'] ?? []),
                $input['notes'] ?? null,
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
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
