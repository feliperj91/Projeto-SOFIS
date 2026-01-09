<?php
// api/users.php
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Return sensitive info (hash) only if needed, usually we hide it.
        $stmt = $pdo->query('SELECT id, username, full_name, role, permissions, created_at FROM users ORDER BY username ASC');
        $users = $stmt->fetchAll();
        // Decode JSON permissions for frontend use
        foreach ($users as &$u) {
            $u['permissions'] = json_decode($u['permissions']);
        }
        echo json_encode($users);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Basic Validation
        if (empty($input['username']) || empty($input['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Username and Password required']);
            exit;
        }

        $passwordHash = password_hash($input['password'], PASSWORD_BCRYPT);
        
        $sql = "INSERT INTO users (username, full_name, password_hash, role, permissions) VALUES (?, ?, ?, ?, ?)";
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['username'],
                $input['full_name'],
                $passwordHash,
                $input['role'] ?? 'TECNICO',
                json_encode($input['permissions'] ?? new stdClass())
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23505) { // Unique violation (Postgres)
                http_response_code(409);
                echo json_encode(['error' => 'Username already exists']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID missing']);
            exit;
        }

        // Check if password update is requested
        if (!empty($input['password'])) {
            $passwordHash = password_hash($input['password'], PASSWORD_BCRYPT);
            $sql = "UPDATE users SET full_name = ?, role = ?, permissions = ?, password_hash = ? WHERE id = ?";
            $params = [
                $input['full_name'],
                $input['role'],
                json_encode($input['permissions'] ?? new stdClass()),
                $passwordHash,
                $_GET['id']
            ];
        } else {
            $sql = "UPDATE users SET full_name = ?, role = ?, permissions = ? WHERE id = ?";
            $params = [
                $input['full_name'],
                $input['role'],
                json_encode($input['permissions'] ?? new stdClass()),
                $_GET['id']
            ];
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID missing']);
            exit;
        }
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode(['success' => true]);
        break;
}
?>
