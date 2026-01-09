<?php
// api/favorites.php
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        // list favorites for a user
        $username = $_GET['username'] ?? '';
        if (!$username) {
            http_response_code(400);
            echo json_encode(['error' => 'Username required']);
            exit;
        }
        $stmt = $pdo->prepare("SELECT client_id FROM user_favorites WHERE username = ?");
        $stmt->execute([$username]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_COLUMN)); // Return array of client_ids
        break;

    case 'POST':
        // Add favorite
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['username']) || empty($input['client_id'])) {
             http_response_code(400);
             echo json_encode(['error' => 'Missing params']);
             exit;
        }

        $sql = "INSERT INTO user_favorites (username, client_id) VALUES (?, ?) ON CONFLICT DO NOTHING";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$input['username'], $input['client_id']]);
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        // Remove favorite
        // We can accept query params or body. DELETE with body is unusual but possible.
        // Let's use query params for simplicity: ?username=...&client_id=...
        $username = $_GET['username'] ?? '';
        $clientId = $_GET['client_id'] ?? '';
        
        if (!$username || !$clientId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing params']);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM user_favorites WHERE username = ? AND client_id = ?");
        $stmt->execute([$username, $clientId]);
        echo json_encode(['success' => true]);
        break;
}
?>
