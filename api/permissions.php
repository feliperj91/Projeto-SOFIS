<?php
// api/permissions.php
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $role = $_GET['role'] ?? null;
    if (!$role) {
        http_response_code(400);
        echo json_encode(['error' => 'Role name is required']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM role_permissions WHERE role_name = ?");
    $stmt->execute([$role]);
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'POST') {
    // Bulk upsert/update
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Input should be an array of permission objects
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid input']);
        exit;
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete) 
                               VALUES (?, ?, ?, ?, ?, ?) 
                               ON CONFLICT (role_name, module) 
                               DO UPDATE SET can_view = EXCLUDED.can_view, can_create = EXCLUDED.can_create, can_edit = EXCLUDED.can_edit, can_delete = EXCLUDED.can_delete");
        
        $affectedRoles = [];
        foreach ($input as $perm) {
            $stmt->execute([
                $perm['role_name'],
                $perm['module'],
                $perm['can_view'] ? 't' : 'f',
                $perm['can_create'] ? 't' : 'f',
                $perm['can_edit'] ? 't' : 'f',
                $perm['can_delete'] ? 't' : 'f'
            ]);
            // Track which roles were affected
            if (!in_array($perm['role_name'], $affectedRoles)) {
                $affectedRoles[] = $perm['role_name'];
            }
        }
        
        // Sincronização definitiva: Atualiza TODOS os usuários que possuem um dos grupos afetados
        foreach ($affectedRoles as $role) {
            $syncStmt = $pdo->prepare("
                UPDATE users u
                SET permissions = (
                    SELECT COALESCE(
                        json_object_agg(
                            module,
                            json_build_object(
                                'can_view', can_view,
                                'can_create', can_create,
                                'can_edit', can_edit,
                                'can_delete', can_delete
                            )
                        ),
                        '{}'::json
                    )
                    FROM (
                        SELECT 
                            module,
                            bool_or(can_view) as can_view,
                            bool_or(can_create) as can_create,
                            bool_or(can_edit) as can_edit,
                            bool_or(can_delete) as can_delete
                        FROM role_permissions
                        WHERE UPPER(role_name) = ANY(SELECT UPPER(r) FROM unnest(u.roles) AS r)
                        GROUP BY module
                    ) AS agg_perms
                )
                WHERE UPPER(:role) = ANY(SELECT UPPER(r) FROM unnest(u.roles) AS r)
            ");
            $syncStmt->execute(['role' => $role]);
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'synced_roles' => $affectedRoles]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
