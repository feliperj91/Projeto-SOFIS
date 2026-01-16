<?php
// api/users.php
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            // Return sensitive info (hash) only if needed, usually we hide it.
            $stmt = $pdo->query('SELECT id, username, full_name, role, permissions, is_active, force_password_reset, created_at FROM users ORDER BY username ASC');
            $users = $stmt->fetchAll();
            // Decode JSON permissions for frontend use
            foreach ($users as &$u) {
                $u['permissions'] = json_decode($u['permissions']);
            }
            echo json_encode($users);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao listar usuários: ' . $e->getMessage()]);
        }
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
        
        $sql = "INSERT INTO users (username, full_name, password_hash, role, permissions, is_active, force_password_reset) VALUES (?, ?, ?, ?, ?, TRUE, TRUE)";
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['username'],
                $input['full_name'],
                $passwordHash,
                $input['role'] ?? 'TECNICO',
                (!empty($input['permissions']) ? json_encode($input['permissions']) : 
                    (function($pdo, $role) {
                        try {
                            // Fetch granular permissions (Schema A)
                            $stmt = $pdo->prepare("SELECT module, can_view, can_create, can_edit, can_delete FROM role_permissions WHERE role_name = ?");
                            $stmt->execute([$role]);
                            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                            
                            $perms = [];
                            foreach($rows as $r) {
                                $perms[$r['module']] = [
                                    'can_view' => $r['can_view'],
                                    'can_create' => $r['can_create'],
                                    'can_edit' => $r['can_edit'],
                                    'can_delete' => $r['can_delete']
                                ];
                            }
                            return empty($perms) ? '{}' : json_encode($perms);
                        } catch(Exception $e) { return '{}'; }
                    })($pdo, $input['role'] ?? 'TECNICO')
                )
            ]);
            
            // Try to get ID, but if it fails (e.g. no sequence), just return success since execute worked
            try {
                $newId = $pdo->lastInsertId();
            } catch (Exception $e) {
                $newId = null;
            }
            
            echo json_encode(['success' => true, 'id' => $newId]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23505) { // Unique violation (Postgres)
                http_response_code(409);
                echo json_encode(['error' => 'Username already exists']);
            } else {
                http_response_code(500);
                // Fix typo JSON_encode -> json_encode
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
            $sql = "UPDATE users SET full_name = ?, role = ?, permissions = ?, is_active = ?, force_password_reset = ?, password_hash = ? WHERE id = ?";
            $params = [
                $input['full_name'],
                $input['role'],
                json_encode($input['permissions'] ?? new stdClass()),
                isset($input['is_active']) ? (bool)$input['is_active'] : true,
                isset($input['force_password_reset']) ? (bool)$input['force_password_reset'] : false,
                $passwordHash,
                $_GET['id']
            ];
        } else {
            $sql = "UPDATE users SET full_name = ?, role = ?, permissions = ?, is_active = ?, force_password_reset = ? WHERE id = ?";
            $params = [
                $input['full_name'],
                $input['role'],
                json_encode($input['permissions'] ?? new stdClass()),
                isset($input['is_active']) ? (bool)$input['is_active'] : true,
                isset($input['force_password_reset']) ? (bool)$input['force_password_reset'] : false,
                $_GET['id']
            ];
        }

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao atualizar usuário: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID missing']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao excluir usuário: ' . $e->getMessage()]);
        }
        break;
}
?>
