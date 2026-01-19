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
        if (empty($input['username'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Username required']);
            exit;
        }

        $passwordHash = !empty($input['password']) 
            ? password_hash($input['password'], PASSWORD_BCRYPT) 
            : 'RESET_PENDING';
        
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

        // Dynamic Update Builder (Partial Update)
        $fields = [];
        $params = [];

        if (isset($input['full_name'])) {
            $fields[] = "full_name = ?";
            $params[] = $input['full_name'];
        }
        if (isset($input['role'])) {
            $fields[] = "role = ?";
            $params[] = $input['role'];
        }
        if (isset($input['permissions'])) {
            $fields[] = "permissions = ?";
            $params[] = json_encode($input['permissions']);
        }
        if (isset($input['is_active'])) {
            $fields[] = "is_active = ?";
            $params[] = $input['is_active'] ? 'true' : 'false';
        }
        if (isset($input['force_password_reset'])) {
            $fields[] = "force_password_reset = ?";
            $params[] = $input['force_password_reset'] ? 'true' : 'false';
        }
        if (isset($input['set_reset_mode']) && $input['set_reset_mode'] === true) {
            $fields[] = "password_hash = ?";
            $params[] = 'RESET_PENDING';
            $fields[] = "force_password_reset = ?";
            $params[] = 'true';
        } elseif (!empty($input['password'])) {
            $fields[] = "password_hash = ?";
            $params[] = password_hash($input['password'], PASSWORD_BCRYPT);
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit;
        }

        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
        $params[] = $_GET['id'];

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Se o cargo (role) foi alterado, sincronizar as permissões automaticamente
            if (isset($input['role']) && !isset($input['permissions'])) {
                $syncStmt = $pdo->prepare("
                    UPDATE users 
                    SET permissions = (
                        SELECT json_object_agg(
                            module,
                            json_build_object(
                                'can_view', can_view,
                                'can_create', can_create,
                                'can_edit', can_edit,
                                'can_delete', can_delete
                            )
                        )::text
                        FROM role_permissions
                        WHERE role_name = :role
                    )
                    WHERE id = :id
                ");
                $syncStmt->execute([
                    'role' => $input['role'],
                    'id' => $_GET['id']
                ]);
            }

            $pdo->commit();
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            $pdo->rollBack();
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
